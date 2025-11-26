import { prisma } from '../utils/prisma.js';
import type { CreateCommentInput } from '../schemas/comment.schema.js';
import type { PaginationInput } from '../schemas/user.schema.js';

export class CommentService {
  async createComment(postId: string, authorId: string, input: CreateCommentInput) {
    const { content, parentCommentId } = input;

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // If replying to a comment, verify parent exists
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
      });

      if (!parentComment) {
        throw new Error('Parent comment not found');
      }

      if (parentComment.postId !== postId) {
        throw new Error('Parent comment belongs to different post');
      }
    }

    // Create comment and update counts
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          postId,
          authorId,
          content,
          parentCommentId,
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
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
      // Create notification
      ...(post.authorId !== authorId
        ? [
            prisma.notification.create({
              data: {
                userId: post.authorId,
                type: parentCommentId ? 'reply' : 'comment',
                actorId: authorId,
                targetType: 'comment',
                targetId: postId, // Will be updated with actual comment ID
              },
            }),
          ]
        : []),
    ]);

    return comment;
  }

  async getPostComments(postId: string, pagination: PaginationInput, currentUserId?: string) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Get top-level comments only (replies are nested)
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          postId,
          parentCommentId: null,
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
          replies: {
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
            },
            orderBy: { createdAt: 'asc' },
            take: 5, // Limit initial replies shown
          },
          _count: {
            select: {
              replies: true,
              upvotes: true,
            },
          },
        },
      }),
      prisma.comment.count({
        where: {
          postId,
          parentCommentId: null,
        },
      }),
    ]);

    // Get upvote status for comments if user is logged in
    let upvotedCommentIds = new Set<string>();
    if (currentUserId) {
      const commentIds = comments.flatMap((c) => [c.id, ...c.replies.map((r) => r.id)]);
      const upvotes = await prisma.upvote.findMany({
        where: {
          userId: currentUserId,
          targetType: 'comment',
          targetId: { in: commentIds },
        },
        select: { targetId: true },
      });
      upvotedCommentIds = new Set(upvotes.map((u) => u.targetId));
    }

    const commentsWithStatus = comments.map((comment) => ({
      ...comment,
      hasUpvoted: upvotedCommentIds.has(comment.id),
      replyCount: comment._count.replies,
      replies: comment.replies.map((reply) => ({
        ...reply,
        hasUpvoted: upvotedCommentIds.has(reply.id),
      })),
    }));

    return {
      data: commentsWithStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new Error('Not authorized to delete this comment');
    }

    // Delete comment and update post count
    await prisma.$transaction([
      prisma.comment.delete({
        where: { id: commentId },
      }),
      prisma.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }

  async upvoteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'comment',
          targetId: commentId,
        },
      },
    });

    if (existingUpvote) {
      throw new Error('Already upvoted this comment');
    }

    await prisma.$transaction([
      prisma.upvote.create({
        data: {
          userId,
          targetType: 'comment',
          targetId: commentId,
        },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: { upvoteCount: { increment: 1 } },
      }),
      // Create notification if not own comment
      ...(comment.authorId !== userId
        ? [
            prisma.notification.create({
              data: {
                userId: comment.authorId,
                type: 'upvote_comment',
                actorId: userId,
                targetType: 'comment',
                targetId: commentId,
              },
            }),
          ]
        : []),
    ]);

    return { success: true };
  }

  async removeCommentUpvote(commentId: string, userId: string) {
    const upvote = await prisma.upvote.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'comment',
          targetId: commentId,
        },
      },
    });

    if (!upvote) {
      throw new Error('Not upvoted this comment');
    }

    await prisma.$transaction([
      prisma.upvote.delete({
        where: { id: upvote.id },
      }),
      prisma.comment.update({
        where: { id: commentId },
        data: { upvoteCount: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }
}

export const commentService = new CommentService();
