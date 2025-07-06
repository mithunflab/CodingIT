'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertTriangle, Camera, Mail, Shield, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { createBrowserClient } from '@/lib/supabase-client'
import { 
  getUserPreferences, 
  getUserSecuritySettings,
  getUserProfile,
  updateUserPreferences, 
  updateUserSecuritySettings,
  updateUserProfile
} from '@/lib/user-settings'

export default function AccountSettings() {
  const { session } = useAuth(() => {}, () => {})
  const { toast } = useToast()
  const supabase = createBrowserClient()
  
  // Form state
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState('')
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Load user data on mount
  useEffect(() => {
    if (!session?.user?.id) return

    const loadUserData = async () => {
      setIsLoading(true)
      try {
        const [profile, preferences, securitySettings] = await Promise.all([
          getUserProfile(session.user.id),
          getUserPreferences(session.user.id),
          getUserSecuritySettings(session.user.id)
        ])

        // Set email from session
        setEmail(session.user.email || '')

        if (profile) {
          setAvatarUrl(profile.avatar_url || '')
        }

        if (preferences) {
          setEmailNotifications(preferences.email_notifications)
          setSecurityAlerts(preferences.security_alerts)
        }

        if (securitySettings) {
          setTwoFactorEnabled(securitySettings.two_factor_enabled)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        toast({
          title: "Error",
          description: "Failed to load account data. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [session, toast])

  const handleUpdateEmail = async () => {
    if (!supabase || !session?.user?.id) return

    setIsUpdatingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email: email
      })

      if (error) throw error

      toast({
        title: "Email Update Initiated",
        description: "Please check your new email address for confirmation.",
      })
    } catch (error: any) {
      console.error('Error updating email:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update email. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const handleChangePassword = async () => {
    if (!supabase || !newPassword || newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      // Update security settings to track password change
      if (session?.user?.id) {
        await updateUserSecuritySettings(session.user.id, {
          last_password_change: new Date().toISOString()
        })
      }

      // Clear form
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      toast({
        title: "Success",
        description: "Password updated successfully.",
      })
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleUpdateNotificationSettings = async (key: 'email_notifications' | 'security_alerts', value: boolean) => {
    if (!session?.user?.id) return

    setIsUpdatingSettings(true)
    try {
      const success = await updateUserPreferences(session.user.id, {
        [key]: value
      })

      if (success) {
        if (key === 'email_notifications') setEmailNotifications(value)
        if (key === 'security_alerts') setSecurityAlerts(value)
        
        toast({
          title: "Success",
          description: "Notification settings updated successfully.",
        })
      } else {
        throw new Error('Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const handleEnable2FA = async () => {
    if (!session?.user?.id) return

    setIsUpdatingSettings(true)
    try {
      // For now, just toggle the setting
      // In a real implementation, you'd integrate with an authenticator service
      const success = await updateUserSecuritySettings(session.user.id, {
        two_factor_enabled: !twoFactorEnabled
      })

      if (success) {
        setTwoFactorEnabled(!twoFactorEnabled)
        toast({
          title: "Success",
          description: `Two-factor authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}.`,
        })
      } else {
        throw new Error('Failed to update 2FA settings')
      }
    } catch (error) {
      console.error('Error updating 2FA:', error)
      toast({
        title: "Error",
        description: "Failed to update 2FA settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session?.user?.id || !supabase) return

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const success = await updateUserProfile(session.user.id, {
        avatar_url: data.publicUrl
      })

      if (success) {
        setAvatarUrl(data.publicUrl)
        toast({
          title: "Success",
          description: "Profile picture updated successfully.",
        })
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Account</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and security preferences.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Account</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and security preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Update your profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback>
                {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isUploadingAvatar}
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                Change picture
              </Button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max size 2MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>
            Your email address is used for account authentication and notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleUpdateEmail}
                disabled={isUpdatingEmail || email === session?.user?.email}
              >
                {isUpdatingEmail && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <Button 
            onClick={handleChangePassword}
            disabled={isChangingPassword || !newPassword || newPassword !== confirmPassword}
          >
            {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Change password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5" />
              <div>
                <p className="font-medium">Authenticator App</p>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled ? 'Two-factor authentication is enabled' : 'Use an authenticator app to generate codes'}
                </p>
              </div>
            </div>
            <Button 
              variant={twoFactorEnabled ? "destructive" : "default"}
              onClick={handleEnable2FA}
              disabled={isUpdatingSettings}
            >
              {isUpdatingSettings && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {twoFactorEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Choose which notifications you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about your account activity
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={(checked) => handleUpdateNotificationSettings('email_notifications', checked)}
              disabled={isUpdatingSettings}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="security-alerts">Security alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about important security events
              </p>
            </div>
            <Switch
              id="security-alerts"
              checked={securityAlerts}
              onCheckedChange={(checked) => handleUpdateNotificationSettings('security_alerts', checked)}
              disabled={isUpdatingSettings}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}