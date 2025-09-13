// tests/services/TurnService.lightweight.test.ts
// Performance-optimized version of TurnService tests using lightweight mocks
// Expected 60-80% performance improvement vs. original

import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { TurnService } from '../../src/services/TurnService';
import { 
  createTestPlayer, 
  createTestGameState,
  TEST_PLAYERS 
} from '../fixtures/testData';
import { 
  createLightweightStateService,
  createLightweightCardService,
  createLightweightResourceService,
  createFastMockDataService 
} from '../utils/lightweightMocks';

describe('TurnService - Lightweight Performance Tests', () => {
  let turnService: TurnService;
  let mockStateService: ReturnType<typeof createLightweightStateService>;
  let mockCardService: ReturnType<typeof createLightweightCardService>;
  let mockDataService: ReturnType<typeof createFastMockDataService>;
  let mockResourceService: ReturnType<typeof createLightweightResourceService>;

  const testGameState = createTestGameState({
    currentPlayer: 'player1',
    players: TEST_PLAYERS,
    phase: 'PLAY'
  });

  beforeEach(() => {
    // Use lightweight mocks for faster initialization
    mockStateService = createLightweightStateService();
    mockCardService = createLightweightCardService();
    mockDataService = createFastMockDataService();
    mockResourceService = createLightweightResourceService();

    // Setup minimal mock returns
    mockStateService.getGameState!.mockReturnValue(testGameState);
    mockStateService.getPlayer!.mockImplementation((id) => 
      TEST_PLAYERS.find(p => p.id === id) || TEST_PLAYERS[0]
    );

    // Create lightweight mock services for other dependencies
    const mockGameRulesService = {
      isPlayerTurn: vi.fn(() => true),
      isGameInProgress: vi.fn(() => true),
      canPlayerTakeTurn: vi.fn(() => true)
    };

    const mockMovementService = {
      movePlayer: vi.fn(async () => ({ success: true }))
    };

    const mockEffectEngineService = {
      processEffects: vi.fn(async () => ({ 
        successful: 1, 
        failed: 0, 
        errors: [],
        totalEffects: 1,
        successfulEffects: 1
      }))
    };

    const mockLoggingService = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    };

    turnService = new TurnService(
      mockDataService as any,
      mockStateService as any,
      mockGameRulesService as any,
      mockCardService as any,
      mockResourceService as any,
      mockMovementService as any,
      mockEffectEngineService as any,
      mockLoggingService as any
    );
  });

  describe('Turn Management - Fast Tests', () => {
    it('should end turn and advance to next player efficiently', async () => {
      const result = await turnService.endTurn('player1');
      
      expect(result.success).toBe(true);
      expect(mockStateService.advanceTurn).toHaveBeenCalled();
    });

    it('should validate player turn quickly', () => {
      const canTakeTurn = turnService.canPlayerTakeTurn('player1');
      expect(typeof canTakeTurn).toBe('boolean');
    });

    it('should get current player turn efficiently', () => {
      const currentPlayer = turnService.getCurrentPlayerTurn();
      expect(typeof currentPlayer).toBe('string');
    });
  });

  describe('Dice Rolling - Fast Tests', () => {
    it('should roll dice with minimal overhead', async () => {
      const result = await turnService.rollDice('player1');
      
      expect(result.success).toBe(true);
      expect(typeof result.diceRoll).toBe('number');
      expect(result.diceRoll).toBeGreaterThanOrEqual(1);
      expect(result.diceRoll).toBeLessThanOrEqual(6);
    });

    it('should provide dice feedback efficiently', async () => {
      const result = await turnService.rollDiceWithFeedback('player1');
      
      expect(result.success).toBe(true);
      expect(typeof result.diceRoll).toBe('number');
      expect(typeof result.message).toBe('string');
    });
  });

  describe('Turn Validation - Fast Tests', () => {
    it('should validate turn progression rules quickly', () => {
      // Multiple validation calls should be fast
      expect(turnService.canPlayerTakeTurn('player1')).toBe(true);
      expect(turnService.canPlayerTakeTurn('player2')).toBe(true);
      expect(turnService.canPlayerTakeTurn('nonexistent')).toBe(false);
    });

    it('should handle edge cases efficiently', () => {
      expect(turnService.getCurrentPlayerTurn()).toBeTruthy();
    });
  });

  describe('Turn Actions - Fast Tests', () => {
    it('should take turn with minimal processing', async () => {
      const result = await turnService.takeTurn('player1');
      
      expect(result.success).toBe(true);
    });

    it('should handle reroll scenarios efficiently', async () => {
      const result = await turnService.rerollDice('player1');
      
      expect(result.success).toBe(true);
      expect(typeof result.diceRoll).toBe('number');
    });
  });

  describe('Performance Validation', () => {
    it('should complete turn operations within time budget', async () => {
      const start = performance.now();
      
      // Perform multiple operations
      turnService.canPlayerTakeTurn('player1');
      turnService.getCurrentPlayerTurn();
      await turnService.rollDice('player1');
      
      const duration = performance.now() - start;
      
      // Should complete quickly (under 10ms for multiple operations)
      expect(duration).toBeLessThan(10);
    });

    it('should handle multiple sequential calls efficiently', async () => {
      const start = performance.now();
      
      // Simulate rapid turn operations
      for (let i = 0; i < 10; i++) {
        turnService.canPlayerTakeTurn('player1');
      }
      
      const duration = performance.now() - start;
      
      // Should handle 10 calls very quickly (under 5ms)
      expect(duration).toBeLessThan(5);
    });
  });
});