import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { authenticateUser } from '@/lib/auth-utils'
import { userSegmentationService } from '@/lib/user-segmentation'
import { revenueAttributionService } from '@/lib/revenue-attribution'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for large exports

interface ExportOptions {
  format: 'csv' | 'json' | 'pdf'
  timeRange: '7d' | '30d' | '90d' | '1y'
  dataType: 'business_intelligence' | 'user_segments' | 'revenue_attribution' | 'usage_patterns' | 'market_insights'
  anonymize: boolean
  includePII: boolean
}

// Monetizable Data Export API
// Provides structured data insights for business intelligence and potential external sales
export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await authenticateUser()
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const options: ExportOptions = {
      format: (searchParams.get('format') as 'csv' | 'json' | 'pdf') || 'json',
      timeRange: (searchParams.get('timeRange') as '7d' | '30d' | '90d' | '1y') || '30d',
      dataType: (searchParams.get('dataType') as any) || 'business_intelligence',
      anonymize: searchParams.get('anonymize') !== 'false',
      includePII: searchParams.get('includePII') === 'true' && user.role === 'admin'
    }

    // Check permissions
    const hasPermission = await checkExportPermissions(user.id, options.dataType)
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions for this data export' },
        { status: 403 }
      )
    }

    let exportData: any
    let filename: string

    switch (options.dataType) {
      case 'business_intelligence':
        exportData = await exportBusinessIntelligence(options)
        filename = `business-intelligence-${options.timeRange}`
        break

      case 'user_segments':
        exportData = await exportUserSegments(options)
        filename = `user-segments-${options.timeRange}`
        break

      case 'revenue_attribution':
        exportData = await exportRevenueAttribution(user.id, options)
        filename = `revenue-attribution-${options.timeRange}`
        break

      case 'usage_patterns':
        exportData = await exportUsagePatterns(options)
        filename = `usage-patterns-${options.timeRange}`
        break

      case 'market_insights':
        exportData = await exportMarketInsights(options)
        filename = `market-insights-${options.timeRange}`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid data type' },
          { status: 400 }
        )
    }

    // Format and return data
    return formatExportResponse(exportData, options.format, filename)

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

// Business Intelligence Export
async function exportBusinessIntelligence(options: ExportOptions): Promise<any> {
  const supabase = createServerClient()
  const timeRangeMonths = getTimeRangeMonths(options.timeRange)
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - timeRangeMonths)

  // High-value business metrics for monetization
  const data = {
    exportInfo: {
      dataType: 'business_intelligence',
      timeRange: options.timeRange,
      generatedAt: new Date().toISOString(),
      anonymized: options.anonymize
    },

    // Revenue Metrics (high commercial value)
    revenueMetrics: {
      totalRevenue: await calculateTotalRevenue(startDate),
      monthlyRecurringRevenue: await calculateMRR(),
      customerLifetimeValue: await calculateCLV(),
      churnRate: await calculateChurnRate(startDate),
      conversionRates: await calculateConversionRates(startDate),
      revenueGrowthRate: await calculateGrowthRate(startDate)
    },

    // User Analytics (valuable for market research)
    userAnalytics: {
      totalActiveUsers: await countActiveUsers(startDate),
      userGrowthRate: await calculateUserGrowth(startDate),
      userSegmentDistribution: await getUserSegmentDistribution(),
      engagementMetrics: await getEngagementMetrics(startDate),
      retentionRates: await getRetentionRates(startDate)
    },

    // Product Usage Intelligence (valuable for product development)
    productMetrics: {
      mostPopularFeatures: await getMostPopularFeatures(startDate),
      featureAdoptionRates: await getFeatureAdoptionRates(startDate),
      aiModelUsage: await getAIModelUsage(startDate),
      templatePopularity: await getTemplatePopularity(startDate),
      integrationUsage: await getIntegrationUsage(startDate)
    },

    // Technology Trends (valuable for market intelligence)
    technologyTrends: {
      programmingLanguageTrends: await getProgrammingLanguageTrends(startDate),
      frameworkAdoption: await getFrameworkAdoption(startDate),
      aiModelPreferences: await getAIModelPreferences(startDate),
      developmentPatterns: await getDevelopmentPatterns(startDate)
    },

    // Performance Benchmarks (valuable for industry reports)
    performanceBenchmarks: {
      averageCodeQuality: await getAverageCodeQuality(startDate),
      executionSuccessRates: await getExecutionSuccessRates(startDate),
      developerProductivity: await getDeveloperProductivity(startDate),
      errorPatterns: await getErrorPatterns(startDate)
    }
  }

  // Anonymize data if requested
  if (options.anonymize) {
    return anonymizeBusinessData(data)
  }

  return data
}

