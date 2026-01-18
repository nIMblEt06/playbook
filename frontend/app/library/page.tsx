'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/app-layout'
import { PostCard } from '@/components/posts/post-card'
import { postsService } from '@/lib/api/services/posts'
import { playlistsService } from '@/lib/api/services/playlists'
import { spotifyService, type SpotifyPlaylist } from '@/lib/api/services/spotify'
import { useAuthStore } from '@/lib/store/auth-store'
import { Bookmark, Music, Loader2, Library, Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

type Tab = 'saved' | 'playlists' | 'spotify'

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('spotify')
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  // Redirect non-authenticated users
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, _hasHydrated, router])

  // Fetch saved posts
  const {
    data: savedPostsData,
    isLoading: savedPostsLoading,
    error: savedPostsError,
  } = useQuery({
    queryKey: ['saved-posts'],
    queryFn: () => postsService.getSavedPosts({ page: 1, limit: 50 }),
    enabled: isAuthenticated && activeTab === 'saved',
  })

  // Fetch user playlists (local/Trackd playlists)
  const {
    data: playlists,
    isLoading: playlistsLoading,
    error: playlistsError,
  } = useQuery({
    queryKey: ['user-playlists'],
    queryFn: () => playlistsService.getPlaylists(),
    enabled: isAuthenticated && activeTab === 'playlists',
  })

  // Fetch Spotify playlists
  const {
    data: spotifyPlaylists,
    isLoading: spotifyPlaylistsLoading,
    error: spotifyPlaylistsError,
  } = useQuery({
    queryKey: ['spotify-playlists'],
    queryFn: () => spotifyService.getMyPlaylists(50, 0),
    enabled: isAuthenticated && activeTab === 'spotify',
  })

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 md:py-6 border-b-2 border-border">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary border-2 border-border-strong flex items-center justify-center">
              <Library className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold uppercase">MY LIBRARY</h1>
              <p className="text-xs md:text-sm text-muted-foreground">Your saved posts and playlists</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-2 border-border w-full md:w-fit">
            <button
              onClick={() => setActiveTab('spotify')}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 font-medium uppercase text-xs md:text-sm transition-all flex-1 md:flex-initial ${
                activeTab === 'spotify'
                  ? 'bg-[#1DB954] text-white'
                  : 'bg-background text-muted-foreground hover:bg-card'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              <span className="hidden sm:inline">Spotify</span>
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center justify-center gap-2 px-3 md:px-4 py-2 font-medium uppercase text-xs md:text-sm transition-all flex-1 md:flex-initial ${
                activeTab === 'saved'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-card'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Saved Posts</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[60vh]">
          {/* Spotify Playlists Tab */}
          {activeTab === 'spotify' && (
            <div className="p-4 md:p-6">
              {spotifyPlaylistsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1DB954]" />
                </div>
              ) : spotifyPlaylistsError ? (
                <div className="py-20 text-center px-4">
                  <div className="w-16 h-16 bg-destructive/10 border-2 border-destructive/20 mx-auto mb-4 flex items-center justify-center">
                    <Music className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold mb-2 uppercase">Error Loading Spotify Playlists</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {spotifyPlaylistsError instanceof Error
                      ? spotifyPlaylistsError.message
                      : 'Failed to load Spotify playlists. Please try again later.'}
                  </p>
                </div>
              ) : !spotifyPlaylists?.items || spotifyPlaylists.items.length === 0 ? (
                <div className="py-20 text-center px-4">
                  <div className="w-16 h-16 bg-muted border-2 border-border mx-auto mb-4 flex items-center justify-center">
                    <Music className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold mb-2 uppercase">No Spotify Playlists</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4">
                    Create playlists on Spotify to see them here
                  </p>
                  <a
                    href="https://open.spotify.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#1DB954] text-white font-medium uppercase text-xs md:text-sm border-2 border-[#1DB954] hover:bg-[#1ed760] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Spotify
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {spotifyPlaylists.items.map((playlist: SpotifyPlaylist) => (
                    <a
                      key={playlist.id}
                      href={playlist.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block"
                    >
                      <div className="bg-card border-2 border-card-border hover:border-[#1DB954] transition-all hover:shadow-md">
                        {/* Cover Image */}
                        <div className="aspect-square bg-muted border-b-2 border-card-border relative overflow-hidden">
                          {playlist.images && playlist.images.length > 0 ? (
                            <Image
                              src={playlist.images[0].url}
                              alt={playlist.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1DB954]/20 to-[#191414]/20">
                              <Music className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-[#1DB954]/0 group-hover:bg-[#1DB954]/10 transition-colors flex items-center justify-center">
                            <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3 md:p-4">
                          <h3 className="font-bold text-sm md:text-base uppercase truncate mb-1">
                            {playlist.name}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            {playlist.tracks.total} {playlist.tracks.total === 1 ? 'track' : 'tracks'}
                          </p>
                          {playlist.owner.display_name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              by {playlist.owner.display_name}
                            </p>
                          )}
                          {playlist.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {playlist.description.replace(/<[^>]*>/g, '')}
                            </p>
                          )}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Saved Posts Tab */}
          {activeTab === 'saved' && (
            <div>
              {savedPostsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : savedPostsError ? (
                <div className="px-4 md:px-6 py-20 text-center">
                  <div className="w-16 h-16 bg-destructive/10 border-2 border-destructive/20 mx-auto mb-4 flex items-center justify-center">
                    <Bookmark className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold mb-2 uppercase">Error Loading Saved Posts</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {savedPostsError instanceof Error
                      ? savedPostsError.message
                      : 'Failed to load saved posts. Please try again later.'}
                  </p>
                </div>
              ) : savedPostsData?.items.length === 0 ? (
                <div className="px-4 md:px-6 py-20 text-center">
                  <div className="w-16 h-16 bg-muted border-2 border-border mx-auto mb-4 flex items-center justify-center">
                    <Bookmark className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold mb-2 uppercase">No Saved Posts</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4">
                    Save posts you like to access them later
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium uppercase text-xs md:text-sm border-2 border-border-strong hover:shadow-primary transition-all"
                  >
                    Explore Posts
                  </Link>
                </div>
              ) : (
                <div className="border-t-2 border-border">
                  {savedPostsData?.items.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Local Playlists Tab */}
          {activeTab === 'playlists' && (
            <div className="p-4 md:p-6">
              {playlistsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : playlistsError ? (
                <div className="py-20 text-center px-4">
                  <div className="w-16 h-16 bg-destructive/10 border-2 border-destructive/20 mx-auto mb-4 flex items-center justify-center">
                    <Music className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold mb-2 uppercase">Error Loading Playlists</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {playlistsError instanceof Error
                      ? playlistsError.message
                      : 'Failed to load playlists. Please try again later.'}
                  </p>
                </div>
              ) : playlists?.length === 0 ? (
                <div className="py-20 text-center px-4">
                  <div className="w-16 h-16 bg-muted border-2 border-border mx-auto mb-4 flex items-center justify-center">
                    <Music className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold mb-2 uppercase">No Playlists Yet</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-4">
                    Create your first playlist to organize your favorite tracks
                  </p>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium uppercase text-xs md:text-sm border-2 border-border-strong hover:shadow-primary transition-all">
                    <Plus className="w-4 h-4" />
                    Create Playlist
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  {playlists?.map((playlist) => (
                    <Link
                      key={playlist.id}
                      href={`/playlist/${playlist.id}`}
                      className="group block"
                    >
                      <div className="bg-card border-2 border-card-border hover:border-primary transition-all hover:shadow-md">
                        {/* Cover Image */}
                        <div className="aspect-square bg-muted border-b-2 border-card-border relative overflow-hidden">
                          {playlist.coverImageUrl ? (
                            <Image
                              src={playlist.coverImageUrl}
                              alt={playlist.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                              <Music className="w-12 h-12 text-muted-foreground" />
                            </div>
                          )}
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors" />
                        </div>

                        {/* Info */}
                        <div className="p-3 md:p-4">
                          <h3 className="font-bold text-sm md:text-base uppercase truncate mb-1">
                            {playlist.name}
                          </h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            {playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}
                          </p>
                          {playlist.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {playlist.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
