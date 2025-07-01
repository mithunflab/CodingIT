'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [selectedFont, setSelectedFont] = useState('inter')

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const themes = [
    {
      name: 'Light',
      value: 'light',
      icon: Sun,
      preview: (
        <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
          <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
            <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
          </div>
        </div>
      ),
    },
    {
      name: 'Dark',
      value: 'dark',
      icon: Moon,
      preview: (
        <div className="space-y-2 rounded-sm bg-slate-950 p-2">
          <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
            <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
            <div className="h-4 w-4 rounded-full bg-slate-400" />
            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
          </div>
        </div>
      ),
    },
    {
      name: 'System',
      value: 'system',
      icon: Monitor,
      preview: (
        <div className="space-y-2 rounded-sm bg-gradient-to-r from-[#ecedef] to-slate-950 p-2">
          <div className="space-y-2 rounded-md bg-gradient-to-r from-white to-slate-800 p-2 shadow-sm">
            <div className="h-2 w-[80px] rounded-lg bg-gradient-to-r from-[#ecedef] to-slate-400" />
            <div className="h-2 w-[100px] rounded-lg bg-gradient-to-r from-[#ecedef] to-slate-400" />
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-gradient-to-r from-white to-slate-800 p-2 shadow-sm">
            <div className="h-4 w-4 rounded-full bg-gradient-to-r from-[#ecedef] to-slate-400" />
            <div className="h-2 w-[100px] rounded-lg bg-gradient-to-r from-[#ecedef] to-slate-400" />
          </div>
        </div>
      ),
    },
  ]

  const fonts = [
    {
      name: 'Inter',
      value: 'inter',
      class: 'font-sans',
      preview: 'Aa',
    },
    {
      name: 'JetBrains Mono',
      value: 'jetbrains',
      class: 'font-mono',
      preview: 'Aa',
    },
    {
      name: 'Cal Sans',
      value: 'cal-sans',
      class: 'font-serif',
      preview: 'Aa',
    },
  ]

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
          <CardTitle>Color Mode</CardTitle>
          <CardDescription>
            Choose your preferred color scheme for the interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon
              const isSelected = theme === themeOption.value
              
              return (
                <div
                  key={themeOption.value}
                  className={cn(
                    'relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50',
                    isSelected ? 'border-primary' : 'border-border'
                  )}
                  onClick={() => setTheme(themeOption.value)}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{themeOption.name}</span>
                    </div>
                    {themeOption.preview}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat Font</CardTitle>
          <CardDescription>
            Select the font family for chat messages and code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {fonts.map((font) => {
              const isSelected = selectedFont === font.value
              
              return (
                <div
                  key={font.value}
                  className={cn(
                    'relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50',
                    isSelected ? 'border-primary' : 'border-border'
                  )}
                  onClick={() => setSelectedFont(font.value)}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3 text-center">
                    <div className="text-sm font-medium">{font.name}</div>
                    <div className={cn(
                      'text-2xl font-bold text-muted-foreground',
                      font.class
                    )}>
                      {font.preview}
                    </div>
                    <div className={cn(
                      'text-xs text-muted-foreground',
                      font.class
                    )}>
                      The quick brown fox jumps over the lazy dog
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}