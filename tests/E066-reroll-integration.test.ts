// E066 Card Re-roll Integration Test
import { EffectFactory } from '../src/utils/EffectFactory';
import { EffectEngineService } from '../src/services/EffectEngineService';
import { TurnService } from '../src/services/TurnService';
import { 
  IResourceService, 
  ICardService, 
  IChoiceService, 
  IStateService, 
  IMovementService,
  ITurnService,
  IGameRulesService,
  IDataService,
  IEffectEngineService
} from '../src/types/ServiceContracts';
import { Effect, EffectContext, isTurnControlEffect } from '../src/types/EffectTypes';
import { Player, Card } from '../src/types/DataTypes';
import { GameState } from '../src/types/StateTypes';
import { TurnEffectResult } from '../src/types/StateTypes';
import { NegotiationService } from '../src/services/NegotiationService';

// Mock services
const createMockDataService = (): jest.Mocked<IDataService> => ({
  getGameConfig: jest.fn(),
  getGameConfigBySpace: jest.fn(),
  getPhaseOrder: jest.fn(),
  getAllSpaces: jest.fn(),
  getSpaceByName: jest.fn(),
  getMovement: jest.fn().mockReturnValue(null),
  getAllMovements: jest.fn(),
  getDiceOutcome: jest.fn(),
  getAllDiceOutcomes: jest.fn(),
  getSpaceEffects: jest.fn().mockReturnValue([]),
  getAllSpaceEffects: jest.fn(),
  getDiceEffects: jest.fn().mockReturnValue([]),
  getAllDiceEffects: jest.fn(),
  getSpaceContent: jest.fn(),
  getAllSpaceContent: jest.fn(),
  getCards: jest.fn(),
  getCardById: jest.fn(),
  getCardsByType: jest.fn(),
  getAllCardTypes: jest.fn(),
  isLoaded: jest.fn().mockReturnValue(true),
  loadData: jest.fn()
});

const createMockStateService = (): jest.Mocked<IStateService> => ({
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
  setGameState: jest.fn()
});

const createMockResourceService = (): jest.Mocked<IResourceService> => ({
  addMoney: jest.fn().mockReturnValue(true),
  spendMoney: jest.fn().mockReturnValue(true),
  canAfford: jest.fn(),
  addTime: jest.fn(),
  spendTime: jest.fn(),
  updateResources: jest.fn(),
  getResourceHistory: jest.fn(),
  validateResourceChange: jest.fn()
});

const createMockCardService = (): jest.Mocked<ICardService> => ({
  canPlayCard: jest.fn(),
  isValidCardType: jest.fn(),
  playerOwnsCard: jest.fn(),
  playCard: jest.fn(),
  drawCards: jest.fn(),
  discardCards: jest.fn().mockReturnValue(true),
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
  effectEngineService: {} as jest.Mocked<IEffectEngineService>
});

const createMockServices = () => ({
  dataService: createMockDataService(),
  resourceService: createMockResourceService(),
  cardService: createMockCardService(),
  choiceService: {} as jest.Mocked<IChoiceService>,
  stateService: createMockStateService(),
  movementService: {} as jest.Mocked<IMovementService>,
  gameRulesService: {} as jest.Mocked<IGameRulesService>,
  negotiationService: {} as jest.Mocked<NegotiationService>
});

