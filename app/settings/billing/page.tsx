"use client"

import React, { useState } from "react"
import SettingsLayout from "@/components/settings-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { 
  CreditCard, 
  Calendar, 
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  Crown,
  Zap,
  Users,
  BarChart3,
  FileText,
  ExternalLink,
  Plus,
  Edit,
  Trash2
} from "lucide-react"

interface Subscription {
  plan: "free" | "pro" | "team"
  status: "active" | "cancelled" | "past_due"
  currentPeriodEnd: string
  nextBillingDate: string
  amount: number
  currency: string
  interval: "monthly" | "yearly"
  autoRenew: boolean
}

interface Usage {
  messagesUsed: number
  messagesLimit: number
  currentPeriod: string
  resetDate: string
}

interface PaymentMethod {
  id: string
  type: "card"
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  isDefault: boolean
}

interface Invoice {
  id: string
  date: string
  amount: number
  status: "paid" | "pending" | "failed"
  description: string
  downloadUrl: string
}

const planFeatures = {
  free: [
    "Limited messages per day",
    "Standard response time",
    "Basic features",
    "Community support"
  ],
  pro: [
    "Unlimited messages",
    "Priority response time", 
    "Advanced features",
    "Priority support",
    "Early access to new features"
  ],
  team: [
    "Everything in Pro",
    "Team collaboration",
    "Admin controls",
    "Usage analytics",
    "Dedicated support",
    "Custom integrations"
  ]
}