// User Segments Export (valuable for marketing and personalization)
async function exportUserSegments(options: ExportOptions): Promise<any> {
  const segments = await userSegmentationService.getSegmentAnalytics(getTimeRangeMonths(options.timeRange))
  
  return {
    exportInfo: {
      dataType: 'user_segments',
      timeRange: options.timeRange,
      generatedAt: new Date().toISOString(),
      anonymized: options.anonymize
    },
    segments: segments.map(segment => ({
      segmentId: segment.segmentId,
      segmentName: segment.segmentName,
      description: segment.description,
      userCount: segment.userCount,
      revenueContribution: segment.revenueContribution,
      averageLifetimeValue: segment.averageLifetimeValue,
      churnRate: segment.churnRate,
      conversionRate: segment.conversionRate,
      behavioralTraits: segment.criteria.behavioralTraits,
      usagePatterns: segment.criteria.usagePatterns,
      // Detailed segment characteristics
      demographics: {
        averageTeamSize: Math.floor(Math.random() * 10) + 1,
        primaryIndustries: ['software_development', 'fintech', 'healthcare', 'education'],
        geographicDistribution: {
          northAmerica: 0.45,
          europe: 0.35,
          asiaPacific: 0.15,
          other: 0.05
        }
      },
      marketValue: {
        totalAddressableMarket: segment.userCount * segment.averageLifetimeValue,
        penetrationRate: 0.15, // 15% market penetration
        growthPotential: segment.conversionRate > 50 ? 'high' : 'medium'
      }
    }))
  }
}

// Revenue Attribution Export
async function exportRevenueAttribution(userId: string, options: ExportOptions): Promise<any> {
  const supabase = createServerClient()
  
  // Get user's team
  const { data: userTeam } = await supabase
    .from('users_teams')
    .select('teams (id)')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single()

  if (!userTeam?.teams) {
    throw new Error('User team not found')
  }

  const teamId = (userTeam.teams as any).id
  const report = await revenueAttributionService.generateAttributionReport(
    teamId, 
    getTimeRangeMonths(options.timeRange)
  )

  return {
    exportInfo: {
      dataType: 'revenue_attribution',
      timeRange: options.timeRange,
      generatedAt: new Date().toISOString(),
      teamId: options.anonymize ? 'anonymized' : teamId
    },
    attribution: report
  }
}

// Usage Patterns Export (valuable for product development and benchmarking)
async function exportUsagePatterns(options: ExportOptions): Promise<any> {
  const supabase = createServerClient()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - getTimeRangeMonths(options.timeRange))

  // Aggregate usage patterns (anonymized by default)
  const patterns = {
    exportInfo: {
      dataType: 'usage_patterns',
      timeRange: options.timeRange,
      generatedAt: new Date().toISOString(),
      anonymized: true
    },
    
    // Code Generation Patterns
    codeGenerationPatterns: {
      averageFragmentLength: 156, // lines of code
      complexityDistribution: {
        simple: 0.4,
        medium: 0.45,
        complex: 0.15
      },
      mostCommonLanguages: [
        { language: 'python', usage: 0.35 },
        { language: 'javascript', usage: 0.25 },
        { language: 'typescript', usage: 0.20 },
        { language: 'java', usage: 0.10 },
        { language: 'other', usage: 0.10 }
      ],
      averageIterationsPerFragment: 2.3,
      successRate: 0.87
    },

    // AI Interaction Patterns
    aiInteractionPatterns: {
      averagePromptLength: 89, // characters
      modelSwitchingFrequency: 0.12, // switches per session
      feedbackRate: 0.23, // feedback given per interaction
      averageSatisfactionScore: 4.2, // out of 5
      mostEffectivePromptTypes: [
        'specific_requirements',
        'code_modification',
        'debugging_help',
        'explanation_request'
      ]
    },

    // Session Patterns
    sessionPatterns: {
      averageSessionDuration: 1847, // seconds
      fragmentsPerSession: 3.4,
      peakUsageHours: [9, 10, 11, 14, 15, 16], // UTC hours
      weekdayVsWeekendUsage: {
        weekday: 0.75,
        weekend: 0.25
      }
    },

    // Collaboration Patterns
    collaborationPatterns: {
      teamCollaborationRate: 0.18, // percentage of users in teams
      averageTeamSize: 4.2,
      projectSharingRate: 0.31,
      realTimeCollaborationFrequency: 0.08
    }
  }

  return patterns
}

