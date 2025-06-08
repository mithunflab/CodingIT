import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { streamObject, type LanguageModel } from "ai"
import { getModelClient } from "@/lib/models"
import modelsList from "@/lib/models.json"
import ratelimit from "@/lib/ratelimit"
import { logError, generateRequestId } from "@/lib/debug"
import { z } from "zod"
import type { Duration } from "@/lib/duration"

export const maxDuration = 30

const rateLimitMaxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 20
const ratelimitWindow = process.env.RATE_LIMIT_WINDOW ? (process.env.RATE_LIMIT_WINDOW as Duration) : "1h"

const enhanceRequestSchema = z.object({
  textToEnhance: z.string().min(1).max(2000)
})

const enhanceResponseSchema = z.object({
  enhancedText: z.string(),
  reasoning: z.string().optional()
})

export async function POST(req: NextRequest) {
  const requestId = generateRequestId()

  try {
    console.log(`[Enhance Text API ${requestId}] Processing request`)

    // Parse and validate request body
    let body: any
    try {
      body = await req.json()
      const validatedBody = enhanceRequestSchema.parse(body)
      console.log(`[Enhance Text API ${requestId}] Request validated successfully`)
    } catch (error: any) {
      logError("Request validation failed", error, { requestId })
      return NextResponse.json(
        {
          error: "Invalid request. Text to enhance is required and must be between 1-2000 characters.",
          code: "VALIDATION_ERROR",
          requestId,
        },
        { status: 400 }
      )
    }

    const { textToEnhance } = body

    // Get user authentication
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
        { error: "Authentication required", code: "AUTH_REQUIRED", requestId },
        { status: 401 }
      )
    }

    // Apply rate limiting
    try {
      const limit = rateLimitMaxRequests
        ? await ratelimit(req.headers.get("x-forwarded-for"), rateLimitMaxRequests, ratelimitWindow)
        : false

      if (limit) {
        console.log(`[Enhance Text API ${requestId}] Rate limit hit`)
        return NextResponse.json(
          {
            error: "Rate limit exceeded. Please try again later.",
            code: "RATE_LIMITED",
            requestId,
            retryAfter: limit.reset,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.amount.toString(),
              "X-RateLimit-Remaining": limit.remaining.toString(),
              "X-RateLimit-Reset": limit.reset.toString(),
            },
          }
        )
      }
    } catch (error) {
      logError("Rate limiting check failed", error, { requestId })
      // Continue without rate limiting if it fails
    }

    // Get default model for enhancement
    const defaultModel = modelsList.models.find(m => m.providerId === "openai" && m.id === "gpt-4o") || 
                         modelsList.models.find(m => m.providerId === "anthropic" && m.id === "claude-3-5-sonnet-20241022") ||
                         modelsList.models[0]

    if (!defaultModel) {
      return NextResponse.json(
        { error: "No available model for text enhancement", code: "NO_MODEL", requestId },
        { status: 500 }
      )
    }

    // Create model client
    let modelClient: LanguageModel
    try {
      console.log(`[Enhance Text API ${requestId}] Creating model client: ${defaultModel.providerId}/${defaultModel.id}`)
      modelClient = getModelClient(defaultModel, {}) as LanguageModel
    } catch (error: any) {
      logError("Model client creation failed", error, { requestId, provider: defaultModel.providerId, modelId: defaultModel.id })
      return NextResponse.json(
        {
          error: "Failed to initialize AI model for text enhancement",
          code: "MODEL_INIT_ERROR",
          provider: defaultModel.providerId,
          requestId,
        },
        { status: 500 }
      )
    }

    // Generate enhanced text using streamObject for compatibility
    try {
      console.log(`[Enhance Text API ${requestId}] Generating enhanced text`)
      
      const result = await streamObject({
        model: modelClient,
        schema: enhanceResponseSchema,
        system: `You are an expert writing assistant that enhances text to be more clear, engaging, and effective while preserving the original intent and tone.

Your task is to improve the given text by:
- Making it more clear and concise
- Improving grammar and sentence structure
- Enhancing readability and flow
- Maintaining the original meaning and intent
- Keeping the same approximate length and tone
- Making it more engaging without being overly formal

Always preserve the core message while making it sound more professional and polished.`,
        messages: [
          {
            role: "user",
            content: `Please enhance this text while preserving its original intent and tone:

"${textToEnhance}"

Make it more clear, engaging, and well-structured while keeping the same general meaning and length.`
          }
        ],
        maxRetries: 2,
        temperature: 0.7,
      })

      // Wait for the complete object
      const finalResult = await result.object

      console.log(`[Enhance Text API ${requestId}] Enhancement completed successfully`)

      return NextResponse.json({
        enhancedText: finalResult.enhancedText,
        requestId,
      })

    } catch (error: any) {
      logError("Text enhancement failed", error, { requestId, provider: defaultModel.providerId })

      const errorMessage = error.message || "Unknown error"

      if (errorMessage.includes("API key") || errorMessage.includes("authentication") || error.status === 401) {
        return NextResponse.json(
          {
            error: "Authentication failed. Please check AI model configuration.",
            code: "AUTH_ERROR",
            provider: defaultModel.providerId,
            requestId,
          },
          { status: 401 }
        )
      }

      if (errorMessage.includes("rate limit") || errorMessage.includes("quota") || error.status === 429) {
        return NextResponse.json(
          {
            error: "AI service rate limit exceeded. Please try again later.",
            code: "AI_RATE_LIMITED",
            provider: defaultModel.providerId,
            requestId,
          },
          { status: 429 }
        )
      }

      return NextResponse.json(
        {
          error: "Failed to enhance text. Please try again.",
          code: "ENHANCEMENT_ERROR",
          provider: defaultModel.providerId,
          requestId,
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    logError("Request processing failed", error, { requestId })

    return NextResponse.json(
      {
        error: "Internal server error occurred during text enhancement",
        code: "INTERNAL_ERROR",
        requestId,
      },
      { status: 500 }
    )
  }
}