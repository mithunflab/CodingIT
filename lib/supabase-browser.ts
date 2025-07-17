import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createSupabaseBrowserClient() {
    // Only create client on the client side
    if (typeof window === 'undefined') {
        return null
    }
    
    // Return existing client if it exists
    if (supabaseClient) {
        return supabaseClient
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
        // Return null in development when Supabase is not configured
        if (process.env.NODE_ENV === 'development') {
            return null
        }
        throw new Error('Supabase URL and Anon Key are required')
    }
    
    // Create and cache the client using SSR-compatible client
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return supabaseClient
}