import { z } from 'zod';

export const updateUserSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(280).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  isArtist: z.boolean().optional(),
  artistName: z.string().max(100).optional().nullable(),
  streamingLinks: z
    .object({
      spotify: z.string().url().optional(),
      appleMusic: z.string().url().optional(),
      soundcloud: z.string().url().optional(),
      bandcamp: z.string().url().optional(),
      youtube: z.string().url().optional(),
    })
    .optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
