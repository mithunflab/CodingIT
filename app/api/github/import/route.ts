import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { GitHubIntegration } from "@/lib/github-integration"
import { ProjectAnalyzer } from "@/lib/project-analyzer"

export async function POST(request: NextRequest) {
  const requestId = `github_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const { owner, repo, maxFiles = 50 } = await request.json()
    
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Repository owner and name are required" },
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

    const githubToken = user.user_metadata?.github_access_token
    
    if (!githubToken) {
      return NextResponse.json(
        { error: "GitHub not connected" },
        { status: 400 }
      )
    }

    console.log(`[GitHub Import API ${requestId}] Importing repository: ${owner}/${repo}`)

    const github = new GitHubIntegration(githubToken)
    const files = await github.downloadRepository(owner, repo, maxFiles)
    
    if (files.length === 0) {
      return NextResponse.json(
        { error: "No importable files found in repository" },
        { status: 400 }
      )
    }

    // Convert to File objects for analysis
    const fileObjects = files.map(file => {
      const blob = new Blob([file.content], { type: 'text/plain' })
      return new File([blob], file.name)
    })

    // Analyze the project
    const analyzer = new ProjectAnalyzer()
    const result = await analyzer.analyzeProject(fileObjects)

    // Enhance the analysis structure with file contents for easier access
    const enhancedStructure = {
      ...result.structure,
      files: result.structure.files.map(file => {
        const originalFile = files.find(f => f.name === file.name)
        return {
          ...file,
          content: originalFile?.content || ''
        }
      })
    }

    console.log(`[GitHub Import API ${requestId}] Import completed: ${files.length} files analyzed`)

    return NextResponse.json({
      success: true,
      repository: { owner, repo },
      analysis: {
        ...result,
        structure: enhancedStructure
      },
      requestId
    })

  } catch (error) {
    console.error(`[GitHub Import API ${requestId}] Error:`, error)
    
    let errorMessage = "Failed to import repository"
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes("404")) {
        errorMessage = "Repository not found or access denied"
        statusCode = 404
      } else if (error.message.includes("403")) {
        errorMessage = "Access denied to repository"
        statusCode = 403
      } else if (error.message.includes("rate limit")) {
        errorMessage = "GitHub API rate limit exceeded"
        statusCode = 429
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}