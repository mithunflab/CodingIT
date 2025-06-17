"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Shield, Eye, EyeOff, Users, Globe, Save, AlertCircle, CheckCircle, Download, Trash2, Lock } from "lucide-react";
import { getUserSettings, updateUserSettings, type UserSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const userSettings = await getUserSettings();
        setSettings(userSettings);
        setError(null);
      } catch (err) {
        setError("Failed to load privacy settings. Please try again.");
        console.error("Error loading settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleSettingChange = (field: keyof UserSettings, value: string | boolean) => {
    if (!settings) return;
    
    setSettings((prev: UserSettings | null) => prev ? { ...prev, [field]: value } : null);
    setHasChanges(true);
    setSuccess(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!settings || !hasChanges) return;

    try {
      setIsSaving(true);
      setError(null);
      
      const result = await updateUserSettings(settings);
      
      if (result.success) {
        setSuccess("Privacy settings updated successfully!");
        setHasChanges(false);
      } else {
        setError(result.error?.message || "Failed to update settings. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error updating settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataExport = () => {
    setSuccess("Data export request submitted. You'll receive an email with your data within 24 hours.");
  };

  const handleAccountDeletion = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.")) {
      setError("Account deletion is not yet implemented. Please contact support for assistance.");
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Globe className="h-4 w-4" />;
      case "contacts":
        return <Users className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "contacts":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <Alert className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load privacy settings. Please refresh the page and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Privacy & Security</h2>
          <p className="text-muted-foreground">
            Control how your information is shared and used.
          </p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
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

      {/* Visibility & Discovery */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility & Discovery</CardTitle>
          <CardDescription>
            Control how others can find and interact with you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Profile Visibility</Label>
            <Select
              value={settings.profile_visibility}
              onValueChange={(value) => handleSettingChange("profile_visibility", value as "public" | "private" | "contacts")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Public - Anyone can see your profile
                  </div>
                </SelectItem>
                <SelectItem value="contacts">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contacts - Only your contacts can see your profile
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Private - Your profile is hidden
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Badge className={getVisibilityColor(settings.profile_visibility)}>
              {getVisibilityIcon(settings.profile_visibility)}
              <span className="ml-1">
                {settings.profile_visibility === "public" ? "Public" : 
                 settings.profile_visibility === "contacts" ? "Contacts Only" : "Private"}
              </span>
            </Badge>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="activityStatus">Activity Status</Label>
              <p className="text-sm text-muted-foreground">
                Show when you are online and active
              </p>
            </div>
            <Switch
              id="activityStatus"
              checked={settings.activity_status}
              onCheckedChange={(checked) => handleSettingChange("activity_status", checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="projectVisibility">Project Visibility</Label>
            <Select
              value={settings.project_visibility}
              onValueChange={(value) => handleSettingChange("project_visibility", value as "public" | "private" | "contacts")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can discover your projects</SelectItem>
                <SelectItem value="contacts">Contacts - Only your contacts can see your projects</SelectItem>
                <SelectItem value="private">Private - Your projects are hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data & Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Analytics</CardTitle>
          <CardDescription>
            Control how your data is used to improve our services.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics">Usage Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Help improve our service by sharing anonymous usage data
              </p>
            </div>
            <Switch
              id="analytics"
              checked={settings.analytics_enabled}
              onCheckedChange={(checked) => handleSettingChange("analytics_enabled", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="personalization">Data Personalization</Label>
              <p className="text-sm text-muted-foreground">
                Use your data to personalize your experience and provide better recommendations
              </p>
            </div>
            <Switch
              id="personalization"
              checked={settings.personalization_enabled}
              onCheckedChange={(checked) => handleSettingChange("personalization_enabled", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="thirdPartySharing">Third-party Data Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Allow sharing anonymized data with trusted partners for enhanced features
              </p>
            </div>
            <Switch
              id="thirdPartySharing"
              checked={settings.third_party_sharing}
              onCheckedChange={(checked) => handleSettingChange("third_party_sharing", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Communications */}
      <Card>
        <CardHeader>
          <CardTitle>Communications</CardTitle>
          <CardDescription>
            Choose what types of communications you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important account activities
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) => handleSettingChange("email_notifications", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketingCommunications">Marketing Communications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new features, tips, and special offers
              </p>
            </div>
            <Switch
              id="marketingCommunications"
              checked={settings.marketing_communications}
              onCheckedChange={(checked) => handleSettingChange("marketing_communications", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="communityCommunications">Community Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about community events, discussions, and updates
              </p>
            </div>
            <Switch
              id="communityCommunications"
              checked={settings.community_communications}
              onCheckedChange={(checked) => handleSettingChange("community_communications", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="securityAlerts">Security Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Receive important security-related notifications (always recommended)
              </p>
            </div>
            <Switch
              id="securityAlerts"
              checked={settings.security_alerts}
              onCheckedChange={(checked) => handleSettingChange("security_alerts", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Export & Deletion */}
      <Card>
        <CardHeader>
          <CardTitle>Data Rights</CardTitle>
          <CardDescription>
            Export or delete your personal data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Export Your Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a copy of all your personal data and activity.
              </p>
            </div>
            <Button variant="outline" onClick={handleDataExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Request Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200">Delete Account</h4>
              <p className="text-sm text-red-600 dark:text-red-300">
                Permanently delete your account and all associated data.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleAccountDeletion}
              className="text-red-600 border-red-200 hover:bg-red-100 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Your Privacy Matters:</strong> We are committed to protecting your privacy and giving you control 
          over your data. For more details, review our Privacy Policy and Terms of Service.
        </AlertDescription>
      </Alert>
    </div>
  );
}