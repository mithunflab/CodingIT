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
  timeout?: number
  retries?: number
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public provider?: string,
    public retryable = false,
    public originalError?: Error,
  ) {
    super(message)
    this.name = "APIError"
  }
}

export class RateLimitError extends APIError {
  constructor(provider: string, retryAfter?: number, originalError?: Error) {
    super(`Rate limit exceeded for ${provider}`, 429, provider, true, originalError)
    this.name = "RateLimitError"
    this.retryAfter = retryAfter
  }
  retryAfter?: number
}

export class AuthenticationError extends APIError {
  constructor(provider: string, originalError?: Error) {
    super(`Authentication failed for ${provider}`, 401, provider, false, originalError)
    this.name = "AuthenticationError"
  }
}

export class NetworkError extends APIError {
  constructor(provider: string, message: string, originalError?: Error) {
    super(`Network error for ${provider}: ${message}`, 503, provider, true, originalError)
    this.name = "NetworkError"
  }
}

export class ValidationError extends APIError {
  constructor(provider: string, message: string, originalError?: Error) {
    super(`Validation error for ${provider}: ${message}`, 400, provider, false, originalError)
    this.name = "ValidationError"
  }
}

export class ModelNotFoundError extends APIError {
  constructor(provider: string, modelId: string, originalError?: Error) {
    super(`Model '${modelId}' not found for provider '${provider}'`, 404, provider, false, originalError)
    this.name = "ModelNotFoundError"
  }
}

export class TimeoutError extends APIError {
  constructor(provider: string, timeout: number, originalError?: Error) {
    super(`Request timeout (${timeout}ms) for ${provider}`, 408, provider, true, originalError)
    this.name = "TimeoutError"
  }
}

// Provider configuration interface
interface ProviderConfig {
  name: string
  requiredEnvVars: string[]
  defaultBaseURL?: string
  supportedModels?: string[]
  maxRetries?: number
  timeout?: number
  validateModel?: (modelId: string) => boolean
}

// Provider configurations
const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  anthropic: {
    name: "Anthropic",
    requiredEnvVars: ["ANTHROPIC_API_KEY"],
    supportedModels: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-latest"],
    maxRetries: 3,
    timeout: 60000,
    validateModel: (modelId) => modelId.startsWith("claude-")
  },
  openai: {
    name: "OpenAI",
    requiredEnvVars: ["OPENAI_API_KEY"],
    supportedModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    maxRetries: 3,
    timeout: 60000,
    validateModel: (modelId) => modelId.startsWith("gpt-")
  },
  google: {
    name: "Google Generative AI",
    requiredEnvVars: ["GOOGLE_AI_API_KEY"],
    supportedModels: ["models/gemini-2.0-flash", "models/gemini-1.5-pro"],
    maxRetries: 3,
    timeout: 60000,
    validateModel: (modelId) => modelId.startsWith("models/gemini-")
  },
  mistral: {
    name: "Mistral",
    requiredEnvVars: ["MISTRAL_API_KEY"],
    supportedModels: ["mistral-large-latest", "mistral-medium-latest"],
    maxRetries: 3,
    timeout: 60000,
    validateModel: (modelId) => modelId.includes("mistral")
  },
  groq: {
    name: "Groq",
    requiredEnvVars: ["GROQ_API_KEY"],
    defaultBaseURL: "https://api.groq.com/openai/v1",
    maxRetries: 5,
    timeout: 30000,
    validateModel: (modelId) => modelId.includes("llama") || modelId.includes("mixtral")
  },
  togetherai: {
    name: "Together AI",
    requiredEnvVars: ["TOGETHER_API_KEY"],
    defaultBaseURL: "https://api.together.xyz/v1",
    maxRetries: 3,
    timeout: 60000
  },
  ollama: {
    name: "Ollama",
    requiredEnvVars: [],
    defaultBaseURL: "http://localhost:11434",
    maxRetries: 2,
    timeout: 120000,
    validateModel: () => true // Ollama can run any model
  },
  fireworks: {
    name: "Fireworks",
    requiredEnvVars: ["FIREWORKS_API_KEY"],
    defaultBaseURL: "https://api.fireworks.ai/inference/v1",
    maxRetries: 3,
    timeout: 60000
  },
  vertex: {
    name: "Google Vertex AI",
    requiredEnvVars: ["GOOGLE_VERTEX_CREDENTIALS"],
    maxRetries: 3,
    timeout: 60000,
    validateModel: (modelId) => modelId.includes("gemini")
  },
  xai: {
    name: "xAI",
    requiredEnvVars: ["XAI_API_KEY"],
    defaultBaseURL: "https://api.x.ai/v1",
    maxRetries: 3,
    timeout: 60000,
    validateModel: (modelId) => modelId.includes("grok")
  },
  deepseek: {
    name: "DeepSeek",
    requiredEnvVars: ["DEEPSEEK_API_KEY"],
    defaultBaseURL: "https://api.deepseek.com/v1",
    maxRetries: 3,
    timeout: 60000,
    validateModel: (modelId) => modelId.includes("deepseek")
  }
}

