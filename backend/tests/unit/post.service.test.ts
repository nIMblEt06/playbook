import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/utils/prisma.js';
import { postService } from '../../src/services/post.service.js';
import { mockUsers, mockPosts, mockPostWithAuthor, validCreatePostInput } from '../fixtures/index.js';

describe('PostService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a new post successfully', async () => {
      vi.mocked(prisma.post.create).mockResolvedValue({
        ...mockPosts.post1,
        author: {
          id: mockUsers.user1.id,
          username: mockUsers.user1.username,
          displayName: mockUsers.user1.displayName,
          avatarUrl: mockUsers.user1.avatarUrl,
          isArtist: mockUsers.user1.isArtist,
        },
        communities: [],
      } as any);

      const result = await postService.createPost(mockUsers.user1.id, validCreatePostInput);

      expect(result).toBeDefined();
      expect(result.content).toBe(mockPosts.post1.content);
      expect(prisma.post.create).toHaveBeenCalled();
    });

    it('should enforce NewAndUpcoming rate limit', async () => {
      const recentPost = {
        ...mockPosts.newAndUpcomingPost,
        createdAt: new Date(), // Very recent
      };

      vi.mocked(prisma.post.findFirst).mockResolvedValue(recentPost as any);

      const input = {
        ...validCreatePostInput,
        isNewAndUpcoming: true,
      };

      await expect(postService.createPost(mockUsers.artistUser.id, input)).rejects.toThrow(
        /You can only post with #NewAndUpcoming once per week/
      );
    });

    it('should allow NewAndUpcoming post after cooldown', async () => {
      const oldPost = {
        ...mockPosts.newAndUpcomingPost,
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      };

      vi.mocked(prisma.post.findFirst).mockResolvedValue(oldPost as any);
      vi.mocked(prisma.post.create).mockResolvedValue({
        ...mockPosts.newAndUpcomingPost,
        author: mockUsers.artistUser,
        communities: [],
      } as any);

      const input = {
        ...validCreatePostInput,
        isNewAndUpcoming: true,
      };

      const result = await postService.createPost(mockUsers.artistUser.id, input);

      expect(result).toBeDefined();
    });

    it('should validate community IDs exist', async () => {
      vi.mocked(prisma.post.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.community.findMany).mockResolvedValue([]); // No communities found

      const input = {
        ...validCreatePostInput,
        communityIds: ['non-existent-community'],
      };

      await expect(postService.createPost(mockUsers.user1.id, input)).rejects.toThrow(
        'One or more communities not found'
      );
    });
  });

  describe('getPostById', () => {
    it('should return post with author and vote status', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostWithAuthor as any);
      vi.mocked(prisma.upvote.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.savedPost.findUnique).mockResolvedValue(null);

      const result = await postService.getPostById(mockPosts.post1.id, mockUsers.user2.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockPosts.post1.id);
      expect(result?.hasUpvoted).toBe(false);
      expect(result?.hasSaved).toBe(false);
    });

    it('should return hasUpvoted true when user has upvoted', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPostWithAuthor as any);
      vi.mocked(prisma.upvote.findUnique).mockResolvedValue({
        id: 'upvote-id',
        userId: mockUsers.user2.id,
        targetType: 'post',
        targetId: mockPosts.post1.id,
      } as any);
      vi.mocked(prisma.savedPost.findUnique).mockResolvedValue(null);

      const result = await postService.getPostById(mockPosts.post1.id, mockUsers.user2.id);

      expect(result?.hasUpvoted).toBe(true);
    });

    it('should return null for non-existent post', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      const result = await postService.getPostById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('deletePost', () => {
    it('should delete post by author', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPosts.post1 as any);
      vi.mocked(prisma.post.delete).mockResolvedValue({} as any);

      const result = await postService.deletePost(mockPosts.post1.id, mockUsers.user1.id);

      expect(result.success).toBe(true);
      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: mockPosts.post1.id },
      });
    });

    it('should throw error for non-existent post', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await expect(
        postService.deletePost('non-existent', mockUsers.user1.id)
      ).rejects.toThrow('Post not found');
    });

    it('should throw error when user is not author', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPosts.post1 as any);

      await expect(
        postService.deletePost(mockPosts.post1.id, mockUsers.user2.id)
      ).rejects.toThrow('Not authorized to delete this post');
    });
  });

  describe('upvotePost', () => {
    it('should upvote a post successfully', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPosts.post1 as any);
      vi.mocked(prisma.upvote.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}, {}] as any);

      const result = await postService.upvotePost(mockPosts.post1.id, mockUsers.user2.id);

      expect(result.success).toBe(true);
    });

    it('should throw error for non-existent post', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(null);

      await expect(
        postService.upvotePost('non-existent', mockUsers.user2.id)
      ).rejects.toThrow('Post not found');
    });

    it('should throw error when already upvoted', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPosts.post1 as any);
      vi.mocked(prisma.upvote.findUnique).mockResolvedValue({
        id: 'existing-upvote',
      } as any);

      await expect(
        postService.upvotePost(mockPosts.post1.id, mockUsers.user2.id)
      ).rejects.toThrow('Already upvoted this post');
    });
  });

  describe('removeUpvote', () => {
    it('should remove upvote successfully', async () => {
      vi.mocked(prisma.upvote.findUnique).mockResolvedValue({
        id: 'upvote-id',
      } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      const result = await postService.removeUpvote(mockPosts.post1.id, mockUsers.user2.id);

      expect(result.success).toBe(true);
    });

    it('should throw error when not upvoted', async () => {
      vi.mocked(prisma.upvote.findUnique).mockResolvedValue(null);

      await expect(
        postService.removeUpvote(mockPosts.post1.id, mockUsers.user2.id)
      ).rejects.toThrow('Not upvoted this post');
    });
  });

  describe('savePost', () => {
    it('should save a post successfully', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPosts.post1 as any);
      vi.mocked(prisma.savedPost.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.savedPost.create).mockResolvedValue({} as any);

      const result = await postService.savePost(mockPosts.post1.id, mockUsers.user2.id);

      expect(result.success).toBe(true);
    });

    it('should throw error when post already saved', async () => {
      vi.mocked(prisma.post.findUnique).mockResolvedValue(mockPosts.post1 as any);
      vi.mocked(prisma.savedPost.findUnique).mockResolvedValue({
        id: 'saved-id',
      } as any);

      await expect(
        postService.savePost(mockPosts.post1.id, mockUsers.user2.id)
      ).rejects.toThrow('Post already saved');
    });
  });

  describe('unsavePost', () => {
    it('should unsave a post successfully', async () => {
      vi.mocked(prisma.savedPost.findUnique).mockResolvedValue({
        id: 'saved-id',
      } as any);
      vi.mocked(prisma.savedPost.delete).mockResolvedValue({} as any);

      const result = await postService.unsavePost(mockPosts.post1.id, mockUsers.user2.id);

      expect(result.success).toBe(true);
    });

    it('should throw error when post not saved', async () => {
      vi.mocked(prisma.savedPost.findUnique).mockResolvedValue(null);

      await expect(
        postService.unsavePost(mockPosts.post1.id, mockUsers.user2.id)
      ).rejects.toThrow('Post not saved');
    });
  });
});
