import { createServerClient } from './supabase-server'
import { canUseFeature, incrementUsage } from './subscription'
import { STRIPE_PLANS } from './stripe'

export type FeatureType = 'github_imports' | 'storage_mb' | 'execution_time_seconds' | 'api_calls'

export interface UsageCheckResult {
  canUse: boolean
  currentUsage?: number
  limit?: number
  isUnlimited?: boolean
  upgradeRequired?: boolean
  planName?: string
}

export async function checkFeatureAccess(
  userId: string,
  featureType: FeatureType,
  requestedAmount: number = 1
): Promise<UsageCheckResult> {
  try {
    const supabase = createServerClient()
    
    // Get user's default team
    const { data: userTeam } = await supabase
      .from('users_teams')
      .select('teams (id, tier)')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single()

    if (!userTeam?.teams) {
      return { 
        canUse: false, 
        upgradeRequired: true,
        planName: 'free'
      }
    }

    const team = userTeam.teams as any
    const canUse = await canUseFeature(team.id, featureType, requestedAmount)
    
    // Get usage limits for detailed response
    const { data: usageLimit } = await supabase
      .from('team_usage_limits')
      .select('limit_value, current_usage')
      .eq('team_id', team.id)
      .eq('usage_type', featureType)
      .single()

    const isUnlimited = usageLimit?.limit_value === -1
    const currentTier = team.tier || 'free'
    
    return {
      canUse,
      currentUsage: usageLimit?.current_usage || 0,
      limit: usageLimit?.limit_value || 0,
      isUnlimited,
      upgradeRequired: !canUse && currentTier === 'free',
      planName: currentTier
    }
  } catch (error) {
    console.error('Error checking feature access:', error)
    return { 
      canUse: false, 
      upgradeRequired: true,
      planName: 'free'
    }
  }
}

export async function trackFeatureUsage(
  userId: string,
  featureType: FeatureType,
  amount: number = 1,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const supabase = createServerClient()
    
    // Get user's default team
    const { data: userTeam } = await supabase
      .from('users_teams')
      .select('teams (id)')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single()

    if (!userTeam?.teams) {
      return false
    }

    const team = userTeam.teams as any
    const success = await incrementUsage(team.id, featureType, amount)
    
    if (success && metadata) {
      // Log additional metadata in user_usage table
      await supabase.from('user_usage').insert({
        user_id: userId,
        team_id: team.id,
        usage_type: featureType,
        usage_count: amount,
        metadata: metadata
      })
    }
    
    return success
  } catch (error) {
    console.error('Error tracking feature usage:', error)
    return false
  }
}

export function getFeatureLimits(tier: keyof typeof STRIPE_PLANS) {
  const plan = STRIPE_PLANS[tier]
  return {
    githubImports: plan.features.githubImports,
    storageLimit: plan.features.storageLimit,
    executionTimeLimit: plan.features.executionTimeLimit,
    apiCallsPerMonth: plan.features.apiCallsPerMonth
  }
}

export function getUpgradeMessage(currentTier: string, featureType: FeatureType): string {
  const featureMessages = {
    github_imports: 'Import more repositories from GitHub',
    storage_mb: 'Get more storage for your projects',
    execution_time_seconds: 'Run longer code executions',
    api_calls: 'Make more API calls per month'
  }

  const message = featureMessages[featureType] || 'Access premium features'
  
  if (currentTier === 'free') {
    return `Upgrade to Pro to ${message.toLowerCase()}`
  } else if (currentTier === 'pro') {
    return `Upgrade to Enterprise for unlimited access`
  }
  
  return `Upgrade your plan to ${message.toLowerCase()}`
}

export async function getUserTeamWithUsage(userId: string) {
  const supabase = createServerClient()
  
  const { data: userTeam } = await supabase
    .from('users_teams')
    .select(`
      teams (
        id,
        name,
        tier,
        stripe_customer_id,
        stripe_subscription_id,
        subscription_status,
        current_period_end,
        cancel_at_period_end
      )
    `)
    .eq('user_id', userId)
    .eq('is_default', true)
    .single()

  if (!userTeam?.teams) {
    return null
  }

  const team = userTeam.teams as any
  
  // Get usage limits
  const { data: usageLimits } = await supabase
    .from('team_usage_limits')
    .select('usage_type, limit_value, current_usage, period_end')
    .eq('team_id', team.id)

  return {
    ...team,
    usage_limits: usageLimits || []
  }
}

// Middleware function for API routes
export function createUsageMiddleware(featureType: FeatureType, amount: number = 1) {
  return async (userId: string) => {
    const access = await checkFeatureAccess(userId, featureType, amount)
    
    if (!access.canUse) {
      const error = {
        code: 'FEATURE_LIMIT_EXCEEDED',
        message: access.upgradeRequired 
          ? getUpgradeMessage(access.planName || 'free', featureType)
          : `You've reached your ${featureType.replace('_', ' ')} limit for this month`,
        currentUsage: access.currentUsage,
        limit: access.limit,
        upgradeRequired: access.upgradeRequired
      }
      throw error
    }

    return {
      trackUsage: () => trackFeatureUsage(userId, featureType, amount),
      remainingUsage: access.isUnlimited ? -1 : (access.limit || 0) - (access.currentUsage || 0)
    }
  }
}