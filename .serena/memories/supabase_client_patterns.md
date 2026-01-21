# Supabase Client Patterns - CRITICAL

## Two Client Types Pattern

The codebase uses TWO types of Supabase clients deliberately:

### 1. Typed Client (`createClient()`)
**Used for READ operations only** (SELECT queries)

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('inventory_levels').select('*')
```

Returns: `SupabaseClient<Database>` with full TypeScript inference

### 2. Untyped Client (`createUntypedClient()`)
**Used for WRITE operations** (INSERT, UPDATE, DELETE)

```typescript
import { createUntypedClient } from '@/lib/supabase/client'

const untypedSupabase = createUntypedClient()
const { data } = await untypedSupabase.from('inventory_transactions').insert(transaction)
```

Returns: Plain `SupabaseClient` without generic type parameter

**Why?** Supabase's TypeScript types for mutations can be overly strict and cause type errors with computed values, partial updates, or complex joins.

## Server vs. Client Context

### Browser Client (`lib/supabase/client.ts`)
- For client components (`'use client'`)
- Use for client-side data fetching and mutations
- Both typed and untyped clients available

### Server Client (`lib/supabase/server.ts`)
- For server components and server actions
- Includes cookie handling for SSR
- Use for server-side data fetching

## Data Access Layer

All database queries centralized in `lib/supabase/`:
- `inventory.ts` - Inventory queries
- `categories.ts` - Category operations
- `bags-of-hope.ts` - Bag fulfillment functions
- `batches.ts` - Shipping batch operations
- `journal-entries.ts` - Accounting queries

Components should import and use these functions rather than making direct Supabase calls.
