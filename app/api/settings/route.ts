import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const createSupabaseClient = async () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return (await cookieStore).get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            (await cookieStore).set(name, value, options);
          } catch (error) {
            console.warn(`Failed to set cookie '${name}':`, error);
          }
        },
        async remove(name: string) {
          try {
            (await cookieStore).delete(name);
          } catch (error) {
            console.warn(`Failed to delete cookie '${name}':`, error);
          }
        },
      },
    }
  );
};

export async function GET() {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return defaults
        const defaultSettings = {
          user_id: user.id,
          theme: "system",
          language: "en",
          timezone: "UTC",
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
        };

        // Create default settings
        const { data: newSettings, error: createError } = await supabase
          .from("user_settings")
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          console.error("Error creating default settings:", createError);
          return NextResponse.json(defaultSettings);
        }

        return NextResponse.json(newSettings);
      }
      console.error("Error fetching settings:", error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { user_id, id, created_at, ...updateData } = body;
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("user_settings")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating settings:", error);
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}