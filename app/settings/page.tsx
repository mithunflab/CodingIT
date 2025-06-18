'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUserStore } from '@/lib/stores/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const generalSettingsSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  timezone: z.string(),
})

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>

export default function GeneralSettingsPage() {
  const { user, preferences, updateUser, updatePreferences, isLoading } = useUserStore()

  const form = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      username: user?.username || '',
      bio: user?.bio || '',
      timezone: preferences.timezone,
    },
  })

  const onSubmit = async (data: GeneralSettingsForm) => {
    await updateUser({
      full_name: data.full_name,
      username: data.username,
      bio: data.bio,
    })
    
    await updatePreferences({
      timezone: data.timezone,
    })
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Loading user data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          General Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and profile details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  {...form.register('full_name')}
                  className="mt-1"
                />
                {form.formState.errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.full_name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  {...form.register('username')}
                  className="mt-1"
                  placeholder="Optional"
                />
                {form.formState.errors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...form.register('bio')}
                className="mt-1"
                placeholder="Tell us about yourself..."
                rows={3}
              />
              {form.formState.errors.bio && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.bio.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Settings</CardTitle>
            <CardDescription>
              Configure your timezone and regional preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                {...form.register('timezone')}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {Intl.supportedValuesOf('timeZone').map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your account details and registration information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                value={user.email}
                disabled
                className="mt-1 bg-gray-50 dark:bg-gray-800"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Contact support to change your email address.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account Created</Label>
                <Input
                  value={new Date(user.created_at).toLocaleDateString()}
                  disabled
                  className="mt-1 bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div>
                <Label>Last Updated</Label>
                <Input
                  value={new Date(user.updated_at).toLocaleDateString()}
                  disabled
                  className="mt-1 bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
