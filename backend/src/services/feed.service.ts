import { prisma } from '../utils/prisma.js';
import type { PostQueryInput } from '../schemas/post.schema.js';

export class FeedService {
  /**
   * Feed Algorithm (PRD Section 6.5):
   * Priority 1: Posts from people you follow (chronological)
   * Priority 2: Posts from people your follows follow (ranked by engagement)
   * Priority 3: Posts from communities you've joined (ranked by engagement)
   * Priority 4: Trending in your taste profile (cold start / exploration)
   */
  async getFeed(userId: string, query: PostQueryInput) {
    const { page, limit, filter, sort } = query;
    const skip = (page - 1) * limit;

    // Get following IDs
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // Get community IDs
    const memberships = await prisma.communityMembership.findMany({
      where: { userId },
      select: { communityId: true },
    });
    const communityIds = memberships.map((m) => m.communityId);

    let whereClause: any = {};

    if (filter === 'following') {
      // Only posts from followed users
      whereClause = {
        authorId: { in: followingIds },
      };
    } else if (filter === 'communities') {
      // Only posts from joined communities
      whereClause = {
        communities: {
          some: {
            communityId: { in: communityIds },
          },
        },
      };
    } else {
      // All feed - combined from following and communities
      whereClause = {
        OR: [
          { authorId: { in: followingIds } },
          {
            communities: {
              some: {
                communityId: { in: communityIds },
              },
            },
          },
        ],
      };

      // If user has no follows or communities, show trending/discovery
      if (followingIds.length === 0 && communityIds.length === 0) {
        whereClause = {}; // Show all posts for cold start
      }
    }

    const orderBy: any =
      sort === 'top'
        ? [{ upvoteCount: 'desc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isArtist: true,
            },
          },
          communities: {
            include: {
              community: {
                select: {
                  id: true,
                  slug: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              upvotes: true,
            },
          },
        },
      }),
      prisma.post.count({ where: whereClause }),
    ]);

    // Get upvote status for current user
    const postIds = posts.map((p) => p.id);
    const userUpvotes = await prisma.upvote.findMany({
      where: {
        userId,
        targetType: 'post',
        targetId: { in: postIds },
      },
      select: { targetId: true },
    });
    const upvotedPostIds = new Set(userUpvotes.map((u) => u.targetId));

    const postsWithStatus = posts.map((post) => ({
      ...post,
      hasUpvoted: upvotedPostIds.has(post.id),
    }));

    return {
      data: postsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNewAndUpcomingFeed(query: PostQueryInput) {
    const { page, limit, sort } = query;
    const skip = (page - 1) * limit;

    const orderBy: any =
      sort === 'top'
        ? [{ upvoteCount: 'desc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { isNewAndUpcoming: true },
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isArtist: true,
            },
          },
          _count: {
            select: {
              comments: true,
              upvotes: true,
            },
          },
        },
      }),
      prisma.post.count({ where: { isNewAndUpcoming: true } }),
    ]);

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCommunityFeed(communityId: string, query: PostQueryInput) {
    const { page, limit, sort } = query;
    const skip = (page - 1) * limit;

    const orderBy: any =
      sort === 'top'
        ? [{ upvoteCount: 'desc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          communities: {
            some: { communityId },
          },
        },
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isArtist: true,
            },
          },
          _count: {
            select: {
              comments: true,
              upvotes: true,
            },
          },
        },
      }),
      prisma.post.count({
        where: {
          communities: {
            some: { communityId },
          },
        },
      }),
    ]);

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Activity Feed - Reviews and ratings from followed users
   * Shows chronological activity (reviews/ratings) from people the user follows
   */
  async getActivityFeed(userId: string, query: { page: number; limit: number }) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    // Get following IDs
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    // If user follows nobody, return empty feed
    if (followingIds.length === 0) {
      return {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    // Fetch reviews from followed users
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          authorId: { in: followingIds },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isArtist: true,
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
          track: {
            select: {
              id: true,
              spotifyId: true,
              title: true,
              artistName: true,
            },
          },
          artist: {
            select: {
              id: true,
              spotifyId: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      }),
      prisma.review.count({
        where: {
          authorId: { in: followingIds },
        },
      }),
    ]);

    // Get upvote status for current user
    const reviewIds = reviews.map((r) => r.id);
    const userUpvotes = await prisma.upvote.findMany({
      where: {
        userId,
        targetType: 'review',
        targetId: { in: reviewIds },
      },
      select: { targetId: true },
    });
    const upvotedReviewIds = new Set(userUpvotes.map((u) => u.targetId));

    const reviewsWithStatus = reviews.map((review) => ({
      ...review,
      hasUpvoted: upvotedReviewIds.has(review.id),
    }));

    return {
      data: reviewsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const feedService = new FeedService();
