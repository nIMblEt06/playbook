import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as spotifyAuthService from '../services/spotify-auth.service.js';

// Frontend URL for redirects (use 127.0.0.1 for Spotify OAuth compatibility)
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://trackd.site';

export async function spotifyAuthRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/auth/spotify
   * Initiates Spotify OAuth flow - redirects to Spotify login
   */
  fastify.get('/api/auth/spotify', async (request: FastifyRequest, reply: FastifyReply) => {
    // Generate a random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);

    // Store state in a cookie for validation on callback
    reply.setCookie('spotify_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    const authUrl = spotifyAuthService.getAuthUrl(state);
    return reply.redirect(authUrl);
  });

  /**
   * GET /api/auth/spotify/callback
   * Handles Spotify OAuth callback
   */
  fastify.get(
    '/api/auth/spotify/callback',
    async (
      request: FastifyRequest<{
        Querystring: { code?: string; error?: string; state?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { code, error, state } = request.query;

      // Check for errors from Spotify
      if (error) {
        console.error('Spotify OAuth error:', error);
        return reply.redirect(`${FRONTEND_URL}/login?error=spotify_denied`);
      }

      // Validate code
      if (!code) {
        return reply.redirect(`${FRONTEND_URL}/login?error=missing_code`);
      }

      // Validate state (CSRF protection)
      const storedState = request.cookies.spotify_auth_state;
      if (!state || state !== storedState) {
        return reply.redirect(`${FRONTEND_URL}/login?error=state_mismatch`);
      }

      // Clear the state cookie
      reply.clearCookie('spotify_auth_state', { path: '/' });

      try {
        // Exchange code for tokens
        const tokens = await spotifyAuthService.exchangeCode(code);

        // Get user profile from Spotify
        const profile = await spotifyAuthService.getSpotifyProfile(tokens.access_token);

        // Create or update user in database
        const user = await spotifyAuthService.createOrUpdateUser(tokens, profile);

        // Generate JWT for our app
        const jwtToken = fastify.jwt.sign(
          { userId: user.id, username: user.username },
          { expiresIn: '7d' }
        );

        // Redirect to frontend with token
        // The frontend callback page will store the token
        return reply.redirect(
          `${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(jwtToken)}`
        );
      } catch (err) {
        console.error('Spotify OAuth callback error:', err);
        return reply.redirect(`${FRONTEND_URL}/login?error=auth_failed`);
      }
    }
  );

  /**
   * POST /api/auth/spotify/refresh
   * Refreshes the user's Spotify access token
   * Requires authentication
   */
  fastify.post(
    '/api/auth/spotify/refresh',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const accessToken = await spotifyAuthService.getValidAccessToken(userId);

        if (!accessToken) {
          return reply.status(401).send({
            error: 'Token refresh failed',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return { success: true };
      } catch (error) {
        console.error('Token refresh error:', error);
        return reply.status(500).send({ error: 'Failed to refresh token' });
      }
    }
  );

  /**
   * GET /api/auth/spotify/token
   * Get current Spotify access token for Web Playback SDK
   * Requires authentication
   */
  fastify.get(
    '/api/auth/spotify/token',
    { preHandler: [fastify.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const accessToken = await spotifyAuthService.getValidAccessToken(userId);

        if (!accessToken) {
          return reply.status(401).send({
            error: 'No valid token',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return { access_token: accessToken };
      } catch (error) {
        console.error('Get token error:', error);
        return reply.status(500).send({ error: 'Failed to get token' });
      }
    }
  );

  /**
   * GET /api/spotify/me/playlists
   * Get current user's Spotify playlists
   * Requires authentication
   */
  fastify.get<{
    Querystring: { limit?: string; offset?: string };
  }>(
    '/api/spotify/me/playlists',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const userId = (request.user as { userId: string }).userId;
        const limit = parseInt(request.query.limit || '50', 10);
        const offset = parseInt(request.query.offset || '0', 10);

        const playlists = await spotifyAuthService.getUserSpotifyPlaylists(userId, limit, offset);

        if (!playlists) {
          return reply.status(401).send({
            error: 'Failed to fetch playlists',
            message: 'Please re-authenticate with Spotify',
          });
        }

        return playlists;
      } catch (error) {
        console.error('Get playlists error:', error);
        return reply.status(500).send({ error: 'Failed to get playlists' });
      }
    }
  );

}
