import { prisma } from '../utils/prisma.js';
import type { Artist, Prisma } from '@prisma/client';
import * as spotifySearchService from './spotify-search.service.js';

export interface ArtistWithStats extends Artist {
  averageRating: number | null;
  albumCount: number;
}

/**
 * Get or create an artist by Spotify ID
 */
export async function getOrCreateArtist(spotifyId: string): Promise<Artist | null> {
  // Check if artist exists locally
  let artist = await prisma.artist.findUnique({
    where: { spotifyId },
  });

  // If not found locally, fetch from Spotify and create
  if (!artist) {
    try {
      const spotifyArtist = await spotifySearchService.getArtist(spotifyId);
      if (spotifyArtist) {
        artist = await createArtistFromSpotify({
          spotifyId: spotifyArtist.id,
          name: spotifyArtist.name,
          imageUrl: spotifyArtist.images[0]?.url || null,
          genres: spotifyArtist.genres || [],
          popularity: spotifyArtist.popularity,
          spotifyUrl: spotifyArtist.external_urls.spotify,
          metadata: {
            followers: spotifyArtist.followers?.total,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching artist from Spotify:', error);
      return null;
    }
  }

  return artist;
}

/**
 * Create artist from Spotify data
 */
export async function createArtistFromSpotify(data: {
  spotifyId: string;
  name: string;
  imageUrl?: string | null;
  genres?: string[];
  popularity?: number;
  spotifyUri?: string;
  spotifyUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<Artist> {
  return prisma.artist.upsert({
    where: { spotifyId: data.spotifyId },
    create: {
      spotifyId: data.spotifyId,
      name: data.name,
      imageUrl: data.imageUrl,
      genres: data.genres || [],
      popularity: data.popularity,
      spotifyUri: data.spotifyUri,
      spotifyUrl: data.spotifyUrl,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      lastFetchedAt: new Date(),
    },
    update: {
      name: data.name,
      imageUrl: data.imageUrl || undefined,
      genres: data.genres,
      popularity: data.popularity,
      spotifyUri: data.spotifyUri,
      spotifyUrl: data.spotifyUrl,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      lastFetchedAt: new Date(),
    },
  });
}

/**
 * Get artist by internal ID
 */
export async function getArtistById(id: string): Promise<Artist | null> {
  return prisma.artist.findUnique({
    where: { id },
  });
}

/**
 * Get artist by Spotify ID with stats
 */
export async function getArtistBySpotifyId(
  spotifyId: string
): Promise<ArtistWithStats | null> {
  // Get the artist
  const artist = await getOrCreateArtist(spotifyId);
  if (!artist) return null;

  // Get album count
  const albumCount = await prisma.album.count({
    where: { artistId: artist.id },
  });

  // Calculate average rating from reviews
  let averageRating: number | null = null;
  if (artist.ratingCount > 0) {
    averageRating = artist.ratingSum / artist.ratingCount;
  }

  return {
    ...artist,
    averageRating,
    albumCount,
  };
}

/**
 * Get artist's discography (albums stored locally)
 */
export async function getArtistDiscography(
  artistId: string,
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.album.findMany({
      where: { artistId },
      orderBy: { releaseDate: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        spotifyId: true,
        title: true,
        artistName: true,
        coverImageUrl: true,
        releaseYear: true,
        albumType: true,
        reviewCount: true,
        ratingSum: true,
        ratingCount: true,
      },
    }),
    prisma.album.count({
      where: { artistId },
    }),
  ]);

  return { items, total, page, limit };
}

/**
 * Search artists locally
 */
export async function searchArtistsLocal(query: string, limit: number = 10) {
  return prisma.artist.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
    },
    orderBy: { reviewCount: 'desc' },
    take: limit,
  });
}

/**
 * Get popular artists (most reviewed)
 */
export async function getPopularArtists(limit: number = 20) {
  return prisma.artist.findMany({
    where: {
      reviewCount: { gt: 0 },
    },
    orderBy: { reviewCount: 'desc' },
    take: limit,
    select: {
      id: true,
      spotifyId: true,
      name: true,
      imageUrl: true,
      genres: true,
      popularity: true,
      reviewCount: true,
      ratingSum: true,
      ratingCount: true,
    },
  });
}

/**
 * Update artist rating stats
 */
export async function updateArtistRatingStats(artistId: string) {
  // For artists, we could aggregate from their albums or from direct artist reviews
  // For now, let's use direct artist reviews
  const reviews = await prisma.review.findMany({
    where: { artistId, rating: { not: null } },
    select: { rating: true },
  });

  const ratingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
  const ratingCount = reviews.length;

  await prisma.artist.update({
    where: { id: artistId },
    data: { ratingSum, ratingCount },
  });
}

/**
 * Update artist review count
 */
export async function updateArtistReviewCount(artistId: string) {
  const count = await prisma.review.count({
    where: { artistId },
  });

  await prisma.artist.update({
    where: { id: artistId },
    data: { reviewCount: count },
  });
}

/**
 * Link albums to an artist
 * Called after creating an artist to link existing albums
 */
export async function linkAlbumsToArtist(artistId: string, artistName: string) {
  // Find albums by this artist that aren't linked yet
  const unlinkedAlbums = await prisma.album.findMany({
    where: {
      artistName: { equals: artistName, mode: 'insensitive' },
      artistId: null,
    },
  });

  if (unlinkedAlbums.length > 0) {
    await prisma.album.updateMany({
      where: {
        id: { in: unlinkedAlbums.map((a) => a.id) },
      },
      data: { artistId },
    });
  }

  return unlinkedAlbums.length;
}
