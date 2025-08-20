// tests/services/GameRulesService.test.ts

import { GameRulesService } from '../../src/services/GameRulesService';
import { IDataService, IStateService } from '../../src/types/ServiceContracts';
import { GameState, Player } from '../../src/types/StateTypes';
import { Movement, DiceOutcome, CardType } from '../../src/types/DataTypes';

// Mock implementations
const mockDataService: jest.Mocked<IDataService> = {
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
  validatePlayerAction: jest.fn(),
  canStartGame: jest.fn(),
};

describe('GameRulesService', () => {
  let gameRulesService: GameRulesService;
  let mockPlayer: Player;
  let mockGameState: GameState;

  beforeEach(() => {
    jest.clearAllMocks();
    
    gameRulesService = new GameRulesService(mockDataService, mockStateService);
    
    mockPlayer = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'START-SPACE',
      visitType: 'First',
      money: 1000,
      time: 100,
      cards: {
        W: ['W_001', 'W_002'],
        B: ['B_001'],
        E: [],
        L: ['L_001'],
        I: []
      }
    };

    mockGameState = {
      players: [mockPlayer],
      currentPlayerId: 'player1',
      gamePhase: 'PLAY',
      turn: 1
    };
  });

  describe('isMoveValid', () => {
    it('should return true for valid moves', () => {
      const mockMovement: Movement = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        movement_type: 'choice',
        destination_1: 'VALID-DESTINATION',
        destination_2: 'ANOTHER-DESTINATION'
      };

      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = gameRulesService.isMoveValid('player1', 'VALID-DESTINATION');

      expect(result).toBe(true);
    });

    it('should return false for invalid destinations', () => {
      const mockMovement: Movement = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        movement_type: 'fixed',
        destination_1: 'VALID-DESTINATION'
      };

      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = gameRulesService.isMoveValid('player1', 'INVALID-DESTINATION');

      expect(result).toBe(false);
    });

    it('should return false when game is not in progress', () => {
      const inactiveGameState = { ...mockGameState, gamePhase: 'SETUP' as const };
      mockStateService.getGameState.mockReturnValue(inactiveGameState);

      const result = gameRulesService.isMoveValid('player1', 'ANY-DESTINATION');

      expect(result).toBe(false);
    });

    it('should return false for non-existent players', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(undefined);

      const result = gameRulesService.isMoveValid('nonexistent', 'ANY-DESTINATION');

      expect(result).toBe(false);
    });

    it('should return false when no movement data exists', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(undefined);

      const result = gameRulesService.isMoveValid('player1', 'ANY-DESTINATION');

      expect(result).toBe(false);
    });

    it('should handle dice movement type', () => {
      const mockMovement: Movement = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        movement_type: 'dice'
      };

      const mockDiceOutcome: DiceOutcome = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        roll_1: 'DICE-DEST-1',
        roll_2: 'DICE-DEST-2',
        roll_3: 'DICE-DEST-1'
      };

      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);
      mockDataService.getDiceOutcome.mockReturnValue(mockDiceOutcome);

      const result = gameRulesService.isMoveValid('player1', 'DICE-DEST-1');

      expect(result).toBe(true);
    });

    it('should return empty destinations for none movement type', () => {
      const mockMovement: Movement = {
        space_name: 'END-SPACE',
        visit_type: 'First',
        movement_type: 'none'
      };

      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = gameRulesService.isMoveValid('player1', 'ANY-DESTINATION');

      expect(result).toBe(false);
    });

    it('should handle exceptions gracefully', () => {
      mockStateService.getGameState.mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = gameRulesService.isMoveValid('player1', 'ANY-DESTINATION');

      expect(result).toBe(false);
    });
  });

  describe('canPlayCard', () => {
    it('should return true when all conditions are met', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      const result = gameRulesService.canPlayCard('player1', 'W_001');

      expect(result).toBe(true);
    });

    it('should return false when game is not in progress', () => {
      const inactiveGameState = { ...mockGameState, gamePhase: 'SETUP' as const };
      mockStateService.getGameState.mockReturnValue(inactiveGameState);

      const result = gameRulesService.canPlayCard('player1', 'W_001');

      expect(result).toBe(false);
    });

    it('should return false for non-existent players', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(undefined);

      const result = gameRulesService.canPlayCard('nonexistent', 'W_001');

      expect(result).toBe(false);
    });

    it('should return false when player does not own the card', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      const result = gameRulesService.canPlayCard('player1', 'W_999');

      expect(result).toBe(false);
    });

    it('should return false when card ID has invalid format', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      const result = gameRulesService.canPlayCard('player1', 'INVALID_CARD');

      expect(result).toBe(false);
    });

    it('should return false when not player turn (for cards requiring turn)', () => {
      const gameStateNotPlayerTurn = { ...mockGameState, currentPlayerId: 'player2' };
      mockStateService.getGameState.mockReturnValue(gameStateNotPlayerTurn);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      const result = gameRulesService.canPlayCard('player1', 'W_001');

      expect(result).toBe(false);
    });

    it('should handle different card types', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      expect(gameRulesService.canPlayCard('player1', 'B_001')).toBe(true);
      expect(gameRulesService.canPlayCard('player1', 'L_001')).toBe(true);
    });
  });

  describe('canDrawCard', () => {
    it('should return true when all conditions are met', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      const result = gameRulesService.canDrawCard('player1', 'E');

      expect(result).toBe(true);
    });

    it('should return false when game is not in progress', () => {
      const inactiveGameState = { ...mockGameState, gamePhase: 'END' as const };
      mockStateService.getGameState.mockReturnValue(inactiveGameState);

      const result = gameRulesService.canDrawCard('player1', 'E');

      expect(result).toBe(false);
    });

    it('should return false for non-existent players', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(undefined);

      const result = gameRulesService.canDrawCard('nonexistent', 'E');

      expect(result).toBe(false);
    });

    it('should return false for invalid card types', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      const result = gameRulesService.canDrawCard('player1', 'X' as CardType);

      expect(result).toBe(false);
    });

    it('should return false when player has max cards of type', () => {
      const playerWithMaxCards = {
        ...mockPlayer,
        cards: {
          ...mockPlayer.cards,
          W: new Array(10).fill('W_').map((prefix, i) => `${prefix}${i.toString().padStart(3, '0')}`)
        }
      };

      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(playerWithMaxCards);

      const result = gameRulesService.canDrawCard('player1', 'W');

      expect(result).toBe(false);
    });

    it('should handle all valid card types', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      expect(gameRulesService.canDrawCard('player1', 'W')).toBe(true);
      expect(gameRulesService.canDrawCard('player1', 'B')).toBe(true);
      expect(gameRulesService.canDrawCard('player1', 'E')).toBe(true);
      expect(gameRulesService.canDrawCard('player1', 'L')).toBe(true);
      expect(gameRulesService.canDrawCard('player1', 'I')).toBe(true);
    });
  });

  describe('canPlayerAfford', () => {
    it('should return true when player has sufficient money', () => {
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      const result = gameRulesService.canPlayerAfford('player1', 500);

      expect(result).toBe(true);
    });

    it('should return false when player has insufficient money', () => {
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      const result = gameRulesService.canPlayerAfford('player1', 1500);

      expect(result).toBe(false);
    });

    it('should return true when cost equals player money', () => {
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      const result = gameRulesService.canPlayerAfford('player1', 1000);

      expect(result).toBe(true);
    });

    it('should return false for non-existent players', () => {
      mockStateService.getPlayer.mockReturnValue(undefined);

      const result = gameRulesService.canPlayerAfford('nonexistent', 100);

      expect(result).toBe(false);
    });
  });

  describe('isPlayerTurn', () => {
    it('should return true when it is the player turn', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);

      const result = gameRulesService.isPlayerTurn('player1');

      expect(result).toBe(true);
    });

    it('should return false when it is not the player turn', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);

      const result = gameRulesService.isPlayerTurn('player2');

      expect(result).toBe(false);
    });

    it('should return false when no current player is set', () => {
      const gameStateNoCurrentPlayer = { ...mockGameState, currentPlayerId: null };
      mockStateService.getGameState.mockReturnValue(gameStateNoCurrentPlayer);

      const result = gameRulesService.isPlayerTurn('player1');

      expect(result).toBe(false);
    });
  });

  describe('isGameInProgress', () => {
    it('should return true when game phase is PLAY', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);

      const result = gameRulesService.isGameInProgress();

      expect(result).toBe(true);
    });

    it('should return false when game phase is SETUP', () => {
      const setupGameState = { ...mockGameState, gamePhase: 'SETUP' as const };
      mockStateService.getGameState.mockReturnValue(setupGameState);

      const result = gameRulesService.isGameInProgress();

      expect(result).toBe(false);
    });

    it('should return false when game phase is END', () => {
      const endGameState = { ...mockGameState, gamePhase: 'END' as const };
      mockStateService.getGameState.mockReturnValue(endGameState);

      const result = gameRulesService.isGameInProgress();

      expect(result).toBe(false);
    });
  });

  describe('canPlayerTakeAction', () => {
    it('should return true when game is in progress and it is player turn', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      const result = gameRulesService.canPlayerTakeAction('player1');

      expect(result).toBe(true);
    });

    it('should return false when game is not in progress', () => {
      const inactiveGameState = { ...mockGameState, gamePhase: 'SETUP' as const };
      mockStateService.getGameState.mockReturnValue(inactiveGameState);

      const result = gameRulesService.canPlayerTakeAction('player1');

      expect(result).toBe(false);
    });

    it('should return false for non-existent players', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(undefined);

      const result = gameRulesService.canPlayerTakeAction('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when it is not the player turn', () => {
      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);

      const result = gameRulesService.canPlayerTakeAction('player2');

      expect(result).toBe(false);
    });
  });

  describe('edge cases and private method coverage', () => {
    it('should handle dice movement with no dice outcome', () => {
      const mockMovement: Movement = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        movement_type: 'dice'
      };

      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);
      mockDataService.getDiceOutcome.mockReturnValue(undefined);

      const result = gameRulesService.isMoveValid('player1', 'ANY-DESTINATION');

      expect(result).toBe(false);
    });

    it('should handle movement with all destination fields', () => {
      const mockMovement: Movement = {
        space_name: 'MULTI-DEST',
        visit_type: 'First',
        movement_type: 'choice',
        destination_1: 'DEST-1',
        destination_2: 'DEST-2',
        destination_3: 'DEST-3',
        destination_4: 'DEST-4',
        destination_5: 'DEST-5'
      };

      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      expect(gameRulesService.isMoveValid('player1', 'DEST-3')).toBe(true);
      expect(gameRulesService.isMoveValid('player1', 'DEST-5')).toBe(true);
    });

    it('should filter empty destinations and remove duplicates', () => {
      const mockDiceOutcome: DiceOutcome = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        roll_1: 'DEST-A',
        roll_2: '',
        roll_3: 'DEST-A', // duplicate
        roll_4: 'DEST-B',
        roll_5: undefined,
        roll_6: '   ' // whitespace
      };

      const mockMovement: Movement = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        movement_type: 'dice'
      };

      mockStateService.getGameState.mockReturnValue(mockGameState);
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);
      mockDataService.getDiceOutcome.mockReturnValue(mockDiceOutcome);

      expect(gameRulesService.isMoveValid('player1', 'DEST-A')).toBe(true);
      expect(gameRulesService.isMoveValid('player1', 'DEST-B')).toBe(true);
    });
  });

  describe('checkWinCondition', () => {
    it('should return true when player is on an ending space', async () => {
      // Arrange
      const endingSpaceConfig = {
        space_name: 'END-SPACE',
        phase: 'END',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: true,
        min_players: 1,
        max_players: 4
      };

      const playerOnEndingSpace = { ...mockPlayer, currentSpace: 'END-SPACE' };
      mockStateService.getPlayer.mockReturnValue(playerOnEndingSpace);
      mockDataService.getGameConfigBySpace.mockReturnValue(endingSpaceConfig);

      // Act
      const result = await gameRulesService.checkWinCondition('player1');

      // Assert
      expect(result).toBe(true);
      expect(mockStateService.getPlayer).toHaveBeenCalledWith('player1');
      expect(mockDataService.getGameConfigBySpace).toHaveBeenCalledWith('END-SPACE');
    });

    it('should return false when player is not on an ending space', async () => {
      // Arrange
      const normalSpaceConfig = {
        space_name: 'NORMAL-SPACE',
        phase: 'PLAY',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getGameConfigBySpace.mockReturnValue(normalSpaceConfig);

      // Act
      const result = await gameRulesService.checkWinCondition('player1');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when player does not exist', async () => {
      // Arrange
      mockStateService.getPlayer.mockReturnValue(undefined);

      // Act
      const result = await gameRulesService.checkWinCondition('nonexistent');

      // Assert
      expect(result).toBe(false);
      expect(mockStateService.getPlayer).toHaveBeenCalledWith('nonexistent');
      expect(mockDataService.getGameConfigBySpace).not.toHaveBeenCalled();
    });

    it('should return false when space configuration is not found', async () => {
      // Arrange
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getGameConfigBySpace.mockReturnValue(undefined);

      // Act
      const result = await gameRulesService.checkWinCondition('player1');

      // Assert
      expect(result).toBe(false);
      expect(mockDataService.getGameConfigBySpace).toHaveBeenCalledWith('START-SPACE');
    });

    it('should return false and log error when an exception occurs', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockStateService.getPlayer.mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act
      const result = await gameRulesService.checkWinCondition('player1');

      // Assert
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking win condition for player player1:',
        expect.any(Error)
      );

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should handle space config with is_ending_space as false', async () => {
      // Arrange
      const nonEndingSpaceConfig = {
        space_name: 'MIDDLE-SPACE',
        phase: 'PLAY',
        path_type: 'main',
        is_starting_space: false,
        is_ending_space: false,
        min_players: 1,
        max_players: 4
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getGameConfigBySpace.mockReturnValue(nonEndingSpaceConfig);

      // Act
      const result = await gameRulesService.checkWinCondition('player1');

      // Assert
      expect(result).toBe(false);
    });
  });
});