import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { ChatPersistence } from '@/lib/chat-persistence'

interface RouteParams {
  params: {
    sessionId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sessionId } = params

    // Get session metadata
    const session = await ChatPersistence.getSession(user.id, sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get session messages
    const messages = await ChatPersistence.getSessionMessages(user.id, sessionId)

    return NextResponse.json({
      session,
      messages,
    })
  } catch (error) {
    console.error('Error fetching chat session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat session' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sessionId } = params
    const body = await request.json()
    const { title, status } = body

    // Check if session exists
    const session = await ChatPersistence.getSession(user.id, sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Update title if provided
    if (title !== undefined) {
      await ChatPersistence.updateSessionTitle(user.id, sessionId, title)
    }

    // Archive session if status is provided
    if (status === 'archived') {
      await ChatPersistence.archiveSession(user.id, sessionId)
    }

    // Get updated session
    const updatedSession = await ChatPersistence.getSession(user.id, sessionId)

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Error updating chat session:', error)
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { sessionId } = params

    // Check if session exists
    const session = await ChatPersistence.getSession(user.id, sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Delete session
    await ChatPersistence.deleteSession(user.id, sessionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat session:', error)
    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    )
  }
}