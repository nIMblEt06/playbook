import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/utils/prisma.js';
import { communityService } from '../../src/services/community.service.js';
import {
  mockUsers,
  mockCommunities,
  mockCommunityWithCounts,
  mockMembership,
  validCreateCommunityInput,
} from '../fixtures/index.js';

describe('CommunityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCommunity', () => {
    it('should create a new community successfully', async () => {
      vi.mocked(prisma.community.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          community: {
            create: vi.fn().mockResolvedValue(mockCommunities.userCommunity),
          },
          communityMembership: {
            create: vi.fn().mockResolvedValue(mockMembership),
          },
        });
      });

      const result = await communityService.createCommunity(
        mockUsers.user1.id,
        validCreateCommunityInput
      );

      expect(result).toBeDefined();
    });

    it('should throw error if slug already exists', async () => {
      vi.mocked(prisma.community.findUnique).mockResolvedValue(
        mockCommunities.userCommunity as any
      );

      await expect(
        communityService.createCommunity(mockUsers.user1.id, validCreateCommunityInput)
      ).rejects.toThrow('Community slug already taken');
    });
  });

  describe('getCommunityBySlug', () => {
    it('should return community with membership status', async () => {
      vi.mocked(prisma.community.findUnique).mockResolvedValue(mockCommunityWithCounts as any);
      vi.mocked(prisma.communityMembership.findUnique).mockResolvedValue(mockMembership as any);

      const result = await communityService.getCommunityBySlug(
        'indierock',
        mockUsers.user1.id
      );

      expect(result).toBeDefined();
      expect(result?.isMember).toBe(true);
      expect(result?.userRole).toBe('creator');
    });

    it('should return isMember false for non-member', async () => {
      vi.mocked(prisma.community.findUnique).mockResolvedValue(mockCommunityWithCounts as any);
      vi.mocked(prisma.communityMembership.findUnique).mockResolvedValue(null);

      const result = await communityService.getCommunityBySlug(
        'indierock',
        mockUsers.user2.id
      );

      expect(result?.isMember).toBe(false);
      expect(result?.userRole).toBeNull();
    });

    it('should return null for non-existent community', async () => {
      vi.mocked(prisma.community.findUnique).mockResolvedValue(null);

      const result = await communityService.getCommunityBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateCommunity', () => {
    it('should update community by authorized user', async () => {
      vi.mocked(prisma.communityMembership.findUnique).mockResolvedValue({
        ...mockMembership,
        role: 'creator',
      } as any);
      vi.mocked(prisma.community.update).mockResolvedValue({
        ...mockCommunities.userCommunity,
        name: 'Updated Name',
      } as any);

      const result = await communityService.updateCommunity(
        mockCommunities.userCommunity.id,
        mockUsers.user1.id,
        { name: 'Updated Name' }
      );

      expect(result.name).toBe('Updated Name');
    });

    it('should throw error for unauthorized user', async () => {
      vi.mocked(prisma.communityMembership.findUnique).mockResolvedValue({
        ...mockMembership,
        role: 'member',
      } as any);

      await expect(
        communityService.updateCommunity(
          mockCommunities.userCommunity.id,
          mockUsers.user2.id,
          { name: 'Updated Name' }
        )
      ).rejects.toThrow('Not authorized to update this community');
    });

    it('should allow moderator to update', async () => {
      vi.mocked(prisma.communityMembership.findUnique).mockResolvedValue({
        ...mockMembership,
        role: 'moderator',
      } as any);
      vi.mocked(prisma.community.update).mockResolvedValue({
        ...mockCommunities.userCommunity,
        description: 'New description',
      } as any);

      const result = await communityService.updateCommunity(
        mockCommunities.userCommunity.id,
        mockUsers.user2.id,
        { description: 'New description' }
      );

      expect(result.description).toBe('New description');
    });
  });

  describe('joinCommunity', () => {
    it('should join community successfully', async () => {
      vi.mocked(prisma.community.findUnique).mockResolvedValue(
        mockCommunities.userCommunity as any
      );
      vi.mocked(prisma.communityMembership.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      const result = await communityService.joinCommunity(
        mockCommunities.userCommunity.id,
        mockUsers.user2.id
      );

      expect(result.success).toBe(true);
    });

    it('should throw error for non-existent community', async () => {
      vi.mocked(prisma.community.findUnique).mockResolvedValue(null);

      await expect(
        communityService.joinCommunity('non-existent', mockUsers.user2.id)
      ).rejects.toThrow('Community not found');
    });

    it('should throw error if already a member', async () => {
      vi.mocked(prisma.community.findUnique).mockResolvedValue(
        mockCommunities.userCommunity as any
      );
      vi.mocked(prisma.communityMembership.findUnique).mockResolvedValue(mockMembership as any);

      await expect(
        communityService.joinCommunity(mockCommunities.userCommunity.id, mockUsers.user1.id)
      ).rejects.toThrow('Already a member of this community');
    });
  });

  describe('leaveCommunity', () => {
    it('should leave community successfully', async () => {
      vi.mocked(prisma.communityMembership.findUnique).mockResolvedValue({
        ...mockMembership,
        role: 'member',
      } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}] as any);

      const result = await communityService.leaveCommunity(
        mockCommunities.userCommunity.id,
        mockUsers.user2.id
      );

      expect(result.success).toBe(true);
    });

    it('should throw error if not a member', async () => {
      vi.mocked(prisma.communityMembership.findUnique).mockResolvedValue(null);

      await expect(
        communityService.leaveCommunity(mockCommunities.userCommunity.id, mockUsers.user2.id)
      ).rejects.toThrow('Not a member of this community');
    });

    it('should throw error if creator tries to leave', async () => {
      vi.mocked(prisma.communityMembership.findUnique).mockResolvedValue({
        ...mockMembership,
        role: 'creator',
      } as any);

      await expect(
        communityService.leaveCommunity(mockCommunities.userCommunity.id, mockUsers.user1.id)
      ).rejects.toThrow('Creator cannot leave the community');
    });
  });

  describe('getCommunityMembers', () => {
    it('should return paginated members list', async () => {
      const mockMembers = [
        {
          id: 'membership-1',
          user: {
            id: mockUsers.user1.id,
            username: mockUsers.user1.username,
            displayName: mockUsers.user1.displayName,
            avatarUrl: mockUsers.user1.avatarUrl,
            isArtist: mockUsers.user1.isArtist,
          },
          role: 'creator',
          joinedAt: new Date(),
        },
      ];

      vi.mocked(prisma.communityMembership.findMany).mockResolvedValue(mockMembers as any);
      vi.mocked(prisma.communityMembership.count).mockResolvedValue(1);

      const result = await communityService.getCommunityMembers(
        mockCommunities.userCommunity.id,
        { page: 1, limit: 20 }
      );

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe('listCommunities', () => {
    it('should return paginated communities list', async () => {
      vi.mocked(prisma.community.findMany).mockResolvedValue([
        {
          ...mockCommunities.userCommunity,
          _count: { members: 150, posts: 42 },
        },
      ] as any);
      vi.mocked(prisma.community.count).mockResolvedValue(1);

      const result = await communityService.listCommunities({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].memberCount).toBe(150);
    });

    it('should filter by type', async () => {
      vi.mocked(prisma.community.findMany).mockResolvedValue([
        {
          ...mockCommunities.artistCommunity,
          _count: { members: 500, posts: 100 },
        },
      ] as any);
      vi.mocked(prisma.community.count).mockResolvedValue(1);

      const result = await communityService.listCommunities({ page: 1, limit: 20 }, 'artist');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('artist');
    });
  });

  describe('getUserCommunities', () => {
    it('should return user communities with role', async () => {
      vi.mocked(prisma.communityMembership.findMany).mockResolvedValue([
        {
          id: 'membership-1',
          role: 'creator',
          community: {
            ...mockCommunities.userCommunity,
            _count: { members: 150, posts: 42 },
          },
        },
      ] as any);
      vi.mocked(prisma.communityMembership.count).mockResolvedValue(1);

      const result = await communityService.getUserCommunities(mockUsers.user1.id, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].role).toBe('creator');
    });
  });
});
