import { prisma } from '../utils/prisma.js';

/**
 * Auth service for user lookup operations
 * Note: Authentication is now handled via Spotify OAuth in spotify-auth.service.ts
 */
export class AuthService {
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        bio: true,
        avatarUrl: true,
        avatarType: true,
        pixelAvatarId: true,
        isArtist: true,
        artistName: true,
        spotifyId: true,
        spotifyPremium: true,
        streamingLinks: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    return user;
  }
}

export const authService = new AuthService();
