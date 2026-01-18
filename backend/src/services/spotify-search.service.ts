import { getValidAccessToken } from './spotify-auth.service.js';
import { prisma } from '../utils/prisma.js';
import { redis } from '../utils/redis.js';

const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const CACHE_TTL = 300; // 5 minutes

// Types
export interface SpotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  track_number: number;
  artists: Array<{ id: string; name: string }>;
  album: {
    id: string;
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
    release_date: string;
  };
  external_urls: { spotify: string };
  preview_url?: string | null;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  album_type: string;
  total_tracks: number;
  release_date: string;
  artists: Array<{ id: string; name: string }>;
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: { spotify: string };
}


export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
  images: Array<{ url: string; height: number; width: number }>;
  external_urls: { spotify: string };
}

export interface SpotifySearchResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Helper to get from cache
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

// Helper to set cache
async function setCache(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (error) {
    console.warn('Redis cache set error:', error);
  }
}

/**
 * Get a valid Spotify access token for the user or use client credentials
 */
async function getSpotifyToken(userId?: string): Promise<string | null> {
  // Try user token first
  if (userId) {
    const userToken = await getValidAccessToken(userId);
    if (userToken) return userToken;
  }

  // Fallback: Use client credentials flow for search
  // This works without a user being logged in
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Spotify credentials not configured');
    return null;
  }

  // Check for cached client token
  const cachedToken = await getFromCache<{ token: string; expires: number }>('spotify:client_token');
  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!response.ok) {
      console.error('Failed to get client credentials token');
      return null;
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    const tokenData = {
      token: data.access_token,
      expires: Date.now() + (data.expires_in - 60) * 1000, // Subtract 60s buffer
    };

    await setCache('spotify:client_token', tokenData, data.expires_in - 60);
    return tokenData.token;
  } catch (error) {
    console.error('Error getting client credentials token:', error);
    return null;
  }
}

/**
 * Search for tracks on Spotify
 */
