import { z } from 'zod';

export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, 'Content is required')
    .max(2000, 'Content must be at most 2000 characters'),
  linkUrl: z.string().url().optional().nullable(),
  linkType: z.enum(['track', 'album', 'playlist']).optional().nullable(),
  postType: z.enum(['discussion', 'music']).optional(), // Auto-detected if not provided
  tags: z.array(z.string().max(50)).max(10).default([]),
  communityIds: z.array(z.string()).max(5).default([]),
  isNewAndUpcoming: z.boolean().optional().default(false),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const postQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  filter: z.enum(['all', 'following', 'communities']).default('all'),
  sort: z.enum(['latest', 'top']).default('latest'),
  communityId: z.string().optional(),
});

export type PostQueryInput = z.infer<typeof postQuerySchema>;
