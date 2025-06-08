import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@supabase/supabase-js'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  username?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  privacy_analytics: boolean
  privacy_cookies: boolean
  privacy_tracking: boolean
  appearance_compact: boolean
  appearance_animations: boolean
  appearance_sound: boolean
}

interface UserState {
  user: User | null
  preferences: UserPreferences
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => Promise<void>
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>
  fetchUser: () => Promise<void>
  fetchPreferences: () => Promise<void>
  signOut: () => Promise<void>
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  email_notifications: true,
  push_notifications: true,
  marketing_emails: false,
  privacy_analytics: true,
  privacy_cookies: true,
  privacy_tracking: false,
  appearance_compact: false,
  appearance_animations: true,
  appearance_sound: true,
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      preferences: defaultPreferences,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),

      updateUser: async (updates) => {
        const { user } = get()
        if (!user) return

        set({ isLoading: true, error: null })
        
        try {
          const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single()

          if (error) throw error

          set({ user: data, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      updatePreferences: async (updates) => {
        const { user, preferences } = get()
        if (!user) return

        const newPreferences = { ...preferences, ...updates }
        set({ isLoading: true, error: null, preferences: newPreferences })

        try {
          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              ...newPreferences
            })

          if (error) throw error

          set({ isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      fetchUser: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          
          if (!authUser) {
            set({ user: null, isLoading: false })
            return
          }

          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (error) throw error

          set({ user: data, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      fetchPreferences: async () => {
        const { user } = get()
        if (!user) return

        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (error && error.code !== 'PGRST116') throw error

          if (data) {
            set({ preferences: { ...defaultPreferences, ...data } })
          }
        } catch (error) {
          console.error('Error fetching preferences:', error)
        }
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, preferences: defaultPreferences })
      },
    }),
    {
      name: 'user-store',
      partialize: (state) => ({ 
        user: state.user, 
        preferences: state.preferences 
      }),
    }
  )
)