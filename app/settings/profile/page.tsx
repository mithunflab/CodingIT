'use client'

import { useState } from 'react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, User, Mail, Calendar, Upload } from 'lucide-react'

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, updateUser, isLoading } = useUserStore()
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      username: user?.username || '',
      bio: user?.bio || '',
    },
  })

  const onSubmit = async (data: ProfileForm) => {
    await updateUser(data)
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your personal information and profile settings.
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Photo
            </CardTitle>
            <CardDescription>
              Update your profile picture and avatar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                <AvatarFallback className="text-lg">
                  {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-col items-center space-y-2">
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Change Photo
                    </span>
                  </Button>
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  JPG, PNG up to 2MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and profile information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  rows={4}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {form.watch('bio')?.length || 0}/500 characters
                </p>
                {form.formState.errors.bio && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.bio.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Account Details
          </CardTitle>
          <CardDescription>
            Your account information and registration details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Email Address</Label>
              <Input
                value={user.email}
                disabled
                className="mt-1 bg-gray-50 dark:bg-gray-800"
              />
            </div>
            <div>
              <Label>User ID</Label>
              <Input
                value={user.id}
                disabled
                className="mt-1 bg-gray-50 dark:bg-gray-800 font-mono text-xs"
              />
            </div>
            <div>
              <Label>Member Since</Label>
              <Input
                value={new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                disabled
                className="mt-1 bg-gray-50 dark:bg-gray-800"
              />
            </div>
            <div>
              <Label>Last Updated</Label>
              <Input
                value={new Date(user.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                disabled
                className="mt-1 bg-gray-50 dark:bg-gray-800"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}