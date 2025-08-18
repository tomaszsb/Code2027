import { PlayerActionService } from '../../src/services/PlayerActionService';
import { IDataService, IStateService, IGameRulesService } from '../../src/types/ServiceContracts';
import { Player, Card } from '../../src/types/DataTypes';
import { GameState } from '../../src/types/StateTypes';

// Mock the services
const mockDataService: jest.Mocked<IDataService> = {
  getCardById: jest.fn(),
  getCards: jest.fn(),
  getCardsByType: jest.fn(),
  getAllCardTypes: jest.fn(),
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
  getAllSpaceContent: jest.fn(),
  isLoaded: jest.fn(),
  loadData: jest.fn(),
};

const mockStateService: jest.Mocked<IStateService> = {
  getGameState: jest.fn(),
  isStateLoaded: jest.fn(),
  addPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  removePlayer: jest.fn(),
  getPlayer: jest.fn(),
  getAllPlayers: jest.fn(),
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
};

const mockGameRulesService: jest.Mocked<IGameRulesService> = {
  isMoveValid: jest.fn(),
  canPlayCard: jest.fn(),
  canDrawCard: jest.fn(),
  canPlayerAfford: jest.fn(),
  isPlayerTurn: jest.fn(),
  isGameInProgress: jest.fn(),
  canPlayerTakeAction: jest.fn(),
};

