import type { Duration } from "@/lib/duration"
import type { LLMModel, LLMModelConfig } from "@/lib/models"
import { getModelClient } from "@/lib/models" // Assuming getModelClient is a named export
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
    console.log(`[Chat API ${requestId}] Processing request`)

    // Parse request body with enhanced error handling
    let body: any
    try {
      body = await req.json()
      console.log(`[Chat API ${requestId}] Request body parsed successfully`)
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
      uploadedFiles,
      analysisInstructions,
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

    console.log(`[Chat API ${requestId}] Validation passed for model: ${model.id} (${model.providerId})`)

    // Analyze uploaded files if present
    let projectStructure: ProjectStructure | undefined
    if (uploadedFiles && uploadedFiles.length > 0) {
      try {
        console.log(`[Chat API ${requestId}] Analyzing ${uploadedFiles.length} uploaded files`)
        const analyzer = new ProjectAnalyzer()
        const analysis = await analyzer.analyzeProject(uploadedFiles)
        projectStructure = analysis.structure
        
        console.log(`[Chat API ${requestId}] Project analysis completed`)
      } catch (analysisError) {
        logError("Project analysis failed", analysisError, { requestId, filesCount: uploadedFiles.length })
        console.warn(`[Chat API ${requestId}] Project analysis failed, continuing without analysis`)
      }
    }

    // Rate limiting check
    try {
      const limit = !config.apiKey
        ? await ratelimit(req.headers.get("x-forwarded-for"), rateLimitMaxRequests, ratelimitWindow)
        : false

      if (limit) {
        console.log(`[Chat API ${requestId}] Rate limit hit`)
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
    } catch (error) {
      logError("Rate limiting check failed", error, { requestId })
    }

    let modelClient: LanguageModel
    try {
      console.log(`[Chat API ${requestId}] Creating model client for: ${model.providerId}/${model.id}`)
      modelClient = await getModelClient(model, config) as LanguageModel
      console.log(`[Chat API ${requestId}] Model client created successfully`)
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
        console.log(`[Chat API ${requestId}] Generating enhanced prompt with project context`)
        systemPrompt = toEnhancedPrompt(template, userPrompt, projectStructure)
      } else {
        console.log(`[Chat API ${requestId}] Using standard prompt generation`)
        systemPrompt = generateFallbackPrompt(template)
      }
      
      console.log(`[Chat API ${requestId}] System prompt generated`)
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

    const { model: _modelFromConfig, apiKey: _apiKeyFromConfig, ...providerSpecificConfig } = config

    const cleanProviderSpecificConfig = Object.fromEntries(
      Object.entries(providerSpecificConfig).filter(([_, value]) => value !== undefined),
    )

    console.log(`[Chat API ${requestId}] Starting stream object creation`)

    try {
      const streamConfig = {
        model: modelClient,
        schema,
        system: systemPrompt,
        messages,
        maxRetries: 2,
        ...cleanProviderSpecificConfig,
      }

      const stream = await streamObject(streamConfig)
      console.log(`[Chat API ${requestId}] Stream created successfully`)
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

      return new Response(
        JSON.stringify({
          error: "An unexpected error occurred while processing your request.",
          code: "CHAT_PROCESSING_ERROR",
          provider: model.providerId,
          details: errorMessage,
          requestId,
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

function generateFallbackPrompt(template: TemplatesDataObject): string {
  const validTemplates = Object.entries(template)
    .filter(([_, t]) => typeof t === 'object' && t !== null && 'instructions' in t && 'lib' in t)
    .map(([id, t], index) => {
      const templateObject = t as { instructions: string; file?: string | null; lib: string[]; port?: number | null };
      return `${index + 1}. ${id}: "${templateObject.instructions}". File: ${templateObject.file || 'none'}. Dependencies: ${templateObject.lib.join(', ')}. Port: ${templateObject.port || 'none'}.`;
    });

  return `You are an expert software engineer with deep knowledge of modern web development, programming languages, frameworks, and best practices.

Generate production-ready code based on the user's requirements using the following templates:

${validTemplates.join('\n')}

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