import './globals.css'
import { AuthProvider, PostHogProvider, ThemeProvider } from './providers'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

export const metadata: Metadata = {
  metadataBase: new URL('https://codingit.vercel.app'),
  title: 'CodinIT.dev',
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
    { rel: "icon", type: "image/x-icon", url: "/favicon.ico" },
  ],
  openGraph: {
    title: "CodinIT.dev",
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PostHogProvider>
            <AuthProvider>{children}</AuthProvider>
          </PostHogProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
