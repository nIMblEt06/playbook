'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { spotifyService, type SpotifyAlbum, type SpotifyArtist, type SpotifyTrack } from '@/lib/api/services/spotify'
import { searchService } from '@/lib/api/services/search'
import { useAuthStore } from '@/lib/store/auth-store'
import {
  Loader2,
  Search,
  Users,
  Music2,
  Disc3,
  Mic2,
  ExternalLink,
  Star,
  Play
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { apiClient } from '@/lib/api/client'

type SearchType = 'all' | 'users' | 'communities' | 'albums' | 'artists' | 'tracks'

// TrackResultCard component with inline rating functionality
function TrackResultCard({ track, isAuthenticated }: { track: SpotifyTrack; isAuthenticated: boolean }) {
  const [userRating, setUserRating] = useState<number | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [isRating, setIsRating] = useState(false)
  const queryClient = useQueryClient()

  const rateTrackMutation = useMutation({
    mutationFn: async ({ trackId, value }: { trackId: string; value: number }) => {
      const response = await apiClient.post(`/api/tracks/${trackId}/rate`, { value })
      return response.data
    },
    onSuccess: (_, variables) => {
      setUserRating(variables.value)
      queryClient.invalidateQueries({ queryKey: ['track-rating', track.id] })
    },
  })

  const handleRate = (value: number) => {
    if (!isAuthenticated) return
    rateTrackMutation.mutate({ trackId: track.id, value })
    setIsRating(false)
  }

  return (
    <div className="flex items-center gap-3 md:gap-4 p-3 rounded-none border-2 border-transparent hover:border-border hover:bg-muted transition-colors group">
      {/* Album Art */}
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-none border-2 border-border bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
        {track.album?.images && track.album.images.length > 0 ? (
          <Image
            src={spotifyService.getCoverUrl(track.album.images, 'small') || track.album.images[0].url}
            alt={track.album.name}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        ) : (
          <Music2 className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{track.name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {spotifyService.formatArtists(track.artists)}
          {track.album && ` • ${track.album.name}`}
        </p>
      </div>

      {/* Duration */}
      <span className="text-sm text-muted-foreground hidden sm:block">
        {spotifyService.formatDuration(track.duration_ms)}
      </span>

      {/* Rating Section */}
      {isAuthenticated && (
        <div
          className="flex items-center gap-1"
          onMouseEnter={() => setIsRating(true)}
          onMouseLeave={() => {
            setIsRating(false)
            setHoveredRating(null)
          }}
        >
          {isRating || userRating ? (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="p-0.5 transition-colors"
                  disabled={rateTrackMutation.isPending}
                >
                  <Star
                    className={`w-4 h-4 ${
                      (hoveredRating !== null ? star <= hoveredRating : star <= (userRating || 0))
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          ) : (
            <button
              className="p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
              title="Rate this track"
            >
              <Star className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* External Link */}
      <a
        href={track.external_urls?.spotify}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded hover:bg-card transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
      </a>
    </div>
  )
}

export default function DiscoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const initialType = (searchParams.get('type') as SearchType) || 'all'

  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState<SearchType>(initialType)
  const { user: currentUser } = useAuthStore()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Update URL when search changes
  useEffect(() => {
    if (debouncedQuery) {
      router.replace(`/discover?q=${encodeURIComponent(debouncedQuery)}&type=${activeTab}`, { scroll: false })
    } else {
      router.replace('/discover', { scroll: false })
    }
  }, [debouncedQuery, activeTab, router])

  // Search users and communities (local)
  const { data: localResults, isLoading: localLoading } = useQuery({
    queryKey: ['search', 'local', debouncedQuery],
    queryFn: () => searchService.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2 && (activeTab === 'all' || activeTab === 'users' || activeTab === 'communities'),
  })

  // Search albums via Spotify
  const { data: albumResults, isLoading: albumsLoading } = useQuery({
    queryKey: ['search', 'spotify-albums', debouncedQuery],
    queryFn: async () => {
      const result = await spotifyService.searchAlbums(debouncedQuery, 1, 20)
      return { items: result.items }
    },
    enabled: debouncedQuery.length >= 2 && (activeTab === 'all' || activeTab === 'albums'),
  })

  // Search artists via Spotify
  const { data: artistResults, isLoading: artistsLoading } = useQuery({
    queryKey: ['search', 'spotify-artists', debouncedQuery],
    queryFn: async () => {
      const result = await spotifyService.searchArtists(debouncedQuery, 1, 20)
      return { items: result.items }
    },
    enabled: debouncedQuery.length >= 2 && (activeTab === 'all' || activeTab === 'artists'),
  })

  // Search tracks via Spotify
  const { data: trackResults, isLoading: tracksLoading } = useQuery({
    queryKey: ['search', 'spotify-tracks', debouncedQuery],
    queryFn: async () => {
      const result = await spotifyService.searchTracks(debouncedQuery, 1, 20)
      return { items: result.items }
    },
    enabled: debouncedQuery.length >= 2 && (activeTab === 'all' || activeTab === 'tracks'),
  })

  const isLoading = localLoading || albumsLoading || artistsLoading || tracksLoading
  const hasQuery = debouncedQuery.length >= 2

  const tabs = [
    { label: 'All', value: 'all' as const, icon: Search },
    { label: 'Tracks', value: 'tracks' as const, icon: Music2 },
    { label: 'Albums', value: 'albums' as const, icon: Disc3 },
    { label: 'Artists', value: 'artists' as const, icon: Mic2 },
    { label: 'Users', value: 'users' as const, icon: Users },
    { label: 'Communities', value: 'communities' as const, icon: Play },
  ]

  const showUsers = activeTab === 'all' || activeTab === 'users'
  const showCommunities = activeTab === 'all' || activeTab === 'communities'
  const showAlbums = activeTab === 'all' || activeTab === 'albums'
  const showArtists = activeTab === 'all' || activeTab === 'artists'
  const showTracks = activeTab === 'all' || activeTab === 'tracks'

  const hasResults =
    (showUsers && localResults?.users && localResults.users.length > 0) ||
    (showCommunities && localResults?.communities && localResults.communities.length > 0) ||
    (showAlbums && albumResults?.items && albumResults.items.length > 0) ||
    (showArtists && artistResults?.items && artistResults.items.length > 0) ||
    (showTracks && trackResults?.items && trackResults.items.length > 0)

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header with Search */}
        <div className="px-4 md:px-6 py-6 border-b border-border">
          <h1 className="text-2xl font-bold mb-4">Discover</h1>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search albums, artists, users, communities..."
              className="w-full pl-12 pr-4 py-3 bg-card border-2 border-border rounded-none text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 md:px-6 py-3 border-b border-border flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-none border-2 transition-all whitespace-nowrap ${
                  activeTab === tab.value
                    ? 'bg-primary text-primary-foreground border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Results */}
        <div className="px-4 md:px-6 py-6">
          {/* Loading */}
          {isLoading && hasQuery && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* No query yet */}
          {!hasQuery && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start typing to search for albums, artists, users, and communities</p>
            </div>
          )}

          {/* No results */}
          {!isLoading && hasQuery && !hasResults && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No results found for &quot;{debouncedQuery}&quot;</p>
            </div>
          )}

          {/* Results sections */}
          {!isLoading && hasQuery && hasResults && (
            <div className="space-y-8">
              {/* Tracks */}
              {showTracks && trackResults?.items && trackResults.items.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Music2 className="w-5 h-5" />
                    Tracks
                  </h2>
                  <div className="space-y-2">
                    {trackResults.items.slice(0, activeTab === 'tracks' ? 20 : 8).map((track: SpotifyTrack) => (
                      <TrackResultCard
                        key={track.id}
                        track={track}
                        isAuthenticated={!!currentUser}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Albums */}
              {showAlbums && albumResults?.items && albumResults.items.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Disc3 className="w-5 h-5" />
                    Albums
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {albumResults.items.slice(0, activeTab === 'albums' ? 20 : 8).map((album: SpotifyAlbum) => (
                      <Link
                        key={album.id}
                        href={`/album/${album.id}`}
                        className="group"
                      >
                        <div className="aspect-square rounded-none border-2 border-border overflow-hidden bg-muted mb-2">
                          {album.images && album.images.length > 0 ? (
                            <Image
                              src={spotifyService.getCoverUrl(album.images, 'medium') || album.images[0].url}
                              alt={album.name}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Disc3 className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-sm truncate">{album.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{spotifyService.formatArtists(album.artists)}</p>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Artists */}
              {showArtists && artistResults?.items && artistResults.items.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mic2 className="w-5 h-5" />
                    Artists
                  </h2>
                  <div className="space-y-2">
                    {artistResults.items.slice(0, activeTab === 'artists' ? 20 : 5).map((artist: SpotifyArtist) => (
                      <Link
                        key={artist.id}
                        href={`/artists/${artist.id}`}
                        className="flex items-center gap-3 md:gap-4 p-3 rounded-none border-2 border-transparent hover:border-border hover:bg-muted transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full border-2 border-border bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {artist.images && artist.images.length > 0 ? (
                            <Image
                              src={spotifyService.getCoverUrl(artist.images, 'small') || artist.images[0].url}
                              alt={artist.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Mic2 className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{artist.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {artist.followers?.total ? `${artist.followers.total.toLocaleString()} followers` : 'Artist'}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Users */}
              {showUsers && localResults?.users && localResults.users.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Users
                  </h2>
                  <div className="space-y-2">
                    {localResults.users.slice(0, activeTab === 'users' ? 20 : 5).map((user) => (
                      <Link
                        key={user.id}
                        href={`/profile/${user.username}`}
                        className="flex items-center gap-3 md:gap-4 p-3 rounded-none border-2 border-transparent hover:border-border hover:bg-muted transition-colors"
                      >
                        <div className="w-12 h-12 rounded-full border-2 border-border overflow-hidden bg-muted flex-shrink-0">
                          {user.avatarUrl ? (
                            <Image
                              src={user.avatarUrl}
                              alt={user.displayName}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.displayName}</p>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                        {user.isArtist && (
                          <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded">
                            Artist
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Communities */}
              {showCommunities && localResults?.communities && localResults.communities.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Music2 className="w-5 h-5" />
                    Communities
                  </h2>
                  <div className="space-y-2">
                    {localResults.communities.slice(0, activeTab === 'communities' ? 20 : 5).map((community) => (
                      <Link
                        key={community.id}
                        href={`/community/${community.slug}`}
                        className="flex items-center gap-3 md:gap-4 p-3 rounded-none border-2 border-transparent hover:border-border hover:bg-muted transition-colors"
                      >
                        <div className="w-12 h-12 rounded-none border-2 border-border bg-muted flex items-center justify-center flex-shrink-0">
                          <Music2 className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{community.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {community.memberCount} members
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