export default function BillingPage() {
  const { toast } = useToast()
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)

  const [subscription] = useState<Subscription>({
    plan: "pro",
    status: "active",
    currentPeriodEnd: "2025-07-11",
    nextBillingDate: "June 11, 2025",
    amount: 20,
    currency: "USD",
    interval: "monthly",
    autoRenew: true
  })

  const [usage] = useState<Usage>({
    messagesUsed: 1250,
    messagesLimit: -1, // Unlimited for pro
    currentPeriod: "June 1 - June 30, 2025",
    resetDate: "July 1, 2025"
  })

  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      brand: "visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2026,
      isDefault: true
    }
  ])

  const [invoices] = useState<Invoice[]>([
    {
      id: "inv_001",
      date: "May 11, 2025",
      amount: 20,
      status: "paid",
      description: "CodinIT Pro - Monthly",
      downloadUrl: "#"
    },
    {
      id: "inv_002", 
      date: "April 11, 2025",
      amount: 20,
      status: "paid",
      description: "CodinIT Pro - Monthly",
      downloadUrl: "#"
    },
    {
      id: "inv_003",
      date: "March 11, 2025", 
      amount: 20,
      status: "paid",
      description: "CodinIT Pro - Monthly",
      downloadUrl: "#"
    }
  ])

  const handleCancelSubscription = () => {
    toast({
      title: "Subscription cancelled",
      description: "Your subscription will remain active until the end of your current billing period.",
      variant: "destructive"
    })
    setShowCancelDialog(false)
  }

  const handleUpgrade = (newPlan: string) => {
    toast({
      title: "Plan upgraded",
      description: `Successfully upgraded to ${newPlan} plan.`,
    })
    setShowUpgradeDialog(false)
  }

  const handleUpdatePayment = () => {
    toast({
      title: "Payment method updated",
      description: "Your payment method has been successfully updated.",
    })
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "free": return <Users className="h-5 w-5" />
      case "pro": return <Crown className="h-5 w-5" />
      case "team": return <BarChart3 className="h-5 w-5" />
      default: return <Users className="h-5 w-5" />
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "free": return "text-gray-600"
      case "pro": return "text-purple-600"
      case "team": return "text-blue-600"
      default: return "text-gray-600"
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return (
    <SettingsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Billing</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription, billing information, and usage.
          </p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPlanIcon(subscription.plan)}
              <span className="capitalize">{subscription.plan} Plan</span>
              <Badge variant={subscription.status === "active" ? "default" : "destructive"} className="ml-2">
                {subscription.status === "active" ? "Active" : "Cancelled"}
              </Badge>
            </CardTitle>
            <CardDescription>
              Your current subscription and billing information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Current Plan</Label>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-lg capitalize ${getPlanColor(subscription.plan)}`}>
                    {subscription.plan}
                  </span>
                  {subscription.plan === "pro" && <Crown className="h-4 w-4 text-purple-600" />}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                <div className="text-lg font-semibold">
                  {formatCurrency(subscription.amount, subscription.currency)}
                  <span className="text-sm font-normal text-muted-foreground">/{subscription.interval}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Next Billing</Label>
                <div className="text-lg font-semibold">{subscription.nextBillingDate}</div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Plan Features</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {planFeatures[subscription.plan].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {subscription.plan === "free" ? "Upgrade Plan" : "Change Plan"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Choose Your Plan</DialogTitle>
                    <DialogDescription>
                      Select the plan that best fits your needs.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                    {/* Free Plan */}
                    <Card className={subscription.plan === "free" ? "border-primary" : ""}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Free
                        </CardTitle>
                        <div className="text-2xl font-bold">$0<span className="text-sm font-normal">/month</span></div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {planFeatures.free.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button 
                          variant={subscription.plan === "free" ? "secondary" : "outline"} 
                          className="w-full"
                          disabled={subscription.plan === "free"}
                        >
                          {subscription.plan === "free" ? "Current Plan" : "Downgrade"}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Pro Plan */}
                    <Card className={subscription.plan === "pro" ? "border-primary" : ""}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-purple-600" />
                          Pro
                          <Badge variant="secondary">Popular</Badge>
                        </CardTitle>
                        <div className="text-2xl font-bold">$20<span className="text-sm font-normal">/month</span></div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {planFeatures.pro.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button 
                          variant={subscription.plan === "pro" ? "secondary" : "default"} 
                          className="w-full"
                          disabled={subscription.plan === "pro"}
                          onClick={() => handleUpgrade("Pro")}
                        >
                          {subscription.plan === "pro" ? "Current Plan" : "Upgrade to Pro"}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Team Plan */}
                    <Card className={subscription.plan === "team" ? "border-primary" : ""}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          Team
                        </CardTitle>
                        <div className="text-2xl font-bold">$50<span className="text-sm font-normal">/month</span></div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {planFeatures.team.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button 
                          variant={subscription.plan === "team" ? "secondary" : "default"} 
                          className="w-full"
                          disabled={subscription.plan === "team"}
                          onClick={() => handleUpgrade("Team")}
                        >
                          {subscription.plan === "team" ? "Current Plan" : "Upgrade to Team"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                      Cancel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {subscription.status === "active" && (
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Cancel Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Cancel Subscription
                      </DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel your subscription? Youll lose access to Pro features at the end of your billing period.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Your subscription will remain active until {subscription.currentPeriodEnd}</strong>
                        <br />
                        After that, youll be downgraded to the Free plan with limited features.
                      </AlertDescription>
                    </Alert>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Keep Subscription
                      </Button>
                      <Button variant="destructive" onClick={handleCancelSubscription}>
                        Cancel Subscription
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage
            </CardTitle>
            <CardDescription>
              Your current usage for this billing period.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Messages</Label>
                  <span className="text-sm text-muted-foreground">
                    {subscription.plan === "pro" ? "Unlimited" : `${usage.messagesUsed.toLocaleString()} / ${usage.messagesLimit.toLocaleString()}`}
                  </span>
                </div>
                {subscription.plan !== "pro" && (
                  <Progress 
                    value={(usage.messagesUsed / usage.messagesLimit) * 100} 
                    className="h-2"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {subscription.plan === "pro" 
                    ? `${usage.messagesUsed.toLocaleString()} messages used this month`
                    : `${(usage.messagesLimit - usage.messagesUsed).toLocaleString()} messages remaining`
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Billing Period</Label>
                <p className="text-sm">{usage.currentPeriod}</p>
                <p className="text-xs text-muted-foreground">
                  Resets on {usage.resetDate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>
              Manage your payment methods and billing information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-6 bg-primary rounded flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{method.brand}</span>
                      <span className="text-muted-foreground">•••• {method.last4}</span>
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleUpdatePayment}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>
              View and download your past invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{invoice.description}</span>
                        <Badge variant={invoice.status === "paid" ? "default" : "destructive"}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{formatCurrency(invoice.amount, subscription.currency)}</span>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {invoices.length} invoices
              </p>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View All Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}

function Label({ className, children, ...props }: { className?: string; children: React.ReactNode }) {
  return <div className={className} {...props}>{children}</div>
}