describe('PlayerActionService', () => {
  let playerActionService: PlayerActionService;
  
  // Test data
  const mockPlayer: Player = {
    id: 'player1',
    name: 'Test Player',
    currentSpace: 'START-SPACE',
    visitType: 'First',
    money: 1000,
    time: 5,
    cards: {
      W: ['W001', 'W002'],
      B: ['B001'],
      E: ['E001'],
      L: [],
      I: ['I001']
    }
  };

  const mockGameState: GameState = {
    players: [mockPlayer],
    currentPlayerId: 'player1',
    gamePhase: 'PLAY',
    turn: 1,
    activeModal: null,
    awaitingChoice: null,
    hasPlayerMovedThisTurn: false
  };

  const mockCard: Card = {
    card_id: 'W001',
    card_name: 'Strategic Planning',
    card_type: 'W',
    description: 'Plan your next moves carefully.',
    effects_on_play: 'Draw 2 additional cards and gain 1 time unit.',
    cost: 100,
    phase_restriction: 'Planning'
  };

  const mockFreeCard: Card = {
    card_id: 'W002',
    card_name: 'Free Action',
    card_type: 'W',
    description: 'A free action card.',
    effects_on_play: 'Gain 1 time unit.',
    cost: 0,
    phase_restriction: 'Any'
  };

  const mockExpensiveCard: Card = {
    card_id: 'B001',
    card_name: 'Expensive Investment',
    card_type: 'B',
    description: 'A very expensive card.',
    effects_on_play: 'Gain massive advantage.',
    cost: 2000,
    phase_restriction: 'Any'
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create service instance
    playerActionService = new PlayerActionService(
      mockDataService,
      mockStateService,
      mockGameRulesService
    );

    // Setup default mock implementations
    mockStateService.getGameState.mockReturnValue(mockGameState);
    mockStateService.getPlayer.mockReturnValue(mockPlayer);
  });

  describe('playCard', () => {
    it('should successfully play a valid card', async () => {
      // Arrange
      mockDataService.getCardById.mockReturnValue(mockCard);
      mockGameRulesService.canPlayCard.mockReturnValue(true);
      mockGameRulesService.canPlayerAfford.mockReturnValue(true);
      mockStateService.updatePlayer.mockReturnValue(mockGameState);

      // Act
      await playerActionService.playCard('player1', 'W001');

      // Assert
      expect(mockDataService.getCardById).toHaveBeenCalledWith('W001');
      expect(mockGameRulesService.canPlayCard).toHaveBeenCalledWith('player1', 'W001');
      expect(mockGameRulesService.canPlayerAfford).toHaveBeenCalledWith('player1', 100);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        money: 900, // 1000 - 100
        cards: {
          W: ['W002'], // W001 removed
          B: ['B001'],
          E: ['E001'],
          L: [],
          I: ['I001']
        }
      });
    });

    it('should successfully play a free card (cost 0)', async () => {
      // Arrange
      mockDataService.getCardById.mockReturnValue(mockFreeCard);
      mockGameRulesService.canPlayCard.mockReturnValue(true);
      mockStateService.updatePlayer.mockReturnValue(mockGameState);

      // Act
      await playerActionService.playCard('player1', 'W002');

      // Assert
      expect(mockGameRulesService.canPlayerAfford).not.toHaveBeenCalled(); // Should not check affordability for free cards
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        money: 1000, // No cost deducted
        cards: {
          W: ['W001'], // W002 removed
          B: ['B001'],
          E: ['E001'],
          L: [],
          I: ['I001']
        }
      });
    });

    it('should successfully play a card with undefined cost', async () => {
      // Arrange
      const cardWithoutCost: Card = {
        ...mockCard,
        cost: undefined
      };
      mockDataService.getCardById.mockReturnValue(cardWithoutCost);
      mockGameRulesService.canPlayCard.mockReturnValue(true);
      mockStateService.updatePlayer.mockReturnValue(mockGameState);

      // Act
      await playerActionService.playCard('player1', 'W001');

      // Assert
      expect(mockGameRulesService.canPlayerAfford).not.toHaveBeenCalled(); // Should not check affordability for undefined cost
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        money: 1000, // No cost deducted
        cards: {
          W: ['W002'], // W001 removed
          B: ['B001'],
          E: ['E001'],
          L: [],
          I: ['I001']
        }
      });
    });

    it('should throw error when player not found', async () => {
      // Arrange
      mockStateService.getPlayer.mockReturnValue(undefined);

      // Act & Assert
      await expect(playerActionService.playCard('nonexistent', 'W001'))
        .rejects.toThrow("Failed to play card: Player with ID 'nonexistent' not found");
    });

    it('should throw error when card not found', async () => {
      // Arrange
      mockDataService.getCardById.mockReturnValue(undefined);

      // Act & Assert
      await expect(playerActionService.playCard('player1', 'NONEXISTENT'))
        .rejects.toThrow("Failed to play card: Card with ID 'NONEXISTENT' not found");
    });

    it('should throw error when card play validation fails', async () => {
      // Arrange
      mockDataService.getCardById.mockReturnValue(mockCard);
      mockGameRulesService.canPlayCard.mockReturnValue(false);

      // Act & Assert
      await expect(playerActionService.playCard('player1', 'W001'))
        .rejects.toThrow("Failed to play card: Player 'Test Player' cannot play card 'Strategic Planning'. Validation failed.");
    });

    it('should throw error when player cannot afford the card', async () => {
      // Arrange
      mockDataService.getCardById.mockReturnValue(mockExpensiveCard);
      mockGameRulesService.canPlayCard.mockReturnValue(true);
      mockGameRulesService.canPlayerAfford.mockReturnValue(false);

      // Act & Assert
      await expect(playerActionService.playCard('player1', 'B001'))
        .rejects.toThrow("Failed to play card: Player 'Test Player' cannot afford card 'Expensive Investment'. Cost: $2000, Available: $1000");
    });

    it('should throw error when player does not have the card in their hand', async () => {
      // Arrange
      const cardNotInHand: Card = {
        card_id: 'W999',
        card_name: 'Not Owned Card',
        card_type: 'W',
        description: 'A card the player does not have.',
        cost: 0
      };
      
      mockDataService.getCardById.mockReturnValue(cardNotInHand);
      mockGameRulesService.canPlayCard.mockReturnValue(true);

      // Act & Assert
      await expect(playerActionService.playCard('player1', 'W999'))
        .rejects.toThrow("Failed to play card: Player 'Test Player' does not have card 'Not Owned Card' in their W hand");
    });

    it('should handle cards from different types correctly', async () => {
      // Arrange - Test playing a B card
      const bCard: Card = {
        card_id: 'B001',
        card_name: 'Budget Card',
        card_type: 'B',
        description: 'A budget card.',
        cost: 50
      };
      
      mockDataService.getCardById.mockReturnValue(bCard);
      mockGameRulesService.canPlayCard.mockReturnValue(true);
      mockGameRulesService.canPlayerAfford.mockReturnValue(true);
      mockStateService.updatePlayer.mockReturnValue(mockGameState);

      // Act
      await playerActionService.playCard('player1', 'B001');

      // Assert
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        money: 950, // 1000 - 50
        cards: {
          W: ['W001', 'W002'],
          B: [], // B001 removed
          E: ['E001'],
          L: [],
          I: ['I001']
        }
      });
    });

    it('should handle empty card hands correctly', async () => {
      // Arrange - Player tries to play from empty L hand
      const lCard: Card = {
        card_id: 'L001',
        card_name: 'Legal Card',
        card_type: 'L',
        description: 'A legal card.',
        cost: 0
      };
      
      mockDataService.getCardById.mockReturnValue(lCard);
      mockGameRulesService.canPlayCard.mockReturnValue(true);

      // Act & Assert
      await expect(playerActionService.playCard('player1', 'L001'))
        .rejects.toThrow("Failed to play card: Player 'Test Player' does not have card 'Legal Card' in their L hand");
    });

    it('should handle cards without effects gracefully', async () => {
      // Arrange
      const cardWithoutEffects: Card = {
        card_id: 'W001',
        card_name: 'Simple Card',
        card_type: 'W',
        description: 'A simple card.',
        cost: 10,
        effects_on_play: undefined
      };
      
      mockDataService.getCardById.mockReturnValue(cardWithoutEffects);
      mockGameRulesService.canPlayCard.mockReturnValue(true);
      mockGameRulesService.canPlayerAfford.mockReturnValue(true);
      mockStateService.updatePlayer.mockReturnValue(mockGameState);

      // Act
      await playerActionService.playCard('player1', 'W001');

      // Assert - verify the card was played successfully by checking service calls
      expect(mockDataService.getCardById).toHaveBeenCalledWith('W001');
      expect(mockGameRulesService.canPlayCard).toHaveBeenCalledWith('player1', 'W001');
      expect(mockGameRulesService.canPlayerAfford).toHaveBeenCalledWith('player1', 10);
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        money: 990, // 1000 - 10
        cards: {
          W: ['W002'], // W001 removed
          B: ['B001'],
          E: ['E001'],
          L: [],
          I: ['I001']
        }
      });
    });

    it('should preserve other services state when updatePlayer fails', async () => {
      // Arrange
      mockDataService.getCardById.mockReturnValue(mockCard);
      mockGameRulesService.canPlayCard.mockReturnValue(true);
      mockGameRulesService.canPlayerAfford.mockReturnValue(true);
      mockStateService.updatePlayer.mockImplementation(() => {
        throw new Error('State update failed');
      });

      // Act & Assert
      await expect(playerActionService.playCard('player1', 'W001'))
        .rejects.toThrow('Failed to play card: State update failed');

      // Verify that validation methods were still called
      expect(mockDataService.getCardById).toHaveBeenCalledWith('W001');
      expect(mockGameRulesService.canPlayCard).toHaveBeenCalledWith('player1', 'W001');
      expect(mockGameRulesService.canPlayerAfford).toHaveBeenCalledWith('player1', 100);
    });
  });

  describe('service integration', () => {
    it('should call services in the correct order', async () => {
      // Arrange
      const callOrder: string[] = [];
      
      mockStateService.getGameState.mockImplementation(() => {
        callOrder.push('getGameState');
        return mockGameState;
      });
      
      mockStateService.getPlayer.mockImplementation(() => {
        callOrder.push('getPlayer');
        return mockPlayer;
      });
      
      mockDataService.getCardById.mockImplementation(() => {
        callOrder.push('getCardById');
        return mockCard;
      });
      
      mockGameRulesService.canPlayCard.mockImplementation(() => {
        callOrder.push('canPlayCard');
        return true;
      });
      
      mockGameRulesService.canPlayerAfford.mockImplementation(() => {
        callOrder.push('canPlayerAfford');
        return true;
      });
      
      mockStateService.updatePlayer.mockImplementation(() => {
        callOrder.push('updatePlayer');
        return mockGameState;
      });

      // Act
      await playerActionService.playCard('player1', 'W001');

      // Assert
      expect(callOrder).toEqual([
        'getGameState',
        'getPlayer',
        'getCardById',
        'canPlayCard',
        'canPlayerAfford',
        'updatePlayer'
      ]);
    });

    it('should not call updatePlayer if validation fails early', async () => {
      // Arrange
      mockStateService.getPlayer.mockReturnValue(undefined);

      // Act & Assert
      await expect(playerActionService.playCard('player1', 'W001'))
        .rejects.toThrow();

      // Verify updatePlayer was not called
      expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
    });
  });
});