import { type NextRequest, NextResponse } from "next/server"
import { FigmaIntegration } from "@/lib/figma-integration"

export async function POST(request: NextRequest) {
  const requestId = `figma_${crypto.randomUUID()}`
  console.log(`[Figma Analysis API ${requestId}] Processing request`)

  try {
    const body = await request.json()
    const { figmaUrl } = body

    // Enhanced validation
    if (!figmaUrl || typeof figmaUrl !== 'string') {
      return NextResponse.json(
        {
          error: "Figma URL is required and must be a string",
          code: "INVALID_URL",
          requestId,
        },
        { status: 400 }
      )
    }

    if (!figmaUrl.includes("figma.com")) {
      return NextResponse.json(
        {
          error: "Invalid Figma URL provided",
          message: "Please provide a valid Figma file URL that includes 'figma.com'",
          code: "INVALID_FIGMA_URL",
          requestId,
        },
        { status: 400 }
      )
    }

    console.log(`[Figma Analysis API ${requestId}] Analyzing Figma URL: ${figmaUrl}`)

    const figmaIntegration = new FigmaIntegration()
    const fileId = figmaIntegration.extractFileId(figmaUrl)

    if (!fileId) {
      return NextResponse.json(
        {
          error: "Could not extract file ID from Figma URL",
          message: "Please check that your URL is in the format: https://www.figma.com/file/[FILE_ID]/[FILE_NAME]",
          code: "INVALID_FILE_ID",
          requestId,
        },
        { status: 400 }
      )
    }

    // Check if API key is available
    if (!process.env.FIGMA_API_KEY) {
      return NextResponse.json(
        {
          error: "Figma API key not configured",
          message: "Figma integration requires an API key to be configured on the server.",
          code: "API_KEY_MISSING",
          requestId,
        },
        { status: 500 }
      )
    }

    const figmaFile = await figmaIntegration.getFile(fileId)

    if (!figmaFile) {
      return NextResponse.json(
        {
          error: "Could not fetch Figma file",
          message: "Please check that the file exists, is publicly accessible, or that you have the correct permissions.",
          code: "FILE_NOT_ACCESSIBLE",
          requestId,
        },
        { status: 400 }
      )
    }

    console.log(`[Figma Analysis API ${requestId}] File fetched, generating analysis`)

    const analysis = figmaIntegration.analyzeDesign(figmaFile)
    const designTokens = figmaIntegration.extractDesignTokens(figmaFile)

    // Get main frame IDs for potential image export
    const mainFrames =
      figmaFile.document.children
        ?.filter((child) => child.type === "FRAME" && child.name !== "Cover")
        .map((frame) => frame.id) || []

    console.log(`[Figma Analysis API ${requestId}] Analysis completed successfully`)

    return NextResponse.json({
      success: true,
      requestId,
      analysis,
      designTokens,
      fileId,
      fileName: figmaFile.name,
      mainFrames,
      metadata: {
        schemaVersion: figmaFile.schemaVersion,
        componentCount: Object.keys(figmaFile.components || {}).length,
        styleCount: Object.keys(figmaFile.styles || {}).length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error(`[Figma Analysis API ${requestId}] Analysis failed:`, error)

    // Enhanced error handling with specific status codes
    let errorMessage = "Failed to analyze Figma design"
    let statusCode = 500
    let errorCode = "ANALYSIS_ERROR"

    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      
      if (message.includes("403") || message.includes("forbidden")) {
        errorMessage = "Access denied. Please check that your Figma file is publicly accessible or that your API key has the correct permissions."
        statusCode = 403
        errorCode = "ACCESS_DENIED"
      } else if (message.includes("404") || message.includes("not found")) {
        errorMessage = "Figma file not found. Please check that the file ID is correct and the file exists."
        statusCode = 404
        errorCode = "FILE_NOT_FOUND"
      } else if (message.includes("401") || message.includes("unauthorized")) {
        errorMessage = "Unauthorized. Please check that your Figma API key is valid and has the necessary permissions."
        statusCode = 401
        errorCode = "UNAUTHORIZED"
      } else if (message.includes("rate limit") || message.includes("429")) {
        errorMessage = "Rate limit exceeded. Please try again in a few minutes."
        statusCode = 429
        errorCode = "RATE_LIMITED"
      } else if (message.includes("timeout")) {
        errorMessage = "Request timed out. Please try again."
        statusCode = 408
        errorCode = "TIMEOUT"
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        details: error instanceof Error ? error.message : "Unknown error occurred",
        requestId,
      },
      { status: statusCode }
    )
  }
}
