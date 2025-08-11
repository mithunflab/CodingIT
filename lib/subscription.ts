import { createServerClient } from './supabase-server'
import { stripe, PlanTier, getPlanByPriceId } from './stripe'

export interface TeamSubscription {
  id: string
  name: string
  email?: string
  tier: PlanTier
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete'
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
}

export interface UsageLimit {
  usage_type: 'github_imports' | 'storage_mb' | 'execution_time_seconds' | 'api_calls'
  limit_value: number
  current_usage: number
  period_start: string
  period_end: string
}

export interface SubscriptionEvent {
  team_id: string
  stripe_event_id: string
  event_type: string
  event_data: any
  processed_at: string
}

export async function getTeamSubscription(teamId: string): Promise<TeamSubscription | null> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .single()

  if (error || !data) {
    console.error('Error fetching team subscription:', error)
    return null
  }

  return data as TeamSubscription
}

export async function getTeamUsageLimits(teamId: string): Promise<UsageLimit[]> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase
    .from('team_usage_limits')
    .select('*')
    .eq('team_id', teamId)

  if (error) {
    console.error('Error fetching usage limits:', error)
    return []
  }

  return data as UsageLimit[]
}

export async function canUseFeature(
  teamId: string, 
  featureType: UsageLimit['usage_type'], 
  requestedAmount: number = 1
): Promise<boolean> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase.rpc('can_use_feature', {
    team_uuid: teamId,
    feature_type: featureType,
    requested_amount: requestedAmount
  })

  if (error) {
    console.error('Error checking feature access:', error)
    return false
  }

  return data as boolean
}

export async function incrementUsage(
  teamId: string, 
  featureType: UsageLimit['usage_type'], 
  amount: number = 1
): Promise<boolean> {
  const supabase = createServerClient()
  
  const { data, error } = await supabase.rpc('increment_usage', {
    team_uuid: teamId,
    feature_type: featureType,
    amount: amount
  })

  if (error) {
    console.error('Error incrementing usage:', error)
    return false
  }

  return data as boolean
}

export async function initializeTeamLimits(teamId: string, tier: PlanTier = 'free'): Promise<void> {
  const supabase = createServerClient()
  
  const { error } = await supabase.rpc('initialize_team_usage_limits', {
    team_uuid: teamId,
    tier_name: tier
  })

  if (error) {
    console.error('Error initializing team limits:', error)
    throw error
  }
}

export async function createStripeCustomer(
  teamId: string, 
  email: string, 
  name: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  const customer = await stripe!.customers.create({
    email,
    name,
    metadata: {
      team_id: teamId
    }
  })

  // Update team with Stripe customer ID
  const supabase = createServerClient()
  const { error } = await supabase
    .from('teams')
    .update({ stripe_customer_id: customer.id })
    .eq('id', teamId)

  if (error) {
    console.error('Error updating team with Stripe customer ID:', error)
    throw error
  }

  return customer.id
}

export async function createCheckoutSession(
  teamId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  const team = await getTeamSubscription(teamId)
  if (!team) {
    throw new Error('Team not found')
  }

  let customerId = team.stripe_customer_id
  
  // Create Stripe customer if doesn't exist
  if (!customerId) {
    customerId = await createStripeCustomer(teamId, team.email || '', team.name)
  }

  const session = await stripe!.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      team_id: teamId
    }
  })

  return session.url!
}

export async function createPortalSession(teamId: string, returnUrl: string): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe not configured')
  }

  const team = await getTeamSubscription(teamId)
  if (!team?.stripe_customer_id) {
    throw new Error('No Stripe customer found')
  }

  const session = await stripe!.billingPortal.sessions.create({
    customer: team.stripe_customer_id,
    return_url: returnUrl,
  })

  return session.url
}

export async function handleSubscriptionEvent(event: any): Promise<void> {
  const supabase = createServerClient(true) // Use service role
  
  // Log the event
  await supabase.from('subscription_events').insert({
    team_id: event.data.object.metadata?.team_id,
    stripe_event_id: event.id,
    event_type: event.type,
    event_data: event.data.object,
    processed_at: new Date().toISOString()
  })

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object)
      break
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object)
      break
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object)
      break
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object)
      break
  }
}

async function handleSubscriptionUpdated(subscription: any): Promise<void> {
  const supabase = createServerClient(true)
  const teamId = subscription.metadata?.team_id
  
  if (!teamId) {
    console.error('No team_id in subscription metadata')
    return
  }

  const planTier = getPlanByPriceId(subscription.items.data[0].price.id)
  
  const { error } = await supabase
    .from('teams')
    .update({
      tier: planTier,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end
    })
    .eq('id', teamId)

  if (error) {
    console.error('Error updating team subscription:', error)
    throw error
  }

  // Update usage limits based on new tier
  if (planTier) {
    await initializeTeamLimits(teamId, planTier)
  }
}

async function handleSubscriptionDeleted(subscription: any): Promise<void> {
  const supabase = createServerClient(true)
  const teamId = subscription.metadata?.team_id
  
  if (!teamId) return

  const { error } = await supabase
    .from('teams')
    .update({
      tier: 'free',
      subscription_status: 'canceled',
      cancel_at_period_end: false
    })
    .eq('id', teamId)

  if (error) {
    console.error('Error handling subscription deletion:', error)
    throw error
  }

  // Reset to free tier limits
  await initializeTeamLimits(teamId, 'free')
}

async function handlePaymentSucceeded(invoice: any): Promise<void> {
  const supabase = createServerClient(true)
  const subscriptionId = invoice.subscription
  
  if (!subscriptionId) return

  // Update subscription status to active
  const { error } = await supabase
    .from('teams')
    .update({ subscription_status: 'active' })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating payment success:', error)
  }
}

async function handlePaymentFailed(invoice: any): Promise<void> {
  const supabase = createServerClient(true)
  const subscriptionId = invoice.subscription
  
  if (!subscriptionId) return

  // Update subscription status based on invoice status
  const status = invoice.status === 'open' ? 'past_due' : 'unpaid'
  
  const { error } = await supabase
    .from('teams')
    .update({ subscription_status: status })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating payment failure:', error)
  }
}

export function getUsagePercentage(currentUsage: number, limit: number): number {
  if (limit === -1) return 0 // Unlimited
  return Math.min(100, (currentUsage / limit) * 100)
}

export function isUsageLimitReached(currentUsage: number, limit: number): boolean {
  if (limit === -1) return false // Unlimited
  return currentUsage >= limit
}

export function getRemainingUsage(currentUsage: number, limit: number): number {
  if (limit === -1) return -1 // Unlimited
  return Math.max(0, limit - currentUsage)
}