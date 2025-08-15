import { TurnService } from '../../src/services/TurnService';
import { IDataService, IStateService } from '../../src/types/ServiceContracts';
import { GameState, Player } from '../../src/types/StateTypes';
import { DiceEffect } from '../../src/types/DataTypes';

describe('TurnService', () => {
  let turnService: TurnService;
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
      W: ['card1'],
      B: ['card2'],
      E: [],
      L: [],
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
      getDiceEffects: jest.fn(),
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

    turnService = new TurnService(mockDataService, mockStateService);
  });

  describe('Constructor', () => {
    it('should accept DataService and StateService dependencies', () => {
      expect(turnService).toBeInstanceOf(TurnService);
    });
  });

  describe('rollDice', () => {
    it('should return a number between 1 and 6', () => {
      const results = new Set();
      
      // Roll dice many times to test range
      for (let i = 0; i < 1000; i++) {
        const result = turnService.rollDice();
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
        expect(Number.isInteger(result)).toBe(true);
        results.add(result);
      }
      
      // Should eventually see all possible values
      expect(results.size).toBe(6);
    });
  });

  describe('canPlayerTakeTurn', () => {
    it('should return true when player can take turn', () => {
      const canTakeTurn = turnService.canPlayerTakeTurn('player1');
      
      expect(canTakeTurn).toBe(true);
      expect(mockStateService.getGameState).toHaveBeenCalled();
      expect(mockStateService.getPlayer).toHaveBeenCalledWith('player1');
    });

    it('should return false when game is not in PLAY phase', () => {
      mockStateService.getGameState.mockReturnValue({
        ...mockGameState,
        gamePhase: 'SETUP'
      });
      
      const canTakeTurn = turnService.canPlayerTakeTurn('player1');
      
      expect(canTakeTurn).toBe(false);
    });

    it('should return false when it is not the player\'s turn', () => {
      mockStateService.getGameState.mockReturnValue({
        ...mockGameState,
        currentPlayerId: 'player2'
      });
      
      const canTakeTurn = turnService.canPlayerTakeTurn('player1');
      
      expect(canTakeTurn).toBe(false);
    });

    it('should return false when player does not exist', () => {
      mockStateService.getPlayer.mockReturnValue(undefined);
      
      const canTakeTurn = turnService.canPlayerTakeTurn('nonexistent');
      
      expect(canTakeTurn).toBe(false);
    });
  });

  describe('getCurrentPlayerTurn', () => {
    it('should return current player ID', () => {
      const currentPlayer = turnService.getCurrentPlayerTurn();
      
      expect(currentPlayer).toBe('player1');
      expect(mockStateService.getGameState).toHaveBeenCalled();
    });

    it('should return null when no current player', () => {
      mockStateService.getGameState.mockReturnValue({
        ...mockGameState,
        currentPlayerId: null
      });
      
      const currentPlayer = turnService.getCurrentPlayerTurn();
      
      expect(currentPlayer).toBeNull();
    });
  });

  describe('takeTurn', () => {
    beforeEach(() => {
      // Mock dice effects
      mockDataService.getDiceEffects.mockReturnValue([]);
      
      // Spy on rollDice to control the result
      jest.spyOn(turnService, 'rollDice').mockReturnValue(3);
    });

    it('should successfully execute a player turn', () => {
      const result = turnService.takeTurn('player1');
      
      expect(result).toBe(mockGameState);
      expect(mockStateService.advanceTurn).toHaveBeenCalled();
      expect(mockStateService.nextPlayer).toHaveBeenCalled();
    });

    it('should throw error when player cannot take turn', () => {
      mockStateService.getGameState.mockReturnValue({
        ...mockGameState,
        gamePhase: 'SETUP'
      });
      
      expect(() => turnService.takeTurn('player1')).toThrow('It is not player player1\'s turn');
    });

    it('should throw error when player does not exist', () => {
      // Mock canPlayerTakeTurn to return false for non-existent player
      mockStateService.getGameState.mockReturnValue({
        ...mockGameState,
        currentPlayerId: 'nonexistent'
      });
      mockStateService.getPlayer.mockReturnValue(undefined);
      
      expect(() => turnService.takeTurn('nonexistent')).toThrow('It is not player nonexistent\'s turn');
    });

    it('should roll dice and process effects', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_1: 'Draw 1',
        roll_2: 'Draw 2',
        roll_3: 'Draw 3',
        roll_4: 'Draw 1',
        roll_5: 'Draw 1',
        roll_6: 'Draw 1'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.takeTurn('player1');
      
      expect(turnService.rollDice).toHaveBeenCalled();
      expect(mockDataService.getDiceEffects).toHaveBeenCalledWith('TEST-SPACE', 'First');
    });
  });

  describe('processTurnEffects', () => {
    it('should process dice effects for player', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_1: 'Draw 1',
        roll_2: 'Draw 2',
        roll_3: 'Draw 3'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      const result = turnService.processTurnEffects('player1', 3);
      
      expect(mockDataService.getDiceEffects).toHaveBeenCalledWith('TEST-SPACE', 'First');
      expect(result).toBe(mockGameState);
    });

    it('should throw error when player not found', () => {
      mockStateService.getPlayer.mockReturnValue(undefined);
      
      expect(() => turnService.processTurnEffects('nonexistent', 3))
        .toThrow('Player nonexistent not found');
    });

    it('should handle empty dice effects', () => {
      mockDataService.getDiceEffects.mockReturnValue([]);
      
      const result = turnService.processTurnEffects('player1', 3);
      
      expect(result).toBe(mockGameState);
    });
  });

  describe('Card Effects', () => {
    it('should handle Draw card effects', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_3: 'Draw 2'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        cards: expect.objectContaining({
          W: expect.arrayContaining(['card1'])
        })
      });
    });

    it('should handle Remove card effects', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_3: 'Remove 1'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        cards: expect.objectContaining({
          W: []
        })
      });
    });

    it('should handle Replace card effects', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_3: 'Replace 1'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalled();
    });

    it('should handle No change effects', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_3: 'No change'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      const result = turnService.processTurnEffects('player1', 3);
      
      expect(result).toBe(mockGameState);
    });
  });

  describe('Money Effects', () => {
    it('should handle fixed money effects', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'money',
        roll_3: '50'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        money: 150 // 100 + 50
      });
    });

    it('should handle percentage money effects', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'money',
        roll_3: '10%'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        money: 110 // 100 + (100 * 10%)
      });
    });

    it('should prevent negative money', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'money',
        roll_3: '-200'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        money: 0 // Cannot go below 0
      });
    });
  });

  describe('Time Effects', () => {
    it('should handle positive time effects', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'time',
        roll_3: '3'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        time: 8 // 5 + 3
      });
    });

    it('should handle negative time effects', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'time',
        roll_3: '-2'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        time: 3 // 5 - 2
      });
    });

    it('should prevent negative time', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'time',
        roll_3: '-10'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        time: 0 // Cannot go below 0
      });
    });
  });

  describe('Quality Effects', () => {
    it('should handle quality effects', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'quality',
        roll_3: 'HIGH'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      const result = turnService.processTurnEffects('player1', 3);
      
      expect(consoleSpy).toHaveBeenCalledWith('Player player1 quality level: HIGH');
      expect(result).toBe(mockGameState);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Unknown Effects', () => {
    it('should handle unknown effect types', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'unknown',
        roll_3: 'test'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      const result = turnService.processTurnEffects('player1', 3);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Unknown effect type: unknown');
      expect(result).toBe(mockGameState);
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle dice roll outside valid range', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_1: 'Draw 1'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      const result = turnService.processTurnEffects('player1', 7); // Invalid dice roll
      
      expect(result).toBe(mockGameState);
    });

    it('should handle "many" in effect strings', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_3: 'Draw many'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        cards: expect.objectContaining({
          W: expect.arrayContaining(['card1'])
        })
      });
    });

    it('should handle missing card_type', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        roll_3: 'Draw 1'
        // card_type is undefined
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalled();
    });

    it('should handle undefined dice roll effects', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W'
        // No roll_3 defined
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      const result = turnService.processTurnEffects('player1', 3);
      
      expect(result).toBe(mockGameState);
    });

    it('should handle replace card effects when player has no cards', () => {
      const playerWithNoCards = {
        ...mockPlayer,
        cards: {
          W: [],
          B: [],
          E: [],
          L: [],
          I: []
        }
      };
      
      mockStateService.getPlayer.mockReturnValue(playerWithNoCards);

      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_3: 'Replace 1'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      const result = turnService.processTurnEffects('player1', 3);
      
      expect(result).toBe(mockGameState);
    });

    it('should handle remove effects when nothing to remove', () => {
      const playerWithNoCards = {
        ...mockPlayer,
        cards: {
          W: [],
          B: [],
          E: [],
          L: [],
          I: []
        }
      };
      
      mockStateService.getPlayer.mockReturnValue(playerWithNoCards);

      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_3: 'Remove 1'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      turnService.processTurnEffects('player1', 3);
      
      expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
        id: 'player1',
        cards: expect.objectContaining({
          W: []
        })
      });
    });

    it('should handle draw effects with zero count', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_3: 'Draw 0'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      const result = turnService.processTurnEffects('player1', 3);
      
      expect(result).toBe(mockGameState);
    });

    it('should handle effects with non-numeric strings', () => {
      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_3: 'Some effect'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      const result = turnService.processTurnEffects('player1', 3);
      
      expect(result).toBe(mockGameState);
    });

    it('should handle player not found in applyCardEffect', () => {
      mockStateService.getPlayer.mockReturnValueOnce(mockPlayer).mockReturnValueOnce(undefined);

      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'W',
        roll_3: 'Draw 1'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      expect(() => turnService.processTurnEffects('player1', 3))
        .toThrow('Player player1 not found');
    });

    it('should handle player not found in applyMoneyEffect', () => {
      mockStateService.getPlayer.mockReturnValueOnce(mockPlayer).mockReturnValueOnce(undefined);

      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'money',
        roll_3: '50'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      expect(() => turnService.processTurnEffects('player1', 3))
        .toThrow('Player player1 not found');
    });

    it('should handle player not found in applyTimeEffect', () => {
      mockStateService.getPlayer.mockReturnValueOnce(mockPlayer).mockReturnValueOnce(undefined);

      const mockDiceEffect: DiceEffect = {
        space_name: 'TEST-SPACE',
        visit_type: 'First',
        effect_type: 'time',
        roll_3: '5'
      };

      mockDataService.getDiceEffects.mockReturnValue([mockDiceEffect]);
      
      expect(() => turnService.processTurnEffects('player1', 3))
        .toThrow('Player player1 not found');
    });
  });
});