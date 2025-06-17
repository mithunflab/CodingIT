"use server"

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export interface UserSettings {
  id?: string
  user_id: string
  // Appearance settings
  theme: "light" | "dark" | "system"
  language: string
  timezone: string
  compact_mode: boolean
  animations_enabled: boolean
  sound_enabled: boolean
  
  // Privacy settings
  profile_visibility: "public" | "private" | "contacts"
  activity_status: boolean
  project_visibility: "public" | "private" | "contacts"
  analytics_enabled: boolean
  personalization_enabled: boolean
  third_party_sharing: boolean
  
  // Communication settings
  email_notifications: boolean
  marketing_communications: boolean
  community_communications: boolean
  security_alerts: boolean
  
  // Account settings
  two_factor_enabled: boolean
  session_timeout: number
  password_changed_at?: string
  
  created_at?: string
  updated_at?: string
}

export interface ApiKeyData {
  [x: string]: string | string[] | undefined
  id?: string
  user_id: string
  name: string
  key_prefix: string
  permissions: string[]
  last_used_at?: string
  expires_at?: string
  created_at?: string
  updated_at?: string
}

export interface IntegrationData {
  id?: string
  user_id: string
  provider: string
  provider_id: string
  provider_username?: string
  access_token?: string
  refresh_token?: string
  permissions: string[]
  last_sync_at?: string
  connected_at: string
  updated_at?: string
}

const createSupabaseClient = async () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            (await cookieStore).set(name, value, options)
          } catch (error) {
            console.warn(`Failed to set cookie '${name}':`, error)
          }
        },
        async remove(name: string) {
          try {
            (await cookieStore).delete(name)
          } catch (error) {
            console.warn(`Failed to delete cookie '${name}':`, error)
          }
        },
      },
    }
  )
}

export async function getUserSettings(): Promise<UserSettings | null> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log("No user found, cannot fetch settings.")
      return null
    }

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        const defaultSettings: UserSettings = {
          user_id: user.id,
          theme: "system",
          language: "en",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          compact_mode: false,
          animations_enabled: true,
          sound_enabled: true,
          profile_visibility: "private",
          activity_status: true,
          project_visibility: "private",
          analytics_enabled: true,
          personalization_enabled: true,
          third_party_sharing: false,
          email_notifications: true,
          marketing_communications: false,
          community_communications: true,
          security_alerts: true,
          two_factor_enabled: false,
          session_timeout: 30
        }
        
        // Create default settings in database
        const { data: newSettings, error: createError } = await supabase
          .from("user_settings")
          .insert(defaultSettings)
          .select()
          .single()

        if (createError) {
          console.error("Error creating default settings:", createError)
          return defaultSettings
        }

        return newSettings
      }
      console.error("Error fetching user settings:", error)
      throw error
    }
    
    return data as UserSettings
  } catch (error) {
    console.error("Error in getUserSettings:", error)
    return null
  }
}

export async function updateUserSettings(
  settingsData: Partial<UserSettings>
): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error("User not authenticated for settings update.")
      return { success: false, error: "User not authenticated" }
    }

    const { user_id, id, created_at, ...updateData } = settingsData
    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from("user_settings")
      .update(updateData)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error updating user settings:", error)
      return { success: false, error }
    }

    revalidatePath("/settings")
    return { success: true }
  } catch (error) {
    console.error("Error in updateUserSettings:", error)
    return { success: false, error }
  }
}

export async function getUserApiKeys(): Promise<ApiKeyData[]> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("user_api_keys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching API keys:", error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error("Error in getUserApiKeys:", error)
    return []
  }
}

export async function createApiKey(
  keyData: Omit<ApiKeyData, "id" | "user_id" | "created_at" | "updated_at">
): Promise<{ success: boolean; apiKey?: ApiKeyData; error?: any }> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const keyPrefix = keyData.permissions?.includes('write') ? 'ak_live' : 'ak_test'
    const keyBody = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    const fullKey = `${keyPrefix}_${keyBody}`

    const newKeyData = {
      ...keyData,
      user_id: user.id,
      key_prefix: keyPrefix,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("user_api_keys")
      .insert(newKeyData)
      .select()
      .single()

    if (error) {
      console.error("Error creating API key:", error)
      return { success: false, error }
    }

    // Return the data with the full key for display (one time only)
    const result = { ...data, full_key: fullKey }

    revalidatePath("/settings/api-keys")
    return { success: true, apiKey: result }
  } catch (error) {
    console.error("Error in createApiKey:", error)
    return { success: false, error }
  }
}

export async function deleteApiKey(
  keyId: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { error } = await supabase
      .from("user_api_keys")
      .delete()
      .eq("id", keyId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error deleting API key:", error)
      return { success: false, error }
    }

    revalidatePath("/settings/api-keys")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteApiKey:", error)
    return { success: false, error }
  }
}

export async function getUserIntegrations(): Promise<IntegrationData[]> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("user_integrations")
      .select("*")
      .eq("user_id", user.id)
      .order("connected_at", { ascending: false })

    if (error) {
      console.error("Error fetching integrations:", error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error("Error in getUserIntegrations:", error)
    return []
  }
}

export async function updateIntegration(
  integrationId: string,
  updates: Partial<IntegrationData>
): Promise<{ success: boolean; error?: any }> {
  try {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "User not authenticated" }
    }

    const { user_id, id, connected_at, ...updateData } = updates
    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from("user_integrations")
      .update(updateData)
      .eq("id", integrationId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error updating integration:", error)
      return { success: false, error }
    }

    revalidatePath("/settings/integrations")
    return { success: true }
  } catch (error) {
    console.error("Error in updateIntegration:", error)
    return { success: false, error }
  }
}