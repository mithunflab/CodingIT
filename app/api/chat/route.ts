import type { Duration } from "@/lib/duration"
import type { LLMModel, LLMModelConfig } from "@/lib/models"
import { getModelClient } from "@/lib/models"
import { toPrompt } from "@/lib/prompt"
import ratelimit from "@/lib/ratelimit"
import { fragmentSchema as schema } from "@/lib/schema"
import type { TemplatesDataObject } from "@/lib/templates"
import { streamObject, type LanguageModel, type CoreMessage } from "ai"

export const maxDuration = 60

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 10
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW ? (process.env.RATE_LIMIT_WINDOW as Duration) : "1d"

export async function POST(req: Request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    console.log(`[Chat API ${requestId}] Processing request`)

    // Parse request body with error handling
    let body: any
    try {
      body = await req.json()
      console.log(`[Chat API ${requestId}] Request body parsed, keys:`, Object.keys(body))
    } catch (error) {
      console.error(`[Chat API ${requestId}] Request body parsing failed:`, error)
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
    }: {
      messages: CoreMessage[]
      userID: string
      teamID: string
      template: TemplatesDataObject
      model: LLMModel
      config: LLMModelConfig
    } = body

    // Enhanced validation with specific error messages
    if (!userID || !teamID) {
      console.error(`[Chat API ${requestId}] Missing authentication:`, {
        hasUserID: !!userID,
        hasTeamID: !!teamID,
        userID: userID?.substring(0, 8) + "...",
        teamID: teamID?.substring(0, 8) + "...",
      })

      return new Response(
        JSON.stringify({
          error: "Authentication required. Please ensure you're signed in and have a valid team.",
          code: "MISSING_AUTH",
          details: {
            missingUserID: !userID,
            missingTeamID: !teamID,
          },
          requestId,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error(`[Chat API ${requestId}] Invalid messages:`, {
        hasMessages: !!messages,
        isArray: Array.isArray(messages),
        length: messages?.length,
      })

      return new Response(
        JSON.stringify({
          error: "Messages are required and must be a non-empty array",
          code: "INVALID_MESSAGES",
          requestId,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (!model || !model.id || !model.providerId) {
      console.error(`[Chat API ${requestId}] Invalid model:`, model)

      return new Response(
        JSON.stringify({
          error: "Valid model configuration is required",
          code: "INVALID_MODEL",
          requestId,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    if (!template) {
      console.error(`[Chat API ${requestId}] Invalid template:`, template)

      return new Response(
        JSON.stringify({
          error: "Template configuration is required",
          code: "INVALID_TEMPLATE",
          requestId,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log(`[Chat API ${requestId}] Validation passed:`, {
      userID: userID.substring(0, 8) + "...",
      teamID: teamID.substring(0, 8) + "...",
      modelId: model.id,
      provider: model.providerId,
      messagesCount: messages.length,
    })

    // Rate limiting check
    try {
      const limit = !config.apiKey
        ? await ratelimit(req.headers.get("x-forwarded-for"), rateLimitMaxRequests, ratelimitWindow)
        : false

      if (limit) {
        console.log(`[Chat API ${requestId}] Rate limit hit:`, limit)
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
      console.log(`[Chat API ${requestId}] Rate limit check passed`)
    } catch (error) {
      console.warn(`[Chat API ${requestId}] Rate limiting check failed:`, error)
      // Continue without rate limiting if it fails
    }

    // Create model client with enhanced error handling
    let modelClient: LanguageModel
    try {
      console.log(`[Chat API ${requestId}] Creating model client for:`, model.providerId, model.id)
      modelClient = getModelClient(model, config) as LanguageModel
      console.log(`[Chat API ${requestId}] Model client created successfully`)
    } catch (error: any) {
      console.error(`[Chat API ${requestId}] Model client creation failed:`, error)

      return new Response(
        JSON.stringify({
          error: `Failed to initialize ${model.providerId} model: ${error.message}`, // Use model.providerId for consistency
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

    // Prepare model parameters from config, excluding model and apiKey used for client instantiation
    const { model: _modelFromConfig, apiKey: _apiKeyFromConfig, ...providerSpecificConfig } = config

    // Clean up undefined values from provider-specific config
    const cleanProviderSpecificConfig = Object.fromEntries(
      Object.entries(providerSpecificConfig).filter(([_, value]) => value !== undefined),
    )

    let systemPrompt: string
    try {
      systemPrompt = toPrompt(template)
      // The check for empty systemPrompt with template content was removed due to type mismatch.
      // toPrompt is responsible for handling the TemplatesDataObject.
    } catch (error: any) {
      console.error(`[Chat API ${requestId}] System prompt generation failed:`, error)
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

    console.log(`[Chat API ${requestId}] Creating stream with params:`, {
      providerSpecificConfigKeys: Object.keys(cleanProviderSpecificConfig),
      systemPromptLength: systemPrompt.length,
    })

    try {
      const streamConfig = {
        model: modelClient,
        schema,
        system: systemPrompt, // Use the validated system prompt
        messages,
        maxRetries: 1, // Reduce retries to avoid timeout issues
        ...cleanProviderSpecificConfig, // Pass cleaned provider-specific parameters
      }

      console.log(`[Chat API ${requestId}] Starting stream object creation`)
      const stream = await streamObject(streamConfig)

      console.log(`[Chat API ${requestId}] Stream created successfully`)
      return stream.toTextStreamResponse()
    } catch (error: any) {
      console.error(`[Chat API ${requestId}] Stream creation failed:`, {
        error: error.message,
        stack: error.stack,
        status: error.status,
        code: error.code,
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
            error: `Model ${model.id} is not available for ${model.providerId}.`, // Use model.providerId
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
    console.error(`[Chat API ${requestId}] Request processing failed:`, error)

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
