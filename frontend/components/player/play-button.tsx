'use client'

import { Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlayerStore, type PlayerTrack } from '@/lib/store/player-store'
import { useSpotifyPlayer } from '@/lib/hooks/use-spotify-player'
import type { SpotifyTrack } from '@/lib/api/services/spotify'

interface PlayButtonProps {
  // For single track
  track?: {
    id: string
    uri?: string
    name: string
    artists: string[]
    albumName: string
    albumId: string
    coverUrl: string | null
    duration: number
    previewUrl?: string | null
  }

  // For album/playlist (array of tracks)
  tracks?: Array<{
    id: string
    uri?: string
    name: string
    artists: string[]
    albumName: string
    albumId: string
    coverUrl: string | null
    duration: number
    previewUrl?: string | null
  }>

  // Optional: start from specific index when playing album
  startIndex?: number

  // Styling variants
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'overlay' | 'icon-only'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
}

const variantClasses = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  overlay: 'bg-black/60 text-white backdrop-blur-sm hover:bg-black/80',
  'icon-only': 'bg-transparent text-current hover:opacity-80',
}

export function PlayButton({
  track,
  tracks,
  startIndex = 0,
  size = 'md',
  variant = 'default',
  className,
}: PlayButtonProps) {
  const { playTrack, playAlbum, currentTrack, isPlaying } = usePlayerStore()
  const { pause, resume } = useSpotifyPlayer()

  // Determine if this button's track/tracks are currently playing
  const isThisPlaying = track?.id && currentTrack?.id === track.id

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // If currently playing this track, toggle pause/play
    if (isThisPlaying) {
      if (isPlaying) {
        await pause()
      } else {
        await resume()
      }
      return
    }

    // Play single track - MusicPlayer will handle actual playback via useEffect
    if (track) {
      const playerTrack: PlayerTrack = {
        id: track.id,
        uri: track.uri || `spotify:track:${track.id}`,
        name: track.name,
        artists: track.artists,
        albumName: track.albumName,
        albumId: track.albumId,
        coverUrl: track.coverUrl,
        duration: track.duration,
        previewUrl: track.previewUrl || null,
      }

      // If tracks array is provided with single track, use it as context
      if (tracks && tracks.length > 0) {
        const playerTracks: PlayerTrack[] = tracks.map((t) => ({
          id: t.id,
          uri: t.uri || `spotify:track:${t.id}`,
          name: t.name,
          artists: t.artists,
          albumName: t.albumName,
          albumId: t.albumId,
          coverUrl: t.coverUrl,
          duration: t.duration,
          previewUrl: t.previewUrl || null,
        }))
        playTrack(playerTrack, playerTracks)
      } else {
        playTrack(playerTrack)
      }
      return
    }

    // Play queue of tracks (album/playlist) - MusicPlayer will handle actual playback
    if (tracks && tracks.length > 0) {
      const playerTracks: PlayerTrack[] = tracks.map((t) => ({
        id: t.id,
        uri: t.uri || `spotify:track:${t.id}`,
        name: t.name,
        artists: t.artists,
        albumName: t.albumName,
        albumId: t.albumId,
        coverUrl: t.coverUrl,
        duration: t.duration,
        previewUrl: t.previewUrl || null,
      }))
      playAlbum(playerTracks, startIndex)
      return
    }
  }

  const showPause = isThisPlaying && isPlaying

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      aria-label={showPause ? 'Pause' : 'Play'}
    >
      {showPause ? (
        <Pause
          size={iconSizes[size]}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1}
        />
      ) : (
        <Play
          size={iconSizes[size]}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={1}
        />
      )}
    </button>
  )
}

/**
 * Helper function to convert SpotifyTrack to PlayerTrack
 */
export function spotifyTrackToPlayerTrack(
  track: SpotifyTrack,
  albumCover?: string
): PlayerTrack {
  return {
    id: track.id,
    uri: `spotify:track:${track.id}`,
    name: track.name,
    artists: track.artists.map((a) => a.name),
    albumName: track.album.name,
    albumId: track.album.id,
    coverUrl: albumCover || track.album.images[0]?.url || null,
    duration: track.duration_ms,
    previewUrl: track.preview_url || null,
  }
}

/**
 * Helper function to convert multiple SpotifyTracks to PlayerTracks
 */
export function spotifyTracksToPlayerTracks(
  tracks: SpotifyTrack[],
  albumCover?: string
): PlayerTrack[] {
  return tracks.map((track) => spotifyTrackToPlayerTrack(track, albumCover))
}
