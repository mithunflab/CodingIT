'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUserStore } from '@/lib/stores/user'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Monitor, Moon, Sun } from 'lucide-react'

const appearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  appearance_compact: z.boolean(),
  appearance_animations: z.boolean(),
  appearance_sound: z.boolean(),
})

type AppearanceForm = z.infer<typeof appearanceSchema>

export default function AppearancePage() {
  const { preferences, updatePreferences, isLoading } = useUserStore()

  const form = useForm<AppearanceForm>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {
      theme: preferences.theme,
      appearance_compact: preferences.appearance_compact,
      appearance_animations: preferences.appearance_animations,
      appearance_sound: preferences.appearance_sound,
    },
  })

  const onSubmit = async (data: AppearanceForm) => {
    await updatePreferences(data)
  }

  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Appearance
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customize the look and feel of your application.
        </p>
      </div>

      <Separator />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>
              Choose your preferred theme for the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {themeOptions.map((option) => {
                const IconComponent = option.icon
                const isSelected = form.watch('theme') === option.id
                
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => form.setValue('theme', option.id as any)}
                    className={`relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    <IconComponent className="h-6 w-6" />
                    <span className="text-sm font-medium">{option.label}</span>
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-blue-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interface</CardTitle>
            <CardDescription>
              Adjust interface elements and behavior.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="compact">Compact Mode</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use a more compact layout with reduced spacing.
                </p>
              </div>
              <Switch
                id="compact"
                checked={form.watch('appearance_compact')}
                onCheckedChange={(checked) => 
                  form.setValue('appearance_compact', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="animations">Animations</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enable smooth animations and transitions.
                </p>
              </div>
              <Switch
                id="animations"
                checked={form.watch('appearance_animations')}
                onCheckedChange={(checked) => 
                  form.setValue('appearance_animations', checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound">Sound Effects</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Play sound effects for interface interactions.
                </p>
              </div>
              <Switch
                id="sound"
                checked={form.watch('appearance_sound')}
                onCheckedChange={(checked) => 
                  form.setValue('appearance_sound', checked)
                }
              />
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