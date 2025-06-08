// File: app/settings/billing/page.tsx

"use client";

import * as React from "react";
import { 
  CreditCardIcon, 
  DownloadIcon, 
  ExternalLinkIcon,
  PlusIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  DollarSignIcon,
  TrendingUpIcon,
  GiftIcon,
  ClockIcon,
  BarChart3Icon
} from "lucide-react";

interface Subscription {
  plan: string;
  price: string;
  interval: string;
  status: "active" | "cancelled" | "past_due";
  nextBilling: string;
  cancelAtPeriodEnd?: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "failed";
  downloadUrl: string;
  invoiceNumber: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  lastFour: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
}

interface UsageMetric {
  name: string;
  used: number;
  limit: number;
  unit: string;
}

const mockSubscription: Subscription = {
  plan: "Claude Pro",
  price: "$20",
  interval: "month",
  status: "active",
  nextBilling: "Feb 15, 2024",
  cancelAtPeriodEnd: false
};

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm_1",
    brand: "Visa",
    lastFour: "4242",
    expMonth: "12",
    expYear: "25",
    isDefault: true
  }
];

const mockInvoices: Invoice[] = [
  {
    id: "inv_001",
    date: "Jan 15, 2024",
    amount: "$20.00",
    status: "paid",
    downloadUrl: "#",
    invoiceNumber: "INV-2024-001"
  },
  {
    id: "inv_002", 
    date: "Dec 15, 2023",
    amount: "$20.00",
    status: "paid",
    downloadUrl: "#",
    invoiceNumber: "INV-2023-012"
  },
  {
    id: "inv_003",
    date: "Nov 15, 2023", 
    amount: "$20.00",
    status: "paid",
    downloadUrl: "#",
    invoiceNumber: "INV-2023-011"
  }
];

const mockUsage: UsageMetric[] = [
  {
    name: "Messages",
    used: 847,
    limit: 1000,
    unit: "messages"
  },
  {
    name: "Claude Artifacts",
    used: 23,
    limit: 100,
    unit: "artifacts"
  }
];

export default function BillingPage() {
  const [subscription] = React.useState<Subscription>(mockSubscription);
  const [paymentMethods] = React.useState<PaymentMethod[]>(mockPaymentMethods);
  const [invoices] = React.useState<Invoice[]>(mockInvoices);
  const [usage] = React.useState<UsageMetric[]>(mockUsage);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'cancelled':
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'past_due':
      case 'pending':
        return <AlertCircleIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
        return "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/50 dark:border-green-800";
      case 'cancelled':
      case 'failed':
        return "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/50 dark:border-red-800";
      case 'past_due':
      case 'pending':
        return "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950/50 dark:border-yellow-800";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950/50 dark:border-gray-800";
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500 dark:bg-red-600";
    if (percentage >= 75) return "bg-yellow-500 dark:bg-yellow-600";
    if (percentage >= 50) return "bg-blue-500 dark:bg-blue-600";
    return "bg-green-500 dark:bg-green-600";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Billing</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, payment methods, and billing history.
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg">
                <DollarSignIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-card-foreground">
                  {subscription.plan}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-card-foreground">
                    {subscription.price}
                  </span>
                  <span className="text-base text-muted-foreground">
                    /{subscription.interval}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(subscription.status)}
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(
                    subscription.status
                  )}`}
                >
                  {subscription.status === 'active' ? 'Active' : subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {subscription.cancelAtPeriodEnd 
                    ? `Ends ${subscription.nextBilling}`
                    : `Renews ${subscription.nextBilling}`
                  }
                </span>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800/50 dark:bg-yellow-950/50">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    Your subscription will end on {subscription.nextBilling}. You will keep access until then.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <TrendingUpIcon className="h-4 w-4" />
              Manage plan
            </button>
            {!subscription.cancelAtPeriodEnd && (
              <button className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors">
                Cancel plan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Usage Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3Icon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-medium text-foreground">Usage this month</h3>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {usage.map((metric, index) => {
            const percentage = getUsagePercentage(metric.used, metric.limit);
            const isNearLimit = percentage >= 80;
            
            return (
              <div key={index} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">
                      {metric.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {metric.used.toLocaleString()} / {metric.limit.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(percentage)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    {isNearLimit && (
                      <div className="flex items-center gap-1">
                        <AlertCircleIcon className="h-3 w-3 text-yellow-600 dark:text-yellow-500" />
                        <span className="text-xs text-yellow-700 dark:text-yellow-400">
                          {percentage >= 100 ? 'Limit reached' : 'Approaching limit'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">Payment methods</h3>
          <button className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <PlusIcon className="h-4 w-4" />
            Add payment method
          </button>
        </div>

        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                    <CreditCardIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-card-foreground">
                        {method.brand} •••• {method.lastFour}
                      </span>
                      {method.isDefault && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expires {method.expMonth}/{method.expYear}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Edit
                  </button>
                  <button className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-foreground">Billing history</h3>
          <button className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <ExternalLinkIcon className="h-4 w-4" />
            Manage billing
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 border-b border-border bg-muted/50 p-4 text-sm font-medium text-muted-foreground">
            <div>Date</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Invoice</div>
          </div>
          
          {/* Table Body */}
          {invoices.map((invoice) => (
            <div key={invoice.id} className="grid grid-cols-4 gap-4 p-4 text-sm border-b border-border last:border-b-0 hover:bg-muted/25 transition-colors">
              <div className="text-muted-foreground">
                {formatDate(invoice.date)}
              </div>
              <div className="font-medium text-card-foreground">
                {invoice.amount}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(invoice.status)}
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </div>
              </div>
              <div>
                <button className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <DownloadIcon className="h-3 w-3" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Prompt for Free Users */}
      <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-6 dark:border-orange-800/50 dark:from-orange-950/20 dark:to-amber-950/20">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg flex-shrink-0">
            <GiftIcon className="h-6 w-6" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="text-lg font-semibold text-foreground">
              Get more with Claude Pro
            </h4>
            <p className="text-sm text-muted-foreground">
              5x more usage, access to Claude 3 Opus and Haiku, create Projects to work with Claude around a set of docs, code, or ideas, and early access to new features.
            </p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md">
              <TrendingUpIcon className="h-4 w-4" />
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}