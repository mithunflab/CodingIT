import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { withAuth } from '@/lib/auth-utils'
import { type User } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface TelemetryEvent {
  teamId: string
  sessionId: string
  eventName: string
  eventProperties: Record<string, any>
}

export const POST = withAuth(async (user: User, request: NextRequest) => {
  try {
    const { events } = (await request.json()) as { events: TelemetryEvent[] }

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Invalid events payload' }, { status: 400 })
    }

    const supabase = createServerClient()

    const telemetryEvents = events.map(event => ({
      user_id: user.id,
      team_id: event.teamId,
      session_id: event.sessionId,
      event_name: event.eventName,
      event_properties: event.eventProperties,
    }))

    const { error } = await supabase
      .from('telemetry_events')
      .insert(telemetryEvents)

    if (error) {
      console.error('Failed to insert telemetry events:', error)
      return NextResponse.json(
        { error: 'Failed to store telemetry data' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }
    console.error('Telemetry API error:', error)
    return NextResponse.json(
      { error: 'Failed to process telemetry request' },
      { status: 500 }
    )
  }
})
