import { prisma } from '../utils/prisma.js';
import type { CreateCommunityInput, UpdateCommunityInput } from '../schemas/community.schema.js';
import type { PaginationInput } from '../schemas/user.schema.js';

export class CommunityService {
  async createCommunity(creatorId: string, input: CreateCommunityInput) {
    const { slug, name, description, rules, coverImageUrl, type } = input;

    // Check if slug is taken
    const existing = await prisma.community.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new Error('Community slug already taken');
    }

    // Create community and add creator as member with creator role
    const community = await prisma.$transaction(async (tx) => {
      const newCommunity = await tx.community.create({
        data: {
          slug,
          name,
          description,
          rules,
          coverImageUrl,
          type,
          creatorId,
          memberCount: 1,
        },
      });

      await tx.communityMembership.create({
        data: {
          userId: creatorId,
          communityId: newCommunity.id,
          role: 'creator',
        },
      });

      return newCommunity;
    });

    return community;
  }

  async getCommunityBySlug(slug: string, currentUserId?: string) {
    const community = await prisma.community.findUnique({
      where: { slug: slug.toLowerCase() },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
            posts: true,
          },
        },
      },
    });

    if (!community) {
      return null;
    }

    // Check if current user is a member
    let membership = null;
    if (currentUserId) {
      membership = await prisma.communityMembership.findUnique({
        where: {
          userId_communityId: {
            userId: currentUserId,
            communityId: community.id,
          },
        },
      });
    }

    return {
      ...community,
      memberCount: community._count.members,
      postCount: community._count.posts,
      isMember: !!membership,
      userRole: membership?.role ?? null,
    };
  }

  async updateCommunity(communityId: string, userId: string, input: UpdateCommunityInput) {
    // Check if user has permission (creator or moderator)
    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    });

    if (!membership || !['creator', 'moderator'].includes(membership.role)) {
      throw new Error('Not authorized to update this community');
    }

    const community = await prisma.community.update({
      where: { id: communityId },
      data: {
        name: input.name,
        description: input.description,
        rules: input.rules,
        coverImageUrl: input.coverImageUrl,
      },
    });

    return community;
  }

  async joinCommunity(communityId: string, userId: string) {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new Error('Community not found');
    }

    const existingMembership = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    });

    if (existingMembership) {
      throw new Error('Already a member of this community');
    }

    await prisma.$transaction([
      prisma.communityMembership.create({
        data: {
          userId,
          communityId,
          role: 'member',
        },
      }),
      prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { increment: 1 } },
      }),
    ]);

    return { success: true };
  }

  async leaveCommunity(communityId: string, userId: string) {
    const membership = await prisma.communityMembership.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    });

    if (!membership) {
      throw new Error('Not a member of this community');
    }

    if (membership.role === 'creator') {
      throw new Error('Creator cannot leave the community');
    }

    await prisma.$transaction([
      prisma.communityMembership.delete({
        where: { id: membership.id },
      }),
      prisma.community.update({
        where: { id: communityId },
        data: { memberCount: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }

  async getCommunityMembers(communityId: string, pagination: PaginationInput) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      prisma.communityMembership.findMany({
        where: { communityId },
        skip,
        take: limit,
        orderBy: { joinedAt: 'desc' },
        include: {
          user: {
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
      prisma.communityMembership.count({
        where: { communityId },
      }),
    ]);

    return {
      data: members.map((m) => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listCommunities(pagination: PaginationInput, type?: 'artist' | 'user') {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where = type ? { type } : {};

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: { memberCount: 'desc' },
        include: {
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
        },
      }),
      prisma.community.count({ where }),
    ]);

    return {
      data: communities.map((c) => ({
        ...c,
        memberCount: c._count.members,
        postCount: c._count.posts,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserCommunities(userId: string, pagination: PaginationInput) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const [memberships, total] = await Promise.all([
      prisma.communityMembership.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { joinedAt: 'desc' },
        include: {
          community: {
            include: {
              _count: {
                select: {
                  members: true,
                  posts: true,
                },
              },
            },
          },
        },
      }),
      prisma.communityMembership.count({
        where: { userId },
      }),
    ]);

    return {
      data: memberships.map((m) => ({
        ...m.community,
        role: m.role,
        memberCount: m.community._count.members,
        postCount: m.community._count.posts,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const communityService = new CommunityService();
