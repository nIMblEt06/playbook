import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import { prisma } from '../../src/utils/prisma.js';
import { authService } from '../../src/services/auth.service.js';
import { mockUsers, validRegisterInput, validLoginInput } from '../fixtures/index.js';

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'new-user-id',
        username: validRegisterInput.username,
        displayName: validRegisterInput.displayName,
        email: validRegisterInput.email,
        isArtist: false,
        artistName: null,
        createdAt: new Date(),
      } as any);

      const result = await authService.register(validRegisterInput);

      expect(result).toBeDefined();
      expect(result.username).toBe(validRegisterInput.username);
      expect(result.email).toBe(validRegisterInput.email);
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { email: validRegisterInput.email },
            { username: validRegisterInput.username },
          ],
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(validRegisterInput.password, 12);
    });

    it('should throw error if email already exists', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        ...mockUsers.user1,
        email: validRegisterInput.email,
      } as any);

      await expect(authService.register(validRegisterInput)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('should throw error if username already exists', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        ...mockUsers.user1,
        username: validRegisterInput.username,
        email: 'different@email.com',
      } as any);

      await expect(authService.register(validRegisterInput)).rejects.toThrow(
        'Username already taken'
      );
    });

    it('should create an artist user when isArtist is true', async () => {
      const artistInput = {
        ...validRegisterInput,
        isArtist: true,
        artistName: 'Test Artist',
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'new-artist-id',
        username: artistInput.username,
        displayName: artistInput.displayName,
        email: artistInput.email,
        isArtist: true,
        artistName: 'Test Artist',
        createdAt: new Date(),
      } as any);

      const result = await authService.register(artistInput);

      expect(result.isArtist).toBe(true);
      expect(result.artistName).toBe('Test Artist');
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUsers.user1 as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await authService.login({
        email: mockUsers.user1.email,
        password: 'TestPassword123!',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUsers.user1.id);
      expect(result.email).toBe(mockUsers.user1.email);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw error for non-existent email', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for incorrect password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUsers.user1 as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        authService.login({
          email: mockUsers.user1.email,
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('getUserById', () => {
    it('should return user with counts', async () => {
      const mockUserWithCounts = {
        ...mockUsers.user1,
        _count: {
          followers: 10,
          following: 5,
          posts: 3,
        },
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUserWithCounts as any);

      const result = await authService.getUserById(mockUsers.user1.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUsers.user1.id);
      expect(result?._count.followers).toBe(10);
    });

    it('should return null for non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await authService.getUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
