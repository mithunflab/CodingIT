// API health monitoring and circuit breaker implementation
export interface ProviderHealth {
  provider: string
  status: "healthy" | "degraded" | "unhealthy" | "circuit_open"
  lastCheck: number
  consecutiveFailures: number
  lastError?: string
  responseTime: number
  successRate: number
}

export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime = 0
  private state: "closed" | "open" | "half-open" = "closed"

  constructor(
    private failureThreshold = 5,
    private recoveryTimeout = 60000, // 1 minute
    private provider = "unknown",
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = "half-open"
        console.log(`[Circuit Breaker] ${this.provider} - Moving to half-open state`)
      } else {
        throw new Error(`Circuit breaker is open for ${this.provider}`)
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failureCount = 0
    if (this.state === "half-open") {
      this.state = "closed"
      console.log(`[Circuit Breaker] ${this.provider} - Circuit closed after successful recovery`)
    }
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.failureThreshold) {
      this.state = "open"
      console.log(`[Circuit Breaker] ${this.provider} - Circuit opened after ${this.failureCount} failures`)
    }
  }

  getState(): "closed" | "open" | "half-open" {
    return this.state
  }

  getFailureCount(): number {
    return this.failureCount
  }
}

export class APIHealthMonitor {
  private static instance: APIHealthMonitor
  private providerHealth: Map<string, ProviderHealth> = new Map()
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.startHealthChecks()
  }

  static getInstance(): APIHealthMonitor {
    if (!APIHealthMonitor.instance) {
      APIHealthMonitor.instance = new APIHealthMonitor()
    }
    return APIHealthMonitor.instance
  }

  getCircuitBreaker(provider: string): CircuitBreaker {
    if (!this.circuitBreakers.has(provider)) {
      this.circuitBreakers.set(provider, new CircuitBreaker(5, 60000, provider))
    }
    return this.circuitBreakers.get(provider)!
  }

  updateProviderHealth(provider: string, success: boolean, responseTime: number, error?: string) {
    const current = this.providerHealth.get(provider) || {
      provider,
      status: "healthy" as const,
      lastCheck: Date.now(),
      consecutiveFailures: 0,
      responseTime: 0,
      successRate: 1,
    }

    const now = Date.now()

    if (success) {
      current.consecutiveFailures = 0
      current.status = responseTime > 5000 ? "degraded" : "healthy"
    } else {
      current.consecutiveFailures++
      current.lastError = error

      if (current.consecutiveFailures >= 3) {
        current.status = "unhealthy"
      } else if (current.consecutiveFailures >= 1) {
        current.status = "degraded"
      }
    }

    // Update circuit breaker status
    const circuitBreaker = this.getCircuitBreaker(provider)
    if (circuitBreaker.getState() === "open") {
      current.status = "circuit_open"
    }

    current.lastCheck = now
    current.responseTime = responseTime

    this.providerHealth.set(provider, current)
  }

  getProviderHealth(provider: string): ProviderHealth | null {
    return this.providerHealth.get(provider) || null
  }

  getAllProviderHealth(): ProviderHealth[] {
    return Array.from(this.providerHealth.values())
  }

  getHealthyProviders(): string[] {
    return Array.from(this.providerHealth.entries())
      .filter(([_, health]) => health.status === "healthy")
      .map(([provider]) => provider)
  }

  private startHealthChecks() {
    // Perform health checks every 5 minutes
    this.healthCheckInterval = setInterval(
      () => {
        this.performHealthChecks()
      },
      5 * 60 * 1000,
    )
  }

  private async performHealthChecks() {
    const providers = ["openai", "anthropic", "google", "vertex", "mistral", "groq"]

    for (const provider of providers) {
      try {
        await this.checkProviderHealth(provider)
      } catch (error) {
        console.error(`Health check failed for ${provider}:`, error)
      }
    }
  }

  private async checkProviderHealth(provider: string) {
    const startTime = Date.now()

    try {
      // Simple health check - attempt to get model info or make a minimal request
      const response = await fetch(`https://api.${provider}.com/health`, {
        method: "GET",

      }).catch(() => {
        // If health endpoint doesn't exist, consider it healthy if no recent failures
        const current = this.providerHealth.get(provider)
        return current?.consecutiveFailures === 0 ? { ok: true } : { ok: false }
      })

      const responseTime = Date.now() - startTime
      this.updateProviderHealth(provider, response.ok, responseTime)
    } catch (error) {
      const responseTime = Date.now() - startTime
      this.updateProviderHealth(provider, false, responseTime, error instanceof Error ? error.message : String(error))
    }
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }
}

// Export singleton instance
export const healthMonitor = APIHealthMonitor.getInstance()
