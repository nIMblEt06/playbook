'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { ReviewCard } from '@/components/discover/review-card'
import { useAlbum, useAlbumTracks, useAlbumReviews, useRateAlbum, useCreateOrUpdateReview } from '@/lib/hooks/use-albums'
import { formatDate } from '@/lib/utils/format'
import { PlayButton } from '@/components/player'
import {
  Loader2,
  Music,
  Star,
  Calendar,
  Disc,
  ArrowLeft,
  ExternalLink,
  Clock,
  Play,
  ChevronDown,
} from 'lucide-react'

export default function AlbumPage() {
  const { spotifyId } = useParams<{ spotifyId: string }>()
  const [reviewSort, setReviewSort] = useState<'recent' | 'engaged' | 'rating_high' | 'rating_low'>('recent')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewContent, setReviewContent] = useState('')
  const [reviewTitle, setReviewTitle] = useState('')
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [isTracksExpanded, setIsTracksExpanded] = useState(true)

  const { data: albumData, isLoading: albumLoading, error: albumError } = useAlbum(spotifyId)
  const { data: tracksData, isLoading: tracksLoading } = useAlbumTracks(spotifyId)
  const { data: reviewsData, isLoading: reviewsLoading } = useAlbumReviews(spotifyId, { sort: reviewSort, limit: 10 })
  const rateAlbum = useRateAlbum(spotifyId)
  const createReview = useCreateOrUpdateReview(spotifyId)

  const album = albumData?.album
  const tracks = tracksData?.tracks ?? []

  // Format duration from milliseconds to mm:ss
  const formatDuration = (ms: number | null) => {
    if (!ms) return '--:--'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Convert tracks to player format for PlayButton
  const getPlayerTracks = () => {
    return tracks.map((track) => ({
      id: track.spotifyId || track.id,
      uri: track.spotifyUri || `spotify:track:${track.spotifyId}`,
      name: track.title,
      artists: [track.artistName],
      albumName: album?.title || '',
      albumId: album?.spotifyId || '',
      coverUrl: album?.coverImageUrl || null,
      duration: track.duration || 0,
      previewUrl: track.previewUrl,
    }))
  }

  // Get single track in player format
  const getPlayerTrack = (track: typeof tracks[0]) => ({
    id: track.spotifyId || track.id,
    uri: track.spotifyUri || `spotify:track:${track.spotifyId}`,
    name: track.title,
    artists: [track.artistName],
    albumName: album?.title || '',
    albumId: album?.spotifyId || '',
    coverUrl: album?.coverImageUrl || null,
    duration: track.duration || 0,
    previewUrl: track.previewUrl,
  })

  const handleQuickRate = (rating: number) => {
    rateAlbum.mutate(rating)
    setSelectedRating(rating)
  }

  const handleSubmitReview = () => {
    if (!selectedRating && !reviewContent.trim()) return

    createReview.mutate({
      rating: selectedRating || undefined,
      title: reviewTitle.trim() || undefined,
      content: reviewContent.trim() || undefined,
    }, {
      onSuccess: () => {
        setShowReviewForm(false)
        setReviewContent('')
        setReviewTitle('')
      }
    })
  }

  if (albumLoading) {
    return (
      <AppLayout showRightSidebar={false}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (albumError || !album) {
    return (
      <AppLayout showRightSidebar={false}>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-destructive mb-4">Album not found</p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Album Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Cover Art */}
          <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 rounded-lg overflow-hidden bg-muted shadow-lg mx-auto md:mx-0">
            {album.coverImageUrl ? (
              <Image
                src={album.coverImageUrl}
                alt={album.title}
                width={256}
                height={256}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Album Info */}
          <div className="flex-1 text-center md:text-left">
            <span className="text-sm text-muted-foreground uppercase tracking-wide">
              {album.albumType || 'Album'}
            </span>
            <h1 className="text-3xl font-bold mt-1 mb-2">{album.title}</h1>
            {album.artistSpotifyId ? (
              <Link
                href={`/artists/${album.artistSpotifyId}`}
                className="text-lg text-primary hover:underline"
              >
                {album.artistName}
              </Link>
            ) : (
              <span className="text-lg text-foreground">{album.artistName}</span>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground justify-center md:justify-start">
              {album.releaseYear && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {album.releaseYear}
                </span>
              )}
              {album.trackCount && (
                <span className="flex items-center gap-1">
                  <Disc className="w-4 h-4" />
                  {album.trackCount} tracks
                </span>
              )}
              {album.spotifyId && (
                <a
                  href={`https://open.spotify.com/album/${album.spotifyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Spotify
                </a>
              )}
            </div>

            {/* Tags */}
            {album.tags && album.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                {album.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    className="px-2 py-1 text-xs bg-muted rounded hover:bg-muted/80 transition-colors"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Play Album Button */}
            {tracks.length > 0 && (
              <div className="mt-6 flex justify-center md:justify-start">
                <PlayButton
                  tracks={getPlayerTracks()}
                  size="lg"
                  className="gap-2 px-6"
                />
              </div>
            )}
          </div>
        </div>

        {/* Rating Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold">
                {album.averageRating ? album.averageRating.toFixed(1) : '—'}
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      album.averageRating && star <= Math.round(album.averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {album.ratingCount} {album.ratingCount === 1 ? 'rating' : 'ratings'}
              </p>
            </div>

            {/* Rating Distribution */}
            {album.ratingDistribution && (
              <div className="flex-1">
                <p className="text-sm font-medium mb-3">Rating Distribution</p>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = album.ratingDistribution[rating] || 0
                    const percentage = album.ratingCount > 0
                      ? (count / album.ratingCount) * 100
                      : 0
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="w-4 text-sm">{rating}</span>
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-xs text-muted-foreground text-right">
                          {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quick Rate */}
            <div className="text-center md:border-l md:border-border md:pl-8">
              <p className="text-sm font-medium mb-3">Your Rating</p>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleQuickRate(rating)}
                    className="p-1 hover:scale-110 transition-transform"
                    disabled={rateAlbum.isPending}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        (selectedRating || album.userRating || 0) >= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground hover:text-yellow-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="mt-4 btn-ghost text-sm"
              >
                {album.userReview ? 'Edit Review' : 'Write a Review'}
              </button>
            </div>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <div className="mt-6 pt-6 border-t border-border">
              <input
                type="text"
                placeholder="Review title (optional)"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                className="w-full input mb-3"
              />
              <textarea
                placeholder="Write your review..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                rows={4}
                className="w-full input resize-none"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={createReview.isPending || (!selectedRating && !reviewContent.trim())}
                  className="btn-primary"
                >
                  {createReview.isPending ? 'Saving...' : 'Post Review'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Track List Section */}
        <div className="mb-8">
          <button
            onClick={() => setIsTracksExpanded(!isTracksExpanded)}
            className="flex items-center justify-between w-full text-left mb-4 group"
          >
            <h2 className="text-xl font-semibold">
              Tracks {tracks.length > 0 && <span className="text-muted-foreground font-normal">({tracks.length})</span>}
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 ${
                isTracksExpanded ? '' : '-rotate-90'
              }`}
            />
          </button>
          {tracksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="w-8 h-8 mx-auto mb-3" />
              <p>No tracks available</p>
            </div>
          ) : isTracksExpanded && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-2 border-b border-border text-xs text-muted-foreground uppercase tracking-wide">
                <span className="w-12">#</span>
                <span>Title</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                </span>
              </div>

              {/* Track rows */}
              <div className="divide-y divide-border">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="grid grid-cols-[auto_1fr_auto] gap-4 px-4 py-3 hover:bg-muted/50 transition-colors group items-center"
                  >
                    {/* Track number / Play button */}
                    <div className="w-12 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground group-hover:hidden">
                        {track.position || index + 1}
                      </span>
                      <div className="hidden group-hover:block">
                        <PlayButton
                          track={getPlayerTrack(track)}
                          tracks={getPlayerTracks()}
                          startIndex={index}
                          size="sm"
                          variant="icon-only"
                        />
                      </div>
                    </div>

                    {/* Track info */}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                    </div>

                    {/* Duration */}
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Reviews</h2>
            <select
              value={reviewSort}
              onChange={(e) => setReviewSort(e.target.value as typeof reviewSort)}
              className="input text-sm py-2"
            >
              <option value="recent">Most Recent</option>
              <option value="engaged">Most Engaged</option>
              <option value="rating_high">Highest Rated</option>
              <option value="rating_low">Lowest Rated</option>
            </select>
          </div>

          {reviewsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!reviewsLoading && reviewsData?.items && reviewsData.items.length > 0 ? (
            <div className="space-y-4">
              {reviewsData.items.map((review) => (
                <ReviewCard key={review.id} review={{...review, album: { id: album.id, spotifyId: album.spotifyId, title: album.title, artistName: album.artistName, coverImageUrl: album.coverImageUrl }}} />
              ))}
            </div>
          ) : (
            !reviewsLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-8 h-8 mx-auto mb-3" />
                <p>No reviews yet. Be the first to write one!</p>
              </div>
            )
          )}
        </div>
      </div>
    </AppLayout>
  )
}
