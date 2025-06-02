"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronLeft, User, Palette, Shield, CreditCard, Settings as SettingsIcon, Zap } from "lucide-react"

interface SettingsLayoutProps {
  children: React.ReactNode
}

const settingsNavItems = [
  {
    href: "/settings/profile",
    label: "Profile",
    icon: User,
  },
  {
    href: "/settings/appearance", 
    label: "Appearance",
    icon: Palette,
  },
  {
    href: "/settings/account",
    label: "Account", 
    icon: SettingsIcon,
  },
  {
    href: "/settings/privacy",
    label: "Privacy",
    icon: Shield,
  },
  {
    href: "/settings/billing",
    label: "Billing",
    icon: CreditCard,
  },
  {
    href: "/settings/integrations",
    label: "Integrations",
    icon: Zap,
  },
]

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-6">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to chat
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-background/50 min-h-[calc(100vh-4rem)]">
          <div className="p-6">
            <h1 className="text-2xl font-semibold mb-8">Settings</h1>
            
            <nav className="space-y-1">
              {settingsNavItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="max-w-4xl mx-auto px-8 py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}