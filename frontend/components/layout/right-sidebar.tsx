'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { searchService } from '@/lib/api/services/search'
import Image from 'next/image'

export function RightSidebar() {
  // Mock trending data - in production this would come from an API
  const trending = [
    {
      title: 'Not Like Us',
      artist: 'Kendrick Lamar',
      posts: 847,
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop',
    },
    {
      title: 'Brat',
      artist: 'Charli XCX',
      posts: 612,
      image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80&h=80&fit=crop',
    },
    {
      title: 'GNX',
      artist: 'Kendrick Lamar',
      posts: 534,
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80&h=80&fit=crop',
    },
  ]

  const risingCurators = [
    {
      username: 'DJ_Nova',
      displayName: 'DJ Nova',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop',
      growth: 142,
    },
    {
      username: 'vinyl_head',
      displayName: 'vinyl_head',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=60&h=60&fit=crop',
      growth: 98,
    },
  ]

  return (
    <aside className="w-72 flex-shrink-0 p-5 sticky top-0 h-screen overflow-y-auto">
      {/* Trending Today */}
      <div className="mb-8">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Trending Today
        </h3>
        <div className="space-y-1">
          {trending.map((item, index) => (
            <Link
              key={index}
              href="#"
              className="flex items-center gap-3 p-3 hover:bg-card transition-colors"
            >
              <Image
                src={item.image}
                alt={item.title}
                width={40}
                height={40}
                className="w-10 h-10 border-2 border-border"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.artist} · {item.posts} posts
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Rising Curators */}
      <div className="mb-8">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Rising Curators
        </h3>
        <div className="space-y-3">
          {risingCurators.map((curator) => (
            <div key={curator.username} className="flex items-center gap-3">
              <Image
                src={curator.avatar}
                alt={curator.displayName}
                width={40}
                height={40}
                className="w-10 h-10 border-2 border-border"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{curator.displayName}</p>
                <p className="text-xs text-primary">↑ {curator.growth} this week</p>
              </div>
              <button className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 hover:bg-card transition-colors">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* New & Upcoming */}
      <div className="mb-8 card p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          #NewAndUpcoming
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Fresh tracks from emerging artists
        </p>
        <Link
          href="/discover?filter=newandupcoming"
          className="btn-primary w-full block text-center text-sm"
        >
          Explore New Music
        </Link>
      </div>

      {/* Footer Links */}
      <div className="text-xs text-muted-foreground space-x-3">
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
