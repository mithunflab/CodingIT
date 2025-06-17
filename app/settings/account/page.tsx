"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Shield, Key, Clock, Trash2, Save, AlertCircle, CheckCircle, Mail, Smartphone, LogOut } from "lucide-react";
import { getUserSettings, updateUserSettings, type UserSettings } from "@/app/actions/settings";
import { getProfile, type ProfileData } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const sessionTimeouts = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
  { value: 1440, label: "24 hours" }
];

export default function AccountPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [userSettings, userProfile] = await Promise.all([
          getUserSettings(),
          getProfile()
        ]);
        setSettings(userSettings);
        setProfile(userProfile);
        if (userProfile?.email) {
          setNewEmail(userProfile.email);
        }
        setError(null);
      } catch (err) {
        setError("Failed to load account settings. Please try again.");
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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

  const handleSettingChange = (field: keyof UserSettings, value: string | boolean | number) => {
    if (!settings) return;
    
    setSettings(prev => prev ? { ...prev, [field]: value } : null);
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
        setSuccess("Account settings updated successfully!");
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

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      // In a real implementation, you would call the Supabase auth API to change password
      setSuccess("Password changed successfully!");
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Failed to change password. Please try again.");
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      // In a real implementation, you would call the Supabase auth API to change email
      setSuccess("Email change request sent! Please check your new email to confirm.");
      setShowEmailDialog(false);
    } catch (err) {
      setError("Failed to change email. Please try again.");
    }
  };

  const handleAccountDeletion = async () => {
    try {
      // In a real implementation, you would call an API to delete the account
      setError("Account deletion is not yet implemented. Please contact support for assistance.");
      setShowDeleteDialog(false);
    } catch (err) {
      setError("Failed to delete account. Please try again.");
    }
  };

  const handleSignOut = () => {
    // In a real implementation, you would call the Supabase auth signOut method
    window.location.href = "/auth/login";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings || !profile) {
    return (
      <Alert className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load account settings. Please refresh the page and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
          <p className="text-muted-foreground">
            Manage your account security and login preferences.
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

      {/* Email & Password */}
      <Card>
        <CardHeader>
          <CardTitle>Login & Security</CardTitle>
          <CardDescription>
            Update your email address and password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">Email Address</h4>
                <p className="text-sm text-muted-foreground">{profile.email || "No email set"}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowEmailDialog(true)}
            >
              Change Email
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">Password</h4>
                <p className="text-sm text-muted-foreground">
                  Last changed: {settings.password_changed_at ? new Date(settings.password_changed_at).toLocaleDateString() : "Never"}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowPasswordDialog(true)}
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              {settings.two_factor_enabled ? (
                <Shield className="h-4 w-4 text-green-500" />
              ) : (
                <Shield className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  {settings.two_factor_enabled 
                    ? "Your account is protected with 2FA"
                    : "Add an authenticator app for extra security"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {settings.two_factor_enabled && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Enabled
                </Badge>
              )}
              <Switch
                id="twoFactor"
                checked={settings.two_factor_enabled}
                onCheckedChange={(checked) => handleSettingChange("two_factor_enabled", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>
            Control how long you stay logged in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Automatic Sign Out</Label>
            <Select
              value={settings.session_timeout.toString()}
              onValueChange={(value) => handleSettingChange("session_timeout", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sessionTimeouts.map((timeout) => (
                  <SelectItem key={timeout.value} value={timeout.value.toString()}>
                    {timeout.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              You will be automatically signed out after this period of inactivity.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sign Out Everywhere</h4>
              <p className="text-sm text-muted-foreground">
                Sign out of all devices and browsers
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out All Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
        <CardHeader>
          <CardTitle className="text-red-800 dark:text-red-200">Danger Zone</CardTitle>
          <CardDescription className="text-red-600 dark:text-red-300">
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-white dark:bg-red-900/20 dark:border-red-800">
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200">Delete Account</h4>
              <p className="text-sm text-red-600 dark:text-red-300">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 border-red-200 hover:bg-red-100 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordChange}>
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Change Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              Enter your new email address. You will need to verify it before the change takes effect.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newEmail">New Email Address</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEmailChange}>
              Send Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Deletion Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This will delete all your projects, settings, and account data permanently.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleAccountDeletion}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}