function validateModelConfiguration(model: LLMModel, config: LLMModelConfig): void {
  if (!model || typeof model !== 'object') {
    throw new ValidationError('unknown', 'Model object is required')
  }

  const { id: modelId, providerId, name, provider } = model

  if (!modelId || typeof modelId !== 'string' || modelId.trim().length === 0) {
    throw new ValidationError(providerId || 'unknown', 'Model ID is required and must be a non-empty string')
  }

  if (!providerId || typeof providerId !== 'string' || providerId.trim().length === 0) {
    throw new ValidationError(providerId || 'unknown', 'Provider ID is required and must be a non-empty string')
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError(providerId, 'Model name is required and must be a non-empty string')
  }

  if (!provider || typeof provider !== 'string' || provider.trim().length === 0) {
    throw new ValidationError(providerId, 'Provider name is required and must be a non-empty string')
  }

  const providerConfig = PROVIDER_CONFIGS[providerId]
  if (!providerConfig) {
    throw new ValidationError(providerId, `Unsupported provider: ${providerId}. Supported providers: ${Object.keys(PROVIDER_CONFIGS).join(', ')}`)
  }

  if (providerConfig.validateModel && !providerConfig.validateModel(modelId)) {
    throw new ValidationError(providerId, `Invalid model ID '${modelId}' for provider '${providerId}'`)
  }

  if (config && typeof config !== 'object') {
    throw new ValidationError(providerId, 'Config must be an object')
  }

  const numericFields = ['temperature', 'topP', 'topK', 'frequencyPenalty', 'presencePenalty', 'maxTokens', 'timeout', 'retries']
  for (const field of numericFields) {
    const value = config[field as keyof LLMModelConfig]
    if (value !== undefined && (typeof value !== 'number' || isNaN(value) || value < 0)) {
      throw new ValidationError(providerId, `${field} must be a positive number`)
    }
  }

  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    throw new ValidationError(providerId, 'Temperature must be between 0 and 2')
  }

  if (config.topP !== undefined && (config.topP < 0 || config.topP > 1)) {
    throw new ValidationError(providerId, 'topP must be between 0 and 1')
  }

  if (config.maxTokens !== undefined && config.maxTokens > 100000) {
    throw new ValidationError(providerId, 'maxTokens cannot exceed 100000')
  }
}

function validateEnvironmentVariables(providerId: string, apiKey?: string): void {
  const providerConfig = PROVIDER_CONFIGS[providerId]
  if (!providerConfig) return

  if (providerId === 'ollama') return

  if (apiKey && apiKey.trim().length > 0) return

  for (const envVar of providerConfig.requiredEnvVars) {
    const value = process.env[envVar]
    if (!value || value.trim().length === 0) {
      throw new AuthenticationError(providerId, new Error(`Missing required environment variable: ${envVar}`))
    }
  }
}

