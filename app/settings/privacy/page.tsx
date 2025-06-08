// File: app/settings/privacy/page.tsx

"use client";

import * as React from "react";
import { 
  LockClosedIcon, 
  EyeOpenIcon, 
  EyeNoneIcon,
  InfoCircledIcon,
  DownloadIcon,
  TrashIcon
} from "@radix-ui/react-icons";

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  category: "data" | "visibility" | "communications" | "security";
}

const privacySettings: PrivacySetting[] = [
  {
    id: "profile-visibility",
    title: "Public Profile",
    description: "Make your profile visible to other users",
    enabled: true,
    category: "visibility"
  },
  {
    id: "activity-visibility", 
    title: "Activity Status",
    description: "Show when you're online and active",
    enabled: false,
    category: "visibility"
  },
  {
    id: "project-visibility",
    title: "Public Projects",
    description: "Allow others to discover your public projects",
    enabled: true,
    category: "visibility"
  },
  {
    id: "analytics",
    title: "Usage Analytics",
    description: "Help improve our service by sharing anonymous usage data",
    enabled: true,
    category: "data"
  },
  {
    id: "personalization",
    title: "Data Personalization",
    description: "Use your data to personalize your experience",
    enabled: true,
    category: "data"
  },
  {
    id: "third-party-data",
    title: "Third-party Data Sharing",
    description: "Allow sharing data with trusted partners for enhanced features",
    enabled: false,
    category: "data"
  },
  {
    id: "marketing-communications",
    title: "Marketing Communications",
    description: "Receive updates about new features and promotions",
    enabled: false,
    category: "communications"
  },
  {
    id: "community-communications",
    title: "Community Updates",
    description: "Get notified about community events and discussions",
    enabled: true,
    category: "communications"
  },
  {
    id: "security-alerts",
    title: "Security Alerts",
    description: "Receive important security-related notifications",
    enabled: true,
    category: "security"
  }
];

const categories = {
  visibility: {
    title: "Visibility & Discovery",
    description: "Control how others can find and interact with you"
  },
  data: {
    title: "Data & Analytics", 
    description: "Manage how your data is collected and used"
  },
  communications: {
    title: "Communications",
    description: "Choose what emails and notifications you receive"
  },
  security: {
    title: "Security & Safety",
    description: "Security-related privacy settings"
  }
};

export default function PrivacyPage() {
  const [settings, setSettings] = React.useState<Record<string, boolean>>(
    Object.fromEntries(privacySettings.map(s => [s.id, s.enabled]))
  );

  const toggleSetting = (settingId: string) => {
    setSettings(prev => ({
      ...prev,
      [settingId]: !prev[settingId]
    }));
  };

  const groupedSettings = privacySettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, PrivacySetting[]>);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Privacy Settings</h3>
        <p className="text-sm text-muted-foreground">
          Control your privacy preferences and how your data is used.
        </p>
      </div>

      {/* Privacy Overview */}
      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
        <div className="flex gap-3">
          <InfoCircledIcon className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Your Privacy Matters
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Were committed to protecting your privacy. You have full control over your data and how it is used.
              Review our{" "}
              <button className="underline hover:no-underline">Privacy Policy</button>{" "}
              for more details.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Settings by Category */}
      {Object.entries(groupedSettings).map(([categoryKey, categorySettings]) => {
        const category = categories[categoryKey as keyof typeof categories];
        
        return (
          <div key={categoryKey} className="space-y-4">
            <div>
              <h4 className="text-base font-medium">{category.title}</h4>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>
            
            <div className="space-y-4">
              {categorySettings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-medium">{setting.title}</h5>
                      {setting.category === "security" && (
                        <LockClosedIcon className="h-3 w-3 text-muted-foreground" />
                      )}
                      {setting.category === "visibility" && (
                        settings[setting.id] ? (
                          <EyeOpenIcon className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <EyeNoneIcon className="h-3 w-3 text-muted-foreground" />
                        )
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  
                  <button
                    onClick={() => toggleSetting(setting.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings[setting.id] ? "bg-primary" : "bg-muted"
                    }`}
                    disabled={setting.id === "security-alerts"} // Security alerts should always be enabled
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings[setting.id] ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Data Management */}
      <div className="space-y-4">
        <h4 className="text-base font-medium">Data Management</h4>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DownloadIcon className="h-4 w-4 text-muted-foreground" />
                <h5 className="text-sm font-medium">Export Your Data</h5>
              </div>
              <p className="text-sm text-muted-foreground">
                Download a copy of all your data including projects, settings, and activity history.
              </p>
              <button className="rounded-md border px-3 py-2 text-sm hover:bg-accent">
                Request data export
              </button>
            </div>
          </div>
          
          <div className="rounded-lg border p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrashIcon className="h-4 w-4 text-destructive" />
                <h5 className="text-sm font-medium">Delete Your Data</h5>
              </div>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button className="rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Preferences */}
      <div className="space-y-4">
        <h4 className="text-base font-medium">Cookie Preferences</h4>
        <div className="rounded-lg border p-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Cookie Categories</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">Essential Cookies</div>
                    <div className="text-xs text-muted-foreground">Required for basic functionality</div>
                  </div>
                  <div className="text-xs text-muted-foreground">Always active</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">Analytics Cookies</div>
                    <div className="text-xs text-muted-foreground">Help us improve our service</div>
                  </div>
                  <button
                    onClick={() => toggleSetting("analytics")}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings["analytics"] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings["analytics"] ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">Marketing Cookies</div>
                    <div className="text-xs text-muted-foreground">Personalized content and ads</div>
                  </div>
                  <button
                    onClick={() => toggleSetting("marketing-communications")}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      settings["marketing-communications"] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings["marketing-communications"] ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
            
            <button className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
              Manage cookie preferences
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Save privacy settings
        </button>
      </div>
    </div>
  );
}