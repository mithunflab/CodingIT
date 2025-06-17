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
      .from("user_integrations")
      .select("id, provider, provider_id, provider_username, permissions, last_sync_at, connected_at, updated_at")
      .eq("user_id", user.id)
      .order("connected_at", { ascending: false });

    if (error) {
      console.error("Error fetching integrations:", error);
      return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in GET /api/settings/integrations:", error);
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
    const { integrationId, updates } = body;

    if (!integrationId || !updates) {
      return NextResponse.json({ error: "Integration ID and updates are required" }, { status: 400 });
    }

    const { user_id, id, connected_at, ...updateData } = updates;
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("user_integrations")
      .update(updateData)
      .eq("id", integrationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating integration:", error);
      return NextResponse.json({ error: "Failed to update integration" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/settings/integrations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');

    if (!integrationId) {
      return NextResponse.json({ error: "Integration ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_integrations")
      .delete()
      .eq("id", integrationId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting integration:", error);
      return NextResponse.json({ error: "Failed to delete integration" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/settings/integrations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}