"use client"

import React, { useState } from "react"
import SettingsLayout from "@/components/settings-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { 
  Shield, 
  Database, 
  Eye, 
  Download,
  Trash2,
  Globe,
  UserCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  MapPin,
  Clock,
  BarChart3
} from "lucide-react"

interface PrivacySettings {
  dataRetention: "7days" | "30days" | "90days" | "1year" | "indefinite"
  conversationHistory: boolean
  personalizedResponses: boolean
  analytics: boolean
  locationMetadata: boolean
  emailNotifications: boolean
  marketingEmails: boolean
  productUpdates: boolean
  researchParticipation: boolean
  thirdPartyIntegrations: boolean
  aiTraining: boolean
  shareAnonymizedData: boolean
}

const retentionOptions = [
  { value: "7days", label: "7 days", description: "Conversations deleted after 7 days" },
  { value: "30days", label: "30 days", description: "Conversations deleted after 30 days" },
  { value: "90days", label: "90 days", description: "Conversations deleted after 90 days" },
  { value: "1year", label: "1 year", description: "Conversations deleted after 1 year" },
  { value: "indefinite", label: "Keep indefinitely", description: "Conversations stored permanently" }
]

export default function PrivacyPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<PrivacySettings>({
    dataRetention: "indefinite",
    conversationHistory: true,
    personalizedResponses: true,
    analytics: false,
    locationMetadata: false,
    emailNotifications: true,
    marketingEmails: false,
    productUpdates: true,
    researchParticipation: false,
    thirdPartyIntegrations: true,
    aiTraining: false,
    shareAnonymizedData: false
  })

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleExportData = () => {
    toast({
      title: "Data export requested",
      description: "Your data export will be available for download within 24 hours.",
    })
  }

  const handleDeleteAllData = () => {
    toast({
      title: "Data deletion requested", 
      description: "All your conversation data has been scheduled for deletion.",
      variant: "destructive"
    })
  }

  const handleSaveSettings = () => {
    toast({
      title: "Privacy settings updated",
      description: "Your privacy preferences have been saved successfully.",
    })
  }

  return (
    <SettingsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Privacy</h1>
          <p className="text-muted-foreground mt-2">
            Control how your data is collected, used, and stored by Claude.
          </p>
        </div>

        {/* Data Protection Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Data Protection
            </CardTitle>
            <CardDescription>
              Anthropics commitment to protecting your privacy and data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Your data is protected by design.</strong> We use industry-standard encryption and security practices to keep your information safe.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">End-to-end encryption</h4>
                  <p className="text-sm text-muted-foreground">Your conversations are encrypted in transit and at rest</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">No training by default</h4>
                  <p className="text-sm text-muted-foreground">We dont train AI models on your conversations unless you opt in</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <Database className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Data minimization</h4>
                  <p className="text-sm text-muted-foreground">We only collect data thats necessary for functionality</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 border rounded-lg">
                <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium">Transparent policies</h4>
                  <p className="text-sm text-muted-foreground">Clear privacy policy and data usage explanations</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Read Privacy Policy
              </Button>
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Security Center
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Data Retention
            </CardTitle>
            <CardDescription>
              Control how long your conversation data is stored.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Conversation History Retention</Label>
              <Select value={settings.dataRetention} onValueChange={(value) => handleSettingChange("dataRetention", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {retentionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose how long to keep your conversation history. Shorter retention periods enhance privacy but may limit personalization.
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Save conversation history</Label>
                <p className="text-sm text-muted-foreground">
                  Allow Claude to remember context from previous conversations
                </p>
              </div>
              <Switch
                checked={settings.conversationHistory}
                onCheckedChange={(checked) => handleSettingChange("conversationHistory", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Usage & AI Training
            </CardTitle>
            <CardDescription>
              Control how your data is used to improve Claude and AI safety.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Personalized responses
                  <Badge variant="secondary">Recommended</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Use your conversation history to provide more relevant and helpful responses
                </p>
              </div>
              <Switch
                checked={settings.personalizedResponses}
                onCheckedChange={(checked) => handleSettingChange("personalizedResponses", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">AI model training</Label>
                <p className="text-sm text-muted-foreground">
                  Allow your conversations to be used to improve AI safety and capabilities
                </p>
              </div>
              <Switch
                checked={settings.aiTraining}
                onCheckedChange={(checked) => handleSettingChange("aiTraining", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Share anonymized usage data</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve Claude by sharing anonymized usage patterns and performance metrics
                </p>
              </div>
              <Switch
                checked={settings.shareAnonymizedData}
                onCheckedChange={(checked) => handleSettingChange("shareAnonymizedData", checked)}
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>About AI training:</strong> When enabled, your conversations may be used to train future AI models to be more helpful, harmless, and honest. All data is carefully reviewed and processed according to our safety guidelines.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Analytics & Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics & Tracking
            </CardTitle>
            <CardDescription>
              Manage data collection for product analytics and research.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Usage analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Allow collection of anonymized usage data to improve the product experience
                </p>
              </div>
              <Switch
                checked={settings.analytics}
                onCheckedChange={(checked) => handleSettingChange("analytics", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-2">
                  Location metadata
                  <MapPin className="h-3 w-3" />
                </Label>
                <p className="text-sm text-muted-foreground">
                  Use coarse location data (city/region) to provide relevant local information
                </p>
              </div>
              <Switch
                checked={settings.locationMetadata}
                onCheckedChange={(checked) => handleSettingChange("locationMetadata", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Research participation</Label>
                <p className="text-sm text-muted-foreground">
                  Participate in optional research studies to advance AI safety and capabilities
                </p>
              </div>
              <Switch
                checked={settings.researchParticipation}
                onCheckedChange={(checked) => handleSettingChange("researchParticipation", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Communications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Communications
            </CardTitle>
            <CardDescription>
              Manage how Anthropic communicates with you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Essential notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Security alerts, policy updates, and account-related notifications
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Product updates</Label>
                <p className="text-sm text-muted-foreground">
                  New features, improvements, and product announcements
                </p>
              </div>
              <Switch
                checked={settings.productUpdates}
                onCheckedChange={(checked) => handleSettingChange("productUpdates", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Marketing communications</Label>
                <p className="text-sm text-muted-foreground">
                  Tips, best practices, and promotional content about Claude
                </p>
              </div>
              <Switch
                checked={settings.marketingEmails}
                onCheckedChange={(checked) => handleSettingChange("marketingEmails", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Third-party Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Third-party Integrations
            </CardTitle>
            <CardDescription>
              Manage data sharing with connected services and applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Allow third-party integrations</Label>
                <p className="text-sm text-muted-foreground">
                  Enable Claude to work with external apps and services you connect
                </p>
              </div>
              <Switch
                checked={settings.thirdPartyIntegrations}
                onCheckedChange={(checked) => handleSettingChange("thirdPartyIntegrations", checked)}
              />
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Third-party integrations may have their own privacy policies. Review each integrations data usage before connecting.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Data Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Controls
            </CardTitle>
            <CardDescription>
              Access, export, or delete your personal data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Export your data</h4>
                  <p className="text-sm text-muted-foreground">Download all your conversations and account data</p>
                </div>
                <Button variant="outline" onClick={handleExportData} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div>
                  <h4 className="font-medium text-destructive">Delete all data</h4>
                  <p className="text-sm text-muted-foreground">Permanently delete all your conversation data</p>
                </div>
                <Button variant="destructive" onClick={handleDeleteAllData} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Data exports include conversation history, preferences, and account information. Exports are delivered via email within 24 hours.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} size="lg" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Save Privacy Settings
          </Button>
        </div>
      </div>
    </SettingsLayout>
  )
}