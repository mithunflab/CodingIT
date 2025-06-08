"use client";

import * as React from "react";
import { CreditCardIcon, DownloadIcon, ExternalLinkIcon } from "lucide-react";

interface Subscription {
  plan: string;
  price: string;
  interval: string;
  status: "active" | "cancelled" | "past_due";
  nextBilling: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "failed";
  downloadUrl: string;
}

const mockSubscription: Subscription = {
  plan: "Pro Plan",
  price: "$29",
  interval: "month",
  status: "active",
  nextBilling: "Feb 15, 2024"
};

const mockInvoices: Invoice[] = [
  {
    id: "inv_001",
    date: "Jan 15, 2024",
    amount: "$29.00",
    status: "paid",
    downloadUrl: "#"
  },
  {
    id: "inv_002", 
    date: "Dec 15, 2023",
    amount: "$29.00",
    status: "paid",
    downloadUrl: "#"
  },
  {
    id: "inv_003",
    date: "Nov 15, 2023", 
    amount: "$29.00",
    status: "paid",
    downloadUrl: "#"
  }
];

export default function BillingPage() {
  const [subscription] = React.useState<Subscription>(mockSubscription);
  const [invoices] = React.useState<Invoice[]>(mockInvoices);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "paid":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950";
      case "pending":
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950";
      case "cancelled":
      case "failed":
        return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950";
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950";
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Billing & Subscriptions</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, payment methods, and billing history.
        </p>
      </div>

      {/* Current Subscription */}
      <div className="space-y-4">
        <h4 className="text-base font-medium">Current Subscription</h4>
        <div className="rounded-lg border p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div>
                <h5 className="text-lg font-semibold">{subscription.plan}</h5>
                <p className="text-2xl font-bold">
                  {subscription.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{subscription.interval}
                  </span>
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                    subscription.status
                  )}`}
                >
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  Next billing: {subscription.nextBilling}
                </span>
              </div>

              <div className="space-y-2">
                <h6 className="text-sm font-medium">Plan includes:</h6>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Unlimited AI conversations</li>
                  <li>• Advanced code generation</li>
                  <li>• Priority support</li>
                  <li>• Custom integrations</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <button className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
                Change plan
              </button>
              <button className="block rounded-md border px-4 py-2 text-sm text-destructive hover:bg-destructive/10">
                Cancel subscription
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-4">
        <h4 className="text-base font-medium">Payment Method</h4>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                <CreditCardIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-medium">•••• •••• •••• 4242</div>
                <div className="text-xs text-muted-foreground">Expires 12/25</div>
              </div>
            </div>
            <div className="space-x-2">
              <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                Update
              </button>
              <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                Remove
              </button>
            </div>
          </div>
        </div>
        
        <button className="rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground hover:bg-accent">
          + Add payment method
        </button>
      </div>

      {/* Billing History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-medium">Billing History</h4>
          <button className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
            <ExternalLinkIcon className="h-3 w-3" />
            Customer portal
          </button>
        </div>
        
        <div className="rounded-lg border">
          <div className="grid grid-cols-4 gap-4 border-b bg-muted/50 p-4 text-sm font-medium">
            <div>Date</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
          
          {invoices.map((invoice) => (
            <div key={invoice.id} className="grid grid-cols-4 gap-4 p-4 text-sm">
              <div>{invoice.date}</div>
              <div className="font-medium">{invoice.amount}</div>
              <div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
              <div>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <DownloadIcon className="h-3 w-3" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage & Limits */}
      <div className="space-y-4">
        <h4 className="text-base font-medium">Usage & Limits</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Calls</span>
                <span className="text-sm text-muted-foreground">2,847 / 10,000</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 w-[28%] rounded-full bg-primary"></div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage</span>
                <span className="text-sm text-muted-foreground">1.2 GB / 5 GB</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 w-[24%] rounded-full bg-primary"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}