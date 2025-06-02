// Debug utilities for tracking requests and system health

export interface RequestInfo {
  id: string
  timestamp: number
  status: "pending" | "success" | "error"
  metadata: Record<string, any>
  steps: Array<{
    step: string
    timestamp: number
    data?: any
  }>
  completedAt?: number
  error?: string
}

export class RequestTracker {
  private static instance: RequestTracker
  private requests: Map<string, RequestInfo> = new Map()
  private maxRequests = 100 // Keep last 100 requests

  static getInstance(): RequestTracker {
    if (!RequestTracker.instance) {
      RequestTracker.instance = new RequestTracker()
    }
    return RequestTracker.instance
  }

  startRequest(id: string, metadata: Record<string, any>): void {
    const request: RequestInfo = {
      id,
      timestamp: Date.now(),
      status: "pending",
      metadata,
      steps: [
        {
          step: "started",
          timestamp: Date.now(),
          data: metadata,
        },
      ],
    }

    this.requests.set(id, request)
    this.cleanup()
  }

  addStep(id: string, step: string, data?: any): void {
    const request = this.requests.get(id)
    if (request) {
      request.steps.push({
        step,
        timestamp: Date.now(),
        data,
      })
    }
  }

  completeRequest(id: string, status: "success" | "error", data?: any): void {
    const request = this.requests.get(id)
    if (request) {
      request.status = status
      request.completedAt = Date.now()
      if (status === "error" && data?.error) {
        request.error = data.error
      }
      request.steps.push({
        step: "completed",
        timestamp: Date.now(),
        data,
      })
    }
  }

  getRequest(id: string): RequestInfo | undefined {
    return this.requests.get(id)
  }

  getAllRequests(): RequestInfo[] {
    return Array.from(this.requests.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  getStats() {
    const requests = this.getAllRequests()
    const now = Date.now()
    const last24h = requests.filter((r) => now - r.timestamp < 24 * 60 * 60 * 1000)

    return {
      total: requests.length,
      last24h: last24h.length,
      success: requests.filter((r) => r.status === "success").length,
      error: requests.filter((r) => r.status === "error").length,
      pending: requests.filter((r) => r.status === "pending").length,
      avgDuration: this.calculateAverageDuration(requests.filter((r) => r.completedAt)),
    }
  }

  private calculateAverageDuration(completedRequests: RequestInfo[]): number {
    if (completedRequests.length === 0) return 0

    const totalDuration = completedRequests.reduce((sum, req) => {
      return sum + (req.completedAt! - req.timestamp)
    }, 0)

    return Math.round(totalDuration / completedRequests.length)
  }

  private cleanup(): void {
    if (this.requests.size > this.maxRequests) {
      const requests = this.getAllRequests()
      const toDelete = requests.slice(this.maxRequests)
      toDelete.forEach((req) => this.requests.delete(req.id))
    }
  }
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function logError(context: string, error: any, metadata?: Record<string, any>): void {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    ...metadata,
  })
}

export function validateRequestData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data) {
    errors.push("Request body is required")
    return { valid: false, errors }
  }

  if (!data.userID || typeof data.userID !== "string") {
    errors.push("userID is required and must be a string")
  }

  if (!data.teamID || typeof data.teamID !== "string") {
    errors.push("teamID is required and must be a string")
  }

  if (!data.messages || !Array.isArray(data.messages)) {
    errors.push("messages is required and must be an array")
  } else if (data.messages.length === 0) {
    errors.push("messages array cannot be empty")
  }

  if (!data.model || typeof data.model !== "object") {
    errors.push("model is required and must be an object")
  } else {
    if (!data.model.id || typeof data.model.id !== "string") {
      errors.push("model.id is required and must be a string")
    }
    if (!data.model.providerId || typeof data.model.providerId !== "string") {
      errors.push("model.providerId is required and must be a string")
    }
  }

  if (!data.template) {
    errors.push("template is required")
  }

  if (!data.config || typeof data.config !== "object") {
    errors.push("config is required and must be an object")
  }

  return { valid: errors.length === 0, errors }
}
