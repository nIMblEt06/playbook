import type { Metadata } from 'next'
import { Space_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
})

const spaceGrotesk = Space_Grotesk({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Play Book - Discover Music Through People You Trust',
  description: 'A music-focused social platform for music enthusiasts to discover, discuss, and share music through trusted communities.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${spaceMono.variable} ${spaceGrotesk.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
