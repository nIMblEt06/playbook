'use client'

import { Header } from './header'
import { Sidebar } from './sidebar'
import { RightSidebar } from './right-sidebar'
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

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col">
        <Header />
        <div className={`flex-1 ${currentTrack ? 'pb-24' : ''}`}>{children}</div>
      </main>

      {showRightSidebar && <RightSidebar />}
    </div>
  )
}