describe('E066 Card - Re-roll Mechanics Integration', () => {
  let effectEngineService: EffectEngineService;
  let turnService: TurnService;
  let mockServices: ReturnType<typeof createMockServices>;

  beforeEach(() => {
    mockServices = createMockServices();
    
    effectEngineService = new EffectEngineService(
      mockServices.resourceService,
      mockServices.cardService,
      mockServices.choiceService,
      mockServices.stateService,
      mockServices.movementService,
      {} as ITurnService,
      mockServices.gameRulesService
    );

    turnService = new TurnService(
      mockServices.dataService,
      mockServices.stateService,
      mockServices.gameRulesService,
      mockServices.cardService,
      mockServices.resourceService,
      mockServices.movementService,
      mockServices.negotiationService,
      effectEngineService
    );

    // Set the effect engine service on turn service for circular dependency
    turnService.setEffectEngineService(effectEngineService);
  });

  it('should parse E066 card and create GRANT_REROLL effect', () => {
    const e066Card: Card = {
      card_id: 'E066',
      card_name: 'Investor Pitch Preparation',
      description: 'Gain 1 extra die throw this turn if you do not like the outcome of first throw.',
      card_type: 'E'
    };

    const effects = EffectFactory.createEffectsFromCard(e066Card, 'player1');

    // E066 generates GRANT_REROLL effect plus a LOG effect
    expect(effects.length).toBeGreaterThanOrEqual(1);
    
    const rerollEffect = effects.find(e => e.effectType === 'TURN_CONTROL');
    expect(rerollEffect).toBeDefined();
    expect(rerollEffect?.effectType).toBe('TURN_CONTROL');
    
    if (rerollEffect && isTurnControlEffect(rerollEffect)) {
      const payload = rerollEffect.payload;
      expect(payload.action).toBe('GRANT_REROLL');
      expect(payload.playerId).toBe('player1');
      expect(payload.source).toBe('card:E066');
      expect(payload.reason).toContain('extra die throw');
    }
  });

  it('should process GRANT_REROLL effect and set canReRoll flag', async () => {
    const grantRerollEffect: Effect = {
      effectType: 'TURN_CONTROL',
      payload: {
        action: 'GRANT_REROLL',
        playerId: 'player1',
        source: 'card:E066',
        reason: 'Investor Pitch Preparation: Gain 1 extra die throw this turn'
      }
    };

    const mockPlayer: Player = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'TEST_SPACE',
      visitType: 'First',
      money: 100,
      timeSpent: 10,
      projectScope: 50,
      availableCards: { W: [], B: [], E: [], L: [], I: [] },
      activeCards: [],
      discardedCards: { W: [], B: [], E: [], L: [], I: [] },
      turnModifiers: { skipTurns: 0 }
    };

    mockServices.stateService.getPlayer.mockReturnValue(mockPlayer);

    const context: EffectContext = {
      source: 'Card Play',
      playerId: 'player1',
      triggerEvent: 'CARD_PLAY'
    };

    const result = await effectEngineService.processEffect(grantRerollEffect, context);

    expect(result.success).toBe(true);
    expect(mockServices.stateService.updatePlayer).toHaveBeenCalledWith({
      id: 'player1',
      turnModifiers: {
        skipTurns: 0,
        canReRoll: true
      }
    });
  });

  it('should include canReRoll in rollDiceWithFeedback result when flag is set', async () => {
    const mockPlayer: Player = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'TEST_SPACE',
      visitType: 'First',
      money: 100,
      timeSpent: 10,
      projectScope: 50,
      availableCards: { W: [], B: [], E: [], L: [], I: [] },
      activeCards: [],
      discardedCards: { W: [], B: [], E: [], L: [], I: [] },
      turnModifiers: { skipTurns: 0, canReRoll: true }
    };

    mockServices.stateService.getPlayer.mockReturnValue(mockPlayer);
    mockServices.dataService.getSpaceEffects.mockReturnValue([]);
    mockServices.dataService.getDiceEffects.mockReturnValue([]);

    // Mock the rollDice method to return a fixed value
    jest.spyOn(turnService as any, 'rollDice').mockReturnValue(4);

    const result = await turnService.rollDiceWithFeedback('player1');

    expect(result.canReRoll).toBe(true);
    expect(result.diceValue).toBe(4);
  });

  it('should not include canReRoll when flag is not set', async () => {
    const mockPlayer: Player = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'TEST_SPACE',
      visitType: 'First',
      money: 100,
      timeSpent: 10,
      projectScope: 50,
      availableCards: { W: [], B: [], E: [], L: [], I: [] },
      activeCards: [],
      discardedCards: { W: [], B: [], E: [], L: [], I: [] },
      turnModifiers: { skipTurns: 0, canReRoll: false }
    };

    mockServices.stateService.getPlayer.mockReturnValue(mockPlayer);
    mockServices.dataService.getSpaceEffects.mockReturnValue([]);
    mockServices.dataService.getDiceEffects.mockReturnValue([]);

    // Mock the rollDice method to return a fixed value
    jest.spyOn(turnService as any, 'rollDice').mockReturnValue(3);

    const result = await turnService.rollDiceWithFeedback('player1');

    expect(result.canReRoll).toBe(false);
    expect(result.diceValue).toBe(3);
  });

  it('should successfully execute rerollDice when player has canReRoll flag', async () => {
    const mockPlayer: Player = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'TEST_SPACE',
      visitType: 'First',
      money: 100,
      timeSpent: 10,
      projectScope: 50,
      availableCards: { W: [], B: [], E: [], L: [], I: [] },
      activeCards: [],
      discardedCards: { W: [], B: [], E: [], L: [], I: [] },
      turnModifiers: { skipTurns: 0, canReRoll: true }
    };

    mockServices.stateService.getPlayer.mockReturnValue(mockPlayer);
    mockServices.dataService.getSpaceEffects.mockReturnValue([]);
    mockServices.dataService.getDiceEffects.mockReturnValue([]);

    // Mock the rollDice method to return a different value for re-roll
    jest.spyOn(turnService as any, 'rollDice').mockReturnValue(6);

    const result = await turnService.rerollDice('player1');

    expect(result.diceValue).toBe(6);
    expect(result.canReRoll).toBe(false); // Should be consumed after use
    
    // Should consume the re-roll ability
    expect(mockServices.stateService.updatePlayer).toHaveBeenCalledWith({
      id: 'player1',
      turnModifiers: {
        skipTurns: 0,
        canReRoll: false
      }
    });
  });

  it('should throw error when trying to reroll without canReRoll flag', async () => {
    const mockPlayer: Player = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'TEST_SPACE',
      visitType: 'First',
      money: 100,
      timeSpent: 10,
      projectScope: 50,
      availableCards: { W: [], B: [], E: [], L: [], I: [] },
      activeCards: [],
      discardedCards: { W: [], B: [], E: [], L: [], I: [] },
      turnModifiers: { skipTurns: 0, canReRoll: false }
    };

    mockServices.stateService.getPlayer.mockReturnValue(mockPlayer);

    await expect(turnService.rerollDice('player1')).rejects.toThrow(
      'Player player1 does not have re-roll ability'
    );
  });

  it('should reset canReRoll flag at end of turn', () => {
    const mockGameState: GameState = {
      players: [{
        id: 'player1',
        name: 'Test Player',
        currentSpace: 'TEST_SPACE',
        visitType: 'First',
        money: 100,
        timeSpent: 10,
        projectScope: 50,
        availableCards: { W: [], B: [], E: [], L: [], I: [] },
        activeCards: [],
        discardedCards: { W: [], B: [], E: [], L: [], I: [] },
        turnModifiers: { skipTurns: 0, canReRoll: true }
      }],
      currentPlayerId: 'player1',
      gamePhase: 'PLAY',
      turn: 1,
      activeModal: null,
      awaitingChoice: null,
      hasPlayerMovedThisTurn: false,
      hasPlayerRolledDice: true,
      isGameOver: false,
      requiredActions: 1,
      completedActions: 1,
      availableActionTypes: [],
      hasCompletedManualActions: false,
      activeNegotiation: null,
      globalActionLog: [],
      preSpaceEffectState: null
    };

    mockServices.stateService.getGameState.mockReturnValue(mockGameState);
    mockServices.gameRulesService.checkWinCondition = jest.fn().mockResolvedValue(false);

    // Execute nextPlayer (which is called by endTurn)
    const nextPlayerMethod = (turnService as any).nextPlayer.bind(turnService);
    const result = nextPlayerMethod();

    expect(mockServices.stateService.updatePlayer).toHaveBeenCalledWith({
      id: 'player1',
      turnModifiers: {
        skipTurns: 0,
        canReRoll: false
      }
    });
  });
});