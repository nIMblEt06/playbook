/**
 * Spotify Search Integration
 *
 * This file provides the same interface as the old MusicBrainz integration
 * but uses the Spotify API via our backend instead.
 */

import { spotifyService, type SpotifyTrack, type SpotifyAlbum } from '../api/services/spotify'

// Types maintained for compatibility with create-playlist-dialog
export interface Recording {
  id: string
  title: string
  length?: number
  'artist-credit'?: Array<{ artist: { id: string; name: string } }>
  releases?: Array<{ id: string; title: string }>
}

export interface Release {
  id: string
  title: string
  date?: string
  'artist-credit'?: Array<{ artist: { id: string; name: string } }>
}

export interface Track {
  id: string
  number: string
  title: string
  length?: number
  recording?: { id: string }
}

/**
 * Convert Spotify track to Recording format (for compatibility)
 */
function spotifyTrackToRecording(track: SpotifyTrack): Recording {
  return {
    id: track.id,
    title: track.name,
    length: track.duration_ms,
    'artist-credit': track.artists.map((artist) => ({
      artist: { id: artist.id, name: artist.name },
    })),
    releases: track.album
      ? [{ id: track.album.id, title: track.album.name }]
      : undefined,
  }
}

/**
 * Convert Spotify album to Release format (for compatibility)
 */
function spotifyAlbumToRelease(album: SpotifyAlbum): Release {
  return {
    id: album.id,
    title: album.name,
    date: album.release_date,
    'artist-credit': album.artists.map((artist) => ({
      artist: { id: artist.id, name: artist.name },
    })),
  }
}

/**
 * Convert Spotify track to Track format (for album tracks)
 */
function spotifyTrackToTrack(track: SpotifyTrack): Track {
  return {
    id: track.id,
    number: track.track_number.toString(),
    title: track.name,
    length: track.duration_ms,
    recording: { id: track.id },
  }
}

// Store album images for getCoverArt lookups
const albumImageCache = new Map<string, string>()

/**
 * Search for tracks using Spotify API
 */
export async function searchTracks(
  query: string,
  page: number = 1,
  limit: number = 10
): Promise<{ items: Recording[]; total: number }> {
  try {
    const result = await spotifyService.searchTracks(query, page, limit)

    // Cache album images for getCoverArt lookups
    result.items.forEach((track) => {
      if (track.album?.images?.length > 0) {
        const coverUrl = spotifyService.getCoverUrl(track.album.images, 'medium')
        if (coverUrl) {
          albumImageCache.set(track.album.id, coverUrl)
        }
      }
    })

    return {
      items: result.items.map(spotifyTrackToRecording),
      total: result.total,
    }
  } catch (error) {
    console.error('searchTracks error:', error)
    return { items: [], total: 0 }
  }
}

/**
 * Search for albums using Spotify API
 */
export async function searchAlbums(
  query: string,
  page: number = 1,
  limit: number = 10
): Promise<{ items: Release[]; total: number }> {
  try {
    const result = await spotifyService.searchAlbums(query, page, limit)

    // Cache album images for getCoverArt lookups
    result.items.forEach((album) => {
      if (album.images?.length > 0) {
        const coverUrl = spotifyService.getCoverUrl(album.images, 'medium')
        if (coverUrl) {
          albumImageCache.set(album.id, coverUrl)
        }
      }
    })

    return {
      items: result.items.map(spotifyAlbumToRelease),
      total: result.total,
    }
  } catch (error) {
    console.error('searchAlbums error:', error)
    return { items: [], total: 0 }
  }
}

/**
 * Get cover art URL for an album
 * Uses cached images from search results or fetches album details
 */
export async function getCoverArt(releaseId: string): Promise<string | null> {
  // Check cache first
  const cached = albumImageCache.get(releaseId)
  if (cached) return cached

  // Fetch album details if not cached
  try {
    const album = await spotifyService.getAlbum(releaseId)
    if (album?.images?.length > 0) {
      const coverUrl = spotifyService.getCoverUrl(album.images, 'medium')
      if (coverUrl) {
        albumImageCache.set(releaseId, coverUrl)
        return coverUrl
      }
    }
  } catch (error) {
    console.error('getCoverArt error:', error)
  }

  return null
}

/**
 * Get tracks from an album
 */
export async function getAlbumTracks(releaseId: string): Promise<Track[]> {
  try {
    const tracks = await spotifyService.getAlbumTracks(releaseId)

    // Cache album image if available from first track
    if (tracks.length > 0 && tracks[0].album?.images?.length > 0) {
      const coverUrl = spotifyService.getCoverUrl(tracks[0].album.images, 'medium')
      if (coverUrl) {
        albumImageCache.set(releaseId, coverUrl)
      }
    }

    return tracks.map(spotifyTrackToTrack)
  } catch (error) {
    console.error('getAlbumTracks error:', error)
    return []
  }
}
