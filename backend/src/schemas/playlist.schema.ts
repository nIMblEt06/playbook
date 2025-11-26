import { z } from 'zod';

export const createPlaylistSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  description: z.string().max(500).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().default(true),
});

export const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export const addTrackSchema = z.object({
  linkUrl: z.string().url('Invalid URL'),
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  position: z.number().int().min(0).optional(),
});

export const reorderTracksSchema = z.object({
  trackIds: z.array(z.string()),
});

export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
export type AddTrackInput = z.infer<typeof addTrackSchema>;
