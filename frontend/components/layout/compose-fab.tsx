'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, X, Link as LinkIcon, Search, Loader2, ExternalLink, MessageSquare, Music2 } from 'lucide-react'
import { useCreatePost } from '@/lib/hooks/use-posts'
import { useAuthStore } from '@/lib/store/auth-store'
import { usePlayerStore } from '@/lib/store/player-store'
import type { LinkType } from '@/lib/types'
import NextImage from 'next/image'
import { useQueryClient } from '@tanstack/react-query'
import { extractFirstMusicUrl, getPlatformName, getContentTypeLabel, type LinkMetadata } from '@/lib/api/services/links'
import { useGetLinkMetadataMutation } from '@/lib/hooks/use-links'
import { spotifyService, type SpotifyTrack, type SpotifyAlbum } from '@/lib/api/services/spotify'

interface ComposeFabProps {
  communityId: string
  communitySlug: string
  communityName: string
}

type PostTab = 'discussion' | 'music'
type MusicMode = 'search' | 'link'
type SearchType = 'track' | 'album'

interface SelectedMusic {
  type: LinkType
  spotifyUrl: string
  title: string
  artist: string
  imageUrl?: string
}

export function ComposeFab({ communityId, communitySlug, communityName }: ComposeFabProps) {
  const { user, isAuthenticated } = useAuthStore()
  const currentTrack = usePlayerStore((state) => state.currentTrack)
  const queryClient = useQueryClient()

  // Modal state
  const [isOpen, setIsOpen] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<PostTab>('discussion')

  // Discussion content
  const [content, setContent] = useState('')

  // Music tab state
  const [musicMode, setMusicMode] = useState<MusicMode>('search')
  const [searchType, setSearchType] = useState<SearchType>('track')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<(SpotifyTrack | SpotifyAlbum)[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMusic, setSelectedMusic] = useState<SelectedMusic | null>(null)
  const [musicComment, setMusicComment] = useState('')

  // Link paste state
  const [linkUrl, setLinkUrl] = useState('')
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const createPostMutation = useCreatePost()
  const getLinkMetadata = useGetLinkMetadataMutation()

  // Debounced search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        if (searchType === 'track') {
          const result = await spotifyService.searchTracks(query, 1, 10)
          setSearchResults(result.items)
        } else {
          const result = await spotifyService.searchAlbums(query, 1, 10)
          setSearchResults(result.items)
        }
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)
  }, [searchType])

  // Handle link URL change with metadata fetch
  const handleLinkChange = useCallback((url: string) => {
    setLinkUrl(url)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const detectedUrl = extractFirstMusicUrl(url)
    if (!detectedUrl) {
      setLinkMetadata(null)
      return
    }

    debounceRef.current = setTimeout(() => {
      getLinkMetadata.mutate(detectedUrl, {
        onSuccess: (metadata) => {
          setLinkMetadata(metadata)
        },
        onError: () => {
          setLinkMetadata(null)
        },
      })
    }, 500)
  }, [getLinkMetadata])

  // Select music from search results
  const handleSelectMusic = (item: SpotifyTrack | SpotifyAlbum) => {
    const isTrack = 'track_number' in item
    setSelectedMusic({
      type: isTrack ? 'track' : 'album',
      spotifyUrl: item.external_urls.spotify,
      title: item.name,
      artist: item.artists.map(a => a.name).join(', '),
      imageUrl: isTrack ? (item as SpotifyTrack).album.images[0]?.url : (item as SpotifyAlbum).images[0]?.url,
    })
    setSearchQuery('')
    setSearchResults([])
  }

  // Use link metadata as selected music
  const handleUseLinkAsMusic = () => {
    if (!linkMetadata) return

    setSelectedMusic({
      type: (linkMetadata.parsed.contentType as LinkType) || 'track',
      spotifyUrl: linkUrl,
      title: linkMetadata.title || 'Unknown',
      artist: linkMetadata.artist || 'Unknown Artist',
      imageUrl: linkMetadata.imageUrl,
    })
    setLinkUrl('')
    setLinkMetadata(null)
  }

  const handleSubmit = () => {
    if (activeTab === 'discussion') {
      if (!content.trim()) return

      createPostMutation.mutate(
        {
          content: content.trim(),
          communityIds: [communityId],
        },
        {
          onSuccess: () => {
            resetAndClose()
            queryClient.invalidateQueries({ queryKey: ['posts', 'community', communitySlug] })
          },
        }
      )
    } else {
      // Music tab
      if (!selectedMusic) return

      createPostMutation.mutate(
        {
          content: musicComment.trim() || `Sharing: ${selectedMusic.title}`,
          linkUrl: selectedMusic.spotifyUrl,
          linkType: selectedMusic.type,
          communityIds: [communityId],
        },
        {
          onSuccess: () => {
            resetAndClose()
            queryClient.invalidateQueries({ queryKey: ['posts', 'community', communitySlug] })
          },
        }
      )
    }
  }

  const resetAndClose = () => {
    setIsOpen(false)
    setActiveTab('discussion')
    setContent('')
    setMusicMode('search')
    setSearchType('track')
    setSearchQuery('')
    setSearchResults([])
    setSelectedMusic(null)
    setMusicComment('')
    setLinkUrl('')
    setLinkMetadata(null)
  }

  if (!isAuthenticated || !user) return null

  const canSubmit = activeTab === 'discussion'
    ? content.trim().length > 0
    : selectedMusic !== null

  return (
    <>
      {/* Floating Action Button */}
      {/* Position above bottom nav on mobile: nav (64px) + gap (24px) = 88px */}
      {/* With player: nav (64px) + player (64px) + gap (24px) = 152px */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed right-4 md:right-6 z-40 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          currentTrack
            ? 'bottom-[152px] md:bottom-[104px]'
            : 'bottom-[88px] md:bottom-6'
        }`}
        title="Create post"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={resetAndClose}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-background border-2 border-border shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border flex-shrink-0">
              <h2 className="text-lg font-bold">Create Post in {communityName}</h2>
              <button
                onClick={resetAndClose}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-border flex-shrink-0">
              <button
                onClick={() => setActiveTab('discussion')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'discussion'
                    ? 'text-primary border-b-2 border-primary -mb-[2px]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Discussion
              </button>
              <button
                onClick={() => setActiveTab('music')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'music'
                    ? 'text-primary border-b-2 border-primary -mb-[2px]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Music2 className="w-4 h-4" />
                Share Music
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'discussion' ? (
                /* Discussion Tab */
                <div className="flex gap-3">
                  {/* Avatar */}
                  {user.avatarUrl ? (
                    <NextImage
                      src={user.avatarUrl}
                      alt={user.displayName}
                      width={40}
                      height={40}
                      className="w-10 h-10 border-2 border-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted border-2 border-border flex-shrink-0" />
                  )}

                  <div className="flex-1">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Start a discussion..."
                      className="w-full bg-background-elevated border-2 border-input-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none min-h-[150px]"
                      maxLength={2000}
                      autoFocus
                    />
                    <div className="text-xs text-muted-foreground text-right mt-2">
                      {content.length} / 2000
                    </div>
                  </div>
                </div>
              ) : (
                /* Music Tab */
                <div className="space-y-4">
                  {/* Music Mode Toggle */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMusicMode('search')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium border-2 transition-colors ${
                        musicMode === 'search'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Search className="w-4 h-4" />
                      Search
                    </button>
                    <button
                      onClick={() => setMusicMode('link')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium border-2 transition-colors ${
                        musicMode === 'link'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      Paste Link
                    </button>
                  </div>

                  {musicMode === 'search' ? (
                    /* Search Mode */
                    <div className="space-y-3">
                      {/* Search Type Selector */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSearchType('track')
                            setSearchResults([])
                            setSearchQuery('')
                          }}
                          className={`px-3 py-1.5 text-xs font-medium uppercase border-2 transition-colors ${
                            searchType === 'track'
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          Tracks
                        </button>
                        <button
                          onClick={() => {
                            setSearchType('album')
                            setSearchResults([])
                            setSearchQuery('')
                          }}
                          className={`px-3 py-1.5 text-xs font-medium uppercase border-2 transition-colors ${
                            searchType === 'album'
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          Albums
                        </button>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          placeholder={`Search ${searchType}s on Spotify...`}
                          className="w-full bg-background-elevated border-2 border-input-border pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="border-2 border-border max-h-[200px] overflow-y-auto">
                          {searchResults.map((item) => {
                            const isTrack = 'track_number' in item
                            const imageUrl = isTrack
                              ? (item as SpotifyTrack).album.images[0]?.url
                              : (item as SpotifyAlbum).images[0]?.url

                            return (
                              <button
                                key={item.id}
                                onClick={() => handleSelectMusic(item)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-card transition-colors border-b border-border last:border-b-0"
                              >
                                {imageUrl ? (
                                  <NextImage
                                    src={imageUrl}
                                    alt={item.name}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 border border-border"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-muted border border-border" />
                                )}
                                <div className="flex-1 min-w-0 text-left">
                                  <p className="font-medium text-sm truncate">{item.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {item.artists.map(a => a.name).join(', ')}
                                  </p>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-medium uppercase">
                                  {isTrack ? 'Track' : 'Album'}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Link Paste Mode */
                    <div className="space-y-3">
                      <input
                        type="url"
                        value={linkUrl}
                        onChange={(e) => handleLinkChange(e.target.value)}
                        placeholder="Paste a Spotify, Apple Music, or other music link..."
                        className="w-full bg-background-elevated border-2 border-input-border px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                      />

                      {/* Link Preview */}
                      {getLinkMetadata.isPending && (
                        <div className="flex items-center gap-2 p-3 bg-background-elevated border-2 border-input-border text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Fetching link info...</span>
                        </div>
                      )}

                      {linkMetadata && !getLinkMetadata.isPending && (
                        <div className="p-3 bg-background-elevated border-2 border-input-border">
                          <div className="flex items-start gap-3">
                            {linkMetadata.imageUrl && (
                              <NextImage
                                src={linkMetadata.imageUrl}
                                alt={linkMetadata.title || 'Preview'}
                                width={56}
                                height={56}
                                className="w-14 h-14 border-2 border-border"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 text-xs font-medium uppercase bg-primary/10 text-primary border border-primary/20">
                                  {getContentTypeLabel(linkMetadata.parsed)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {getPlatformName(linkMetadata.parsed.type)}
                                </span>
                              </div>
                              {linkMetadata.title && (
                                <p className="font-medium text-sm truncate">{linkMetadata.title}</p>
                              )}
                              {linkMetadata.artist && (
                                <p className="text-xs text-muted-foreground truncate">{linkMetadata.artist}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={handleUseLinkAsMusic}
                            className="mt-3 w-full btn-primary text-sm"
                          >
                            Use This
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected Music Preview */}
                  {selectedMusic && (
                    <div className="p-3 bg-primary/5 border-2 border-primary">
                      <div className="flex items-center gap-3">
                        {selectedMusic.imageUrl ? (
                          <NextImage
                            src={selectedMusic.imageUrl}
                            alt={selectedMusic.title}
                            width={56}
                            height={56}
                            className="w-14 h-14 border-2 border-border"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-muted border-2 border-border flex items-center justify-center">
                            <Music2 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground font-medium uppercase">
                            {selectedMusic.type}
                          </span>
                          <p className="font-medium text-sm truncate mt-1">{selectedMusic.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{selectedMusic.artist}</p>
                        </div>
                        <button
                          onClick={() => setSelectedMusic(null)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Comment for Music */}
                  {selectedMusic && (
                    <div>
                      <textarea
                        value={musicComment}
                        onChange={(e) => setMusicComment(e.target.value)}
                        placeholder="Add a comment about this music (optional)..."
                        className="w-full bg-background-elevated border-2 border-input-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none min-h-[80px]"
                        maxLength={2000}
                      />
                      <div className="text-xs text-muted-foreground text-right mt-1">
                        {musicComment.length} / 2000
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-4 py-3 border-t-2 border-border flex-shrink-0">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || createPostMutation.isPending}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPostMutation.isPending ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
