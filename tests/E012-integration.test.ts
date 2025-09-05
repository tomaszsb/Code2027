// E012 Card Choice Integration Test
import { EffectFactory } from '../src/utils/EffectFactory';
import { EffectEngineService } from '../src/services/EffectEngineService';
import { 
  IResourceService, 
  ICardService, 
  IChoiceService, 
  IStateService, 
  IMovementService,
  ITurnService,
  IGameRulesService,
  IEffectEngineService
} from '../src/types/ServiceContracts';
import { Effect, EffectContext, isChoiceOfEffectsEffect } from '../src/types/EffectTypes';
import { Player, Card } from '../src/types/DataTypes';

// Mock services
const createMockChoiceService = (): jest.Mocked<IChoiceService> => ({
  createChoice: jest.fn(),
  resolveChoice: jest.fn(),
  getActiveChoice: jest.fn(),
  hasActiveChoice: jest.fn()
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

const createMockServices = () => ({
  resourceService: createMockResourceService(),
  cardService: createMockCardService(),
  choiceService: createMockChoiceService(),
  stateService: createMockStateService(),
  movementService: {} as jest.Mocked<IMovementService>,
  turnService: {} as jest.Mocked<ITurnService>,
  gameRulesService: {} as jest.Mocked<IGameRulesService>
});

describe('E012 Card - Choice of Effects Integration', () => {
  let effectEngineService: EffectEngineService;
  let mockServices: ReturnType<typeof createMockServices>;

  beforeEach(() => {
    mockServices = createMockServices();
    effectEngineService = new EffectEngineService(
      mockServices.resourceService,
      mockServices.cardService,
      mockServices.choiceService,
      mockServices.stateService,
      mockServices.movementService,
      mockServices.turnService,
      mockServices.gameRulesService
    );
  });

  it('should parse E012 card description into CHOICE_OF_EFFECTS', () => {
    const e012Card: Card = {
      card_id: 'E012',
      card_name: 'Paperwork Snag',
      description: 'Discard 1 Expeditor Card or the current filing takes 1 tick more time.',
      card_type: 'E'
    };

    const effects = EffectFactory.createEffectsFromCard(e012Card, 'player1');

    expect(effects).toHaveLength(1);
    expect(effects[0].effectType).toBe('CHOICE_OF_EFFECTS');
    
    if (isChoiceOfEffectsEffect(effects[0])) {
      const payload = effects[0].payload;
      expect(payload.playerId).toBe('player1');
      expect(payload.prompt).toBe('Paperwork Snag: Choose one option');
      expect(payload.options).toHaveLength(2);
      
      // Check first option - discard card
      expect(payload.options[0].label).toBe('Discard 1 Expeditor Card');
      expect(payload.options[0].effects).toHaveLength(1);
      expect(payload.options[0].effects[0].effectType).toBe('CARD_DISCARD');
      
      // Check second option - time delay
      expect(payload.options[1].label).toBe('Current filing takes 1 tick more time');
      expect(payload.options[1].effects).toHaveLength(1);
      expect(payload.options[1].effects[0].effectType).toBe('RESOURCE_CHANGE');
    }
  });

  it('should process E012 choice effect - option 0 (discard card)', async () => {
    const choiceEffect: Effect = {
      effectType: 'CHOICE_OF_EFFECTS',
      payload: {
        playerId: 'player1',
        prompt: 'Paperwork Snag: Choose one option',
        options: [
          {
            label: 'Discard 1 Expeditor Card',
            effects: [{
              effectType: 'CARD_DISCARD',
              payload: {
                playerId: 'player1',
                cardIds: [],
                cardType: 'E',
                count: 1,
                source: 'card:E012',
                reason: 'Paperwork Snag: Player chose to discard Expeditor card'
              }
            }]
          },
          {
            label: 'Current filing takes 1 tick more time',
            effects: [{
              effectType: 'RESOURCE_CHANGE',
              payload: {
                playerId: 'player1',
                resource: 'TIME',
                amount: 1,
                source: 'card:E012',
                reason: 'Paperwork Snag: Player chose filing delay'
              }
            }]
          }
        ]
      }
    };

    const context: EffectContext = {
      source: 'Card Play',
      playerId: 'player1',
      triggerEvent: 'CARD_PLAY'
    };

    // Mock choice service to return option 0 (discard)
    mockServices.choiceService.createChoice.mockResolvedValue('0');
    
    // Mock card service for discard processing
    const mockPlayer: Player = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'START',
      visitType: 'First',
      money: 100,
      timeSpent: 0,
      projectScope: 0,
      availableCards: {
        W: [],
        B: [],
        E: ['E001', 'E002'],
        L: [],
        I: []
      },
      activeCards: [],
      discardedCards: {
        W: [],
        B: [],
        E: [],
        L: [],
        I: []
      }
    };
    
    mockServices.stateService.getPlayer.mockReturnValue(mockPlayer);
    mockServices.cardService.getPlayerCards.mockReturnValue(['E001', 'E002']);

    const result = await effectEngineService.processEffect(choiceEffect, context);

    expect(result.success).toBe(true);
    expect(mockServices.choiceService.createChoice).toHaveBeenCalledWith(
      'player1',
      'GENERAL',
      'Paperwork Snag: Choose one option',
      [
        { id: '0', label: 'Discard 1 Expeditor Card' },
        { id: '1', label: 'Current filing takes 1 tick more time' }
      ]
    );
  });

  it('should process E012 choice effect - option 1 (time delay)', async () => {
    const choiceEffect: Effect = {
      effectType: 'CHOICE_OF_EFFECTS',
      payload: {
        playerId: 'player1',
        prompt: 'Paperwork Snag: Choose one option',
        options: [
          {
            label: 'Discard 1 Expeditor Card',
            effects: [{
              effectType: 'CARD_DISCARD',
              payload: {
                playerId: 'player1',
                cardIds: [],
                cardType: 'E',
                count: 1,
                source: 'card:E012',
                reason: 'Paperwork Snag: Player chose to discard Expeditor card'
              }
            }]
          },
          {
            label: 'Current filing takes 1 tick more time',
            effects: [{
              effectType: 'RESOURCE_CHANGE',
              payload: {
                playerId: 'player1',
                resource: 'TIME',
                amount: 1,
                source: 'card:E012',
                reason: 'Paperwork Snag: Player chose filing delay'
              }
            }]
          }
        ]
      }
    };

    const context: EffectContext = {
      source: 'Card Play',
      playerId: 'player1',
      triggerEvent: 'CARD_PLAY'
    };

    // Mock choice service to return option 1 (time delay)
    mockServices.choiceService.createChoice.mockResolvedValue('1');

    const result = await effectEngineService.processEffect(choiceEffect, context);

    expect(result.success).toBe(true);
    expect(mockServices.choiceService.createChoice).toHaveBeenCalledWith(
      'player1',
      'GENERAL',
      'Paperwork Snag: Choose one option',
      [
        { id: '0', label: 'Discard 1 Expeditor Card' },
        { id: '1', label: 'Current filing takes 1 tick more time' }
      ]
    );
  });

  it('should handle invalid choice option gracefully', async () => {
    const choiceEffect: Effect = {
      effectType: 'CHOICE_OF_EFFECTS',
      payload: {
        playerId: 'player1',
        prompt: 'Test prompt',
        options: [
          {
            label: 'Option 1',
            effects: []
          }
        ]
      }
    };

    const context: EffectContext = {
      source: 'Test',
      playerId: 'player1'
    };

    // Mock choice service to return invalid option index
    mockServices.choiceService.createChoice.mockResolvedValue('999');

    const result = await effectEngineService.processEffect(choiceEffect, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid choice option selected');
  });
});