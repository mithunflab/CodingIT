'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Sparkles, Zap } from 'lucide-react'
import { useState } from 'react'

export default function ProfileSettings() {
  const [fullName, setFullName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [workDescription, setWorkDescription] = useState('')
  const [aiAssistance, setAiAssistance] = useState(true)
  const [smartSuggestions, setSmartSuggestions] = useState(false)

  const handleSave = () => {
    // Handle form submission
    console.log('Saving profile settings...')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="displayName">What should we call you?</Label>
              <Input
                id="displayName"
                placeholder="Your preferred name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workDescription">What best describes your work?</Label>
            <Select value={workDescription} onValueChange={setWorkDescription}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="developer">Software Developer</SelectItem>
                <SelectItem value="designer">UI/UX Designer</SelectItem>
                <SelectItem value="product-manager">Product Manager</SelectItem>
                <SelectItem value="data-scientist">Data Scientist</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="entrepreneur">Entrepreneur</SelectItem>
                <SelectItem value="researcher">Researcher</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>Save changes</Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h3 className="text-lg font-medium mb-4">Features</h3>
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium">AI Code Assistance</h4>
                  <p className="text-sm text-muted-foreground">
                    Get intelligent code suggestions and explanations while you build your applications.
                  </p>
                </div>
              </div>
              <Switch
                checked={aiAssistance}
                onCheckedChange={setAiAssistance}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-secondary/10 p-2">
                  <Zap className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium">Smart Suggestions</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive contextual suggestions for templates, components, and best practices.
                  </p>
                </div>
              </div>
              <Switch
                checked={smartSuggestions}
                onCheckedChange={setSmartSuggestions}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}