export async function searchTracks(
  query: string,
  page: number = 1,
  limit: number = 10,
  userId?: string
): Promise<SearchResult<SpotifyTrack>> {
  const cacheKey = `spotify:search:tracks:${query}:${page}:${limit}`;
  const cached = await getFromCache<SearchResult<SpotifyTrack>>(cacheKey);
  if (cached) return cached;

  const token = await getSpotifyToken(userId);
  if (!token) {
    throw new Error('Unable to authenticate with Spotify');
  }

  const offset = (page - 1) * limit;

  try {
    const response = await fetch(
      `${SPOTIFY_API_URL}/search?` +
        new URLSearchParams({
          q: query,
          type: 'track',
          limit: limit.toString(),
          offset: offset.toString(),
          market: 'US',
        }),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Spotify search error:', error);
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json() as { tracks: SpotifySearchResponse<SpotifyTrack> };

    const result: SearchResult<SpotifyTrack> = {
      items: data.tracks.items,
      total: data.tracks.total,
      page,
      limit,
      hasMore: data.tracks.next !== null,
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw error;
  }
}

/**
 * Search for albums on Spotify
 */
export async function searchAlbums(
  query: string,
  page: number = 1,
  limit: number = 10,
  userId?: string
): Promise<SearchResult<SpotifyAlbum>> {
  const cacheKey = `spotify:search:albums:${query}:${page}:${limit}`;
  const cached = await getFromCache<SearchResult<SpotifyAlbum>>(cacheKey);
  if (cached) return cached;

  const token = await getSpotifyToken(userId);
  if (!token) {
    throw new Error('Unable to authenticate with Spotify');
  }

  const offset = (page - 1) * limit;

  try {
    const response = await fetch(
      `${SPOTIFY_API_URL}/search?` +
        new URLSearchParams({
          q: query,
          type: 'album',
          limit: limit.toString(),
          offset: offset.toString(),
          market: 'US',
        }),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Spotify search error:', error);
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json() as { albums: SpotifySearchResponse<SpotifyAlbum> };

    const result: SearchResult<SpotifyAlbum> = {
      items: data.albums.items,
      total: data.albums.total,
      page,
      limit,
      hasMore: data.albums.next !== null,
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch (error) {
    console.error('Error searching albums:', error);
    throw error;
  }
}


/**
 * Search for artists on Spotify
 */
export async function searchArtists(
  query: string,
  page: number = 1,
  limit: number = 10,
  userId?: string
): Promise<SearchResult<SpotifyArtist>> {
  const cacheKey = `spotify:search:artists:${query}:${page}:${limit}`;
  const cached = await getFromCache<SearchResult<SpotifyArtist>>(cacheKey);
  if (cached) return cached;

  const token = await getSpotifyToken(userId);
  if (!token) {
    throw new Error('Unable to authenticate with Spotify');
  }

  const offset = (page - 1) * limit;

  try {
    const response = await fetch(
      `${SPOTIFY_API_URL}/search?` +
        new URLSearchParams({
          q: query,
          type: 'artist',
          limit: limit.toString(),
          offset: offset.toString(),
          market: 'US',
        }),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Spotify artist search error:', error);
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json() as { artists: SpotifySearchResponse<SpotifyArtist> };

    const result: SearchResult<SpotifyArtist> = {
      items: data.artists.items,
      total: data.artists.total,
      page,
      limit,
      hasMore: data.artists.next !== null,
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch (error) {
    console.error('Error searching artists:', error);
    throw error;
  }
}

/**
 * Get tracks from an album
 */
export async function getAlbumTracks(
  albumId: string,
  userId?: string
): Promise<SpotifyTrack[]> {
  const cacheKey = `spotify:album:tracks:${albumId}`;
  const cached = await getFromCache<SpotifyTrack[]>(cacheKey);
  if (cached) return cached;

  const token = await getSpotifyToken(userId);
  if (!token) {
    throw new Error('Unable to authenticate with Spotify');
  }

  try {
    // First get album details for the album info
    const albumResponse = await fetch(`${SPOTIFY_API_URL}/albums/${albumId}?market=US`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!albumResponse.ok) {
      throw new Error(`Failed to get album: ${albumResponse.status}`);
    }

    const album = await albumResponse.json() as SpotifyAlbum & {
      tracks: SpotifySearchResponse<{
        id: string;
        name: string;
        duration_ms: number;
        track_number: number;
        artists: Array<{ id: string; name: string }>;
        external_urls: { spotify: string };
        preview_url: string | null;
      }>;
    };

    // Map track data to include album info
    const tracks: SpotifyTrack[] = album.tracks.items.map((track) => ({
      id: track.id,
      name: track.name,
      duration_ms: track.duration_ms,
      track_number: track.track_number,
      artists: track.artists,
      album: {
        id: album.id,
        name: album.name,
        images: album.images,
        release_date: album.release_date,
      },
      external_urls: track.external_urls,
      preview_url: track.preview_url,
    } as SpotifyTrack));

    await setCache(cacheKey, tracks, CACHE_TTL);
    return tracks;
  } catch (error) {
    console.error('Error getting album tracks:', error);
    throw error;
  }
}

/**
 * Get a single track by ID
 */
export async function getTrack(trackId: string, userId?: string): Promise<SpotifyTrack | null> {
  const cacheKey = `spotify:track:${trackId}`;
  const cached = await getFromCache<SpotifyTrack>(cacheKey);
  if (cached) return cached;

  const token = await getSpotifyToken(userId);
  if (!token) return null;

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/tracks/${trackId}?market=US`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const track = await response.json() as SpotifyTrack;
    await setCache(cacheKey, track, CACHE_TTL);
    return track;
  } catch (error) {
    console.error('Error getting track:', error);
    return null;
  }
}

/**
 * Get a single album by ID
 */
export async function getAlbum(albumId: string, userId?: string): Promise<SpotifyAlbum | null> {
  const cacheKey = `spotify:album:${albumId}`;
  const cached = await getFromCache<SpotifyAlbum>(cacheKey);
  if (cached) return cached;

  const token = await getSpotifyToken(userId);
  if (!token) return null;

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/albums/${albumId}?market=US`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const album = await response.json() as SpotifyAlbum;
    await setCache(cacheKey, album, CACHE_TTL);
    return album;
  } catch (error) {
    console.error('Error getting album:', error);
    return null;
  }
}


/**
 * Get a single artist by ID
 */
export async function getArtist(artistId: string, userId?: string): Promise<SpotifyArtist | null> {
  const cacheKey = `spotify:artist:${artistId}`;
  const cached = await getFromCache<SpotifyArtist>(cacheKey);
  if (cached) return cached;

  const token = await getSpotifyToken(userId);
  if (!token) return null;

  try {
    const response = await fetch(`${SPOTIFY_API_URL}/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const artist = await response.json() as SpotifyArtist;
    await setCache(cacheKey, artist, CACHE_TTL);
    return artist;
  } catch (error) {
    console.error('Error getting artist:', error);
    return null;
  }
}


/**
 * Get new album releases from Spotify
 */
export async function getNewReleases(
  limit: number = 20,
  offset: number = 0,
  country: string = 'US'
): Promise<SearchResult<SpotifyAlbum>> {
  const cacheKey = `spotify:new-releases:${country}:${limit}:${offset}`;
  const cached = await getFromCache<SearchResult<SpotifyAlbum>>(cacheKey);
  if (cached) return cached;

  const token = await getSpotifyToken();
  if (!token) {
    throw new Error('Unable to authenticate with Spotify');
  }

  try {
    const response = await fetch(
      `${SPOTIFY_API_URL}/browse/new-releases?` +
        new URLSearchParams({
          country,
          limit: limit.toString(),
          offset: offset.toString(),
        }),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Spotify new releases error:', error);
      throw new Error(`Spotify API error: ${response.status}`);
    }

    const data = await response.json() as { albums: SpotifySearchResponse<SpotifyAlbum> };

    const result: SearchResult<SpotifyAlbum> = {
      items: data.albums.items,
      total: data.albums.total,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: data.albums.next !== null,
    };

    await setCache(cacheKey, result, CACHE_TTL);
    return result;
  } catch (error) {
    console.error('Error fetching new releases:', error);
    throw error;
  }
}


// Types for recently played
interface SpotifyPlayHistoryItem {
  track: SpotifyTrack;
  played_at: string;
  context: {
    type: string;
    href: string;
    uri: string;
  } | null;
}

interface SpotifyRecentlyPlayedResponse {
  items: SpotifyPlayHistoryItem[];
  next: string | null;
  cursors: {
    after: string;
    before: string;
  };
  limit: number;
}

/**
 * Get recently played albums from user's Spotify history
 * Deduplicates albums from recently played tracks
 */
export async function getRecentlyPlayedAlbums(
  userId: string,
  limit: number = 20
): Promise<SpotifyAlbum[]> {
  const RECENTLY_PLAYED_CACHE_TTL = 60; // 1 minute - changes frequently
  const cacheKey = `spotify:recently-played:${userId}:${limit}`;
  
  const cached = await getFromCache<SpotifyAlbum[]>(cacheKey);
  if (cached) return cached;

  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    console.error('Unable to get valid access token for user:', userId);
    return [];
  }

  try {
    // Fetch more tracks to ensure we get enough unique albums after deduplication
    const response = await fetch(
      `${SPOTIFY_API_URL}/me/player/recently-played?` +
        new URLSearchParams({
          limit: '50', // Max allowed by Spotify API
        }),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Spotify recently played error:', error);
      return [];
    }

    const data = await response.json() as SpotifyRecentlyPlayedResponse;

    // Deduplicate albums - keep first occurrence (most recently played)
    const seenAlbumIds = new Set<string>();
    const uniqueAlbums: SpotifyAlbum[] = [];

    for (const item of data.items) {
      const trackAlbum = item.track.album;
      if (!seenAlbumIds.has(trackAlbum.id)) {
        seenAlbumIds.add(trackAlbum.id);
        // Map track.album to full SpotifyAlbum format
        uniqueAlbums.push({
          id: trackAlbum.id,
          name: trackAlbum.name,
          album_type: 'album', // Default, not provided in track.album
          total_tracks: 0, // Not provided in track.album
          release_date: trackAlbum.release_date,
          artists: item.track.artists,
          images: trackAlbum.images,
          external_urls: { spotify: `https://open.spotify.com/album/${trackAlbum.id}` },
        });
        
        if (uniqueAlbums.length >= limit) break;
      }
    }

    await setCache(cacheKey, uniqueAlbums, RECENTLY_PLAYED_CACHE_TTL);
    return uniqueAlbums;
  } catch (error) {
    console.error('Error fetching recently played:', error);
    return [];
  }
}
