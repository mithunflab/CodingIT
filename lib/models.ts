import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createVertex } from "@ai-sdk/google-vertex"
import { createMistral } from "@ai-sdk/mistral"
import { createOpenAI } from "@ai-sdk/openai"
import { createOllama } from "ollama-ai-provider"
import { createFireworks } from "@ai-sdk/fireworks"
import { logError } from "./debug"

export type LLMModel = {
  id: string
  name: string
  provider: string
  providerId: string
}

export type LLMModelConfig = {
  model?: string
  apiKey?: string
  baseURL?: string
  temperature?: number
  topP?: number
  topK?: number
  frequencyPenalty?: number
  presencePenalty?: number
  maxTokens?: number
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public provider?: string,
    public retryable = false,
  ) {
    super(message)
    this.name = "APIError"
  }
}

export class RateLimitError extends APIError {
  constructor(provider: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${provider}`, 429, provider, true)
    this.name = "RateLimitError"
    this.retryAfter = retryAfter
  }
  retryAfter?: number
}

export class AuthenticationError extends APIError {
  constructor(provider: string) {
    super(`Authentication failed for ${provider}`, 401, provider, false)
    this.name = "AuthenticationError"
  }
}

// Enhanced model client creation with better error handling and validation
export function getModelClient(model: LLMModel, config: LLMModelConfig) {
  const { id: modelNameString, providerId } = model
  const { apiKey, baseURL } = config

  console.log(`[getModelClient] Creating client for ${providerId}/${modelNameString}`)

  // Validate model configuration
  if (!modelNameString) {
    throw new APIError(`Model ID is required`, 400, providerId, false)
  }

  if (!providerId) {
    throw new APIError(`Provider ID is required`, 400, providerId, false)
  }

  try {
    switch (providerId) {
      case "anthropic": {
        const key = apiKey || process.env.ANTHROPIC_API_KEY
        if (!key) {
          throw new AuthenticationError("anthropic")
        }
        return createAnthropic({
          apiKey: key,
          baseURL,
        })(modelNameString)
      }

      case "openai": {
        const key = apiKey || process.env.OPENAI_API_KEY
        if (!key) {
          throw new AuthenticationError("openai")
        }
        return createOpenAI({
          apiKey: key,
          baseURL,
        })(modelNameString)
      }

      case "google": {
        const key = apiKey || process.env.GOOGLE_AI_API_KEY
        if (!key) {
          throw new AuthenticationError("google")
        }
        return createGoogleGenerativeAI({
          apiKey: key,
          baseURL,
        })(modelNameString)
      }

      case "mistral": {
        const key = apiKey || process.env.MISTRAL_API_KEY
        if (!key) {
          throw new AuthenticationError("mistral")
        }
        return createMistral({
          apiKey: key,
          baseURL,
        })(modelNameString)
      }

      case "groq": {
        const key = apiKey || process.env.GROQ_API_KEY
        if (!key) {
          throw new AuthenticationError("groq")
        }
        return createOpenAI({
          apiKey: key,
          baseURL: baseURL || "https://api.groq.com/openai/v1",
        })(modelNameString)
      }

      case "togetherai": {
        const key = apiKey || process.env.TOGETHER_API_KEY
        if (!key) {
          throw new AuthenticationError("togetherai")
        }
        return createOpenAI({
          apiKey: key,
          baseURL: baseURL || "https://api.together.xyz/v1",
        })(modelNameString)
      }

      case "ollama": {
        return createOllama({
          baseURL: baseURL || "http://localhost:11434",
        })(modelNameString)
      }

      case "fireworks": {
        const key = apiKey || process.env.FIREWORKS_API_KEY
        if (!key) {
          throw new AuthenticationError("fireworks")
        }
        return createFireworks({
          apiKey: key,
          baseURL: baseURL || "https://api.fireworks.ai/inference/v1",
        })(modelNameString)
      }

      case "vertex": {
        const credentials = process.env.GOOGLE_VERTEX_CREDENTIALS || "{}"
        let authOptions = {}

        if (credentials.startsWith("AIza")) {
          authOptions = { apiKey: credentials }
        } else {
          try {
            authOptions = { credentials: JSON.parse(credentials) }
          } catch (e) {
            logError("Vertex credentials parsing", e, { providerId })
            throw new AuthenticationError("vertex")
          }
        }

        return createVertex({
          googleAuthOptions: authOptions,
        })(modelNameString)
      }

      case "xai": {
        const key = apiKey || process.env.XAI_API_KEY
        if (!key) {
          throw new AuthenticationError("xai")
        }
        return createOpenAI({
          apiKey: key,
          baseURL: baseURL || "https://api.x.ai/v1",
        })(modelNameString)
      }

      case "deepseek": {
        const key = apiKey || process.env.DEEPSEEK_API_KEY
        if (!key) {
          throw new AuthenticationError("deepseek")
        }
        return createOpenAI({
          apiKey: key,
          baseURL: baseURL || "https://api.deepseek.com/v1",
        })(modelNameString)
      }

      default:
        throw new APIError(`Unsupported provider: ${providerId}`, 400, providerId, false)
    }
  } catch (error: any) {
    logError("Model client creation", error, { providerId, modelNameString })

    if (error instanceof APIError) {
      throw error
    }

    if (error.message?.includes("API key") || error.message?.includes("authentication")) {
      throw new AuthenticationError(providerId)
    }

    if (error.message?.includes("rate limit") || error.message?.includes("quota")) {
      throw new RateLimitError(providerId)
    }

    if (error.message?.includes("network") || error.code === "ENOTFOUND") {
      throw new APIError(`Network error for ${providerId}: ${error.message}`, 503, providerId, true)
    }

    throw new APIError(`Failed to create ${providerId} client: ${error.message}`, 500, providerId, false)
  }
}