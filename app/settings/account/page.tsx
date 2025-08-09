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
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import ErrorBoundary, { SettingsSection } from '@/components/error-boundary'
import { 
  getUserPreferences, 
  getUserSecuritySettings,
  getUserProfile,
  updateUserPreferences, 
  updateUserSecuritySettings,
  updateUserProfile
} from '@/lib/user-settings'

export default function AccountSettings() {
  const [authDialog, setAuthDialog] = useState(false)
  const [authView, setAuthView] = useState('sign_in')
  const { session } = useAuth(
    (value: boolean) => setAuthDialog(value),
    (value: any) => setAuthView(value)
  )
  const { toast } = useToast()
  const supabase = createSupabaseBrowserClient()
  const isMountedRef = useRef(true)
  
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState('')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [emailDirty, setEmailDirty] = useState(false)
  const [passwordDirty, setPasswordDirty] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})

  const loadUserData = useCallback(async () => {
    if (!session?.user?.id || !isMountedRef.current) return
    
    setIsLoading(true)
    try {
      setEmail(session.user.email || '')
      setEmailDirty(false)
      const loadWithTimeout = Promise.race([
        Promise.all([
          getUserProfile(session.user.id),
          getUserPreferences(session.user.id),
          getUserSecuritySettings(session.user.id)
        ]),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )
      ])

      try {
        const [profile, preferences, securitySettings] = await loadWithTimeout as any
        
        if (!isMountedRef.current) return

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
      } catch (dataError) {
        console.warn('Could not load extended user data, using defaults:', dataError)
        setEmailNotifications(true)
        setSecurityAlerts(true)
        setTwoFactorEnabled(false)
      }
    } catch (error) {
      console.error('Error loading basic user data:', error)
      if (isMountedRef.current) {
        toast({
          title: "Warning",
          description: "Some account features may be limited. Core functionality is still available.",
          variant: "default",
        })
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [session, toast])

  useEffect(() => {
    isMountedRef.current = true
    loadUserData()
    
    return () => {
      isMountedRef.current = false
    }
  }, [loadUserData])

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return null
  }

  const handleUpdateEmail = async () => {
    if (!supabase || !session?.user?.id || isUpdatingEmail) return
    
    const emailError = validateEmail(email)
    if (emailError) {
      setValidationErrors(prev => ({ ...prev, email: emailError }))
      return
    }
    
    setValidationErrors(prev => ({ ...prev, email: '' }))
    setIsUpdatingEmail(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: email.trim()
      })

      if (error) throw error

      if (isMountedRef.current) {
        setEmailDirty(false)
        toast({
          title: "Email Update Initiated",
          description: "Please check your new email address for confirmation.",
        })
      }
    } catch (error: any) {
      console.error('Error updating email:', error)
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: error.message || "Failed to update email. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMountedRef.current) {
        setIsUpdatingEmail(false)
      }
    }
  }

  const validatePassword = (password: string, confirmPass: string): { newPassword?: string; confirmPassword?: string } => {
    const errors: { newPassword?: string; confirmPassword?: string } = {}
    
    if (!password) {
      errors.newPassword = 'New password is required'
    } else if (password.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.newPassword = 'Password must contain at least one uppercase letter, lowercase letter, and number'
    }
    
    if (!confirmPass) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPass) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    return errors
  }

  const handleChangePassword = async () => {
    if (!supabase || isChangingPassword) return
    
    const passwordErrors = validatePassword(newPassword, confirmPassword)
    if (Object.keys(passwordErrors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...passwordErrors }))
      return
    }
    
    setValidationErrors(prev => ({ ...prev, newPassword: '', confirmPassword: '' }))
    setIsChangingPassword(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      if (session?.user?.id) {
        await updateUserSecuritySettings(session.user.id, {
          last_password_change: new Date().toISOString()
        })
      }

      if (isMountedRef.current) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordDirty(false)
        
        toast({
          title: "Success",
          description: "Password updated successfully.",
        })
      }
    } catch (error: any) {
      console.error('Error changing password:', error)
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: error.message || "Failed to change password. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMountedRef.current) {
        setIsChangingPassword(false)
      }
    }
  }

  const handleUpdateNotificationSettings = async (key: 'email_notifications' | 'security_alerts', value: boolean) => {
    if (!session?.user?.id || isUpdatingSettings) return

    if (key === 'email_notifications') setEmailNotifications(value)
    if (key === 'security_alerts') setSecurityAlerts(value)

    setIsUpdatingSettings(true)
    try {
      const success = await updateUserPreferences(session.user.id, {
        [key]: value
      })

      if (success && isMountedRef.current) {
        toast({
          title: "Success",
          description: "Notification settings updated successfully.",
        })
      } else {
        throw new Error('Failed to update settings')
      }
    } catch (error) {
      console.warn('Could not save notification settings to database:', error)
      if (isMountedRef.current) {
        if (key === 'email_notifications') setEmailNotifications(!value)
        if (key === 'security_alerts') setSecurityAlerts(!value)
        
        toast({
          title: "Warning",
          description: "Settings changed locally but could not be saved to server.",
          variant: "default",
        })
      }
    } finally {
      if (isMountedRef.current) {
        setIsUpdatingSettings(false)
      }
    }
  }

  const handleEnable2FA = async () => {
    if (!session?.user?.id || isUpdatingSettings) return

    const newValue = !twoFactorEnabled
    
    setTwoFactorEnabled(newValue)
    setIsUpdatingSettings(true)
    
    try {
      const success = await updateUserSecuritySettings(session.user.id, {
        two_factor_enabled: newValue
      })

      if (success && isMountedRef.current) {
        toast({
          title: "Success",
          description: `Two-factor authentication ${newValue ? 'enabled' : 'disabled'}.`,
        })
      } else {
        throw new Error('Failed to update 2FA settings')
      }
    } catch (error) {
      console.warn('Could not save 2FA settings to database:', error)
      if (isMountedRef.current) {
        setTwoFactorEnabled(!newValue)
        toast({
          title: "Warning",
          description: "2FA setting changed locally but could not be saved to server.",
          variant: "default",
        })
      }
    } finally {
      if (isMountedRef.current) {
        setIsUpdatingSettings(false)
      }
    }
  }

  const validateAvatarFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 2 * 1024 * 1024
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPG, PNG, GIF, or WebP)'
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 2MB'
    }
    
    return null
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !session?.user?.id || !supabase || isUploadingAvatar) return

    const validationError = validateAvatarFile(file)
    if (validationError) {
      toast({
        title: "Error",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileName = `${session.user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      if (!isMountedRef.current) return

      const success = await updateUserProfile(session.user.id, {
        avatar_url: data.publicUrl
      })

      if (success && isMountedRef.current) {
        setAvatarUrl(data.publicUrl)
        toast({
          title: "Success",
          description: "Profile picture updated successfully.",
        })
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: error.message || "Failed to upload profile picture. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploadingAvatar(false)
      }
      if (event.target) {
        event.target.value = ''
      }
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
          <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading account settings" />
          <span className="sr-only">Loading your account settings...</span>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Account</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and security preferences.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">Authentication Required</p>
                <p className="text-sm text-muted-foreground">
                  Please sign in to access your account settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      <SettingsSection
        title="Profile Picture"
        description="Update your profile picture and basic information."
      >
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
                  aria-describedby="avatar-help-text"
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
                <p id="avatar-help-text" className="text-xs text-muted-foreground">
                  JPG, PNG, GIF, or WebP. Max size 2MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </SettingsSection>

      <SettingsSection
        title="Email Address"
        description="Manage your email address for authentication and notifications."
      >
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
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailDirty(true)
                    setValidationErrors(prev => ({ ...prev, email: '' }))
                  }}
                  aria-describedby={validationErrors.email ? 'email-error' : undefined}
                  className="flex-1"
                />
                <Button 
                  onClick={handleUpdateEmail}
                  disabled={isUpdatingEmail || (!emailDirty || email === session?.user?.email)}
                >
                  {isUpdatingEmail && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update
                </Button>
              </div>
              {validationErrors.email && (
                <p id="email-error" className="text-sm text-destructive mt-1" role="alert">
                  {validationErrors.email}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </SettingsSection>

      <SettingsSection
        title="Password Security"
        description="Update your password to keep your account secure."
      >
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
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setPasswordDirty(true)
                  setValidationErrors(prev => ({ ...prev, newPassword: '' }))
                }}
                aria-describedby={validationErrors.newPassword ? 'new-password-error' : undefined}
                placeholder="Enter new password"
              />
              {validationErrors.newPassword && (
                <p id="new-password-error" className="text-sm text-destructive mt-1" role="alert">
                  {validationErrors.newPassword}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setValidationErrors(prev => ({ ...prev, confirmPassword: '' }))
                }}
                aria-describedby={validationErrors.confirmPassword ? 'confirm-password-error' : undefined}
                placeholder="Confirm new password"
              />
              {validationErrors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-destructive mt-1" role="alert">
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>

            <Button 
              onClick={handleChangePassword}
              disabled={isChangingPassword || !passwordDirty || !newPassword || !confirmPassword}
            >
              {isChangingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Change password
            </Button>
          </CardContent>
        </Card>
      </SettingsSection>

      <SettingsSection
        title="Security Settings"
        description="Manage two-factor authentication and other security features."
      >
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
      </SettingsSection>

      <SettingsSection
        title="Notification Preferences"
        description="Choose which notifications you want to receive."
      >
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
                <p id="email-notifications-desc" className="text-sm text-muted-foreground">
                  Receive notifications about your account activity
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={(checked) => handleUpdateNotificationSettings('email_notifications', checked)}
                disabled={isUpdatingSettings}
                aria-describedby="email-notifications-desc"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="security-alerts">Security alerts</Label>
                <p id="security-alerts-desc" className="text-sm text-muted-foreground">
                  Get notified about important security events
                </p>
              </div>
              <Switch
                id="security-alerts"
                checked={securityAlerts}
                onCheckedChange={(checked) => handleUpdateNotificationSettings('security_alerts', checked)}
                disabled={isUpdatingSettings}
                aria-describedby="security-alerts-desc"
              />
            </div>
          </CardContent>
        </Card>
      </SettingsSection>

      <Separator />

      <ErrorBoundary
        fallback={
          <Card className="border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Account Actions Unavailable</p>
                  <p className="text-sm text-muted-foreground">
                    Some account management features are temporarily unavailable.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      >
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
                  <p id="delete-account-desc" className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Feature Not Available",
                    description: "Account deletion is not yet implemented. Please contact support if needed.",
                    variant: "default",
                  })
                }}
                aria-describedby="delete-account-desc"
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </ErrorBoundary>
    </div>
  )
}