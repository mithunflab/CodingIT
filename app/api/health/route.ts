import { healthMonitor } from "@/lib/api-health"
import { apiClient } from "@/lib/api-client"

export async function GET() {
  const requestId = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log(`[Health API ${requestId}] Performing health check`)

    const healthStatus = apiClient.getHealthStatus()
    const providerHealth = healthMonitor.getAllProviderHealth()
    const metrics = apiClient.getMetrics()
    const recentRequests = apiClient.getRecentRequests(10)

    // Check system resources
    const systemHealth = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    }

    // Determine overall system status
    let overallStatus = "healthy"
    if (healthStatus.status === "unhealthy") {
      overallStatus = "unhealthy"
    } else if (healthStatus.status === "degraded" || providerHealth.some(p => p.status === "degraded")) {
      overallStatus = "degraded"
    }

    const response = {
      status: overallStatus,
      requestId,
      timestamp: new Date().toISOString(),
      system: systemHealth,
      api: {
        status: healthStatus.status,
        details: healthStatus.details,
      },
      providers: providerHealth.map(health => ({
        provider: health.provider,
        status: health.status,
        lastCheck: new Date(health.lastCheck).toISOString(),
        consecutiveFailures: health.consecutiveFailures,
        responseTime: Math.round(health.responseTime) + "ms",
        successRate: (health.successRate * 100).toFixed(2) + "%",
        lastError: health.lastError,
      })),
      metrics: {
        totalRequests: metrics.totalRequests,
        successRate:
          metrics.totalRequests > 0
            ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2) + "%"
            : "0%",
        averageResponseTime: Math.round(metrics.averageResponseTime) + "ms",
        errorsByProvider: metrics.errorsByProvider,
        rateLimitHits: metrics.rateLimitHits,
      },
      recentRequests: recentRequests.map((req) => ({
        id: req.id,
        provider: req.provider,
        model: req.model,
        success: req.success,
        duration: req.duration,
        timestamp: new Date(req.timestamp).toISOString(),
        error: req.error,
      })),
    }

    const statusCode = overallStatus === "healthy" ? 200 : 
                      overallStatus === "degraded" ? 206 : 503

    return Response.json(response, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache",
        "X-Health-Status": overallStatus,
        "X-Request-ID": requestId,
      },
    })
  } catch (error) {
    console.error(`[Health API ${requestId}] Health check failed:`, error)

    return Response.json(
      {
        status: "unhealthy",
        requestId,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Health check system failure",
      },
      {
        status: 503,
        headers: {
          "X-Health-Status": "unhealthy",
          "X-Request-ID": requestId,
        },
      },
    )
  }
}