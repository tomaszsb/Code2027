import { CardService } from '../../src/services/CardService';
import { IDataService, IStateService, IResourceService, ILoggingService } from '../../src/types/ServiceContracts';
import { GameState, Player } from '../../src/types/StateTypes';
import { CardType } from '../../src/types/DataTypes';
import { createMockDataService, createMockStateService, createMockResourceService, createMockLoggingService } from '../mocks/mockServices';

describe('CardService - Enhanced Coverage', () => {
  let cardService: CardService;
  let mockDataService: jest.Mocked<IDataService>;
  let mockStateService: jest.Mocked<IStateService>;
  let mockResourceService: jest.Mocked<IResourceService>;
  let mockLoggingService: jest.Mocked<ILoggingService>;

  const mockPlayer: Player = {
    id: 'player1',
    name: 'Alice',
    currentSpace: 'TEST-SPACE',
    visitType: 'First',
    money: 100,
    timeSpent: 5,
    projectScope: 0,
    score: 0,
    color: '#007bff',
    avatar: '👤',
    hand: ['W_active_001'], // Player now has a simple hand array
    activeCards: [
      { cardId: 'W_expired_001', expirationTurn: 2 },  // Should expire
      { cardId: 'B_active_001', expirationTurn: 5 }    // Should remain active
    ],
    turnModifiers: { skipTurns: 0 },
    activeEffects: [],
    loans: []
  };

  const mockGameState: GameState = {
    players: [mockPlayer],
    currentPlayerId: 'player1',
    gamePhase: 'PLAY',
    turn: 3,
    hasPlayerMovedThisTurn: false,
    hasPlayerRolledDice: false,
    awaitingChoice: null,
    isGameOver: false,
    activeModal: null,
    requiredActions: 1,
    completedActions: 0,
    availableActionTypes: [],
    hasCompletedManualActions: false,
    activeNegotiation: null,
    globalActionLog: [],
    preSpaceEffectState: null,
    decks: {
      W: ['W001', 'W002', 'W003'], // Mock deck with sample cards
      B: ['B001', 'B002'],
      E: ['E001', 'E002', 'E003'],
      L: ['L001'],
      I: ['I001', 'I002']
    },
    discardPiles: {
      W: [], // Empty discard piles
      B: [],
      E: [],
      L: [],
      I: []
    }
  };

  beforeEach(() => {
    // Create mocks using centralized creators
    mockDataService = createMockDataService();
    mockStateService = createMockStateService();
    mockResourceService = createMockResourceService();
    mockLoggingService = createMockLoggingService();

    // Setup default mock responses
    mockStateService.getGameState.mockReturnValue(mockGameState);
    mockStateService.getPlayer.mockReturnValue(mockPlayer);
    mockStateService.getAllPlayers.mockReturnValue([mockPlayer]);
    mockStateService.updatePlayer.mockReturnValue(mockGameState);
    mockStateService.updateGameState.mockReturnValue(mockGameState);

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

    // Setup getCardsByType mock to return sample cards for each type
    mockDataService.getCardsByType.mockImplementation((cardType: CardType) => {
      const sampleCards = {
        W: [
          { card_id: 'W001', card_name: 'Work Card 1', card_type: 'W' as const, description: 'Test work card' },
          { card_id: 'W002', card_name: 'Work Card 2', card_type: 'W' as const, description: 'Test work card' },
          { card_id: 'W003', card_name: 'Work Card 3', card_type: 'W' as const, description: 'Test work card' }
        ],
        B: [
          { card_id: 'B001', card_name: 'Business Card 1', card_type: 'B' as const, description: 'Test business card' }
        ],
        E: [
          { card_id: 'E001', card_name: 'Economic Card 1', card_type: 'E' as const, description: 'Test economic card' }
        ],
        L: [
          { card_id: 'L001', card_name: 'Loan Card 1', card_type: 'L' as const, description: 'Test loan card' }
        ],
        I: [
          { card_id: 'I001', card_name: 'Investment Card 1', card_type: 'I' as const, description: 'Test investment card' }
        ]
      };
      return sampleCards[cardType] || [];
    });

    cardService = new CardService(mockDataService, mockStateService, mockResourceService, mockLoggingService);
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
      // Clear previous mock calls to ensure accurate count
      jest.clearAllMocks();
      
      const player2: Player = {
        ...mockPlayer,
        id: 'player2',
        name: 'Player2',
        activeCards: [{ cardId: 'B_expired_002', expirationTurn: 1 }],
        hand: [] // Ensure player2 has the new hand structure
      };
      
      // Create a modified game state with both players
      const gameStateWithTwoPlayers = {
        ...mockGameState,
        players: [mockPlayer, player2]
      };
      
      // Re-setup mocks for this test
      mockStateService.getGameState.mockReturnValue(gameStateWithTwoPlayers);
      mockStateService.getAllPlayers.mockReturnValue([mockPlayer, player2]);
      mockStateService.updatePlayer.mockReturnValue(gameStateWithTwoPlayers);
      mockStateService.updateGameState.mockReturnValue(gameStateWithTwoPlayers);
      
      cardService.endOfTurn();

      // Should update both players (both have expired cards)
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
        projectScope: 0,
        score: 0,
        color: '#28a745',
        avatar: '🧑',
        hand: [],
        activeCards: [],
        turnModifiers: { skipTurns: 0 },
        activeEffects: [],
        loans: []
      };

      mockStateService.getAllPlayers.mockReturnValue([mockPlayer, targetPlayer]);
      // Use a transferable card type (E and L cards are transferable)
      const transferablePlayer: Player = {
        ...mockPlayer,
        hand: ['E_transferable_001'] // E cards are transferable
      };
      
      // Mock getPlayer to return the correct players for the transfer operation
      mockStateService.getPlayer.mockImplementation((playerId: string) => {
        if (playerId === 'player1') return transferablePlayer;
        if (playerId === 'player2') return targetPlayer;
        return undefined;
      });

      const result = cardService.transferCard('player1', 'player2', 'E_transferable_001');

      expect(result).toEqual(mockGameState);
      
      // Should update source player to remove card from hand
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player1',
          hand: []  // Card removed from hand
        })
      );

      // Should update target player to add card to hand
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player2',
          hand: ['E_transferable_001']  // Card added to hand
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

    it('should draw cards from stateful decks and update player hand', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Arrange: Ensure getPlayer returns the mock player with initial hand
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      // Act: Draw 2 'W' cards from the deck
      const drawnCards = cardService.drawCards('player1', 'W', 2);

      // Assert: Should return the drawn card IDs
      expect(drawnCards).toHaveLength(2);
      expect(drawnCards).toEqual(['W003', 'W002']); // Cards drawn from top of deck (LIFO)

      // Assert: Should update player's hand
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player1',
          hand: ['W_active_001', 'W003', 'W002'] // Original card + 2 new cards
        })
      );

      // Assert: Should update global deck state
      expect(mockStateService.updateGameState).toHaveBeenCalledWith(
        expect.objectContaining({
          decks: expect.objectContaining({
            W: ['W001'] // Deck should have 1 card remaining (original 3 - 2 drawn)
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

  describe('Phase Restriction System', () => {
    const mockConstructionCard = {
      card_id: 'L001',
      card_name: 'Construction Card',
      card_type: 'L' as const,
      description: 'Test construction card',
      phase_restriction: 'CONSTRUCTION',
      cost: 0
    };

    const mockDesignCard = {
      card_id: 'E001',
      card_name: 'Design Card',
      card_type: 'E' as const,
      description: 'Test design card',
      phase_restriction: 'DESIGN',
      cost: 0
    };

    const mockFundingCard = {
      card_id: 'E066',
      card_name: 'Funding Card',
      card_type: 'E' as const,
      description: 'Test funding card',
      phase_restriction: 'FUNDING',
      cost: 0
    };

    const mockRegulatoryCard = {
      card_id: 'E005',
      card_name: 'Regulatory Card',
      card_type: 'E' as const,
      description: 'Test regulatory card',
      phase_restriction: 'REGULATORY_REVIEW',
      cost: 0
    };

    const mockAnyPhaseCard = {
      card_id: 'B001',
      card_name: 'Any Phase Card',
      card_type: 'B' as const,
      description: 'Test any phase card',
      phase_restriction: 'Any',
      cost: 0
    };

    const mockNoPhaseRestrictionCard = {
      card_id: 'W001',
      card_name: 'No Phase Card',
      card_type: 'W' as const,
      description: 'Test no phase restriction card',
      cost: 0
    };

    beforeEach(() => {
      // Set up player with cards in hand
      const playerWithCards = {
        ...mockPlayer,
        hand: ['W001', 'B001', 'E001', 'E066', 'E005', 'L001'] // All cards now in hand
      };
      mockStateService.getPlayer.mockReturnValue(playerWithCards);

      // Mock card data responses
      mockDataService.getCardById.mockImplementation((cardId: string) => {
        switch (cardId) {
          case 'L001': return mockConstructionCard;
          case 'E001': return mockDesignCard;
          case 'E066': return mockFundingCard;
          case 'E005': return mockRegulatoryCard;
          case 'B001': return mockAnyPhaseCard;
          case 'W001': return mockNoPhaseRestrictionCard;
          default: return undefined;
        }
      });
    });

    it('should allow construction cards only on construction spaces', () => {
      // Setup: Player on construction space
      mockDataService.getGameConfigBySpace.mockReturnValue({
        space_name: 'CON-INITIATION',
        phase: 'CONSTRUCTION',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4,
        requires_dice_roll: false,
        space_order: 1
      });

      // Test: Can play construction card
      expect(cardService.canPlayCard('player1', 'L001')).toBe(true);

      // Test: Construction card validates properly
      const validation = (cardService as any).validateCardPlay('player1', 'L001');
      expect(validation.isValid).toBe(true);
    });

    it('should prevent construction cards on non-construction spaces', () => {
      // Setup: Player on design space
      mockDataService.getGameConfigBySpace.mockReturnValue({
        space_name: 'ARCH-INITIATION',
        phase: 'DESIGN',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4,
        requires_dice_roll: false,
        space_order: 1
      });

      // Test: Cannot play construction card
      expect(cardService.canPlayCard('player1', 'L001')).toBe(false);

      // Test: Construction card validation fails with proper message
      const validation = (cardService as any).validateCardPlay('player1', 'L001');
      expect(validation.isValid).toBe(false);
      expect(validation.errorMessage).toContain('Card can only be played during CONSTRUCTION phase');
      expect(validation.errorMessage).toContain('Current activity: DESIGN');
    });

    it('should allow design cards only on design spaces', () => {
      // Setup: Player on design space
      mockDataService.getGameConfigBySpace.mockReturnValue({
        space_name: 'ARCH-INITIATION',
        phase: 'DESIGN',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4,
        requires_dice_roll: false,
        space_order: 1
      });

      // Test: Can play design card
      expect(cardService.canPlayCard('player1', 'E001')).toBe(true);

      // Test: Design card validates properly
      const validation = (cardService as any).validateCardPlay('player1', 'E001');
      expect(validation.isValid).toBe(true);
    });

    it('should allow funding cards only on funding spaces', () => {
      // Setup: Player on funding space
      mockDataService.getGameConfigBySpace.mockReturnValue({
        space_name: 'BANK-FUND-REVIEW',
        phase: 'FUNDING',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4,
        requires_dice_roll: false,
        space_order: 1
      });

      // Test: Can play funding card
      expect(cardService.canPlayCard('player1', 'E066')).toBe(true);

      // Test: Funding card validates properly
      const validation = (cardService as any).validateCardPlay('player1', 'E066');
      expect(validation.isValid).toBe(true);
    });

    it('should allow regulatory cards only on regulatory spaces', () => {
      // Setup: Player on regulatory space  
      mockDataService.getGameConfigBySpace.mockReturnValue({
        space_name: 'REG-DOB-FEE-REVIEW',
        phase: 'REGULATORY',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4,
        requires_dice_roll: false,
        space_order: 1
      });

      // Test: Can play regulatory card
      expect(cardService.canPlayCard('player1', 'E005')).toBe(true);

      // Test: Regulatory card validates properly
      const validation = (cardService as any).validateCardPlay('player1', 'E005');
      expect(validation.isValid).toBe(true);
    });

    it('should allow "Any" phase cards on any space', () => {
      // Test on construction space
      mockDataService.getGameConfigBySpace.mockReturnValue({
        space_name: 'CON-INITIATION',
        phase: 'CONSTRUCTION',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4,
        requires_dice_roll: false,
        space_order: 1
      });

      expect(cardService.canPlayCard('player1', 'B001')).toBe(true);

      // Test on design space
      mockDataService.getGameConfigBySpace.mockReturnValue({
        space_name: 'ARCH-INITIATION',
        phase: 'DESIGN',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4,
        requires_dice_roll: false,
        space_order: 1
      });

      expect(cardService.canPlayCard('player1', 'B001')).toBe(true);
    });

    it('should allow cards with no phase restriction on any space', () => {
      // Test on construction space
      mockDataService.getGameConfigBySpace.mockReturnValue({
        space_name: 'CON-INITIATION',
        phase: 'CONSTRUCTION',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4,
        requires_dice_roll: false,
        space_order: 1
      });

      expect(cardService.canPlayCard('player1', 'W001')).toBe(true);

      // Test on design space
      mockDataService.getGameConfigBySpace.mockReturnValue({
        space_name: 'ARCH-INITIATION',
        phase: 'DESIGN',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4,
        requires_dice_roll: false,
        space_order: 1
      });

      expect(cardService.canPlayCard('player1', 'W001')).toBe(true);
    });

    it('should allow any card when player is on a space without a phase', () => {
      // Setup: Player on a space with no phase (like START or generic spaces)
      mockDataService.getGameConfigBySpace.mockReturnValue({
        space_name: 'GENERIC-SPACE',
        phase: '', // No phase
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4,
        requires_dice_roll: false,
        space_order: 1
      });

      // Test: All restricted cards should be allowed
      expect(cardService.canPlayCard('player1', 'L001')).toBe(true); // Construction card
      expect(cardService.canPlayCard('player1', 'E001')).toBe(true); // Design card
      expect(cardService.canPlayCard('player1', 'E066')).toBe(true); // Funding card
      expect(cardService.canPlayCard('player1', 'E005')).toBe(true); // Regulatory card
    });

    it('should allow any card when space config is not found', () => {
      // Setup: Player on unknown space
      mockDataService.getGameConfigBySpace.mockReturnValue(undefined);

      // Test: All restricted cards should be allowed due to no space config
      expect(cardService.canPlayCard('player1', 'L001')).toBe(true); // Construction card
      expect(cardService.canPlayCard('player1', 'E001')).toBe(true); // Design card
      expect(cardService.canPlayCard('player1', 'E066')).toBe(true); // Funding card
      expect(cardService.canPlayCard('player1', 'E005')).toBe(true); // Regulatory card
    });

    it('should handle player not found gracefully', () => {
      mockStateService.getPlayer.mockReturnValue(undefined);

      expect(cardService.canPlayCard('nonexistent', 'L001')).toBe(false);

      const validation = (cardService as any).validateCardPlay('nonexistent', 'L001');
      expect(validation.isValid).toBe(false);
      expect(validation.errorMessage).toContain('Player nonexistent not found');
    });
  });
});