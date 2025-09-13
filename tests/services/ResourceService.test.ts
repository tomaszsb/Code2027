import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResourceService } from '../../src/services/ResourceService';
import { IStateService, ResourceChange, ResourceValidation } from '../../src/types/ServiceContracts';
import { Player, GameState } from '../../src/types/StateTypes';
import { createMockStateService } from '../mocks/mockServices';

describe('ResourceService', () => {
  let resourceService: ResourceService;
  let mockStateService: any;
  
  const mockPlayer: Player = {
    id: 'player1',
    name: 'Test Player',
    currentSpace: 'TEST-SPACE',
    visitType: 'First',
    money: 1000,
    timeSpent: 5,
    projectScope: 0,
    score: 0,
    hand: [],
    activeCards: [],
    turnModifiers: { skipTurns: 0 },
    activeEffects: [],
    loans: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockStateService = createMockStateService();
    mockStateService.getPlayer.mockReturnValue(mockPlayer);
    mockStateService.updatePlayer.mockReturnValue({} as any); // Mock return value
    
    resourceService = new ResourceService(mockStateService);
  });

  describe('Money Operations', () => {
    describe('addMoney', () => {
      it('should add money successfully with valid amount', () => {
        const result = resourceService.addMoney('player1', 500, 'test:add_money', 'Test addition');
        
        expect(result).toBe(true);
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 1500,
          timeSpent: 5
        });
      });

      it('should fail with invalid amount (zero)', () => {
        const result = resourceService.addMoney('player1', 0, 'test:add_money');
        
        expect(result).toBe(false);
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });

      it('should fail with invalid amount (negative)', () => {
        const result = resourceService.addMoney('player1', -100, 'test:add_money');
        
        expect(result).toBe(false);
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });
    });

    describe('spendMoney', () => {
      it('should spend money successfully when player has enough funds', () => {
        const result = resourceService.spendMoney('player1', 300, 'test:spend_money', 'Test spending');
        
        expect(result).toBe(true);
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 700,
          timeSpent: 5
        });
      });

      it('should fail when player has insufficient funds', () => {
        const result = resourceService.spendMoney('player1', 1500, 'test:spend_money');
        
        expect(result).toBe(false);
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });

      it('should fail with invalid amount (zero)', () => {
        const result = resourceService.spendMoney('player1', 0, 'test:spend_money');
        
        expect(result).toBe(false);
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });
    });

    describe('canAfford', () => {
      it('should return true when player can afford the amount', () => {
        const result = resourceService.canAfford('player1', 800);
        expect(result).toBe(true);
      });

      it('should return false when player cannot afford the amount', () => {
        const result = resourceService.canAfford('player1', 1200);
        expect(result).toBe(false);
      });

      it('should return false when player is not found', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        const result = resourceService.canAfford('nonexistent', 100);
        expect(result).toBe(false);
      });
    });
  });

  describe('Time Operations', () => {
    describe('addTime', () => {
      it('should add time successfully', () => {
        resourceService.addTime('player1', 3, 'test:add_time', 'Test time addition');
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 1000,
          timeSpent: 8
        });
      });
    });

    describe('spendTime', () => {
      it('should spend time successfully', () => {
        resourceService.spendTime('player1', 2, 'test:spend_time', 'Test time spending');
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 1000,
          timeSpent: 3
        });
      });

      it('should prevent time from going negative', () => {
        resourceService.spendTime('player1', 10, 'test:spend_time', 'Excessive time spending');
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 1000,
          timeSpent: 0
        });
      });
    });
  });

  describe('Combined Operations', () => {
    describe('updateResources', () => {
      it('should update both money and time', () => {
        const changes: ResourceChange = {
          money: 200,
          timeSpent: -1,
          source: 'test:combined',
          reason: 'Combined update'
        };

        const result = resourceService.updateResources('player1', changes);
        
        expect(result).toBe(true);
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 1200,
          timeSpent: 4
        });
      });

      it('should update only money when timeSpent is not provided', () => {
        const changes: ResourceChange = {
          money: -300,
          source: 'test:money_only',
          reason: 'Money only update'
        };

        const result = resourceService.updateResources('player1', changes);
        
        expect(result).toBe(true);
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 700,
          timeSpent: 5
        });
      });

      it('should fail validation for insufficient funds', () => {
        const changes: ResourceChange = {
          money: -1500,
          source: 'test:insufficient_funds'
        };

        const result = resourceService.updateResources('player1', changes);
        
        expect(result).toBe(false);
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    describe('validateResourceChange', () => {
      it('should validate successful change', () => {
        const changes: ResourceChange = {
          money: 100,
          timeSpent: 1,
          source: 'test:validation'
        };

        const validation: ResourceValidation = resourceService.validateResourceChange('player1', changes);
        
        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should fail validation when source is missing', () => {
        const changes: ResourceChange = {
          money: 100,
          source: ''
        };

        const validation = resourceService.validateResourceChange('player1', changes);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Source is required for all resource changes');
      });

      it('should fail validation for insufficient funds', () => {
        const changes: ResourceChange = {
          money: -1500,
          source: 'test:insufficient'
        };

        const validation = resourceService.validateResourceChange('player1', changes);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Insufficient funds: trying to spend $1,500, but player only has $1,000');
      });

      it('should warn about large transactions', () => {
        const changes: ResourceChange = {
          money: 2000000,
          source: 'test:large_transaction'
        };

        const validation = resourceService.validateResourceChange('player1', changes);
        
        expect(validation.valid).toBe(true);
        expect(validation.warnings).toContain('Large money transaction: +$2,000,000');
      });

      it('should fail validation when player does not exist', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        
        const changes: ResourceChange = {
          money: 100,
          source: 'test:nonexistent'
        };

        const validation = resourceService.validateResourceChange('nonexistent', changes);
        
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Player nonexistent does not exist');
      });
    });
  });

  describe('Loan Operations', () => {
    const mockGameState: GameState = {
      turn: 10,
      players: [mockPlayer],
      currentPlayerId: 'player1',
      gamePhase: 'PLAY',
      isGameOver: false,
      activeModal: null,
      awaitingChoice: null,
      hasPlayerMovedThisTurn: false,
      hasPlayerRolledDice: false,
      requiredActions: 1,
      completedActions: 0,
      availableActionTypes: [],
      hasCompletedManualActions: false,
      activeNegotiation: null,
      globalActionLog: [],
      preSpaceEffectState: null,
      decks: { W: [], B: [], E: [], L: [], I: [] },
      discardPiles: { W: [], B: [], E: [], L: [], I: [] }
    };

    beforeEach(() => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.updatePlayer.mockImplementation((updates) => mockGameState);
    });

    describe('takeOutLoan', () => {
      it('should successfully take out a loan', () => {
        const result = resourceService.takeOutLoan('player1', 5000, 0.05);
        
        expect(result).toBe(true);
        
        // Check that loan was added to player's loans array
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          loans: expect.arrayContaining([
            expect.objectContaining({
              principal: 5000,
              interestRate: 0.05,
              startTurn: 10
            })
          ])
        });
        
        // Check that money was added via updateResources call
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 6000, // 1000 + 5000 loan amount
          timeSpent: 5
        });
      });

      it('should fail with invalid amount (zero)', () => {
        const result = resourceService.takeOutLoan('player1', 0, 0.05);
        
        expect(result).toBe(false);
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });

      it('should fail with invalid amount (negative)', () => {
        const result = resourceService.takeOutLoan('player1', -1000, 0.05);
        
        expect(result).toBe(false);
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });

      it('should fail with invalid interest rate (negative)', () => {
        const result = resourceService.takeOutLoan('player1', 1000, -0.01);
        
        expect(result).toBe(false);
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });

      it('should fail when player is not found', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        
        const result = resourceService.takeOutLoan('nonexistent', 1000, 0.05);
        
        expect(result).toBe(false);
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });

      it('should rollback loan if money addition fails', () => {
        // Mock updatePlayer to fail on the second call (money addition)
        let callCount = 0;
        mockStateService.updatePlayer.mockImplementation(() => {
          callCount++;
          if (callCount === 2) {
            throw new Error('Failed to add money');
          }
          return mockGameState;
        });

        const result = resourceService.takeOutLoan('player1', 1000, 0.05);
        
        expect(result).toBe(false);
        
        // Should have attempted to rollback the loan by restoring original loans array
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          loans: [] // Original loans array (empty)
        });
      });
    });

    describe('applyInterest', () => {
      const playerWithLoans: Player = {
        ...mockPlayer,
        money: 2000,
        loans: [
          {
            id: 'loan1',
            principal: 5000,
            interestRate: 0.05,
            startTurn: 5
          },
          {
            id: 'loan2',
            principal: 3000,
            interestRate: 0.03,
            startTurn: 8
          }
        ]
      };

      it('should apply interest when player has sufficient funds', () => {
        mockStateService.getPlayer.mockReturnValue(playerWithLoans);
        
        resourceService.applyInterest('player1');
        
        // Total interest: 5000 * 0.05 + 3000 * 0.03 = 250 + 90 = 340
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 1660, // 2000 - 340
          timeSpent: 5
        });
      });

      it('should handle partial payment when player has insufficient funds', () => {
        const poorPlayer = {
          ...playerWithLoans,
          money: 200 // Not enough for full interest payment of 340
        };
        mockStateService.getPlayer.mockReturnValue(poorPlayer);
        
        resourceService.applyInterest('player1');
        
        // Should deduct what player can afford (200)
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 0, // 200 - 200 (all available money)
          timeSpent: 5
        });
      });

      it('should handle player with no funds for interest', () => {
        const brokePlayer = {
          ...playerWithLoans,
          money: 0
        };
        mockStateService.getPlayer.mockReturnValue(brokePlayer);
        
        resourceService.applyInterest('player1');
        
        // Should not attempt any money deduction
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });

      it('should do nothing when player has no loans', () => {
        const playerWithoutLoans = {
          ...mockPlayer,
          loans: []
        };
        mockStateService.getPlayer.mockReturnValue(playerWithoutLoans);
        
        resourceService.applyInterest('player1');
        
        // Should not make any updates
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });

      it('should do nothing when player is not found', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        
        resourceService.applyInterest('nonexistent');
        
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });

      it('should handle loans with zero interest rate', () => {
        const playerWithZeroInterest = {
          ...mockPlayer,
          loans: [
            {
              id: 'loan1',
              principal: 1000,
              interestRate: 0, // Zero interest
              startTurn: 5
            }
          ]
        };
        mockStateService.getPlayer.mockReturnValue(playerWithZeroInterest);
        
        resourceService.applyInterest('player1');
        
        // Should not make any updates for zero interest
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });
    });
  });

  describe('Transaction History', () => {
    it('should maintain transaction history', () => {
      // Perform some operations to create history
      resourceService.addMoney('player1', 500, 'test:history_1');
      resourceService.spendMoney('player1', 200, 'test:history_2');
      
      const history = resourceService.getResourceHistory('player1');
      
      expect(history).toHaveLength(2);
      expect(history[0].changes.money).toBe(500);
      expect(history[0].changes.source).toBe('test:history_1');
      expect(history[1].changes.money).toBe(-200);
      expect(history[1].changes.source).toBe('test:history_2');
    });

    it('should return empty history for player with no transactions', () => {
      const history = resourceService.getResourceHistory('unused_player');
      expect(history).toHaveLength(0);
    });
  });

  describe('Debug Helpers', () => {
    it('should provide transaction summary', () => {
      resourceService.addMoney('player1', 100, 'test:summary');
      
      const summary = resourceService.getTransactionSummary();
      
      expect(summary).toHaveProperty('player1');
      expect(summary['player1'].totalTransactions).toBe(1);
      expect(summary['player1'].lastTransaction).toBeDefined();
    });

    it('should clear transaction history', () => {
      resourceService.addMoney('player1', 100, 'test:clear');
      
      expect(resourceService.getResourceHistory('player1')).toHaveLength(1);
      
      resourceService.clearTransactionHistory('player1');
      
      expect(resourceService.getResourceHistory('player1')).toHaveLength(0);
    });

    it('should clear all transaction history', () => {
      resourceService.addMoney('player1', 100, 'test:clear_all_1');
      resourceService.addMoney('player2', 200, 'test:clear_all_2');
      
      resourceService.clearTransactionHistory(); // Clear all
      
      expect(resourceService.getResourceHistory('player1')).toHaveLength(0);
      expect(resourceService.getResourceHistory('player2')).toHaveLength(0);
    });
  });
});