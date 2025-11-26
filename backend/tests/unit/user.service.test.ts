import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/utils/prisma.js';
import { userService } from '../../src/services/user.service.js';
import { mockUsers, mockUserWithCounts } from '../fixtures/index.js';

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserByUsername', () => {
    it('should return user profile with follow status', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithCounts as any);
      vi.mocked(prisma.follow.findUnique).mockResolvedValue(null);

      const result = await userService.getUserByUsername('testuser1', mockUsers.user2.id);

      expect(result).toBeDefined();
      expect(result?.username).toBe('testuser1');
      expect(result?.isFollowing).toBe(false);
      expect(result?.followersCount).toBe(10);
    });

    it('should return isFollowing true when user follows target', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithCounts as any);
      vi.mocked(prisma.follow.findUnique).mockResolvedValue({
        id: 'follow-id',
        followerId: mockUsers.user2.id,
        followingId: mockUsers.user1.id,
        createdAt: new Date(),
      } as any);

      const result = await userService.getUserByUsername('testuser1', mockUsers.user2.id);

      expect(result?.isFollowing).toBe(true);
    });

    it('should return null for non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await userService.getUserByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user profile', async () => {
      const updateData = {
        displayName: 'Updated Name',
        bio: 'Updated bio',
      };

      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUsers.user1,
        ...updateData,
      } as any);

      const result = await userService.updateUser(mockUsers.user1.id, updateData);

      expect(result.displayName).toBe('Updated Name');
      expect(result.bio).toBe('Updated bio');
    });
  });

  describe('followUser', () => {
    it('should successfully follow another user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUsers.user2 as any);
      vi.mocked(prisma.follow.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      const result = await userService.followUser(mockUsers.user1.id, mockUsers.user2.id);

      expect(result.success).toBe(true);
    });

    it('should throw error when trying to follow self', async () => {
      await expect(
        userService.followUser(mockUsers.user1.id, mockUsers.user1.id)
      ).rejects.toThrow('Cannot follow yourself');
    });

    it('should throw error when target user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        userService.followUser(mockUsers.user1.id, 'non-existent-id')
      ).rejects.toThrow('User not found');
    });

    it('should throw error when already following', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUsers.user2 as any);
      vi.mocked(prisma.follow.findUnique).mockResolvedValue({
        id: 'existing-follow',
        followerId: mockUsers.user1.id,
        followingId: mockUsers.user2.id,
      } as any);

      await expect(
        userService.followUser(mockUsers.user1.id, mockUsers.user2.id)
      ).rejects.toThrow('Already following this user');
    });
  });

  describe('unfollowUser', () => {
    it('should successfully unfollow a user', async () => {
      vi.mocked(prisma.follow.findUnique).mockResolvedValue({
        id: 'follow-id',
        followerId: mockUsers.user1.id,
        followingId: mockUsers.user2.id,
      } as any);
      vi.mocked(prisma.follow.delete).mockResolvedValue({} as any);

      const result = await userService.unfollowUser(mockUsers.user1.id, mockUsers.user2.id);

      expect(result.success).toBe(true);
    });

    it('should throw error when not following', async () => {
      vi.mocked(prisma.follow.findUnique).mockResolvedValue(null);

      await expect(
        userService.unfollowUser(mockUsers.user1.id, mockUsers.user2.id)
      ).rejects.toThrow('Not following this user');
    });
  });

  describe('getFollowers', () => {
    it('should return paginated followers list', async () => {
      const mockFollowers = [
        {
          id: 'follow-1',
          follower: {
            id: mockUsers.user2.id,
            username: mockUsers.user2.username,
            displayName: mockUsers.user2.displayName,
            avatarUrl: mockUsers.user2.avatarUrl,
            isArtist: mockUsers.user2.isArtist,
            bio: mockUsers.user2.bio,
          },
        },
      ];

      vi.mocked(prisma.follow.findMany).mockResolvedValue(mockFollowers as any);
      vi.mocked(prisma.follow.count).mockResolvedValue(1);

      const result = await userService.getFollowers(mockUsers.user1.id, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.data[0].username).toBe(mockUsers.user2.username);
    });
  });

  describe('getFollowing', () => {
    it('should return paginated following list', async () => {
      const mockFollowing = [
        {
          id: 'follow-1',
          following: {
            id: mockUsers.user2.id,
            username: mockUsers.user2.username,
            displayName: mockUsers.user2.displayName,
            avatarUrl: mockUsers.user2.avatarUrl,
            isArtist: mockUsers.user2.isArtist,
            bio: mockUsers.user2.bio,
          },
        },
      ];

      vi.mocked(prisma.follow.findMany).mockResolvedValue(mockFollowing as any);
      vi.mocked(prisma.follow.count).mockResolvedValue(1);

      const result = await userService.getFollowing(mockUsers.user1.id, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('getUserPosts', () => {
    it('should return user posts with pagination', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: mockUsers.user1.id } as any);
      vi.mocked(prisma.post.findMany).mockResolvedValue([
        {
          id: 'post-1',
          content: 'Test post',
          author: {
            id: mockUsers.user1.id,
            username: mockUsers.user1.username,
          },
          _count: { comments: 5, upvotes: 10 },
        },
      ] as any);
      vi.mocked(prisma.post.count).mockResolvedValue(1);

      const result = await userService.getUserPosts('testuser1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should throw error for non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        userService.getUserPosts('nonexistent', { page: 1, limit: 20 })
      ).rejects.toThrow('User not found');
    });
  });
});
