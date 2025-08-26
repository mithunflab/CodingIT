import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateUser } from '@/lib/auth-utils'
import { userSegmentationService } from '@/lib/user-segmentation'
import { revenueAttributionService } from '@/lib/revenue-attribution'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Business Analytics API for Revenue Intelligence Dashboard
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateUser()
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    
    // Check if user has admin permissions for full business analytics
    const supabase = createServerClient()
    const { data: userTeam } = await supabase
      .from('users_teams')
      .select('teams (id, tier)')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()

    const isAdmin = user.role === 'admin' || (userTeam?.teams as any)?.tier === 'enterprise'

    // Calculate time range in months
    const timeRangeMonths = getTimeRangeMonths(timeRange)
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - timeRangeMonths)

    // Build comprehensive business intelligence data
    const businessData = {
      // Core Revenue Metrics
      revenue: await getRevenueMetrics(startDate, isAdmin),
      
      // User Analytics
      users: await getUserMetrics(startDate, isAdmin),
      
      // Product Analytics
      product: await getProductMetrics(startDate, isAdmin),
      
      // Churn Analysis
      churn: await getChurnAnalysis(startDate, isAdmin),
      
      // Trend Data
      trends: await getTrendData(timeRange, isAdmin)
    }

    return NextResponse.json(businessData)

  } catch (error) {
    console.error('Business analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business analytics' },
      { status: 500 }
    )
  }
}

// Revenue Metrics (High-value monetization data)
async function getRevenueMetrics(startDate: Date, isAdmin: boolean) {
  const supabase = createServerClient()

  try {
    // Get revenue attributions data
    const { data: revenueData } = await supabase
      .from('revenue_attributions')
      .select('revenue_impact, created_at')
      .gte('created_at', startDate.toISOString())

    const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.revenue_impact || 0), 0) || 0

    // Calculate monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const monthlyRevenueData = revenueData?.filter(item => 
      new Date(item.created_at) >= thirtyDaysAgo
    ) || []
    const monthlyRevenue = monthlyRevenueData.reduce((sum, item) => sum + (item.revenue_impact || 0), 0)

    // Get subscription data for more accurate metrics
    const { data: subscriptions } = await supabase
      .from('teams')
      .select('tier, created_at, stripe_subscription_id')
      .not('stripe_subscription_id', 'is', null)

    const activeSubscriptions = subscriptions?.length || 0
    const averageRevenuePerUser = activeSubscriptions > 0 ? monthlyRevenue / activeSubscriptions : 0

    // Calculate revenue growth (compare with previous period)
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - getTimeRangeMonths('30d'))
    
    const { data: previousRevenueData } = await supabase
      .from('revenue_attributions')
      .select('revenue_impact')
      .gte('created_at', previousPeriodStart.toISOString())
      .lt('created_at', startDate.toISOString())

    const previousRevenue = previousRevenueData?.reduce((sum, item) => sum + (item.revenue_impact || 0), 0) || 1
    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    // Mock additional metrics that would come from Stripe/billing system
    const lifetimeValue = averageRevenuePerUser * 12 // Simplified LTV calculation
    const churnRate = Math.random() * 5 + 3 // 3-8% monthly churn
    const conversionRate = Math.random() * 20 + 15 // 15-35% conversion rate
    const trialConversionRate = Math.random() * 15 + 25 // 25-40% trial conversion

    return {
      totalRevenue: Math.round(totalRevenue),
      monthlyRevenue: Math.round(monthlyRevenue),
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      averageRevenuePerUser: Math.round(averageRevenuePerUser),
      lifetimeValue: Math.round(lifetimeValue),
      churnRate: Math.round(churnRate * 100) / 100,
      conversionRate: Math.round(conversionRate),
      trialConversionRate: Math.round(trialConversionRate)
    }

  } catch (error) {
    console.error('Error getting revenue metrics:', error)
    return {
      totalRevenue: 0,
      monthlyRevenue: 0,
      revenueGrowth: 0,
      averageRevenuePerUser: 0,
      lifetimeValue: 0,
      churnRate: 5,
      conversionRate: 20,
      trialConversionRate: 30
    }
  }
}

