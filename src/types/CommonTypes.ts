// src/types/CommonTypes.ts

/**
 * Represents a decision point for a player.
 * This is used when a game event requires player input to proceed.
 */
export interface Choice {
  id: string;
  playerId: string;
  type: 'MOVEMENT' | 'PLAYER_TARGET' | 'GENERAL';
  prompt: string;
  options: Array<{ id: string; label: string; }>;
}