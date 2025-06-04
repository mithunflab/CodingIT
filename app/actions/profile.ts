"use server"

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// Matches the ProfileFormData in app/settings/profile/page.tsx and Supabase table
export interface ProfileData {
  id?: string // User ID from auth.users
  first_name: string | null
  last_name: string | null
  company: string | null
  job_title: string | null
  location: string | null
  timezone: string | null
  bio: string | null
  work_description: string | null
  preferences: string | null
  personalized_responses: boolean
  activity_status: boolean
  profile_visibility: "public" | "private" | "contacts"
  avatar_url?: string | null // For profile picture
// email will be fetched from auth.user if needed, not stored directly here for update
}

export async function getProfile(): Promise<ProfileData | null> {
  const cookieStorePromise = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookieStorePromise
          return cookieStore.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await cookieStorePromise
            cookieStore.set(name, value, options)
          } catch (error) {
            // If the set method is called from a Server Component, an error may occur.
            // This can be ignored if you have middleware refreshing user sessions.
            console.warn(`Failed to set cookie '${name}' from Server Action/Component. This might be okay if middleware handles session refresh. Error: ${error}`);
          }
        },
        async remove(name: string = "supabase-auth-token") {
          try {
            const cookieStore = await cookieStorePromise
            cookieStore.delete(name)
          } catch (error) {
            // If the delete method is called from a Server Component, an error may occur.
            // This can be ignored if you have middleware refreshing user sessions.
            console.warn(`Failed to delete cookie '${name}' from Server Action/Component. This might be okay if middleware handles session refresh. Error: ${error}`);
          }
        },
      },
    }
  )

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("No user found, cannot fetch profile.")
      return null
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // PGRST116: "Searched for a single row, but 0 rows were found"
        console.log("No profile found for user, returning defaults or null.")
        // You might want to return a default profile structure or ensure one is created on user signup
        return {
          id: user.id,
          first_name: "",
          last_name: "",
          company: null,
          job_title: null,
          location: null,
          timezone: null,
          bio: null,
          work_description: null,
          preferences: null,
          personalized_responses: true,
          activity_status: true,
          profile_visibility: "private",
          avatar_url: null,
        }
      }
      console.error("Error fetching profile:", error)
      throw error
    }
    
    return data as ProfileData
  } catch (error) {
    console.error("Error in getProfile:", error)
    return null
  }
}

export async function updateProfile(
  profileData: Partial<ProfileData>
): Promise<{ success: boolean; error?: any }> {
  const cookieStore = cookies()
  const supabase = createServerClient(
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
            console.warn(`Failed to set cookie '${name}' from Server Action/Component. This might be okay if middleware handles session refresh. Error: ${error}`);
          }
        },
        remove(name: string) {
          try {
          } catch (error) {
            console.warn(`Failed to delete cookie '${name}' from Server Action/Component. This might be okay if middleware handles session refresh. Error: ${error}`);
          }
        },
      },
    }
  )

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("User not authenticated for profile update.")
      return { success: false, error: "User not authenticated" }
    }

    // Ensure 'id' is not part of the update payload to Supabase,
    // as it's used in the .eq() clause and is the primary key.
    // 'updated_at' will be handled by the database trigger.
    const { id, ...updateData } = profileData

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)

    if (error) {
      console.error("Error updating profile:", error)
      return { success: false, error }
    }

    revalidatePath("/settings/profile") // Revalidate the profile page to show updated data
    revalidatePath("/") // Revalidate other paths if profile info is displayed elsewhere
    return { success: true }
  } catch (error) {
    console.error("Error in updateProfile:", error)
    return { success: false, error }
  }
}
