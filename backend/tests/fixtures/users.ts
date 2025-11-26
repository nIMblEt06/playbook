import bcrypt from 'bcrypt';

export const mockUsers = {
  user1: {
    id: 'user-1-id',
    username: 'testuser1',
    displayName: 'Test User 1',
    email: 'test1@example.com',
    passwordHash: '$2b$12$abcdefghijklmnopqrstuv', // Pre-hashed password
    bio: 'Test bio for user 1',
    avatarUrl: 'https://example.com/avatar1.jpg',
    isArtist: false,
    artistName: null,
    streamingLinks: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  user2: {
    id: 'user-2-id',
    username: 'testuser2',
    displayName: 'Test User 2',
    email: 'test2@example.com',
    passwordHash: '$2b$12$abcdefghijklmnopqrstuv',
    bio: 'Test bio for user 2',
    avatarUrl: 'https://example.com/avatar2.jpg',
    isArtist: false,
    artistName: null,
    streamingLinks: {},
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  artistUser: {
    id: 'artist-user-id',
    username: 'artistuser',
    displayName: 'Artist User',
    email: 'artist@example.com',
    passwordHash: '$2b$12$abcdefghijklmnopqrstuv',
    bio: 'I make music',
    avatarUrl: 'https://example.com/artist-avatar.jpg',
    isArtist: true,
    artistName: 'The Artist',
    streamingLinks: {
      spotify: 'https://spotify.com/artist/123',
      soundcloud: 'https://soundcloud.com/theartist',
    },
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
};

export const mockUserWithCounts = {
  ...mockUsers.user1,
  _count: {
    followers: 10,
    following: 5,
    posts: 3,
  },
};

export async function createMockPasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export const validRegisterInput = {
  username: 'newuser',
  displayName: 'New User',
  email: 'newuser@example.com',
  password: 'SecurePassword123!',
  isArtist: false,
};

export const validLoginInput = {
  email: 'test1@example.com',
  password: 'TestPassword123!',
};
