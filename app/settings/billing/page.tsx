'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Download, AlertTriangle } from 'lucide-react'

interface Invoice {
  id: string
  date: string
  total: string
  status: 'paid' | 'pending' | 'failed'
}

export default function BillingSettings() {
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      date: '2024-01-01',
      total: '$29.00',
      status: 'paid'
    },
    {
      id: 'INV-002', 
      date: '2023-12-01',
      total: '$29.00',
      status: 'paid'
    },
    {
      id: 'INV-003',
      date: '2023-11-01', 
      total: '$29.00',
      status: 'paid'
    }
  ]

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Paid</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Billing</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, payment methods, and billing history.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pro Plan</CardTitle>
          <CardDescription>
            Your current subscription and plan details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">CodinIT Pro</h4>
              <p className="text-sm text-muted-foreground">
                Unlimited projects, advanced AI features, and priority support
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary">Active</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Billing cycle</p>
              <p className="font-medium">Monthly</p>
            </div>
            <div>
              <p className="text-muted-foreground">Next billing date</p>
              <p className="font-medium">February 1, 2024</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline">Manage subscription</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Update your payment information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-muted p-2">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">•••• •••• •••• 4242</p>
              <p className="text-sm text-muted-foreground">Expires 12/2027</p>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Download your billing statements and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
              <div>Date</div>
              <div>Total</div>
              <div>Status</div>
              <div>Actions</div>
            </div>
            
            <Separator />
            
            {invoices.map((invoice) => (
              <div key={invoice.id} className="grid grid-cols-4 gap-4 items-center text-sm">
                <div>{new Date(invoice.date).toLocaleDateString()}</div>
                <div className="font-medium">{invoice.total}</div>
                <div>{getStatusBadge(invoice.status)}</div>
                <div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancellation
          </CardTitle>
          <CardDescription>
            Cancel your subscription at any time. You will continue to have access until the end of your current billing period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full">
            Cancel subscription
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}