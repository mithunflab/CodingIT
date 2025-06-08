"use client";

import * as React from "react";
import { 
  Settings as GearIcon, 
  User as PersonIcon, 
  Lock as LockClosedIcon,
  Palette,
  CreditCard as CreditCardIcon,
  Key as KeyIcon,
  Globe as GlobeIcon,
  X as Cross2Icon
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
    icon: <PersonIcon className="h-4 w-4" />,
    path: "/settings/profile"
  },
  {
    id: "account",
    title: "Account",
    description: "Manage your account settings",
    icon: <GearIcon className="h-4 w-4" />,
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
    icon: <LockClosedIcon className="h-4 w-4" />,
    path: "/settings/privacy"
  }
];

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node) && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onOpenChange]);

  const handleNavItemClick = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };

  const isActiveItem = (path: string) => {
    return pathname === path;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="fixed left-1/2 top-1/2 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 transform"
          >
            <div className="mx-4 h-[85vh] overflow-hidden rounded-lg border border-[#ffffff]/10 bg-white/95 shadow-xl backdrop-blur-xl dark:bg-[#0a0a0a]/95">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#181818]/10 p-4 dark:border-[#ffffff]/10">
                <div className="flex items-center gap-3">
                  <GearIcon className="h-5 w-5 text-[#181818]/70 dark:text-[#f2f2f2]/70" />
                  <h1 className="text-lg font-semibold text-[#181818] dark:text-[#f2f2f2]">
                    Settings
                  </h1>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[#181818]/50 transition-colors hover:bg-[#181818]/10 hover:text-[#181818] dark:text-[#f2f2f2]/50 dark:hover:bg-[#ffffff]/10 dark:hover:text-[#f2f2f2]"
                >
                  <Cross2Icon className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex h-[calc(100%-73px)]">
                {/* Sidebar Navigation */}
                <div className="w-64 border-r border-[#181818]/10 bg-[#181818]/5 p-4 dark:border-[#ffffff]/10 dark:bg-[#ffffff]/5">
                  <nav className="space-y-1">
                    {settingsNavItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavItemClick(item.path)}
                        className={`flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors ${
                          isActiveItem(item.path)
                            ? "bg-[#181818]/10 text-[#181818] dark:bg-[#ffffff]/10 dark:text-[#f2f2f2]"
                            : "text-[#181818]/70 hover:bg-[#181818]/5 hover:text-[#181818] dark:text-[#f2f2f2]/70 dark:hover:bg-[#ffffff]/5 dark:hover:text-[#f2f2f2]"
                        }`}
                      >
                        <div className="mt-0.5 flex h-5 w-5 items-center justify-center">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.title}</div>
                          <div className="text-xs text-[#181818]/50 dark:text-[#f2f2f2]/50">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-auto">
                  <div className="p-6">
                    <div className="max-w-2xl">
                      <h2 className="mb-2 text-xl font-semibold text-[#181818] dark:text-[#f2f2f2]">
                        Choose a settings category
                      </h2>
                      <p className="text-sm text-[#181818]/70 dark:text-[#f2f2f2]/70">
                        Select a category from the sidebar to configure your preferences.
                      </p>
                      
                      {/* Quick Settings Cards */}
                      <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        {settingsNavItems.slice(0, 4).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleNavItemClick(item.path)}
                            className="flex items-start gap-4 rounded-lg border border-[#181818]/10 p-4 text-left transition-colors hover:border-[#181818]/20 hover:bg-[#181818]/5 dark:border-[#ffffff]/10 dark:hover:border-[#ffffff]/20 dark:hover:bg-[#ffffff]/5"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#181818]/10 dark:bg-[#ffffff]/10">
                              {item.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-[#181818] dark:text-[#f2f2f2]">
                                {item.title}
                              </h3>
                              <p className="text-sm text-[#181818]/70 dark:text-[#f2f2f2]/70">
                                {item.description}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}