import './globals.css'
import { clientEnvironment } from '@/lib/env/client-env'
import { fontMono, fontSans } from '@/lib/fonts'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Toaster } from 'sonner'
import Provider from '../components/provider'

export const metadata: Metadata = {
  title: 'Redirect.link',
  description: 'An open source URL shortener.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-[100dvh] bg-secondary font-sans antialiased',
          fontMono.variable,
          fontSans.variable,
        )}
      >
        <Provider>
          {children}
          <Toaster expand={true} richColors />
        </Provider>
      </body>

      {/* optional: umami analytics */}
      {clientEnvironment.NEXT_PUBLIC_UMAMI_URL && (
        <Script
          async
          defer
          src={`${clientEnvironment.NEXT_PUBLIC_UMAMI_URL}/script.js`}
          data-website-id={`${clientEnvironment.NEXT_PUBLIC_UMAMI_WEBSITE_ID}`}
        />
      )}
    </html>
  )
}
