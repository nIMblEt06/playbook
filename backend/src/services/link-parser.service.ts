import { redis } from '../utils/redis.js';
import * as spotifyService from './spotify-search.service.js';

// Cache TTL for link metadata (1 hour)
const METADATA_CACHE_TTL = 3600;

export type LinkType = 'track' | 'album' | 'playlist' | 'artist' | 'unknown';
export type LinkSource =
  | 'spotify'
  | 'apple_music'
  | 'youtube_music'
  | 'soundcloud'
  | 'bandcamp'
  | 'unknown';

export interface ParsedLink {
  type: LinkType;
  source: LinkSource;
  externalId: string | null;
  url: string;
}

export interface LinkMetadata {
  title: string;
  artist: string;
  albumName?: string;
  coverArtUrl?: string;
  type: LinkType;
  source: LinkSource;
  duration?: number;
  releaseDate?: string;
}

// URL pattern matchers
const URL_PATTERNS: Record<string, { pattern: RegExp; source: LinkSource; type: LinkType }> = {
  // Spotify
  spotify_track: {
    pattern: /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
    source: 'spotify',
    type: 'track',
  },
  spotify_album: {
    pattern: /open\.spotify\.com\/album\/([a-zA-Z0-9]+)/,
    source: 'spotify',
    type: 'album',
  },
  spotify_playlist: {
    pattern: /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/,
    source: 'spotify',
    type: 'playlist',
  },
  spotify_artist: {
    pattern: /open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/,
    source: 'spotify',
    type: 'artist',
  },

  // Apple Music
  apple_track: {
    pattern: /music\.apple\.com\/[a-z]{2}\/album\/[^/]+\/(\d+)\?i=(\d+)/,
    source: 'apple_music',
    type: 'track',
  },
  apple_album: {
    pattern: /music\.apple\.com\/[a-z]{2}\/album\/[^/]+\/(\d+)(?:\?|$)/,
    source: 'apple_music',
    type: 'album',
  },
  apple_playlist: {
    pattern: /music\.apple\.com\/[a-z]{2}\/playlist\/[^/]+\/(pl\.[a-zA-Z0-9-]+)/,
    source: 'apple_music',
    type: 'playlist',
  },
  apple_artist: {
    pattern: /music\.apple\.com\/[a-z]{2}\/artist\/[^/]+\/(\d+)/,
    source: 'apple_music',
    type: 'artist',
  },

  // YouTube Music
  youtube_music_track: {
    pattern: /music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    source: 'youtube_music',
    type: 'track',
  },
  youtube_music_playlist: {
    pattern: /music\.youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
    source: 'youtube_music',
    type: 'playlist',
  },

  // SoundCloud
  soundcloud_track: {
    pattern: /soundcloud\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)(?:\?|$)/,
    source: 'soundcloud',
    type: 'track',
  },
  soundcloud_playlist: {
    pattern: /soundcloud\.com\/([a-zA-Z0-9_-]+)\/sets\/([a-zA-Z0-9_-]+)/,
    source: 'soundcloud',
    type: 'playlist',
  },

  // Bandcamp
  bandcamp_album: {
    pattern: /([a-zA-Z0-9_-]+)\.bandcamp\.com\/album\/([a-zA-Z0-9_-]+)/,
    source: 'bandcamp',
    type: 'album',
  },
  bandcamp_track: {
    pattern: /([a-zA-Z0-9_-]+)\.bandcamp\.com\/track\/([a-zA-Z0-9_-]+)/,
    source: 'bandcamp',
    type: 'track',
  },
};

/**
 * Parse a URL to detect its type and source
 */
export function parseUrl(url: string): ParsedLink {
  const normalizedUrl = url.trim();

  for (const [, config] of Object.entries(URL_PATTERNS)) {
    const match = normalizedUrl.match(config.pattern);
    if (match) {
      return {
        type: config.type,
        source: config.source,
        externalId: match[1] || null,
        url: normalizedUrl,
      };
    }
  }

  return {
    type: 'unknown',
    source: 'unknown',
    externalId: null,
    url: normalizedUrl,
  };
}

/**
 * Detect if a string contains a music URL
 */
