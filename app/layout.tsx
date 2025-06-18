import './globals.css'
import { PostHogProvider, ThemeProvider } from './providers'
import { AuthProvider } from '@/contexts/AuthContext' // Adjust path if needed
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://codingit.vercel.app'),
  title: 'CodinIT',
  keywords: [
    'AI software engineer',
    'open source',
    'live code execution',
    'file uploads',
    'real-time chat',
    'codinit',
    'codingit',
    'lovable.dev alternative',
    'bolt.new alternative',
    'v0.dev alternative'
  ],
  description: 'Open-source alternative to lovable.dev, bolt.new & v0.dev. AI software engineer — live code execution, file uploads, & real-time chat blazing-fast.',
  icons: [
    { rel: "apple-touch-icon", sizes: "180x180", url: "/apple-touch-icon.png" },
    { rel: "icon", type: "image/x-icon", url: "/favicon.ico" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/icons/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/icons/favicon-16x16.png" },
    { rel: "icon", type: "image/png", sizes: "192x192", url: "/android-chrome-192x192.png" },
    { rel: "icon", type: "image/png", sizes: "512x512", url: "/android-chrome-512x512.png" }
  ],
  manifest: "/site.webmanifest",
  openGraph: {
    title: "CodinIT.dev - #1 Open Source AI App Builder",
    description: "Open-source alternative to lovable.dev, bolt.new & v0.dev. AI software engineer — live code execution, file uploads, & real-time chat blazing-fast.",
    images: ["/opengraph.png"],
    url: "https://codingit.vercel.app",
    siteName: "CodinIT.dev",
    type: "website",
    locale: "en_US",
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <PostHogProvider>
        <body className={inter.className}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
          <Toaster />
        </body>
      </PostHogProvider>
    </html>
  )
}