import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { ChatPersistence, ChatSession } from '@/lib/chat-persistence'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const sessions = await ChatPersistence.getUserSessions(user.id, limit)

    return NextResponse.json({
      sessions,
      total: sessions.length,
    })
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { teamId, title, model, template, initialMessage } = body

    // Create new session
    const session = await ChatPersistence.createSession(
      user.id,
      teamId,
      initialMessage ? {
        role: initialMessage.role || 'user',
        content: initialMessage.content,
        model,
        template,
        metadata: {
          userID: user.id,
          teamID: teamId,
        }
      } : undefined
    )

    // Update title if provided
    if (title && title !== session.title) {
      await ChatPersistence.updateSessionTitle(user.id, session.sessionId, title)
      session.title = title
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error creating chat session:', error)
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    )
  }
}