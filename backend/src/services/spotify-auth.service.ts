import { prisma } from '../utils/prisma.js';
import type { User } from '@prisma/client';

// Spotify OAuth Configuration
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3001/api/auth/spotify/callback';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// Required scopes for Trackd
const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-library-read',
  'user-read-recently-played',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'streaming', // For Web Playback SDK (Premium only)
  'user-read-playback-state', // Read playback state
  'user-modify-playback-state', // Control playback
  'user-read-currently-playing', // Read currently playing track
].join(' ');

// Types
interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

interface SpotifyUserProfile {
  id: string;
  email: string;
  display_name: string | null;
  images: Array<{ url: string; height: number; width: number }>;
  product: 'free' | 'open' | 'premium';
  country?: string;
}

export interface AuthResult {
  user: Omit<User, 'spotifyAccessToken' | 'spotifyRefreshToken'>;
  token: string;
}

/**
 * Generate Spotify OAuth authorization URL
 */
export function getAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    show_dialog: 'false', // Set to true for re-auth prompts
  });

  if (state) {
    params.append('state', state);
  }

  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeCode(code: string): Promise<SpotifyTokenResponse> {
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json() as Promise<SpotifyTokenResponse>;
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json() as Promise<SpotifyTokenResponse>;
}

/**
 * Get Spotify user profile
 */
export async function getSpotifyProfile(accessToken: string): Promise<SpotifyUserProfile> {
  const response = await fetch(`${SPOTIFY_API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Spotify profile: ${error}`);
  }

  return response.json() as Promise<SpotifyUserProfile>;
}

/**
 * Create or update user from Spotify OAuth
 */
export async function createOrUpdateUser(
  tokens: SpotifyTokenResponse,
  profile: SpotifyUserProfile
): Promise<User> {
  const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
  const isPremium = profile.product === 'premium';

  // Generate username from Spotify display name or ID
  const baseUsername = (profile.display_name || profile.id)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .substring(0, 25);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { spotifyId: profile.id },
  });

  if (existingUser) {
    // Update existing user's tokens and profile
    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        spotifyAccessToken: tokens.access_token,
        spotifyRefreshToken: tokens.refresh_token || existingUser.spotifyRefreshToken,
        spotifyTokenExpiry: tokenExpiry,
        spotifyPremium: isPremium,
        // Update avatar if user hasn't set a custom one
        avatarUrl: existingUser.avatarType === 'custom' && existingUser.avatarUrl
          ? existingUser.avatarUrl
          : profile.images?.[0]?.url || existingUser.avatarUrl,
      },
    });
  }

  // Create new user
  // Ensure username is unique
  let username = baseUsername;
  let counter = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return prisma.user.create({
    data: {
      spotifyId: profile.id,
      email: profile.email,
      username,
      displayName: profile.display_name || profile.id,
      avatarUrl: profile.images?.[0]?.url || null,
      spotifyAccessToken: tokens.access_token,
      spotifyRefreshToken: tokens.refresh_token,
      spotifyTokenExpiry: tokenExpiry,
      spotifyPremium: isPremium,
    },
  });
}

/**
 * Get user by Spotify ID
 */
export async function getUserBySpotifyId(spotifyId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { spotifyId },
  });
}

/**
 * Get user by ID with token validation
 * Refreshes token if expired
 */
export async function getUserWithValidToken(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  // Check if token is expired (with 5 min buffer)
  const isExpired = user.spotifyTokenExpiry.getTime() < Date.now() + 5 * 60 * 1000;

  if (isExpired) {
    try {
      const newTokens = await refreshAccessToken(user.spotifyRefreshToken);
      const tokenExpiry = new Date(Date.now() + newTokens.expires_in * 1000);

      return prisma.user.update({
        where: { id: userId },
        data: {
          spotifyAccessToken: newTokens.access_token,
          spotifyRefreshToken: newTokens.refresh_token || user.spotifyRefreshToken,
          spotifyTokenExpiry: tokenExpiry,
        },
      });
    } catch (error) {
      console.error('Failed to refresh Spotify token:', error);
      return null; // Token refresh failed, user needs to re-auth
    }
  }

  return user;
}

/**
 * Get user's valid Spotify access token
 * Returns null if token refresh fails
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await getUserWithValidToken(userId);
  return user?.spotifyAccessToken || null;
}

// Types for Spotify playlists
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  public: boolean;
  collaborative: boolean;
  images: Array<{ url: string; height: number | null; width: number | null }>;
  tracks: {
    total: number;
    href: string;
  };
  owner: {
    id: string;
    display_name: string | null;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylistsResponse {
  items: SpotifyPlaylist[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

/**
 * Get user's Spotify playlists
 */
export async function getUserSpotifyPlaylists(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<SpotifyPlaylistsResponse | null> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) {
    return null;
  }

  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`${SPOTIFY_API_URL}/me/playlists?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to get user playlists:', error);
    return null;
  }

  return response.json() as Promise<SpotifyPlaylistsResponse>;
}
