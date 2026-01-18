import { prisma } from '../utils/prisma.js';
import { redis } from '../utils/redis.js';
import * as reviewService from './review.service.js';
import * as albumService from './album.service.js';
import * as spotifySearchService from './spotify-search.service.js';

// Cache TTLs
const CACHE_TTL = {
  NEW_RELEASES: 300, // 5 minutes
  POPULAR_REVIEWS: 300, // 5 minutes
  RECENTLY_LOGGED: 60, // 1 minute
  COMMUNITY_ACTIVITY: 60, // 1 minute
};

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

interface HomepageData {
  newReleases: Array<{
    id: string;
    spotifyId: string | null;
    title: string;
    artistName: string;
    coverImageUrl: string | null;
    releaseDate: string | null;
  }>;
  recentlyLogged: Array<{
    id: string;
    spotifyId: string | null;
    title: string;
    artistName: string;
    coverImageUrl: string | null;
    releaseYear: number | null;
    averageRating: number | null;
  }>;
  popularReviews: Awaited<ReturnType<typeof reviewService.getPopularReviews>>;
  communityActivity: Array<{
    id: string;
    type: 'post';
    user: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    };
    content: string;
    linkUrl: string | null;
    linkType: string | null;
    linkMetadata: unknown;
    community: {
      id: string;
      slug: string;
      name: string;
    } | null;
    createdAt: Date;
  }>;
}

/**
 * Get all homepage data in one call
 */
export async function getHomepageData(userId?: string): Promise<HomepageData> {
  const [newReleases, recentlyLogged, popularReviews, communityActivity] =
    await Promise.all([
      getNewReleases(8),
      // Use recently played from Spotify if user is logged in, otherwise fall back to community logged
      userId
        ? getRecentlyPlayedAlbums(userId, 8).then((albums) =>
            albums.length > 0 ? albums : getRecentlyLoggedAlbums(8)
          )
        : getRecentlyLoggedAlbums(8),
      getPopularReviews('week', 5),
      userId ? getCommunityActivity(userId, 5) : Promise.resolve([]),
    ]);

  return {
    newReleases,
    recentlyLogged,
    popularReviews,
    communityActivity,
  };
}

/**
 * Get new music releases from Spotify's new releases API
 * Falls back to database albums if Spotify API fails
 */
export async function getNewReleases(limit: number = 20): Promise<HomepageData['newReleases']> {
  const cacheKey = `discover:new-releases:${limit}`;

  // Check cache
  const cached = await getFromCache<HomepageData['newReleases']>(cacheKey);
  if (cached && cached.length > 0) return cached;

  try {
    // Fetch new releases from Spotify API
    const spotifyReleases = await spotifySearchService.getNewReleases(limit, 0, 'US');

    const releases = spotifyReleases.items.map((album) => ({
      id: album.id, // Use Spotify ID as the id
      spotifyId: album.id,
      title: album.name,
      artistName: album.artists.map((a) => a.name).join(', '),
      coverImageUrl: album.images[0]?.url || null,
      releaseDate: album.release_date,
    }));

    if (releases.length > 0) {
      await setCache(cacheKey, releases, CACHE_TTL.NEW_RELEASES);
    }
    return releases;
  } catch (error) {
    console.error('Error fetching new releases from Spotify:', error);
    // Fallback to database if Spotify fails
    try {
      const albums = await prisma.album.findMany({
        where: {
          releaseDate: { not: null },
        },
        orderBy: { releaseDate: 'desc' },
        take: limit,
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverImageUrl: true,
          releaseDate: true,
        },
      });

      return albums.map((album) => ({
        id: album.id,
        spotifyId: album.spotifyId,
        title: album.title,
        artistName: album.artistName,
        coverImageUrl: album.coverImageUrl,
        releaseDate: album.releaseDate?.toISOString() || null,
      }));
    } catch (dbError) {
      console.error('Error fetching new releases from database:', dbError);
      return [];
    }
  }
}

/**
 * Get recently logged albums from the platform
 */
export async function getRecentlyLoggedAlbums(limit: number = 20): Promise<HomepageData['recentlyLogged']> {
  const cacheKey = `discover:recently-logged:${limit}`;

  // Check cache
  const cached = await getFromCache<HomepageData['recentlyLogged']>(cacheKey);
  if (cached) return cached;

  const albums = await albumService.getRecentlyLoggedAlbums(limit);

  const result = albums.map((album) => ({
    id: album.id,
    spotifyId: album.spotifyId,
    title: album.title,
    artistName: album.artistName,
    coverImageUrl: album.coverImageUrl,
    releaseYear: album.releaseYear,
    averageRating:
      album.ratingCount > 0 ? album.ratingSum / album.ratingCount : null,
  }));

  await setCache(cacheKey, result, CACHE_TTL.RECENTLY_LOGGED);
  return result;
}


/**
 * Get recently played albums from user's Spotify history
 * Transforms Spotify albums to the discover format
 */
