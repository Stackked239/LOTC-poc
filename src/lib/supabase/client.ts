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
