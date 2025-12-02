'use client'

import { useState, useEffect } from 'react'
import { X, Search, Plus, Trash2, Music, Disc, List, Loader2, Image as ImageIcon, ChevronLeft, ChevronRight, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'
import { searchTracks, searchAlbums, getCoverArt, getAlbumTracks, type Recording, type Release, type Track as MBTrack } from '@/lib/utils/musicbrainz'
import { fetchAndCacheImage, imageCache } from '@/lib/utils/image-cache'
import Image from 'next/image'

interface Track {
  id: string
  title: string
  artist: string
  linkUrl: string
  albumArt?: string
}

interface CreatePlaylistDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    description: string
    tracks: Track[]
    coverImageUrl?: string
  }) => void
}

type ContentType = 'track' | 'album' | 'playlist'
type SearchTab = 'track' | 'album'

export function CreatePlaylistDialog({ isOpen, onClose, onSubmit }: CreatePlaylistDialogProps) {
  const [contentType, setContentType] = useState<ContentType>('playlist')
  const [playlistName, setPlaylistName] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState('')
  const [coverImage, setCoverImage] = useState<string>()
  
  // For custom playlist
  const [tracks, setTracks] = useState<Track[]>([])
  const [searchTab, setSearchTab] = useState<SearchTab>('track')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<(Recording | Release)[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isSearching, setIsSearching] = useState(false)
  const [loadingCovers, setLoadingCovers] = useState<Set<string>>(new Set())
  const [cachedCovers, setCachedCovers] = useState<Map<string, string>>(new Map())
  const resultsPerPage = 5
  
  // For album track expansion
  const [expandedAlbumId, setExpandedAlbumId] = useState<string | null>(null)
  const [albumTracks, setAlbumTracks] = useState<Map<string, MBTrack[]>>(new Map())
  const [loadingAlbumTracks, setLoadingAlbumTracks] = useState<Set<string>>(new Set())
  
  // For drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  // For single track/album
  const [selectedItem, setSelectedItem] = useState<Recording | Release | null>(null)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setContentType('playlist')
      setPlaylistName('')
      setPlaylistDescription('')
      setCoverImage(undefined)
      setTracks([])
      setSearchQuery('')
      setSearchResults([])
      setTotalResults(0)
      setCurrentPage(1)
      setSelectedItem(null)
      setExpandedAlbumId(null)
      setAlbumTracks(new Map())
    }
  }, [isOpen])

  const handleSearch = async (page: number = 1) => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setCurrentPage(page)
    
    try {
      if (searchTab === 'track') {
        const result = await searchTracks(searchQuery, page, resultsPerPage)
        setSearchResults(result.items)
        setTotalResults(result.total)
        
        // Preload cover art
        result.items.forEach(async (recording: Recording) => {
          if (recording.releases?.[0]?.id) {
            const releaseId = recording.releases[0].id
            setLoadingCovers(prev => new Set(prev).add(releaseId))
            
            const coverUrl = await getCoverArt(releaseId)
            if (coverUrl) {
              const cachedImage = await fetchAndCacheImage(coverUrl)
              if (cachedImage) {
                setCachedCovers(prev => new Map(prev).set(releaseId, cachedImage))
              }
            }
            
            setLoadingCovers(prev => {
              const next = new Set(prev)
              next.delete(releaseId)
              return next
            })
          }
        })
      } else {
        const result = await searchAlbums(searchQuery, page, resultsPerPage)
        setSearchResults(result.items)
        setTotalResults(result.total)
        
        // Preload cover art
        result.items.forEach(async (release: Release) => {
          setLoadingCovers(prev => new Set(prev).add(release.id))
          
          const coverUrl = await getCoverArt(release.id)
          if (coverUrl) {
            const cachedImage = await fetchAndCacheImage(coverUrl)
            if (cachedImage) {
              setCachedCovers(prev => new Map(prev).set(release.id, cachedImage))
            }
          }
          
          setLoadingCovers(prev => {
            const next = new Set(prev)
            next.delete(release.id)
            return next
          })
        })
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleNextPage = () => {
    const totalPages = Math.ceil(totalResults / resultsPerPage)
    if (currentPage < totalPages && !isSearching) {
      handleSearch(currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1 && !isSearching) {
      handleSearch(currentPage - 1)
    }
  }

  const handleToggleAlbumExpansion = async (releaseId: string) => {
    if (expandedAlbumId === releaseId) {
      // Collapse
      setExpandedAlbumId(null)
    } else {
      // Expand
      setExpandedAlbumId(releaseId)
      
      // Fetch tracks if not already loaded
      if (!albumTracks.has(releaseId)) {
        setLoadingAlbumTracks(prev => new Set(prev).add(releaseId))
        const tracks = await getAlbumTracks(releaseId)
        setAlbumTracks(prev => new Map(prev).set(releaseId, tracks))
        setLoadingAlbumTracks(prev => {
          const next = new Set(prev)
          next.delete(releaseId)
          return next
        })
      }
    }
  }

  const handleAddTrackFromAlbum = async (albumTrack: MBTrack, release: Release) => {
    const artist = release['artist-credit']?.[0]?.artist?.name || 'Unknown Artist'
    
    let albumArt: string | undefined
    const coverUrl = await getCoverArt(release.id)
    if (coverUrl) {
      albumArt = await imageCache.get(coverUrl) || coverUrl
    }

    const track: Track = {
      id: `${albumTrack.id}-${Date.now()}`,
      title: albumTrack.title,
      artist,
      linkUrl: `https://musicbrainz.org/recording/${albumTrack.recording?.id || albumTrack.id}`,
      albumArt,
    }

    setTracks(prev => [...prev, track])
  }

  const handleAddTrack = async (item: Recording | Release) => {
    if (contentType === 'playlist') {
      // Add to playlist
      const isRecording = 'length' in item
      const title = item.title
      const artist = item['artist-credit']?.[0]?.artist?.name || 'Unknown Artist'
      const releaseId = isRecording 
        ? (item as Recording).releases?.[0]?.id 
        : (item as Release).id
      
      let albumArt: string | undefined
      if (releaseId) {
        const coverUrl = await getCoverArt(releaseId)
        if (coverUrl) {
          albumArt = await imageCache.get(coverUrl) || coverUrl
        }
      }

      const track: Track = {
        id: `${item.id}-${Date.now()}`,
        title,
        artist,
        linkUrl: `https://musicbrainz.org/${isRecording ? 'recording' : 'release'}/${item.id}`,
        albumArt,
      }

      setTracks(prev => [...prev, track])
    } else {
      // Select single item
      setSelectedItem(item)
      
      // Auto-fill name and get cover art
      const isRecording = 'length' in item
      const artist = item['artist-credit']?.[0]?.artist?.name || 'Unknown Artist'
      setPlaylistName(`${item.title} - ${artist}`)
      
      const releaseId = isRecording 
        ? (item as Recording).releases?.[0]?.id 
        : (item as Release).id
      
      if (releaseId) {
        const coverUrl = await getCoverArt(releaseId)
        if (coverUrl) {
          const cached = await imageCache.get(coverUrl) || coverUrl
          setCoverImage(cached)
        }
      }
    }
  }

  const handleRemoveTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newTracks = [...tracks]
    const draggedTrack = newTracks[draggedIndex]
    
    // Remove from old position
    newTracks.splice(draggedIndex, 1)
    
    // Insert at new position
    newTracks.splice(dropIndex, 0, draggedTrack)
    
    setTracks(newTracks)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    if (!playlistName.trim()) {
      alert('Please enter a name')
      return
    }

    if (contentType === 'playlist' && tracks.length === 0) {
      alert('Please add at least one track to your playlist')
      return
    }

    if ((contentType === 'track' || contentType === 'album') && !selectedItem) {
      alert('Please select a track or album')
      return
    }

    // Convert selected item to track if needed
    let finalTracks = tracks
    if (selectedItem && (contentType === 'track' || contentType === 'album')) {
      const isRecording = 'length' in selectedItem
      const artist = selectedItem['artist-credit']?.[0]?.artist?.name || 'Unknown Artist'
      
      finalTracks = [{
        id: selectedItem.id,
        title: selectedItem.title,
        artist,
        linkUrl: `https://musicbrainz.org/${isRecording ? 'recording' : 'release'}/${selectedItem.id}`,
        albumArt: coverImage,
      }]
    }

    // Use first track's album art as cover if user hasn't uploaded one
    let finalCoverImage = coverImage
    if (!finalCoverImage && finalTracks.length > 0 && finalTracks[0].albumArt) {
      finalCoverImage = finalTracks[0].albumArt
    }

    onSubmit({
      name: playlistName,
      description: playlistDescription,
      tracks: finalTracks,
      coverImageUrl: finalCoverImage,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-background border-4 border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-4 border-border">
          <h2 className="text-2xl font-display font-bold uppercase">
            Share What You&apos;re Listening To
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Type Selection */}
        <div className="flex gap-2 p-6 border-b-2 border-border">
          <button
            onClick={() => setContentType('track')}
            className={`flex items-center gap-2 px-4 py-2 font-medium uppercase transition-all ${
              contentType === 'track'
                ? 'bg-foreground text-background'
                : 'bg-muted hover:bg-muted-foreground/20'
            }`}
          >
            <Music className="w-4 h-4" />
            Single Track
          </button>
          <button
            onClick={() => setContentType('album')}
            className={`flex items-center gap-2 px-4 py-2 font-medium uppercase transition-all ${
              contentType === 'album'
                ? 'bg-foreground text-background'
                : 'bg-muted hover:bg-muted-foreground/20'
            }`}
          >
            <Disc className="w-4 h-4" />
            Album
          </button>
          <button
            onClick={() => setContentType('playlist')}
            className={`flex items-center gap-2 px-4 py-2 font-medium uppercase transition-all ${
              contentType === 'playlist'
                ? 'bg-foreground text-background'
                : 'bg-muted hover:bg-muted-foreground/20'
            }`}
          >
            <List className="w-4 h-4" />
            Custom Playlist
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Search & Results */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Search {contentType === 'playlist' ? 'Music' : contentType === 'track' ? 'Tracks' : 'Albums'}
                </label>
                
                {contentType === 'playlist' && (
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setSearchTab('track')}
                      className={`px-3 py-1 text-sm font-medium uppercase ${
                        searchTab === 'track'
                          ? 'bg-foreground text-background'
                          : 'bg-muted hover:bg-muted-foreground/20'
                      }`}
                    >
                      Tracks
                    </button>
                    <button
                      onClick={() => setSearchTab('album')}
                      className={`px-3 py-1 text-sm font-medium uppercase ${
                        searchTab === 'album'
                          ? 'bg-foreground text-background'
                          : 'bg-muted hover:bg-muted-foreground/20'
                      }`}
                    >
                      Albums
                    </button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                    placeholder={`Search for ${contentType === 'album' ? 'albums' : 'tracks'}...`}
                    className="input flex-1"
                  />
                  <button
                    onClick={() => handleSearch(1)}
                    disabled={isSearching || !searchQuery.trim()}
                    className="btn-primary px-4"
                  >
                    {isSearching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="space-y-3">
                <div className="space-y-2 min-h-[300px]">
                  {searchResults.map((item) => {
                    const isRecording = 'length' in item
                    const artist = item['artist-credit']?.[0]?.artist?.name || 'Unknown Artist'
                    const releaseId = isRecording 
                      ? (item as Recording).releases?.[0]?.id 
                      : (item as Release).id
                    const isLoading = releaseId ? loadingCovers.has(releaseId) : false
                    const coverImage = releaseId ? cachedCovers.get(releaseId) : undefined
                    const isAlbum = !isRecording && searchTab === 'album'
                    const isExpanded = isAlbum && expandedAlbumId === item.id
                    const tracks = isAlbum ? albumTracks.get(item.id) : undefined
                    const isLoadingTracks = isAlbum && loadingAlbumTracks.has(item.id)

                    return (
                      <div key={item.id} className="space-y-1">
                        <div
                          className="flex items-center gap-3 p-3 card card-hover cursor-pointer"
                          onClick={() => {
                            if (isAlbum && contentType === 'playlist') {
                              handleToggleAlbumExpansion(item.id)
                            } else {
                              handleAddTrack(item)
                            }
                          }}
                        >
                          <div className="w-12 h-12 bg-muted border-2 border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {isLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            ) : coverImage ? (
                              <Image
                                src={coverImage}
                                alt={item.title}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Music className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{artist}</p>
                            {isAlbum && (item as Release).date && (
                              <p className="text-xs text-muted-foreground">{(item as Release).date}</p>
                            )}
                          </div>
                          {isAlbum && contentType === 'playlist' ? (
                            isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                            )
                          ) : (
                            <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                        
                        {/* Album tracks dropdown */}
                        {isAlbum && isExpanded && contentType === 'playlist' && (
                          <div className="ml-4 pl-4 border-l-2 border-border space-y-1">
                            {isLoadingTracks ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Loading tracks...</span>
                              </div>
                            ) : tracks && tracks.length > 0 ? (
                              tracks.map((track) => (
                                <div
                                  key={track.id}
                                  className="flex items-center gap-2 p-2 hover:bg-muted/50 cursor-pointer text-sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAddTrackFromAlbum(track, item as Release)
                                  }}
                                >
                                  <span className="text-muted-foreground w-6 text-right">{track.number}</span>
                                  <span className="flex-1 truncate">{track.title}</span>
                                  {track.length && (
                                    <span className="text-muted-foreground text-xs">
                                      {Math.floor(track.length / 60000)}:{String(Math.floor((track.length % 60000) / 1000)).padStart(2, '0')}
                                    </span>
                                  )}
                                  <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground py-2">No tracks found</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  
                  {searchResults.length === 0 && searchQuery && !isSearching && (
                    <p className="text-center text-muted-foreground py-8">
                      No results found. Try a different search.
                    </p>
                  )}
                  
                  {searchResults.length === 0 && !searchQuery && (
                    <p className="text-center text-muted-foreground py-8">
                      Search for music to add
                    </p>
                  )}
                </div>

                {/* Pagination */}
                {searchResults.length > 0 && totalResults > resultsPerPage && (
                  <div className="flex items-center justify-between border-t-2 border-border pt-3">
                    <div className="text-xs text-muted-foreground">
                      {((currentPage - 1) * resultsPerPage) + 1}-{Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1 || isSearching}
                        className="p-2 bg-muted hover:bg-muted-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center px-3 text-sm font-medium">
                        {currentPage} / {Math.ceil(totalResults / resultsPerPage)}
                      </div>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage >= Math.ceil(totalResults / resultsPerPage) || isSearching}
                        className="p-2 bg-muted hover:bg-muted-foreground/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Playlist Builder */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {contentType === 'playlist' ? 'Playlist' : contentType === 'track' ? 'Track' : 'Album'} Name *
                </label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Enter name..."
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="input w-full resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cover Image</label>
                {coverImage ? (
                  <div className="relative">
                    <Image
                      src={coverImage}
                      alt="Cover"
                      width={200}
                      height={200}
                      className="w-full h-48 object-cover border-2 border-border"
                    />
                    <button
                      onClick={() => setCoverImage(undefined)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : tracks.length > 0 && tracks[0].albumArt ? (
                  <div className="relative">
                    <Image
                      src={tracks[0].albumArt}
                      alt="Cover from first track"
                      width={200}
                      height={200}
                      className="w-full h-48 object-cover border-2 border-border opacity-75"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <label className="cursor-pointer text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <ImageIcon className="w-8 h-8 text-white mb-2 mx-auto" />
                        <span className="text-xs text-white font-medium">
                          Using first track&apos;s cover
                          <br />
                          Click to upload custom
                        </span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload</span>
                    {contentType === 'playlist' && (
                      <span className="text-xs text-muted-foreground mt-1">
                        Or add tracks to use first track&apos;s cover
                      </span>
                    )}
                  </label>
                )}
              </div>

              {contentType === 'playlist' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tracks ({tracks.length})
                  </label>
                  {tracks.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Drag tracks to reorder
                    </p>
                  )}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tracks.map((track, index) => (
                      <div
                        key={track.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-3 p-3 card transition-all cursor-move ${
                          draggedIndex === index ? 'opacity-50 scale-95' : ''
                        } ${
                          dragOverIndex === index && draggedIndex !== index
                            ? 'border-primary border-2 scale-105'
                            : ''
                        }`}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{track.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveTrack(track.id)}
                          className="p-1 hover:bg-destructive/20 text-destructive flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {tracks.length === 0 && (
                      <p className="text-center text-muted-foreground py-8 text-sm">
                        Add tracks from search results
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t-4 border-border">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            Create & Share
          </button>
        </div>
      </div>
    </div>
  )
}

