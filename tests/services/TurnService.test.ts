import { TurnService } from '../../src/services/TurnService';
import { IDataService, IStateService, IGameRulesService } from '../../src/types/ServiceContracts';
import { GameState, Player } from '../../src/types/StateTypes';

// Mock implementations
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

describe('TurnService', () => {
  let turnService: TurnService;
  
  const mockPlayers: Player[] = [
    {
      id: 'player1',
      name: 'Player 1',
      avatar: '👤',
      currentSpace: 'START-SPACE',
      visitType: 'First',
      money: 1000,
      time: 5,
      cards: { W: [], B: [], E: [], L: [], I: [] }
    },
    {
      id: 'player2', 
      name: 'Player 2',
      avatar: '👥',
      currentSpace: 'START-SPACE',
      visitType: 'First',
      money: 1000,
      time: 5,
      cards: { W: [], B: [], E: [], L: [], I: [] }
    },
    {
      id: 'player3',
      name: 'Player 3', 
      avatar: '👨',
      currentSpace: 'START-SPACE',
      visitType: 'First',
      money: 1000,
      time: 5,
      cards: { W: [], B: [], E: [], L: [], I: [] }
    }
  ];

  const mockGameState: GameState = {
    players: mockPlayers,
    currentPlayerId: 'player1',
    gamePhase: 'PLAY',
    turn: 1,
    activeModal: null,
    awaitingChoice: null,
    hasPlayerMovedThisTurn: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    turnService = new TurnService(mockDataService, mockStateService, mockGameRulesService);
    
    // Setup default mock implementations
    mockStateService.getGameState.mockReturnValue(mockGameState);
    mockStateService.setCurrentPlayer.mockReturnValue(mockGameState);
    mockStateService.advanceTurn.mockReturnValue(mockGameState);
    mockStateService.clearPlayerHasMoved.mockReturnValue(mockGameState);
    
    // Setup default GameRulesService mock - no win by default
    mockGameRulesService.checkWinCondition.mockResolvedValue(false);
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
});