import { getValidAccessToken } from './spotify-auth.service.js';

const SPOTIFY_PLAYER_API = 'https://api.spotify.com/v1/me/player';

// Types for Spotify Web API responses
export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number | null;
}

export interface SpotifyDevicesResponse {
  devices: SpotifyDevice[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: Array<{
    id: string;
    name: string;
    uri: string;
  }>;
  album: {
    id: string;
    name: string;
    uri: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaybackContext {
  type: 'album' | 'artist' | 'playlist' | 'show';
  href: string;
  external_urls: {
    spotify: string;
  };
  uri: string;
}

export interface SpotifyPlaybackState {
  device: SpotifyDevice;
  repeat_state: 'off' | 'track' | 'context';
  shuffle_state: boolean;
  context: SpotifyPlaybackContext | null;
  timestamp: number;
  progress_ms: number | null;
  is_playing: boolean;
  item: SpotifyTrack | null;
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
}

export interface PlaybackControlParams {
  uris?: string[];
  context_uri?: string;
  device_id?: string;
  position_ms?: number;
  offset?: {
    position?: number;
    uri?: string;
  };
}

/**
 * Make authenticated request to Spotify Player API
 */
async function makeSpotifyPlayerRequest(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    throw new Error('No valid Spotify access token available');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${SPOTIFY_PLAYER_API}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

/**
 * Get current playback state
 */
export async function getCurrentPlaybackState(
  userId: string
): Promise<SpotifyPlaybackState | null> {
  try {
    const response = await makeSpotifyPlayerRequest(userId, '');

    // 204 No Content means no active playback
    if (response.status === 204) {
      return null;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get playback state: ${error}`);
    }

    return response.json() as Promise<SpotifyPlaybackState>;
  } catch (error) {
    console.error('Get playback state error:', error);
    throw error;
  }
}

/**
 * Get available devices
 */
export async function getAvailableDevices(
  userId: string
): Promise<SpotifyDevicesResponse> {
  try {
    const response = await makeSpotifyPlayerRequest(userId, '/devices');

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get devices: ${error}`);
    }

    return response.json() as Promise<SpotifyDevicesResponse>;
  } catch (error) {
    console.error('Get devices error:', error);
    throw error;
  }
}

/**
 * Start or resume playback
 */
export async function startPlayback(
  userId: string,
  params?: PlaybackControlParams
): Promise<void> {
  try {
    const endpoint = params?.device_id
      ? `/play?device_id=${params.device_id}`
      : '/play';

    const body: Record<string, unknown> = {};

    if (params?.uris) {
      body.uris = params.uris;
    }

    if (params?.context_uri) {
      body.context_uri = params.context_uri;
    }

    if (params?.position_ms !== undefined) {
      body.position_ms = params.position_ms;
    }

    if (params?.offset) {
      body.offset = params.offset;
    }

    const response = await makeSpotifyPlayerRequest(userId, endpoint, {
      method: 'PUT',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    // 204 No Content is success for playback control
    if (response.status === 204 || response.ok) {
      return;
    }

    const error = await response.text();
    throw new Error(`Failed to start playback: ${error}`);
  } catch (error) {
    console.error('Start playback error:', error);
    throw error;
  }
}

/**
 * Pause playback
 */
export async function pausePlayback(
  userId: string,
  deviceId?: string
): Promise<void> {
  try {
    const endpoint = deviceId ? `/pause?device_id=${deviceId}` : '/pause';

    const response = await makeSpotifyPlayerRequest(userId, endpoint, {
      method: 'PUT',
    });

    if (response.status === 204 || response.ok) {
      return;
    }

    const error = await response.text();
    throw new Error(`Failed to pause playback: ${error}`);
  } catch (error) {
    console.error('Pause playback error:', error);
    throw error;
  }
}

/**
 * Skip to next track
 */
export async function skipToNext(
  userId: string,
  deviceId?: string
): Promise<void> {
  try {
    const endpoint = deviceId ? `/next?device_id=${deviceId}` : '/next';

    const response = await makeSpotifyPlayerRequest(userId, endpoint, {
      method: 'POST',
    });

    if (response.status === 204 || response.ok) {
      return;
    }

    const error = await response.text();
    throw new Error(`Failed to skip to next track: ${error}`);
  } catch (error) {
    console.error('Skip to next error:', error);
    throw error;
  }
}

/**
 * Skip to previous track
 */
export async function skipToPrevious(
  userId: string,
  deviceId?: string
): Promise<void> {
  try {
    const endpoint = deviceId ? `/previous?device_id=${deviceId}` : '/previous';

    const response = await makeSpotifyPlayerRequest(userId, endpoint, {
      method: 'POST',
    });

    if (response.status === 204 || response.ok) {
      return;
    }

    const error = await response.text();
    throw new Error(`Failed to skip to previous track: ${error}`);
  } catch (error) {
    console.error('Skip to previous error:', error);
    throw error;
  }
}

/**
 * Seek to position in currently playing track
 */
export async function seekToPosition(
  userId: string,
  positionMs: number,
  deviceId?: string
): Promise<void> {
  try {
    let endpoint = `/seek?position_ms=${positionMs}`;
    if (deviceId) {
      endpoint += `&device_id=${deviceId}`;
    }

    const response = await makeSpotifyPlayerRequest(userId, endpoint, {
      method: 'PUT',
    });

    if (response.status === 204 || response.ok) {
      return;
    }

    const error = await response.text();
    throw new Error(`Failed to seek to position: ${error}`);
  } catch (error) {
    console.error('Seek to position error:', error);
    throw error;
  }
}

/**
 * Set playback volume
 */
export async function setPlaybackVolume(
  userId: string,
  volumePercent: number,
  deviceId?: string
): Promise<void> {
  try {
    // Validate volume is between 0 and 100
    const volume = Math.max(0, Math.min(100, volumePercent));

    let endpoint = `/volume?volume_percent=${volume}`;
    if (deviceId) {
      endpoint += `&device_id=${deviceId}`;
    }

    const response = await makeSpotifyPlayerRequest(userId, endpoint, {
      method: 'PUT',
    });

    if (response.status === 204 || response.ok) {
      return;
    }

    const error = await response.text();
    throw new Error(`Failed to set volume: ${error}`);
  } catch (error) {
    console.error('Set volume error:', error);
    throw error;
  }
}

/**
 * Transfer playback to a different device
 */
export async function transferPlayback(
  userId: string,
  deviceId: string,
  play?: boolean
): Promise<void> {
  try {
    const response = await makeSpotifyPlayerRequest(userId, '', {
      method: 'PUT',
      body: JSON.stringify({
        device_ids: [deviceId],
        play: play !== undefined ? play : false,
      }),
    });

    if (response.status === 204 || response.ok) {
      return;
    }

    const error = await response.text();
    throw new Error(`Failed to transfer playback: ${error}`);
  } catch (error) {
    console.error('Transfer playback error:', error);
    throw error;
  }
}

/**
 * Set repeat mode
 */
export async function setRepeatMode(
  userId: string,
  state: 'off' | 'track' | 'context',
  deviceId?: string
): Promise<void> {
  try {
    let endpoint = `/repeat?state=${state}`;
    if (deviceId) {
      endpoint += `&device_id=${deviceId}`;
    }

    const response = await makeSpotifyPlayerRequest(userId, endpoint, {
      method: 'PUT',
    });

    if (response.status === 204 || response.ok) {
      return;
    }

    const error = await response.text();
    throw new Error(`Failed to set repeat mode: ${error}`);
  } catch (error) {
    console.error('Set repeat mode error:', error);
    throw error;
  }
}

/**
 * Toggle shuffle mode
 */
export async function setShuffleMode(
  userId: string,
  state: boolean,
  deviceId?: string
): Promise<void> {
  try {
    let endpoint = `/shuffle?state=${state}`;
    if (deviceId) {
      endpoint += `&device_id=${deviceId}`;
    }

    const response = await makeSpotifyPlayerRequest(userId, endpoint, {
      method: 'PUT',
    });

    if (response.status === 204 || response.ok) {
      return;
    }

    const error = await response.text();
    throw new Error(`Failed to set shuffle mode: ${error}`);
  } catch (error) {
    console.error('Set shuffle mode error:', error);
    throw error;
  }
}
