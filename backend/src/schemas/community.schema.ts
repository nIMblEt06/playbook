import { z } from 'zod';

export const createCommunitySchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be at most 50 characters')
    .regex(/^[a-z0-9_-]+$/, 'Slug can only contain lowercase letters, numbers, underscores, and hyphens')
    .transform((val) => val.toLowerCase()),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string().max(500).optional().nullable(),
  rules: z.string().max(2000).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  type: z.enum(['artist', 'user']).default('user'),
});

export const updateCommunitySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  rules: z.string().max(2000).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
