// tests/services/MovementService.test.ts

import { MovementService } from '../../src/services/MovementService';
import { IDataService, IStateService } from '../../src/types/ServiceContracts';
import { GameState, Player } from '../../src/types/StateTypes';
import { Movement, DiceOutcome, Space, GameConfig } from '../../src/types/DataTypes';

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

describe('MovementService', () => {
  let movementService: MovementService;
  let mockPlayer: Player;
  let mockGameState: GameState;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    movementService = new MovementService(mockDataService, mockStateService);
    
    mockPlayer = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'START-QUICK-PLAY-GUIDE',
      visitType: 'First',
      money: 1000,
      time: 100,
      cards: { W: [], B: [], E: [], L: [], I: [] }
    };

    mockGameState = {
      players: [mockPlayer],
      currentPlayerId: 'player1',
      gamePhase: 'PLAY',
      turn: 1
    };
  });

  describe('getValidMoves', () => {
    it('should return valid moves for fixed movement type', () => {
      const mockMovement: Movement = {
        space_name: 'START-QUICK-PLAY-GUIDE',
        visit_type: 'First',
        movement_type: 'fixed',
        destination_1: 'OWNER-SCOPE-INITIATION'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = movementService.getValidMoves('player1');

      expect(result).toEqual(['OWNER-SCOPE-INITIATION']);
      expect(mockStateService.getPlayer).toHaveBeenCalledWith('player1');
      expect(mockDataService.getMovement).toHaveBeenCalledWith('START-QUICK-PLAY-GUIDE', 'First');
    });

    it('should return valid moves for choice movement type with multiple destinations', () => {
      const mockMovement: Movement = {
        space_name: 'PM-DECISION-CHECK',
        visit_type: 'First',
        movement_type: 'choice',
        destination_1: 'LEND-SCOPE-CHECK',
        destination_2: 'ARCH-INITIATION',
        destination_3: 'CHEAT-BYPASS'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = movementService.getValidMoves('player1');

      expect(result).toEqual(['LEND-SCOPE-CHECK', 'ARCH-INITIATION', 'CHEAT-BYPASS']);
    });

    it('should return valid moves for dice movement type', () => {
      const mockMovement: Movement = {
        space_name: 'LEND-SCOPE-CHECK',
        visit_type: 'First',
        movement_type: 'dice',
        destination_1: 'BANK-FUND-REVIEW',
        destination_2: 'INVESTOR-FUND-REVIEW'
      };

      const mockDiceOutcome: DiceOutcome = {
        space_name: 'LEND-SCOPE-CHECK',
        visit_type: 'First',
        roll_1: 'BANK-FUND-REVIEW',
        roll_2: 'BANK-FUND-REVIEW',
        roll_3: 'INVESTOR-FUND-REVIEW',
        roll_4: 'INVESTOR-FUND-REVIEW',
        roll_5: 'INVESTOR-FUND-REVIEW',
        roll_6: 'INVESTOR-FUND-REVIEW'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);
      mockDataService.getDiceOutcome.mockReturnValue(mockDiceOutcome);

      const result = movementService.getValidMoves('player1');

      // Should remove duplicates
      expect(result).toEqual(['BANK-FUND-REVIEW', 'INVESTOR-FUND-REVIEW']);
    });

    it('should return empty array for none movement type', () => {
      const mockMovement: Movement = {
        space_name: 'END-SPACE',
        visit_type: 'First',
        movement_type: 'none'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = movementService.getValidMoves('player1');

      expect(result).toEqual([]);
    });

    it('should throw error if player not found', () => {
      mockStateService.getPlayer.mockReturnValue(undefined);

      expect(() => movementService.getValidMoves('nonexistent')).toThrow('Player with ID nonexistent not found');
    });

    it('should throw error if no movement data found', () => {
      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(undefined);

      expect(() => movementService.getValidMoves('player1')).toThrow(
        'No movement data found for space START-QUICK-PLAY-GUIDE with visit type First'
      );
    });

    it('should handle dice movement with no dice outcome data', () => {
      const mockMovement: Movement = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        movement_type: 'dice'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);
      mockDataService.getDiceOutcome.mockReturnValue(undefined);

      const result = movementService.getValidMoves('player1');

      expect(result).toEqual([]);
    });

    it('should filter out empty destinations', () => {
      const mockMovement: Movement = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        movement_type: 'choice',
        destination_1: 'VALID-DESTINATION',
        destination_2: '',
        destination_3: undefined
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = movementService.getValidMoves('player1');

      expect(result).toEqual(['VALID-DESTINATION']);
    });
  });

  describe('movePlayer', () => {
    beforeEach(() => {
      const mockMovement: Movement = {
        space_name: 'START-QUICK-PLAY-GUIDE',
        visit_type: 'First',
        movement_type: 'choice',
        destination_1: 'DESTINATION-A',
        destination_2: 'DESTINATION-B'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);
    });

    it('should successfully move player to valid destination', () => {
      const updatedGameState: GameState = {
        ...mockGameState,
        players: [{
          ...mockPlayer,
          currentSpace: 'DESTINATION-A',
          visitType: 'First'
        }]
      };

      mockStateService.updatePlayer.mockReturnValue(updatedGameState);

      // Mock the starting spaces for visit type logic
      const mockSpaces: Space[] = [{
        name: 'START-QUICK-PLAY-GUIDE',
        config: { is_starting_space: true } as GameConfig,
        content: [],
        movement: [],
        spaceEffects: [],
        diceEffects: [],
        diceOutcomes: []
      }];
      mockDataService.getAllSpaces.mockReturnValue(mockSpaces);

      const result = movementService.movePlayer('player1', 'DESTINATION-A');

      expect(result).toBe(updatedGameState);
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        currentSpace: 'DESTINATION-A',
        visitType: 'First'
      });
    });

    it('should set visit type to Subsequent for non-starting spaces', () => {
      const updatedPlayer = {
        ...mockPlayer,
        currentSpace: 'NON-STARTING-SPACE'
      };
      
      mockStateService.getPlayer.mockReturnValueOnce(updatedPlayer);

      const mockMovement: Movement = {
        space_name: 'NON-STARTING-SPACE',
        visit_type: 'First',
        movement_type: 'fixed',
        destination_1: 'DESTINATION-A'
      };
      
      mockDataService.getMovement.mockReturnValueOnce(mockMovement);

      const updatedGameState: GameState = {
        ...mockGameState,
        players: [{
          ...updatedPlayer,
          currentSpace: 'DESTINATION-A',
          visitType: 'Subsequent'
        }]
      };

      mockStateService.updatePlayer.mockReturnValue(updatedGameState);

      // Mock no starting spaces
      mockDataService.getAllSpaces.mockReturnValue([]);

      const result = movementService.movePlayer('player1', 'DESTINATION-A');

      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        currentSpace: 'DESTINATION-A',
        visitType: 'Subsequent'
      });
    });

    it('should throw error for invalid destination', () => {
      expect(() => movementService.movePlayer('player1', 'INVALID-DESTINATION')).toThrow(
        'Invalid move: INVALID-DESTINATION is not a valid destination from current position'
      );
    });

    it('should throw error if player not found during move', () => {
      // First call returns player for getValidMoves, second call returns undefined for move
      mockStateService.getPlayer
        .mockReturnValueOnce(mockPlayer)
        .mockReturnValueOnce(undefined);

      expect(() => movementService.movePlayer('player1', 'DESTINATION-A')).toThrow(
        'Player with ID player1 not found'
      );
    });

    it('should handle player moving to same space they are already on', () => {
      const mockMovement: Movement = {
        space_name: 'START-QUICK-PLAY-GUIDE',
        visit_type: 'First',
        movement_type: 'choice',
        destination_1: 'START-QUICK-PLAY-GUIDE'
      };

      mockDataService.getMovement.mockReturnValue(mockMovement);

      const updatedGameState: GameState = {
        ...mockGameState,
        players: [{
          ...mockPlayer,
          visitType: 'Subsequent'
        }]
      };

      mockStateService.updatePlayer.mockReturnValue(updatedGameState);
      mockDataService.getAllSpaces.mockReturnValue([]);

      const result = movementService.movePlayer('player1', 'START-QUICK-PLAY-GUIDE');

      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        currentSpace: 'START-QUICK-PLAY-GUIDE',
        visitType: 'Subsequent'
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle movement with all destination fields filled', () => {
      const mockMovement: Movement = {
        space_name: 'MULTI-DESTINATION',
        visit_type: 'First',
        movement_type: 'choice',
        destination_1: 'DEST-1',
        destination_2: 'DEST-2',
        destination_3: 'DEST-3',
        destination_4: 'DEST-4',
        destination_5: 'DEST-5'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = movementService.getValidMoves('player1');

      expect(result).toEqual(['DEST-1', 'DEST-2', 'DEST-3', 'DEST-4', 'DEST-5']);
    });

    it('should handle dice outcome with empty and duplicate destinations', () => {
      const mockMovement: Movement = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        movement_type: 'dice'
      };

      const mockDiceOutcome: DiceOutcome = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        roll_1: 'DEST-A',
        roll_2: '',
        roll_3: 'DEST-A',
        roll_4: 'DEST-B',
        roll_5: undefined,
        roll_6: '   '  // whitespace only
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);
      mockDataService.getDiceOutcome.mockReturnValue(mockDiceOutcome);

      const result = movementService.getValidMoves('player1');

      expect(result).toEqual(['DEST-A', 'DEST-B']);
    });
  });
});