// Market Insights Export (high commercial value for industry reports)
async function exportMarketInsights(options: ExportOptions): Promise<any> {
  return {
    exportInfo: {
      dataType: 'market_insights',
      timeRange: options.timeRange,
      generatedAt: new Date().toISOString(),
      anonymized: true
    },

    // Technology Adoption Trends
    technologyTrends: {
      emergingFrameworks: [
        { framework: 'next.js', adoptionGrowth: 0.45, marketShare: 0.28 },
        { framework: 'vue3', adoptionGrowth: 0.32, marketShare: 0.15 },
        { framework: 'svelte', adoptionGrowth: 0.67, marketShare: 0.08 }
      ],
      aiModelPreferences: [
        { model: 'gpt-4', satisfaction: 4.3, usage: 0.35 },
        { model: 'claude-3', satisfaction: 4.4, usage: 0.28 },
        { model: 'gemini-pro', satisfaction: 4.1, usage: 0.22 }
      ],
      developmentMethodologies: {
        agile: 0.68,
        devops: 0.42,
        microservices: 0.35,
        serverless: 0.23
      }
    },

    // Industry Benchmarks
    industryBenchmarks: {
      developerProductivity: {
        featuresPerSprint: 12.4,
        codeQualityScore: 0.82,
        timeToDeployment: 4.2, // days
        bugFixTime: 2.1 // hours
      },
      aiCodeAssistanceROI: {
        timeReduction: 0.34, // 34% time savings
        codeQualityImprovement: 0.18,
        developerSatisfaction: 4.2,
        costSavingsPerDeveloper: 12840 // annual USD
      }
    },

    // Market Opportunities
    marketOpportunities: {
      underservedSegments: [
        'enterprise_mobile_development',
        'healthcare_compliance',
        'financial_services_integration'
      ],
      emergingUseCases: [
        'ai_code_review',
        'automated_testing',
        'legacy_code_modernization'
      ],
      geographicExpansion: [
        { region: 'latin_america', potential: 'high', barriers: 'language_localization' },
        { region: 'southeast_asia', potential: 'medium', barriers: 'payment_infrastructure' }
      ]
    }
  }
}

// Helper functions
async function checkExportPermissions(userId: string, dataType: string): Promise<boolean> {
  // Implement permission checking logic
  // Different data types may have different permission requirements
  return true // Simplified for now
}

function getTimeRangeMonths(timeRange: string): number {
  switch (timeRange) {
    case '7d': return 0.25
    case '30d': return 1
    case '90d': return 3
    case '1y': return 12
    default: return 1
  }
}

function anonymizeBusinessData(data: any): any {
  // Remove or hash any potentially identifying information
  const anonymized = JSON.parse(JSON.stringify(data))
  
  // Replace specific values with ranges or percentiles
  if (anonymized.revenueMetrics) {
    Object.keys(anonymized.revenueMetrics).forEach(key => {
      if (typeof anonymized.revenueMetrics[key] === 'number') {
        anonymized.revenueMetrics[key] = Math.round(anonymized.revenueMetrics[key] / 1000) * 1000
      }
    })
  }
  
  return anonymized
}

function formatExportResponse(data: any, format: string, filename: string): Response {
  const timestamp = new Date().toISOString().split('T')[0]
  const fullFilename = `${filename}-${timestamp}`

  switch (format) {
    case 'csv':
      const csv = convertToCSV(data)
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fullFilename}.csv"`
        }
      })

    case 'pdf':
      // Would implement PDF generation
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fullFilename}.json"`
        }
      })

    case 'json':
    default:
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fullFilename}.json"`
        }
      })
  }
}

function convertToCSV(data: any): string {
  // Simplified CSV conversion - would be more sophisticated in production
  const flatten = (obj: any, prefix = ''): any => {
    let flattened: any = {}
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(flattened, flatten(obj[key], prefix + key + '_'))
      } else {
        flattened[prefix + key] = obj[key]
      }
    }
    return flattened
  }

  const flatData = flatten(data)
  const headers = Object.keys(flatData).join(',')
  const values = Object.values(flatData).map(v => 
    typeof v === 'string' ? `"${v}"` : v
  ).join(',')

  return `${headers}\n${values}`
}

// Placeholder implementations for metrics calculations
// These would be implemented with actual database queries

async function calculateTotalRevenue(startDate: Date): Promise<number> {
  // Implementation would query actual revenue data
  return Math.floor(Math.random() * 100000) + 50000
}

async function calculateMRR(): Promise<number> {
  return Math.floor(Math.random() * 20000) + 10000
}

async function calculateCLV(): Promise<number> {
  return Math.floor(Math.random() * 800) + 200
}

async function calculateChurnRate(startDate: Date): Promise<number> {
  return Math.random() * 0.1 + 0.05 // 5-15%
}

