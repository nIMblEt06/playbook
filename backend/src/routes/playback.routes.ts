import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as playbackService from '../services/playback.service.js';

export async function playbackRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/playback/state
   * Get current playback state
   * Requires authentication and Spotify Premium
   */
  fastify.get(
    '/state',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const playbackState = await playbackService.getCurrentPlaybackState(userId);

        if (!playbackState) {
          return reply.status(200).send({
            is_playing: false,
            message: 'No active playback',
          });
        }

        return playbackState;
      } catch (error) {
        const err = error as Error;
        console.error('Get playback state error:', err);

        if (err.message.includes('No valid Spotify access token')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return reply.status(500).send({
          error: 'Failed to get playback state',
          message: err.message,
        });
      }
    }
  );

  /**
   * GET /api/playback/devices
   * Get available playback devices
   * Requires authentication and Spotify Premium
   */
  fastify.get(
    '/devices',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const devices = await playbackService.getAvailableDevices(userId);

        return devices;
      } catch (error) {
        const err = error as Error;
        console.error('Get devices error:', err);

        if (err.message.includes('No valid Spotify access token')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return reply.status(500).send({
          error: 'Failed to get devices',
          message: err.message,
        });
      }
    }
  );

  /**
   * PUT /api/playback/play
   * Start or resume playback
   * Body: { uris?: string[], context_uri?: string, device_id?: string, position_ms?: number, offset?: { position?: number, uri?: string } }
   * Requires authentication and Spotify Premium
   */
  fastify.put<{
    Body: {
      uris?: string[];
      context_uri?: string;
      device_id?: string;
      position_ms?: number;
      offset?: {
        position?: number;
        uri?: string;
      };
    };
  }>(
    '/play',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const { uris, context_uri, device_id, position_ms, offset } = request.body;

        await playbackService.startPlayback(userId, {
          uris,
          context_uri,
          device_id,
          position_ms,
          offset,
        });

        return { success: true, message: 'Playback started' };
      } catch (error) {
        const err = error as Error;
        console.error('Start playback error:', err);

        if (err.message.includes('No valid Spotify access token')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Please re-authenticate with Spotify',
          });
        }

        if (err.message.includes('NO_ACTIVE_DEVICE') || err.message.includes('Device not found')) {
          return reply.status(404).send({
            error: 'No active device',
            message: 'Please open Spotify on a device to control playback',
          });
        }

        if (err.message.includes('PREMIUM_REQUIRED')) {
          return reply.status(403).send({
            error: 'Premium required',
            message: 'Playback control requires Spotify Premium',
          });
        }

        return reply.status(500).send({
          error: 'Failed to start playback',
          message: err.message,
        });
      }
    }
  );

  /**
   * PUT /api/playback/pause
   * Pause playback
   * Body: { device_id?: string }
   * Requires authentication and Spotify Premium
   */
  fastify.put<{
    Body: { device_id?: string };
  }>(
    '/pause',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const { device_id } = request.body;

        await playbackService.pausePlayback(userId, device_id);

        return { success: true, message: 'Playback paused' };
      } catch (error) {
        const err = error as Error;
        console.error('Pause playback error:', err);

        if (err.message.includes('No valid Spotify access token')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return reply.status(500).send({
          error: 'Failed to pause playback',
          message: err.message,
        });
      }
    }
  );

  /**
   * POST /api/playback/next
   * Skip to next track
   * Body: { device_id?: string }
   * Requires authentication and Spotify Premium
   */
  fastify.post<{
    Body: { device_id?: string };
  }>(
    '/next',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const { device_id } = request.body;

        await playbackService.skipToNext(userId, device_id);

        return { success: true, message: 'Skipped to next track' };
      } catch (error) {
        const err = error as Error;
        console.error('Skip to next error:', err);

        if (err.message.includes('No valid Spotify access token')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return reply.status(500).send({
          error: 'Failed to skip to next track',
          message: err.message,
        });
      }
    }
  );

  /**
   * POST /api/playback/previous
   * Skip to previous track
   * Body: { device_id?: string }
   * Requires authentication and Spotify Premium
   */
  fastify.post<{
    Body: { device_id?: string };
  }>(
    '/previous',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const { device_id } = request.body;

        await playbackService.skipToPrevious(userId, device_id);

        return { success: true, message: 'Skipped to previous track' };
      } catch (error) {
        const err = error as Error;
        console.error('Skip to previous error:', err);

        if (err.message.includes('No valid Spotify access token')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return reply.status(500).send({
          error: 'Failed to skip to previous track',
          message: err.message,
        });
      }
    }
  );

  /**
   * PUT /api/playback/seek
   * Seek to position in currently playing track
   * Body: { position_ms: number, device_id?: string }
   * Requires authentication and Spotify Premium
   */
  fastify.put<{
    Body: { position_ms: number; device_id?: string };
  }>(
    '/seek',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const { position_ms, device_id } = request.body;

        if (typeof position_ms !== 'number' || position_ms < 0) {
          return reply.status(400).send({
            error: 'Invalid position',
            message: 'position_ms must be a non-negative number',
          });
        }

        await playbackService.seekToPosition(userId, position_ms, device_id);

        return { success: true, message: 'Seeked to position' };
      } catch (error) {
        const err = error as Error;
        console.error('Seek error:', err);

        if (err.message.includes('No valid Spotify access token')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return reply.status(500).send({
          error: 'Failed to seek',
          message: err.message,
        });
      }
    }
  );

  /**
   * PUT /api/playback/volume
   * Set playback volume
   * Body: { volume_percent: number, device_id?: string }
   * Requires authentication and Spotify Premium
   */
  fastify.put<{
    Body: { volume_percent: number; device_id?: string };
  }>(
    '/volume',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const { volume_percent, device_id } = request.body;

        if (typeof volume_percent !== 'number' || volume_percent < 0 || volume_percent > 100) {
          return reply.status(400).send({
            error: 'Invalid volume',
            message: 'volume_percent must be between 0 and 100',
          });
        }

        await playbackService.setPlaybackVolume(userId, volume_percent, device_id);

        return { success: true, message: 'Volume set' };
      } catch (error) {
        const err = error as Error;
        console.error('Set volume error:', err);

        if (err.message.includes('No valid Spotify access token')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return reply.status(500).send({
          error: 'Failed to set volume',
          message: err.message,
        });
      }
    }
  );

  /**
   * PUT /api/playback/device
   * Transfer playback to a different device
   * Body: { device_id: string, play?: boolean }
   * Requires authentication and Spotify Premium
   */
  fastify.put<{
    Body: { device_id: string; play?: boolean };
  }>(
    '/device',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const { device_id, play } = request.body;

        if (!device_id || typeof device_id !== 'string') {
          return reply.status(400).send({
            error: 'Invalid device_id',
            message: 'device_id is required and must be a string',
          });
        }

        await playbackService.transferPlayback(userId, device_id, play);

        return { success: true, message: 'Playback transferred' };
      } catch (error) {
        const err = error as Error;
        console.error('Transfer playback error:', err);

        if (err.message.includes('No valid Spotify access token')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return reply.status(500).send({
          error: 'Failed to transfer playback',
          message: err.message,
        });
      }
    }
  );

  /**
   * PUT /api/playback/repeat
   * Set repeat mode
   * Body: { state: 'off' | 'track' | 'context', device_id?: string }
   * Requires authentication and Spotify Premium
   */
  fastify.put<{
    Body: { state: 'off' | 'track' | 'context'; device_id?: string };
  }>(
    '/repeat',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const { state, device_id } = request.body;

        if (!['off', 'track', 'context'].includes(state)) {
          return reply.status(400).send({
            error: 'Invalid state',
            message: 'state must be one of: off, track, context',
          });
        }

        await playbackService.setRepeatMode(userId, state, device_id);

        return { success: true, message: 'Repeat mode set' };
      } catch (error) {
        const err = error as Error;
        console.error('Set repeat mode error:', err);

        if (err.message.includes('No valid Spotify access token')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return reply.status(500).send({
          error: 'Failed to set repeat mode',
          message: err.message,
        });
      }
    }
  );

  /**
   * PUT /api/playback/shuffle
   * Toggle shuffle mode
   * Body: { state: boolean, device_id?: string }
   * Requires authentication and Spotify Premium
   */
  fastify.put<{
    Body: { state: boolean; device_id?: string };
  }>(
    '/shuffle',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const { state, device_id } = request.body;

        if (typeof state !== 'boolean') {
          return reply.status(400).send({
            error: 'Invalid state',
            message: 'state must be a boolean',
          });
        }

        await playbackService.setShuffleMode(userId, state, device_id);

        return { success: true, message: 'Shuffle mode set' };
      } catch (error) {
        const err = error as Error;
        console.error('Set shuffle mode error:', err);

        if (err.message.includes('No valid Spotify access token')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return reply.status(500).send({
          error: 'Failed to set shuffle mode',
          message: err.message,
        });
      }
    }
  );
}
