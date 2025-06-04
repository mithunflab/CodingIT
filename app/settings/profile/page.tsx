"use client"

import React, { useState, useEffect } from "react"
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
  // Calendar, // Not used directly in form fields, can be removed if not needed elsewhere
  MapPin,
  Globe,
  Save,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { getProfile, updateProfile, type ProfileData as ServerProfileData } from "@/app/actions/profile"
import { createBrowserClient } from "@supabase/ssr"

interface ProfileFormData {
  first_name: string
  last_name: string
  email: string
  company: string
  job_title: string
  location: string
  timezone: string
  bio: string
  work_description: string
  preferences: string
  personalized_responses: boolean
  activity_status: boolean
  profile_visibility: "public" | "private" | "contacts"
  avatar_url?: string | null
}

export default function ProfilePage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [profileData, setProfileData] = useState<ProfileFormData>({
    first_name: "",
    last_name: "",
    email: "", // Will be set from auth user
    company: "",
    job_title: "",
    location: "",
    timezone: "America/Los_Angeles", // Default, will be fetched
    bio: "",
    work_description: "engineering", // Default value
    preferences: "",
    personalized_responses: true,
    activity_status: true,
    profile_visibility: "private",
    avatar_url: null,
  })

  // Client-side Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchProfileAndUserData = async () => {
      setIsFetching(true)
      try {
        // Fetch profile from our server action
        const serverProfile = await getProfile()
        
        // Fetch user from client-side Supabase for email and potentially other auth details
        const { data: { user } } = await supabase.auth.getUser()

        let email = ""
        if (user) {
          email = user.email || ""
        }

        if (serverProfile) {
          setProfileData({
            first_name: serverProfile.first_name || "",
            last_name: serverProfile.last_name || "",
            email: email, // Use email from auth
            company: serverProfile.company || "",
            job_title: serverProfile.job_title || "",
            location: serverProfile.location || "",
            timezone: serverProfile.timezone || "America/Los_Angeles",
            bio: serverProfile.bio || "",
            work_description: serverProfile.work_description || "engineering",
            preferences: serverProfile.preferences || "",
            personalized_responses: serverProfile.personalized_responses !== undefined ? serverProfile.personalized_responses : true,
            activity_status: serverProfile.activity_status !== undefined ? serverProfile.activity_status : true,
            profile_visibility: serverProfile.profile_visibility || "private",
            avatar_url: serverProfile.avatar_url || null,
          })
        } else if (user) { // If no profile in DB, but user is logged in, set email
            setProfileData(prev => ({...prev, email: email}));
        }

      } catch (error) {
        console.error("Failed to fetch profile data", error)
        toast({
          title: "Error",
          description: "Could not load your profile data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsFetching(false)
      }
    }
    fetchProfileAndUserData()
  }, [toast, supabase.auth]) // Added supabase.auth to dependency array

  const handleInputChange = (field: keyof ProfileFormData, value: string | boolean | null) => {
    // Ensure boolean fields are not accidentally set to null if the input type expects boolean
    if (typeof profileData[field] === 'boolean' && typeof value !== 'boolean') {
        // This case should ideally not happen with Switch components, but as a safeguard:
        console.warn(`Type mismatch for field ${field}. Expected boolean, got ${typeof value}`);
        return; 
    }
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Prepare data for the server action, excluding email as it's not updated here
      const { email, ...dataToUpdate } = profileData
      
      const result = await updateProfile(dataToUpdate as Partial<ServerProfileData>)
      
      if (result.success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
          variant: "default",
        })
      } else {
        throw new Error(result.error?.message || "Failed to update profile")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getUserInitials = () => {
    if (isFetching) return "";
    return `${profileData.first_name.charAt(0)}${profileData.last_name.charAt(0)}`.toUpperCase()
  }

  if (isFetching) {
    return (
      <SettingsLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-2">Loading your profile...</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-20 w-full animate-pulse bg-muted rounded-md"></div>
            </CardContent>
          </Card>
        </div>
      </SettingsLayout>
    )
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
                  <AvatarImage src={profileData.avatar_url || ""} alt="Profile" />
                  <AvatarFallback className="text-lg font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  // onClick={() => { /* TODO: Implement avatar upload */ }}
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-foreground">{profileData.first_name} {profileData.last_name}</h3>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
                <Badge variant="secondary" className="w-fit">Pro Plan</Badge> {/* TODO: Make dynamic if plan info is available */}
              </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="first_name">First name</Label>
                <Input
                  id="first_name"
                  value={profileData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                  id="last_name"
                  value={profileData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
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
                  readOnly 
                  className="bg-muted/50 cursor-not-allowed"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Job title
                </Label>
                <Input
                  id="job_title"
                  value={profileData.job_title}
                  onChange={(e) => handleInputChange("job_title", e.target.value)}
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
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={profileData.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent>
                  {/* TODO: Populate with a list of timezones. For now, a few examples. */}
                  <SelectItem value="America/Los_Angeles">Pacific Time (US & Canada)</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (US & Canada)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                  <SelectItem value="Australia/Sydney">Sydney (AEST/AEDT)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_description">What best describes your work?</Label>
              <Select value={profileData.work_description} onValueChange={(value) => handleInputChange("work_description", value)}>
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
                  checked={profileData.personalized_responses}
                  onCheckedChange={(checked) => handleInputChange("personalized_responses", checked)}
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
                  checked={profileData.activity_status}
                  onCheckedChange={(checked) => handleInputChange("activity_status", checked)}
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
              <Label htmlFor="profile_visibility">Profile visibility</Label>
              <Select value={profileData.profile_visibility} onValueChange={(value: "public" | "private" | "contacts") => handleInputChange("profile_visibility", value)}>
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
          <Button onClick={handleSave} disabled={isLoading || isFetching} size="lg" className="gap-2">
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
