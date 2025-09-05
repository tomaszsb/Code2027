// E066 Card Simple Integration Test - Core Functionality
import { EffectFactory } from '../src/utils/EffectFactory';
import { EffectEngineService } from '../src/services/EffectEngineService';
import { 
  IResourceService, 
  ICardService, 
  IChoiceService, 
  IStateService, 
  IMovementService,
  ITurnService,
  IGameRulesService
} from '../src/types/ServiceContracts';
import { Effect, EffectContext, isTurnControlEffect } from '../src/types/EffectTypes';
import { Player, Card } from '../src/types/DataTypes';

// Simple mock services for focused testing
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

describe('E066 Card - Core Re-roll Functionality', () => {
  it('should parse E066 card and create GRANT_REROLL effect', () => {
    const e066Card: Card = {
      card_id: 'E066',
      card_name: 'Investor Pitch Preparation',
      description: 'Gain 1 extra die throw this turn if you do not like the outcome of first throw.',
      card_type: 'E'
    };

    const effects = EffectFactory.createEffectsFromCard(e066Card, 'player1');

    // E066 should generate a GRANT_REROLL effect
    const rerollEffect = effects.find(e => e.effectType === 'TURN_CONTROL');
    expect(rerollEffect).toBeDefined();
    
    if (rerollEffect && isTurnControlEffect(rerollEffect)) {
      const payload = rerollEffect.payload;
      expect(payload.action).toBe('GRANT_REROLL');
      expect(payload.playerId).toBe('player1');
      expect(payload.source).toBe('card:E066');
      expect(payload.reason).toContain('extra die throw');
    }
  });

  it('should process GRANT_REROLL effect and set canReRoll flag', async () => {
    const mockStateService = createMockStateService();
    
    const effectEngineService = new EffectEngineService(
      {} as IResourceService,
      {} as ICardService,
      {} as IChoiceService,
      mockStateService,
      {} as IMovementService,
      {} as ITurnService,
      {} as IGameRulesService
    );

    const grantRerollEffect: Effect = {
      effectType: 'TURN_CONTROL',
      payload: {
        action: 'GRANT_REROLL',
        playerId: 'player1',
        source: 'card:E066',
        reason: 'E066: Grant re-roll ability'
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

    mockStateService.getPlayer.mockReturnValue(mockPlayer);

    const context: EffectContext = {
      source: 'Card Play',
      playerId: 'player1',
      triggerEvent: 'CARD_PLAY'
    };

    const result = await effectEngineService.processEffect(grantRerollEffect, context);

    expect(result.success).toBe(true);
    expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
      id: 'player1',
      turnModifiers: {
        skipTurns: 0,
        canReRoll: true
      }
    });
  });

  it('should validate GRANT_REROLL effect type enhancement', () => {
    // This test verifies our type enhancement works
    const grantRerollEffect: Effect = {
      effectType: 'TURN_CONTROL',
      payload: {
        action: 'GRANT_REROLL', // This should not cause a TypeScript error
        playerId: 'player1',
        source: 'card:E066',
        reason: 'Test re-roll grant'
      }
    };

    expect(grantRerollEffect.effectType).toBe('TURN_CONTROL');
    if (isTurnControlEffect(grantRerollEffect)) {
      expect(grantRerollEffect.payload.action).toBe('GRANT_REROLL');
    }
  });

  it('should validate Player interface turnModifiers enhancement', () => {
    // This test verifies our Player interface enhancement
    const playerWithReroll: Player = {
      id: 'test',
      name: 'Test',
      currentSpace: 'START',
      visitType: 'First',
      money: 0,
      timeSpent: 0,
      projectScope: 0,
      availableCards: { W: [], B: [], E: [], L: [], I: [] },
      activeCards: [],
      discardedCards: { W: [], B: [], E: [], L: [], I: [] },
      turnModifiers: {
        skipTurns: 0,
        canReRoll: true // This should not cause a TypeScript error
      }
    };

    expect(playerWithReroll.turnModifiers?.canReRoll).toBe(true);
  });
});