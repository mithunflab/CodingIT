export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName?: string
  birthYear?: number
  role?: string
  avatarUrl?: string
  bio?: string
  createdAt: string
  updatedAt: string
  preferences: UserPreferences
}

export interface UserPreferences {
  theme?: "light" | "dark" | "system"
  emailNotifications: boolean
  newsletterFrequency: "never" | "weekly" | "monthly"
  workspaceName?: string
  workspaceVisibility?: "public" | "private"
  workspaceDescription?: string
}

export type UserProfileFormData = Omit<UserProfile, "id" | "createdAt" | "updatedAt" | "fullName">

export type ProfileUpdateResponse = {
  success: boolean
  message: string
  user?: UserProfile
  errors?: Record<string, string>
}
