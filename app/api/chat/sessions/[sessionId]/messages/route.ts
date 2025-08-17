import { NextRequest, NextResponse } from 'next/server'
import { ChatPersistence } from '@/lib/chat-persistence'
import { authenticateUser } from '@/lib/auth-utils'

export const runtime = 'nodejs'

interface RouteParams {
  params: {
    sessionId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticateUser()
    if (error) return error

    const { sessionId } = params

    // Check if session exists
    const session = await ChatPersistence.getSession(user.id, sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get session messages
    const messages = await ChatPersistence.getSessionMessages(user.id, sessionId)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching session messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error } = await authenticateUser()
    if (error) return error

    const { sessionId } = params
    const body = await request.json()
    const { role, content, model, template, metadata } = body

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: role and content' },
        { status: 400 }
      )
    }

    // Check if session exists
    const session = await ChatPersistence.getSession(user.id, sessionId)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Add message to session
    const message = await ChatPersistence.addMessage(user.id, sessionId, {
      role,
      content,
      model,
      template,
      metadata: {
        ...metadata,
        userID: user.id,
        teamID: session.teamId,
      }
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error adding message to session:', error)
    return NextResponse.json(
      { error: 'Failed to add message to session' },
      { status: 500 }
    )
  }
}