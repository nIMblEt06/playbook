import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/utils/prisma.js';
import { feedService } from '../../src/services/feed.service.js';
import { mockUsers, mockPosts, mockCommunities } from '../fixtures/index.js';

describe('FeedService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFeed', () => {
    it('should return posts from followed users', async () => {
      vi.mocked(prisma.follow.findMany).mockResolvedValue([
        { followingId: mockUsers.user2.id },
      ] as any);
      vi.mocked(prisma.communityMembership.findMany).mockResolvedValue([]);
      vi.mocked(prisma.post.findMany).mockResolvedValue([
        {
          ...mockPosts.post2,
          author: mockUsers.user2,
          communities: [],
          _count: { comments: 12, upvotes: 42 },
        },
      ] as any);
      vi.mocked(prisma.post.count).mockResolvedValue(1);
      vi.mocked(prisma.upvote.findMany).mockResolvedValue([]);

      const result = await feedService.getFeed(mockUsers.user1.id, {
        page: 1,
        limit: 20,
        filter: 'following',
        sort: 'latest',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].authorId).toBe(mockUsers.user2.id);
    });

    it('should return posts from joined communities', async () => {
      vi.mocked(prisma.follow.findMany).mockResolvedValue([]);
      vi.mocked(prisma.communityMembership.findMany).mockResolvedValue([
        { communityId: mockCommunities.userCommunity.id },
      ] as any);
      vi.mocked(prisma.post.findMany).mockResolvedValue([
        {
          ...mockPosts.post1,
          author: mockUsers.user1,
          communities: [{ community: mockCommunities.userCommunity }],
          _count: { comments: 3, upvotes: 15 },
        },
      ] as any);
      vi.mocked(prisma.post.count).mockResolvedValue(1);
      vi.mocked(prisma.upvote.findMany).mockResolvedValue([]);

      const result = await feedService.getFeed(mockUsers.user2.id, {
        page: 1,
        limit: 20,
        filter: 'communities',
        sort: 'latest',
      });

      expect(result.data).toHaveLength(1);
    });

    it('should include upvote status for posts', async () => {
      vi.mocked(prisma.follow.findMany).mockResolvedValue([
        { followingId: mockUsers.user2.id },
      ] as any);
      vi.mocked(prisma.communityMembership.findMany).mockResolvedValue([]);
      vi.mocked(prisma.post.findMany).mockResolvedValue([
        {
          ...mockPosts.post2,
          author: mockUsers.user2,
          communities: [],
          _count: { comments: 12, upvotes: 42 },
        },
      ] as any);
      vi.mocked(prisma.post.count).mockResolvedValue(1);
      vi.mocked(prisma.upvote.findMany).mockResolvedValue([
        { targetId: mockPosts.post2.id },
      ] as any);

      const result = await feedService.getFeed(mockUsers.user1.id, {
        page: 1,
        limit: 20,
        filter: 'all',
        sort: 'latest',
      });

      expect(result.data[0].hasUpvoted).toBe(true);
    });

    it('should sort by top when specified', async () => {
      vi.mocked(prisma.follow.findMany).mockResolvedValue([
        { followingId: mockUsers.user2.id },
      ] as any);
      vi.mocked(prisma.communityMembership.findMany).mockResolvedValue([]);
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);
      vi.mocked(prisma.post.count).mockResolvedValue(0);
      vi.mocked(prisma.upvote.findMany).mockResolvedValue([]);

      await feedService.getFeed(mockUsers.user1.id, {
        page: 1,
        limit: 20,
        filter: 'all',
        sort: 'top',
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ upvoteCount: 'desc' }, { createdAt: 'desc' }],
        })
      );
    });

    it('should show all posts for cold start (no follows or communities)', async () => {
      vi.mocked(prisma.follow.findMany).mockResolvedValue([]);
      vi.mocked(prisma.communityMembership.findMany).mockResolvedValue([]);
      vi.mocked(prisma.post.findMany).mockResolvedValue([
        {
          ...mockPosts.post1,
          author: mockUsers.user1,
          communities: [],
          _count: { comments: 3, upvotes: 15 },
        },
      ] as any);
      vi.mocked(prisma.post.count).mockResolvedValue(1);
      vi.mocked(prisma.upvote.findMany).mockResolvedValue([]);

      const result = await feedService.getFeed('new-user-id', {
        page: 1,
        limit: 20,
        filter: 'all',
        sort: 'latest',
      });

      // Should return posts (cold start discovery)
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getNewAndUpcomingFeed', () => {
    it('should return only NewAndUpcoming posts', async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([
        {
          ...mockPosts.newAndUpcomingPost,
          author: mockUsers.artistUser,
          _count: { comments: 5, upvotes: 8 },
        },
      ] as any);
      vi.mocked(prisma.post.count).mockResolvedValue(1);

      const result = await feedService.getNewAndUpcomingFeed({
        page: 1,
        limit: 20,
        filter: 'all',
        sort: 'latest',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isNewAndUpcoming).toBe(true);
    });

    it('should sort by upvotes when sort is top', async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);
      vi.mocked(prisma.post.count).mockResolvedValue(0);

      await feedService.getNewAndUpcomingFeed({
        page: 1,
        limit: 20,
        filter: 'all',
        sort: 'top',
      });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isNewAndUpcoming: true },
          orderBy: [{ upvoteCount: 'desc' }, { createdAt: 'desc' }],
        })
      );
    });
  });

  describe('getCommunityFeed', () => {
    it('should return posts from specific community', async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([
        {
          ...mockPosts.post1,
          author: mockUsers.user1,
          _count: { comments: 3, upvotes: 15 },
        },
      ] as any);
      vi.mocked(prisma.post.count).mockResolvedValue(1);

      const result = await feedService.getCommunityFeed(mockCommunities.userCommunity.id, {
        page: 1,
        limit: 20,
        filter: 'all',
        sort: 'latest',
      });

      expect(result.data).toHaveLength(1);
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            communities: {
              some: { communityId: mockCommunities.userCommunity.id },
            },
          },
        })
      );
    });

    it('should paginate results correctly', async () => {
      vi.mocked(prisma.post.findMany).mockResolvedValue([]);
      vi.mocked(prisma.post.count).mockResolvedValue(50);

      const result = await feedService.getCommunityFeed(mockCommunities.userCommunity.id, {
        page: 2,
        limit: 20,
        filter: 'all',
        sort: 'latest',
      });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.total).toBe(50);
      expect(result.pagination.totalPages).toBe(3);
      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });
  });
});
