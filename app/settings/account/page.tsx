"use client"

import React, { useState } from "react"
import SettingsLayout from "@/components/settings-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { 
  Mail, 
  Shield, 
  Key, 
  Smartphone,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Download,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from "lucide-react"

interface AccountData {
  email: string
  emailVerified: boolean
  createdAt: string
  lastSignIn: string
  twoFactorEnabled: boolean
  recoveryCodesGenerated: boolean
}

interface Session {
  id: string
  device: string
  location: string
  lastActive: string
  current: boolean
  ipAddress: string
}

export default function AccountPage() {
  const { toast } = useToast()
  const [accountData] = useState<AccountData>({
    email: "john.doe@example.com",
    emailVerified: true,
    createdAt: "January 15, 2024",
    lastSignIn: "2 hours ago",
    twoFactorEnabled: false,
    recoveryCodesGenerated: false
  })

  const [sessions] = useState<Session[]>([
    {
      id: "1",
      device: "Chrome on Windows",
      location: "San Francisco, CA",
      lastActive: "Active now",
      current: true,
      ipAddress: "192.168.1.1"
    },
    {
      id: "2", 
      device: "Safari on iPhone",
      location: "San Francisco, CA",
      lastActive: "2 hours ago",
      current: false,
      ipAddress: "192.168.1.2"
    },
    {
      id: "3",
      device: "Firefox on MacOS",
      location: "New York, NY", 
      lastActive: "1 day ago",
      current: false,
      ipAddress: "10.0.0.1"
    }
  ])

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords don't match. Please try again.",
        variant: "destructive"
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Password updated",
      description: "Your password has been successfully changed.",
    })
    
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleSignOutSession = (sessionId: string) => {
    toast({
      title: "Session ended",
      description: "The selected session has been signed out.",
    })
  }

  const handleSignOutAllSessions = () => {
    toast({
      title: "All sessions ended",
      description: "You have been signed out of all other devices.",
    })
  }

  const handleExportData = () => {
    toast({
      title: "Data export started",
      description: "Your data export will be emailed to you within 24 hours.",
    })
  }

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Account deletion initiated",
      description: "Your account deletion request has been submitted.",
      variant: "destructive"
    })
    setShowDeleteDialog(false)
    setDeleteConfirmation("")
  }

  return (
    <SettingsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Account</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account security, sessions, and data.
          </p>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Basic information about your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex items-center gap-2">
                  <Input value={accountData.email} disabled className="flex-1" />
                  {accountData.emailVerified ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Unverified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your email is used for account verification and important notifications.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Account Created</Label>
                  <p className="text-sm text-muted-foreground">{accountData.createdAt}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Sign In</Label>
                  <p className="text-sm text-muted-foreground">{accountData.lastSignIn}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your password and two-factor authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Change */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Password</h3>
                  <p className="text-sm text-muted-foreground">Change your account password</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
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
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <Button onClick={handleChangePassword} className="gap-2">
                <Key className="h-4 w-4" />
                Update Password
              </Button>
            </div>

            <Separator />

            {/* Two-Factor Authentication */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Badge variant={accountData.twoFactorEnabled ? "default" : "secondary"}>
                  {accountData.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              {accountData.twoFactorEnabled ? (
                <div className="space-y-3">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Two-factor authentication is enabled. Your account is protected with an authenticator app.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Smartphone className="h-4 w-4 mr-2" />
                      View Recovery Codes
                    </Button>
                    <Button variant="outline" size="sm">
                      <Key className="h-4 w-4 mr-2" />
                      Regenerate Codes
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Unlock className="h-4 w-4 mr-2" />
                      Disable 2FA
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Two-factor authentication is not enabled. We recommend enabling it for better security.
                    </AlertDescription>
                  </Alert>
                  <Button className="gap-2">
                    <Lock className="h-4 w-4" />
                    Enable Two-Factor Authentication
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage where youre signed in across devices and browsers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {session.current ? (
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                      ) : (
                        <div className="h-2 w-2 bg-gray-400 rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{session.device}</h4>
                        {session.current && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {session.lastActive}
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          {session.location} • {session.ipAddress}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSignOutSession(session.id)}
                    >
                      Sign Out
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {sessions.length} active sessions
              </p>
              <Button variant="outline" onClick={handleSignOutAllSessions}>
                Sign Out All Other Sessions
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data & Privacy
            </CardTitle>
            <CardDescription>
              Export your data or delete your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your conversations and account data
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData} className="gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div>
                <h4 className="font-medium text-destructive">Delete Account</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Account
                    </DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>This will delete:</strong>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                          <li>All your conversations and chat history</li>
                          <li>Your profile and account settings</li>
                          <li>Any subscriptions or billing information</li>
                          <li>All associated data permanently</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="deleteConfirm">
                        Type <strong>DELETE</strong> to confirm
                      </Label>
                      <Input
                        id="deleteConfirm"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="Type DELETE to confirm"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== "DELETE"}
                    >
                      Delete Account Forever
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  )
}