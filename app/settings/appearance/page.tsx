"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Monitor, Moon, Sun, Save, AlertCircle, CheckCircle, Palette, Volume2, VolumeX, Zap, ZapOff } from "lucide-react";
import { getUserSettings, updateUserSettings, type UserSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "next-themes";

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh", name: "中文" }
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago", 
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Seoul",
  "Asia/Mumbai",
  "Asia/Dubai",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland"
];

export default function AppearancePage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const { theme, setTheme } = useTheme();

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const userSettings = await getUserSettings();
        setSettings(userSettings);
        setError(null);
      } catch (err) {
        setError("Failed to load appearance settings. Please try again.");
        console.error("Error loading settings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
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

  const handleSettingChange = (field: keyof UserSettings, value: string | boolean) => {
    if (!settings) return;
    
    setSettings((prev: UserSettings | null) => prev ? { ...prev, [field]: value } : null);
    setHasChanges(true);
    setSuccess(null);
    setError(null);

    // Apply theme change immediately
    if (field === "theme") {
      setTheme(value as string);
    }
  };

  const handleSave = async () => {
    if (!settings || !hasChanges) return;

    try {
      setIsSaving(true);
      setError(null);
      
      const result = await updateUserSettings(settings);
      
      if (result.success) {
        setSuccess("Appearance settings updated successfully!");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <Alert className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load appearance settings. Please refresh the page and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Appearance</h2>
          <p className="text-muted-foreground">
            Customize the look and feel of your interface.
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

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose how CodinIT.dev looks and feels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.theme}
            onValueChange={(value) => handleSettingChange("theme", value)}
            className="grid grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-2 cursor-pointer">
                <Sun className="h-4 w-4" />
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-2 cursor-pointer">
                <Moon className="h-4 w-4" />
                Dark
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-2 cursor-pointer">
                <Monitor className="h-4 w-4" />
                System
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Language & Region */}
      <Card>
        <CardHeader>
          <CardTitle>Language & Region</CardTitle>
          <CardDescription>
            Set your preferred language and timezone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => handleSettingChange("language", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => handleSettingChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interface Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Interface Preferences</CardTitle>
          <CardDescription>
            Customize how the interface behaves and appears.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="compactMode">Compact Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduce spacing and padding for a denser layout
              </p>
            </div>
            <Switch
              id="compactMode"
              checked={settings.compact_mode}
              onCheckedChange={(checked) => handleSettingChange("compact_mode", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              {settings.animations_enabled ? (
                <Zap className="h-4 w-4 text-primary" />
              ) : (
                <ZapOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="animations">Animations</Label>
                <p className="text-sm text-muted-foreground">
                  Enable smooth transitions and animations
                </p>
              </div>
            </div>
            <Switch
              id="animations"
              checked={settings.animations_enabled}
              onCheckedChange={(checked) => handleSettingChange("animations_enabled", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center gap-2">
              {settings.sound_enabled ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="sounds">Sound Effects</Label>
                <p className="text-sm text-muted-foreground">
                  Play sounds for notifications and interactions
                </p>
              </div>
            </div>
            <Switch
              id="sounds"
              checked={settings.sound_enabled}
              onCheckedChange={(checked) => handleSettingChange("sound_enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your interface will look with these settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`border rounded-lg p-4 space-y-3 ${settings.compact_mode ? 'p-2 space-y-1' : ''}`}>
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <span className="font-medium">Sample Interface Element</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This is how text and spacing will appear with your current settings.
            </p>
            <div className="flex gap-2">
              <Button size={settings.compact_mode ? "sm" : "default"}>
                Primary Button
              </Button>
              <Button variant="outline" size={settings.compact_mode ? "sm" : "default"}>
                Secondary Button
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Note */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Accessibility:</strong> These settings help customize the interface to your preferences. 
          If you have specific accessibility needs, please contact our support team for additional assistance.
        </AlertDescription>
      </Alert>
    </div>
  );
}