import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const supabase = process.env.NEXT_PUBLIC_ENABLE_SUPABASE
  ? createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  : undefined

export const createClient = () => {
    if (!process.env.NEXT_PUBLIC_ENABLE_SUPABASE) {
        throw new Error("Supabase is not enabled. Please set NEXT_PUBLIC_ENABLE_SUPABASE to true in your environment variables.")
    }
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
}
