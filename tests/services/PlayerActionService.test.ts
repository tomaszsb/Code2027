console.log('IMPORT: About to import PlayerActionService...');
import { PlayerActionService } from '../../src/services/PlayerActionService';
console.log('IMPORT: PlayerActionService imported successfully');
import { IDataService, IStateService, IGameRulesService, IMovementService, ITurnService, IEffectEngineService } from '../../src/types/ServiceContracts';
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
  checkWinCondition: jest.fn(),
};

const mockMovementService: jest.Mocked<IMovementService> = {
  getValidMoves: jest.fn(),
  movePlayer: jest.fn(),
  getDiceDestination: jest.fn(),
  resolveChoice: jest.fn(),
};

const mockTurnService: jest.Mocked<ITurnService> = {
  takeTurn: jest.fn(),
  endTurn: jest.fn(),
  rollDice: jest.fn(),
  canPlayerTakeTurn: jest.fn(),
  getCurrentPlayerTurn: jest.fn(),
  processTurnEffects: jest.fn(),
  rollDiceAndProcessEffects: jest.fn(),
  endTurnWithMovement: jest.fn(),
  rollDiceWithFeedback: jest.fn(),
  triggerManualEffectWithFeedback: jest.fn(),
  performNegotiation: jest.fn(),
  setTurnModifier: jest.fn(),
};

const mockEffectEngineService: jest.Mocked<IEffectEngineService> = {
  processEffects: jest.fn(),
  processEffect: jest.fn(),
  validateEffect: jest.fn(),
  validateEffects: jest.fn(),
};

console.log('LOADING: Test file is being loaded...');

