import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { GitHubIntegration } from "@/lib/github-integration"

export async function GET(request: NextRequest) {
  const requestId = `github_repos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
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

    const githubToken = user.user_metadata?.github_access_token
    
    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub not connected" },
        { status: 400 }
      )
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const per_page = parseInt(url.searchParams.get('per_page') || '30')

    const github = new GitHubIntegration(githubToken)
    const repositories = await github.getRepositories(page, per_page)
    const githubUser = await github.getUser()

    return NextResponse.json({
      repositories,
      user: githubUser,
      pagination: {
        page,
        per_page,
        total: repositories.length
      },
      requestId
    })

  } catch (error) {
    console.error(`[GitHub Repositories API ${requestId}] Error:`, error)
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    )
  }
}