'use client'

import { SettingsProvider } from '@/lib/settings-context'

export function SettingsProviderWrapper({ children }: { children: React.ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}