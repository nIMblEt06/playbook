import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma.js';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema.js';

const SALT_ROUNDS = 12;

export class AuthService {
  async register(input: RegisterInput) {
    const { username, displayName, email, password, isArtist, artistName } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email already registered');
      }
      throw new Error('Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        email,
        passwordHash,
        isArtist: isArtist ?? false,
        artistName: isArtist ? artistName : null,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        isArtist: true,
        artistName: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(input: LoginInput) {
    const { email, password } = input;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      isArtist: user.isArtist,
      artistName: user.artistName,
    };
  }

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
        isArtist: true,
        artistName: true,
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
