# Supabase Authentication Integration and GitHub Login Fix Plan

## 1. Goal

- Integrate Supabase authentication more deeply into the application.
- Fix the issue where the "Sign In" button in the `NavBar` component is still displayed after a successful GitHub OAuth login and redirect, instead of showing the user's authenticated state.

## 2. Current Situation Analysis

- **`components/auth/SocialAuth.tsx`**: Handles OAuth sign-in requests using the Supabase client. This part seems to be functioning correctly to initiate the login.
- **`components/auth.tsx`**: A component that manages different authentication views (Sign In, Sign Up, etc.) and uses `SocialAuth`. It utilizes a `useAuthForm` hook for local form state (loading, error).
- **`lib/supabase.ts`**: Initializes the Supabase browser client. It does not currently include any global `onAuthStateChange` listeners.
- **`lib/auth.ts`**: Contains the `useAuth` hook. This hook:
    - Calls `supabase.auth.getSession()` on mount to get the initial session.
    - Sets up an `onAuthStateChange` listener to react to login, logout, and other auth events.
    - Manages `session`, `userTeam`, `isLoading`, and `authError` states.
    - This hook is the primary mechanism for knowing the user's authentication status.
- **`components/navbar.tsx`**: Displays either a "Sign In" button or user avatar based on a `session` prop it receives. The logic within `NavBar` itself is correct.
- **`app/providers.tsx`**: Sets up `ThemeProvider` and `PostHogProvider` but lacks a global `AuthProvider`.
- **`app/layout.tsx`**: Confirms no global `AuthProvider` is wrapping the application.

**Root Cause of the GitHub Login Issue:**
The `session` state managed by the `useAuth` hook is not globally available. The `NavBar` component likely receives its `session` prop from a parent component that uses `useAuth` locally. After the OAuth redirect, the `NavBar` (or its parent structure) might not be re-rendering promptly with the updated session from the `onAuthStateChange` listener within `useAuth`, or the instance of `useAuth` it relies on isn't being updated as expected across the application.

## 3. Proposed Solution

To ensure consistent and reactive authentication state across the application, we will implement a global `AuthContext`.

### 3.1. Create an `AuthContext`

- **File:** `contexts/AuthContext.tsx` (new file)
- **Purpose:** To provide the authentication state (`session`, `user`, `userTeam`, `isLoading`, `authError`, `signOut` function, etc.) from `useAuth` to any component in the application.

```tsx
// contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useAuth as useAppAuth } from "@/lib/auth"; // Renaming to avoid conflict if needed
import { supabase } from "@/lib/supabase"; // For signOut

// Define the shape of the context data
interface AuthContextType {
  session: Session | null;
  user: User | null; // Convenience for direct user access
  userTeam: any; // Replace 'any' with your UserTeam type from lib/auth.ts
  isLoading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  // Add other functions or state from useAuth if needed globally
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Assuming setAuthDialog and setAuthView are managed elsewhere or not needed globally
  // If they are, they need to be handled, perhaps by lifting their state or providing stubs.
  // For now, providing dummy functions as they are required by useAuth.
  const setAuthDialog = ()_blank => {}; 
  const setAuthView = ()_blank => {};

  const { session, userTeam, isLoading, authError } = useAppAuth(setAuthDialog, setAuthView);
  const user = session?.user ?? null;

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      // Optionally set an error state here
    }
    // The onAuthStateChange listener in useAuth should handle session and userTeam cleanup.
  };

  return (
    <AuthContext.Provider value={{ session, user, userTeam, isLoading, authError, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
```

### 3.2. Integrate `AuthProvider` into the Application

- **File:** `app/layout.tsx`
- **Action:** Wrap the main application content with `AuthProvider`.

```diff
// app/layout.tsx
import './globals.css'
import { PostHogProvider, ThemeProvider } from './providers'
+import { AuthProvider } from '@/contexts/AuthContext' // Adjust path if needed
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  // ... existing metadata
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PostHogProvider>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
+            <AuthProvider>
              {children}
+            </AuthProvider>
          </ThemeProvider>
          <Toaster />
        </body>
      </PostHogProvider>
    </html>
  )
}
```

### 3.3. Update `NavBar` to Use the `AuthContext`

- **File:** `components/navbar.tsx`
- **Action:** Remove the `session` prop and `signOut` prop. Use the `useAuth` hook from `AuthContext` instead.

