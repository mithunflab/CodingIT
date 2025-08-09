'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  CreditCard, 
  Download, 
  Calendar,
  AlertTriangle,
  Loader2,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  Users,
  Server,
  Database
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useFeatureFlag, useFeatureValue } from '@/hooks/use-edge-flags'
import ErrorBoundary, { SettingsSection } from '@/components/error-boundary'

interface BillingInfo {
  subscription: {
    plan: string
    status: 'active' | 'canceled' | 'past_due'
    current_period_end: string
    cancel_at_period_end: boolean
  }
  payment_method: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  } | null
  usage: {
    fragments_used: number
    fragments_limit: number
    storage_used: number
    storage_limit: number
  }
}

interface Invoice {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  invoice_url?: string
}

export default function BillingSettings() {
  const { session, userTeam } = useAuth(() => {}, () => {})
  const { toast } = useToast()
  
  // Feature flags
  const { enabled: hasAdvancedAnalytics } = useFeatureFlag('advanced-analytics', false)
  const { value: userSubscriptionTier } = useFeatureValue<'free' | 'pro' | 'enterprise'>('subscription-tier', 'free')

  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [analyticsData, setAnalyticsData] = useState({
    totalExecutions: 1247,
    executionTrend: '+12.5%',
    averageExecutionTime: '2.3s',
    successRate: '98.7%',
    totalStorage: '12.4 GB',
    apiCalls: 8542,
    activeUsers: 23,
    peakUsageHour: '2:00 PM'
  })


  useEffect(() => {
    if (!session?.user?.id) return
    
    // Set up a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Billing data loading timeout, using defaults')
        setIsLoading(false)
      }
    }, 5000)

    const loadBillingInfo = async () => {
      setIsLoading(true)
      try {


        const userTier = userTeam?.tier || 'free'
        
        const mockBillingInfo: BillingInfo = {
          subscription: {
            plan: userTier,
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            cancel_at_period_end: false
          },
          payment_method: userTier !== 'free' ? {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025
          } : null,
          usage: {
            fragments_used: 45,
            fragments_limit: userTier === 'free' ? 50 : 1000,
            storage_used: 2.4,
            storage_limit: userTier === 'free' ? 5 : 100
          }
        }

        const mockInvoices: Invoice[] = userTier !== 'free' ? [
          {
            id: 'inv_001',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 2000, // $20.00 in cents
            status: 'paid',
            invoice_url: '#'
          },
          {
            id: 'inv_002',
            date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 2000,
            status: 'paid',
            invoice_url: '#'
          }
        ] : []

        setBillingInfo(mockBillingInfo)
        setInvoices(mockInvoices)
      } catch (error) {
        console.error('Error loading billing info:', error)
        toast({
          title: "Error",
          description: "Failed to load billing information. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        clearTimeout(loadingTimeout)
      }
    }

    loadBillingInfo()
    
    // Cleanup timeout on unmount
    return () => {
      clearTimeout(loadingTimeout)
    }
  }, [session?.user?.id, userTeam?.tier, toast, isLoading])

  const handleUpgradePlan = async () => {
    setIsUpdating(true)
    try {

      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      toast({
        title: "Redirecting to Checkout",
        description: "You'll be redirected to complete your upgrade.",
      })
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast({
        title: "Error",
        description: "Failed to initiate upgrade. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return
    }

    setIsUpdating(true)
    try {

      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
      
      if (billingInfo) {
        setBillingInfo({
          ...billingInfo,
          subscription: {
            ...billingInfo.subscription,
            cancel_at_period_end: true
          }
        })
      }

      toast({
        title: "Subscription Canceled",
        description: "Your subscription will be canceled at the end of your current billing period.",
      })
    } catch (error) {
      console.error('Error canceling subscription:', error)
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePaymentMethod = async () => {
    setIsUpdating(true)
    try {

      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate redirect
      
      toast({
        title: "Redirecting to Payment Portal",
        description: "You'll be redirected to update your payment method.",
      })
    } catch (error) {
      console.error('Error updating payment method:', error)
      toast({
        title: "Error",
        description: "Failed to open payment portal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': 
      case 'paid':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'failed':
      case 'past_due':
        return 'destructive'
      case 'canceled':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
      case 'past_due':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Billing</h2>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and billing information.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium flex items-center gap-2">
          Billing
          {hasAdvancedAnalytics && (
            <Badge variant="default" className="gap-1">
              <BarChart3 className="w-3 h-3" />
              Analytics
            </Badge>
          )}
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>

      {hasAdvancedAnalytics && (
        <SettingsSection
          title="Advanced Usage Analytics"
          description="Detailed insights and metrics for your platform usage"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Usage Analytics
                <Badge variant="default" className="gap-1">
                  <Zap className="w-3 h-3" />
                  Advanced
                </Badge>
              </CardTitle>
              <CardDescription>
                Detailed insights into your platform usage and performance
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Executions</span>
                </div>
                <div className="text-2xl font-bold">{analyticsData.totalExecutions.toLocaleString()}</div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {analyticsData.executionTrend} this month
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Avg Execution Time</span>
                </div>
                <div className="text-2xl font-bold">{analyticsData.averageExecutionTime}</div>
                <div className="text-xs text-gray-600">Per workflow execution</div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Success Rate</span>
                </div>
                <div className="text-2xl font-bold">{analyticsData.successRate}</div>
                <div className="text-xs text-gray-600">All executions</div>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Active Users</span>
                </div>
                <div className="text-2xl font-bold">{analyticsData.activeUsers}</div>
                <div className="text-xs text-gray-600">This month</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4" />
                  <span className="text-sm font-medium">Storage Used</span>
                </div>
                <div className="text-lg font-bold">{analyticsData.totalStorage}</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-4 h-4" />
                  <span className="text-sm font-medium">API Calls</span>
                </div>
                <div className="text-lg font-bold">{analyticsData.apiCalls.toLocaleString()}</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Peak Usage</span>
                </div>
                <div className="text-lg font-bold">{analyticsData.peakUsageHour}</div>
              </div>
            </div>
            
            {userSubscriptionTier === 'free' && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Upgrade to Pro for detailed analytics and custom reports
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </SettingsSection>
      )}
      
      <SettingsSection
        title="Subscription Plan"
        description="Manage your current subscription and view usage details"
      >
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your current subscription plan and usage details.
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold capitalize">
                  {billingInfo?.subscription.plan} Plan
                </h3>
                <Badge variant={getStatusColor(billingInfo?.subscription.status || '')}>
                  {getStatusIcon(billingInfo?.subscription.status || '')}
                  <span className="ml-1 capitalize">{billingInfo?.subscription.status}</span>
                </Badge>
              </div>
              {billingInfo?.subscription.cancel_at_period_end && (
                <p className="text-sm text-muted-foreground mt-1">
                  Cancels on {formatDate(billingInfo.subscription.current_period_end)}
                </p>
              )}
              {billingInfo && !billingInfo.subscription.cancel_at_period_end && billingInfo.subscription.plan !== 'free' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Renews on {formatDate(billingInfo.subscription.current_period_end)}
                </p>
              )}
            </div>
            
            <div className="text-right">
              {billingInfo?.subscription.plan === 'free' ? (
                <Button onClick={handleUpgradePlan} disabled={isUpdating}>
                  {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Upgrade Plan
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleUpgradePlan} disabled={isUpdating}>
                    Change Plan
                  </Button>
                  {!billingInfo?.subscription.cancel_at_period_end && (
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelSubscription}
                      disabled={isUpdating}
                    >
                      {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fragments Used</span>
                <span>{billingInfo?.usage.fragments_used} / {billingInfo?.usage.fragments_limit}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, (billingInfo?.usage.fragments_used || 0) / (billingInfo?.usage.fragments_limit || 1) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Storage Used</span>
                <span>{billingInfo?.usage.storage_used}GB / {billingInfo?.usage.storage_limit}GB</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(100, (billingInfo?.usage.storage_used || 0) / (billingInfo?.usage.storage_limit || 1) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SettingsSection>

      
      {billingInfo?.payment_method && (
        <SettingsSection
          title="Payment Method"
          description="Manage your default payment method for subscription charges"
        >
          <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Your default payment method for subscription charges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium capitalize">
                    {billingInfo.payment_method.brand} ending in {billingInfo.payment_method.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires {billingInfo.payment_method.exp_month}/{billingInfo.payment_method.exp_year}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleUpdatePaymentMethod}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </SettingsSection>
      )}

      
      <SettingsSection
        title="Billing History"
        description="View and download your past invoices and receipts"
      >
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          <CardDescription>
            Download your past invoices and receipts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formatDate(invoice.date)}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(invoice.status)}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1 capitalize">{invoice.status}</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatCurrency(invoice.amount)}</span>
                    {invoice.invoice_url && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No billing history available</p>
              <p className="text-sm text-muted-foreground">
                {billingInfo?.subscription.plan === 'free' 
                  ? 'Upgrade to a paid plan to see billing history'
                  : 'Your invoices will appear here after your first billing cycle'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </SettingsSection>

      
      <ErrorBoundary
        fallback={
          <Card className="border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Support Contact Unavailable</p>
                  <p className="text-sm text-muted-foreground">
                    Support contact features are temporarily unavailable. Please try again later.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      >
        <Card>
        <CardHeader>
          <CardTitle>Billing Contact</CardTitle>
          <CardDescription>
            Questions about your bill? Get in touch with our billing team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium">Need help with billing?</p>
                <p className="text-sm text-muted-foreground">
                  Contact our support team for billing questions or issues
                </p>
              </div>
            </div>
            <Button variant="outline">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </ErrorBoundary>
    </div>
  )
}