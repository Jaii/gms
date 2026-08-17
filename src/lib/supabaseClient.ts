import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { clientEnv, isSupabaseConfigured } from './env'

let cachedClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null
  }

  cachedClient ??= createClient(
    clientEnv.VITE_SUPABASE_URL as string,
    clientEnv.VITE_SUPABASE_ANON_KEY as string,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  )

  return cachedClient
}
