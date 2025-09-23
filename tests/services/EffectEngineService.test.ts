import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EffectEngineService } from '../../src/services/EffectEngineService';
import {
  IResourceService,
  ICardService,
  IChoiceService,
  IStateService,
  IMovementService,
  ITurnService,
  IGameRulesService,
  ITargetingService
} from '../../src/types/ServiceContracts';
import { Effect, EffectContext } from '../../src/types/EffectTypes';

describe('EffectEngineService', () => {
  let effectEngineService: EffectEngineService;
  let mockResourceService: any;
  let mockCardService: any;
  let mockChoiceService: any;
  let mockStateService: any;
  let mockMovementService: any;
  let mockTurnService: any;
  let mockGameRulesService: any;
  let mockTargetingService: any;

  beforeEach(() => {
    // Mock all dependencies
    mockResourceService = {
      adjustResource: vi.fn(),
      addMoney: vi.fn(),
      spendMoney: vi.fn(),
      canAfford: vi.fn(),
      addTime: vi.fn(),
      spendTime: vi.fn(),
      updateResources: vi.fn(),
      getResourceHistory: vi.fn(),
      validateResourceChange: vi.fn(),
      takeOutLoan: vi.fn(),
      applyInterest: vi.fn()
    };

    mockCardService = {
      canPlayCard: vi.fn(),
      isValidCardType: vi.fn(),
      playerOwnsCard: vi.fn(),
      playCard: vi.fn(),
      drawCards: vi.fn(),
      drawAndApplyCard: vi.fn(),
      discardCards: vi.fn(),
      removeCard: vi.fn(),
      replaceCard: vi.fn(),
      endOfTurn: vi.fn(),
      activateCard: vi.fn(),
      transferCard: vi.fn(),
      getCardType: vi.fn(),
      getPlayerCards: vi.fn(),
      getPlayerCardCount: vi.fn(),
      getCardToDiscard: vi.fn(),
      applyCardEffects: vi.fn(),
      finalizePlayedCard: vi.fn(),
      discardPlayedCard: vi.fn(),
      effectEngineService: {} as any,
      setEffectEngineService: vi.fn()
    };

    mockChoiceService = {
      createChoice: vi.fn(),
      resolveChoice: vi.fn(),
      getActiveChoice: vi.fn(),
      clearChoice: vi.fn()
    };

    mockStateService = {
      getGameState: vi.fn(),
      getGameStateDeepCopy: vi.fn(),
      isStateLoaded: vi.fn(),
      subscribe: vi.fn(),
      addPlayer: vi.fn(),
      updatePlayer: vi.fn(),
      removePlayer: vi.fn(),
      getPlayer: vi.fn(),
      getAllPlayers: vi.fn(),
      setCurrentPlayer: vi.fn(),
      setGamePhase: vi.fn(),
      advanceTurn: vi.fn(),
      nextPlayer: vi.fn(),
      initializeGame: vi.fn(),
      startGame: vi.fn(),
      endGame: vi.fn(),
      resetGame: vi.fn(),
      updateNegotiationState: vi.fn(),
      fixPlayerStartingSpaces: vi.fn(),
      forceResetAllPlayersToCorrectStartingSpace: vi.fn(),
      setAwaitingChoice: vi.fn(),
      clearAwaitingChoice: vi.fn(),
      setPlayerHasMoved: vi.fn(),
      clearPlayerHasMoved: vi.fn(),
      setPlayerCompletedManualAction: vi.fn(),
      setPlayerHasRolledDice: vi.fn(),
      clearPlayerCompletedManualActions: vi.fn(),
      clearPlayerHasRolledDice: vi.fn(),
      updateActionCounts: vi.fn(),
      clearTurnActions: vi.fn(),
      showCardModal: vi.fn(),
      dismissModal: vi.fn(),
      createPlayerSnapshot: vi.fn(),
      restorePlayerSnapshot: vi.fn(),
      validatePlayerAction: vi.fn(),
      canStartGame: vi.fn(),
      logToActionHistory: vi.fn(),
      savePreSpaceEffectSnapshot: vi.fn(),
      clearPreSpaceEffectSnapshot: vi.fn(),
      hasPreSpaceEffectSnapshot: vi.fn(),
      getPreSpaceEffectSnapshot: vi.fn(),
      setGameState: vi.fn(),
      updateGameState: vi.fn(),
      selectDestination: vi.fn()
    };

    mockMovementService = {
      getValidMoves: vi.fn(),
      movePlayer: vi.fn(),
      getDiceDestination: vi.fn(),
      handleMovementChoice: vi.fn()
    };

    mockTurnService = {
      canPlayerTakeTurn: vi.fn(),
      getCurrentPlayerTurn: vi.fn(),
      nextPlayer: vi.fn(),
      endTurn: vi.fn(),
      takeTurn: vi.fn(),
      rollDiceAndProcessEffects: vi.fn(),
      endTurnWithMovement: vi.fn(),
      setEffectEngineService: vi.fn(),
      processTurnEffects: vi.fn(),
      rollDice: vi.fn(),
      rollDiceWithFeedback: vi.fn(),
      rerollDice: vi.fn(),
      startTurn: vi.fn(),
      setTurnModifier: vi.fn()
    };

    mockGameRulesService = {
      isMoveValid: vi.fn(),
      canPlayCard: vi.fn(),
      canDrawCard: vi.fn(),
      canPlayerAfford: vi.fn(),
      isPlayerTurn: vi.fn(),
      isGameInProgress: vi.fn(),
      canPlayerTakeAction: vi.fn(),
      checkWinCondition: vi.fn(),
      calculateProjectScope: vi.fn(),
      calculatePlayerScore: vi.fn(),
      determineWinner: vi.fn(),
      checkTurnLimit: vi.fn(),
      checkGameEndConditions: vi.fn()
    };

    mockTargetingService = {
      getTargetPlayers: vi.fn(),
      applyEffectToTargets: vi.fn(),
      resolveTargetRule: vi.fn(),
      validateTargeting: vi.fn()
    };

    // Instantiate the EffectEngineService with mocked dependencies
    effectEngineService = new EffectEngineService(
      mockResourceService,
      mockCardService,
      mockChoiceService,
      mockStateService,
      mockMovementService,
      mockTurnService,
      mockGameRulesService,
      mockTargetingService
    );
  });

  it('should process RESOURCE_CHANGE effect and call ResourceService', async () => {
    // Arrange - Create a sample ResourceChangeEffect
    const resourceChangeEffect: Effect = {
      effectType: 'RESOURCE_CHANGE',
      payload: {
        playerId: 'player1',
        resource: 'MONEY',
        amount: 100,
        source: 'test',
        reason: 'Unit test'
      }
    };

    const context: EffectContext = {
      source: 'Unit Test',
      playerId: 'player1',
      triggerEvent: 'TEST_EVENT'
    };

    // Mock the addMoney method to return success
    mockResourceService.addMoney.mockReturnValue(true);

    // Act - Call processEffect with the sample effect
    const result = await effectEngineService.processEffect(resourceChangeEffect, context);

    // Assert - Verify ResourceService.addMoney was called with correct parameters
    expect(mockResourceService.addMoney).toHaveBeenCalledTimes(1);
    expect(mockResourceService.addMoney).toHaveBeenCalledWith('player1', 100, 'test', 'Unit test');
    expect(result.success).toBe(true);
  });

  it('should process CARD_DRAW effect and call CardService', async () => {
    // Arrange - Create a sample CardDrawEffect
    const cardDrawEffect: Effect = {
      effectType: 'CARD_DRAW',
      payload: {
        playerId: 'player1',
        cardType: 'W',
        count: 2,
        source: 'test',
        reason: 'Unit test'
      }
    };

    const context: EffectContext = {
      source: 'Unit Test',
      playerId: 'player1',
      triggerEvent: 'TEST_EVENT'
    };

    // Mock the drawCards method to return success
    mockCardService.drawCards.mockReturnValue(['W_001', 'W_002']);

    // Act - Call processEffect with the sample effect
    const result = await effectEngineService.processEffect(cardDrawEffect, context);

    // Assert - Verify CardService.drawCards was called with correct parameters
    expect(mockCardService.drawCards).toHaveBeenCalledTimes(1);
    expect(mockCardService.drawCards).toHaveBeenCalledWith('player1', 'W', 2, 'test', 'Unit test');
    expect(result.success).toBe(true);
  });

  it('should process PLAYER_MOVEMENT effect and call MovementService', async () => {
    // Arrange - Create a sample PlayerMovementEffect
    const playerMovementEffect: Effect = {
      effectType: 'PLAYER_MOVEMENT',
      payload: {
        playerId: 'player1',
        destinationSpace: 'NEW-SPACE',
        source: 'test',
        reason: 'Unit test'
      }
    };

    const context: EffectContext = {
      source: 'Unit Test',
      playerId: 'player1',
      triggerEvent: 'TEST_EVENT'
    };

    // Mock the movePlayer method to return success
    mockMovementService.movePlayer.mockResolvedValue({ success: true });

    // Act - Call processEffect with the sample effect
    const result = await effectEngineService.processEffect(playerMovementEffect, context);

    // Assert - Verify MovementService.movePlayer was called with correct parameters
    expect(mockMovementService.movePlayer).toHaveBeenCalledTimes(1);
    expect(mockMovementService.movePlayer).toHaveBeenCalledWith('player1', 'NEW-SPACE');
    expect(result.success).toBe(true);
  });

  it('should process TURN_CONTROL effect for skip turn and call StateService', async () => {
    // Arrange - Create a sample TurnControlEffect for SKIP_TURN
    const turnControlEffect: Effect = {
      effectType: 'TURN_CONTROL',
      payload: {
        action: 'SKIP_TURN',
        playerId: 'player1',
        source: 'test',
        reason: 'Unit test'
      }
    };

    const context: EffectContext = {
      source: 'Unit Test',
      playerId: 'player1',
      triggerEvent: 'TEST_EVENT'
    };

    // Mock the setTurnModifier method to return success
    mockTurnService.setTurnModifier.mockReturnValue(true);

    // Act - Call processEffect with the sample effect
    const result = await effectEngineService.processEffect(turnControlEffect, context);

    // Assert - Verify TurnService.setTurnModifier was called with correct parameters
    expect(mockTurnService.setTurnModifier).toHaveBeenCalledTimes(1);
    expect(mockTurnService.setTurnModifier).toHaveBeenCalledWith('player1', 'SKIP_TURN');
    expect(result.success).toBe(true);
  });

  it('should process TURN_CONTROL effect for grant re-roll and call StateService', async () => {
    // Arrange - Create a sample TurnControlEffect for GRANT_REROLL
    const turnControlEffect: Effect = {
      effectType: 'TURN_CONTROL',
      payload: {
        action: 'GRANT_REROLL',
        playerId: 'player1',
        source: 'test',
        reason: 'Unit test'
      }
    };

    const context: EffectContext = {
      source: 'Unit Test',
      playerId: 'player1',
      triggerEvent: 'TEST_EVENT'
    };

    // Mock the getPlayer method to return a player object
    const mockPlayer = {
      id: 'player1',
      name: 'Test Player',
      turnModifiers: { skipTurns: 0 }
    };
    mockStateService.getPlayer.mockReturnValue(mockPlayer);

    // Act - Call processEffect with the sample effect
    const result = await effectEngineService.processEffect(turnControlEffect, context);

    // Assert - Verify StateService.updatePlayer was called with correct parameters
    expect(mockStateService.updatePlayer).toHaveBeenCalledTimes(1);
    expect(mockStateService.updatePlayer).toHaveBeenCalledWith({
      id: 'player1',
      turnModifiers: {
        skipTurns: 0,
        canReRoll: true
      }
    });
    expect(result.success).toBe(true);
  });

  it('should process CHOICE effect and call ChoiceService', async () => {
    // Arrange - Create a sample ChoiceEffect
    const choiceEffect: Effect = {
      effectType: 'CHOICE',
      payload: {
        id: 'test-choice-123',
        playerId: 'player1',
        type: 'GENERAL',
        prompt: 'Choose your action',
        options: [
          { id: 'option1', label: 'First Option' },
          { id: 'option2', label: 'Second Option' }
        ]
      }
    };

    const context: EffectContext = {
      source: 'Unit Test',
      playerId: 'player1',
      triggerEvent: 'TEST_EVENT'
    };

    // Mock the createChoice method to return a selection
    mockChoiceService.createChoice.mockResolvedValue('option1');

    // Act - Call processEffect with the sample effect
    const result = await effectEngineService.processEffect(choiceEffect, context);

    // Assert - Verify ChoiceService.createChoice was called with correct parameters
    expect(mockChoiceService.createChoice).toHaveBeenCalledTimes(1);
    expect(mockChoiceService.createChoice).toHaveBeenCalledWith(
      'player1',
      'GENERAL',
      'Choose your action',
      [
        { id: 'option1', label: 'First Option' },
        { id: 'option2', label: 'Second Option' }
      ]
    );
    expect(result.success).toBe(true);
  });

  it('should process CARD_DISCARD effect and call CardService', async () => {
    // Arrange - Create a sample CardDiscardEffect
    const cardDiscardEffect: Effect = {
      effectType: 'CARD_DISCARD',
      payload: {
        playerId: 'player1',
        cardIds: [], // Empty to trigger cardType/count logic
        cardType: 'W',
        count: 1,
        source: 'test',
        reason: 'Unit test'
      }
    };

    const context: EffectContext = {
      source: 'Unit Test',
      playerId: 'player1',
      triggerEvent: 'TEST_EVENT'
    };

    // Mock the getPlayerCards method to return available cards
    mockCardService.getPlayerCards.mockReturnValue(['W_001', 'W_002']);

    // Mock the discardCards method to return success
    mockCardService.discardCards.mockResolvedValue(true);

    // Act - Call processEffect with the sample effect
    const result = await effectEngineService.processEffect(cardDiscardEffect, context);

    // Assert - Verify CardService methods were called with correct parameters
    expect(mockCardService.getPlayerCards).toHaveBeenCalledTimes(1);
    expect(mockCardService.getPlayerCards).toHaveBeenCalledWith('player1', 'W');

    expect(mockCardService.discardCards).toHaveBeenCalledTimes(1);
    expect(mockCardService.discardCards).toHaveBeenCalledWith('player1', ['W_001'], 'test', 'Unit test');

    expect(result.success).toBe(true);
  });

  it('should process EFFECT_GROUP_TARGETED effect and call TargetingService', async () => {
    // Arrange - Create a sample EffectGroupTargeted object
    const effectGroupTargetedEffect: Effect = {
      effectType: 'EFFECT_GROUP_TARGETED',
      payload: {
        targetType: 'ALL_OTHER_PLAYERS',
        templateEffect: {
          effectType: 'RESOURCE_CHANGE',
          payload: {
            playerId: 'PLACEHOLDER', // Will be replaced for each target
            resource: 'MONEY',
            amount: 50,
            source: 'group_effect',
            reason: 'Group bonus'
          }
        },
        prompt: 'Apply bonus to all other players',
        source: 'test'
      }
    };

    const context: EffectContext = {
      source: 'Unit Test',
      playerId: 'player1',
      triggerEvent: 'TEST_EVENT'
    };

    // Mock getAllPlayers to return multiple players
    const mockPlayers = [
      { id: 'player1', name: 'Player 1' },
      { id: 'player2', name: 'Player 2' },
      { id: 'player3', name: 'Player 3' }
    ];
    mockStateService.getAllPlayers.mockReturnValue(mockPlayers);

    // Mock addMoney method to return success for resource changes
    mockResourceService.addMoney.mockReturnValue(true);

    // Act - Call processEffect with the sample effect
    const result = await effectEngineService.processEffect(effectGroupTargetedEffect, context);

    // Assert - Verify getAllPlayers was called to get targets
    expect(mockStateService.getAllPlayers).toHaveBeenCalledTimes(1);

    // Verify addMoney was called for each target player (excluding the source player)
    expect(mockResourceService.addMoney).toHaveBeenCalledTimes(2);
    expect(mockResourceService.addMoney).toHaveBeenCalledWith('player2', 50, 'group_effect', 'Group bonus');
    expect(mockResourceService.addMoney).toHaveBeenCalledWith('player3', 50, 'group_effect', 'Group bonus');

    expect(result.success).toBe(true);
  });

  it('should process CONDITIONAL_EFFECT and execute correct branch', async () => {
    // Arrange - Create a sample ConditionalEffect object with two branches
    const conditionalEffect: Effect = {
      effectType: 'CONDITIONAL_EFFECT',
      payload: {
        playerId: 'player1',
        condition: {
          type: 'DICE_ROLL',
          ranges: [
            {
              min: 1,
              max: 3,
              effects: [{
                effectType: 'RESOURCE_CHANGE',
                payload: {
                  playerId: 'player1',
                  resource: 'MONEY',
                  amount: 100,
                  source: 'low_roll',
                  reason: 'Low dice roll bonus'
                }
              }]
            },
            {
              min: 4,
              max: 6,
              effects: [{
                effectType: 'RESOURCE_CHANGE',
                payload: {
                  playerId: 'player1',
                  resource: 'MONEY',
                  amount: 200,
                  source: 'high_roll',
                  reason: 'High dice roll bonus'
                }
              }]
            }
          ]
        },
        source: 'test',
        reason: 'Unit test'
      }
    };

    const context: EffectContext = {
      source: 'Unit Test',
      playerId: 'player1',
      triggerEvent: 'TEST_EVENT',
      diceRoll: 2 // This should trigger the 1-3 range
    };

    // Mock addMoney method to return success
    mockResourceService.addMoney.mockReturnValue(true);

    // Act - Call processEffect with the sample effect and context
    const result = await effectEngineService.processEffect(conditionalEffect, context);

    // Assert - Verify the low roll effect (1-3 range) was processed
    expect(mockResourceService.addMoney).toHaveBeenCalledTimes(1);
    expect(mockResourceService.addMoney).toHaveBeenCalledWith('player1', 100, 'low_roll', 'Low dice roll bonus');

    // Verify the high roll effect (4-6 range) was NOT processed by checking call count
    expect(mockResourceService.addMoney).not.toHaveBeenCalledWith('player1', 200, 'high_roll', 'High dice roll bonus');

    expect(result.success).toBe(true);
  });
});