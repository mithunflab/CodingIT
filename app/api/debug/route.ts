import { RequestTracker } from "@/lib/debug"

export async function GET() {
  const tracker = RequestTracker.getInstance()
  const stats = tracker.getStats()
  const recentRequests = tracker.getAllRequests().slice(0, 20) // Last 20 requests

  return Response.json({
    stats,
    recentRequests: recentRequests.map((req) => ({
      id: req.id,
      timestamp: new Date(req.timestamp).toISOString(),
      status: req.status,
      duration: req.completedAt ? req.completedAt - req.timestamp : null,
      steps: req.steps.length,
      error: req.error,
      metadata: {
        provider: req.metadata.provider,
        model: req.metadata.model,
        userID: req.metadata.userID?.substring(0, 8) + "...",
        teamID: req.metadata.teamID?.substring(0, 8) + "...",
      },
    })),
  })
}
