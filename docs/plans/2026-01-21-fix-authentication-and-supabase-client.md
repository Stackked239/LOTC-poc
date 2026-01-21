# Fix Authentication and Supabase Client Issues Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve 401 authentication errors and multiple Supabase client instances causing intake form failures.

**Architecture:** Implement authentication provider with session management, refactor Supabase client to use singleton pattern, and add auth state checks before API calls.

**Tech Stack:** Next.js 16, Supabase Auth (@supabase/ssr), React Context API, TypeScript

---

## Root Cause Analysis

**Errors Identified:**
1. **401 Unauthorized** - No authenticated user session exists
2. **Multiple GoTrueClient instances** - Creating new Supabase clients on every function call
3. **Transaction errors** - RLS policies require authenticated user

**Core Issues:**
- No authentication UI or flow implemented
- `createClient()` and `createUntypedClient()` create new instances each call
- No session persistence or auth state management

---

## Task 1: Create Singleton Supabase Client

**Files:**
- Modify: `src/lib/supabase/client.ts:1-30`

**Step 1: Refactor to use singleton pattern**

Replace the entire file with:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Singleton instances
let typedClientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null
let untypedClientInstance: ReturnType<typeof createBrowserClient> | null = null

// Typed client for queries (read operations)
export function createClient() {
  if (!typedClientInstance) {
    typedClientInstance = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return typedClientInstance
}

// Untyped client for mutations where types are complex
export function createUntypedClient() {
  if (!untypedClientInstance) {
    untypedClientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return untypedClientInstance
}

// Alias for backward compatibility
export const getClient = createClient
```

**Step 2: Verify no TypeScript errors**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add src/lib/supabase/client.ts
git commit -m "refactor: implement singleton pattern for Supabase clients"
```

---

## Task 2: Create Authentication Context Provider

**Files:**
- Create: `src/lib/contexts/AuthContext.tsx`

**Step 1: Create auth context with session management**

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/lib/contexts/AuthContext.tsx
git commit -m "feat: add authentication context provider"
```

---

## Task 3: Integrate Auth Provider in Layout

**Files:**
- Modify: `src/app/layout.tsx:1-45`

**Step 1: Import and wrap with AuthProvider**

```typescript
import type { Metadata } from "next"
import { Poppins, JetBrains_Mono, Bebas_Neue } from "next/font/google"
import "./globals.css"
import { AppLayout } from "@/components/layout/AppLayout"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/contexts/AuthContext"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
})

