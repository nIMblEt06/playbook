import { prisma } from '../utils/prisma.js';
import type { Album, Prisma } from '@prisma/client';
import * as spotifySearchService from './spotify-search.service.js';

export interface AlbumWithStats extends Album {
  averageRating: number | null;
  ratingDistribution: Record<number, number>;
  userRating?: number | null;
  userReview?: { id: string; rating: number | null; content: string | null } | null;
  artistSpotifyId?: string | null;
}

/**
 * Get or create an album by Spotify ID
 */
export async function getOrCreateAlbum(spotifyId: string): Promise<Album | null> {
  // Check if album exists locally
  let album = await prisma.album.findUnique({
    where: { spotifyId },
  });

  // If not found locally, fetch from Spotify and create
  if (!album) {
    try {
      const spotifyAlbum = await spotifySearchService.getAlbum(spotifyId);
      if (spotifyAlbum) {
        // Parse release date
        let releaseDate: Date | null = null;
        let releaseYear: number | null = null;
        if (spotifyAlbum.release_date) {
          // release_date can be YYYY, YYYY-MM, or YYYY-MM-DD
          const parts = spotifyAlbum.release_date.split('-');
          releaseYear = parseInt(parts[0], 10);
          if (parts.length === 3) {
            releaseDate = new Date(spotifyAlbum.release_date);
          } else if (parts.length === 2) {
            releaseDate = new Date(`${spotifyAlbum.release_date}-01`);
          } else {
            releaseDate = new Date(`${spotifyAlbum.release_date}-01-01`);
          }
        }

        album = await createAlbumFromSpotify({
          spotifyId: spotifyAlbum.id,
          title: spotifyAlbum.name,
          artistName: spotifyAlbum.artists.map(a => a.name).join(', '),
          coverImageUrl: spotifyAlbum.images[0]?.url || null,
          releaseDate,
          releaseYear,
          trackCount: spotifyAlbum.total_tracks,
          albumType: spotifyAlbum.album_type,
          spotifyUrl: spotifyAlbum.external_urls.spotify,
        });
      }
    } catch (error) {
      console.error('Error fetching album from Spotify:', error);
      return null;
    }
  }

  return album;
}

/**
 * Create album from Spotify data
 */
