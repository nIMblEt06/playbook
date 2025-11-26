'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, User } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import { useUIStore } from '@/lib/store/ui-store'
import Image from 'next/image'

export function Header() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()
  const { currentFeedFilter, setFeedFilter } = useUIStore()

  const tabs = [
    { label: 'For You', value: 'all' as const },
    { label: 'Following', value: 'following' as const },
    { label: 'Communities', value: 'communities' as const },
  ]

  const showTabs = pathname === '/'

  return (
    <header className="sticky top-0 z-50 bg-background border-b-2 border-border">
      <div className="px-6 py-3 flex items-center justify-between">
        {showTabs && (
          <div className="flex items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFeedFilter(tab.value)}
                className={`px-4 py-2 text-sm font-medium uppercase tracking-wide transition-all ${
                  currentFeedFilter === tab.value
                    ? 'bg-foreground text-background'
                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {!showTabs && (
          <div className="text-lg font-display font-bold uppercase">
            Play Book
          </div>
        )}

        {isAuthenticated && user && (
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="p-2 hover:bg-card transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <Link href={`/u/${user.username}`}>
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.displayName}
                  width={32}
                  height={32}
                  className="w-8 h-8 border-2 border-border"
                />
              ) : (
                <div className="w-8 h-8 bg-primary flex items-center justify-center border-2 border-border">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
