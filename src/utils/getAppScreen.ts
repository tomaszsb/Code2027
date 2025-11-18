// src/utils/getAppScreen.ts

import { GameState } from '../types/StateTypes';

export type AppScreen = 'SETUP' | 'GAME_PANEL' | 'GAME_BOARD';

export interface ScreenDecision {
  screen: AppScreen;
  playerId: string | null;
}

/**
 * Determine which screen to show based on game state and URL parameters
 *
 * This function implements the routing logic for the multi-player QR code feature:
 * - If game not started → Show setup screen
 * - If game in progress + valid playerId → Show that player's panel
 * - If game in progress + no playerId → Show current player's panel
 * - If game in progress + invalid playerId → Show setup screen with warning
 *
 * @param gameState - Current game state from StateService
 * @param urlPlayerId - Optional player ID from URL parameter (?playerId=XXX)
 * @returns Screen decision with screen type and playerId to display
 */
export function getAppScreen(
  gameState: GameState,
  urlPlayerId?: string | null
): ScreenDecision {
  // Check if game has started
  const gameStarted = gameState.gamePhase === 'PLAY' || gameState.gamePhase === 'END';

  // If no game started, always show setup
  if (!gameStarted) {
    return { screen: 'SETUP', playerId: null };
  }

  // Game is in progress
  if (urlPlayerId) {
    // Verify this player exists in the game
    const playerExists = gameState.players.some(p => p.id === urlPlayerId);

    if (playerExists) {
      // Show this player's panel
      console.log(`🎮 Routing to player panel for: ${urlPlayerId}`);
      return { screen: 'GAME_PANEL', playerId: urlPlayerId };
    } else {
      // Invalid player ID - show setup with warning
      console.warn(`⚠️ Player ${urlPlayerId} not found in game. Available players:`,
        gameState.players.map(p => `${p.name} (${p.id})`).join(', '));
      return { screen: 'SETUP', playerId: null };
    }
  }

  // No playerId provided, show current player's panel (default behavior)
  const currentPlayerId = gameState.currentPlayerId || gameState.players[0]?.id || null;

  if (currentPlayerId) {
    console.log(`🎮 No playerId in URL, showing current player: ${currentPlayerId}`);
    return { screen: 'GAME_PANEL', playerId: currentPlayerId };
  }

  // Fallback to setup if no valid player found
  return { screen: 'SETUP', playerId: null };
}