export async function createAlbumFromSpotify(data: {
  spotifyId: string;
  title: string;
  artistName: string;
  coverImageUrl?: string | null;
  releaseDate?: Date | null;
  releaseYear?: number | null;
  trackCount?: number;
  albumType?: string;
  popularity?: number;
  spotifyUri?: string;
  spotifyUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<Album> {
  return prisma.album.upsert({
    where: { spotifyId: data.spotifyId },
    create: {
      spotifyId: data.spotifyId,
      title: data.title,
      artistName: data.artistName,
      coverImageUrl: data.coverImageUrl,
      releaseDate: data.releaseDate,
      releaseYear: data.releaseYear,
      trackCount: data.trackCount || 0,
      albumType: data.albumType || 'album',
      popularity: data.popularity,
      spotifyUri: data.spotifyUri,
      spotifyUrl: data.spotifyUrl,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      lastFetchedAt: new Date(),
    },
    update: {
      title: data.title,
      artistName: data.artistName,
      coverImageUrl: data.coverImageUrl || undefined,
      releaseDate: data.releaseDate,
      releaseYear: data.releaseYear,
      trackCount: data.trackCount,
      albumType: data.albumType,
      popularity: data.popularity,
      spotifyUri: data.spotifyUri,
      spotifyUrl: data.spotifyUrl,
      metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
      lastFetchedAt: new Date(),
    },
  });
}

/**
 * Get album by internal ID
 */
export async function getAlbumById(id: string): Promise<Album | null> {
  return prisma.album.findUnique({
    where: { id },
    include: {
      artist: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

/**
 * Get album by Spotify ID with stats
 */
export async function getAlbumBySpotifyId(
  spotifyId: string,
  userId?: string
): Promise<AlbumWithStats | null> {
  // Get the album
  const album = await getOrCreateAlbum(spotifyId);
  if (!album) return null;

  // Get rating distribution from standalone ratings
  const ratingCounts = await prisma.rating.groupBy({
    by: ['value'],
    where: { albumId: album.id },
    _count: { value: true },
  });

  // Get rating distribution from reviews
  const reviewRatingCounts = await prisma.review.groupBy({
    by: ['rating'],
    where: { 
      albumId: album.id,
      rating: { not: null },
    },
    _count: { rating: true },
  });

  // Combine both sources into rating distribution
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const { value, _count } of ratingCounts) {
    ratingDistribution[value] = _count.value;
  }
  for (const item of reviewRatingCounts) {
    if (item.rating !== null) {
      ratingDistribution[item.rating] = (ratingDistribution[item.rating] || 0) + item._count.rating;
    }
  }

  // Calculate average rating from combined counts
  let totalSum = 0;
  let totalCount = 0;
  for (const [rating, count] of Object.entries(ratingDistribution)) {
    totalSum += parseInt(rating) * count;
    totalCount += count;
  }
  const averageRating = totalCount > 0 ? totalSum / totalCount : null;

  // Get user's rating if logged in
  // Note: A user can only have ONE rating per album - either via a review OR a standalone rating
  let userRating: number | null = null;
  let userReview: { id: string; rating: number | null; content: string | null } | null = null;

  if (userId) {
    // First check if user has a review (review rating takes precedence)
    const review = await prisma.review.findUnique({
      where: {
        authorId_albumId: {
          authorId: userId,
          albumId: album.id,
        },
      },
      select: {
        id: true,
        rating: true,
        content: true,
      },
    });
    userReview = review;

    if (review?.rating !== null && review?.rating !== undefined) {
      // User has a review with a rating - use that
      userRating = review.rating;
    } else {
      // No review rating - check for standalone rating
      const rating = await prisma.rating.findUnique({
        where: {
          userId_albumId: {
            userId,
            albumId: album.id,
          },
        },
      });
      userRating = rating?.value ?? null;
    }
  }

  // Get artist Spotify ID if linked
  let artistSpotifyId: string | null = null;
  if (album.artistId) {
    const artist = await prisma.artist.findUnique({
      where: { id: album.artistId },
      select: { spotifyId: true },
    });
    artistSpotifyId = artist?.spotifyId || null;
  }

  return {
    ...album,
    averageRating,
    ratingCount: totalCount, // Override with calculated count (includes both standalone ratings and review ratings)
    ratingDistribution,
    userRating,
    userReview,
    artistSpotifyId,
  };
}

/**
 * Get album tracks
 */
export async function getAlbumTracks(albumId: string) {
  return prisma.track.findMany({
    where: { albumId },
    orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }],
  });
}

/**
 * Search albums locally (for autocomplete)
 */
export async function searchAlbumsLocal(query: string, limit: number = 10) {
  return prisma.album.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { artistName: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { reviewCount: 'desc' },
    take: limit,
  });
}

/**
 * Get recently logged albums (albums with recent reviews)
 */
export async function getRecentlyLoggedAlbums(limit: number = 20) {
  // Get albums that have recent reviews
  const recentReviews = await prisma.review.findMany({
    where: {
      albumId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: limit * 2, // Get more to deduplicate
    select: {
      albumId: true,
      album: {
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverImageUrl: true,
          releaseYear: true,
          ratingSum: true,
          ratingCount: true,
        },
      },
    },
    distinct: ['albumId'],
  });

  // Filter out nulls and deduplicate
  const uniqueAlbums = new Map();
  for (const review of recentReviews) {
    if (review.album && !uniqueAlbums.has(review.album.id)) {
      uniqueAlbums.set(review.album.id, review.album);
    }
    if (uniqueAlbums.size >= limit) break;
  }

  return Array.from(uniqueAlbums.values());
}

/**
 * Get popular albums (most reviewed/rated)
 */
export async function getPopularAlbums(limit: number = 20) {
  return prisma.album.findMany({
    where: {
      reviewCount: { gt: 0 },
    },
    orderBy: [{ reviewCount: 'desc' }, { ratingCount: 'desc' }],
    take: limit,
    select: {
      id: true,
      spotifyId: true,
      title: true,
      artistName: true,
      coverImageUrl: true,
      releaseYear: true,
      reviewCount: true,
      ratingSum: true,
      ratingCount: true,
    },
  });
}

/**
 * Update album rating stats (called when a rating is added/updated/removed)
 */
export async function updateAlbumRatingStats(albumId: string) {
  // Get stats from standalone ratings
  const ratingStats = await prisma.rating.aggregate({
    where: { albumId },
    _sum: { value: true },
    _count: { value: true },
  });

  // Get stats from reviews that have ratings
  const reviewStats = await prisma.review.aggregate({
    where: { 
      albumId,
      rating: { not: null },
    },
    _sum: { rating: true },
    _count: { rating: true },
  });

  // Combine both sources
  const totalSum = (ratingStats._sum.value || 0) + (reviewStats._sum.rating || 0);
  const totalCount = (ratingStats._count.value || 0) + (reviewStats._count.rating || 0);

  await prisma.album.update({
    where: { id: albumId },
    data: {
      ratingSum: totalSum,
      ratingCount: totalCount,
    },
  });
}

/**
 * Update album review count
 */
export async function updateAlbumReviewCount(albumId: string) {
  const count = await prisma.review.count({
    where: { albumId },
  });

  await prisma.album.update({
    where: { id: albumId },
    data: { reviewCount: count },
  });
}

/**
 * Get albums by tag
 */
export async function getAlbumsByTag(tagSlug: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;

  const tag = await prisma.tag.findUnique({
    where: { slug: tagSlug },
  });

  if (!tag) {
    return { items: [], total: 0, page, limit };
  }

  const [items, total] = await Promise.all([
    prisma.album.findMany({
      where: {
        tags: {
          some: { tagId: tag.id },
        },
      },
      orderBy: { reviewCount: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.album.count({
      where: {
        tags: {
          some: { tagId: tag.id },
        },
      },
    }),
  ]);

  return { items, total, page, limit };
}
