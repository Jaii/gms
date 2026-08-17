import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { clientEnv, isSupabaseConfigured } from './env'

export type GmsSupabaseClient = SupabaseClient<Database>

let cachedClient: GmsSupabaseClient | null = null

export function getSupabaseClient(): GmsSupabaseClient | null {
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