```diff
// components/navbar.tsx
"use client"

import Logo from "./logo"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
// ... other imports
-import type { Session } from "@supabase/supabase-js"
import { ArrowRight, LogOut, Trash, Undo, AlertCircle, User, Settings, RefreshCw } from "lucide-react"
import Link from "next/link"
+import { useAuth } from "@/contexts/AuthContext" // Adjust path if needed

export function NavBar({
-  session,
  showLogin,
-  signOut,
  onClear,
  canClear,
  onSocialClick,
  onUndo,
  canUndo,
-  authError, // This will now come from useAuth
  onRetryAuth, // Keep if retry logic is specific to NavBar's parent
}: {
-  session: Session | null
  showLogin: () => void
-  signOut: () => void
  onClear: () => void
  canClear: boolean
  onSocialClick: (target: "github" | "x" | "discord") => void
  onUndo: () => void
  canUndo: boolean
-  authError?: string | null
  onRetryAuth?: () => void
}) {
+  const { session, user, signOut, authError, isLoading } = useAuth(); // Get session and signOut from context

  // Get user display name and avatar
  const getUserDisplayName = () => {
-    if (!session?.user) return "User"
+    if (!user) return "User"

    return (
-      session.user.user_metadata?.full_name ||
-      session.user.user_metadata?.name ||
-      session.user.email?.split("@")[0] ||
+      user.user_metadata?.full_name ||
+      user.user_metadata?.name ||
+      user.email?.split("@")[0] ||
      "User"
    )
  }

  const getUserInitials = () => {
    // ... (no change, uses getUserDisplayName)
  }

  const getAvatarUrl = () => {
-    return session?.user?.user_metadata?.avatar_url || `https://api.google.com/${session?.user?.email || "user"}`
+    return user?.user_metadata?.avatar_url // Fallback can be handled by Avatar component or a default image
  }
  
  // Potentially show a loading state for auth
  // if (isLoading) {
  //   return <nav className="w-full flex bg-background py-4 justify-end"><div className="h-8 w-20 bg-muted animate-pulse rounded"></div></nav>;
  // }

  return (
    <nav className="w-full flex bg-background py-4">
      {/* ... existing navbar structure ... */}

      {/* Auth Error Alert - now uses authError from context */}
      {authError && (
        <div className="flex items-center mr-4">
          <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {authError}
              {/* onRetryAuth might need to trigger a re-fetch or re-init within useAuth if it's a global auth issue */}
              {onRetryAuth && ( 
                <Button variant="outline" size="sm" onClick={onRetryAuth} className="ml-2 h-6 text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* ... existing gap-1 md:gap-4 div ... */}

        {session ? ( // session from useAuth()
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
-                          src={getAvatarUrl() || "/placeholder.svg"}
+                          src={getAvatarUrl() || ""} // Let AvatarFallback handle missing src
                          alt={getUserDisplayName()}
                        />
                        <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>My Account</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
-                  <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
+                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>

              {/* ... other dropdown items ... */}

              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive"> {/* signOut from useAuth() */}
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="default" onClick={showLogin}>
            Sign in
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </nav>
  )
}

```

### 3.4. Refactor Components Using `useAuth` Locally (If Any)

- **Identify:** Find any other components that directly call the original `useAuth` from `lib/auth.ts` for session management.
- **Action:** Refactor them to use the new `useAuth` hook from `AuthContext.tsx`. This ensures all parts of the app share the same auth state.
- **Example:** If `app/page.tsx` or other page components use `useAuth` to control page access or display user-specific info, they should be updated.

### 3.5. Review `lib/auth.ts` (`useAppAuth`)

- The `setAuthDialog` and `setAuthView` parameters in the original `useAuth` (now `useAppAuth`) were used to control a modal's visibility and view. If this auth modal is still part of the flow and needs to be controlled globally, its state might also need to be lifted into `AuthContext` or managed via a separate global state solution (like Zustand or Jotai if already in use, or another context).
- For this plan, we've provided dummy functions in `AuthContext.tsx` for `setAuthDialog` and `setAuthView`. If these are critical for the auth flow triggered from various places, a more robust solution for managing the auth modal state globally will be needed. However, the primary goal here is fixing the `NavBar` display, which relies on `session`.

## 4. Testing and Verification

- After implementing the changes:
    - Test the GitHub login flow. Verify that after successful authentication and redirect, the `NavBar` correctly displays the user's avatar/info and not the "Sign In" button.
    - Test email/password login and magic link login (if configured) to ensure they still work correctly.
    - Test the sign-out functionality.
    - Verify that pages requiring authentication are still protected and redirect to login if no session exists.
    - Check the browser console for any new errors related to authentication or context usage.

## 5. Potential Considerations

- **Type Safety:** Ensure `UserTeam` type is correctly imported and used in `AuthContext.tsx`.
- **Auth Modal State:** If the `AuthDialog` (controlled by `setAuthDialog` and `setAuthView`) needs to be triggered from various parts of the app (e.g., clicking "Sign In" in `NavBar`), its state management might need to be integrated into `AuthContext` or another global state solution. The `showLogin` prop in `NavBar` likely triggers this dialog. The connection between `showLogin` and the actual dialog display mechanism needs to be clear.
- **Server Components:** The `useAuth` hook (and thus `AuthContext`) is client-side. For server components needing auth state, you'll rely on Supabase helper functions for Next.js (e.g., `createServerComponentClient`) to get the session on the server. This plan focuses on client-side reactivity.

This plan provides a clear path to resolving the GitHub login display issue by centralizing authentication state management.
