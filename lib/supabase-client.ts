import { createClient } from '@supabase/supabase-js'

export function createBrowserClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
        // Return null in development when Supabase is not configured
        if (process.env.NODE_ENV === 'development') {
            return null
        }
        throw new Error('Supabase URL and Anon Key are required')
    }
    
    return createClient(supabaseUrl, supabaseAnonKey)
}
