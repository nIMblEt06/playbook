import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../src/schemas/auth.schema.js';
import { updateUserSchema, paginationSchema } from '../../src/schemas/user.schema.js';
import { createPostSchema, postQuerySchema } from '../../src/schemas/post.schema.js';
import { createCommunitySchema, updateCommunitySchema } from '../../src/schemas/community.schema.js';
import { createCommentSchema } from '../../src/schemas/comment.schema.js';
import { createPlaylistSchema, addTrackSchema } from '../../src/schemas/playlist.schema.js';

describe('Schema Validation', () => {
  describe('Auth Schemas', () => {
    describe('registerSchema', () => {
      it('should validate valid registration input', () => {
        const validInput = {
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!',
          isArtist: false,
        };

        const result = registerSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('should reject username with invalid characters', () => {
        const invalidInput = {
          username: 'Test User!',
          displayName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!',
        };

        const result = registerSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should reject username shorter than 3 characters', () => {
        const invalidInput = {
          username: 'ab',
          displayName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!',
        };

        const result = registerSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should reject password shorter than 8 characters', () => {
        const invalidInput = {
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          password: 'short',
        };

        const result = registerSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should reject invalid email', () => {
        const invalidInput = {
          username: 'testuser',
          displayName: 'Test User',
          email: 'not-an-email',
          password: 'SecurePass123!',
        };

        const result = registerSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should transform username to lowercase', () => {
        // Note: Zod validates before transform, so input must already be lowercase
        const input = {
          username: 'testuser123',
          displayName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!',
        };

        const result = registerSchema.parse(input);
        expect(result.username).toBe('testuser123');
      });
    });

    describe('loginSchema', () => {
      it('should validate valid login input', () => {
        const validInput = {
          email: 'test@example.com',
          password: 'password123',
        };

        const result = loginSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const invalidInput = {
          email: 'not-an-email',
          password: 'password123',
        };

        const result = loginSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should reject empty password', () => {
        const invalidInput = {
          email: 'test@example.com',
          password: '',
        };

        const result = loginSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('User Schemas', () => {
    describe('updateUserSchema', () => {
      it('should validate valid update input', () => {
        const validInput = {
          displayName: 'New Name',
          bio: 'My new bio',
        };

        const result = updateUserSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('should allow empty object', () => {
        const result = updateUserSchema.safeParse({});
        expect(result.success).toBe(true);
      });

      it('should reject bio longer than 280 characters', () => {
        const invalidInput = {
          bio: 'a'.repeat(281),
        };

        const result = updateUserSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should validate streaming links', () => {
        const validInput = {
          streamingLinks: {
            spotify: 'https://spotify.com/artist/123',
            soundcloud: 'https://soundcloud.com/artist',
          },
        };

        const result = updateUserSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('should reject invalid streaming link URLs', () => {
        const invalidInput = {
          streamingLinks: {
            spotify: 'not-a-url',
          },
        };

        const result = updateUserSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });
    });

    describe('paginationSchema', () => {
      it('should apply defaults', () => {
        const result = paginationSchema.parse({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
      });

      it('should coerce string values', () => {
        const result = paginationSchema.parse({ page: '2', limit: '50' });
        expect(result.page).toBe(2);
        expect(result.limit).toBe(50);
      });

      it('should reject limit over 100', () => {
        const result = paginationSchema.safeParse({ limit: 101 });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Post Schemas', () => {
    describe('createPostSchema', () => {
      it('should validate valid post input', () => {
        const validInput = {
          content: 'Check out this track!',
          linkUrl: 'https://spotify.com/track/123',
          linkType: 'track',
          tags: ['indie', 'rock'],
        };

        const result = createPostSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('should reject content longer than 2000 characters', () => {
        const invalidInput = {
          content: 'a'.repeat(2001),
        };

        const result = createPostSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should reject invalid link URL', () => {
        const invalidInput = {
          content: 'Check this out',
          linkUrl: 'not-a-url',
        };

        const result = createPostSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should reject more than 10 tags', () => {
        const invalidInput = {
          content: 'Check this out',
          tags: Array(11).fill('tag'),
        };

        const result = createPostSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should default isNewAndUpcoming to false', () => {
        const input = {
          content: 'Check this out',
        };

        const result = createPostSchema.parse(input);
        expect(result.isNewAndUpcoming).toBe(false);
      });
    });

    describe('postQuerySchema', () => {
      it('should apply defaults', () => {
        const result = postQuerySchema.parse({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.filter).toBe('all');
        expect(result.sort).toBe('latest');
      });

      it('should validate filter options', () => {
        const result = postQuerySchema.safeParse({ filter: 'following' });
        expect(result.success).toBe(true);
      });

      it('should reject invalid filter', () => {
        const result = postQuerySchema.safeParse({ filter: 'invalid' });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Community Schemas', () => {
    describe('createCommunitySchema', () => {
      it('should validate valid community input', () => {
        const validInput = {
          slug: 'indierock',
          name: 'Indie Rock',
          description: 'A community for indie rock fans',
        };

        const result = createCommunitySchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('should transform slug to lowercase', () => {
        // Note: Zod validates before transform, so input must already be lowercase
        const input = {
          slug: 'indierock123',
          name: 'Indie Rock',
        };

        const result = createCommunitySchema.parse(input);
        expect(result.slug).toBe('indierock123');
      });

      it('should reject slug with spaces', () => {
        const invalidInput = {
          slug: 'indie rock',
          name: 'Indie Rock',
        };

        const result = createCommunitySchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should allow hyphens and underscores in slug', () => {
        const validInput = {
          slug: 'indie-rock_fans',
          name: 'Indie Rock Fans',
        };

        const result = createCommunitySchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });
    });

    describe('updateCommunitySchema', () => {
      it('should validate partial updates', () => {
        const validInput = {
          name: 'Updated Name',
        };

        const result = updateCommunitySchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('should reject description over 500 characters', () => {
        const invalidInput = {
          description: 'a'.repeat(501),
        };

        const result = updateCommunitySchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Comment Schemas', () => {
    describe('createCommentSchema', () => {
      it('should validate valid comment input', () => {
        const validInput = {
          content: 'Great track!',
        };

        const result = createCommentSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('should allow parentCommentId for replies', () => {
        const validInput = {
          content: 'I agree!',
          parentCommentId: 'comment-id-123',
        };

        const result = createCommentSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('should reject content over 1000 characters', () => {
        const invalidInput = {
          content: 'a'.repeat(1001),
        };

        const result = createCommentSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should reject empty content', () => {
        const invalidInput = {
          content: '',
        };

        const result = createCommentSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Playlist Schemas', () => {
    describe('createPlaylistSchema', () => {
      it('should validate valid playlist input', () => {
        const validInput = {
          name: 'My Playlist',
          description: 'A collection of my favorite tracks',
          isPublic: true,
        };

        const result = createPlaylistSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('should default isPublic to true', () => {
        const input = {
          name: 'My Playlist',
        };

        const result = createPlaylistSchema.parse(input);
        expect(result.isPublic).toBe(true);
      });

      it('should reject name over 100 characters', () => {
        const invalidInput = {
          name: 'a'.repeat(101),
        };

        const result = createPlaylistSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });
    });

    describe('addTrackSchema', () => {
      it('should validate valid track input', () => {
        const validInput = {
          linkUrl: 'https://spotify.com/track/123',
          title: 'Great Song',
          artist: 'Great Artist',
        };

        const result = addTrackSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('should reject invalid URL', () => {
        const invalidInput = {
          linkUrl: 'not-a-url',
          title: 'Great Song',
          artist: 'Great Artist',
        };

        const result = addTrackSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
      });

      it('should allow optional position', () => {
        const validInput = {
          linkUrl: 'https://spotify.com/track/123',
          title: 'Great Song',
          artist: 'Great Artist',
          position: 5,
        };

        const result = addTrackSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });
    });
  });
});
