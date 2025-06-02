"use client"

import React, { useState } from "react"
import SettingsLayout from "@/components/settings-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { 
  Camera, 
  User, 
  Mail, 
  Building, 
  Calendar,
  MapPin,
  Globe,
  Save,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

interface ProfileFormData {
  firstName: string
  lastName: string
  email: string
  company: string
  jobTitle: string
  location: string
  timezone: string
  bio: string
  workDescription: string
  preferences: string
  personalizedResponses: boolean
  activityStatus: boolean
  profileVisibility: "public" | "private" | "contacts"
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: "John",
    lastName: "Doe", 
    email: "john.doe@example.com",
    company: "Tech Corp",
    jobTitle: "Software Engineer",
    location: "San Francisco, CA",
    timezone: "America/Los_Angeles",
    bio: "",
    workDescription: "Engineering",
    preferences: "",
    personalizedResponses: true,
    activityStatus: true,
    profileVisibility: "private"
  })

  const handleInputChange = (field: keyof ProfileFormData, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getUserInitials = () => {
    return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <SettingsLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and how Claude interacts with you.
          </p>
        </div>

        {/* Profile Picture & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and profile settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt="Profile" />
                  <AvatarFallback className="text-lg font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-foreground">{profileData.firstName} {profileData.lastName}</h3>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
                <Badge variant="secondary" className="w-fit">Pro Plan</Badge>
              </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Job title
                </Label>
                <Input
                  id="jobTitle"
                  value={profileData.jobTitle}
                  onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                  placeholder="Enter your job title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profileData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="Enter your company"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Enter your location"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workDescription">What best describes your work?</Label>
              <Select value={profileData.workDescription} onValueChange={(value) => handleInputChange("workDescription", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your work area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="engineering">Engineering & Development</SelectItem>
                  <SelectItem value="design">Design & Creative</SelectItem>
                  <SelectItem value="product">Product Management</SelectItem>
                  <SelectItem value="marketing">Marketing & Communications</SelectItem>
                  <SelectItem value="sales">Sales & Business Development</SelectItem>
                  <SelectItem value="research">Research & Academia</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="education">Education & Training</SelectItem>
                  <SelectItem value="healthcare">Healthcare & Life Sciences</SelectItem>
                  <SelectItem value="finance">Finance & Accounting</SelectItem>
                  <SelectItem value="legal">Legal & Compliance</SelectItem>
                  <SelectItem value="operations">Operations & Management</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us a bit about yourself..."
                className="min-h-[80px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {profileData.bio.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              AI Interaction Preferences
              <Badge variant="outline" className="ml-2">Beta</Badge>
            </CardTitle>
            <CardDescription>
              Customize how Claude responds to you based on your preferences and context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="preferences">Personal preferences for Claudes responses</Label>
              <Textarea
                id="preferences"
                value={profileData.preferences}
                onChange={(e) => handleInputChange("preferences", e.target.value)}
                placeholder="Describe your communication style preferences, areas of expertise, or specific ways you'd like Claude to tailor responses to you..."
                className="min-h-[100px]"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {profileData.preferences.length}/1000 characters
              </p>
              <p className="text-sm text-muted-foreground">
                Your preferences will apply to all conversations, within Anthropics guidelines.{" "}
                <a href="#" className="text-primary hover:underline">
                  Learn about preferences
                </a>
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Personalized responses</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow Claude to use your profile information to provide more relevant responses
                  </p>
                </div>
                <Switch
                  checked={profileData.personalizedResponses}
                  onCheckedChange={(checked) => handleInputChange("personalizedResponses", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Activity status</Label>
                  <p className="text-sm text-muted-foreground">
                    Share your online status with Claude for context-aware responses
                  </p>
                </div>
                <Switch
                  checked={profileData.activityStatus}
                  onCheckedChange={(checked) => handleInputChange("activityStatus", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Privacy & Visibility
            </CardTitle>
            <CardDescription>
              Control who can see your profile information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="profileVisibility">Profile visibility</Label>
              <Select value={profileData.profileVisibility} onValueChange={(value: "public" | "private" | "contacts") => handleInputChange("profileVisibility", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private - Only you can see your profile</SelectItem>
                  <SelectItem value="contacts">Contacts - Only your contacts can see your profile</SelectItem>
                  <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading} size="lg" className="gap-2">
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </SettingsLayout>
  )
}