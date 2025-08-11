import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createSupabaseBrowserClient() {
    if (typeof window === 'undefined') {
        return null
    }
    
    if (supabaseClient) {
        return supabaseClient
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
        if (process.env.NODE_ENV === 'development') {
            return null
        }
        throw new Error('Supabase URL and Anon Key are required')
    }
    
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return supabaseClient
}