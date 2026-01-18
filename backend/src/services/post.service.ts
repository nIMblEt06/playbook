import { prisma } from '../utils/prisma.js';
import { redis } from '../utils/redis.js';
import type { CreatePostInput, PostQueryInput } from '../schemas/post.schema.js';
import * as linkParserService from './link-parser.service.js';

const NEW_AND_UPCOMING_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class PostService {
  async createPost(authorId: string, input: CreatePostInput) {
    const { content, linkUrl, linkType, tags, communityIds, isNewAndUpcoming } = input;

    // Check #NewAndUpcoming rate limit (1 per week)
    if (isNewAndUpcoming) {
      const lastNewAndUpcomingPost = await prisma.post.findFirst({
        where: {
          authorId,
          isNewAndUpcoming: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastNewAndUpcomingPost) {
        const timeSinceLast = Date.now() - lastNewAndUpcomingPost.createdAt.getTime();
        if (timeSinceLast < NEW_AND_UPCOMING_COOLDOWN_MS) {
          const daysRemaining = Math.ceil((NEW_AND_UPCOMING_COOLDOWN_MS - timeSinceLast) / (24 * 60 * 60 * 1000));
          throw new Error(`You can only post with #NewAndUpcoming once per week. ${daysRemaining} days remaining.`);
        }
      }
    }

    // Validate communities exist and user is a member
    if (communityIds.length > 0) {
      const communities = await prisma.community.findMany({
        where: { id: { in: communityIds } },
      });

      if (communities.length !== communityIds.length) {
        throw new Error('One or more communities not found');
      }

      // Verify user is a member of all communities
      const memberships = await prisma.communityMembership.findMany({
        where: {
          userId: authorId,
          communityId: { in: communityIds },
        },
      });

      if (memberships.length !== communityIds.length) {
        throw new Error('You must be a member of all communities to post');
      }
    }

    // Fetch link metadata if URL is provided
    let linkMetadata = null;
    if (linkUrl) {
      try {
        const metadata = await linkParserService.fetchLinkMetadata(linkUrl);
        if (metadata) {
          linkMetadata = {
            title: metadata.title,
            artist: metadata.artist,
            albumName: metadata.albumName,
            imageUrl: metadata.coverArtUrl,
            platform: metadata.source,
          };
        }
      } catch (error) {
        console.warn('Failed to fetch link metadata:', error);
        // Continue without metadata
      }
    }

    // Create post with community associations
    const post = await prisma.post.create({
      data: {
        authorId,
        content,
        linkUrl,
        linkType,
        linkMetadata: linkMetadata ? JSON.parse(JSON.stringify(linkMetadata)) : undefined,
        tags,
        isNewAndUpcoming: isNewAndUpcoming ?? false,
        communities: {
          create: communityIds.map((communityId) => ({
            communityId,
          })),
        },
      },
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
      },
    });

    return post;
  }

  async getPostById(postId: string, currentUserId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
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
    });

    if (!post) {
      return null;
    }

    // Check if current user has upvoted
    let hasUpvoted = false;
    let hasSaved = false;

    if (currentUserId) {
      const [upvote, savedPost] = await Promise.all([
        prisma.upvote.findUnique({
          where: {
            userId_targetType_targetId: {
              userId: currentUserId,
              targetType: 'post',
              targetId: postId,
            },
          },
        }),
        prisma.savedPost.findUnique({
          where: {
            userId_postId: {
              userId: currentUserId,
              postId,
            },
          },
        }),
      ]);

      hasUpvoted = !!upvote;
      hasSaved = !!savedPost;
    }

    return {
      ...post,
      hasUpvoted,
      hasSaved,
    };
  }

  async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    if (post.authorId !== userId) {
      throw new Error('Not authorized to delete this post');
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return { success: true };
  }

  async upvotePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Check if already upvoted
    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'post',
          targetId: postId,
        },
      },
    });

    if (existingUpvote) {
      throw new Error('Already upvoted this post');
    }

    // Create upvote and update count in transaction
    await prisma.$transaction([
      prisma.upvote.create({
        data: {
          userId,
          targetType: 'post',
          targetId: postId,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { upvoteCount: { increment: 1 } },
      }),
      // Create notification if not own post
      ...(post.authorId !== userId
        ? [
            prisma.notification.create({
              data: {
                userId: post.authorId,
                type: 'upvote_post',
                actorId: userId,
                targetType: 'post',
                targetId: postId,
              },
            }),
          ]
        : []),
    ]);

    return { success: true };
  }

  async removeUpvote(postId: string, userId: string) {
    const upvote = await prisma.upvote.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'post',
          targetId: postId,
        },
      },
    });

    if (!upvote) {
      throw new Error('Not upvoted this post');
    }

    await prisma.$transaction([
      prisma.upvote.delete({
        where: { id: upvote.id },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { upvoteCount: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }

  async savePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const existingSave = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingSave) {
      throw new Error('Post already saved');
    }

    await prisma.savedPost.create({
      data: {
        userId,
        postId,
      },
    });

    return { success: true };
  }

  async unsavePost(postId: string, userId: string) {
    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!savedPost) {
      throw new Error('Post not saved');
    }

    await prisma.savedPost.delete({
      where: { id: savedPost.id },
    });

    return { success: true };
  }


  async getSavedPosts(userId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [savedPosts, total] = await Promise.all([
      prisma.savedPost.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { savedAt: 'desc' },
        include: {
          post: {
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
          },
        },
      }),
      prisma.savedPost.count({ where: { userId } }),
    ]);

    // Get upvote status for current user
    const postIds = savedPosts.map((sp) => sp.post.id);
    const userUpvotes = await prisma.upvote.findMany({
      where: {
        userId,
        targetType: 'post',
        targetId: { in: postIds },
      },
      select: { targetId: true },
    });
    const upvotedPostIds = new Set(userUpvotes.map((u) => u.targetId));

    const postsWithStatus = savedPosts.map((sp) => ({
      ...sp.post,
      hasUpvoted: upvotedPostIds.has(sp.post.id),
      hasSaved: true, // All saved posts are saved by definition
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
}

export const postService = new PostService();
