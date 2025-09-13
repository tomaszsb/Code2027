// Fast PlayerActionService test with proper mocking
import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlayerActionService } from '../../src/services/PlayerActionService';
import { IDataService, IStateService, IGameRulesService, IMovementService, ITurnService, IEffectEngineService } from '../../src/types/ServiceContracts';
import { Player, Card } from '../../src/types/DataTypes';
import { GameState } from '../../src/types/StateTypes';

// Mock EffectFactory completely
vi.mock('../../src/utils/EffectFactory', () => ({
  EffectFactory: {
    createEffectsFromCard: vi.fn(() => [])
  }
}));

// Suppress console output
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
};

describe('PlayerActionService Fast', () => {
  let playerActionService: PlayerActionService;
  
  // Mock services with minimal implementations
  const mockDataService = {
    getCardById: vi.fn()
  } as any;
  
  const mockStateService = {
    getGameState: vi.fn(() => ({ currentPlayerId: 'player1', turn: 1 })),
    getPlayer: vi.fn(),
    updatePlayer: vi.fn(),
    setPlayerHasMoved: vi.fn(),
    logToActionHistory: vi.fn()
  } as any;
  
  const mockGameRulesService = {
    canPlayCard: vi.fn(),
    canPlayerAfford: vi.fn()
  } as any;
  
  const mockMovementService = {
    getValidMoves: vi.fn(() => []),
    getDiceDestination: vi.fn(() => null),
    movePlayer: vi.fn()
  } as any;
  
  const mockTurnService = {
    processTurnEffects: vi.fn(() => Promise.resolve()),
    endTurn: vi.fn(() => Promise.resolve({ nextPlayerId: 'player2' }))
  } as any;
  
  const mockEffectEngineService = {
    processEffects: vi.fn(() => Promise.resolve({
      success: true,
      totalEffects: 0,
      successfulEffects: 0,
      failedEffects: 0,
      results: [],
      errors: []
    })),
    processEffect: vi.fn(() => Promise.resolve({
      success: true,
      error: null
    }))
  } as any;
  
  const mockLoggingService = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    playerActionService = new PlayerActionService(
      mockDataService,
      mockStateService,
      mockGameRulesService,
      mockMovementService,
      mockTurnService,
      mockEffectEngineService,
      mockLoggingService
    );
  });

  describe('playCard', () => {
    const mockPlayer: Player = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'START-SPACE',
      visitType: 'First',
      money: 1000,
      timeSpent: 5,
      projectScope: 0,
    score: 0,
      color: '#007bff',
      avatar: '👤',
      hand: ['W001'],
      activeCards: [],
      turnModifiers: { skipTurns: 0 },
      activeEffects: [],
      loans: []
    };

    const mockCard: Card = {
      card_id: 'W001',
      card_name: 'Test Card',
      card_type: 'W',
      description: 'A test card',
      cost: 100
    };

    it('should successfully play a valid card', async () => {
      // Arrange
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getCardById.mockReturnValue(mockCard);
      mockGameRulesService.canPlayCard.mockReturnValue(true);
      mockGameRulesService.canPlayerAfford.mockReturnValue(true);
      
      // Act
      await playerActionService.playCard('player1', 'W001');
      
      // Assert
      expect(mockDataService.getCardById).toHaveBeenCalledWith('W001');
      expect(mockGameRulesService.canPlayCard).toHaveBeenCalledWith('player1', 'W001');
      expect(mockGameRulesService.canPlayerAfford).toHaveBeenCalledWith('player1', 100);
      expect(mockEffectEngineService.processEffects).toHaveBeenCalled();
      expect(mockEffectEngineService.processEffect).toHaveBeenCalled();
      expect(mockLoggingService.info).toHaveBeenCalled();
    });

    it('should throw error when player not found', async () => {
      mockStateService.getPlayer.mockReturnValue(undefined);
      
      await expect(playerActionService.playCard('nonexistent', 'W001'))
        .rejects.toThrow("Failed to play card: Player with ID 'nonexistent' not found");
    });

    it('should throw error when card not found', async () => {
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getCardById.mockReturnValue(undefined);
      
      await expect(playerActionService.playCard('player1', 'NONEXISTENT'))
        .rejects.toThrow("Failed to play card: Card with ID 'NONEXISTENT' not found");
    });
  });

  describe('rollDice', () => {
    const mockPlayer: Player = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'START-SPACE',
      visitType: 'First',
      money: 1000,
      timeSpent: 5,
      projectScope: 0,
    score: 0,
      color: '#007bff',
      avatar: '👤',
      hand: [],
      activeCards: [],
      turnModifiers: { skipTurns: 0 },
      activeEffects: [],
      loans: []
    };

    it('should roll dice and return valid result', async () => {
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      
      const result = await playerActionService.rollDice('player1');
      
      expect(result.roll1).toBeGreaterThanOrEqual(1);
      expect(result.roll1).toBeLessThanOrEqual(6);
      expect(result.total).toBe(result.roll1);
      expect(mockStateService.updatePlayer).toHaveBeenCalled();
      expect(mockTurnService.processTurnEffects).toHaveBeenCalledWith('player1', result.total);
    });

    it('should throw error when player not found', async () => {
      mockStateService.getPlayer.mockReturnValue(undefined);
      
      await expect(playerActionService.rollDice('nonexistent'))
        .rejects.toThrow("Failed to roll dice: Player with ID 'nonexistent' not found");
    });
  });

  describe('endTurn', () => {
    it('should call TurnService endTurn', async () => {
      await playerActionService.endTurn();
      
      expect(mockTurnService.endTurn).toHaveBeenCalled();
    });

    it('should handle TurnService errors', async () => {
      mockTurnService.endTurn.mockRejectedValue(new Error('Turn service error'));
      
      await expect(playerActionService.endTurn())
        .rejects.toThrow('Failed to end turn: Turn service error');
    });
  });
});