export async function getRecentlyPlayedAlbums(
  userId: string,
  limit: number = 20
): Promise<HomepageData['recentlyLogged']> {
  const cacheKey = `discover:recently-played:${userId}:${limit}`;

  // Check cache
  const cached = await getFromCache<HomepageData['recentlyLogged']>(cacheKey);
  if (cached) return cached;

  try {
    const spotifyAlbums = await spotifySearchService.getRecentlyPlayedAlbums(userId, limit);

    const result = spotifyAlbums.map((album) => ({
      id: album.id,
      spotifyId: album.id,
      title: album.name,
      artistName: album.artists.map((a) => a.name).join(', '),
      coverImageUrl: album.images[0]?.url || null,
      releaseYear: album.release_date
        ? parseInt(album.release_date.split('-')[0], 10)
        : null,
      averageRating: null, // Spotify albums don't have local ratings
    }));

    await setCache(cacheKey, result, CACHE_TTL.RECENTLY_LOGGED);
    return result;
  } catch (error) {
    console.error('Error fetching recently played albums:', error);
    return [];
  }
}

/**
 * Get popular reviews from the past week
 */
export async function getPopularReviews(
  timeframe: 'day' | 'week' | 'month' = 'week',
  limit: number = 10
) {
  const cacheKey = `discover:popular-reviews:${timeframe}:${limit}`;

  // Check cache
  const cached = await getFromCache<Awaited<ReturnType<typeof reviewService.getPopularReviews>>>(
    cacheKey
  );
  if (cached) return cached;

  const reviews = await reviewService.getPopularReviews(timeframe, limit);

  await setCache(cacheKey, reviews, CACHE_TTL.POPULAR_REVIEWS);
  return reviews;
}

/**
 * Get friends' recent logging activity
 */
export async function getFriendsActivity(userId: string, limit: number = 10) {
  // Get user's following list
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  if (following.length === 0) {
    return [];
  }

  const followingIds = following.map((f) => f.followingId);

  // Get recent reviews from friends
  const recentReviews = await prisma.review.findMany({
    where: {
      authorId: { in: followingIds },
      albumId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          avatarType: true,
          pixelAvatarId: true,
        },
      },
      album: {
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverImageUrl: true,
        },
      },
    },
  });

  return recentReviews.map((review) => ({
    id: review.id,
    type: 'review' as const,
    user: review.author,
    album: review.album,
    rating: review.rating,
    content: review.content
      ? review.content.substring(0, 100) + (review.content.length > 100 ? '...' : '')
      : null,
    createdAt: review.createdAt,
  }));
}

/**
 * Get activity from user's joined communities
 */
export async function getCommunityActivity(userId: string, limit: number = 10) {
  // Get user's joined communities
  const memberships = await prisma.communityMembership.findMany({
    where: { userId },
    select: { communityId: true, community: { select: { id: true, slug: true, name: true } } },
  });

  if (memberships.length === 0) {
    return [];
  }

  const communityIds = memberships.map((m) => m.communityId);
  const communityMap = new Map(memberships.map((m) => [m.communityId, m.community]));

  // Get recent posts from these communities that have music links
  const posts = await prisma.post.findMany({
    where: {
      communities: {
        some: { communityId: { in: communityIds } },
      },
      linkUrl: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      communities: {
        include: {
          community: {
            select: { id: true, slug: true, name: true },
          },
        },
      },
    },
  });

  return posts.map((post) => {
    // Find the first community that user is a member of
    const postCommunity = post.communities.find((pc) => communityIds.includes(pc.communityId));

    return {
      id: post.id,
      type: 'post' as const,
      user: post.author,
      content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
      linkUrl: post.linkUrl,
      linkType: post.linkType,
      linkMetadata: post.linkMetadata,
      community: postCommunity?.community || null,
      createdAt: post.createdAt,
    };
  });
}

/**
 * Get trending albums (most activity in the past week)
 */
export async function getTrendingAlbums(limit: number = 20) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get albums with most reviews in the past week
  const albumActivity = await prisma.review.groupBy({
    by: ['albumId'],
    where: {
      albumId: { not: null },
      createdAt: { gte: oneWeekAgo },
    },
    _count: { albumId: true },
    orderBy: { _count: { albumId: 'desc' } },
    take: limit,
  });

  if (albumActivity.length === 0) {
    return [];
  }

  const albumIds = albumActivity
    .filter((a) => a.albumId !== null)
    .map((a) => a.albumId as string);

  const albums = await prisma.album.findMany({
    where: { id: { in: albumIds } },
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

  // Sort by activity count
  const activityMap = new Map(
    albumActivity.map((a) => [a.albumId, a._count.albumId])
  );

  return albums.sort(
    (a, b) => (activityMap.get(b.id) || 0) - (activityMap.get(a.id) || 0)
  );
}

/**
 * Get popular tags
 */
export async function getPopularTags(limit: number = 20) {
  return prisma.tag.findMany({
    where: {
      useCount: { gt: 0 },
    },
    orderBy: { useCount: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      useCount: true,
    },
  });
}

/**
 * Get tags by category
 */
export async function getTagsByCategory(category: 'genre' | 'mood' | 'era' | 'custom') {
  return prisma.tag.findMany({
    where: { category },
    orderBy: [{ isOfficial: 'desc' }, { useCount: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      isOfficial: true,
      useCount: true,
    },
  });
}
