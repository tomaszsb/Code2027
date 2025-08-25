import { CardService } from '../../src/services/CardService';
import { IDataService, IStateService } from '../../src/types/ServiceContracts';
import { GameState, Player } from '../../src/types/StateTypes';
import { CardType } from '../../src/types/DataTypes';

describe('CardService - Enhanced Coverage', () => {
  let cardService: CardService;
  let mockDataService: jest.Mocked<IDataService>;
  let mockStateService: jest.Mocked<IStateService>;

  const mockPlayer: Player = {
    id: 'player1',
    name: 'Alice',
    currentSpace: 'TEST-SPACE',
    visitType: 'First',
    money: 100,
    timeSpent: 5,
    color: '#007bff',
    avatar: '👤',
    availableCards: {
      W: ['W_active_001'],
      B: [],
      E: [],
      L: [],
      I: []
    },
    activeCards: [
      { cardId: 'W_expired_001', expirationTurn: 2 },  // Should expire
      { cardId: 'B_active_001', expirationTurn: 5 }    // Should remain active
    ],
    discardedCards: {
      W: [],
      B: [],
      E: [],
      L: [],
      I: []
    }
  };

  const mockGameState: GameState = {
    players: [mockPlayer],
    currentPlayerId: 'player1',
    gamePhase: 'PLAY',
    turn: 3,
    hasPlayerMovedThisTurn: false,
    awaitingChoice: false,
    isGameOver: false
  };

  beforeEach(() => {
    // Create comprehensive mocks
    mockDataService = {
      getCardById: jest.fn(),
      getCards: jest.fn(),
      getCardsByType: jest.fn(),
      getAllCardTypes: jest.fn(),
      isLoaded: jest.fn(),
      loadData: jest.fn(),
      getGameConfig: jest.fn(),
      getGameConfigBySpace: jest.fn(),
      getAllSpaces: jest.fn(),
      getSpaceByName: jest.fn(),
      getMovement: jest.fn(),
      getAllMovements: jest.fn(),
      getDiceOutcome: jest.fn(),
      getAllDiceOutcomes: jest.fn(),
      getSpaceEffects: jest.fn(),
      getAllSpaceEffects: jest.fn(),
      getDiceEffects: jest.fn(),
      getAllDiceEffects: jest.fn(),
      getSpaceContent: jest.fn(),
      getAllSpaceContent: jest.fn()
    };

    mockStateService = {
      getGameState: jest.fn(),
      getPlayer: jest.fn(),
      updatePlayer: jest.fn(),
      getAllPlayers: jest.fn(),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
      setCurrentPlayer: jest.fn(),
      setGamePhase: jest.fn(),
      advanceTurn: jest.fn(),
      nextPlayer: jest.fn(),
      initializeGame: jest.fn(),
      startGame: jest.fn(),
      endGame: jest.fn(),
      resetGame: jest.fn(),
      setAwaitingChoice: jest.fn(),
      clearAwaitingChoice: jest.fn(),
      setPlayerHasMoved: jest.fn(),
      clearPlayerHasMoved: jest.fn(),
      showCardModal: jest.fn(),
      dismissModal: jest.fn(),
      validatePlayerAction: jest.fn(),
      canStartGame: jest.fn(),
      isStateLoaded: jest.fn()
    };

    // Setup default mock responses
    mockStateService.getGameState.mockReturnValue(mockGameState);
    mockStateService.getPlayer.mockReturnValue(mockPlayer);
    mockStateService.getAllPlayers.mockReturnValue([mockPlayer]);
    mockStateService.updatePlayer.mockReturnValue(mockGameState);

    // Setup card data
    mockDataService.getCardById.mockImplementation((cardId: string) => {
      const baseCard = {
        card_id: cardId,
        card_name: 'Test Card',
        description: 'Test card with $1000 cost',
        effects_on_play: 'Test effect',
        cost: 10,
        phase_restriction: ''
      };
      
      if (cardId.startsWith('W_')) return { ...baseCard, card_type: 'W' };
      if (cardId.startsWith('B_')) return { ...baseCard, card_type: 'B' };
      if (cardId.startsWith('E_')) return { ...baseCard, card_type: 'E' };
      if (cardId.startsWith('L_')) return { ...baseCard, card_type: 'L' };
      if (cardId.startsWith('I_')) return { ...baseCard, card_type: 'I' };
      return undefined;
    });

    cardService = new CardService(mockDataService, mockStateService);
  });

  describe('Card Expiration System', () => {
    it('should process card expirations correctly on endOfTurn', () => {
      cardService.endOfTurn();

      // Should update player to remove expired cards and keep active ones
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player1',
          activeCards: [
            { cardId: 'B_active_001', expirationTurn: 5 }
          ]
        })
      );
    });

    it('should process multiple players during endOfTurn', () => {
      const player2: Player = {
        ...mockPlayer,
        id: 'player2',
        activeCards: [{ cardId: 'B_expired_002', expirationTurn: 1 }]
      };
      
      mockStateService.getAllPlayers.mockReturnValue([mockPlayer, player2]);
      
      cardService.endOfTurn();

      // Should update both players
      expect(mockStateService.updatePlayer).toHaveBeenCalledTimes(2);
    });

    it('should handle player with no active cards', () => {
      const playerWithNoActiveCards: Player = {
        ...mockPlayer,
        activeCards: []
      };
      
      mockStateService.getAllPlayers.mockReturnValue([playerWithNoActiveCards]);

      expect(() => cardService.endOfTurn()).not.toThrow();
    });
  });

  describe('Card Transfer System', () => {
    it('should transfer cards between players successfully', () => {
      const targetPlayer: Player = {
        id: 'player2',
        name: 'Bob',
        currentSpace: 'TEST-SPACE',
        visitType: 'First',
        money: 50,
        timeSpent: 3,
        color: '#28a745',
        avatar: '🧑',
        availableCards: { W: [], B: [], E: [], L: [], I: [] },
        activeCards: [],
        discardedCards: { W: [], B: [], E: [], L: [], I: [] }
      };

      mockStateService.getAllPlayers.mockReturnValue([mockPlayer, targetPlayer]);
      // Use a transferable card type (E and L cards are transferable)
      const transferablePlayer: Player = {
        ...mockPlayer,
        availableCards: { W: [], B: [], E: ['E_transferable_001'], L: [], I: [] }
      };
      
      // Mock getPlayer to return the correct players for the transfer operation
      mockStateService.getPlayer.mockImplementation((playerId: string) => {
        if (playerId === 'player1') return transferablePlayer;
        if (playerId === 'player2') return targetPlayer;
        return undefined;
      });

      const result = cardService.transferCard('player1', 'player2', 'E_transferable_001');

      expect(result).toBe(mockGameState);
      
      // Should update source player to remove card
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player1',
          availableCards: expect.objectContaining({
            E: []  // Card removed
          })
        })
      );

      // Should update target player to add card
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player2',
          availableCards: expect.objectContaining({
            E: ['E_transferable_001']  // Card added
          })
        })
      );
    });

    it('should handle transfer errors gracefully', () => {
      // Setup getPlayer to return undefined for non-existent players
      mockStateService.getPlayer.mockImplementation((playerId: string) => {
        if (playerId === 'player1') return mockPlayer;
        return undefined;
      });

      expect(() => {
        cardService.transferCard('nonexistent', 'player1', 'W_active_001');
      }).toThrow('Source player nonexistent not found');

      expect(() => {
        cardService.transferCard('player1', 'nonexistent', 'W_active_001');
      }).toThrow('Target player nonexistent not found');

      expect(() => {
        cardService.transferCard('player1', 'player1', 'E_transferable_001');
      }).toThrow('Cannot transfer card to yourself');

      // Test non-transferable card types
      mockStateService.getPlayer.mockReturnValue(mockPlayer);  // Reset mock
      expect(() => {
        cardService.transferCard('player1', 'player2', 'W_active_001');
      }).toThrow('W cards cannot be transferred');
    });
  });

  describe('Card Collection Management', () => {
    it('should check card ownership across all collections', () => {
      // Reset mock to return proper player data
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      
      // Test available cards
      expect(cardService.playerOwnsCard('player1', 'W_active_001')).toBe(true);
      
      // Test active cards  
      expect(cardService.playerOwnsCard('player1', 'W_expired_001')).toBe(true);
      
      // Test non-existent card
      expect(cardService.playerOwnsCard('player1', 'X_nonexistent')).toBe(false);
      
      // Test non-existent player
      mockStateService.getPlayer.mockImplementation((playerId: string) => {
        return playerId === 'player1' ? mockPlayer : undefined;
      });
      expect(cardService.playerOwnsCard('nonexistent', 'W_active_001')).toBe(false);
    });

    it('should generate unique card IDs when drawing cards', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Ensure getPlayer returns the mock player
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      
      cardService.drawCards('player1', 'W', 3);

      // Check that updatePlayer was called with unique card IDs
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player1',
          availableCards: expect.objectContaining({
            W: expect.arrayContaining([
              expect.stringMatching(/^W_\d+_[a-z0-9]+_\d+$/),
              expect.stringMatching(/^W_\d+_[a-z0-9]+_\d+$/),
              expect.stringMatching(/^W_\d+_[a-z0-9]+_\d+$/)
            ])
          })
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Card Type Detection', () => {
    it('should extract card type from card ID via DataService', () => {
      const cardType = cardService.getCardType('W_test_123');
      expect(cardType).toBe('W');
      expect(mockDataService.getCardById).toHaveBeenCalledWith('W_test_123');
    });

    it('should fallback to ID parsing when DataService fails', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockDataService.getCardById.mockReturnValue(undefined);

      const cardType = cardService.getCardType('B_fallback_456');
      expect(cardType).toBe('B');
      
      consoleSpy.mockRestore();
    });

    it('should return null for invalid card ID format', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockDataService.getCardById.mockReturnValue(undefined);

      const cardType = cardService.getCardType('invalid');
      expect(cardType).toBeNull();
      
      consoleSpy.mockRestore();
    });
  });
});