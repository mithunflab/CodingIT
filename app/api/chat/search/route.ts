import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { ChatPersistence } from '@/lib/chat-persistence'

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
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!query) {
      return NextResponse.json(
        { error: 'Missing search query parameter: q' },
        { status: 400 }
      )
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Search messages across user's sessions
    const results = await ChatPersistence.searchMessages(user.id, query, limit)

    return NextResponse.json({
      query,
      results,
      total: results.length,
    })
  } catch (error) {
    console.error('Error searching chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to search chat messages' },
      { status: 500 }
    )
  }
}