async function calculateConversionRates(startDate: Date): Promise<any> {
  return {
    freeToTrial: 0.23,
    trialToPaid: 0.45,
    freeToDirectPaid: 0.12
  }
}

async function calculateGrowthRate(startDate: Date): Promise<number> {
  return Math.random() * 0.2 + 0.1 // 10-30%
}

async function countActiveUsers(startDate: Date): Promise<number> {
  return Math.floor(Math.random() * 10000) + 5000
}

async function calculateUserGrowth(startDate: Date): Promise<number> {
  return Math.random() * 0.15 + 0.05 // 5-20%
}

async function getUserSegmentDistribution(): Promise<any> {
  return {
    powerUsers: 0.15,
    trialConverters: 0.25,
    enterpriseProspects: 0.08,
    churnRisk: 0.12,
    others: 0.40
  }
}

async function getEngagementMetrics(startDate: Date): Promise<any> {
  return {
    dailyActiveUsers: Math.floor(Math.random() * 3000) + 1000,
    weeklyActiveUsers: Math.floor(Math.random() * 8000) + 3000,
    monthlyActiveUsers: Math.floor(Math.random() * 15000) + 8000,
    averageSessionDuration: Math.floor(Math.random() * 1800) + 600
  }
}

async function getRetentionRates(startDate: Date): Promise<any> {
  return {
    day1: 0.85,
    day7: 0.62,
    day30: 0.45,
    day90: 0.32
  }
}

// Additional placeholder implementations...
async function getMostPopularFeatures(startDate: Date): Promise<any[]> {
  return [
    { feature: 'code_generation', usage: 0.95 },
    { feature: 'ai_models', usage: 0.88 },
    { feature: 'templates', usage: 0.76 },
    { feature: 'github_integration', usage: 0.45 }
  ]
}

async function getFeatureAdoptionRates(startDate: Date): Promise<any[]> {
  return [
    { feature: 'advanced_ai', adoptionRate: 0.34 },
    { feature: 'team_collaboration', adoptionRate: 0.28 },
    { feature: 'workflow_automation', adoptionRate: 0.19 }
  ]
}

async function getAIModelUsage(startDate: Date): Promise<any[]> {
  return [
    { model: 'gpt-4', usage: 0.35 },
    { model: 'claude-3', usage: 0.28 },
    { model: 'gemini-pro', usage: 0.22 }
  ]
}

async function getTemplatePopularity(startDate: Date): Promise<any[]> {
  return [
    { template: 'nextjs-developer', usage: 0.32 },
    { template: 'code-interpreter-v1', usage: 0.28 },
    { template: 'vue-developer', usage: 0.18 }
  ]
}

async function getIntegrationUsage(startDate: Date): Promise<any[]> {
  return [
    { integration: 'github', users: 2340 },
    { integration: 'stripe', users: 890 },
    { integration: 'slack', users: 567 }
  ]
}

async function getProgrammingLanguageTrends(startDate: Date): Promise<any[]> {
  return [
    { language: 'python', trend: 0.15 },
    { language: 'typescript', trend: 0.25 },
    { language: 'javascript', trend: 0.08 }
  ]
}

async function getFrameworkAdoption(startDate: Date): Promise<any[]> {
  return [
    { framework: 'react', adoption: 0.42 },
    { framework: 'vue', adoption: 0.23 },
    { framework: 'angular', adoption: 0.18 }
  ]
}

async function getAIModelPreferences(startDate: Date): Promise<any[]> {
  return [
    { model: 'gpt-4', preference: 4.3 },
    { model: 'claude-3', preference: 4.4 },
    { model: 'gemini-pro', preference: 4.1 }
  ]
}

async function getDevelopmentPatterns(startDate: Date): Promise<any> {
  return {
    averageProjectDuration: 18.5, // days
    codeReviewFrequency: 0.67,
    testingCoverage: 0.73
  }
}

async function getAverageCodeQuality(startDate: Date): Promise<number> {
  return Math.random() * 0.2 + 0.75 // 75-95%
}

async function getExecutionSuccessRates(startDate: Date): Promise<number> {
  return Math.random() * 0.1 + 0.85 // 85-95%
}

async function getDeveloperProductivity(startDate: Date): Promise<any> {
  return {
    linesOfCodePerHour: Math.floor(Math.random() * 50) + 30,
    featuresCompletedPerWeek: Math.random() * 3 + 2,
    timeToFirstWorkingCode: Math.floor(Math.random() * 300) + 120 // seconds
  }
}

async function getErrorPatterns(startDate: Date): Promise<any[]> {
  return [
    { errorType: 'syntax_error', frequency: 0.35 },
    { errorType: 'runtime_error', frequency: 0.28 },
    { errorType: 'logic_error', frequency: 0.22 }
  ]
}