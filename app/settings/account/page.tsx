"use client";

import * as React from "react";
import { ExclamationTriangleIcon, TrashIcon } from "@radix-ui/react-icons";

export default function AccountPage() {
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [marketingEmails, setMarketingEmails] = React.useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Account Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account preferences and security settings.
        </p>
      </div>

      {/* Email Settings */}
      <div className="space-y-4">
        <h4 className="text-base font-medium">Email Preferences</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Email Notifications</div>
              <div className="text-xs text-muted-foreground">
                Receive email notifications for important updates
              </div>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailNotifications ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Marketing Emails</div>
              <div className="text-xs text-muted-foreground">
                Receive emails about new features and promotions
              </div>
            </div>
            <button
              onClick={() => setMarketingEmails(!marketingEmails)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                marketingEmails ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  marketingEmails ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="space-y-4">
        <h4 className="text-base font-medium">Security</h4>
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Two-Factor Authentication</div>
                <div className="text-xs text-muted-foreground">
                  Add an extra layer of security to your account
                </div>
              </div>
              <button
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  twoFactorEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            {twoFactorEnabled && (
              <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                Two-factor authentication is enabled
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Password</div>
            <button className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
              Change password
            </button>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Login Sessions</div>
            <div className="text-xs text-muted-foreground">
              Manage your active login sessions across devices
            </div>
            <button className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
              View active sessions
            </button>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="space-y-4">
        <h4 className="text-base font-medium">Data Management</h4>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="text-sm font-medium">Export Data</div>
            <div className="text-xs text-muted-foreground">
              Download a copy of your data including projects, files, and settings
            </div>
            <button className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
              Request data export
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-destructive">Danger Zone</h4>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-sm font-medium">Delete Account</div>
                <div className="text-xs text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </div>
              </div>
              <button className="flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
                <TrashIcon className="h-4 w-4" />
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}