import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { threadId } = params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get thread messages (uses idx_thread_messages_thread_id index)
    const { data: messages, error: dbError } = await supabase
      .from('thread_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json({ messages })

  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { threadId } = params
    const { content, messageType, metadata } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify thread exists and user has access
    const { data: thread, error: threadError } = await supabase
      .from('conversation_threads')
      .select('id, is_public, created_by')
      .eq('id', threadId)
      .single()

    if (threadError || !thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Check if user can post to this thread
    if (!thread.is_public && thread.created_by !== user.id) {
      return NextResponse.json({ error: 'Access denied to this thread' }, { status: 403 })
    }

    // Create thread message (uses idx_thread_messages_thread_id and idx_thread_messages_sender_id indexes)
    const { data: message, error: dbError } = await supabase
      .from('thread_messages')
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        content,
        message_type: messageType || 'text',
        metadata: metadata || {}
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    // Update thread's last activity
    await supabase
      .from('conversation_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId)

    // Update thread summary
    await updateThreadSummary(supabase, threadId)

    return NextResponse.json({ 
      success: true, 
      message,
      result: 'Message sent successfully' 
    })

  } catch (error) {
    console.error('Message creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateThreadSummary(supabase: any, threadId: string) {
  try {
    // Get thread info
    const { data: thread, error: threadError } = await supabase
      .from('conversation_threads')
      .select('title, description')
      .eq('id', threadId)
      .single()

    if (threadError || !thread) return

    // Get message count (uses idx_thread_messages_thread_id index)
    const { count: messageCount, error: countError } = await supabase
      .from('thread_messages')
      .select('id', { count: 'exact' })
      .eq('thread_id', threadId)

    if (countError) return

    // Get last message (uses idx_thread_messages_thread_id index)
    const { data: lastMessage, error: lastMessageError } = await supabase
      .from('thread_messages')
      .select('id, created_at')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get unique participants count
    const { data: participants, error: participantsError } = await supabase
      .from('thread_messages')
      .select('sender_id')
      .eq('thread_id', threadId)

    const participantCount = participants 
      ? Array.from(new Set(participants.map((p: any) => p.sender_id))).length 
      : 1

    // Update or create summary (uses idx_thread_summaries_thread_id index)
    await supabase
      .from('thread_summaries')
      .upsert({
        thread_id: threadId,
        title: thread.title,
        description: thread.description,
        participant_count: participantCount,
        message_count: messageCount || 0,
        last_message_id: lastMessage?.id,
        last_activity_at: lastMessage?.created_at || new Date().toISOString()
      })
  } catch (error) {
    console.error('Error updating thread summary:', error)
  }
}