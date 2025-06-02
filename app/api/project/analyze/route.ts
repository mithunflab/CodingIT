import { type NextRequest, NextResponse } from "next/server"
import { ProjectAnalyzer } from "@/lib/project-analyzer"

export async function POST(request: NextRequest) {
  const requestId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  console.log(`[Project Analysis API ${requestId}] Processing request`)

  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          error: "No files provided for analysis",
          code: "NO_FILES",
          requestId,
        },
        { status: 400 }
      )
    }

    // Validate files
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    const maxTotalSize = 50 * 1024 * 1024 // 50MB
    const maxFiles = 20

    if (files.length > maxFiles) {
      return NextResponse.json(
        {
          error: `Too many files. Maximum ${maxFiles} files allowed`,
          code: "TOO_MANY_FILES",
          requestId,
        },
        { status: 400 }
      )
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0)
    if (totalSize > maxTotalSize) {
      return NextResponse.json(
        {
          error: `Total file size too large. Maximum ${maxTotalSize / 1024 / 1024}MB allowed`,
          code: "SIZE_LIMIT_EXCEEDED",
          requestId,
        },
        { status: 400 }
      )
    }

    const oversizedFiles = files.filter(file => file.size > maxFileSize)
    if (oversizedFiles.length > 0) {
      return NextResponse.json(
        {
          error: `Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum ${maxFileSize / 1024 / 1024}MB per file`,
          code: "FILE_TOO_LARGE",
          requestId,
        },
        { status: 400 }
      )
    }

    console.log(`[Project Analysis API ${requestId}] Analyzing ${files.length} files`)

    const analyzer = new ProjectAnalyzer()
    const analysis = await analyzer.analyzeProject(files)

    console.log(`[Project Analysis API ${requestId}] Analysis completed successfully`)

    return NextResponse.json({
      success: true,
      requestId,
      analysis,
      metadata: {
        filesAnalyzed: files.length,
        totalSize: totalSize,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error(`[Project Analysis API ${requestId}] Analysis failed:`, error)
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    let errorCode = "ANALYSIS_ERROR"
    
    if (errorMessage.includes("timeout")) {
      errorCode = "ANALYSIS_TIMEOUT"
    } else if (errorMessage.includes("memory")) {
      errorCode = "MEMORY_LIMIT"
    }

    return NextResponse.json(
      {
        error: "Failed to analyze project files",
        code: errorCode,
        details: errorMessage,
        requestId,
      },
      { status: 500 }
    )
  }
}