export function detectMusicUrl(text: string): ParsedLink | null {
  // Common music URL patterns to search for
  const urlPatterns = [
    /https?:\/\/open\.spotify\.com\/[^\s]+/,
    /https?:\/\/music\.apple\.com\/[^\s]+/,
    /https?:\/\/music\.youtube\.com\/[^\s]+/,
    /https?:\/\/soundcloud\.com\/[^\s]+/,
    /https?:\/\/[a-zA-Z0-9_-]+\.bandcamp\.com\/[^\s]+/,
  ];

  for (const pattern of urlPatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = parseUrl(match[0]);
      if (parsed.type !== 'unknown') {
        return parsed;
      }
    }
  }

  return null;
}

/**
 * Helper to get from cache
 */
async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Redis cache get error:', error);
  }
  return null;
}

/**
 * Helper to set cache
 */
async function setCache(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (error) {
    console.warn('Redis cache set error:', error);
  }
}

/**
 * Fetch metadata for a parsed link
 * Uses Spotify API for Spotify links to get real metadata
 */
export async function fetchLinkMetadata(url: string): Promise<LinkMetadata | null> {
  const parsed = parseUrl(url);

  if (parsed.type === 'unknown') {
    return null;
  }

  // Check cache first
  const cacheKey = `link-meta:${url}`;
  const cached = await getFromCache<LinkMetadata>(cacheKey);
  if (cached) return cached;

  let metadata: LinkMetadata | null = null;

  // Fetch real metadata from Spotify API for Spotify links
  if (parsed.source === 'spotify' && parsed.externalId) {
    try {
      if (parsed.type === 'track') {
        const track = await spotifyService.getTrack(parsed.externalId);
        if (track) {
          metadata = {
            title: track.name,
            artist: track.artists.map((a) => a.name).join(', '),
            albumName: track.album?.name,
            coverArtUrl: track.album?.images?.[0]?.url,
            type: parsed.type,
            source: parsed.source,
            duration: track.duration_ms,
          };
        }
      } else if (parsed.type === 'album') {
        const album = await spotifyService.getAlbum(parsed.externalId);
        if (album) {
          metadata = {
            title: album.name,
            artist: album.artists.map((a) => a.name).join(', '),
            coverArtUrl: album.images?.[0]?.url,
            type: parsed.type,
            source: parsed.source,
            releaseDate: album.release_date,
          };
        }
      } else if (parsed.type === 'artist') {
        const artist = await spotifyService.getArtist(parsed.externalId);
        if (artist) {
          metadata = {
            title: artist.name,
            artist: artist.name,
            coverArtUrl: artist.images?.[0]?.url,
            type: parsed.type,
            source: parsed.source,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to fetch Spotify metadata:', error);
    }
  }

  // Fallback for non-Spotify sources or if Spotify API failed
  if (!metadata && parsed.source !== 'unknown') {
    metadata = {
      title: `${getPlatformDisplayName(parsed.source)} ${parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1)}`,
      artist: 'Unknown',
      type: parsed.type,
      source: parsed.source,
    };

    // Bandcamp - can extract artist from subdomain
    if (parsed.source === 'bandcamp') {
      const bandcampMatch = url.match(/([a-zA-Z0-9_-]+)\.bandcamp\.com/);
      if (bandcampMatch) {
        metadata.artist = bandcampMatch[1].replace(/-/g, ' ');
      }
    }
  }

  // Cache the result
  if (metadata) {
    await setCache(cacheKey, metadata, METADATA_CACHE_TTL);
  }

  return metadata;
}

/**
 * Validate if a URL is a supported music link
 */
export function isValidMusicUrl(url: string): boolean {
  const parsed = parseUrl(url);
  return parsed.type !== 'unknown' && parsed.source !== 'unknown';
}

/**
 * Get the platform name for display
 */
export function getPlatformDisplayName(source: LinkSource): string {
  const names: Record<LinkSource, string> = {
    spotify: 'Spotify',
    apple_music: 'Apple Music',
    youtube_music: 'YouTube Music',
    soundcloud: 'SoundCloud',
    bandcamp: 'Bandcamp',
    unknown: 'Unknown',
  };
  return names[source];
}
