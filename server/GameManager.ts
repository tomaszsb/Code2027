// server/GameManager.ts

import { v4 as uuidv4 } from 'uuid';
import { GameInstanceFactory } from '../src/services/GameInstanceFactory';
import { IServiceContainer } from '../src/types/ServiceContracts';
import { GameState } from '../src/types/StateTypes';
import { GameMetadata, PlayerSession } from './types/ServerTypes';

/**
 * GameManager handles the lifecycle of multiple concurrent game instances.
 *
 * Responsibilities:
 * - Create and destroy game instances
 * - Track active games and their metadata
 * - Manage player sessions and authentication
 * - Route actions to the correct game instance
 * - Clean up abandoned games
 */
export class GameManager {
  private games: Map<string, IServiceContainer> = new Map();
  private gameMetadata: Map<string, GameMetadata> = new Map();
  private playerSessions: Map<string, PlayerSession> = new Map(); // sessionToken -> PlayerSession
  private playerToGame: Map<string, string> = new Map(); // playerId -> gameId
  private factory: GameInstanceFactory;

  // Configuration
  private readonly MAX_GAMES = 100; // Limit concurrent games
  private readonly GAME_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours

  constructor() {
    this.factory = new GameInstanceFactory();

    // Start cleanup task to remove abandoned games
    this.startCleanupTask();
  }

  /**
   * Create a new game instance with the first player
   */
  createGame(playerName: string, socketId: string): {
    gameId: string;
    playerId: string;
    sessionToken: string;
    gameState: GameState;
  } {
    // Check game limit
    if (this.games.size >= this.MAX_GAMES) {
      throw new Error(`Maximum number of games (${this.MAX_GAMES}) reached`);
    }

    // Generate game ID and create game instance
    const gameId = uuidv4();
    const services = this.factory.createGameInstance(gameId);

    // Add first player to the game
    const gameState = services.stateService.addPlayer(playerName);
    const player = gameState.players[0];

    // Generate session token
    const sessionToken = this.generateSessionToken();

    // Store game instance and metadata
    this.games.set(gameId, services);
    this.gameMetadata.set(gameId, {
      gameId,
      createdAt: new Date(),
      playerCount: 1,
      status: 'setup',
      lastActivity: new Date()
    });

    // Store player session
    this.playerSessions.set(sessionToken, {
      gameId,
      playerId: player.id,
      playerName,
      sessionToken,
      socketId,
      createdAt: new Date(),
      lastActivity: new Date()
    });

    this.playerToGame.set(player.id, gameId);

    console.log(`✅ Game created: ${gameId} with player ${playerName} (${player.id})`);

    return {
      gameId,
      playerId: player.id,
      sessionToken,
      gameState
    };
  }

  /**
   * Add a player to an existing game
   */
  joinGame(gameId: string, playerName: string, socketId: string): {
    playerId: string;
    sessionToken: string;
    gameState: GameState;
  } {
    const services = this.games.get(gameId);
    if (!services) {
      throw new Error(`Game ${gameId} not found`);
    }

    const metadata = this.gameMetadata.get(gameId);
    if (metadata?.status !== 'setup') {
      throw new Error('Cannot join game - game has already started');
    }

    // Check if player name already exists
    const currentState = services.stateService.getGameState();
    if (currentState.players.some(p => p.name === playerName)) {
      throw new Error(`Player name "${playerName}" is already taken in this game`);
    }

    // Add player to game
    const gameState = services.stateService.addPlayer(playerName);
    const player = gameState.players[gameState.players.length - 1];

    // Generate session token
    const sessionToken = this.generateSessionToken();

    // Store player session
    this.playerSessions.set(sessionToken, {
      gameId,
      playerId: player.id,
      playerName,
      sessionToken,
      socketId,
      createdAt: new Date(),
      lastActivity: new Date()
    });

    this.playerToGame.set(player.id, gameId);

    // Update metadata
    if (metadata) {
      metadata.playerCount = gameState.players.length;
      metadata.lastActivity = new Date();
    }

    console.log(`✅ Player ${playerName} (${player.id}) joined game ${gameId}`);

    return {
      playerId: player.id,
      sessionToken,
      gameState
    };
  }

  /**
   * Remove a player from a game
   */
  leaveGame(gameId: string, playerId: string): GameState {
    const services = this.games.get(gameId);
    if (!services) {
      throw new Error(`Game ${gameId} not found`);
    }

    const metadata = this.gameMetadata.get(gameId);
    if (metadata?.status !== 'setup') {
      throw new Error('Cannot leave game - game has already started');
    }

    // Remove player
    const gameState = services.stateService.removePlayer(playerId);

    // Clean up session
    const session = Array.from(this.playerSessions.values()).find(
      s => s.gameId === gameId && s.playerId === playerId
    );
    if (session) {
      this.playerSessions.delete(session.sessionToken);
    }

    this.playerToGame.delete(playerId);

    // Update metadata
    if (metadata) {
      metadata.playerCount = gameState.players.length;
      metadata.lastActivity = new Date();
    }

    // If no players left, delete the game
    if (gameState.players.length === 0) {
      this.deleteGame(gameId);
      console.log(`🗑️  Game ${gameId} deleted (no players remaining)`);
    }

    console.log(`✅ Player ${playerId} left game ${gameId}`);

    return gameState;
  }

