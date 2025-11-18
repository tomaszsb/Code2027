// src/utils/getAppScreen.ts

/**
 * Routing logic for determining which screen to show based on URL parameters
 * Supports multi-device play via QR codes with player-specific views
 */

export type AppScreen = 'setup' | 'player' | 'game';

export interface AppScreenResult {
  /** Which screen/view to display */
  screen: AppScreen;
  /** Player ID from URL (if accessing player-specific view) */
  playerId?: string;
  /** Whether this is a valid player ID (checked against game state) */
  isValidPlayer?: boolean;
}

/**
 * Determine which screen to show based on URL parameters and game state
 *
 * Routing logic:
 * - No playerId parameter → show normal game view (desktop experience)
 * - playerId parameter + valid ID → show player-specific panel (mobile experience)
 * - playerId parameter + invalid ID → show game view with warning
 *
 * @param urlSearchParams URL search parameters (e.g., from window.location.search)
 * @param gamePhase Current game phase from state ('SETUP' | 'PLAY' | 'END')
 * @param playerIds List of valid player IDs from game state
 * @returns Object with screen type and playerId (if applicable)
 *
 * @example
 * // Desktop: http://192.168.1.100:3000
 * getAppScreen(new URLSearchParams(''), 'PLAY', ['p1', 'p2'])
 * // => { screen: 'game', playerId: undefined }
 *
 * @example
 * // Phone scans QR: http://192.168.1.100:3000?playerId=p1
 * getAppScreen(new URLSearchParams('?playerId=p1'), 'PLAY', ['p1', 'p2'])
 * // => { screen: 'player', playerId: 'p1', isValidPlayer: true }
 *
 * @example
 * // Invalid player ID
 * getAppScreen(new URLSearchParams('?playerId=invalid'), 'PLAY', ['p1', 'p2'])
 * // => { screen: 'game', playerId: 'invalid', isValidPlayer: false }
 */
export function getAppScreen(
  urlSearchParams: URLSearchParams,
  gamePhase: 'SETUP' | 'PLAY' | 'END',
  playerIds: string[]
): AppScreenResult {
  const playerId = urlSearchParams.get('playerId');

  // No playerId parameter → show normal game view
  if (!playerId) {
    return {
      screen: 'game',
      playerId: undefined
    };
  }

  // playerId parameter provided → check if it's valid
  const isValidPlayer = playerIds.includes(playerId);

  // Valid player ID + game in PLAY phase → show player-specific panel
  if (isValidPlayer && gamePhase === 'PLAY') {
    return {
      screen: 'player',
      playerId,
      isValidPlayer: true
    };
  }

  // Valid player ID but game in SETUP → show setup screen
  // (This handles the case where QR is scanned before game starts)
  if (isValidPlayer && gamePhase === 'SETUP') {
    return {
      screen: 'setup',
      playerId,
      isValidPlayer: true
    };
  }

  // Invalid player ID → show game view (default fallback)
  if (!isValidPlayer) {
    console.warn(`Invalid player ID in URL: ${playerId}. Available players:`, playerIds);
    return {
      screen: 'game',
      playerId,
      isValidPlayer: false
    };
  }

  // Fallback: show game view
  return {
    screen: 'game',
    playerId
  };
}

/**
 * Read URL parameters from current window location
 * Convenience wrapper around URLSearchParams
 *
 * @returns URLSearchParams object from current URL
 */
export function getURLParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}