function createProviderClient(providerId: string, modelId: string, config: LLMModelConfig) {
  const { apiKey, baseURL } = config
  const providerConfig = PROVIDER_CONFIGS[providerId]

  switch (providerId) {
    case "anthropic": {
      const key = apiKey || process.env.ANTHROPIC_API_KEY
      if (!key) throw new AuthenticationError("anthropic")
      
      return createAnthropic({
        apiKey: key,
        baseURL: baseURL || undefined,
      })(modelId)
    }

    case "openai": {
      const key = apiKey || process.env.OPENAI_API_KEY
      if (!key) throw new AuthenticationError("openai")
      
      return createOpenAI({
        apiKey: key,
        baseURL: baseURL || undefined,
      })(modelId)
    }

    case "google": {
      const key = apiKey || process.env.GOOGLE_AI_API_KEY
      if (!key) throw new AuthenticationError("google")
      
      return createGoogleGenerativeAI({
        apiKey: key,
        baseURL: baseURL || undefined,
      })(modelId)
    }

    case "mistral": {
      const key = apiKey || process.env.MISTRAL_API_KEY
      if (!key) throw new AuthenticationError("mistral")
      
      return createMistral({
        apiKey: key,
        baseURL: baseURL || undefined,
      })(modelId)
    }

    case "groq": {
      const key = apiKey || process.env.GROQ_API_KEY
      if (!key) throw new AuthenticationError("groq")
      
      return createOpenAI({
        apiKey: key,
        baseURL: baseURL || providerConfig.defaultBaseURL,
      })(modelId)
    }

    case "togetherai": {
      const key = apiKey || process.env.TOGETHER_API_KEY
      if (!key) throw new AuthenticationError("togetherai")
      
      return createOpenAI({
        apiKey: key,
        baseURL: baseURL || providerConfig.defaultBaseURL,
      })(modelId)
    }

    case "ollama": {
      return createOllama({
        baseURL: baseURL || providerConfig.defaultBaseURL,
      })(modelId)
    }

    case "fireworks": {
      const key = apiKey || process.env.FIREWORKS_API_KEY
      if (!key) throw new AuthenticationError("fireworks")
      
      return createFireworks({
        apiKey: key,
        baseURL: baseURL || providerConfig.defaultBaseURL,
      })(modelId)
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
          throw new AuthenticationError("vertex", e as Error)
        }
      }

      return createVertex({
        googleAuthOptions: authOptions,
      })(modelId)
    }

    case "xai": {
      const key = apiKey || process.env.XAI_API_KEY
      if (!key) throw new AuthenticationError("xai")
      
      return createOpenAI({
        apiKey: key,
        baseURL: baseURL || providerConfig.defaultBaseURL,
      })(modelId)
    }

    case "deepseek": {
      const key = apiKey || process.env.DEEPSEEK_API_KEY
      if (!key) throw new AuthenticationError("deepseek")
      
      return createOpenAI({
        apiKey: key,
        baseURL: baseURL || providerConfig.defaultBaseURL,
      })(modelId)
    }

    default:
      throw new ValidationError(providerId, `Unsupported provider: ${providerId}`)
  }
}

async function validateConnection(providerId: string, client: any): Promise<void> {
  // Skip validation for local providers
  if (providerId === 'ollama') return

  // For production, you might want to implement actual health checks
  // This is a placeholder for connection validation
  try {
    // You could implement provider-specific health checks here
    // For now, we'll just log that validation would occur
    console.log(`[Model Client] Connection validation for ${providerId} would be performed here`)
  } catch (error) {
    throw new NetworkError(providerId, 'Connection validation failed', error as Error)
  }
}

