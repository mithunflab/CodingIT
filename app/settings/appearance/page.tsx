"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import SettingsLayout from "@/components/settings-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { 
  Palette, 
  Monitor, 
  Sun, 
  Moon, 
  Type,
  Zap,
  Eye,
  Settings as SettingsIcon,
  CheckCircle2,
  Laptop
} from "lucide-react"

interface AppearanceSettings {
  theme: "light" | "dark" | "system"
  fontSize: number
  fontFamily: "default" | "serif" | "mono"
  density: "comfortable" | "compact" | "spacious"
  reducedMotion: boolean
  highContrast: boolean
  language: string
  accentColor: string
}

const themeOptions = [
  {
    value: "light",
    label: "Light",
    description: "Clean, bright interface",
    icon: Sun,
    preview: "bg-white text-gray-900 border-gray-200"
  },
  {
    value: "dark", 
    label: "Dark",
    description: "Easy on the eyes",
    icon: Moon,
    preview: "bg-gray-900 text-white border-gray-700"
  },
  {
    value: "system",
    label: "System",
    description: "Match your device",
    icon: Laptop,
    preview: "bg-gradient-to-r from-white to-gray-900 text-gray-500 border-gray-400"
  }
]

const fontOptions = [
  {
    value: "default",
    label: "Default",
    description: "System font",
    className: "font-sans"
  },
  {
    value: "serif",
    label: "Serif", 
    description: "Traditional reading",
    className: "font-serif"
  },
  {
    value: "mono",
    label: "Monospace",
    description: "Code-friendly",
    className: "font-mono"
  }
]

const densityOptions = [
  {
    value: "compact",
    label: "Compact",
    description: "More content visible"
  },
  {
    value: "comfortable", 
    label: "Comfortable",
    description: "Balanced spacing"
  },
  {
    value: "spacious",
    label: "Spacious", 
    description: "Extra breathing room"
  }
]

const accentColors = [
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "green", label: "Green", color: "bg-green-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
  { value: "red", label: "Red", color: "bg-red-500" },
  { value: "pink", label: "Pink", color: "bg-pink-500" }
]

export default function AppearancePage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: "system",
    fontSize: 14,
    fontFamily: "default",
    density: "comfortable",
    reducedMotion: false,
    highContrast: false,
    language: "en",
    accentColor: "blue"
  })

  useEffect(() => {
    setMounted(true)
    if (theme) {
      setSettings(prev => ({ ...prev, theme: theme as "light" | "dark" | "system" }))
    }
  }, [theme])

  const handleSettingChange = (key: keyof AppearanceSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    
    if (key === "theme") {
      setTheme(value)
    }
  }

  const handleSave = () => {
    toast({
      title: "Appearance updated",
      description: "Your appearance preferences have been saved.",
    })
  }

  if (!mounted) {
    return null
  }

  return (
    <SettingsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Appearance</h1>
          <p className="text-muted-foreground mt-2">
            Customize how Claude looks and feels for your preferences.
          </p>
        </div>

        {/* Theme Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Color Theme
            </CardTitle>
            <CardDescription>
              Choose your preferred color scheme for the interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={settings.theme} 
              onValueChange={(value) => handleSettingChange("theme", value)}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {themeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <div key={option.value} className="relative">
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={option.value}
                      className="flex flex-col items-center gap-3 rounded-lg border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent cursor-pointer transition-all"
                    >
                      {/* Theme Preview */}
                      <div className={`w-full h-20 rounded-md border ${option.preview} flex items-center justify-center relative overflow-hidden`}>
                        <div className="flex items-center gap-2 text-xs">
                          <Icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                        {settings.theme === option.value && (
                          <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                        )}
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5" />
              Typography
            </CardTitle>
            <CardDescription>
              Adjust font settings for better readability.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Font Family */}
            <div className="space-y-3">
              <Label>Font Family</Label>
              <RadioGroup 
                value={settings.fontFamily} 
                onValueChange={(value) => handleSettingChange("fontFamily", value)}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {fontOptions.map((font) => (
                  <div key={font.value} className="relative">
                    <RadioGroupItem 
                      value={font.value} 
                      id={`font-${font.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`font-${font.value}`}
                      className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent cursor-pointer transition-all"
                    >
                      <div className={`text-2xl ${font.className}`}>Aa</div>
                      <div className="text-center">
                        <div className="font-medium">{font.label}</div>
                        <div className="text-xs text-muted-foreground">{font.description}</div>
                      </div>
                      {settings.fontFamily === font.value && (
                        <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Font Size</Label>
                <span className="text-sm text-muted-foreground">{settings.fontSize}px</span>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => handleSettingChange("fontSize", value)}
                min={12}
                max={20}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout & Density */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Layout & Spacing
            </CardTitle>
            <CardDescription>
              Control the density and spacing of interface elements.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Interface Density</Label>
              <RadioGroup 
                value={settings.density} 
                onValueChange={(value) => handleSettingChange("density", value)}
                className="space-y-2"
              >
                {densityOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`density-${option.value}`} />
                    <Label htmlFor={`density-${option.value}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Accessibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Accessibility
            </CardTitle>
            <CardDescription>
              Options to improve accessibility and reduce distractions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Reduce motion</Label>
                <p className="text-sm text-muted-foreground">
                  Minimize animations and transitions
                </p>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => handleSettingChange("reducedMotion", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">High contrast</Label>
                <p className="text-sm text-muted-foreground">
                  Increase contrast for better visibility
                </p>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) => handleSettingChange("highContrast", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Accent Color */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Accent Color
            </CardTitle>
            <CardDescription>
              Choose your preferred accent color for highlights and interactive elements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleSettingChange("accentColor", color.value)}
                  className={`relative aspect-square rounded-lg ${color.color} border-2 transition-all ${
                    settings.accentColor === color.value 
                      ? "border-foreground shadow-lg scale-105" 
                      : "border-transparent hover:border-muted-foreground"
                  }`}
                >
                  {settings.accentColor === color.value && (
                    <CheckCircle2 className="absolute inset-0 m-auto h-6 w-6 text-white" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Language & Region
            </CardTitle>
            <CardDescription>
              Set your preferred language for the interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">Display Language</Label>
              <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="it">Italiano</SelectItem>
                  <SelectItem value="pt">Português</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Save Appearance Settings
          </Button>
        </div>
      </div>
    </SettingsLayout>
  )
}