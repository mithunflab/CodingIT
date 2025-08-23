import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const isPublic = searchParams.get('public') === 'true'

    let query = supabase.from('conversation_threads').select('*')

    if (isPublic) {
      // Get public conversation threads
      query = query.eq('is_public', true)
    } else {
      // Get user's conversation threads (uses idx_conversation_threads_created_by index)
      query = query.eq('created_by', user.id)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: threads, error: dbError } = await query.order('updated_at', { ascending: false })

    if (dbError) {
      console.error('Database query error:', dbError)
      return NextResponse.json({ error: 'Failed to fetch conversation threads' }, { status: 500 })
    }

    return NextResponse.json({ threads })

  } catch (error) {
    console.error('Conversation threads fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, projectId, isPublic } = await request.json()

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Create conversation thread (uses idx_conversation_threads_created_by index)
    const { data: thread, error: dbError } = await supabase
      .from('conversation_threads')
      .insert({
        title,
        description: description || null,
        created_by: user.id,
        project_id: projectId || null,
        is_public: isPublic || false,
        metadata: {}
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Failed to create conversation thread' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      thread,
      message: 'Conversation thread created successfully' 
    })

  } catch (error) {
    console.error('Conversation thread creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { threadId, title, description, isPublic } = await request.json()

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 })
    }

    const updates: any = { updated_at: new Date().toISOString() }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (isPublic !== undefined) updates.is_public = isPublic

    // Update conversation thread (uses idx_conversation_threads_created_by index for security)
    const { data: updatedThread, error: dbError } = await supabase
      .from('conversation_threads')
      .update(updates)
      .eq('id', threadId)
      .eq('created_by', user.id)
      .select()
      .single()

    if (dbError) {
      console.error('Database update error:', dbError)
      return NextResponse.json({ error: 'Failed to update conversation thread' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      thread: updatedThread,
      message: 'Conversation thread updated successfully' 
    })

  } catch (error) {
    console.error('Conversation thread update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { threadId } = await request.json()

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID is required' }, { status: 400 })
    }

    // First delete all messages in the thread (uses idx_thread_messages_thread_id index)
    await supabase
      .from('thread_messages')
      .delete()
      .eq('thread_id', threadId)

    // Delete thread summaries (uses idx_thread_summaries_thread_id index)
    await supabase
      .from('thread_summaries')
      .delete()
      .eq('thread_id', threadId)

    // Finally delete the conversation thread (uses idx_conversation_threads_created_by index for security)
    const { error: dbError } = await supabase
      .from('conversation_threads')
      .delete()
      .eq('id', threadId)
      .eq('created_by', user.id)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json({ error: 'Failed to delete conversation thread' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Conversation thread deleted successfully' 
    })

  } catch (error) {
    console.error('Conversation thread deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}