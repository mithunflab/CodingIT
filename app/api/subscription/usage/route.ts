import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getTeamUsageLimits, getTeamSubscription } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's default team
    const { data: userTeam, error: teamError } = await supabase
      .from('users_teams')
      .select('teams (id)')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    if (teamError || !userTeam?.teams) {
      console.error('Team lookup failed for user:', user.id, teamError)
      // Return default free tier limits instead of error
      return NextResponse.json({
        subscription: {
          id: 'default',
          name: 'Personal',
          tier: 'free',
          subscription_status: 'active',
          cancel_at_period_end: false
        },
        usage_limits: [
          {
            usage_type: 'api_calls',
            limit_value: 100,
            current_usage: 0,
            period_start: new Date().toISOString(),
            period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      })
    }

    const team = userTeam.teams as any
    
    const [subscription, usageLimits] = await Promise.all([
      getTeamSubscription(team.id),
      getTeamUsageLimits(team.id)
    ])

    return NextResponse.json({
      subscription,
      usage_limits: usageLimits
    })
  } catch (error) {
    console.error('Usage API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    )
  }
}