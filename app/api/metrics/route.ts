import { apiClient } from "@/lib/api-client"
import { healthMonitor } from "@/lib/api-health"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const timeframe = url.searchParams.get("timeframe") || "1h"
    const provider = url.searchParams.get("provider")

    const metrics = apiClient.getMetrics()
    const healthStatus = apiClient.getHealthStatus()
    const providerHealth = healthMonitor.getAllProviderHealth()

    
    const timeframeMs = parseTimeframe(timeframe)
    const cutoffTime = Date.now() - timeframeMs
    const recentRequests = apiClient
      .getRecentRequests(1000)
      .filter((req) => req.timestamp >= cutoffTime)
      .filter((req) => !provider || req.provider === provider)

    
    const timeframeMetrics = calculateTimeframeMetrics(recentRequests)

    const response = {
      timeframe,
      provider: provider || "all",
      timestamp: new Date().toISOString(),
      overall: {
        status: healthStatus.status,
        totalRequests: metrics.totalRequests,
        successRate:
          metrics.totalRequests > 0
            ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2) + "%"
            : "0%",
        averageResponseTime: Math.round(metrics.averageResponseTime) + "ms",
        errorsByProvider: metrics.errorsByProvider,
        rateLimitHits: metrics.rateLimitHits,
      },
      timeframe_metrics: timeframeMetrics,
      providers: providerHealth.map((health) => ({
        provider: health.provider,
        status: health.status,
        lastCheck: new Date(health.lastCheck).toISOString(),
        consecutiveFailures: health.consecutiveFailures,
        responseTime: Math.round(health.responseTime) + "ms",
        successRate: (health.successRate * 100).toFixed(2) + "%",
        lastError: health.lastError,
      })),
      request_distribution: calculateRequestDistribution(recentRequests),
      error_analysis: calculateErrorAnalysis(recentRequests),
      performance_trends: calculatePerformanceTrends(recentRequests),
    }

    return Response.json(response, {
      headers: {
        "Cache-Control": "public, max-age=60", 
        "X-Total-Requests": metrics.totalRequests.toString(),
        "X-Success-Rate": ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2),
      },
    })
  } catch (error) {
    console.error("Metrics endpoint error:", error)

    return Response.json(
      {
        error: "Failed to retrieve metrics",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

function parseTimeframe(timeframe: string): number {
  const timeframes: Record<string, number> = {
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
  }

  return timeframes[timeframe] || timeframes["1h"]
}

function calculateTimeframeMetrics(requests: any[]) {
  if (requests.length === 0) {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: "0%",
      averageResponseTime: "0ms",
      medianResponseTime: "0ms",
      p95ResponseTime: "0ms",
    }
  }

  const successful = requests.filter((r) => r.success)
  const responseTimes = requests
    .filter((r) => r.duration)
    .map((r) => r.duration)
    .sort((a, b) => a - b)

  const p95Index = Math.floor(responseTimes.length * 0.95)
  const medianIndex = Math.floor(responseTimes.length * 0.5)

  return {
    totalRequests: requests.length,
    successfulRequests: successful.length,
    failedRequests: requests.length - successful.length,
    successRate: ((successful.length / requests.length) * 100).toFixed(2) + "%",
    averageResponseTime:
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) + "ms"
        : "0ms",
    medianResponseTime: responseTimes.length > 0 ? Math.round(responseTimes[medianIndex]) + "ms" : "0ms",
    p95ResponseTime: responseTimes.length > 0 ? Math.round(responseTimes[p95Index]) + "ms" : "0ms",
  }
}

function calculateRequestDistribution(requests: any[]) {
  const distribution: Record<string, number> = {}

  requests.forEach((req) => {
    const key = `${req.provider}/${req.model}`
    distribution[key] = (distribution[key] || 0) + 1
  })

  return Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) 
    .map(([key, count]) => ({ model: key, requests: count }))
}

function calculateErrorAnalysis(requests: any[]) {
  const errors: Record<string, number> = {}

  requests
    .filter((req) => !req.success && req.error)
    .forEach((req) => {
      const errorType = req.error.split(":")[0] 
      errors[errorType] = (errors[errorType] || 0) + 1
    })

  return Object.entries(errors)
    .sort(([, a], [, b]) => b - a)
    .map(([error, count]) => ({ error, count }))
}

function calculatePerformanceTrends(requests: any[]) {
  
  const intervals: Record<string, { total: number; successful: number; totalTime: number }> = {}

  requests.forEach((req) => {
    const intervalStart = Math.floor(req.timestamp / (5 * 60 * 1000)) * (5 * 60 * 1000)
    const key = new Date(intervalStart).toISOString()

    if (!intervals[key]) {
      intervals[key] = { total: 0, successful: 0, totalTime: 0 }
    }

    intervals[key].total++
    if (req.success) {
      intervals[key].successful++
    }
    if (req.duration) {
      intervals[key].totalTime += req.duration
    }
  })

  return Object.entries(intervals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, data]) => ({
      timestamp,
      requests: data.total,
      successRate: data.total > 0 ? ((data.successful / data.total) * 100).toFixed(2) + "%" : "0%",
      avgResponseTime: data.successful > 0 ? Math.round(data.totalTime / data.successful) + "ms" : "0ms",
    }))
}