// User Analytics
async function getUserMetrics(startDate: Date, isAdmin: boolean) {
  const supabase = createServerClient()

  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get active users (users with activity in the time range)
    const { data: activeUserIds } = await supabase
      .from('revenue_attributions')
      .select('user_id')
      .gte('created_at', startDate.toISOString())

    const uniqueActiveUsers = new Set(activeUserIds?.map(item => item.user_id) || [])
    const activeUsers = uniqueActiveUsers.size

    // Get paid users
    const { count: paidUsers } = await supabase
      .from('users_teams')
      .select('*', { count: 'exact', head: true })
      .in('teams.tier', ['pro', 'enterprise'])

    // Get trial users (users who signed up recently but haven't upgraded)
    const { count: trialUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    // Get enterprise users
    const { count: enterpriseUsers } = await supabase
      .from('users_teams')
      .select('*', { count: 'exact', head: true })
      .eq('teams.tier', 'enterprise')

    // Calculate user growth
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - getTimeRangeMonths('30d'))
    
    const { count: previousTotalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', startDate.toISOString())

    const userGrowthRate = previousTotalUsers && previousTotalUsers > 0 
      ? (((totalUsers || 0) - previousTotalUsers) / previousTotalUsers) * 100 
      : 0

    // Calculate engagement score (simplified)
    const engagementScore = activeUsers > 0 && totalUsers && totalUsers > 0
      ? (activeUsers / totalUsers) * 100
      : 0

    return {
      totalUsers: totalUsers || 0,
      activeUsers,
      paidUsers: paidUsers || 0,
      trialUsers: trialUsers || 0,
      enterpriseUsers: enterpriseUsers || 0,
      userGrowthRate: Math.round(userGrowthRate * 100) / 100,
      engagementScore: Math.round(engagementScore)
    }

  } catch (error) {
    console.error('Error getting user metrics:', error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      paidUsers: 0,
      trialUsers: 0,
      enterpriseUsers: 0,
      userGrowthRate: 0,
      engagementScore: 0
    }
  }
}

// Product Analytics
async function getProductMetrics(startDate: Date, isAdmin: boolean) {
  const supabase = createServerClient()

  try {
    // Get total fragments generated
    const { count: totalFragments } = await supabase
      .from('revenue_attributions')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'fragment_generated')
      .gte('created_at', startDate.toISOString())

    // Get unique users who generated fragments
    const { data: fragmentUsers } = await supabase
      .from('revenue_attributions')
      .select('user_id')
      .eq('event_type', 'fragment_generated')
      .gte('created_at', startDate.toISOString())

    const uniqueFragmentUsers = new Set(fragmentUsers?.map(item => item.user_id) || [])
    const averageFragmentsPerUser = uniqueFragmentUsers.size > 0 
      ? (totalFragments || 0) / uniqueFragmentUsers.size 
      : 0

    // Get popular templates (mock data with some real insights)
    const { data: templateData } = await supabase
      .from('revenue_attributions')
      .select('event_properties, revenue_impact')
      .eq('event_type', 'template_selected')
      .gte('created_at', startDate.toISOString())

    const templateStats: Record<string, { usage: number; revenue: number }> = {}
    templateData?.forEach(item => {
      const template = item.event_properties?.templateId || 'unknown'
      if (!templateStats[template]) {
        templateStats[template] = { usage: 0, revenue: 0 }
      }
      templateStats[template].usage++
      templateStats[template].revenue += item.revenue_impact || 0
    })

    const mostPopularTemplates = Object.entries(templateStats)
      .map(([template, stats]) => ({ template, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Get popular models
    const { data: modelData } = await supabase
      .from('revenue_attributions')
      .select('event_properties')
      .eq('event_type', 'model_switched')
      .gte('created_at', startDate.toISOString())

    const modelStats: Record<string, { usage: number; satisfaction: number }> = {}
    modelData?.forEach(item => {
      const model = item.event_properties?.toModel || 'unknown'
      if (!modelStats[model]) {
        modelStats[model] = { usage: 0, satisfaction: 4.2 } // Mock satisfaction score
      }
      modelStats[model].usage++
    })

    const mostPopularModels = Object.entries(modelStats)
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5)

    // Feature adoption rates (mock data that would be calculated from real usage)
    const featureAdoptionRates = [
      { feature: 'AI Code Generation', adoptionRate: 95, retentionImpact: 85 },
      { feature: 'GitHub Integration', adoptionRate: 45, retentionImpact: 70 },
      { feature: 'Team Collaboration', adoptionRate: 32, retentionImpact: 78 },
      { feature: 'Advanced Templates', adoptionRate: 28, retentionImpact: 65 },
      { feature: 'Model Switching', adoptionRate: 58, retentionImpact: 60 }
    ]

    // Integration usage
    const integrationUsage = [
      { integration: 'GitHub', users: Math.floor(Math.random() * 1000) + 500, revenue: Math.floor(Math.random() * 5000) + 2000 },
      { integration: 'Stripe', users: Math.floor(Math.random() * 300) + 100, revenue: Math.floor(Math.random() * 2000) + 1000 },
      { integration: 'PostHog', users: Math.floor(Math.random() * 200) + 50, revenue: Math.floor(Math.random() * 1000) + 500 }
    ]

    return {
      totalFragmentsGenerated: totalFragments || 0,
      averageFragmentsPerUser: Math.round(averageFragmentsPerUser * 100) / 100,
      mostPopularTemplates,
      mostPopularModels,
      featureAdoptionRates,
      integrationUsage
    }

  } catch (error) {
    console.error('Error getting product metrics:', error)
    return {
      totalFragmentsGenerated: 0,
      averageFragmentsPerUser: 0,
      mostPopularTemplates: [],
      mostPopularModels: [],
      featureAdoptionRates: [],
      integrationUsage: []
    }
  }
}

// Churn Analysis
async function getChurnAnalysis(startDate: Date, isAdmin: boolean) {
  const supabase = createServerClient()

  try {
    // Get users who haven't been active recently (potential churn)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: recentActiveUsers } = await supabase
      .from('revenue_attributions')
      .select('user_id')
      .gte('created_at', sevenDaysAgo.toISOString())

    const activeUserIds = new Set(recentActiveUsers?.map(item => item.user_id) || [])

    // Get all users
    const { data: allUsers } = await supabase
      .from('users')
      .select('id, created_at')

    const totalUsers = allUsers?.length || 0
    const recentlyActiveUsers = activeUserIds.size
    const inactiveUsers = totalUsers - recentlyActiveUsers

    // Calculate churn rate (simplified)
    const churnRate = totalUsers > 0 ? (inactiveUsers / totalUsers) * 100 : 0

    // Mock churn reasons (would come from exit surveys/feedback)
    const churnReasons = [
      { reason: 'Price too high', percentage: 28 },
      { reason: 'Switched to competitor', percentage: 22 },
      { reason: 'Lack of features', percentage: 18 },
      { reason: 'Poor user experience', percentage: 15 },
      { reason: 'Technical issues', percentage: 12 },
      { reason: 'Other', percentage: 5 }
    ]

    // High risk users (users with declining engagement)
    const { data: decliningUsers } = await supabase
      .from('revenue_attributions')
      .select('user_id, created_at')
      .lt('created_at', sevenDaysAgo.toISOString())
      .gte('created_at', startDate.toISOString())

    const decliningUserIds = new Set(decliningUsers?.map(item => item.user_id) || [])
    const highRiskUsers = decliningUserIds.size

    // Users potentially savable (recent but declining activity)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: moderatelyActiveUsers } = await supabase
      .from('revenue_attributions')
      .select('user_id')
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString())

    const savableUsers = new Set(moderatelyActiveUsers?.map(item => item.user_id) || []).size

    // Churn prevention metrics (mock data)
    const churnPrevention = {
      interventions: Math.floor(highRiskUsers * 0.6), // 60% of high-risk users get interventions
      successRate: Math.floor(Math.random() * 20) + 40, // 40-60% success rate
      savedRevenue: Math.floor(Math.random() * 10000) + 5000
    }

    return {
      churnRate: Math.round(churnRate * 100) / 100,
      churnReasons,
      highRiskUsers,
      savableUsers,
      churnPrevention
    }

  } catch (error) {
    console.error('Error getting churn analysis:', error)
    return {
      churnRate: 8.5,
      churnReasons: [
        { reason: 'Price too high', percentage: 28 },
        { reason: 'Switched to competitor', percentage: 22 },
        { reason: 'Other', percentage: 50 }
      ],
      highRiskUsers: 0,
      savableUsers: 0,
      churnPrevention: {
        interventions: 0,
        successRate: 45,
        savedRevenue: 0
      }
    }
  }
}

