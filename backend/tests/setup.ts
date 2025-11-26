import { beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-minimum-32-characters-long';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/playbook_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.NODE_ENV = 'test';

// Mock Prisma
vi.mock('../src/utils/prisma', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    post: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    comment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    community: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    communityMembership: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    follow: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    upvote: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn(),
    },
    playlist: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    playlistTrack: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    savedPost: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    postCommunity: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    reputation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((operations) => {
      if (Array.isArray(operations)) {
        return Promise.all(operations);
      }
      return operations({
        user: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
        post: { create: vi.fn(), update: vi.fn() },
        comment: { create: vi.fn(), delete: vi.fn() },
        community: { create: vi.fn(), update: vi.fn() },
        communityMembership: { create: vi.fn(), delete: vi.fn() },
        follow: { create: vi.fn(), delete: vi.fn() },
        upvote: { create: vi.fn(), delete: vi.fn() },
        notification: { create: vi.fn() },
        playlist: { update: vi.fn() },
        playlistTrack: { create: vi.fn(), delete: vi.fn(), update: vi.fn() },
      });
    }),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

// Mock Redis
vi.mock('../src/utils/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    on: vi.fn(),
    connect: vi.fn(),
  },
  connectRedis: vi.fn(),
}));

beforeAll(() => {
  // Global setup
});

afterAll(() => {
  // Global teardown
});

beforeEach(() => {
  vi.clearAllMocks();
});
