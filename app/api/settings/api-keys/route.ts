import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createHash } from "crypto";

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
      .from("user_api_keys")
      .select("id, name, key_prefix, permissions, last_used_at, expires_at, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching API keys:", error);
      return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in GET /api/settings/api-keys:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, permissions } = body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Generate a unique API key
    const keyPrefix = permissions.includes('write') ? 'ak_live' : 'ak_test';
    const keyBody = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const fullKey = `${keyPrefix}_${keyBody}`;
    const keyHash = createHash('sha256').update(fullKey).digest('hex');

    const newKeyData = {
      user_id: user.id,
      name: name.trim(),
      key_prefix: keyPrefix,
      key_hash: keyHash,
      permissions: JSON.stringify(permissions),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("user_api_keys")
      .insert(newKeyData)
      .select()
      .single();

    if (error) {
      console.error("Error creating API key:", error);
      return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
    }

    // Return the data with the full key for display (one time only)
    const result = { ...data, full_key: fullKey };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/settings/api-keys:", error);
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
    const keyId = searchParams.get('keyId');

    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("user_api_keys")
      .delete()
      .eq("id", keyId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting API key:", error);
      return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/settings/api-keys:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}