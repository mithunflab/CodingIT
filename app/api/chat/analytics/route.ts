import { NextRequest, NextResponse } from 'next/server'
import { ChatPersistence } from '@/lib/chat-persistence'
import { authenticateUser } from '@/lib/auth-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser()
    if (error) return error

    // Get user chat summary
    const summary = await ChatPersistence.getUserSummary(user.id)

    return NextResponse.json({
      summary,
    })
  } catch (error) {
    console.error('Error fetching chat analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat analytics' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await authenticateUser()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const daysOld = parseInt(searchParams.get('daysOld') || '90')

    if (daysOld < 1) {
      return NextResponse.json(
        { error: 'daysOld must be at least 1' },
        { status: 400 }
      )
    }

    // Clean up old sessions
    const deletedCount = await ChatPersistence.cleanupOldSessions(user.id, daysOld)

    return NextResponse.json({
      deletedCount,
      message: `Successfully deleted ${deletedCount} old sessions`,
    })
  } catch (error) {
    console.error('Error cleaning up old sessions:', error)
    return NextResponse.json(
      { error: 'Failed to clean up old sessions' },
      { status: 500 }
    )
  }
}