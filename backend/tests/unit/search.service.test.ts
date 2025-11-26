import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/utils/prisma.js';
import { searchService } from '../../src/services/search.service.js';
import { mockUsers, mockCommunities, mockPosts } from '../fixtures/index.js';

describe('SearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('search - users', () => {
    it('should search users by username', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        {
          ...mockUsers.user1,
          _count: { followers: 10 },
        },
      ] as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const result = await searchService.search('testuser', 'users', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].username).toBe(mockUsers.user1.username);
      expect(result.data[0].followersCount).toBe(10);
    });

    it('should search users by display name', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        {
          ...mockUsers.user1,
          _count: { followers: 10 },
        },
      ] as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const result = await searchService.search('Test User', 'users', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should search artists by artist name', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        {
          ...mockUsers.artistUser,
          _count: { followers: 500 },
        },
      ] as any);
      vi.mocked(prisma.user.count).mockResolvedValue(1);

      const result = await searchService.search('The Artist', 'users', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isArtist).toBe(true);
    });

    it('should return empty results for no matches', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(0);

      const result = await searchService.search('nonexistent', 'users', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('search - communities', () => {
    it('should search communities by slug', async () => {
      vi.mocked(prisma.community.findMany).mockResolvedValue([
        {
          ...mockCommunities.userCommunity,
          _count: { posts: 42 },
        },
      ] as any);
      vi.mocked(prisma.community.count).mockResolvedValue(1);

      const result = await searchService.search('indierock', 'communities', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].slug).toBe('indierock');
    });

    it('should search communities by name', async () => {
      vi.mocked(prisma.community.findMany).mockResolvedValue([
        {
          ...mockCommunities.userCommunity,
          _count: { posts: 42 },
        },
      ] as any);
      vi.mocked(prisma.community.count).mockResolvedValue(1);

      const result = await searchService.search('Indie Rock', 'communities', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Indie Rock');
    });

    it('should search communities by description', async () => {
      vi.mocked(prisma.community.findMany).mockResolvedValue([
        {
          ...mockCommunities.userCommunity,
          _count: { posts: 42 },
        },
      ] as any);
      vi.mocked(prisma.community.count).mockResolvedValue(1);

      const result = await searchService.search('enthusiasts', 'communities', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should include post count in results', async () => {
      vi.mocked(prisma.community.findMany).mockResolvedValue([
        {
          ...mockCommunities.userCommunity,
          _count: { posts: 42 },
        },
      ] as any);
      vi.mocked(prisma.community.count).mockResolvedValue(1);

      const result = await searchService.search('indie', 'communities', {
        page: 1,
        limit: 20,
      });

      expect(result.data[0].postCount).toBe(42);
    });
  });

  describe('search - posts', () => {
    it('should search posts by content', async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([
        {
          ...mockPosts.post1,
          author: mockUsers.user1,
          _count: { comments: 3, upvotes: 15 },
        },
      ] as any);
      vi.mocked(prisma.post.count).mockResolvedValue(1);

      const result = await searchService.search('amazing track', 'posts', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should search posts by tags', async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([
        {
          ...mockPosts.post1,
          author: mockUsers.user1,
          _count: { comments: 3, upvotes: 15 },
        },
      ] as any);
      vi.mocked(prisma.post.count).mockResolvedValue(1);

      const result = await searchService.search('indie', 'posts', {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should include author information', async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([
        {
          ...mockPosts.post1,
          author: {
            id: mockUsers.user1.id,
            username: mockUsers.user1.username,
            displayName: mockUsers.user1.displayName,
            avatarUrl: mockUsers.user1.avatarUrl,
            isArtist: mockUsers.user1.isArtist,
          },
          _count: { comments: 3, upvotes: 15 },
        },
      ] as any);
      vi.mocked(prisma.post.count).mockResolvedValue(1);

      const result = await searchService.search('track', 'posts', {
        page: 1,
        limit: 20,
      });

      expect(result.data[0].author.username).toBe(mockUsers.user1.username);
    });
  });

  describe('search - pagination', () => {
    it('should paginate results correctly', async () => {
      vi.mocked(prisma.user.findMany).mockResolvedValue([]);
      vi.mocked(prisma.user.count).mockResolvedValue(100);

      const result = await searchService.search('test', 'users', {
        page: 3,
        limit: 20,
      });

      expect(result.pagination.page).toBe(3);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.totalPages).toBe(5);
    });
  });

  describe('search - invalid type', () => {
    it('should throw error for invalid search type', async () => {
      await expect(
        searchService.search('test', 'invalid' as any, { page: 1, limit: 20 })
      ).rejects.toThrow('Invalid search type');
    });
  });
});
