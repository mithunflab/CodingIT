// app/api/chat/route.ts - Enhanced with better error handling and project analysis
import type { Duration } from "@/lib/duration"
import type { LLMModel, LLMModelConfig } from "@/lib/models"
import { getModelClient } from "@/lib/models"
import { toEnhancedPrompt } from "@/lib/enhanced-prompt"
import ratelimit from "@/lib/ratelimit"
import { fragmentSchema as schema } from "@/lib/schema"
import type { TemplatesDataObject } from "@/lib/templates"
import { ProjectAnalyzer, type ProjectStructure } from "@/lib/project-analyzer"
import { streamObject, type LanguageModel, type CoreMessage } from "ai"
import { logError, generateRequestId, validateRequestData } from "@/lib/debug"

export const maxDuration = 60

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW ? (process.env.RATE_LIMIT_WINDOW as Duration) : "1d"

export async function POST(req: Request) {
  const requestId = generateRequestId()

  try {
    console.log(`[Enhanced Chat API ${requestId}] Processing request`)

    // Parse request body with enhanced error handling
    let body: any
    try {
      body = await req.json()
      console.log(`[Enhanced Chat API ${requestId}] Request body parsed, keys:`, Object.keys(body))
    } catch (error) {
      logError("Request body parsing", error, { requestId })
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          code: "INVALID_JSON",
          requestId,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const {
      messages,
      userID,
      teamID,
      template,
      model,
      config,
      uploadedFiles, // New: support for uploaded files
      analysisInstructions, // New: specific instructions for analysis
    }: {
      messages: CoreMessage[]
      userID: string
      teamID: string
      template: TemplatesDataObject
      model: LLMModel
      config: LLMModelConfig
      uploadedFiles?: File[]
      analysisInstructions?: string
    } = body

    // Enhanced validation with better error messages
    const validation = validateRequestData(body)
    if (!validation.valid) {
      logError("Request validation failed", new Error(validation.errors.join(", ")), { requestId, errors: validation.errors })
      return new Response(
        JSON.stringify({
          error: "Request validation failed",
          code: "VALIDATION_ERROR",
          details: validation.errors,
          requestId,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log(`[Enhanced Chat API ${requestId}] Validation passed:`, {
      userID: userID.substring(0, 8) + "...",
      teamID: teamID.substring(0, 8) + "...",
      modelId: model.id,
      provider: model.providerId,
      messagesCount: messages.length,
      hasUploadedFiles: !!(uploadedFiles && uploadedFiles.length > 0),
    })

    // Analyze uploaded files if present
    let projectStructure: ProjectStructure | undefined
    if (uploadedFiles && uploadedFiles.length > 0) {
      try {
        console.log(`[Enhanced Chat API ${requestId}] Analyzing ${uploadedFiles.length} uploaded files`)
        const analyzer = new ProjectAnalyzer()
        const analysis = await analyzer.analyzeProject(uploadedFiles)
        projectStructure = analysis.structure
        
        console.log(`[Enhanced Chat API ${requestId}] Project analysis completed:`, {
          filesAnalyzed: uploadedFiles.length,
          dependenciesFound: projectStructure.dependencies.size,
          componentsFound: projectStructure.components.size,
          architectureType: projectStructure.architecture.type,
        })
      } catch (analysisError) {
        logError("Project analysis failed", analysisError, { requestId, filesCount: uploadedFiles.length })
        console.warn(`[Enhanced Chat API ${requestId}] Project analysis failed, continuing without analysis:`, analysisError)
      }
    }

    // Rate limiting check
    try {
      const limit = !config.apiKey
        ? await ratelimit(req.headers.get("x-forwarded-for"), rateLimitMaxRequests, ratelimitWindow)
        : false

      if (limit) {
        console.log(`[Enhanced Chat API ${requestId}] Rate limit hit:`, limit)
        return new Response(
          JSON.stringify({
            error: "You have reached your request limit for the day.",
            code: "RATE_LIMITED",
            requestId,
            retryAfter: limit.reset,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": limit.amount.toString(),
              "X-RateLimit-Remaining": limit.remaining.toString(),
              "X-RateLimit-Reset": limit.reset.toString(),
            },
          },
        )
      }
      console.log(`[Enhanced Chat API ${requestId}] Rate limit check passed`)
    } catch (error) {
      logError("Rate limiting check failed", error, { requestId })
      // Continue without rate limiting if it fails
    }

    // Create model client with enhanced error handling
    let modelClient: LanguageModel
    try {
      console.log(`[Enhanced Chat API ${requestId}] Creating model client for:`, model.providerId, model.id)
      modelClient = getModelClient(model, config) as LanguageModel
      console.log(`[Enhanced Chat API ${requestId}] Model client created successfully`)
    } catch (error: any) {
      logError("Model client creation failed", error, { requestId, provider: model.providerId, modelId: model.id })

      return new Response(
        JSON.stringify({
          error: `Failed to initialize ${model.providerId} model. Please check your API key configuration.`,
          code: "MODEL_INIT_ERROR",
          provider: model.providerId,
          details: error.message,
          requestId,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Extract user prompt from the last message
    const lastMessage = messages[messages.length - 1]
    let userPrompt = ''
    if (Array.isArray(lastMessage?.content)) {
      userPrompt = lastMessage.content
        .filter((content: any) => content.type === 'text')
        .map((content: any) => content.text)
        .join(' ')
    }

    let systemPrompt: string
    try {
      if (projectStructure && userPrompt) {
        console.log(`[Enhanced Chat API ${requestId}] Generating enhanced prompt with project context`)
        systemPrompt = toEnhancedPrompt(template, userPrompt, projectStructure)
      } else {
        console.log(`[Enhanced Chat API ${requestId}] Using standard prompt generation`)
        // Fallback to existing prompt system
        systemPrompt = generateFallbackPrompt(template)
      }
      
      console.log(`[Enhanced Chat API ${requestId}] System prompt generated, length:`, systemPrompt.length)
    } catch (error: any) {
      logError("System prompt generation failed", error, { requestId })
      return new Response(
        JSON.stringify({
          error: "Failed to generate system prompt from template.",
          code: "PROMPT_GENERATION_ERROR",
          details: error.message,
          requestId,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Prepare model parameters from config
    const { model: _modelFromConfig, apiKey: _apiKeyFromConfig, ...providerSpecificConfig } = config

    // Clean up undefined values from provider-specific config
    const cleanProviderSpecificConfig = Object.fromEntries(
      Object.entries(providerSpecificConfig).filter(([_, value]) => value !== undefined),
    )

    console.log(`[Enhanced Chat API ${requestId}] Creating stream with params:`, {
      providerSpecificConfigKeys: Object.keys(cleanProviderSpecificConfig),
      systemPromptLength: systemPrompt.length,
      hasProjectContext: !!projectStructure,
    })

    try {
      const streamConfig = {
        model: modelClient,
        schema,
        system: systemPrompt,
        messages,
        maxRetries: 2, // Increase retries for better reliability
        ...cleanProviderSpecificConfig,
      }

      console.log(`[Enhanced Chat API ${requestId}] Starting stream object creation`)
      const stream = await streamObject(streamConfig)

      console.log(`[Enhanced Chat API ${requestId}] Stream created successfully`)
      return stream.toTextStreamResponse()
    } catch (error: any) {
      logError("Stream creation failed", error, { 
        requestId, 
        provider: model.providerId, 
        modelId: model.id,
        hasProjectContext: !!projectStructure 
      })

      // Enhanced error categorization
      const errorMessage = error.message || "Unknown error"

      if (errorMessage.includes("API key") || errorMessage.includes("authentication") || error.status === 401) {
        return new Response(
          JSON.stringify({
            error: "Authentication failed. Please check your API key configuration.",
            code: "AUTH_ERROR",
            provider: model.providerId,
            requestId,
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (errorMessage.includes("rate limit") || errorMessage.includes("quota") || error.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again later or use your own API key.",
            code: "RATE_LIMITED",
            provider: model.providerId,
            requestId,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("ECONNRESET") ||
        errorMessage.includes("ETIMEDOUT") ||
        errorMessage.includes("ENOTFOUND")
      ) {
        return new Response(
          JSON.stringify({
            error: "Network timeout. Please check your connection and try again.",
            code: "TIMEOUT_ERROR",
            provider: model.providerId,
            requestId,
          }),
          {
            status: 408,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (error.status === 503 || error.status === 502 || errorMessage.includes("overload")) {
        return new Response(
          JSON.stringify({
            error: "Service temporarily unavailable. Please try again later.",
            code: "SERVICE_UNAVAILABLE",
            provider: model.providerId,
            requestId,
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      if (errorMessage.includes("model") && errorMessage.includes("not found")) {
        return new Response(
          JSON.stringify({
            error: `Model ${model.id} is not available for ${model.providerId}.`,
            code: "MODEL_NOT_FOUND",
            provider: model.providerId,
            modelId: model.id,
            requestId,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      // Generic error with detailed information for debugging
      return new Response(
        JSON.stringify({
          error: "An unexpected error occurred while processing your request.",
          code: "INTERNAL_ERROR",
          provider: model.providerId,
          details: errorMessage,
          requestId,
          // Include additional debug info in development
          ...(process.env.NODE_ENV === "development" && {
            debug: {
              stack: error.stack,
              errorType: error.constructor.name,
              status: error.status,
            },
          }),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
  } catch (error: any) {
    logError("Request processing failed", error, { requestId })

    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        code: "REQUEST_PROCESSING_ERROR",
        details: error.message,
        requestId,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Fallback prompt generation function
function generateFallbackPrompt(template: TemplatesDataObject): string {
  return `You are an expert software engineer with deep knowledge of modern web development, programming languages, frameworks, and best practices.

Generate production-ready code based on the user's requirements using the following templates:

${Object.entries(template).map(([id, t], index) => 
  `${index + 1}. ${id}: "${t.instructions}". File: ${t.file || 'none'}. Dependencies: ${t.lib.join(', ')}. Port: ${t.port || 'none'}.`
).join('\n')}

IMPORTANT GUIDELINES:
- Write clean, maintainable, and well-documented code
- Follow modern best practices and patterns
- Include proper error handling and validation
- Ensure code is production-ready
- Use TypeScript when applicable for type safety
- Implement responsive design for web applications
- Follow accessibility guidelines (WCAG 2.1)
- Include proper security measures

Generate complete, functional code that fulfills the user's request.`
}