"use client"

import Logo from "./logo"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DiscordLogoIcon, GitHubLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons"
import type { Session } from "@supabase/supabase-js"
import { ArrowRight, LogOut, Trash, Undo, AlertCircle, User, Settings, RefreshCw } from "lucide-react"
import Link from "next/link"

export function NavBar({
  session,
  showLogin,
  signOut,
  onClear,
  canClear,
  onSocialClick,
  onUndo,
  canUndo,
  authError,
  onRetryAuth,
}: {
  session: Session | null
  showLogin: () => void
  signOut: () => void
  onClear: () => void
  canClear: boolean
  onSocialClick: (target: "github" | "x" | "discord") => void
  onUndo: () => void
  canUndo: boolean
  authError?: string | null
  onRetryAuth?: () => void
}) {
  // Get user display name and avatar
  const getUserDisplayName = () => {
    if (!session?.user) return "User"

    return (
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email?.split("@")[0] ||
      "User"
    )
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name
      .split(" ")
 .map((word: string) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getAvatarUrl = () => {
    return session?.user?.user_metadata?.avatar_url || `https://api.google.com/${session?.user?.email || "user"}`
  }

  return (
    <nav className="w-full flex bg-background py-4">
      <div className="flex flex-1 items-center">
        <Link href="/" className="flex items-center gap-2" target="_blank">
          <Logo width={24} height={24} />
          <h1 className="whitespace-pre">Fragments by </h1>
        </Link>
        <Link
          href="https://codinit.dev"
          className="underline decoration-primary/30 decoration-2 text-primary"
          target="_blank"
        >
          CodinIT
        </Link>
      </div>

      {/* Auth Error Alert */}
      {authError && (
        <div className="flex items-center mr-4">
          <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {authError}
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

      <div className="flex items-center gap-1 md:gap-4">
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
                <Undo className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onClear} disabled={!canClear}>
                <Trash className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <ThemeToggle />
            </TooltipTrigger>
            <TooltipContent>Toggle theme</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {session ? (
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getAvatarUrl() || "/placeholder.svg"}
                          alt={getUserDisplayName()}
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            e.currentTarget.style.display = "none"
                          }}
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
                  <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
                </DropdownMenuItem>

              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  window.open("https://codinIT.dev", "_blank")
                }}
                className="cursor-pointer"
              >
                <Logo className="mr-2 h-4 w-4 text-muted-foreground" />
                About CodinIT
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onSocialClick("github")} className="cursor-pointer">
                <GitHubLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Star on GitHub
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onSocialClick("discord")} className="cursor-pointer">
                <DiscordLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Join us on Discord
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onSocialClick("x")} className="cursor-pointer">
                <TwitterLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Follow us on X
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
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
