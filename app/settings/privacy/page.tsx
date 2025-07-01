'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Shield, Download, Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function PrivacySettings() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-lg font-medium">Data Privacy</h2>
          <p className="text-sm text-muted-foreground">
            Learn how we protect and use your data, and manage your privacy preferences.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How we protect your data</CardTitle>
          <CardDescription>
            We take your privacy seriously and implement industry-standard security measures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ul className="space-y-2 text-sm">
              <li>• All data is encrypted in transit and at rest using AES-256 encryption</li>
              <li>• We use secure cloud infrastructure with regular security audits</li>
              <li>• Access to your data is strictly limited to authorized personnel</li>
              <li>• We implement multi-factor authentication for all admin accounts</li>
              <li>• Regular backups are maintained with end-to-end encryption</li>
              <li>• We comply with GDPR, CCPA, and other international privacy regulations</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How we use your data</CardTitle>
          <CardDescription>
            Understanding what data we collect and how it is used to improve your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ul className="space-y-2 text-sm">
              <li>• <strong>Account information:</strong> Used for authentication and account management</li>
              <li>• <strong>Project data:</strong> Stored to enable collaboration and version control</li>
              <li>• <strong>Usage analytics:</strong> Anonymized data to improve platform features and performance</li>
              <li>• <strong>Communication data:</strong> Support messages and feedback to provide better assistance</li>
              <li>• <strong>AI interactions:</strong> Prompts and responses to train and improve our AI models</li>
              <li>• <strong>Integration data:</strong> Connected service information for seamless workflow integration</li>
              <li>• <strong>Billing information:</strong> Payment details for subscription management (processed by secure third parties)</li>
            </ul>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>We never:</strong> Sell your personal data to third parties, use your project code for training without permission, 
              or access your private repositories without explicit consent.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Controls</CardTitle>
          <CardDescription>
            Manage your data and privacy preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">Usage Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Help us improve the platform by sharing anonymized usage data
              </p>
            </div>
            <Switch
              checked={analyticsEnabled}
              onCheckedChange={setAnalyticsEnabled}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Data Export</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Download a copy of all your data in a portable format.
              </p>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Request data export
              </Button>
            </div>

            <div>
              <h4 className="font-medium mb-2">Account Deletion</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>
            Questions about privacy or data handling? Get in touch with our team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            For privacy-related inquiries, please contact our Data Protection Officer at:
          </p>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> privacy@codinit.dev</p>
            <p><strong>Address:</strong> CodinIT Privacy Team, 123 Tech Street, San Francisco, CA 94105</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}