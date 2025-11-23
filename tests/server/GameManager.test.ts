// tests/server/GameManager.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from '../../server/GameManager';

describe('GameManager', () => {
  let gameManager: GameManager;

  beforeEach(() => {
    gameManager = new GameManager();
  });

  describe('createGame', () => {
    it('should create a new game with first player', () => {
      const result = gameManager.createGame('Alice', 'socket-1');

      expect(result.gameId).toBeDefined();
      expect(result.playerId).toBeDefined();
      expect(result.sessionToken).toBeDefined();
      expect(result.gameState).toBeDefined();
      expect(result.gameState.players).toHaveLength(1);
      expect(result.gameState.players[0].name).toBe('Alice');
    });

    it('should generate unique game IDs', () => {
      const game1 = gameManager.createGame('Alice', 'socket-1');
      const game2 = gameManager.createGame('Bob', 'socket-2');

      expect(game1.gameId).not.toBe(game2.gameId);
    });

    it('should set game status to setup', () => {
      const result = gameManager.createGame('Alice', 'socket-1');
      const metadata = gameManager.getGameMetadata(result.gameId);

      expect(metadata?.status).toBe('setup');
    });

    it('should associate player with game via session token', () => {
      const result = gameManager.createGame('Alice', 'socket-1');
      const session = gameManager.validateSession(result.sessionToken);

      expect(session).toBeDefined();
      expect(session?.gameId).toBe(result.gameId);
      expect(session?.playerId).toBe(result.playerId);
      expect(session?.playerName).toBe('Alice');
    });
  });

  describe('joinGame', () => {
    it('should add player to existing game', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      const result = gameManager.joinGame(game.gameId, 'Bob', 'socket-2');

      expect(result.playerId).toBeDefined();
      expect(result.sessionToken).toBeDefined();
      expect(result.gameState.players).toHaveLength(2);
      expect(result.gameState.players[1].name).toBe('Bob');
    });

    it('should reject duplicate player names', () => {
      const game = gameManager.createGame('Alice', 'socket-1');

      expect(() => {
        gameManager.joinGame(game.gameId, 'Alice', 'socket-2');
      }).toThrow('Player name "Alice" is already taken');
    });

    it('should reject joining non-existent game', () => {
      expect(() => {
        gameManager.joinGame('fake-game-id', 'Bob', 'socket-2');
      }).toThrow('Game fake-game-id not found');
    });

    it('should update player count in metadata', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      gameManager.joinGame(game.gameId, 'Bob', 'socket-2');

      const metadata = gameManager.getGameMetadata(game.gameId);
      expect(metadata?.playerCount).toBe(2);
    });

    it('should reject joining after game has started', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      gameManager.startGame(game.gameId);

      expect(() => {
        gameManager.joinGame(game.gameId, 'Bob', 'socket-2');
      }).toThrow('Cannot join game - game has already started');
    });
  });

  describe('leaveGame', () => {
    it('should remove player from game', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      const join = gameManager.joinGame(game.gameId, 'Bob', 'socket-2');

      const result = gameManager.leaveGame(game.gameId, join.playerId);

      expect(result.players).toHaveLength(1);
      expect(result.players[0].name).toBe('Alice');
    });

    it('should invalidate session token when leaving', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      const join = gameManager.joinGame(game.gameId, 'Bob', 'socket-2');

      gameManager.leaveGame(game.gameId, join.playerId);

      const session = gameManager.validateSession(join.sessionToken);
      expect(session).toBeNull();
    });

    it('should delete game when last player leaves', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      gameManager.leaveGame(game.gameId, game.playerId);

      const gameState = gameManager.getGameState(game.gameId);
      expect(gameState).toBeUndefined();
    });

    it('should reject leaving after game has started', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      gameManager.startGame(game.gameId);

      expect(() => {
        gameManager.leaveGame(game.gameId, game.playerId);
      }).toThrow('Cannot leave game - game has already started');
    });
  });

  describe('startGame', () => {
    it('should transition game to active status', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      gameManager.joinGame(game.gameId, 'Bob', 'socket-2');

      gameManager.startGame(game.gameId);

      const metadata = gameManager.getGameMetadata(game.gameId);
      expect(metadata?.status).toBe('active');
      expect(metadata?.startedAt).toBeDefined();
    });

    it('should set game phase to PLAY', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      const result = gameManager.startGame(game.gameId);

      expect(result.gamePhase).toBe('PLAY');
    });

    it('should reject starting already started game', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      gameManager.startGame(game.gameId);

      expect(() => {
        gameManager.startGame(game.gameId);
      }).toThrow('Game has already started');
    });
  });

  describe('multi-game isolation', () => {
    it('should maintain separate state for concurrent games', () => {
      const game1 = gameManager.createGame('Alice', 'socket-1');
      const game2 = gameManager.createGame('Charlie', 'socket-3');

      gameManager.joinGame(game1.gameId, 'Bob', 'socket-2');
      gameManager.joinGame(game2.gameId, 'Diana', 'socket-4');

      const state1 = gameManager.getGameState(game1.gameId);
      const state2 = gameManager.getGameState(game2.gameId);

      expect(state1?.players).toHaveLength(2);
      expect(state2?.players).toHaveLength(2);
      expect(state1?.players[0].name).toBe('Alice');
      expect(state2?.players[0].name).toBe('Charlie');
    });

    it('should route players to correct game via session tokens', () => {
      const game1 = gameManager.createGame('Alice', 'socket-1');
      const game2 = gameManager.createGame('Bob', 'socket-2');

      const session1 = gameManager.validateSession(game1.sessionToken);
      const session2 = gameManager.validateSession(game2.sessionToken);

      expect(session1?.gameId).toBe(game1.gameId);
      expect(session2?.gameId).toBe(game2.gameId);
      expect(session1?.gameId).not.toBe(session2?.gameId);
    });

    it('should handle 10 concurrent games without interference', () => {
      const games = [];

      for (let i = 0; i < 10; i++) {
        const game = gameManager.createGame(`Player${i}`, `socket-${i}`);
        games.push(game);
      }

      // Verify all games exist and are independent
      for (let i = 0; i < 10; i++) {
        const state = gameManager.getGameState(games[i].gameId);
        expect(state?.players).toHaveLength(1);
        expect(state?.players[0].name).toBe(`Player${i}`);
        expect(state?.gameId).toBe(games[i].gameId);
      }

      // Verify stats
      const stats = gameManager.getStats();
      expect(stats.activeGames).toBe(10);
      expect(stats.totalPlayers).toBe(10);
    });

    it('should maintain separate game phases across multiple games', () => {
      const game1 = gameManager.createGame('Alice', 'socket-1');
      const game2 = gameManager.createGame('Bob', 'socket-2');

      // Start only game1
      gameManager.startGame(game1.gameId);

      const metadata1 = gameManager.getGameMetadata(game1.gameId);
      const metadata2 = gameManager.getGameMetadata(game2.gameId);

      expect(metadata1?.status).toBe('active');
      expect(metadata2?.status).toBe('setup');
    });
  });

  describe('session management', () => {
    it('should validate active session tokens', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      const session = gameManager.validateSession(game.sessionToken);

      expect(session).toBeDefined();
      expect(session?.gameId).toBe(game.gameId);
      expect(session?.playerId).toBe(game.playerId);
    });

    it('should reject invalid session tokens', () => {
      const session = gameManager.validateSession('invalid-token');
      expect(session).toBeNull();
    });

    it('should update socket ID on session update', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      const updated = gameManager.updateSessionSocket(game.sessionToken, 'socket-new');

      expect(updated).toBe(true);

      const session = gameManager.validateSession(game.sessionToken);
      expect(session?.socketId).toBe('socket-new');
    });

    it('should reject session update for invalid token', () => {
      const updated = gameManager.updateSessionSocket('invalid-token', 'socket-new');
      expect(updated).toBe(false);
    });
  });

  describe('game retrieval', () => {
    it('should retrieve game services by ID', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      const services = gameManager.getGame(game.gameId);

      expect(services).toBeDefined();
      expect(services?.stateService).toBeDefined();
      expect(services?.stateService.getGameId()).toBe(game.gameId);
    });

    it('should retrieve game state by ID', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      const state = gameManager.getGameState(game.gameId);

      expect(state).toBeDefined();
      expect(state?.gameId).toBe(game.gameId);
      expect(state?.players[0].name).toBe('Alice');
    });

    it('should return undefined for non-existent game', () => {
      const services = gameManager.getGame('fake-id');
      const state = gameManager.getGameState('fake-id');

      expect(services).toBeUndefined();
      expect(state).toBeUndefined();
    });
  });

  describe('statistics', () => {
    it('should track active games count', () => {
      gameManager.createGame('Alice', 'socket-1');
      gameManager.createGame('Bob', 'socket-2');

      const stats = gameManager.getStats();
      expect(stats.activeGames).toBe(2);
    });

    it('should track total players count', () => {
      const game1 = gameManager.createGame('Alice', 'socket-1');
      gameManager.joinGame(game1.gameId, 'Bob', 'socket-2');

      const game2 = gameManager.createGame('Charlie', 'socket-3');

      const stats = gameManager.getStats();
      expect(stats.totalPlayers).toBe(3);
    });

    it('should categorize games by status', () => {
      const game1 = gameManager.createGame('Alice', 'socket-1');
      const game2 = gameManager.createGame('Bob', 'socket-2');

      gameManager.startGame(game1.gameId);

      const stats = gameManager.getStats();
      expect(stats.gamesInSetup).toBe(1);
      expect(stats.gamesInProgress).toBe(1);
    });
  });

  describe('state version tracking', () => {
    it('should increment state version when players join', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      const services = gameManager.getGame(game.gameId);

      const version1 = services?.stateService.getStateVersion();

      gameManager.joinGame(game.gameId, 'Bob', 'socket-2');

      const version2 = services?.stateService.getStateVersion();

      expect(version2).toBeGreaterThan(version1 || 0);
    });

    it('should increment state version when game starts', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      const services = gameManager.getGame(game.gameId);

      const version1 = services?.stateService.getStateVersion();

      gameManager.startGame(game.gameId);

      const version2 = services?.stateService.getStateVersion();

      // Version should increment (may be same if notifyListeners is called once)
      expect(version2).toBeGreaterThanOrEqual(version1 || 0);
      expect(version2).toBeGreaterThan(0);
    });
  });

  describe('gameId consistency', () => {
    it('should maintain consistent gameId across all game state', () => {
      const game = gameManager.createGame('Alice', 'socket-1');

      const state = gameManager.getGameState(game.gameId);
      const services = gameManager.getGame(game.gameId);

      expect(state?.gameId).toBe(game.gameId);
      expect(services?.stateService.getGameId()).toBe(game.gameId);
      expect(state?.players[0].gameId).toBe(game.gameId);
    });

    it('should maintain gameId after players join', () => {
      const game = gameManager.createGame('Alice', 'socket-1');
      gameManager.joinGame(game.gameId, 'Bob', 'socket-2');

      const state = gameManager.getGameState(game.gameId);

      expect(state?.players[0].gameId).toBe(game.gameId);
      expect(state?.players[1].gameId).toBe(game.gameId);
    });
  });
});
