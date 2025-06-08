import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const requestId = `github_auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      )
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      return NextResponse.json(
        { error: "Failed to obtain access token" },
        { status: 400 }
      )
    }

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

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      )
    }

    // Store GitHub token in user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: { 
        github_access_token: tokenData.access_token,
        github_connected: true,
        github_connected_at: new Date().toISOString()
      }
    })

    if (updateError) {
      console.error('Failed to store GitHub token:', updateError)
      return NextResponse.json(
        { error: "Failed to store GitHub credentials" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      requestId 
    })

  } catch (error) {
    console.error(`[GitHub Auth API ${requestId}] Error:`, error)
    return NextResponse.json(
      { error: "Failed to authenticate with GitHub" },
      { status: 500 }
    )
  }
}