// Enhanced model client creation with comprehensive error handling
export async function getModelClient(model: LLMModel, config: LLMModelConfig = {}) {
  const startTime = Date.now()
  const { id: modelId, providerId } = model

  try {
    console.log(`[getModelClient] Creating client for ${providerId}/${modelId}`)

    // Step 1: Validate input parameters
    validateModelConfiguration(model, config)
    console.log(`[getModelClient] Configuration validated for ${providerId}/${modelId}`)

    // Step 2: Validate environment variables and authentication
    validateEnvironmentVariables(providerId, config.apiKey)
    console.log(`[getModelClient] Environment validation passed for ${providerId}`)

    // Step 3: Create the provider client
    const client = createProviderClient(providerId, modelId, config)
    console.log(`[getModelClient] Provider client created for ${providerId}/${modelId}`)

    // Step 4: Validate connection (optional, for production monitoring)
    if (process.env.NODE_ENV === 'production') {
      await validateConnection(providerId, client)
      console.log(`[getModelClient] Connection validated for ${providerId}`)
    }

    const duration = Date.now() - startTime
    console.log(`[getModelClient] Successfully created client for ${providerId}/${modelId} in ${duration}ms`)

    return client

  } catch (error: any) {
    const duration = Date.now() - startTime
    
    // Enhanced error logging with context
    logError("Model client creation failed", error, { 
      providerId, 
      modelId, 
      duration,
      hasApiKey: !!config.apiKey,
      hasBaseURL: !!config.baseURL,
      errorType: error.constructor.name
    })

    // Re-throw known errors
    if (error instanceof APIError) {
      throw error
    }

    // Enhanced error categorization
    const errorMessage = error.message?.toLowerCase() || ''

    // Authentication errors
    if (errorMessage.includes('api key') || 
        errorMessage.includes('authentication') || 
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('invalid key') ||
        error.status === 401) {
      throw new AuthenticationError(providerId, error)
    }

    // Rate limit errors
    if (errorMessage.includes('rate limit') || 
        errorMessage.includes('quota') || 
        errorMessage.includes('too many requests') ||
        error.status === 429) {
      const retryAfter = error.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) : undefined
      throw new RateLimitError(providerId, retryAfter, error)
    }

    // Network errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('enotfound') ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT') {
      throw new NetworkError(providerId, error.message, error)
    }

    // Model not found errors
    if (errorMessage.includes('model') && 
        (errorMessage.includes('not found') || errorMessage.includes('does not exist')) ||
        error.status === 404) {
      throw new ModelNotFoundError(providerId, modelId, error)
    }

    // Timeout errors
    if (errorMessage.includes('timeout') || error.code === 'TIMEOUT') {
      const timeout = config.timeout || PROVIDER_CONFIGS[providerId]?.timeout || 60000
      throw new TimeoutError(providerId, timeout, error)
    }

    // Generic API errors
    if (error.status && error.status >= 400) {
      throw new APIError(
        `HTTP ${error.status}: ${error.message || 'Unknown error'}`, 
        error.status, 
        providerId, 
        error.status >= 500, // Server errors are retryable
        error
      )
    }

    // Fallback for unknown errors
    throw new APIError(
      `Failed to create ${providerId} client: ${error.message || 'Unknown error'}`, 
      500, 
      providerId, 
      true, // Unknown errors are potentially retryable
      error
    )
  }
}

// Synchronous version for backward compatibility
export function getModelClientSync(model: LLMModel, config: LLMModelConfig = {}) {
  const { id: modelId, providerId } = model

  try {
    console.log(`[getModelClientSync] Creating client for ${providerId}/${modelId}`)

    // Validate input parameters
    validateModelConfiguration(model, config)
    
    // Validate environment variables
    validateEnvironmentVariables(providerId, config.apiKey)
    
    // Create the provider client
    const client = createProviderClient(providerId, modelId, config)
    
    console.log(`[getModelClientSync] Successfully created client for ${providerId}/${modelId}`)
    return client

  } catch (error: any) {
    logError("Synchronous model client creation failed", error, { providerId, modelId })
    throw error
  }
}

// Utility functions for error handling
export function isRetryableError(error: Error): boolean {
  return error instanceof APIError && error.retryable
}

export function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  // Exponential backoff with jitter
  const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000)
  const jitter = Math.random() * 0.1 * delay
  return delay + jitter
}

export function getProviderInfo(providerId: string): ProviderConfig | null {
  return PROVIDER_CONFIGS[providerId] || null
}

export function getSupportedProviders(): string[] {
  return Object.keys(PROVIDER_CONFIGS)
}

// Health check function for monitoring
export async function checkProviderHealth(providerId: string, config: LLMModelConfig = {}): Promise<boolean> {
  try {
    const dummyModel: LLMModel = {
      id: 'health-check',
      name: 'Health Check',
      provider: PROVIDER_CONFIGS[providerId]?.name || providerId,
      providerId
    }
    
    validateEnvironmentVariables(providerId, config.apiKey)
    return true
  } catch (error) {
    console.warn(`[Health Check] Provider ${providerId} is unhealthy:`, error)
    return false
  }
}

export { getModelClientSync as getModelClientLegacy }