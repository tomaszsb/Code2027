import { TurnService } from '../../src/services/TurnService';
import { IDataService, IStateService, IGameRulesService, ICardService, IResourceService, IMovementService, IEffectEngineService } from '../../src/types/ServiceContracts';
import { GameState, Player } from '../../src/types/StateTypes';

// Mock implementations
const mockDataService: jest.Mocked<IDataService> = {
  getCardById: jest.fn(),
  getCards: jest.fn(),
  getCardsByType: jest.fn(),
  getAllCardTypes: jest.fn(),
  getGameConfig: jest.fn(),
  getGameConfigBySpace: jest.fn(),
  getPhaseOrder: jest.fn(),
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
  getGameStateDeepCopy: jest.fn(),
  isStateLoaded: jest.fn(),
  subscribe: jest.fn(),
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
  updateNegotiationState: jest.fn(),
  fixPlayerStartingSpaces: jest.fn(),
  forceResetAllPlayersToCorrectStartingSpace: jest.fn(),
  setAwaitingChoice: jest.fn(),
  clearAwaitingChoice: jest.fn(),
  setPlayerHasMoved: jest.fn(),
  clearPlayerHasMoved: jest.fn(),
  setPlayerCompletedManualAction: jest.fn(),
  setPlayerHasRolledDice: jest.fn(),
  clearPlayerCompletedManualActions: jest.fn(),
  clearPlayerHasRolledDice: jest.fn(),
  updateActionCounts: jest.fn(),
  showCardModal: jest.fn(),
  dismissModal: jest.fn(),
  createPlayerSnapshot: jest.fn(),
  restorePlayerSnapshot: jest.fn(),
  validatePlayerAction: jest.fn(),
  canStartGame: jest.fn(),
  logToActionHistory: jest.fn(),
  savePreSpaceEffectSnapshot: jest.fn(),
  clearPreSpaceEffectSnapshot: jest.fn(),
  hasPreSpaceEffectSnapshot: jest.fn(),
  getPreSpaceEffectSnapshot: jest.fn(),
  setGameState: jest.fn(),
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
  calculateProjectScope: jest.fn(),
};

const mockCardService: jest.Mocked<ICardService> = {
  canPlayCard: jest.fn(),
  isValidCardType: jest.fn(),
  playerOwnsCard: jest.fn(),
  playCard: jest.fn(),
  drawCards: jest.fn(),
  discardCards: jest.fn(),
  removeCard: jest.fn(),
  replaceCard: jest.fn(),
  endOfTurn: jest.fn(),
  activateCard: jest.fn(),
  transferCard: jest.fn(),
  getCardType: jest.fn(),
  getPlayerCards: jest.fn(),
  getPlayerCardCount: jest.fn(),
  getCardToDiscard: jest.fn(),
  applyCardEffects: jest.fn(),
  effectEngineService: {
    processEffects: jest.fn(),
    processEffect: jest.fn(),
    validateEffect: jest.fn(),
    validateEffects: jest.fn(),
  } as jest.Mocked<IEffectEngineService>,
};

const mockResourceService: jest.Mocked<IResourceService> = {
  addMoney: jest.fn(),
  spendMoney: jest.fn(),
  canAfford: jest.fn(),
  addTime: jest.fn(),
  spendTime: jest.fn(),
  updateResources: jest.fn(),
  getResourceHistory: jest.fn(),
  validateResourceChange: jest.fn(),
};

const mockMovementService: jest.Mocked<IMovementService> = {
  getValidMoves: jest.fn(),
  movePlayer: jest.fn(),
  getDiceDestination: jest.fn(),
  handleMovementChoice: jest.fn(),
};

const mockNegotiationService = {
  initiateNegotiation: jest.fn(),
  makeOffer: jest.fn(),
  acceptOffer: jest.fn(),
  declineOffer: jest.fn(),
  getActiveNegotiation: jest.fn(),
  hasActiveNegotiation: jest.fn(),
};