const bebasNeue = Bebas_Neue({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["400"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "LOTC Inventory Management",
  description: "Inventory management system for Least of These Carolinas - tracking Bags of Hope donations and supplies",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${bebasNeue.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Step 2: Test in browser**

Run: Navigate to http://localhost:3000
Expected: App loads without console errors about multiple clients

**Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: integrate auth provider in root layout"
```

---

## Task 4: Create Simple Auth UI Component

**Files:**
- Create: `src/components/auth/AuthButton.tsx`

**Step 1: Create auth button component**

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { LogIn, LogOut, User } from 'lucide-react'

export function AuthButton() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
            },
          },
        })
        if (error) throw error
        toast.success('Account created! Please sign in.')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        toast.success('Signed in successfully!')
        setOpen(false)
        setEmail('')
        setPassword('')
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error: any) {
      toast.error('Failed to sign out')
    }
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{user.email}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSignUp ? 'Create Account' : 'Sign In'}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? 'Create an account to manage inventory'
              : 'Sign in to access the inventory system'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/auth/AuthButton.tsx
git commit -m "feat: add authentication button component"
```

---

## Task 5: Add Auth Button to Navbar

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

**Step 1: Read current Navbar implementation**

Run: Read the file to understand current structure

**Step 2: Add AuthButton to Navbar**

Import at top:
```typescript
import { AuthButton } from '@/components/auth/AuthButton'
```

Add in the header/navbar JSX (typically in the right side):
```typescript
<div className="flex items-center gap-4">
  <AuthButton />
  {/* existing navbar items */}
</div>
```

**Step 3: Test in browser**

Navigate to: http://localhost:3000
Expected: "Sign In" button appears in navbar

**Step 4: Commit**

```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat: add auth button to navbar"
```

---

## Task 6: Add Auth Guard to Intake Form

**Files:**
- Modify: `src/components/forms/IntakeForm.tsx:31-169`

**Step 1: Add auth check at component start**

After imports, add:
```typescript
import { useAuth } from '@/lib/contexts/AuthContext'
```

At the start of component function:
```typescript
export function IntakeForm() {
  const { user, loading: authLoading } = useAuth()

  // ... existing state declarations
```

**Step 2: Add auth loading state**

Before the existing loading check, add:
```typescript
if (authLoading) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </CardContent>
    </Card>
  )
}

if (!user) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <p className="text-lg font-semibold mb-2">Authentication Required</p>
          <p className="text-muted-foreground mb-4">
            Please sign in to log inventory intake
          </p>
          <p className="text-sm text-muted-foreground">
            Look for the "Sign In" button in the top navigation
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 3: Test auth flow**

1. Navigate to http://localhost:3000/intake (not signed in)
   Expected: "Authentication Required" message
2. Click "Sign In" in navbar
3. Sign up with test email
4. Check intake page again
   Expected: Form loads normally

**Step 4: Commit**

```bash
git add src/components/forms/IntakeForm.tsx
git commit -m "feat: add auth guard to intake form"
```

---

## Task 7: Apply Database RLS Fix

**Files:**
- Execute: `apply-intake-fix-v2.sql` in Supabase

**Step 1: Open Supabase SQL Editor**

Navigate to: https://supabase.com/dashboard/project/yzomcvqfdrqhmcuribhv/sql

**Step 2: Run the SQL fix**

Copy entire contents of `apply-intake-fix-v2.sql` and execute

Expected output:
```
DROP POLICY
CREATE POLICY
CREATE FUNCTION
CREATE TRIGGER
INSERT 0 1 (or more)
```

**Step 3: Verify with query**

Run:
```sql
SELECT COUNT(*) as total_users, COUNT(sp.id) as users_with_profiles
FROM auth.users u
LEFT JOIN staff_profiles sp ON u.id = sp.id;
```

Expected: `total_users` equals `users_with_profiles`

**Step 4: Document completion**

```bash
echo "Database RLS policies updated successfully" >> docs/deployment-log.md
git add docs/deployment-log.md
git commit -m "docs: record RLS policy update"
```

---

## Task 8: End-to-End Testing

**Files:**
- Test: Full intake workflow

**Step 1: Clear browser cache and refresh**

- Open DevTools (F12)
- Right-click refresh → "Empty Cache and Hard Reload"
- Close and reopen DevTools

**Step 2: Test unauthenticated state**

1. Navigate to http://localhost:3000/intake
2. Verify "Authentication Required" message shown
3. Check console: No 401 errors yet
4. Check console: No multiple client warnings

Expected: Clean console, auth message displayed

**Step 3: Test sign-up flow**

1. Click "Sign In" button in navbar
2. Click "Don't have an account? Sign up"
3. Enter email: `test@example.com`
4. Enter password: `test123456`
5. Click "Sign Up"

Expected: Success toast appears

**Step 4: Test sign-in flow**

1. Click "Sign In" again
2. Enter same credentials
3. Click "Sign In"

Expected:
- Success toast
- User email displayed in navbar
- "Sign Out" button appears

**Step 5: Test intake form (authenticated)**

1. Navigate to http://localhost:3000/intake
2. Verify form loads (no auth message)
3. Select category: "Baby Boy Tops"
4. Keep quantity: 1
5. Condition: New
6. Source: Donation
7. Click "Log Intake"

Expected:
- Success toast: "Added 1 Baby Boy Tops"
- No 401 errors in console
- No multiple client warnings
- Session summary updates

**Step 6: Verify in dashboard**

1. Navigate to http://localhost:3000
2. Check inventory table
3. Verify "Baby Boy Tops" shows quantity updated

Expected: Dashboard reflects the intake transaction

**Step 7: Test sign-out**

1. Click "Sign Out" in navbar
2. Verify redirect or state change
3. Navigate to /intake
4. Verify auth required message again

Expected: Full auth lifecycle works

**Step 8: Final verification**

Open console and verify:
- ✅ No 401 errors
- ✅ No "Multiple GoTrueClient instances" warning
- ✅ No transaction errors
- ✅ Only informational messages (HMR, React DevTools)

**Step 9: Document test results**

Create `docs/test-results.md`:
```markdown
# Auth & Intake Testing Results

Date: 2026-01-21

## Tests Passed
- ✅ Singleton client (no multiple instances)
- ✅ Auth context provider
- ✅ Sign up flow
- ✅ Sign in flow
- ✅ Auth guard on intake form
- ✅ Intake transaction creation
- ✅ Sign out flow

## Console Status
- No 401 errors
- No client instance warnings
- Clean error console

## Verified Functionality
- Intake form works for authenticated users
- RLS policies enforced correctly
- Session persists across page navigation
```

**Step 10: Final commit**

```bash
git add docs/test-results.md
git commit -m "docs: add authentication testing results"
```

---

## Verification Checklist

After completing all tasks:

- [ ] No multiple GoTrueClient warnings in console
- [ ] No 401 authentication errors
- [ ] Sign in/sign up flow works
- [ ] Intake form requires authentication
- [ ] Authenticated users can log intake successfully
- [ ] Dashboard shows updated inventory
- [ ] Sign out works correctly
- [ ] Session persists on page refresh
- [ ] All TypeScript compilation passes
- [ ] All commits follow conventional commit format

---

## Rollback Plan

If issues occur:

1. **Revert client changes:**
   ```bash
   git revert HEAD~7..HEAD
   ```

2. **Restore original RLS policy:**
   ```sql
   DROP POLICY IF EXISTS "Authenticated users can create transactions" ON inventory_transactions;
   CREATE POLICY "Transactions can be created by authorized users" ON inventory_transactions
     FOR INSERT TO authenticated
     WITH CHECK (
       EXISTS (
         SELECT 1 FROM staff_profiles
         WHERE id = auth.uid() AND (can_intake = true OR can_pick = true)
       )
     );
   ```

---

## Notes

- Auth button uses Dialog component from shadcn/ui (already in project)
- Singleton pattern prevents multiple Supabase client instances
- Auth context provides centralized session management
- RLS policies now allow all authenticated users (can be tightened later)
- Staff profiles auto-created via trigger for new users
