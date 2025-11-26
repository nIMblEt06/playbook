import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/utils/prisma.js';
import { commentService } from '../../src/services/comment.service.js';
import {
  mockUsers,
  mockPosts,
  mockComments,
  mockCommentWithAuthor,
  validCreateCommentInput,
  validReplyInput,
} from '../fixtures/index.js';

describe('CommentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createComment', () => {
    it('should create a new comment successfully', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPosts.post1 as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([
        {
          ...mockComments.comment1,
          author: {
            id: mockUsers.user2.id,
            username: mockUsers.user2.username,
            displayName: mockUsers.user2.displayName,
            avatarUrl: mockUsers.user2.avatarUrl,
            isArtist: mockUsers.user2.isArtist,
          },
        },
        {},
        {},
      ] as any);

      const result = await commentService.createComment(
        mockPosts.post1.id,
        mockUsers.user2.id,
        validCreateCommentInput
      );

      expect(result).toBeDefined();
    });

    it('should throw error for non-existent post', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await expect(
        commentService.createComment('non-existent', mockUsers.user2.id, validCreateCommentInput)
      ).rejects.toThrow('Post not found');
    });

    it('should create a reply to existing comment', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPosts.post1 as any);
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockComments.comment1 as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([
        {
          ...mockComments.reply1,
          author: mockUsers.user1,
        },
        {},
        {},
      ] as any);

      const result = await commentService.createComment(
        mockPosts.post1.id,
        mockUsers.user1.id,
        validReplyInput
      );

      expect(result).toBeDefined();
    });

    it('should throw error for non-existent parent comment', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPosts.post1 as any);
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await expect(
        commentService.createComment(mockPosts.post1.id, mockUsers.user1.id, validReplyInput)
      ).rejects.toThrow('Parent comment not found');
    });

    it('should throw error if parent comment is from different post', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPosts.post1 as any);
      vi.mocked(prisma.comment.findUnique).mockResolvedValue({
        ...mockComments.comment1,
        postId: 'different-post-id',
      } as any);

      await expect(
        commentService.createComment(mockPosts.post1.id, mockUsers.user1.id, validReplyInput)
      ).rejects.toThrow('Parent comment belongs to different post');
    });
  });

  describe('getPostComments', () => {
    it('should return paginated comments with replies', async () => {
      const commentsWithReplies = [
        {
          ...mockCommentWithAuthor,
          replies: [
            {
              ...mockComments.reply1,
              author: mockUsers.user1,
            },
          ],
        },
      ];

      vi.mocked(prisma.comment.findMany).mockResolvedValue(commentsWithReplies as any);
      vi.mocked(prisma.comment.count).mockResolvedValue(1);
      vi.mocked(prisma.upvote.findMany).mockResolvedValue([]);

      const result = await commentService.getPostComments(
        mockPosts.post1.id,
        { page: 1, limit: 20 },
        mockUsers.user2.id
      );

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should include upvote status for authenticated user', async () => {
      vi.mocked(prisma.comment.findMany).mockResolvedValue([mockCommentWithAuthor] as any);
      vi.mocked(prisma.comment.count).mockResolvedValue(1);
      vi.mocked(prisma.upvote.findMany).mockResolvedValue([
        { targetId: mockComments.comment1.id },
      ] as any);

      const result = await commentService.getPostComments(
        mockPosts.post1.id,
        { page: 1, limit: 20 },
        mockUsers.user1.id
      );

      expect(result.data[0].hasUpvoted).toBe(true);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment by author', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockComments.comment1 as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      const result = await commentService.deleteComment(
        mockComments.comment1.id,
        mockUsers.user2.id
      );

      expect(result.success).toBe(true);
    });

    it('should throw error for non-existent comment', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await expect(
        commentService.deleteComment('non-existent', mockUsers.user2.id)
      ).rejects.toThrow('Comment not found');
    });

    it('should throw error when user is not author', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockComments.comment1 as any);

      await expect(
        commentService.deleteComment(mockComments.comment1.id, mockUsers.user1.id)
      ).rejects.toThrow('Not authorized to delete this comment');
    });
  });

  describe('upvoteComment', () => {
    it('should upvote comment successfully', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockComments.comment1 as any);
      vi.mocked(prisma.upvote.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}, {}] as any);

      const result = await commentService.upvoteComment(
        mockComments.comment1.id,
        mockUsers.user1.id
      );

      expect(result.success).toBe(true);
    });

    it('should throw error for non-existent comment', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(null);

      await expect(
        commentService.upvoteComment('non-existent', mockUsers.user1.id)
      ).rejects.toThrow('Comment not found');
    });

    it('should throw error when already upvoted', async () => {
      vi.mocked(prisma.comment.findUnique).mockResolvedValue(mockComments.comment1 as any);
      vi.mocked(prisma.upvote.findUnique).mockResolvedValue({ id: 'existing' } as any);

      await expect(
        commentService.upvoteComment(mockComments.comment1.id, mockUsers.user1.id)
      ).rejects.toThrow('Already upvoted this comment');
    });
  });

  describe('removeCommentUpvote', () => {
    it('should remove upvote successfully', async () => {
      vi.mocked(prisma.upvote.findUnique).mockResolvedValue({ id: 'upvote-id' } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      const result = await commentService.removeCommentUpvote(
        mockComments.comment1.id,
        mockUsers.user1.id
      );

      expect(result.success).toBe(true);
    });

    it('should throw error when not upvoted', async () => {
      vi.mocked(prisma.upvote.findUnique).mockResolvedValue(null);

      await expect(
        commentService.removeCommentUpvote(mockComments.comment1.id, mockUsers.user1.id)
      ).rejects.toThrow('Not upvoted this comment');
    });
  });
});