describe('PlayerActionService', () => {
  console.log('DESCRIBE: Inside PlayerActionService describe block');
  let playerActionService: PlayerActionService;
  
  // Test data
  const mockPlayer: Player = {
    id: 'player1',
    name: 'Test Player',
    currentSpace: 'START-SPACE',
    visitType: 'First',
    money: 1000,
    time: 5,
    availableCards: {
      W: ['W001', 'W002'],
      B: ['B001'],
      E: ['E001'],
      L: [],
      I: []
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
    console.log('BEFORE_EACH: Starting beforeEach setup...');
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create service instance
    playerActionService = new PlayerActionService(
      mockDataService,
      mockStateService,
      mockGameRulesService,
      mockMovementService,
      mockTurnService,
      mockEffectEngineService
    );

    // Setup default EffectEngineService mock
    mockEffectEngineService.processEffects.mockResolvedValue({
      success: true,
      totalEffects: 0,
      successfulEffects: 0,
      failedEffects: 0,
      results: [],
      errors: []
    });
    mockEffectEngineService.processEffect.mockResolvedValue({
      success: true,
      message: 'Mock effect processed',
      metadata: {}
    });
    mockEffectEngineService.validateEffect.mockReturnValue(true);
    mockEffectEngineService.validateEffects.mockReturnValue(true);

    // Setup default mock implementations
    mockStateService.getGameState.mockReturnValue(mockGameState);
    mockStateService.getPlayer.mockReturnValue(mockPlayer);
    
    // Setup default MovementService mock implementations
    mockMovementService.getValidMoves.mockReturnValue([]);
    mockMovementService.getDiceDestination.mockReturnValue(null);
    mockMovementService.movePlayer.mockReturnValue(mockGameState);
    mockMovementService.resolveChoice.mockReturnValue(mockGameState);
    
    // Setup default TurnService mock implementations
    mockTurnService.endTurn.mockResolvedValue({ nextPlayerId: 'player2' });
    mockTurnService.canPlayerTakeTurn.mockReturnValue(true);
    mockTurnService.getCurrentPlayerTurn.mockReturnValue('player1');
    mockTurnService.rollDiceAndProcessEffects.mockResolvedValue({ diceRoll: 3 });
    mockTurnService.endTurnWithMovement.mockResolvedValue({ nextPlayerId: 'player2' });
    mockTurnService.rollDiceWithFeedback.mockResolvedValue({
      success: true,
      message: 'Dice rolled successfully',
      data: { roll: 3 }
    });
    mockTurnService.triggerManualEffectWithFeedback.mockReturnValue({
      success: true,
      message: 'Manual effect triggered',
      data: {}
    });
    mockTurnService.performNegotiation.mockResolvedValue({ success: true, message: 'Negotiation completed' });
    mockTurnService.setTurnModifier.mockReturnValue(true);
  });

  describe.only('playCard', () => {
    it('should successfully play a valid card', async () => {
      // Arrange
      console.log('TEST: Setting up mocks...');
      mockDataService.getCardById.mockReturnValue(mockCard);
      mockGameRulesService.canPlayCard.mockReturnValue(true);
      mockGameRulesService.canPlayerAfford.mockReturnValue(true);
      mockStateService.updatePlayer.mockReturnValue(mockGameState);

      // Act
      console.log('TEST: About to call playCard...');
      await playerActionService.playCard('player1', 'W001');
      console.log('TEST: Call to playCard has finished.');

      // Assert
      console.log('TEST: Starting assertions...');
      expect(mockDataService.getCardById).toHaveBeenCalledWith('W001');
      expect(mockGameRulesService.canPlayCard).toHaveBeenCalledWith('player1', 'W001');
      expect(mockGameRulesService.canPlayerAfford).toHaveBeenCalledWith('player1', 100);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        availableCards: {
          W: ['W002'], // W001 removed
          B: ['B001'],
          E: ['E001'],
          L: [],
          I: []
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
        availableCards: {
          W: ['W001'], // W002 removed
          B: ['B001'],
          E: ['E001'],
          L: [],
          I: []
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
        availableCards: {
          W: ['W002'], // W001 removed
          B: ['B001'],
          E: ['E001'],
          L: [],
          I: []
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
        availableCards: {
          W: ['W001', 'W002'],
          B: [], // B001 removed
          E: ['E001'],
          L: [],
          I: []
        }
      });
    });

    it('should handle empty card hands correctly', async () => {
      // Arrange - Player tries to play from empty L hand
      const lCard: Card = {
        card_id: 'L001',
        card_name: 'Life Events Card',
        card_type: 'L',
        description: 'A life events card.',
        cost: 0
      };
      
      mockDataService.getCardById.mockReturnValue(lCard);
      mockGameRulesService.canPlayCard.mockReturnValue(true);

      // Act & Assert
      await expect(playerActionService.playCard('player1', 'L001'))
        .rejects.toThrow("Failed to play card: Player 'Test Player' does not have card 'Life Events Card' in their L hand");
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
        availableCards: {
          W: ['W002'], // W001 removed
          B: ['B001'],
          E: ['E001'],
          L: [],
          I: []
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

  describe('rollDice', () => {
    it('should successfully roll dice and return result with single die value (1-6)', async () => {
      // Arrange
      mockStateService.updatePlayer.mockReturnValue(mockGameState);

      // Act
      const result = await playerActionService.rollDice('player1');

      // Assert
      expect(result).toBeDefined();
      expect(result.roll1).toBeGreaterThanOrEqual(1);
      expect(result.roll1).toBeLessThanOrEqual(6);
      expect(result.roll2).toBe(result.roll1); // Same value for interface compatibility
      expect(result.total).toBe(result.roll1); // Total equals the single die roll
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.total).toBeLessThanOrEqual(6);
    });

    it('should call StateService to update player with dice roll result', async () => {
      // Arrange
      mockStateService.updatePlayer.mockReturnValue(mockGameState);

      // Act
      const result = await playerActionService.rollDice('player1');

      // Assert
      expect(mockStateService.getGameState).toHaveBeenCalled();
      expect(mockStateService.getPlayer).toHaveBeenCalledWith('player1');
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        lastDiceRoll: {
          roll1: result.roll1,
          roll2: result.roll2,
          total: result.total
        }
      });
    });

    it('should throw error when player not found', async () => {
      // Arrange
      mockStateService.getPlayer.mockReturnValue(undefined);

      // Act & Assert
      await expect(playerActionService.rollDice('nonexistent'))
        .rejects.toThrow("Failed to roll dice: Player with ID 'nonexistent' not found");

      // Verify updatePlayer was not called
      expect(mockStateService.updatePlayer).not.toHaveBeenCalled();
    });

    it('should handle state service errors gracefully', async () => {
      // Arrange
      mockStateService.updatePlayer.mockImplementation(() => {
        throw new Error('State update failed');
      });

      // Act & Assert
      await expect(playerActionService.rollDice('player1'))
        .rejects.toThrow('Failed to roll dice: State update failed');

      // Verify that player lookup was still attempted
      expect(mockStateService.getGameState).toHaveBeenCalled();
      expect(mockStateService.getPlayer).toHaveBeenCalledWith('player1');
    });

    it('should generate different dice rolls on multiple calls', async () => {
      // Arrange
      mockStateService.updatePlayer.mockReturnValue(mockGameState);
      const results: Array<{ roll1: number; roll2: number; total: number }> = [];

      // Act - roll dice multiple times
      for (let i = 0; i < 10; i++) {
        const result = await playerActionService.rollDice('player1');
        results.push(result);
      }

      // Assert - verify that we get some variation (not all the same)
      const uniqueResults = new Set(results.map(r => r.total));
      expect(uniqueResults.size).toBeGreaterThan(1); // Should have some variation

      // Verify all results are valid
      results.forEach(result => {
        expect(result.roll1).toBeGreaterThanOrEqual(1);
        expect(result.roll1).toBeLessThanOrEqual(6);
        expect(result.roll2).toBe(result.roll1); // Same value for interface compatibility
        expect(result.total).toBe(result.roll1); // Total equals the single die roll
      });
    });

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
      
      mockStateService.updatePlayer.mockImplementation(() => {
        callOrder.push('updatePlayer');
        return mockGameState;
      });

      // Act
      await playerActionService.rollDice('player1');

      // Assert
      expect(callOrder).toEqual([
        'getGameState',
        'getPlayer',
        'updatePlayer',
        'getPlayer' // Called again in handlePlayerMovement
      ]);
    });

    it('should return dice result with correct structure', async () => {
      // Arrange
      mockStateService.updatePlayer.mockReturnValue(mockGameState);

      // Act
      const result = await playerActionService.rollDice('player1');

      // Assert - verify structure
      expect(typeof result).toBe('object');
      expect(typeof result.roll1).toBe('number');
      expect(typeof result.roll2).toBe('number');
      expect(typeof result.total).toBe('number');
      expect(Object.keys(result)).toEqual(['roll1', 'roll2', 'total']);
    });

    it('should trigger movement after successful dice roll', async () => {
      // Arrange
      mockStateService.updatePlayer.mockReturnValue(mockGameState);
      mockMovementService.getValidMoves.mockReturnValue(['DESTINATION-1', 'DESTINATION-2']);
      mockMovementService.getDiceDestination.mockReturnValue('DESTINATION-1');
      mockMovementService.movePlayer.mockReturnValue(mockGameState);

      // Act
      const result = await playerActionService.rollDice('player1');

      // Assert
      expect(mockMovementService.getValidMoves).toHaveBeenCalledWith('player1');
      expect(mockMovementService.getDiceDestination).toHaveBeenCalledWith(
        'START-SPACE', 
        'First', 
        result.total
      );
      expect(mockMovementService.movePlayer).toHaveBeenCalledWith('player1', 'DESTINATION-1');
    });

    it('should handle terminal spaces (no movement possible)', async () => {
      // Arrange
      mockStateService.updatePlayer.mockReturnValue(mockGameState);
      mockMovementService.getValidMoves.mockReturnValue([]); // No valid moves

      // Act
      const result = await playerActionService.rollDice('player1');

      // Assert
      expect(mockMovementService.getValidMoves).toHaveBeenCalledWith('player1');
      expect(mockMovementService.getDiceDestination).not.toHaveBeenCalled();
      expect(mockMovementService.movePlayer).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle no destination found for dice roll', async () => {
      // Arrange
      mockStateService.updatePlayer.mockReturnValue(mockGameState);
      mockMovementService.getValidMoves.mockReturnValue(['DESTINATION-1']);
      mockMovementService.getDiceDestination.mockReturnValue(null); // No destination for this roll

      // Act
      const result = await playerActionService.rollDice('player1');

      // Assert
      expect(mockMovementService.getValidMoves).toHaveBeenCalledWith('player1');
      expect(mockMovementService.getDiceDestination).toHaveBeenCalledWith(
        'START-SPACE',
        'First',
        result.total
      );
      expect(mockMovementService.movePlayer).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should handle movement service errors gracefully', async () => {
      // Arrange
      mockStateService.updatePlayer.mockReturnValue(mockGameState);
      mockMovementService.getValidMoves.mockImplementation(() => {
        throw new Error('Movement validation failed');
      });

      // Act & Assert
      await expect(playerActionService.rollDice('player1'))
        .rejects.toThrow('Failed to roll dice: Failed to handle player movement: Movement validation failed');

      expect(mockMovementService.getValidMoves).toHaveBeenCalledWith('player1');
    });

    it('should call processTurnEffects after successful dice roll', async () => {
      // Arrange
      mockStateService.updatePlayer.mockReturnValue(mockGameState);
      mockMovementService.getValidMoves.mockReturnValue(['DEST-1']);
      mockMovementService.getDiceDestination.mockReturnValue('DEST-1');
      mockMovementService.movePlayer.mockReturnValue(mockGameState);

      // Act
      const result = await playerActionService.rollDice('player1');

      // Assert - processTurnEffects should be called with dice roll result
      expect(mockTurnService.processTurnEffects).toHaveBeenCalledWith('player1', result.total);
      // endTurn should NOT be called automatically anymore
      expect(mockTurnService.endTurn).not.toHaveBeenCalled();
    });

    it('should not call endTurn if dice roll fails', async () => {
      // Arrange
      mockStateService.getPlayer.mockReturnValue(undefined); // Cause failure

      // Act & Assert
      await expect(playerActionService.rollDice('player1')).rejects.toThrow();

      // Assert - endTurn should not be called if dice roll fails
      expect(mockTurnService.endTurn).not.toHaveBeenCalled();
    });
  });

  describe('explicit turn management', () => {
    it('should provide endTurn method that calls TurnService', async () => {
      // Arrange
      mockTurnService.endTurn.mockResolvedValue({ nextPlayerId: 'player2' });

      // Act
      await playerActionService.endTurn();

      // Assert
      expect(mockTurnService.endTurn).toHaveBeenCalled();
    });

    it('should handle TurnService errors in endTurn', async () => {
      // Arrange
      mockTurnService.endTurn.mockRejectedValue(new Error('Turn service error'));

      // Act & Assert
      await expect(playerActionService.endTurn())
        .rejects.toThrow('Failed to end turn: Turn service error');
    });

    it('should not call endTurn automatically after card play', async () => {
      // Arrange
      mockDataService.getCardById.mockReturnValue(mockCard);
      mockGameRulesService.canPlayCard.mockReturnValue(true);
      mockGameRulesService.canPlayerAfford.mockReturnValue(true);
      mockStateService.updatePlayer.mockReturnValue(mockGameState);

      // Act
      await playerActionService.playCard('player1', 'W001');

      // Assert - endTurn should NOT be called automatically
      expect(mockTurnService.endTurn).not.toHaveBeenCalled();
    });
  });
});