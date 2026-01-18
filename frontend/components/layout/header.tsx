'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, User, Menu, X, Users, Settings } from 'lucide-react'
import { useAuthStore } from '@/lib/store/auth-store'
import { useQuery } from '@tanstack/react-query'
import { communitiesService } from '@/lib/api/services/communities'
import { usersService } from '@/lib/api/services/users'
import { notificationsService } from '@/lib/api/services/notifications'
import Image from 'next/image'

export function Header() {
  const { user, isAuthenticated } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => notificationsService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  return (
    <>
      <header className="sticky top-0 z-50 bg-background border-b-2 border-border">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          {/* Left side: Hamburger (mobile) + Logo */}
          <div className="flex items-center gap-2">
            {/* Hamburger menu - mobile only */}
            {isAuthenticated && (
              <button
                className="md:hidden p-2 -ml-2 hover:bg-card transition-colors"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/trackd_logo.svg"
                alt="Trackd"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <span className="text-lg font-display font-bold uppercase text-[#36f1a4]">Trackd</span>
            </Link>
          </div>

          {/* Right side: Notifications + Avatar */}
          {isAuthenticated && user && (
            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/notifications" className="p-2 hover:bg-card transition-colors relative">
                <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                {unreadCount !== undefined && unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground border-2 border-background px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link href={`/profile/${user.username}`}>
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

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <MobileMenuDrawer onClose={() => setIsMobileMenuOpen(false)} />
      )}
    </>
  )
}

function MobileMenuDrawer({ onClose }: { onClose: () => void }) {
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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 left-0 bottom-0 z-[70] w-72 bg-background border-r-2 border-border md:hidden overflow-y-auto">
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-border">
          <span className="font-display font-bold uppercase text-lg">Menu</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-card transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-4">
          {/* Communities Section */}
          {isAuthenticated && (
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                Your Communities
              </p>
              {communities?.items?.slice(0, 5).map((community) => (
                <Link
                  key={community.id}
                  href={`/community/${community.slug}`}
                  onClick={onClose}
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
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="w-5 h-5" />
                Browse all
              </Link>
            </div>
          )}

          {/* Following Section */}
          {isAuthenticated && following && following.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
                Following
              </p>
              {following.slice(0, 5).map((followedUser) => (
                <Link
                  key={followedUser.id}
                  href={`/profile/${followedUser.username}`}
                  onClick={onClose}
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
          )}

          {/* Settings Link */}
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>

          {/* Footer Links */}
          <div className="mt-8 pt-4 border-t-2 border-border text-xs text-muted-foreground space-x-3 px-3">
            <Link href="/about" onClick={onClose} className="hover:text-foreground">
              About
            </Link>
            <Link href="/terms" onClick={onClose} className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" onClick={onClose} className="hover:text-foreground">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
