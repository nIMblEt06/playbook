'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Search, Library, Plus, Activity } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import { useQuery } from '@tanstack/react-query'
import { communitiesService } from '@/lib/api/services/communities'
import { usersService } from '@/lib/api/services/users'

export function Sidebar() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()

  const { data: communities } = useQuery({
    queryKey: ['communities', 'joined'],
    queryFn: () => communitiesService.getCommunities({ limit: 5 }),
    enabled: isAuthenticated,
  })

  const { data: following } = useQuery({
    queryKey: ['following', user?.username],
    queryFn: () => usersService.getFollowing(user!.username),
    enabled: isAuthenticated && !!user,
  })

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Activity', href: '/activity', icon: Activity },
    { label: 'Discover', href: '/discover', icon: Search },
    { label: 'Library', href: '/library', icon: Library },
  ]

  return (
    <aside className="w-60 flex-shrink-0 p-4 sticky top-0 h-screen overflow-y-auto border-r-2 border-border">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 px-3 mb-8 hover:opacity-80 transition-opacity">
        <Image
          src="/trackd_logo.svg"
          alt="Trackd"
          width={32}
          height={32}
          className="w-8 h-8"
        />
        <span className="text-xl font-display font-bold uppercase tracking-tight text-[#36f1a4]">Trackd</span>
      </Link>

      {/* Main Navigation */}
      <div className="mb-8">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 mb-1 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-card text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </div>

      {isAuthenticated && (
        <>
          {/* Communities */}
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
              Your Communities
            </p>
            {communities?.items?.slice(0, 5).map((community) => (
              <Link
                key={community.id}
                href={`/community/${community.slug}`}
                className="flex items-center gap-3 px-3 py-2 mb-1 text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              >
                <div className="w-5 h-5 bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-bold text-primary-foreground border border-border">
                  {community.name[0]}
                </div>
                {community.name}
              </Link>
            ))}
            <Link
              href="/communities"
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-5 h-5" />
              Browse all
            </Link>
          </div>

          {/* Following */}
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
              Following
            </p>
            {following?.slice(0, 5).map((followedUser) => (
              <Link
                key={followedUser.id}
                href={`/profile/${followedUser.username}`}
                className="flex items-center gap-3 px-3 py-2 mb-1 text-sm text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              >
                {followedUser.avatarUrl ? (
                  <Image
                    src={followedUser.avatarUrl}
                    alt={followedUser.displayName}
                    width={20}
                    height={20}
                    className="w-5 h-5 border border-border"
                  />
                ) : (
                  <div className="w-5 h-5 bg-muted border border-border" />
                )}
                {followedUser.displayName}
                {followedUser.isArtist && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary font-bold uppercase">
                    Artist
                  </span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="text-xs text-muted-foreground space-x-3 px-3">
        <Link href="/about" className="hover:text-foreground">
          About
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
      </div>
    </aside>
  )
}
