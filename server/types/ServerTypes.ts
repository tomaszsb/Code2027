// server/types/ServerTypes.ts

import { GameState } from '../../src/types/StateTypes';

/**
 * Events that clients can send to the server
 */
export interface ClientToServerEvents {
  'game:create': (playerName: string, callback: (response: GameCreatedResponse) => void) => void;
  'game:join': (gameId: string, playerName: string, callback: (response: GameJoinedResponse) => void) => void;
  'game:leave': (gameId: string, playerId: string, callback: (response: GameResponse) => void) => void;
  'game:action': (gameId: string, action: PlayerActionRequest, callback: (response: GameResponse) => void) => void;
  'game:reconnect': (sessionToken: string, callback: (response: ReconnectResponse) => void) => void;
  'game:start': (gameId: string, callback: (response: GameResponse) => void) => void;
}

/**
 * Events that server can send to clients
 */
export interface ServerToClientEvents {
  'game:state': (gameState: GameState) => void;
  'game:error': (error: ErrorResponse) => void;
  'player:joined': (playerInfo: PlayerJoinedInfo) => void;
  'player:left': (playerId: string, playerName: string) => void;
  'game:started': (gameState: GameState) => void;
}

/**
 * Inter-server events (for future scaling with multiple servers)
 */
export interface InterServerEvents {
  ping: () => void;
}

/**
 * Socket data attached to each connection
 */
export interface SocketData {
  gameId?: string;
  playerId?: string;
  sessionToken?: string;
}

/**
 * Player action request from client
 */
export interface PlayerActionRequest {
  type: 'ROLL_DICE' | 'MOVE' | 'DRAW_CARD' | 'END_TURN' | 'PLAY_CARD' | 'MAKE_CHOICE';
  playerId: string;
  sessionToken: string;
  expectedVersion: number; // For optimistic locking
  data?: any;
  timestamp: Date;
}

/**
 * Response when a game is created
 */
export interface GameCreatedResponse {
  success: boolean;
  gameId?: string;
  sessionToken?: string;
  playerId?: string;
  gameState?: GameState;
  error?: string;
}

/**
 * Response when joining a game
 */
export interface GameJoinedResponse {
  success: boolean;
  sessionToken?: string;
  playerId?: string;
  gameState?: GameState;
  error?: string;
}

/**
 * Generic game response
 */
export interface GameResponse {
  success: boolean;
  gameState?: GameState;
  error?: string;
}

/**
 * Response when reconnecting
 */
export interface ReconnectResponse {
  success: boolean;
  gameId?: string;
  playerId?: string;
  gameState?: GameState;
  error?: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Info sent when a player joins
 */
export interface PlayerJoinedInfo {
  playerId: string;
  playerName: string;
  color?: string;
  avatar?: string;
}

/**
 * Session data stored for each player
 */
export interface PlayerSession {
  gameId: string;
  playerId: string;
  playerName: string;
  sessionToken: string;
  socketId: string;
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Game metadata tracked by GameManager
 */
export interface GameMetadata {
  gameId: string;
  createdAt: Date;
  startedAt?: Date;
  playerCount: number;
  status: 'setup' | 'active' | 'completed';
  lastActivity: Date;
}
