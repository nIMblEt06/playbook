'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { AlbumCard } from '@/components/discover/album-card'
import { useArtist, useArtistDiscography } from '@/lib/hooks/use-artists'
import {
  Loader2,
  User,
  Star,
  MapPin,
  Calendar,
  ArrowLeft,
  ExternalLink,
  Disc,
  Music,
} from 'lucide-react'

type DiscographyFilter = 'all' | 'album' | 'single' | 'ep' | 'compilation' | 'live'

export default function ArtistPage() {
  const { spotifyId } = useParams<{ spotifyId: string }>()
  const [filter, setFilter] = useState<DiscographyFilter>('all')

  const { data: artistData, isLoading: artistLoading, error: artistError } = useArtist(spotifyId)
  const { data: discographyData, isLoading: discographyLoading } = useArtistDiscography(spotifyId)

  const artist = artistData?.artist

  // Extract life-span info from metadata
  const lifeSpan = artist?.metadata?.['life-span']
  const beginYear = lifeSpan?.begin?.substring(0, 4)
  const endYear = lifeSpan?.end?.substring(0, 4)
  const isActive = lifeSpan?.ended === false

  // Extract tags from metadata
  const artistTags = artist?.metadata?.tags?.slice(0, 5) || []

  // Filter discography by type
  const filteredReleases = discographyData?.items?.filter((release) => {
    if (filter === 'all') return true
    const type = release['primary-type']?.toLowerCase() || ''
    return type === filter
  }) || []

  // Group releases by type for display
  const releaseTypes = ['album', 'single', 'ep', 'compilation', 'live'] as const

  if (artistLoading) {
    return (
      <AppLayout showRightSidebar={false}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (artistError || !artist) {
    return (
      <AppLayout showRightSidebar={false}>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-destructive mb-4">Artist not found</p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Artist Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Artist Image */}
          <div className="w-48 h-48 md:w-56 md:h-56 flex-shrink-0 rounded-lg overflow-hidden bg-muted shadow-lg mx-auto md:mx-0">
            {artist.imageUrl ? (
              <Image
                src={artist.imageUrl}
                alt={artist.name}
                width={224}
                height={224}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                <User className="w-20 h-20 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Artist Info */}
          <div className="flex-1 text-center md:text-left">
            <span className="text-sm text-muted-foreground uppercase tracking-wide">
              {artist.type || 'Artist'}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold mt-1 mb-3">{artist.name}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground justify-center md:justify-start">
              {artist.country && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {artist.country}
                </span>
              )}
              {beginYear && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {beginYear}
                  {endYear ? ` – ${endYear}` : isActive ? ' – present' : ''}
                </span>
              )}
              {artist.spotifyId && (
                <a
                  href={`https://open.spotify.com/artist/${artist.spotifyId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Spotify
                </a>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6 justify-center md:justify-start">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {artist.averageRating ? artist.averageRating.toFixed(1) : '—'}
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        artist.averageRating && star <= Math.round(artist.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {artist.ratingCount || 0} ratings
                </p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold">
                  {discographyData?.items?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">releases</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold">{artist.reviewCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">reviews</p>
              </div>
            </div>

            {/* Tags */}
            {artistTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                {artistTags.map((tag) => (
                  <span
                    key={tag.name}
                    className="px-2 py-1 text-xs bg-muted rounded"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Discography Section */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Disc className="w-5 h-5" />
              Discography
            </h2>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              {(['all', ...releaseTypes] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors capitalize ${
                    filter === type
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {type === 'ep' ? 'EP' : type}
                </button>
              ))}
            </div>
          </div>

          {discographyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredReleases.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredReleases.map((release) => (
                <Link
                  key={release.id}
                  href={`/album/${release.id}`}
                  className="group block"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2 relative">
                    {release.coverArtUrl ? (
                      <Image
                        src={release.coverArtUrl}
                        alt={release.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Type Badge */}
                    {release['primary-type'] && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 text-xs bg-black/70 text-white rounded capitalize">
                        {release['primary-type'].toLowerCase() === 'ep'
                          ? 'EP'
                          : release['primary-type'].toLowerCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {release.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {release['first-release-date']?.substring(0, 4) || 'Unknown'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Music className="w-8 h-8 mx-auto mb-3" />
              <p>No {filter === 'all' ? 'releases' : `${filter}s`} found</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
