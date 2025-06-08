import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@supabase/supabase-js'

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  plan_id: string
  plan_name: string
  price_amount: number // in cents
  price_currency: string
  interval_type: 'month' | 'year'
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | 'unpaid'
  current_period_start?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  canceled_at?: string
  trial_start?: string
  trial_end?: string
  created_at: string
  updated_at: string
}

export interface PaymentMethod {
  id: string
  user_id: string
  stripe_payment_method_id: string
  type: string
  brand?: string
  last_four?: string
  exp_month?: number
  exp_year?: number
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  user_id: string
  subscription_id?: string
  stripe_invoice_id: string
  amount_paid: number // in cents
  amount_due: number // in cents
  currency: string
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  invoice_pdf?: string
  hosted_invoice_url?: string
  invoice_number?: string
  due_date?: string
  paid_at?: string
  created_at: string
  updated_at: string
}

export interface UsageMetric {
  id: string
  user_id: string
  subscription_id?: string
  metric_name: string
  usage_count: number
  limit_count?: number
  reset_period: 'daily' | 'monthly' | 'yearly'
  last_reset: string
  created_at: string
  updated_at: string
}

interface BillingState {
  subscription: Subscription | null
  paymentMethods: PaymentMethod[]
  invoices: Invoice[]
  usage: UsageMetric[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchSubscription: () => Promise<void>
  fetchPaymentMethods: () => Promise<void>
  fetchInvoices: () => Promise<void>
  fetchUsage: () => Promise<void>
  updateSubscription: (updates: Partial<Subscription>) => Promise<void>
  addPaymentMethod: (paymentMethod: Omit<PaymentMethod, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  removePaymentMethod: (paymentMethodId: string) => Promise<void>
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>
  cancelSubscription: () => Promise<void>
  reactivateSubscription: () => Promise<void>
  changePlan: (planId: string, planName: string, priceAmount: number, interval: 'month' | 'year') => Promise<void>
  downloadInvoice: (invoiceId: string) => Promise<void>
  clearError: () => void
  reset: () => void
}
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are not set')
}

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      subscription: null,
      paymentMethods: [],
      invoices: [],
      usage: [],
      isLoading: false,
      error: null,

      fetchSubscription: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          const response = await fetch(`/api/billing/subscription?userId=${user.id}`)
          const result = await response.json()

          if (!response.ok) throw new Error(result.error)

          set({ subscription: result.subscription, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      fetchPaymentMethods: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          const response = await fetch(`/api/billing/payment-methods?userId=${user.id}`)
          const result = await response.json()

          if (!response.ok) throw new Error(result.error)

          set({ paymentMethods: result.paymentMethods || [], isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      fetchInvoices: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          const response = await fetch(`/api/billing/invoices?userId=${user.id}`)
          const result = await response.json()

          if (!response.ok) throw new Error(result.error)

          set({ invoices: result.invoices || [], isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      fetchUsage: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          const response = await fetch(`/api/billing/usage?userId=${user.id}`)
          const result = await response.json()

          if (!response.ok) throw new Error(result.error)

          set({ usage: result.usage || [], isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      updateSubscription: async (updates) => {
        const { subscription } = get()
        if (!subscription) return

        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/billing/subscription', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId: subscription.id,
              updates
            })
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error)

          set({ subscription: result.subscription, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      addPaymentMethod: async (paymentMethodData) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          const response = await fetch('/api/billing/payment-methods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              ...paymentMethodData
            })
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error)

          set(state => ({ 
            paymentMethods: [result.paymentMethod, ...state.paymentMethods],
            isLoading: false 
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      removePaymentMethod: async (paymentMethodId) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          const response = await fetch(`/api/billing/payment-methods?paymentMethodId=${paymentMethodId}&userId=${user.id}`, {
            method: 'DELETE'
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error)

          set(state => ({
            paymentMethods: state.paymentMethods.filter(pm => pm.id !== paymentMethodId),
            isLoading: false
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      setDefaultPaymentMethod: async (paymentMethodId) => {
        set({ isLoading: true, error: null })
        
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          const response = await fetch('/api/billing/payment-methods', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentMethodId,
              userId: user.id,
              isDefault: true
            })
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error)

          set(state => ({
            paymentMethods: state.paymentMethods.map(pm => ({
              ...pm,
              is_default: pm.id === paymentMethodId
            })),
            isLoading: false
          }))
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      cancelSubscription: async () => {
        const { subscription } = get()
        if (!subscription) return

        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/billing/subscription', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId: subscription.id,
              updates: {
                cancel_at_period_end: true,
                status: 'canceled',
                canceled_at: new Date().toISOString()
              }
            })
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error)

          set({ subscription: result.subscription, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      reactivateSubscription: async () => {
        const { subscription } = get()
        if (!subscription) return

        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/billing/subscription', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId: subscription.id,
              updates: {
                cancel_at_period_end: false,
                status: 'active',
                canceled_at: null
              }
            })
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error)

          set({ subscription: result.subscription, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      changePlan: async (planId, planName, priceAmount, interval) => {
        const { subscription } = get()
        if (!subscription) return

        set({ isLoading: true, error: null })
        
        try {
          const response = await fetch('/api/billing/subscription', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscriptionId: subscription.id,
              updates: {
                plan_id: planId,
                plan_name: planName,
                price_amount: priceAmount,
                interval_type: interval
              }
            })
          })

          const result = await response.json()
          if (!response.ok) throw new Error(result.error)

          set({ subscription: result.subscription, isLoading: false })
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false })
        }
      },

      downloadInvoice: async (invoiceId) => {
        try {
          const invoice = get().invoices.find(inv => inv.id === invoiceId)
          if (invoice?.hosted_invoice_url) {
            window.open(invoice.hosted_invoice_url, '_blank')
          }
        } catch (error) {
          set({ error: (error as Error).message })
        }
      },

      clearError: () => set({ error: null }),

      reset: () => set({
        subscription: null,
        paymentMethods: [],
        invoices: [],
        usage: [],
        isLoading: false,
        error: null
      }),
    }),
    {
      name: 'billing-store',
      partialize: (state) => ({
        subscription: state.subscription,
        paymentMethods: state.paymentMethods,
        invoices: state.invoices,
        usage: state.usage
      }),
    }
  )
)