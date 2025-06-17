"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Download, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Plus,
  Trash2,
  Star,
  Zap,
  Crown
} from "lucide-react";
import { useBillingStore } from "@/lib/stores/billingStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const plans = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    description: "Perfect for getting started",
    icon: <Zap className="h-5 w-5" />,
    features: [
      "5 projects",
      "Basic AI assistance", 
      "Community support",
      "1GB storage",
      "Standard templates"
    ],
    limits: {
      projects: 5,
      storage: 1024, // MB
      aiRequests: 100
    }
  },
  {
    id: "pro",
    name: "Pro",
    price: 20,
    interval: "month",
    description: "For serious developers",
    icon: <Star className="h-5 w-5" />,
    features: [
      "Unlimited projects",
      "Advanced AI features",
      "Priority support",
      "10GB storage",
      "Premium templates",
      "Custom integrations"
    ],
    limits: {
      projects: -1, // unlimited
      storage: 10240, // MB
      aiRequests: 1000
    },
    popular: true
  },
  {
    id: "enterprise",
    name: "Enterprise", 
    price: 99,
    interval: "month",
    description: "For teams and organizations",
    icon: <Crown className="h-5 w-5" />,
    features: [
      "Everything in Pro",
      "Team collaboration",
      "Advanced security",
      "100GB storage",
      "Custom branding",
      "SLA guarantee",
      "Dedicated support"
    ],
    limits: {
      projects: -1,
      storage: 102400, // MB
      aiRequests: 10000
    }
  }
];

export default function BillingPage() {
  const {
    subscription,
    paymentMethods,
    invoices,
    usage,
    isLoading,
    error,
    fetchSubscription,
    fetchPaymentMethods,
    fetchInvoices,
    fetchUsage,
    removePaymentMethod,
    setDefaultPaymentMethod,
    changePlan,
    downloadInvoice,
    clearError
  } = useBillingStore();

  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load billing data on mount
  useEffect(() => {
    const loadBillingData = async () => {
      try {
        await Promise.all([
          fetchSubscription(),
          fetchPaymentMethods(),
          fetchInvoices(),
          fetchUsage()
        ]);
      } catch (err) {
        console.error("Error loading billing data:", err);
      }
    };

    loadBillingData();
  }, [fetchSubscription, fetchPaymentMethods, fetchInvoices, fetchUsage]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error, clearError]);

  const handlePlanChange = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    try {
      await changePlan(planId, plan.name, plan.price * 100, plan.interval as 'month' | 'year');
      setSuccess(`Successfully changed to ${plan.name} plan!`);
      setShowPlanDialog(false);
    } catch (err) {
      console.error("Error changing plan:", err);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      await downloadInvoice(invoiceId);
      setSuccess("Invoice download started!");
    } catch (err) {
      console.error("Error downloading invoice:", err);
    }
  };



  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const currentPlan = subscription ? plans.find(p => p.id === subscription.plan_id) : plans[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Billing & Subscription</h2>
          <p className="text-muted-foreground">
            Manage your subscription, billing, and usage.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPaymentDialog(true)}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </Button>
          <Button
            onClick={() => setShowPlanDialog(true)}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentPlan?.icon}
            Current Plan: {currentPlan?.name}
            {currentPlan?.popular && (
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Popular
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {currentPlan?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {currentPlan?.price === 0 ? "Free" : formatCurrency(currentPlan?.price! * 100)}
                {currentPlan?.price !== 0 && (
                  <span className="text-base font-normal text-muted-foreground">
                    /{currentPlan?.interval}
                  </span>
                )}
              </div>
              {subscription && subscription.current_period_end && (
                <p className="text-sm text-muted-foreground">
                  {subscription.cancel_at_period_end ? "Expires" : "Renews"} on{" "}
                  {formatDate(subscription.current_period_end)}
                </p>
              )}
            </div>
            <Badge
              variant={subscription?.status === "active" ? "default" : "secondary"}
              className="capitalize"
            >
              {subscription?.status || "Free"}
            </Badge>
          </div>

          {subscription?.cancel_at_period_end && (
            <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your subscription is set to cancel at the end of the current billing period.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>
            Your current usage for this billing period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usage.length === 0 ? (
            <p className="text-muted-foreground">No usage data available.</p>
          ) : (
            usage.map((metric) => {
              const percentage = metric.limit_count 
                ? (metric.usage_count / metric.limit_count) * 100 
                : 0;
              
              return (
                <div key={metric.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="capitalize">
                      {metric.metric_name.replace('_', ' ')}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      {metric.usage_count}
                      {metric.limit_count && ` / ${metric.limit_count}`}
                    </span>
                  </div>
                  {metric.limit_count && (
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Billing Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                Download your invoices and view payment history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-muted-foreground">No invoices found.</p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {invoice.invoice_number || `Invoice #${invoice.id.slice(0, 8)}`}
                          </span>
                          <Badge
                            variant={invoice.status === "paid" ? "default" : "secondary"}
                            className="capitalize"
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(invoice.created_at)} • {formatCurrency(invoice.amount_paid, invoice.currency)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice.id)}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage your payment methods and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-6">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payment methods added.</p>
                  <Button
                    onClick={() => setShowPaymentDialog(true)}
                    className="mt-4"
                  >
                    Add Payment Method
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">
                              {method.brand} •••• {method.last_four}
                            </span>
                            {method.is_default && (
                              <Badge variant="outline">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Expires {method.exp_month}/{method.exp_year}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!method.is_default && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDefaultPaymentMethod(method.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePaymentMethod(method.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setShowPaymentDialog(true)}
                    className="w-full flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Payment Method
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Change Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Choose Your Plan</DialogTitle>
            <DialogDescription>
              Select the plan that best fits your needs. You can change or cancel anytime.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative cursor-pointer transition-all ${
                  selectedPlan === plan.id ? "ring-2 ring-primary" : ""
                } ${plan.popular ? "border-primary" : ""}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="mx-auto mb-2">{plan.icon}</div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-2xl font-bold">
                    {plan.price === 0 ? "Free" : formatCurrency(plan.price * 100)}
                    {plan.price !== 0 && (
                      <span className="text-base font-normal text-muted-foreground">
                        /{plan.interval}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPlanDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedPlan && handlePlanChange(selectedPlan)}
              disabled={!selectedPlan || selectedPlan === currentPlan?.id}
            >
              {selectedPlan === currentPlan?.id ? "Current Plan" : "Change Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new payment method to your account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Cardholder Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setShowPaymentDialog(false)}>
              Add Payment Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}