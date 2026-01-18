'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, Music } from 'lucide-react'
import type { DiscoverAlbum, DiscoverRelease } from '@/lib/api/services/discover'

interface AlbumCardProps {
  album: DiscoverAlbum | DiscoverRelease
  size?: 'sm' | 'md' | 'lg'
}

export function AlbumCard({ album, size = 'md' }: AlbumCardProps) {
  const sizeClasses = {
    sm: 'w-24',
    md: 'w-36',
    lg: 'w-44',
  }

  const imageSizes = {
    sm: 96,
    md: 144,
    lg: 176,
  }

  const hasRating = 'averageRating' in album && album.averageRating !== null
  const rating = hasRating ? album.averageRating : null
  const year = 'releaseYear' in album ? album.releaseYear : null
  const releaseDate = 'releaseDate' in album ? album.releaseDate : null

  return (
    <Link
      href={`/album/${album.spotifyId}`}
      className={`${sizeClasses[size]} flex-shrink-0 group`}
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted shadow-sm group-hover:shadow-md transition-shadow">
        {album.coverImageUrl ? (
          <Image
            src={album.coverImageUrl}
            alt={album.title}
            width={imageSizes[size]}
            height={imageSizes[size]}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Music className="w-8 h-8 text-muted-foreground" />
          </div>
        )}

        {/* Rating overlay */}
        {hasRating && rating !== null && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs flex items-center gap-0.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {album.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {album.artistName}
          {year && ` • ${year}`}
          {releaseDate && !year && ` • ${new Date(releaseDate).getFullYear()}`}
        </p>
      </div>
    </Link>
  )
}
