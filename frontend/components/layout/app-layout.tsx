'use client'

import { Header } from './header'
import { Sidebar } from './sidebar'
import { RightSidebar } from './right-sidebar'
import { BottomNav } from './bottom-nav'
import { usePathname } from 'next/navigation'
import { usePlayerStore } from '@/lib/store/player-store'

interface AppLayoutProps {
  children: React.ReactNode
  showRightSidebar?: boolean
}

export function AppLayout({ children, showRightSidebar = true }: AppLayoutProps) {
  const pathname = usePathname()
  const currentTrack = usePlayerStore((state) => state.currentTrack)

  // Don't show layout for auth pages
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (isAuthPage) {
    return <>{children}</>
  }

  // Bottom padding for content:
  // Mobile: bottom nav (64px) + player if active (64px)
  // Desktop: player if active (80px)
  const bottomPadding = currentTrack
    ? 'pb-32 md:pb-24' // mobile: 64+64=128px, desktop: 80px
    : 'pb-16 md:pb-0'  // mobile: 64px for bottom nav, desktop: none

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar - hidden on mobile, shown on md+ */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex-1 min-w-0 flex flex-col">
        <Header />
        <div className={`flex-1 ${bottomPadding}`}>{children}</div>
      </main>

      {/* Right sidebar - hidden on mobile/tablet, shown on lg+ */}
      {showRightSidebar && (
        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      )}

      {/* Bottom nav - shown only on mobile */}
      <BottomNav />
    </div>
  )
}
