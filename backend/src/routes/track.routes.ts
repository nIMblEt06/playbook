import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import * as reviewService from '../services/review.service.js';

interface TrackParams {
  trackId: string;
}

const rateTrackSchema = z.object({
  value: z.number().int().min(1).max(5),
});

export async function trackRoutes(fastify: FastifyInstance) {
  // POST /api/tracks/:trackId/rate - Rate a track
  fastify.post<{ Params: TrackParams; Body: z.infer<typeof rateTrackSchema> }>(
    '/:trackId/rate',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: TrackParams; Body: z.infer<typeof rateTrackSchema> }>, reply: FastifyReply) => {
      try {
        const { trackId } = request.params;
        const { value } = rateTrackSchema.parse(request.body);

        // Ensure track exists in our database (create if not)
        let track = await prisma.track.findUnique({
          where: { spotifyId: trackId },
        });

        if (!track) {
          // Create a minimal track record - will be populated with full data later if needed
          track = await prisma.track.create({
            data: {
              spotifyId: trackId,
              title: 'Unknown Track', // Will be updated when user views track detail
              artistName: 'Unknown Artist',
            },
          });
        }

        // Create or update the rating
        const rating = await reviewService.rateTrack(request.user.userId, track.id, value);

        return reply.code(200).send({
          success: true,
          rating: {
            id: rating.id,
            value: rating.value,
            trackId: track.id,
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/tracks/:trackId/rating - Get user's rating for a track
  fastify.get<{ Params: TrackParams }>(
    '/:trackId/rating',
    async (request: FastifyRequest<{ Params: TrackParams }>, reply: FastifyReply) => {
      try {
        let currentUserId: string | undefined;
        try {
          await request.jwtVerify();
          currentUserId = request.user.userId;
        } catch {
          // Not authenticated
        }

        if (!currentUserId) {
          return reply.send({ rating: null });
        }

        const { trackId } = request.params;

        // Find the track by Spotify ID
        const track = await prisma.track.findUnique({
          where: { spotifyId: trackId },
        });

        if (!track) {
          return reply.send({ rating: null });
        }

        // Get the user's rating
        const rating = await prisma.rating.findUnique({
          where: {
            userId_trackId: { userId: currentUserId, trackId: track.id },
          },
        });

        return reply.send({
          rating: rating ? { value: rating.value } : null,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // DELETE /api/tracks/:trackId/rating - Remove user's rating for a track
  fastify.delete<{ Params: TrackParams }>(
    '/:trackId/rating',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest<{ Params: TrackParams }>, reply: FastifyReply) => {
      try {
        const { trackId } = request.params;

        // Find the track by Spotify ID
        const track = await prisma.track.findUnique({
          where: { spotifyId: trackId },
        });

        if (!track) {
          return reply.code(404).send({ error: 'Track not found' });
        }

        await reviewService.removeRating(request.user.userId, 'track', track.id);

        return reply.code(204).send();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('Record to delete does not exist')) {
            return reply.code(404).send({ error: 'Rating not found' });
          }
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );

  // GET /api/tracks/:trackId/stats - Get track rating stats
  fastify.get<{ Params: TrackParams }>(
    '/:trackId/stats',
    async (request: FastifyRequest<{ Params: TrackParams }>, reply: FastifyReply) => {
      try {
        const { trackId } = request.params;

        const track = await prisma.track.findUnique({
          where: { spotifyId: trackId },
        });

        if (!track) {
          return reply.send({
            averageRating: null,
            ratingCount: 0,
            reviewCount: 0,
          });
        }

        // Get rating statistics
        const stats = await prisma.rating.aggregate({
          where: { trackId: track.id },
          _avg: { value: true },
          _count: { value: true },
        });

        const reviewCount = await prisma.review.count({
          where: { trackId: track.id },
        });

        return reply.send({
          averageRating: stats._avg.value,
          ratingCount: stats._count.value,
          reviewCount,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(400).send({ error: error.message });
        }
        throw error;
      }
    }
  );
}
