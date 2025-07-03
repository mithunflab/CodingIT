'use client'

import { SettingsProvider as OriginalSettingsProvider } from '@/components/settings-context'

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  return <OriginalSettingsProvider>{children}</OriginalSettingsProvider>
}
