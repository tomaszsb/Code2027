// tests/services/GameInstanceFactory.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { GameInstanceFactory } from '../../src/services/GameInstanceFactory';
import { IServiceContainer } from '../../src/types/ServiceContracts';

describe('GameInstanceFactory', () => {
  let factory: GameInstanceFactory;

  beforeEach(() => {
    factory = new GameInstanceFactory();
  });

  describe('createGameInstance', () => {
    it('should create a service container with provided gameId', () => {
      const gameId = 'test-game-123';
      const services = factory.createGameInstance(gameId);

      expect(services).toBeDefined();
      expect(services.stateService).toBeDefined();
      expect(services.dataService).toBeDefined();
      expect(services.turnService).toBeDefined();
      expect(services.cardService).toBeDefined();
    });

    it('should associate gameId with StateService', () => {
      const gameId = 'test-game-456';
      const services = factory.createGameInstance(gameId);

      const retrievedGameId = services.stateService.getGameId();
      expect(retrievedGameId).toBe(gameId);
    });

    it('should initialize GameState with correct gameId', () => {
      const gameId = 'test-game-789';
      const services = factory.createGameInstance(gameId);

      const gameState = services.stateService.getGameState();
      expect(gameState.gameId).toBe(gameId);
    });

    it('should initialize GameState with version 1', () => {
      const services = factory.createGameInstance('test-game');

      const gameState = services.stateService.getGameState();
      expect(gameState.stateVersion).toBe(1);
    });

    it('should initialize GameState with null serverSessionId (local mode)', () => {
      const services = factory.createGameInstance('test-game');

      const gameState = services.stateService.getGameState();
      expect(gameState.serverSessionId).toBeNull();
    });

    it('should initialize GameState with current lastModified timestamp', () => {
      const before = new Date();
      const services = factory.createGameInstance('test-game');
      const after = new Date();

      const gameState = services.stateService.getGameState();
      const lastModified = gameState.lastModified;

      expect(lastModified).toBeInstanceOf(Date);
      expect(lastModified.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(lastModified.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('createGameInstanceWithId', () => {
    it('should generate a unique gameId', () => {
      const [gameId, services] = factory.createGameInstanceWithId();

      expect(gameId).toBeDefined();
      expect(typeof gameId).toBe('string');
      expect(gameId).toMatch(/^game_\d+_[a-z0-9]+$/);
    });

    it('should return gameId matching StateService gameId', () => {
      const [gameId, services] = factory.createGameInstanceWithId();

      const retrievedGameId = services.stateService.getGameId();
      expect(retrievedGameId).toBe(gameId);
    });

    it('should generate different gameIds for multiple instances', () => {
      const [gameId1] = factory.createGameInstanceWithId();
      const [gameId2] = factory.createGameInstanceWithId();

      expect(gameId1).not.toBe(gameId2);
    });
  });

  describe('service isolation', () => {
    it('should create isolated StateService instances for different games', () => {
      const services1 = factory.createGameInstance('game-1');
      const services2 = factory.createGameInstance('game-2');

      // Services should be different instances
      expect(services1.stateService).not.toBe(services2.stateService);

      // Add player to game 1
      services1.stateService.addPlayer('Player 1');

      // Game 2 should not be affected
      const game1State = services1.stateService.getGameState();
      const game2State = services2.stateService.getGameState();

      expect(game1State.players.length).toBe(1);
      expect(game2State.players.length).toBe(0);
    });

    it('should create isolated TurnService instances for different games', () => {
      const services1 = factory.createGameInstance('game-1');
      const services2 = factory.createGameInstance('game-2');

      expect(services1.turnService).not.toBe(services2.turnService);
    });

    it('should maintain separate state for concurrent games', () => {
      const services1 = factory.createGameInstance('game-1');
      const services2 = factory.createGameInstance('game-2');

      // Set up game 1
      services1.stateService.addPlayer('Alice');
      services1.stateService.addPlayer('Bob');

      // Set up game 2
      services2.stateService.addPlayer('Charlie');

      // Verify isolation
      expect(services1.stateService.getGameState().players).toHaveLength(2);
      expect(services2.stateService.getGameState().players).toHaveLength(1);

      expect(services1.stateService.getGameState().players[0].name).toBe('Alice');
      expect(services2.stateService.getGameState().players[0].name).toBe('Charlie');
    });
  });

  describe('player gameId association', () => {
    it('should associate players with correct gameId when added', () => {
      const gameId = 'test-game-player';
      const services = factory.createGameInstance(gameId);

      services.stateService.addPlayer('Test Player');

      const gameState = services.stateService.getGameState();
      const player = gameState.players[0];

      expect(player.gameId).toBe(gameId);
    });

    it('should set sessionId to null for local mode players', () => {
      const services = factory.createGameInstance('test-game');

      services.stateService.addPlayer('Test Player');

      const gameState = services.stateService.getGameState();
      const player = gameState.players[0];

      expect(player.sessionId).toBeNull();
    });

    it('should not set deviceId for local mode players', () => {
      const services = factory.createGameInstance('test-game');

      services.stateService.addPlayer('Test Player');

      const gameState = services.stateService.getGameState();
      const player = gameState.players[0];

      expect(player.deviceId).toBeUndefined();
    });
  });

  describe('state version tracking', () => {
    it('should increment version when adding player', async () => {
      const services = factory.createGameInstance('test-game');

      const initialVersion = services.stateService.getStateVersion();
      expect(initialVersion).toBe(1);

      services.stateService.addPlayer('Player 1');

      const newVersion = services.stateService.getStateVersion();
      expect(newVersion).toBe(2);
    });

    it('should update lastModified when state changes', async () => {
      const services = factory.createGameInstance('test-game');

      const initialModified = services.stateService.getLastModified();

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      services.stateService.addPlayer('Player 1');

      const newModified = services.stateService.getLastModified();

      expect(newModified.getTime()).toBeGreaterThan(initialModified.getTime());
    });

    it('should increment version on multiple state changes', () => {
      const services = factory.createGameInstance('test-game');

      expect(services.stateService.getStateVersion()).toBe(1);

      services.stateService.addPlayer('Player 1');
      expect(services.stateService.getStateVersion()).toBe(2);

      services.stateService.addPlayer('Player 2');
      expect(services.stateService.getStateVersion()).toBe(3);

      services.stateService.setGamePhase('PLAY');
      expect(services.stateService.getStateVersion()).toBe(4);
    });
  });

  describe('complete service wiring', () => {
    it('should have all required services in container', () => {
      const services = factory.createGameInstance('test-game');

      // Verify all services exist
      expect(services.dataService).toBeDefined();
      expect(services.stateService).toBeDefined();
      expect(services.loggingService).toBeDefined();
      expect(services.notificationService).toBeDefined();
      expect(services.turnService).toBeDefined();
      expect(services.cardService).toBeDefined();
      expect(services.playerActionService).toBeDefined();
      expect(services.movementService).toBeDefined();
      expect(services.gameRulesService).toBeDefined();
      expect(services.resourceService).toBeDefined();
      expect(services.choiceService).toBeDefined();
      expect(services.effectEngineService).toBeDefined();
      expect(services.negotiationService).toBeDefined();
    });

    it('should have properly wired circular dependencies', () => {
      const services = factory.createGameInstance('test-game');

      // These services have circular dependencies that should be resolved
      expect(services.stateService).toBeDefined();
      expect(services.gameRulesService).toBeDefined();
      expect(services.turnService).toBeDefined();
      expect(services.effectEngineService).toBeDefined();

      // If circular dependencies aren't properly wired, these would throw or be undefined
      expect(() => services.stateService.getGameState()).not.toThrow();
    });
  });
});
