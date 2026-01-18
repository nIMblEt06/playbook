'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { discoverService } from '@/lib/api/services/discover'
import { usersService } from '@/lib/api/services/users'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

export function RightSidebar() {
  // Fetch trending albums from API
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending', 'sidebar'],
    queryFn: () => discoverService.getTrending(5),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch suggested users/curators from API
  const { data: suggestedUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['suggestedUsers', 'sidebar'],
    queryFn: () => usersService.discoverUsers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const trending = trendingData?.albums ?? []
  const curators = suggestedUsers?.slice(0, 3) ?? []

  return (
    <aside className="w-72 flex-shrink-0 p-5 sticky top-0 h-screen overflow-y-auto">
      {/* Trending Today */}
      <div className="mb-8">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Trending Today
        </h3>
        {trendingLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : trending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No trending albums yet</p>
        ) : (
          <div className="space-y-1">
            {trending.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.spotifyId}`}
                className="flex items-center gap-3 p-3 hover:bg-card transition-colors"
              >
                {album.coverImageUrl ? (
                  <Image
                    src={album.coverImageUrl}
                    alt={album.title}
                    width={40}
                    height={40}
                    className="w-10 h-10 border-2 border-border"
                  />
                ) : (
                  <div className="w-10 h-10 bg-muted border-2 border-border" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{album.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {album.artistName}
                    {album.averageRating && ` · ${album.averageRating.toFixed(1)}★`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Users */}
      <div className="mb-8">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Suggested Users
        </h3>
        {usersLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : curators.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No suggestions yet</p>
        ) : (
          <div className="space-y-3">
            {curators.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 hover:bg-card p-2 -mx-2 transition-colors"
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName}
                    width={40}
                    height={40}
                    className="w-10 h-10 border-2 border-border"
                  />
                ) : (
                  <div className="w-10 h-10 bg-muted border-2 border-border" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                {user.isArtist && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary font-bold uppercase">
                    Artist
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New & Upcoming */}
      {/* <div className="mb-8 card p-4">
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
      </div> */}

    </aside>
  )
}
