import { prisma } from '../utils/prisma.js';
import type { UpdateUserInput, PaginationInput } from '../schemas/user.schema.js';

export class UserService {
  async getUserByUsername(username: string, currentUserId?: string) {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isArtist: true,
        artistName: true,
        streamingLinks: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Check if current user follows this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      ...user,
      isFollowing,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      postsCount: user._count.posts,
    };
  }

  async updateUser(userId: string, input: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName,
        bio: input.bio,
        avatarUrl: input.avatarUrl,
        isArtist: input.isArtist,
        artistName: input.artistName,
        streamingLinks: input.streamingLinks,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isArtist: true,
        artistName: true,
        streamingLinks: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new Error('Already following this user');
    }

    // Create follow and notification in a transaction
    await prisma.$transaction([
      prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      }),
      prisma.notification.create({
        data: {
          userId: followingId,
          type: 'follow',
          actorId: followerId,
          targetType: 'user',
          targetId: followingId,
        },
      }),
    ]);

    return { success: true };
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!follow) {
      throw new Error('Not following this user');
    }

    await prisma.follow.delete({
      where: { id: follow.id },
    });

    return { success: true };
  }

  async getFollowers(userId: string, pagination: PaginationInput) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isArtist: true,
              bio: true,
            },
          },
        },
      }),
      prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    return {
      data: followers.map((f) => f.follower),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(userId: string, pagination: PaginationInput) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isArtist: true,
              bio: true,
            },
          },
        },
      }),
      prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      data: following.map((f) => f.following),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserPosts(username: string, pagination: PaginationInput) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: user.id },
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
            },
          },
        },
      }),
      prisma.post.count({
        where: { authorId: user.id },
      }),
    ]);

    // Transform posts to flatten communities
    const transformedPosts = posts.map((post) => ({
      ...post,
      communities: post.communities.map((pc) => pc.community),
    }));

    return {
      data: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserReviews(username: string, pagination: PaginationInput) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { authorId: user.id },
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
        where: { authorId: user.id },
      }),
    ]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const userService = new UserService();
