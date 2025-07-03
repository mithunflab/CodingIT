'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Check, Monitor, Moon, Sun, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { 
  getUserPreferences, 
  updateUserPreferences,
  UserPreferences
} from '@/lib/user-settings'

const themes = [
  {
    name: 'Light',
    value: 'light' as const,
    icon: Sun,
    description: 'A clean, bright interface'
  },
  {
    name: 'Dark', 
    value: 'dark' as const,
    icon: Moon,
    description: 'Easy on your eyes in low light'
  },
  {
    name: 'System',
    value: 'system' as const,
    icon: Monitor,
    description: 'Adapts to your system settings'
  }
]

const fonts = [
  {
    name: 'Inter',
    value: 'inter' as const,
    description: 'Modern and readable sans-serif font',
    preview: 'The quick brown fox jumps over the lazy dog'
  },
  {
    name: 'JetBrains Mono',
    value: 'jetbrains-mono' as const,
    description: 'Monospace font optimized for coding',
    preview: 'const message = "Hello, World!";'
  },
  {
    name: 'Cal Sans',
    value: 'cal-sans' as const,
    description: 'Geometric sans-serif with character',
    preview: 'Design with purpose and clarity'
  }
]

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const { session } = useAuth(() => {}, () => {})
  const { toast } = useToast()
  
  // State
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [selectedFont, setSelectedFont] = useState<'inter' | 'jetbrains-mono' | 'cal-sans'>('inter')
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Load user preferences on mount
  useEffect(() => {
    if (!session?.user?.id) return

    const loadPreferences = async () => {
      setIsLoading(true)
      try {
        const preferences = await getUserPreferences(session.user.id)
        
        if (preferences) {
          setSelectedTheme(preferences.theme)
          setSelectedFont(preferences.font_family)
          
          // Sync with theme system
          if (theme !== preferences.theme) {
            setTheme(preferences.theme)
          }
        }
      } catch (error) {
        console.error('Error loading appearance preferences:', error)
        toast({
          title: "Error",
          description: "Failed to load appearance settings. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [session?.user?.id, theme, setTheme, toast])

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    if (!session?.user?.id) return

    setIsUpdating(true)
    try {
      // Update local state immediately for better UX
      setSelectedTheme(newTheme)
      setTheme(newTheme)

      // Save to database
      const success = await updateUserPreferences(session.user.id, {
        theme: newTheme
      })

      if (success) {
        toast({
          title: "Success",
          description: "Theme updated successfully.",
        })
      } else {
        // Revert on failure
        setSelectedTheme(selectedTheme)
        setTheme(selectedTheme)
        throw new Error('Failed to save theme preference')
      }
    } catch (error) {
      console.error('Error updating theme:', error)
      toast({
        title: "Error",
        description: "Failed to save theme preference. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleFontChange = async (newFont: 'inter' | 'jetbrains-mono' | 'cal-sans') => {
    if (!session?.user?.id) return

    setIsUpdating(true)
    try {
      // Update local state immediately
      setSelectedFont(newFont)
      
      // Apply font to document
      document.documentElement.style.fontFamily = getFontFamily(newFont)

      // Save to database
      const success = await updateUserPreferences(session.user.id, {
        font_family: newFont
      })

      if (success) {
        toast({
          title: "Success",
          description: "Font updated successfully.",
        })
      } else {
        // Revert on failure
        setSelectedFont(selectedFont)
        document.documentElement.style.fontFamily = getFontFamily(selectedFont)
        throw new Error('Failed to save font preference')
      }
    } catch (error) {
      console.error('Error updating font:', error)
      toast({
        title: "Error", 
        description: "Failed to save font preference. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getFontFamily = (font: 'inter' | 'jetbrains-mono' | 'cal-sans') => {
    switch (font) {
      case 'inter':
        return 'Inter, system-ui, sans-serif'
      case 'jetbrains-mono':
        return '"JetBrains Mono", monospace'
      case 'cal-sans':
        return '"Cal Sans", system-ui, sans-serif'
      default:
        return 'Inter, system-ui, sans-serif'
    }
  }

  // Apply font on load
  useEffect(() => {
    if (!isLoading) {
      document.documentElement.style.fontFamily = getFontFamily(selectedFont)
    }
  }, [selectedFont, isLoading])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium">Appearance</h2>
          <p className="text-sm text-muted-foreground">
            Customize how the interface looks and feels.
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
        <h2 className="text-lg font-medium">Appearance</h2>
        <p className="text-sm text-muted-foreground">
          Customize how the interface looks and feels.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose your preferred color scheme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon
              const isSelected = selectedTheme === themeOption.value
              
              return (
                <button
                  key={themeOption.value}
                  onClick={() => handleThemeChange(themeOption.value)}
                  disabled={isUpdating}
                  className={cn(
                    'relative flex flex-col items-center p-4 border-2 rounded-lg transition-colors',
                    'hover:border-primary/50 focus:border-primary focus:outline-none',
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border',
                    isUpdating && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isSelected && (
                    <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                  )}
                  
                  <div className={cn(
                    'mb-3 rounded-lg p-3',
                    themeOption.value === 'light' && 'bg-white border',
                    themeOption.value === 'dark' && 'bg-gray-900 border border-gray-700',
                    themeOption.value === 'system' && 'bg-gradient-to-r from-white to-gray-900 border'
                  )}>
                    <Icon className={cn(
                      'h-6 w-6',
                      themeOption.value === 'light' && 'text-gray-900',
                      themeOption.value === 'dark' && 'text-gray-100',
                      themeOption.value === 'system' && 'text-gray-600'
                    )} />
                  </div>
                  
                  <div className="text-center">
                    <Label className="font-medium">{themeOption.name}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {themeOption.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Font</CardTitle>
          <CardDescription>
            Choose your preferred font family.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fonts.map((fontOption) => {
              const isSelected = selectedFont === fontOption.value
              
              return (
                <button
                  key={fontOption.value}
                  onClick={() => handleFontChange(fontOption.value)}
                  disabled={isUpdating}
                  className={cn(
                    'w-full flex items-start justify-between p-4 border-2 rounded-lg transition-colors text-left',
                    'hover:border-primary/50 focus:border-primary focus:outline-none',
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border',
                    isUpdating && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Label className="font-medium">{fontOption.name}</Label>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {fontOption.description}
                    </p>
                    <p 
                      className="text-sm"
                      style={{ fontFamily: getFontFamily(fontOption.value) }}
                    >
                      {fontOption.preview}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {isUpdating && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Saving preferences...</span>
        </div>
      )}
    </div>
  )
}