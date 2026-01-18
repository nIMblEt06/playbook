import { redis } from '../utils/redis.js';

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
 * Returns basic parsed info (can be extended with Spotify API for full metadata)
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

  // For all sources, return a placeholder with parsed info
  // Can be extended with Spotify API for full metadata
  if (parsed.source !== 'unknown') {
    metadata = {
      title: 'Music Link',
      artist: 'Unknown',
      type: parsed.type,
      source: parsed.source,
    };

    // Try to extract info from Spotify URLs (basic info from URL structure)
    if (parsed.source === 'spotify') {
      // Spotify URLs don't contain metadata in the URL
      // Would need Spotify API for full metadata
      metadata.title = `Spotify ${parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1)}`;
    }

    // Try to extract info from Apple Music URLs
    if (parsed.source === 'apple_music') {
      metadata.title = `Apple Music ${parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1)}`;
    }

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
