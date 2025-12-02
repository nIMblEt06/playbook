'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { playlistsService } from '@/lib/api/services/playlists'
import { AppLayout } from '@/components/layout/app-layout'
import { Loader2, Music, ExternalLink, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function PlaylistPage() {
  const params = useParams()
  const playlistId = params.id as string

  const { data: playlist, isLoading, error } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => playlistsService.getPlaylist(playlistId),
    enabled: !!playlistId,
  })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (error || !playlist) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="card p-8 text-center">
            <h2 className="text-2xl font-display font-bold mb-2">Playlist Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This playlist doesn&apos;t exist or has been removed.
            </p>
            <Link href="/" className="btn-primary">
              Back to Feed
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return null
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="px-6 py-8 border-b-2 border-border">
          <div className="flex gap-6">
            {/* Cover Image */}
            <div className="flex-shrink-0">
              {playlist.coverImageUrl ? (
                <Image
                  src={playlist.coverImageUrl}
                  alt={playlist.name}
                  width={200}
                  height={200}
                  className="w-48 h-48 border-4 border-border object-cover"
                />
              ) : (
                <div className="w-48 h-48 bg-muted border-4 border-border flex items-center justify-center">
                  <Music className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-sm font-medium uppercase text-muted-foreground mb-2">
                {playlist.isPublic ? 'Public' : 'Private'} Playlist
              </p>
              <h1 className="text-4xl font-display font-bold mb-4">{playlist.name}</h1>
              
              {playlist.description && (
                <p className="text-muted-foreground mb-4">{playlist.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm">
                {playlist.owner && (
                  <Link
                    href={`/u/${playlist.owner.username}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    {playlist.owner.avatarUrl ? (
                      <Image
                        src={playlist.owner.avatarUrl}
                        alt={playlist.owner.displayName}
                        width={24}
                        height={24}
                        className="w-6 h-6 border-2 border-border rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-muted border-2 border-border rounded-full" />
                    )}
                    <span className="font-medium">{playlist.owner.displayName}</span>
                  </Link>
                )}
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks */}
        <div className="px-6 py-6">
          {playlist.tracks && playlist.tracks.length > 0 ? (
            <div className="space-y-2">
              {playlist.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-4 card card-hover group"
                >
                  {/* Track Number */}
                  <div className="w-8 text-center text-muted-foreground font-medium">
                    {index + 1}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                      {track.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>

                  {/* Link */}
                  <a
                    href={track.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    title="Open in MusicBrainz"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tracks in this playlist</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

