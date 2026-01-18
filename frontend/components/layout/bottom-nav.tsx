'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Activity, Search, Library } from 'lucide-react'
import { usePlayerStore } from '@/lib/store/player-store'

export function BottomNav() {
  const pathname = usePathname()
  const currentTrack = usePlayerStore((state) => state.currentTrack)

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Activity', href: '/activity', icon: Activity },
    { label: 'Discover', href: '/discover', icon: Search },
    { label: 'Library', href: '/library', icon: Library },
  ]

  return (
    <nav
      className={`fixed left-0 right-0 z-40 md:hidden bg-background border-t-2 border-border ${
        currentTrack ? 'bottom-16' : 'bottom-0'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[64px] py-2 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-foreground'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className="w-6 h-6 mb-1"
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium uppercase tracking-wide">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
