"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Cog, 
  PersonStanding, 
  LockIcon, 
  Palette,
  CreditCardIcon,
  KeyIcon,
  GlobeIcon,
  ArrowLeftIcon
} from "lucide-react";

interface SettingsNavItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const settingsNavItems: SettingsNavItem[] = [
  {
    id: "profile",
    title: "Profile",
    description: "Manage your profile information",
    icon: <PersonStanding className="h-4 w-4" />,
    path: "/settings/profile"
  },
  {
    id: "account",
    title: "Account",
    description: "Manage your account settings",
    icon: <Cog className="h-4 w-4" />,
    path: "/settings/account"
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Customize your interface",
    icon: <Palette className="h-4 w-4" />,
    path: "/settings/appearance"
  },
  {
    id: "api-keys",
    title: "API Keys",
    description: "Manage your API keys",
    icon: <KeyIcon className="h-4 w-4" />,
    path: "/settings/api-keys"
  },
  {
    id: "billing",
    title: "Billing",
    description: "Manage billing and subscriptions",
    icon: <CreditCardIcon className="h-4 w-4" />,
    path: "/settings/billing"
  },
  {
    id: "integrations",
    title: "Integrations",
    description: "Connect external services",
    icon: <GlobeIcon className="h-4 w-4" />,
    path: "/settings/integrations"
  },
  {
    id: "privacy",
    title: "Privacy",
    description: "Configure privacy settings",
    icon: <LockIcon className="h-4 w-4" />,
    path: "/settings/privacy"
  }
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActiveItem = (path: string) => {
    return pathname === path;
  };

  const getCurrentPageTitle = () => {
    const currentItem = settingsNavItems.find(item => isActiveItem(item.path));
    return currentItem?.title || "Settings";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to app
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Cog className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar Navigation */}
          <aside className="space-y-2">
            <nav className="space-y-1">
              {settingsNavItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`flex items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActiveItem(item.path)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
                >
                  <div className="mt-0.5 flex h-4 w-4 items-center justify-center">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  </div>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="space-y-6">
            <div className="rounded-lg border bg-card">
              <div className="border-b p-6">
                <h2 className="text-lg font-semibold">{getCurrentPageTitle()}</h2>
              </div>
              <div className="p-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}