  /**
   * Start a game (transition from setup to play phase)
   */
  startGame(gameId: string): GameState {
    const services = this.games.get(gameId);
    if (!services) {
      throw new Error(`Game ${gameId} not found`);
    }

    const metadata = this.gameMetadata.get(gameId);
    if (metadata?.status !== 'setup') {
      throw new Error('Game has already started');
    }

    // Start the game
    const gameState = services.stateService.startGame();

    // Update metadata
    if (metadata) {
      metadata.status = 'active';
      metadata.startedAt = new Date();
      metadata.lastActivity = new Date();
    }

    console.log(`🎮 Game ${gameId} started with ${gameState.players.length} players`);

    return gameState;
  }

  /**
   * Get game services by game ID
   */
  getGame(gameId: string): IServiceContainer | undefined {
    return this.games.get(gameId);
  }

  /**
   * Get game state by game ID
   */
  getGameState(gameId: string): GameState | undefined {
    const services = this.games.get(gameId);
    return services?.stateService.getGameState();
  }

  /**
   * Validate session token and return session info
   */
  validateSession(sessionToken: string): PlayerSession | null {
    const session = this.playerSessions.get(sessionToken);

    if (!session) {
      return null;
    }

    // Check if session has expired
    const now = new Date();
    const sessionAge = now.getTime() - session.lastActivity.getTime();

    if (sessionAge > this.SESSION_TIMEOUT_MS) {
      this.playerSessions.delete(sessionToken);
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();

    return session;
  }

  /**
   * Update socket ID for a session (used during reconnection)
   */
  updateSessionSocket(sessionToken: string, socketId: string): boolean {
    const session = this.playerSessions.get(sessionToken);
    if (!session) {
      return false;
    }

    session.socketId = socketId;
    session.lastActivity = new Date();

    return true;
  }

  /**
   * Get all active games (for admin/monitoring)
   */
  getActiveGames(): GameMetadata[] {
    return Array.from(this.gameMetadata.values());
  }

  /**
   * Get game metadata
   */
  getGameMetadata(gameId: string): GameMetadata | undefined {
    return this.gameMetadata.get(gameId);
  }

  /**
   * Delete a game instance
   */
  private deleteGame(gameId: string): void {
    // Clean up all player sessions for this game
    const sessionsToDelete: string[] = [];
    this.playerSessions.forEach((session, token) => {
      if (session.gameId === gameId) {
        sessionsToDelete.push(token);
        this.playerToGame.delete(session.playerId);
      }
    });

    sessionsToDelete.forEach(token => this.playerSessions.delete(token));

    // Delete game instance and metadata
    this.games.delete(gameId);
    this.gameMetadata.delete(gameId);
  }

  /**
   * Generate a unique session token
   */
  private generateSessionToken(): string {
    return `session_${uuidv4()}`;
  }

  /**
   * Cleanup task to remove abandoned games
   */
  private startCleanupTask(): void {
    setInterval(() => {
      const now = new Date();
      const gamesToDelete: string[] = [];

      this.gameMetadata.forEach((metadata, gameId) => {
        const age = now.getTime() - metadata.lastActivity.getTime();

        // Delete games that have been inactive for too long
        if (age > this.GAME_TIMEOUT_MS) {
          gamesToDelete.push(gameId);
        }
      });

      gamesToDelete.forEach(gameId => {
        console.log(`🗑️  Cleaning up abandoned game: ${gameId}`);
        this.deleteGame(gameId);
      });

      if (gamesToDelete.length > 0) {
        console.log(`🧹 Cleaned up ${gamesToDelete.length} abandoned games`);
      }
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Get statistics about the server
   */
  getStats(): {
    activeGames: number;
    totalPlayers: number;
    gamesInSetup: number;
    gamesInProgress: number;
    gamesCompleted: number;
  } {
    const metadata = Array.from(this.gameMetadata.values());

    return {
      activeGames: this.games.size,
      totalPlayers: this.playerSessions.size,
      gamesInSetup: metadata.filter(m => m.status === 'setup').length,
      gamesInProgress: metadata.filter(m => m.status === 'active').length,
      gamesCompleted: metadata.filter(m => m.status === 'completed').length
    };
  }
}
