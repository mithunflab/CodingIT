import { APIError, RateLimitError } from "./models"

export interface APIMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  errorsByProvider: Record<string, number>
  rateLimitHits: Record<string, number>
}

export interface APIRequest {
  id: string
  provider: string
  model: string
  timestamp: number
  duration?: number
  success: boolean
  error?: string
  retryCount: number
}

class APIMonitor {
  private static instance: APIMonitor
  private metrics: APIMetrics
  private requests: APIRequest[] = []
  private maxRequestHistory = 1000

  private constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorsByProvider: {},
      rateLimitHits: {},
    }
  }

  static getInstance(): APIMonitor {
    if (!APIMonitor.instance) {
      APIMonitor.instance = new APIMonitor()
    }
    return APIMonitor.instance
  }

  recordRequest(request: APIRequest) {
    this.requests.push(request)

    // Keep only recent requests
    if (this.requests.length > this.maxRequestHistory) {
      this.requests = this.requests.slice(-this.maxRequestHistory)
    }

    // Update metrics
    this.metrics.totalRequests++

    if (request.success) {
      this.metrics.successfulRequests++
    } else {
      this.metrics.failedRequests++
      this.metrics.errorsByProvider[request.provider] = (this.metrics.errorsByProvider[request.provider] || 0) + 1
    }

    if (request.duration) {
      const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + request.duration
      this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests
    }
  }

  recordRateLimit(provider: string) {
    this.metrics.rateLimitHits[provider] = (this.metrics.rateLimitHits[provider] || 0) + 1
  }

  getMetrics(): APIMetrics {
    return { ...this.metrics }
  }

  getRecentRequests(limit = 100): APIRequest[] {
    return this.requests.slice(-limit)
  }

  getHealthStatus(): { status: "healthy" | "degraded" | "unhealthy"; details: any } {
    const recentRequests = this.getRecentRequests(50)
    const recentFailureRate =
      recentRequests.length > 0 ? recentRequests.filter((r) => !r.success).length / recentRequests.length : 0

    const avgResponseTime =
      recentRequests.length > 0
        ? recentRequests.reduce((sum, r) => sum + (r.duration || 0), 0) / recentRequests.length
        : 0

    let status: "healthy" | "degraded" | "unhealthy" = "healthy"

    if (recentFailureRate > 0.5 || avgResponseTime > 10000) {
      status = "unhealthy"
    } else if (recentFailureRate > 0.2 || avgResponseTime > 5000) {
      status = "degraded"
    }

    return {
      status,
      details: {
        recentFailureRate,
        avgResponseTime,
        totalRequests: this.metrics.totalRequests,
        recentRequestCount: recentRequests.length,
      },
    }
  }
}

// Enhanced data format converter
export class DataFormatConverter {
  static convertToStandardFormat(data: any, provider: string): any {
    switch (provider) {
      case "openai":
        return this.convertOpenAIFormat(data)
      case "anthropic":
        return this.convertAnthropicFormat(data)
      case "google":
      case "vertex":
        return this.convertGoogleFormat(data)
      case "mistral":
        return this.convertMistralFormat(data)
      default:
        return data
    }
  }

  private static convertOpenAIFormat(data: any): any {
    if (data.choices && Array.isArray(data.choices)) {
      return {
        content: data.choices[0]?.message?.content || data.choices[0]?.text,
        usage: data.usage,
        model: data.model,
        provider: "openai",
      }
    }
    return data
  }

  private static convertAnthropicFormat(data: any): any {
    if (data.content && Array.isArray(data.content)) {
      return {
        content: data.content[0]?.text,
        usage: data.usage,
        model: data.model,
        provider: "anthropic",
      }
    }
    return data
  }

  private static convertGoogleFormat(data: any): any {
    if (data.candidates && Array.isArray(data.candidates)) {
      return {
        content: data.candidates[0]?.content?.parts?.[0]?.text,
        usage: data.usageMetadata,
        model: data.modelVersion,
        provider: "google",
      }
    }
    return data
  }

  private static convertMistralFormat(data: any): any {
    if (data.choices && Array.isArray(data.choices)) {
      return {
        content: data.choices[0]?.message?.content,
        usage: data.usage,
        model: data.model,
        provider: "mistral",
      }
    }
    return data
  }

  static validateResponse(data: any, expectedFormat?: string): boolean {
    if (!data) return false

    // Basic validation - ensure we have content
    if (typeof data === "object" && data.content) {
      return true
    }

    // Check for streaming response
    if (data.stream || data.delta) {
      return true
    }

    return false
  }
}

// Enhanced API client with comprehensive error handling
export class EnhancedAPIClient {
  private monitor: APIMonitor
  private converter: DataFormatConverter

  constructor() {
    this.monitor = APIMonitor.getInstance()
    this.converter = new DataFormatConverter()
  }

  async makeRequest<T>(
    provider: string,
    model: string,
    requestFn: () => Promise<T>,
    options: {
      timeout?: number
      retries?: number
      validateResponse?: boolean
    } = {},
  ): Promise<T> {
    const requestId = this.generateRequestId()
    const startTime = Date.now()
    const retryCount = 0
    const maxRetries = options.retries || 3

    const request: APIRequest = {
      id: requestId,
      provider,
      model,
      timestamp: startTime,
      success: false,
      retryCount: 0,
    }

    try {
      // Add timeout wrapper
      const timeoutPromise = options.timeout ? this.withTimeout(requestFn(), options.timeout) : requestFn()

      const result = await timeoutPromise

      // Validate response if requested
      if (options.validateResponse && !DataFormatConverter.validateResponse(result)) {
        throw new APIError(`Invalid response format from ${provider}`, undefined, provider, true)
      }

      // Convert to standard format
      const standardizedResult = DataFormatConverter.convertToStandardFormat(result, provider)

      // Record successful request
      request.success = true
      request.duration = Date.now() - startTime
      request.retryCount = retryCount
      this.monitor.recordRequest(request)

      return standardizedResult
    } catch (error) {
      // Record failed request
      request.success = false
      request.duration = Date.now() - startTime
      request.retryCount = retryCount
      request.error = error instanceof Error ? error.message : String(error)
      this.monitor.recordRequest(request)

      // Handle rate limiting
      if (error instanceof RateLimitError) {
        this.monitor.recordRateLimit(provider)
      }

      throw error
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new APIError(`Request timeout after ${timeoutMs}ms`, 408, "timeout", true)), timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  }

  private generateRequestId(): string {
    return `req_${crypto.randomUUID()}`
  }

  getMetrics(): APIMetrics {
    return this.monitor.getMetrics()
  }

  getHealthStatus() {
    return this.monitor.getHealthStatus()
  }

  getRecentRequests(limit?: number): APIRequest[] {
    return this.monitor.getRecentRequests(limit)
  }
}

// Singleton instance
export const apiClient = new EnhancedAPIClient()
