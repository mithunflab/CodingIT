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
import { ArrowRight, LogOut, Trash, Undo, AlertCircle, User, Settings, RefreshCw, Wrench, FileBoxIcon } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

export function NavBar({
  showLogin,
  onClear,
  canClear,
  onSocialClick,
  onUndo,
  canUndo,
  onRetryAuth,
  onOpenToolsModal,
}: {
  showLogin: () => void
  onClear: () => void
  canClear: boolean
  onSocialClick: (target: "github" | "x" | "discord") => void
  onUndo: () => void
  canUndo: boolean
  authError?: string | null // Removed
  onRetryAuth?: () => void
  onOpenToolsModal?: () => void
}) {
  const { session, user, signOut, authError, isLoading } = useAuth();

  const getUserDisplayName = () => {
    if (!user) return "User"

    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
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
    return user?.user_metadata?.avatar_url
  }
  
  // Optional: Add a loading state indicator if desired
  if (isLoading) {
  return (
  <nav className="w-full flex bg-background py-4 items-center">
   <div className="flex flex-1 items-center">
     {/* Simplified Logo area for loading state */}
     </div>
        <div className="flex items-center gap-1 md:gap-4">
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse"></div>
             <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
           </div>
        </nav>
      );
    }

  return (
    <nav className="w-full flex bg-background py-4">
      <div className="flex flex-1 items-center">
        <Link href="/" className="flex items-center gap-3 group" target="_blank">
          <div className="transition-transform duration-200 group-hover:scale-110">
            <Logo />
          </div>
          <span className="whitespace-pre"></span>
        </Link>
        <Link
          href="https://codinit.dev"
          className="font-bold text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent hover:from-primary/80 hover:to-primary transition-all duration-200 font-mono tracking-tight"
          target="_blank"
        >
          CodinIT.dev
        </Link>
      </div>

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

        {session && onOpenToolsModal && (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onOpenToolsModal}>
                  <Wrench className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open Tools</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {session ? (
          <DropdownMenu>
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getAvatarUrl() || ""}
                          alt={getUserDisplayName()}
                          onError={(e) => {
                            e.currentTarget.src = "/avatar.png"
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
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

                <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
                </DropdownMenuItem>

              <Link href="/projects">
              <DropdownMenuItem className="cursor-pointer">
                <FileBoxIcon className="mr-2 h-4 w-4" />
                <span>Projects</span>
              </DropdownMenuItem>
              </Link>
                
              <Link href="/settings">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              </Link>


              <DropdownMenuSeparator />

              <Link href="https://github.com/Gerome-Elassaad/CodingIT">
              <DropdownMenuItem onClick={() => onSocialClick("github")} className="cursor-pointer">
                <GitHubLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Star on GitHub
              </DropdownMenuItem>
              </Link>


              <DropdownMenuItem onClick={() => onSocialClick("discord")} className="cursor-pointer">
                <DiscordLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Join us on Discord
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onSocialClick("x")} className="cursor-pointer">
                <TwitterLogoIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Follow us on X
              </DropdownMenuItem>

              <DropdownMenuSeparator />

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
