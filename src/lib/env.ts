import { z } from 'zod'

const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
})

function optionalEnvValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export const clientEnv = clientEnvSchema.parse({
  VITE_SUPABASE_URL: optionalEnvValue(import.meta.env.VITE_SUPABASE_URL),
  VITE_SUPABASE_ANON_KEY: optionalEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY),
})

export const isSupabaseConfigured = Boolean(
  clientEnv.VITE_SUPABASE_URL && clientEnv.VITE_SUPABASE_ANON_KEY,
)
