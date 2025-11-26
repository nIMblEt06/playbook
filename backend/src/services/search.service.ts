import { prisma } from '../utils/prisma.js';
import type { PaginationInput } from '../schemas/user.schema.js';

type SearchType = 'users' | 'communities' | 'posts';

export class SearchService {
  async search(query: string, type: SearchType, pagination: PaginationInput) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    switch (type) {
      case 'users':
        return this.searchUsers(query, skip, limit);
      case 'communities':
        return this.searchCommunities(query, skip, limit);
      case 'posts':
        return this.searchPosts(query, skip, limit);
      default:
        throw new Error('Invalid search type');
    }
  }

  private async searchUsers(query: string, skip: number, limit: number) {
    const searchTerm = `%${query.toLowerCase()}%`;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
            { artistName: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          isArtist: true,
          artistName: true,
          _count: {
            select: {
              followers: true,
            },
          },
        },
        orderBy: {
          followers: { _count: 'desc' },
        },
      }),
      prisma.user.count({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { displayName: { contains: query, mode: 'insensitive' } },
            { artistName: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      data: users.map((u) => ({
        ...u,
        followersCount: u._count.followers,
      })),
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async searchCommunities(query: string, skip: number, limit: number) {
    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        where: {
          OR: [
            { slug: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          type: true,
          coverImageUrl: true,
          memberCount: true,
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: {
          memberCount: 'desc',
        },
      }),
      prisma.community.count({
        where: {
          OR: [
            { slug: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      data: communities.map((c) => ({
        ...c,
        postCount: c._count.posts,
      })),
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async searchPosts(query: string, skip: number, limit: number) {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query.toLowerCase()] } },
          ],
        },
        skip,
        take: limit,
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
          _count: {
            select: {
              comments: true,
              upvotes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.post.count({
        where: {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query.toLowerCase()] } },
          ],
        },
      }),
    ]);

    return {
      data: posts,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const searchService = new SearchService();
