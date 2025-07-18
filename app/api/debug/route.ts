import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { errorAnalyzer } from '@/lib/debugging/error-analyzer'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { error, context, code } = body

    if (!error) {
      return NextResponse.json(
        { error: 'Error message is required' },
        { status: 400 }
      )
    }

    // Analyze error in background
    const errorContext = {
      fragment: { code, template: 'code-interpreter-v1' },
      template: 'code-interpreter-v1' as any,
      executionResult: {} as any,
      code,
      ...(context || {})
    }
    const analysis = await errorAnalyzer.analyzeError(error, errorContext)

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/debug - Get debug session
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    if (sessionId) {
      const debugSession = errorAnalyzer.getDebugSession(sessionId)
      if (!debugSession) {
        return NextResponse.json(
          { error: 'Debug session not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(debugSession)
    }

    // Return active debug sessions
    const sessions = errorAnalyzer.getActiveSessions()
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching debug session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}