import { CardService } from '../../src/services/CardService';
import { IDataService, IStateService } from '../../src/types/ServiceContracts';
import { GameState, Player } from '../../src/types/StateTypes';
import { CardType } from '../../src/types/DataTypes';

describe('CardService', () => {
  let cardService: CardService;
  let mockDataService: jest.Mocked<IDataService>;
  let mockStateService: jest.Mocked<IStateService>;

  const mockPlayer: Player = {
    id: 'player1',
    name: 'Alice',
    currentSpace: 'TEST-SPACE',
    visitType: 'First',
    money: 100,
    time: 5,
    cards: {
      W: ['W_123_test', 'W_456_test'],
      B: ['B_789_test'],
      E: [],
      L: ['L_111_test'],
      I: []
    }
  };

  const mockGameState: GameState = {
    players: [mockPlayer],
    currentPlayerId: 'player1',
    gamePhase: 'PLAY',
    turn: 1
  };

  beforeEach(() => {
    // Mock DataService
    mockDataService = {
      getDiceEffects: jest.fn().mockReturnValue([]),
      isLoaded: jest.fn().mockReturnValue(true),
      loadData: jest.fn(),
      getGameConfig: jest.fn().mockReturnValue([]),
      getGameConfigBySpace: jest.fn(),
      getAllSpaces: jest.fn().mockReturnValue([]),
      getSpaceByName: jest.fn(),
      getMovement: jest.fn(),
      getAllMovements: jest.fn().mockReturnValue([]),
      getDiceOutcome: jest.fn(),
      getAllDiceOutcomes: jest.fn().mockReturnValue([]),
      getSpaceEffects: jest.fn().mockReturnValue([]),
      getAllSpaceEffects: jest.fn().mockReturnValue([]),
      getAllDiceEffects: jest.fn().mockReturnValue([]),
      getSpaceContent: jest.fn(),
      getAllSpaceContent: jest.fn().mockReturnValue([])
    };

    // Mock StateService
    mockStateService = {
      getGameState: jest.fn().mockReturnValue(mockGameState),
      getPlayer: jest.fn().mockReturnValue(mockPlayer),
      getAllPlayers: jest.fn().mockReturnValue([mockPlayer]),
      updatePlayer: jest.fn().mockReturnValue(mockGameState),
      addPlayer: jest.fn().mockReturnValue(mockGameState),
      removePlayer: jest.fn().mockReturnValue(mockGameState),
      setCurrentPlayer: jest.fn().mockReturnValue(mockGameState),
      setGamePhase: jest.fn().mockReturnValue(mockGameState),
      advanceTurn: jest.fn().mockReturnValue(mockGameState),
      nextPlayer: jest.fn().mockReturnValue(mockGameState),
      initializeGame: jest.fn().mockReturnValue(mockGameState),
      startGame: jest.fn().mockReturnValue(mockGameState),
      endGame: jest.fn().mockReturnValue(mockGameState),
      resetGame: jest.fn().mockReturnValue(mockGameState),
      validatePlayerAction: jest.fn().mockReturnValue(true),
      canStartGame: jest.fn().mockReturnValue(true),
      isStateLoaded: jest.fn().mockReturnValue(true)
    };

    cardService = new CardService(mockDataService, mockStateService);
  });

  describe('Constructor', () => {
    it('should accept DataService and StateService dependencies', () => {
      expect(cardService).toBeInstanceOf(CardService);
    });
  });

  describe('Card Validation Methods', () => {
    describe('canPlayCard', () => {
      it('should return true when player can play card', () => {
        const canPlay = cardService.canPlayCard('player1', 'W_123_test');
        
        expect(canPlay).toBe(true);
        expect(mockStateService.getGameState).toHaveBeenCalled();
        expect(mockStateService.getPlayer).toHaveBeenCalledWith('player1');
      });

      it('should return false when game is not in PLAY phase', () => {
        mockStateService.getGameState.mockReturnValue({
          ...mockGameState,
          gamePhase: 'SETUP'
        });
        
        const canPlay = cardService.canPlayCard('player1', 'W_123_test');
        
        expect(canPlay).toBe(false);
      });

      it('should return false when player does not exist', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        
        const canPlay = cardService.canPlayCard('nonexistent', 'W_123_test');
        
        expect(canPlay).toBe(false);
      });

      it('should return false when player does not own the card', () => {
        const canPlay = cardService.canPlayCard('player1', 'W_999_notowned');
        
        expect(canPlay).toBe(false);
      });

      it('should return true even when not player\'s turn (cards can be played anytime)', () => {
        mockStateService.getGameState.mockReturnValue({
          ...mockGameState,
          currentPlayerId: 'player2'
        });
        
        const canPlay = cardService.canPlayCard('player1', 'W_123_test');
        
        expect(canPlay).toBe(true);
      });
    });

    describe('isValidCardType', () => {
      it('should return true for valid card types', () => {
        expect(cardService.isValidCardType('W')).toBe(true);
        expect(cardService.isValidCardType('B')).toBe(true);
        expect(cardService.isValidCardType('E')).toBe(true);
        expect(cardService.isValidCardType('L')).toBe(true);
        expect(cardService.isValidCardType('I')).toBe(true);
      });

      it('should return false for invalid card types', () => {
        expect(cardService.isValidCardType('X')).toBe(false);
        expect(cardService.isValidCardType('invalid')).toBe(false);
        expect(cardService.isValidCardType('')).toBe(false);
      });
    });

    describe('playerOwnsCard', () => {
      it('should return true when player owns the card', () => {
        expect(cardService.playerOwnsCard('player1', 'W_123_test')).toBe(true);
        expect(cardService.playerOwnsCard('player1', 'B_789_test')).toBe(true);
        expect(cardService.playerOwnsCard('player1', 'L_111_test')).toBe(true);
      });

      it('should return false when player does not own the card', () => {
        expect(cardService.playerOwnsCard('player1', 'W_999_notowned')).toBe(false);
        expect(cardService.playerOwnsCard('player1', 'E_999_notowned')).toBe(false);
      });

      it('should return false when player does not exist', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        
        expect(cardService.playerOwnsCard('nonexistent', 'W_123_test')).toBe(false);
      });
    });
  });

  describe('Card Management Methods', () => {
    describe('playCard', () => {
      beforeEach(() => {
        // Mock the internal methods
        jest.spyOn(cardService, 'canPlayCard').mockReturnValue(true);
        jest.spyOn(cardService, 'removeCard').mockReturnValue(mockGameState);
        jest.spyOn(cardService, 'applyCardEffects').mockReturnValue(mockGameState);
      });

      it('should successfully play a valid card', () => {
        const result = cardService.playCard('player1', 'W_123_test');
        
        expect(result).toBe(mockGameState);
        expect(cardService.canPlayCard).toHaveBeenCalledWith('player1', 'W_123_test');
        expect(cardService.removeCard).toHaveBeenCalledWith('player1', 'W_123_test');
        expect(cardService.applyCardEffects).toHaveBeenCalledWith('player1', 'W_123_test');
      });

      it('should throw error when card cannot be played', () => {
        (cardService.canPlayCard as jest.Mock).mockReturnValue(false);
        
        expect(() => cardService.playCard('player1', 'W_123_test'))
          .toThrow('Player player1 cannot play card W_123_test');
      });
    });

    describe('drawCards', () => {
      it('should add cards to player\'s hand', () => {
        cardService.drawCards('player1', 'W', 3);
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          cards: expect.objectContaining({
            W: expect.arrayContaining(['W_123_test', 'W_456_test'])
          })
        });
      });

      it('should throw error for invalid card type', () => {
        expect(() => cardService.drawCards('player1', 'X' as CardType, 3))
          .toThrow('Invalid card type: X');
      });

      it('should return current state when count is zero or negative', () => {
        const result = cardService.drawCards('player1', 'W', 0);
        expect(result).toBe(mockGameState);
        expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
      });

      it('should throw error when player does not exist', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        
        expect(() => cardService.drawCards('nonexistent', 'W', 3))
          .toThrow('Player nonexistent not found');
      });
    });

    describe('removeCard', () => {
      it('should remove card from player\'s hand', () => {
        cardService.removeCard('player1', 'W_123_test');
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          cards: expect.objectContaining({
            W: ['W_456_test'] // Should remove 'W_123_test'
          })
        });
      });

      it('should throw error when player does not exist', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        
        expect(() => cardService.removeCard('nonexistent', 'W_123_test'))
          .toThrow('Player nonexistent not found');
      });

      it('should throw error when player does not own the card', () => {
        expect(() => cardService.removeCard('player1', 'W_999_notowned'))
          .toThrow('Player player1 does not own card W_999_notowned');
      });
    });

    describe('replaceCard', () => {
      beforeEach(() => {
        jest.spyOn(cardService, 'removeCard').mockReturnValue(mockGameState);
        jest.spyOn(cardService, 'drawCards').mockReturnValue(mockGameState);
      });

      it('should replace old card with new card of specified type', () => {
        const result = cardService.replaceCard('player1', 'W_123_test', 'B');
        
        expect(result).toBe(mockGameState);
        expect(cardService.removeCard).toHaveBeenCalledWith('player1', 'W_123_test');
        expect(cardService.drawCards).toHaveBeenCalledWith('player1', 'B', 1);
      });

      it('should throw error for invalid new card type', () => {
        expect(() => cardService.replaceCard('player1', 'W_123_test', 'X' as CardType))
          .toThrow('Invalid card type: X');
      });

      it('should throw error when player does not exist', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        
        expect(() => cardService.replaceCard('nonexistent', 'W_123_test', 'B'))
          .toThrow('Player nonexistent not found');
      });

      it('should throw error when player does not own the old card', () => {
        expect(() => cardService.replaceCard('player1', 'W_999_notowned', 'B'))
          .toThrow('Player player1 does not own card W_999_notowned');
      });
    });
  });

  describe('Card Information Methods', () => {
    describe('getCardType', () => {
      it('should extract card type from card ID', () => {
        expect(cardService.getCardType('W_123_test')).toBe('W');
        expect(cardService.getCardType('B_456_test')).toBe('B');
        expect(cardService.getCardType('E_789_test')).toBe('E');
        expect(cardService.getCardType('L_111_test')).toBe('L');
        expect(cardService.getCardType('I_222_test')).toBe('I');
      });

      it('should return null for invalid card ID format', () => {
        expect(cardService.getCardType('invalid_id')).toBeNull();
        expect(cardService.getCardType('X_123_test')).toBeNull();
        expect(cardService.getCardType('')).toBeNull();
      });
    });

    describe('getPlayerCards', () => {
      it('should return all cards when no card type specified', () => {
        const cards = cardService.getPlayerCards('player1');
        
        expect(cards).toEqual(['W_123_test', 'W_456_test', 'B_789_test', 'L_111_test']);
      });

      it('should return cards of specific type', () => {
        expect(cardService.getPlayerCards('player1', 'W')).toEqual(['W_123_test', 'W_456_test']);
        expect(cardService.getPlayerCards('player1', 'B')).toEqual(['B_789_test']);
        expect(cardService.getPlayerCards('player1', 'E')).toEqual([]);
      });

      it('should return empty array for invalid card type', () => {
        expect(cardService.getPlayerCards('player1', 'X' as CardType)).toEqual([]);
      });

      it('should return empty array when player does not exist', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        
        expect(cardService.getPlayerCards('nonexistent')).toEqual([]);
      });
    });

    describe('getPlayerCardCount', () => {
      it('should return total card count when no type specified', () => {
        expect(cardService.getPlayerCardCount('player1')).toBe(4);
      });

      it('should return count for specific card type', () => {
        expect(cardService.getPlayerCardCount('player1', 'W')).toBe(2);
        expect(cardService.getPlayerCardCount('player1', 'B')).toBe(1);
        expect(cardService.getPlayerCardCount('player1', 'E')).toBe(0);
      });

      it('should return 0 when player does not exist', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        
        expect(cardService.getPlayerCardCount('nonexistent')).toBe(0);
      });
    });
  });

  describe('Card Effect Methods', () => {
    describe('applyCardEffects', () => {
      it('should apply work card effects', () => {
        cardService.applyCardEffects('player1', 'W_123_test');
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 150 // 100 + 50
        });
      });

      it('should apply business card effects', () => {
        cardService.applyCardEffects('player1', 'B_789_test');
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 250 // 100 + 150
        });
      });

      it('should apply education card effects', () => {
        cardService.applyCardEffects('player1', 'E_123_test');
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          time: 4 // 5 - 1
        });
      });

      it('should apply life card effects', () => {
        cardService.applyCardEffects('player1', 'L_111_test');
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 125, // 100 + 25
          time: 7     // 5 + 2
        });
      });

      it('should apply investment card effects', () => {
        cardService.applyCardEffects('player1', 'I_123_test');
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 110 // 100 + (100 * 0.1)
        });
      });

      it('should handle unknown card types', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        
        // Mock getCardType to return an unknown type to trigger the warning
        jest.spyOn(cardService, 'getCardType').mockReturnValue('X' as any);
        
        const result = cardService.applyCardEffects('player1', 'X_123_test');
        
        expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown card type: X');
        expect(result).toBe(mockGameState);
        
        consoleWarnSpy.mockRestore();
      });

      it('should return current state for invalid card ID', () => {
        const result = cardService.applyCardEffects('player1', 'invalid_id');
        
        expect(result).toBe(mockGameState);
      });

      it('should throw error when player does not exist', () => {
        mockStateService.getPlayer.mockReturnValue(undefined);
        
        expect(() => cardService.applyCardEffects('nonexistent', 'W_123_test'))
          .toThrow('Player nonexistent not found');
      });

      it('should prevent time from going below zero for education cards', () => {
        const playerWithLowTime = {
          ...mockPlayer,
          time: 0
        };
        mockStateService.getPlayer.mockReturnValue(playerWithLowTime);
        
        cardService.applyCardEffects('player1', 'E_123_test');
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          time: 0 // Should not go below 0
        });
      });

      it('should handle investment cards with zero money', () => {
        const playerWithNoMoney = {
          ...mockPlayer,
          money: 0
        };
        mockStateService.getPlayer.mockReturnValue(playerWithNoMoney);
        
        cardService.applyCardEffects('player1', 'I_123_test');
        
        expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
          id: 'player1',
          money: 0 // 0 + (0 * 0.1) = 0
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle player not found in effect methods', () => {
      // Test each card effect method with undefined player
      mockStateService.getPlayer.mockReturnValue(undefined);
      
      expect(() => cardService.applyCardEffects('nonexistent', 'W_123_test'))
        .toThrow('Player nonexistent not found');
      
      expect(() => cardService.applyCardEffects('nonexistent', 'B_123_test'))
        .toThrow('Player nonexistent not found');
      
      expect(() => cardService.applyCardEffects('nonexistent', 'E_123_test'))
        .toThrow('Player nonexistent not found');
      
      expect(() => cardService.applyCardEffects('nonexistent', 'L_123_test'))
        .toThrow('Player nonexistent not found');
      
      expect(() => cardService.applyCardEffects('nonexistent', 'I_123_test'))
        .toThrow('Player nonexistent not found');
    });

    it('should handle card removal for different card types', () => {
      // Test removing cards from different types
      cardService.removeCard('player1', 'W_456_test');
      cardService.removeCard('player1', 'B_789_test');
      cardService.removeCard('player1', 'L_111_test');
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledTimes(3);
    });

    it('should generate unique card IDs when drawing cards', () => {
      jest.spyOn(Date, 'now').mockReturnValue(12345);
      jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
      
      cardService.drawCards('player1', 'W', 2);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        cards: expect.objectContaining({
          W: expect.arrayContaining([
            'W_123_test', 
            'W_456_test',
            expect.stringContaining('W_12345_')
          ])
        })
      });
    });

    it('should handle cards that require player turn', () => {
      // Mock requiresPlayerTurn to return true for testing
      jest.spyOn(cardService as any, 'requiresPlayerTurn').mockReturnValue(true);
      
      // Mock getCardType to return a valid type
      jest.spyOn(cardService, 'getCardType').mockReturnValue('W');
      
      mockStateService.getGameState.mockReturnValue({
        ...mockGameState,
        currentPlayerId: 'player2' // Different player
      });
      
      const canPlay = cardService.canPlayCard('player1', 'W_123_test');
      
      expect(canPlay).toBe(false);
    });

    it('should handle card type extraction with empty string', () => {
      const cardType = cardService.getCardType('');
      expect(cardType).toBeNull();
    });

    it('should handle draw cards with negative count', () => {
      const result = cardService.drawCards('player1', 'W', -1);
      expect(result).toBe(mockGameState);
      expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
    });

    it('should handle removing cards from different positions in array', () => {
      const playerWithManyCards = {
        ...mockPlayer,
        cards: {
          ...mockPlayer.cards,
          W: ['W_first', 'W_middle', 'W_last']
        }
      };
      mockStateService.getPlayer.mockReturnValue(playerWithManyCards);
      
      // Remove middle card
      cardService.removeCard('player1', 'W_middle');
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        cards: expect.objectContaining({
          W: ['W_first', 'W_last']
        })
      });
    });
  });
});