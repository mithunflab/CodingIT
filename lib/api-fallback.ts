import { type LLMModel, type LLMModelConfig, getModelClient } from "./models"
import { healthMonitor } from "./api-health"
import { apiClient } from "./api-client"

export interface FallbackConfig {
  primaryProvider: string
  fallbackProviders: string[]
  fallbackModels?: Record<string, string> // Map primary model to fallback model
  maxFallbackAttempts: number
  fallbackDelay: number
}

export class APIFallbackManager {
  private static instance: APIFallbackManager
  private fallbackConfigs: Map<string, FallbackConfig> = new Map()

  private constructor() {
    this.initializeDefaultConfigs()
  }

  static getInstance(): APIFallbackManager {
    if (!APIFallbackManager.instance) {
      APIFallbackManager.instance = new APIFallbackManager()
    }
    return APIFallbackManager.instance
  }

  private initializeDefaultConfigs() {
    // Default fallback configurations
    this.fallbackConfigs.set("openai", {
      primaryProvider: "openai",
      fallbackProviders: ["anthropic", "google", "mistral"],
      fallbackModels: {
        "gpt-4o": "claude-3-5-sonnet-latest",
        "gpt-4o-mini": "claude-3-5-haiku-latest",
        "gpt-4-turbo": "claude-3-5-sonnet-latest",
      },
      maxFallbackAttempts: 2,
      fallbackDelay: 1000,
    })

    this.fallbackConfigs.set("anthropic", {
      primaryProvider: "anthropic",
      fallbackProviders: ["openai", "google", "mistral"],
      fallbackModels: {
        "claude-3-5-sonnet-latest": "gpt-4o",
        "claude-3-5-haiku-latest": "gpt-4o-mini",
      },
      maxFallbackAttempts: 2,
      fallbackDelay: 1000,
    })

    this.fallbackConfigs.set("google", {
      primaryProvider: "google",
      fallbackProviders: ["openai", "anthropic", "mistral"],
      fallbackModels: {
        "models/gemini-2.0-flash": "gpt-4o",
        "models/gemini-1.5-pro": "claude-3-5-sonnet-latest",
      },
      maxFallbackAttempts: 2,
      fallbackDelay: 1000,
    })
  }

  async executeWithFallback<T>(
    model: LLMModel,
    config: LLMModelConfig,
    operation: (client: any) => Promise<T>,
  ): Promise<T> {
    const fallbackConfig = this.fallbackConfigs.get(model.providerId)

    if (!fallbackConfig) {
      // No fallback configured, execute normally
      const client = getModelClient(model, config)
      return await operation(client)
    }

    // Try primary provider first
    try {
      const circuitBreaker = healthMonitor.getCircuitBreaker(model.providerId)

      return await circuitBreaker.execute(async () => {
        const client = getModelClient(model, config)
        return await apiClient.makeRequest(model.providerId, model.id, () => operation(client), {
          timeout: 30000,
          validateResponse: true,
        })
      })
    } catch (primaryError) {
      console.warn(`Primary provider ${model.providerId} failed:`, primaryError)

      // Try fallback providers
      return await this.tryFallbackProviders(model, config, operation, fallbackConfig, primaryError)
    }
  }

  private async tryFallbackProviders<T>(
    originalModel: LLMModel,
    config: LLMModelConfig,
    operation: (client: any) => Promise<T>,
    fallbackConfig: FallbackConfig,
    primaryError: any,
  ): Promise<T> {
    let lastError = primaryError

    for (let i = 0; i < Math.min(fallbackConfig.fallbackProviders.length, fallbackConfig.maxFallbackAttempts); i++) {
      const fallbackProvider = fallbackConfig.fallbackProviders[i]

      // Check if fallback provider is healthy
      const providerHealth = healthMonitor.getProviderHealth(fallbackProvider)
      if (providerHealth?.status === "circuit_open" || providerHealth?.status === "unhealthy") {
        console.warn(`Skipping unhealthy fallback provider: ${fallbackProvider}`)
        continue
      }

      try {
        // Add delay before fallback attempt
        if (i > 0) {
          await this.delay(fallbackConfig.fallbackDelay * i)
        }

        // Create fallback model
        const fallbackModel = this.createFallbackModel(originalModel, fallbackProvider, fallbackConfig)
        const circuitBreaker = healthMonitor.getCircuitBreaker(fallbackProvider)

        console.log(`Attempting fallback to ${fallbackProvider} with model ${fallbackModel.id}`)

        return await circuitBreaker.execute(async () => {
          const client = getModelClient(fallbackModel, config)
          return await apiClient.makeRequest(fallbackProvider, fallbackModel.id, () => operation(client), {
            timeout: 30000,
            validateResponse: true,
          })
        })
      } catch (fallbackError) {
        console.warn(`Fallback provider ${fallbackProvider} failed:`, fallbackError)
        lastError = fallbackError
        continue
      }
    }

    // All fallbacks failed
    throw new Error(`All providers failed. Last error: ${lastError.message}`)
  }

  private createFallbackModel(
    originalModel: LLMModel,
    fallbackProvider: string,
    fallbackConfig: FallbackConfig,
  ): LLMModel {
    // Get fallback model ID
    const fallbackModelId =
      fallbackConfig.fallbackModels?.[originalModel.id] || this.getDefaultModelForProvider(fallbackProvider)

    return {
      id: fallbackModelId,
      name: `${fallbackProvider} fallback`,
      provider: this.getProviderDisplayName(fallbackProvider),
      providerId: fallbackProvider,
    }
  }

  private getDefaultModelForProvider(provider: string): string {
    const defaults: Record<string, string> = {
      openai: "gpt-4o",
      anthropic: "claude-3-5-sonnet-latest",
      google: "models/gemini-2.0-flash",
      vertex: "gemini-2.0-flash-001",
      mistral: "mistral-large-latest",
      groq: "llama-3.3-70b-versatile",
      xai: "grok-beta",
      deepseek: "deepseek-chat",
    }

    return defaults[provider] || "default-model"
  }

  private getProviderDisplayName(provider: string): string {
    const displayNames: Record<string, string> = {
      openai: "OpenAI",
      anthropic: "Anthropic",
      google: "Google Generative AI",
      vertex: "Google Vertex AI",
      mistral: "Mistral",
      groq: "Groq",
      xai: "xAI",
      deepseek: "DeepSeek",
    }

    return displayNames[provider] || provider
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  setFallbackConfig(provider: string, config: FallbackConfig) {
    this.fallbackConfigs.set(provider, config)
  }

  getFallbackConfig(provider: string): FallbackConfig | undefined {
    return this.fallbackConfigs.get(provider)
  }
}

// Export singleton instance
export const fallbackManager = APIFallbackManager.getInstance()
