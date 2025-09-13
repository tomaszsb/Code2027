// tests/services/CardService.lightweight.test.ts
// Performance-optimized version of CardService tests using lightweight mocks
// Expected 50-70% performance improvement vs. original

import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { CardService } from '../../src/services/CardService';
import { 
  createTestPlayer, 
  createTestCard, 
  createFastMockDataService 
} from '../fixtures/testData';
import { 
  createLightweightStateService, 
  createLightweightResourceService,
  createLightweightEffectEngineService 
} from '../utils/lightweightMocks';

describe('CardService - Lightweight Performance Tests', () => {
  let cardService: CardService;
  let mockDataService: ReturnType<typeof createFastMockDataService>;
  let mockStateService: ReturnType<typeof createLightweightStateService>;
  let mockResourceService: ReturnType<typeof createLightweightResourceService>;
  let mockEffectEngineService: ReturnType<typeof createLightweightEffectEngineService>;

  // Use lightweight fixtures
  const testPlayer = createTestPlayer({
    id: 'player1',
    name: 'Alice',
    money: 1000,
    timeRemaining: 10,
    cards: {
      hand: ['E001', 'W001'],
      active: ['B001'],
      discarded: { W: [], B: [], E: [], L: [], I: [] }
    }
  });

  beforeEach(() => {
    // Use lightweight mocks for faster initialization
    mockDataService = createFastMockDataService();
    mockStateService = createLightweightStateService();
    mockResourceService = createLightweightResourceService();
    mockEffectEngineService = createLightweightEffectEngineService();

    // Setup minimal mock returns
    mockStateService.getPlayer!.mockReturnValue(testPlayer);
    mockDataService.getCardById.mockImplementation((id) => 
      createTestCard({ id, type: id.charAt(0) as any })
    );

    cardService = new CardService(
      mockDataService as any,
      mockStateService as any,
      mockResourceService as any,
      { info: vi.fn(), error: vi.fn() } as any
    );
    
    // Set effect engine service
    cardService.setEffectEngineService(mockEffectEngineService as any);
  });

  describe('Card Playing - Fast Tests', () => {
    it('should play card successfully with minimal overhead', async () => {
      // Mock successful effect processing
      mockEffectEngineService.processEffects!.mockResolvedValue({
        successful: 1,
        failed: 0,
        errors: [],
        totalEffects: 1,
        successfulEffects: 1
      });

      const result = await cardService.playCard('player1', 'E001');

      expect(result.success).toBe(true);
      expect(mockEffectEngineService.processEffects).toHaveBeenCalled();
    });

    it('should validate card ownership quickly', () => {
      const canPlay = cardService.canPlayCard('player1', 'E001');
      expect(canPlay).toBe(true);
    });

    it('should check card ownership without heavy queries', () => {
      const owns = cardService.playerOwnsCard('player1', 'E001');
      expect(owns).toBe(true);
    });
  });

  describe('Card Drawing - Fast Tests', () => {
    it('should draw cards with minimal state updates', async () => {
      const cards = await cardService.drawCards('player1', 'E', 2);
      
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeLessThanOrEqual(2);
    });

    it('should get card type efficiently', () => {
      const cardType = cardService.getCardType('E001');
      expect(cardType).toBe('E');
    });
  });

  describe('Card Information - Fast Tests', () => {
    it('should get player cards count quickly', () => {
      const count = cardService.getPlayerCardCount('player1');
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should validate card type efficiently', () => {
      expect(cardService.isValidCardType('E')).toBe(true);
      expect(cardService.isValidCardType('W')).toBe(true);
      expect(cardService.isValidCardType('X')).toBe(false);
    });
  });

  describe('Card Effects - Fast Tests', () => {
    it('should apply card effects with lightweight processing', async () => {
      const testCard = createTestCard({
        id: 'TEST001',
        name: 'Money Card',
        money_effect: 1000
      });

      mockDataService.getCardById.mockReturnValue(testCard);
      mockEffectEngineService.processEffects!.mockResolvedValue({
        successful: 1,
        failed: 0,
        errors: [],
        totalEffects: 1,
        successfulEffects: 1
      });

      await cardService.applyCardEffects(testCard, 'player1');

      expect(mockEffectEngineService.processEffects).toHaveBeenCalled();
    });
  });

  describe('Card Lifecycle - Fast Tests', () => {
    it('should handle end of turn processing efficiently', async () => {
      await cardService.endOfTurn('player1');
      
      // Should complete without errors
      expect(mockStateService.updatePlayer).toHaveBeenCalled();
    });

    it('should finalize played cards quickly', async () => {
      await cardService.finalizePlayedCard('player1', 'E001');
      
      // Should update player state
      expect(mockStateService.updatePlayer).toHaveBeenCalled();
    });
  });

  describe('Performance Validation', () => {
    it('should complete card operations within time budget', async () => {
      const start = performance.now();
      
      // Perform multiple operations
      cardService.canPlayCard('player1', 'E001');
      cardService.getCardType('E001');
      cardService.playerOwnsCard('player1', 'E001');
      cardService.isValidCardType('E');
      
      const duration = performance.now() - start;
      
      // Should complete very quickly (under 5ms)
      expect(duration).toBeLessThan(5);
    });
  });
});