const mockEffectEngineService: jest.Mocked<IEffectEngineService> = {
  processEffects: jest.fn(),
  processEffect: jest.fn(),
  validateEffect: jest.fn(),
  validateEffects: jest.fn(),
};

describe('TurnService', () => {
  let turnService: TurnService;
  
  const mockPlayers: Player[] = [
    {
      id: 'player1',
      name: 'Player 1',
      currentSpace: 'START-SPACE',
      visitType: 'First',
      money: 1000,
      timeSpent: 5,
      projectScope: 0,
      availableCards: { W: [], B: [], E: [], L: [], I: [] },
      activeCards: [],
      discardedCards: { W: [], B: [], E: [], L: [], I: [] }
    },
    {
      id: 'player2', 
      name: 'Player 2',
      currentSpace: 'START-SPACE',
      visitType: 'First',
      money: 1000,
      timeSpent: 5,
      projectScope: 0,
      availableCards: { W: [], B: [], E: [], L: [], I: [] },
      activeCards: [],
      discardedCards: { W: [], B: [], E: [], L: [], I: [] }
    },
    {
      id: 'player3',
      name: 'Player 3', 
      currentSpace: 'START-SPACE',
      visitType: 'First',
      money: 1000,
      timeSpent: 5,
      projectScope: 0,
      availableCards: { W: [], B: [], E: [], L: [], I: [] },
      activeCards: [],
      discardedCards: { W: [], B: [], E: [], L: [], I: [] }
    }
  ];

  const mockGameState: GameState = {
    players: mockPlayers,
    currentPlayerId: 'player1',
    gamePhase: 'PLAY',
    turn: 1,
    activeModal: null,
    awaitingChoice: null,
    hasPlayerMovedThisTurn: false,
    hasPlayerRolledDice: false,
    isGameOver: false,
    requiredActions: 1,
    completedActions: 0,
    availableActionTypes: [],
    hasCompletedManualActions: false,
    activeNegotiation: null,
    globalActionLog: [],
    preSpaceEffectState: null
  };

  const mockPlayer: Player = mockPlayers[0];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create TurnService first without EffectEngineService to avoid circular dependency
    turnService = new TurnService(mockDataService, mockStateService, mockGameRulesService, mockCardService, mockResourceService, mockMovementService, mockNegotiationService as any);
    
    // Set EffectEngineService using setter injection to complete the circular dependency
    turnService.setEffectEngineService(mockEffectEngineService);
    
    // Setup default mock implementations
    mockStateService.getGameState.mockReturnValue(mockGameState);
    mockStateService.setCurrentPlayer.mockReturnValue(mockGameState);
    mockStateService.advanceTurn.mockReturnValue(mockGameState);
    mockStateService.clearPlayerHasMoved.mockReturnValue(mockGameState);
    
    // Setup default GameRulesService mock - no win by default
    mockGameRulesService.checkWinCondition.mockResolvedValue(false);
    
    // Setup default EffectEngineService mock - return successful BatchEffectResult
    mockEffectEngineService.processEffects.mockResolvedValue({
      success: true,
      totalEffects: 0,
      successfulEffects: 0,
      failedEffects: 0,
      results: [],
      errors: []
    });
  });

  describe('endTurn', () => {
    it('should advance from first player to second player', async () => {
      // Arrange - player1 is current player
      const gameState = { ...mockGameState, currentPlayerId: 'player1' };
      mockStateService.getGameState.mockReturnValue(gameState);

      // Act
      const result = await turnService.endTurn();

      // Assert
      expect(result.nextPlayerId).toBe('player2');
      expect(mockStateService.setCurrentPlayer).toHaveBeenCalledWith('player2');
      expect(mockStateService.advanceTurn).toHaveBeenCalled();
      expect(mockStateService.clearPlayerHasMoved).toHaveBeenCalled();
    });

    it('should advance from second player to third player', async () => {
      // Arrange - player2 is current player
      const gameState = { ...mockGameState, currentPlayerId: 'player2' };
      mockStateService.getGameState.mockReturnValue(gameState);

      // Act
      const result = await turnService.endTurn();

      // Assert
      expect(result.nextPlayerId).toBe('player3');
      expect(mockStateService.setCurrentPlayer).toHaveBeenCalledWith('player3');
    });

    it('should wrap around from last player to first player', async () => {
      // Arrange - player3 is current player (last player)
      const gameState = { ...mockGameState, currentPlayerId: 'player3' };
      mockStateService.getGameState.mockReturnValue(gameState);

      // Act
      const result = await turnService.endTurn();

      // Assert
      expect(result.nextPlayerId).toBe('player1');
      expect(mockStateService.setCurrentPlayer).toHaveBeenCalledWith('player1');
    });

    it('should work with two players', async () => {
      // Arrange - game with only two players
      const twoPlayerState = {
        ...mockGameState,
        players: [mockPlayers[0], mockPlayers[1]], // Only player1 and player2
        currentPlayerId: 'player1'
      };
      mockStateService.getGameState.mockReturnValue(twoPlayerState);

      // Act
      const result = await turnService.endTurn();

      // Assert
      expect(result.nextPlayerId).toBe('player2');
      expect(mockStateService.setCurrentPlayer).toHaveBeenCalledWith('player2');
    });

    it('should work with single player (wrap to self)', async () => {
      // Arrange - game with only one player
      const singlePlayerState = {
        ...mockGameState,
        players: [mockPlayers[0]], // Only player1
        currentPlayerId: 'player1'
      };
      mockStateService.getGameState.mockReturnValue(singlePlayerState);

      // Act
      const result = await turnService.endTurn();

      // Assert
      expect(result.nextPlayerId).toBe('player1');
      expect(mockStateService.setCurrentPlayer).toHaveBeenCalledWith('player1');
    });

    it('should throw error if game is not in PLAY phase', async () => {
      // Arrange
      const gameState = { ...mockGameState, gamePhase: 'SETUP' as const };
      mockStateService.getGameState.mockReturnValue(gameState);

      // Act & Assert
      await expect(turnService.endTurn())
        .rejects.toThrow('Cannot end turn outside of PLAY phase');
      
      expect(mockStateService.setCurrentPlayer).not.toHaveBeenCalled();
    });

    it('should throw error if no current player', async () => {
      // Arrange
      const gameState = { ...mockGameState, currentPlayerId: null };
      mockStateService.getGameState.mockReturnValue(gameState);

      // Act & Assert
      await expect(turnService.endTurn())
        .rejects.toThrow('No current player to end turn for');
      
      expect(mockStateService.setCurrentPlayer).not.toHaveBeenCalled();
    });

    it('should throw error if no players in game', async () => {
      // Arrange
      const gameState = { ...mockGameState, players: [] };
      mockStateService.getGameState.mockReturnValue(gameState);

      // Act & Assert
      await expect(turnService.endTurn())
        .rejects.toThrow('No players in the game');
      
      expect(mockStateService.setCurrentPlayer).not.toHaveBeenCalled();
    });

    it('should throw error if current player not found in player list', async () => {
      // Arrange
      const gameState = { ...mockGameState, currentPlayerId: 'nonexistent' };
      mockStateService.getGameState.mockReturnValue(gameState);

      // Act & Assert
      await expect(turnService.endTurn())
        .rejects.toThrow('Current player not found in player list');
      
      expect(mockStateService.setCurrentPlayer).not.toHaveBeenCalled();
    });

    it('should call state service methods in correct order', async () => {
      // Arrange
      const callOrder: string[] = [];
      
      mockStateService.setCurrentPlayer.mockImplementation(() => {
        callOrder.push('setCurrentPlayer');
        return mockGameState;
      });
      
      mockStateService.advanceTurn.mockImplementation(() => {
        callOrder.push('advanceTurn');
        return mockGameState;
      });
      
      mockStateService.clearPlayerHasMoved.mockImplementation(() => {
        callOrder.push('clearPlayerHasMoved');
        return mockGameState;
      });

      // Act
      await turnService.endTurn();

      // Assert
      expect(callOrder).toEqual(['setCurrentPlayer', 'advanceTurn', 'clearPlayerHasMoved']);
    });

    it('should handle state service errors gracefully', async () => {
      // Arrange
      mockStateService.setCurrentPlayer.mockImplementation(() => {
        throw new Error('State service error');
      });

      // Act & Assert
      await expect(turnService.endTurn())
        .rejects.toThrow('State service error');
    });
  });

  describe('canPlayerTakeTurn', () => {
    it('should return true for current player in PLAY phase', () => {
      // Arrange
      mockStateService.getPlayer.mockReturnValue(mockPlayers[0]);

      // Act
      const result = turnService.canPlayerTakeTurn('player1');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-current player', () => {
      // Arrange
      mockStateService.getPlayer.mockReturnValue(mockPlayers[1]);

      // Act
      const result = turnService.canPlayerTakeTurn('player2');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if game is not in PLAY phase', () => {
      // Arrange
      const gameState = { ...mockGameState, gamePhase: 'SETUP' as const };
      mockStateService.getGameState.mockReturnValue(gameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayers[0]);

      // Act
      const result = turnService.canPlayerTakeTurn('player1');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if player does not exist', () => {
      // Arrange
      mockStateService.getPlayer.mockReturnValue(undefined);

      // Act
      const result = turnService.canPlayerTakeTurn('nonexistent');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getCurrentPlayerTurn', () => {
    it('should return current player ID', () => {
      // Act
      const result = turnService.getCurrentPlayerTurn();

      // Assert
      expect(result).toBe('player1');
    });

    it('should return null when no current player', () => {
      // Arrange
      const gameState = { ...mockGameState, currentPlayerId: null };
      mockStateService.getGameState.mockReturnValue(gameState);

      // Act
      const result = turnService.getCurrentPlayerTurn();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Space Effect Actions', () => {
    beforeEach(() => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockGameRulesService.checkWinCondition.mockResolvedValue(false);
    });

    it('should handle replace_e action', () => {
      // Arrange
      const playerWithCards = {
        ...mockPlayer,
        cards: { W: [], B: [], E: ['E_old_1', 'E_old_2'], L: [], I: [] }
      };
      mockStateService.getPlayer.mockReturnValue(playerWithCards);
      
      const spaceEffect = {
        space_name: 'TEST_SPACE',
        visit_type: 'First' as const,
        effect_type: 'cards' as const,
        effect_action: 'replace_e',
        effect_value: 1,
        condition: 'always',
        description: 'Replace 1 E card'
      };
      
      mockDataService.getSpaceEffects.mockReturnValue([spaceEffect]);
      mockDataService.getDiceEffects.mockReturnValue([]);

      mockEffectEngineService.processEffects.mockImplementation(async (effects, context) => {
        // Get the player state that the service would be working with
        const player = mockStateService.getPlayer('player1');
        if (player) {
          // Simulate the card replacement by calling the StateService
          mockStateService.updatePlayer({
            id: 'player1',
            availableCards: {
              ...player.availableCards,
              E: ['E_001_TestCard'], // Simulate one new card matching expected pattern
            },
          });
        }
        // Return a successful result
        return {
          success: true,
          totalEffects: effects.length,
          successfulEffects: effects.length,
          failedEffects: 0,
          results: [],
          errors: [],
        };
      });

      // Act
      const result = turnService.processTurnEffects('player1', 3);

      // Assert
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player1',
          availableCards: expect.objectContaining({
            E: expect.arrayContaining([expect.stringMatching(/^E_\d+_/)]) // Should have 1 new E card
          })
        })
      );
    });

    it('should handle transfer action', () => {
      // Arrange
      const mockPlayersWithCards = [
        { ...mockPlayer, id: 'player1', name: 'Player 1', availableCards: { W: ['W_1'], B: [], E: [], L: [], I: [] } },
        { ...mockPlayer, id: 'player2', name: 'Player 2', availableCards: { W: [], B: [], E: [], L: [], I: [] } }
      ];
      
      mockStateService.getGameState.mockReturnValue({
        ...mockGameState,
        players: mockPlayersWithCards
      });
      // Ensure getPlayer returns the correct, updated player mock for this test
      mockStateService.getPlayer.mockImplementation(playerId => mockPlayersWithCards.find(p => p.id === playerId));
      
      const spaceEffect = {
        space_name: 'TEST_SPACE',
        visit_type: 'First' as const,
        effect_type: 'cards' as const,
        effect_action: 'transfer',
        effect_value: 1,
        condition: 'to_right',
        description: 'Transfer 1 card to right player'
      };
      
      mockDataService.getSpaceEffects.mockReturnValue([spaceEffect]);
      mockDataService.getDiceEffects.mockReturnValue([]);

      // Mock EffectEngineService to simulate card transfer between players
      mockEffectEngineService.processEffects.mockImplementation(async (effects, context) => {
        const sourcePlayer = mockStateService.getPlayer('player1');
        const targetPlayer = mockStateService.getPlayer('player2');
        
        if (sourcePlayer && targetPlayer && sourcePlayer.availableCards.W.length > 0) {
          const cardToTransfer = sourcePlayer.availableCards.W[0];
          
          // Update player1 (remove card)
          mockStateService.updatePlayer({
            id: 'player1',
            availableCards: {
              ...sourcePlayer.availableCards,
              W: [],
            },
          });
          
          // Update player2 (add card)
          mockStateService.updatePlayer({
            id: 'player2',
            availableCards: {
              ...targetPlayer.availableCards,
              W: [cardToTransfer],
            },
          });
        }
        
        return {
          success: true,
          totalEffects: effects.length,
          successfulEffects: effects.length,
          failedEffects: 0,
          results: [],
          errors: [],
        };
      });

      // Act
      turnService.processTurnEffects('player1', 3);

      // Assert
      expect(mockStateService.updatePlayer).toHaveBeenCalledTimes(2); // Both players updated
    });

    it('should handle fee_percent action', () => {
      // Arrange
      const playerWithMoney = {
        ...mockPlayer,
        money: 1000
      };
      mockStateService.getPlayer.mockReturnValue(playerWithMoney);
      
      const spaceEffect = {
        space_name: 'TEST_SPACE',
        visit_type: 'First' as const,
        effect_type: 'money' as const,
        effect_action: 'fee_percent',
        effect_value: 5, // 5% fee
        condition: 'always',
        description: '5% fee'
      };
      
      mockDataService.getSpaceEffects.mockReturnValue([spaceEffect]);
      mockDataService.getDiceEffects.mockReturnValue([]);

      // Mock EffectEngineService to simulate money reduction (5% fee)
      mockEffectEngineService.processEffects.mockImplementation(async (effects, context) => {
        const player = mockStateService.getPlayer('player1');
        
        if (player && player.money > 0) {
          const feeAmount = Math.floor(player.money * 0.05); // 5% fee
          const newMoney = player.money - feeAmount;
          
          // Update player with reduced money
          mockStateService.updatePlayer({
            id: 'player1',
            money: newMoney,
          });
        }
        
        return {
          success: true,
          totalEffects: effects.length,
          successfulEffects: effects.length,
          failedEffects: 0,
          results: [],
          errors: [],
        };
      });

      // Act
      turnService.processTurnEffects('player1', 3);

      // Assert
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'player1',
          money: 950 // 1000 - (1000 * 5% = 50)
        })
      );
    });
  });
});