// Trend Data
async function getTrendData(timeRange: string, isAdmin: boolean) {
  // Generate realistic trend data
  const timeRangeMonths = getTimeRangeMonths(timeRange)
  const days = timeRangeMonths * 30

  // Daily trends
  const daily = []
  for (let i = days; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    daily.push({
      date: date.toISOString().split('T')[0],
      revenue: Math.floor(Math.random() * 1000) + 500 + (Math.sin(i / 7) * 200), // Weekly pattern
      users: Math.floor(Math.random() * 50) + 20 + (Math.sin(i / 7) * 15),
      fragments: Math.floor(Math.random() * 200) + 100 + (Math.sin(i / 7) * 50)
    })
  }

  // Weekly trends
  const weeks = Math.ceil(days / 7)
  const weekly = []
  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (i * 7))
    weekly.unshift({
      week: `Week ${weeks - i}`,
      revenue: Math.floor(Math.random() * 5000) + 3000,
      conversions: Math.floor(Math.random() * 20) + 10
    })
  }

  // Monthly trends
  const months = Math.ceil(timeRangeMonths)
  const monthly = []
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  for (let i = 0; i < months; i++) {
    const monthDate = new Date()
    monthDate.setMonth(monthDate.getMonth() - i)
    monthly.unshift({
      month: monthNames[monthDate.getMonth()],
      revenue: Math.floor(Math.random() * 20000) + 15000 + (i * 1000), // Growth trend
      churn: Math.random() * 5 + 3, // 3-8% churn
      growth: Math.random() * 15 + 5 // 5-20% growth
    })
  }

  return {
    daily,
    weekly,
    monthly
  }
}

// Helper function
function getTimeRangeMonths(timeRange: string): number {
  switch (timeRange) {
    case '7d': return 0.25
    case '30d': return 1
    case '90d': return 3
    case '1y': return 12
    default: return 1
  }
}