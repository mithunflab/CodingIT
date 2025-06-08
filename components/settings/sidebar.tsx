'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { 
  User, 
  Palette, 
  Shield, 
  Globe, 
  Bell, 
  Key,
  Settings
} from 'lucide-react'

const navigation = [
  { name: 'General', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Appearance', href: '/settings/appearance', icon: Palette },
  { name: 'Privacy & Security', href: '/settings/privacy', icon: Shield },
  { name: 'Notifications', href: '/settings/notifications', icon: Bell },
  { name: 'Language & Region', href: '/settings/language', icon: Globe },
  { name: 'API Keys', href: '/settings/api-keys', icon: Key },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Settings
        </h2>
      </div>
      <nav className="px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}