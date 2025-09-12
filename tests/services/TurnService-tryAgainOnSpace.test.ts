// Unit test for the tryAgainOnSpace method
// This test verifies the state snapshot, revert, and turn progression functionality

import { TurnService } from '../../src/services/TurnService';
import { DataService } from '../../src/services/DataService';
import { StateService } from '../../src/services/StateService';
import { LoggingService } from '../../src/services/LoggingService';
import { NegotiationService } from '../../src/services/NegotiationService';
import { GameRulesService } from '../../src/services/GameRulesService';
import { CardService } from '../../src/services/CardService';
import { ResourceService } from '../../src/services/ResourceService';
import { MovementService } from '../../src/services/MovementService';
import { ChoiceService } from '../../src/services/ChoiceService';
import { GameState } from '../../src/types/StateTypes';

describe('TurnService.tryAgainOnSpace', () => {
  let turnService: TurnService;
  let stateService: StateService;
  let dataService: DataService;
  let gameRulesService: GameRulesService;

  beforeEach(() => {
    // Create mock services
    dataService = {
      getSpaceContent: jest.fn(),
      getSpaceEffects: jest.fn(),
      isLoaded: jest.fn().mockReturnValue(true),
      getGameConfig: jest.fn().mockReturnValue([{
        space_name: 'START',
        is_starting_space: true,
        starting_money: 0,
        starting_cards: [],
        min_players: 1,
        max_players: 4,
      }]),
      getGameConfigBySpace: jest.fn(),
      getCardsByType: jest.fn().mockReturnValue([]),
      getSpaceByName: jest.fn(),
      getAllSpaces: jest.fn().mockReturnValue([]),
      getDiceOutcome: jest.fn(),
      getAllDiceOutcomes: jest.fn().mockReturnValue([]),
    } as any;

    stateService = new StateService(dataService);
    jest.spyOn(stateService, 'setGameState').mockImplementation();
    jest.spyOn(stateService, 'canStartGame').mockReturnValue(true);

    gameRulesService = {
      checkWinCondition: jest.fn(),
      checkGameEndConditions: jest.fn().mockResolvedValue({
        shouldEnd: false,
        reason: null,
        winnerId: null
      }),
    } as any;

    const loggingService = new LoggingService(stateService);
    const resourceService = {} as any;
    const cardService = {} as any;
    const choiceService = {} as any;
    const movementService = {} as any;
    const negotiationService = {} as any;
    const effectEngineService = {} as any;

    // Create TurnService with mocked nextPlayer method
    turnService = new TurnService(
      dataService,
      stateService,
      gameRulesService,
      cardService,
      resourceService,
      movementService,
      negotiationService,
      loggingService,
      effectEngineService
    );
    (turnService as any).nextPlayer = jest.fn();
  });

  it('should revert to snapshot, apply penalty, and advance turn', async () => {
    // 1. Setup Initial State
    stateService.addPlayer('Player 1');
    stateService.addPlayer('Player 2');
    stateService.startGame();
    const initialGameState = stateService.getGameStateDeepCopy();
    const player1 = initialGameState.players[0];
    player1.currentSpace = 'OWNER-SCOPE-INITIATION';
    stateService.setGameState(initialGameState);

    // 2. Save a snapshot (this captures OWNER-SCOPE-INITIATION as the current space)
    stateService.savePreSpaceEffectSnapshot();
    
    // Create a mock snapshot with the correct space
    const mockSnapshot = {
      ...initialGameState,
      players: initialGameState.players.map(p => ({ ...p, currentSpace: 'OWNER-SCOPE-INITIATION' }))
    };
    jest.spyOn(stateService, 'getPreSpaceEffectSnapshot').mockReturnValue(mockSnapshot);
    jest.spyOn(stateService, 'hasPreSpaceEffectSnapshot').mockReturnValue(true);

    // Mock DataService responses for this test
    (dataService.getSpaceContent as jest.Mock).mockReturnValue({ can_negotiate: true });
    (dataService.getSpaceEffects as jest.Mock).mockReturnValue([{ 
      effect_type: 'time', 
      effect_action: 'add', 
      effect_value: 1 
    }]);
    
    const snapshotState = stateService.getPreSpaceEffectSnapshot()!;
    expect(snapshotState).toBeDefined();

    // 3. Mutate the state after the snapshot was taken
    stateService.updatePlayer({ id: player1.id, money: 500 });
    expect(stateService.getPlayer(player1.id)!.money).toBe(500);

    // 4. Action: Call tryAgainOnSpace
    const result = await turnService.tryAgainOnSpace(player1.id);

    // 5. Assertions
    expect(result.success).toBe(true);
    expect(result.message).toContain('Reverted to OWNER-SCOPE-INITIATION with 1 day penalty');

    // Verify that setGameState was called with the correct, reverted state
    const setGameStateMock = stateService.setGameState as jest.Mock;
    console.log('setGameState call count:', setGameStateMock.mock.calls.length);
    console.log('setGameState calls:', setGameStateMock.mock.calls.map((call, i) => `Call ${i}: ${JSON.stringify(call[0].players[0]?.currentSpace)}`));
    
    // We expect at least 2 calls: 1 from test setup (setGameState(initialGameState)), 1 from tryAgainOnSpace
    expect(setGameStateMock).toHaveBeenCalledWith(expect.any(Object));
    
    const finalState: GameState = setGameStateMock.mock.calls[setGameStateMock.mock.calls.length - 1][0];

    // Check that the mutation is gone (reverted)
    const revertedPlayer = finalState.players.find(p => p.id === player1.id)!;
    expect(revertedPlayer.money).toBe(0); // Original value

    // Check that the penalty was applied to the reverted state
    expect(revertedPlayer.timeSpent).toBe(1); // initial 0 + 1 penalty

    // Check that the snapshot is cleared in the final state
    expect(finalState.preSpaceEffectState).toBeNull();

    // Verify that the turn was advanced
    expect((turnService as any).nextPlayer).toHaveBeenCalledTimes(1);
  });

  it('should fail if no snapshot is available', async () => {
    stateService.addPlayer('Player 1');
    stateService.startGame();
    const gameState = stateService.getGameStateDeepCopy();
    const player1 = gameState.players[0];

    // Ensure no snapshot exists
    expect(stateService.hasPreSpaceEffectSnapshot()).toBe(false);

    const result = await turnService.tryAgainOnSpace(player1.id);

    expect(result.success).toBe(false);
    expect(result.message).toContain('No snapshot available');
    expect((turnService as any).nextPlayer).not.toHaveBeenCalled();
  });

  it('should fail if the space is not negotiable', async () => {
    stateService.addPlayer('Player 1');
    stateService.startGame();
    const gameState = stateService.getGameStateDeepCopy();
    const player1 = gameState.players[0];
    player1.currentSpace = 'NON-NEGOTIABLE-SPACE';
    stateService.setGameState(gameState);

    // Mock DataService to return a non-negotiable space
    (dataService.getSpaceContent as jest.Mock).mockReturnValue({ can_negotiate: false });

    stateService.savePreSpaceEffectSnapshot();

    const result = await turnService.tryAgainOnSpace(player1.id);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Try again not available on this space');
    expect((turnService as any).nextPlayer).not.toHaveBeenCalled();
  });
});