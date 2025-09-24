import { ITurnService, IDataService, IStateService, IGameRulesService, ICardService, IResourceService, IEffectEngineService, IMovementService, ILoggingService, IChoiceService, TurnResult } from '../types/ServiceContracts';
import { NegotiationService } from './NegotiationService';
import { INotificationService } from './NotificationService';
import { GameState, Player, DiceResultEffect, TurnEffectResult } from '../types/StateTypes';
import { DiceEffect, SpaceEffect, Movement, CardType, VisitType } from '../types/DataTypes';
import { EffectFactory } from '../utils/EffectFactory';
import { EffectContext } from '../types/EffectTypes';
import { formatManualEffectButton, formatDiceRollFeedback } from '../utils/buttonFormatting';

export class TurnService implements ITurnService {
  private readonly dataService: IDataService;
  private readonly stateService: IStateService;
  private readonly gameRulesService: IGameRulesService;
  private readonly cardService: ICardService;
  private readonly resourceService: IResourceService;
  private readonly movementService: IMovementService;
  private readonly negotiationService: NegotiationService;
  private readonly loggingService: ILoggingService;
  private readonly choiceService: IChoiceService;
  private readonly notificationService?: INotificationService;
  private effectEngineService?: IEffectEngineService;

  constructor(dataService: IDataService, stateService: IStateService, gameRulesService: IGameRulesService, cardService: ICardService, resourceService: IResourceService, movementService: IMovementService, negotiationService: NegotiationService, loggingService: ILoggingService, choiceService: IChoiceService, notificationService?: INotificationService, effectEngineService?: IEffectEngineService) {
    this.dataService = dataService;
    this.stateService = stateService;
    this.gameRulesService = gameRulesService;
    this.cardService = cardService;
    this.resourceService = resourceService;
    this.movementService = movementService;
    this.negotiationService = negotiationService;
    this.loggingService = loggingService;
    this.choiceService = choiceService;
    this.notificationService = notificationService;
    this.effectEngineService = effectEngineService;
  }

  /**
   * Set the EffectEngineService after construction to handle circular dependencies
   */
  public setEffectEngineService(effectEngineService: IEffectEngineService): void {
    this.effectEngineService = effectEngineService;
  }

  /**
   * Generate dynamic card IDs that reference actual cards from the CSV data
   * Format: STATIC_ID_timestamp_random_index
   */
  private generateCardIds(cardType: string, count: number): string[] {
    const cardsOfType = this.dataService.getCardsByType(cardType as any);
    if (cardsOfType.length === 0) {
      console.warn(`No cards of type ${cardType} found in CSV data`);
      return [];
    }

    const cardIds: string[] = [];
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);

    for (let i = 0; i < count; i++) {
      // Randomly select a card from available cards of this type
      const randomCard = cardsOfType[Math.floor(Math.random() * cardsOfType.length)];
      // Create dynamic ID that starts with the static card ID
      const dynamicId = `${randomCard.card_id}_${timestamp}_${randomString}_${i}`;
      cardIds.push(dynamicId);
    }

    return cardIds;
  }

  async takeTurn(playerId: string): Promise<TurnResult> {
    // Turn start is logged in nextPlayer() method
    
    try {
      // Validation: Check if it's the player's turn
      if (!this.canPlayerTakeTurn(playerId)) {
        throw new Error(`It is not player ${playerId}'s turn`);
      }

      // Check if player has already moved this turn
      const gameState = this.stateService.getGameState();
      // State validation check
      if (gameState.hasPlayerMovedThisTurn) {
        console.warn(`🎮 TurnService.takeTurn - Player ${playerId} has already moved, clearing flag and continuing (AI turn recovery)`);
        this.stateService.clearPlayerHasMoved();
      }

      // Get current player data
      const currentPlayer = this.stateService.getPlayer(playerId);
      if (!currentPlayer) {
        throw new Error(`Player ${playerId} not found`);
      }

      // Player position logged in turn start/end

      // Roll dice
      const diceRoll = this.rollDice();
      
      // Log dice roll to action history
      this.loggingService.info(`Rolled a ${diceRoll}`, {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        action: 'rollDice',
        roll: diceRoll,
        space: currentPlayer.currentSpace
      });

      // Process turn effects based on dice roll
      console.log(`🎮 TurnService.takeTurn - Processing turn effects...`);
      await this.processTurnEffects(playerId, diceRoll);

      // Process leaving space effects BEFORE movement (time spent on current space)
      console.log(`🚪 Processing leaving space effects for ${currentPlayer.name} leaving ${currentPlayer.currentSpace}`);
      await this.processLeavingSpaceEffects(currentPlayer.id, currentPlayer.currentSpace, currentPlayer.visitType);

      // Handle movement based on current space
      console.log(`🎮 TurnService.takeTurn - Handling movement...`);
      await this.movementService.handleMovementChoiceV2(playerId);
      const newGameState = this.stateService.getGameState();

      // Mark that the player has moved this turn
      console.log(`🎮 TurnService.takeTurn - Marking player as moved`);
      this.stateService.setPlayerHasMoved();

      console.log(`🎮 TurnService.takeTurn - Turn completed successfully`);
      return {
        newState: newGameState,
        diceRoll: diceRoll
      };
    } catch (error) {
      console.error(`🎮 TurnService.takeTurn - Error during turn:`, error);
      throw error;
    }
  }

  /**
   * Roll dice and process effects only (no movement)
   * This is for the "Roll Dice" button
   */
  async rollDiceAndProcessEffects(playerId: string): Promise<{ diceRoll: number }> {
    // Dice action start
    
    try {
      // Validation: Check if it's the player's turn
      if (!this.canPlayerTakeTurn(playerId)) {
        throw new Error(`It is not player ${playerId}'s turn`);
      }

      // Check if player has already moved this turn
      const gameState = this.stateService.getGameState();
      if (gameState.hasPlayerMovedThisTurn) {
        throw new Error(`Player ${playerId} has already moved this turn`);
      }

      // Get current player data
      const currentPlayer = this.stateService.getPlayer(playerId);
      if (!currentPlayer) {
        throw new Error(`Player ${playerId} not found`);
      }

      // Player position for dice roll

      // Roll dice
      const diceRoll = this.rollDice();
      
      // Log dice roll to action history
      this.loggingService.info(`Rolled a ${diceRoll}`, {
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        action: 'rollDice',
        roll: diceRoll,
        space: currentPlayer.currentSpace
      });

      // Process turn effects based on dice roll (but NO movement)
      console.log(`🎲 TurnService.rollDiceAndProcessEffects - Processing turn effects...`);
      await this.processTurnEffects(playerId, diceRoll);

      // Mark that the player has rolled dice this turn (enables End Turn button)
      console.log(`🎲 TurnService.rollDiceAndProcessEffects - Marking dice as rolled`);
      this.stateService.setPlayerHasRolledDice();

      // Mark that the player has taken an action (increments action counter)
      console.log(`🎲 TurnService.rollDiceAndProcessEffects - Marking player action taken`);
      this.stateService.setPlayerHasMoved();

      // Dice roll processing complete
      return { diceRoll };
    } catch (error) {
      console.error(`🎲 TurnService.rollDiceAndProcessEffects - Error:`, error);
      throw error;
    }
  }

  /**
   * Handle movement and advance to next player
   * This is for the "End Turn" button
   */
  async endTurnWithMovement(): Promise<{ nextPlayerId: string }> {
    console.log(`🏁 TurnService.endTurnWithMovement - Starting`);
    
    try {
      const gameState = this.stateService.getGameState();
      
      // Validation: Game must be in PLAY phase
      if (gameState.gamePhase !== 'PLAY') {
        throw new Error('Cannot end turn outside of PLAY phase');
      }

      // Validation: Must have a current player
      if (!gameState.currentPlayerId) {
        throw new Error('No current player to end turn for');
      }

      // Get current player
      const currentPlayer = this.stateService.getPlayer(gameState.currentPlayerId);
      if (!currentPlayer) {
        throw new Error('Current player not found');
      }

      // Validation: Check if all required actions are completed
      if (gameState.requiredActions > gameState.completedActionCount) {
        throw new Error(`Cannot end turn: Player has not completed all required actions. Required: ${gameState.requiredActions}, Completed: ${gameState.completedActionCount}`);
      }

      console.log(`🏁 TurnService.endTurnWithMovement - Moving player ${currentPlayer.name} from ${currentPlayer.currentSpace}`);

      // Check if there's already an awaiting choice
      if (gameState.awaitingChoice && gameState.awaitingChoice.type === 'MOVEMENT') {
        throw new Error('Cannot end turn: Player must resolve the pending movement choice first');
      }

      // Process leaving space effects BEFORE movement (time spent on current space)
      console.log(`🚪 Processing leaving space effects for ${currentPlayer.name} leaving ${currentPlayer.currentSpace}`);
      await this.processLeavingSpaceEffects(currentPlayer.id, currentPlayer.currentSpace, currentPlayer.visitType);

      // Handle single-step movement (no choices)
      const validMoves = this.movementService.getValidMoves(currentPlayer.id);
      if (validMoves.length === 1) {
        // Only one move available - perform automatic movement
        console.log(`🚶 Auto-moving player ${currentPlayer.name} to ${validMoves[0]} (end-of-turn move)`);
        await this.movementService.movePlayer(currentPlayer.id, validMoves[0]);

        // Process space effects for the NEW space the player just moved to
        const updatedPlayer = this.stateService.getPlayer(currentPlayer.id);
        if (updatedPlayer && updatedPlayer.currentSpace !== currentPlayer.currentSpace) {
          console.log(`🏠 Processing space effects for arrival at ${updatedPlayer.currentSpace}`);
          await this.processSpaceEffectsAfterMovement(updatedPlayer.id, updatedPlayer.currentSpace, updatedPlayer.visitType);

          // Save snapshot for Try Again feature after space effects are processed
          this.stateService.savePreSpaceEffectSnapshot(updatedPlayer.id, updatedPlayer.currentSpace);
          console.log(`📸 Saved Try Again snapshot for ${updatedPlayer.name} at ${updatedPlayer.currentSpace} after space effects`);
        }
      }

      // Check for win condition before ending turn
      const hasWon = await this.gameRulesService.checkWinCondition(gameState.currentPlayerId);
      if (hasWon) {
        // Player has won - end the game
        this.stateService.endGame(gameState.currentPlayerId);
        return { nextPlayerId: gameState.currentPlayerId }; // Winner remains current player
      }

      // Advance to next player
      const nextPlayerResult = await this.nextPlayer();
      console.log(`🏁 TurnService.endTurnWithMovement - Advanced to next player: ${nextPlayerResult.nextPlayerId}`);
      
      return nextPlayerResult;
    } catch (error) {
      console.error(`🏁 TurnService.endTurnWithMovement - Error:`, error);
      throw error;
    }
  }

  async endTurn(): Promise<{ nextPlayerId: string }> {
    const gameState = this.stateService.getGameState();
    
    // Validation: Game must be in PLAY phase
    if (gameState.gamePhase !== 'PLAY') {
      throw new Error('Cannot end turn outside of PLAY phase');
    }

    // Validation: Must have a current player
    if (!gameState.currentPlayerId) {
      throw new Error('No current player to end turn for');
    }

    // Check for game end conditions (win or turn limit) before ending turn
    const endConditions = await this.gameRulesService.checkGameEndConditions(gameState.currentPlayerId);
    if (endConditions.shouldEnd) {
      let winnerId: string | null = null;
      
      if (endConditions.reason === 'win' && endConditions.winnerId) {
        // Player won by reaching ending space
        winnerId = endConditions.winnerId;
        // Log game end victory
        this.loggingService.info('Won the game by reaching the ending space!', {
          playerId: winnerId,
          playerName: this.stateService.getPlayer(winnerId)?.name || 'Unknown',
          action: 'gameEnd',
          winCondition: 'space_victory',
          finalSpace: this.stateService.getPlayer(winnerId)?.currentSpace
        });
      } else if (endConditions.reason === 'turn_limit') {
        // Game ended due to turn limit - determine winner by score
        winnerId = this.gameRulesService.determineWinner();
        // Log game end by turn limit
        this.loggingService.info(`Game ended: Turn limit reached. Winner determined by score.`, {
          playerId: winnerId || gameState.currentPlayerId,
          playerName: this.stateService.getPlayer(winnerId || gameState.currentPlayerId)?.name || 'Unknown',
          action: 'gameEnd',
          winCondition: 'turn_limit',
          finalTurn: gameState.turn
        });
      }
      
      // End the game with the determined winner
      this.stateService.endGame(winnerId || gameState.currentPlayerId);
      return { nextPlayerId: winnerId || gameState.currentPlayerId };
    }

    // Use the common nextPlayer method
    return await this.nextPlayer();
  }

  private async nextPlayer(): Promise<{ nextPlayerId: string }> {
    const gameState = this.stateService.getGameState();
    const allPlayers = gameState.players;
    
    if (allPlayers.length === 0) {
      throw new Error('No players in the game');
    }

    // Find the current player index
    const currentPlayerIndex = allPlayers.findIndex(p => p.id === gameState.currentPlayerId);
    if (currentPlayerIndex === -1) {
      throw new Error('Current player not found in player list');
    }

    // Process card expirations before ending turn
    // Processing card expirations
    this.cardService.endOfTurn();

    // Process active effects for all players at turn end
    console.log(`🕒 Processing active effects for all players at end of turn ${gameState.turn}`);
    if (this.effectEngineService) {
      await this.effectEngineService.processActiveEffectsForAllPlayers();
    }

    // Reset re-roll flag for the current player ending their turn
    const currentPlayer = allPlayers[currentPlayerIndex];
    if (currentPlayer.turnModifiers?.canReRoll) {
      // Re-roll flag reset
      this.stateService.updatePlayer({
        id: currentPlayer.id,
        turnModifiers: {
          ...currentPlayer.turnModifiers,
          canReRoll: false
        }
      });
    }

    // Log turn end for current player
    this.loggingService.info(`Turn ${gameState.turn} ended`, {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      action: 'endTurn',
      turn: gameState.turn,
      space: currentPlayer.currentSpace
    });

    // Apply loan interest for the player ending their turn
    // Applying loan interest
    this.resourceService.applyInterest(currentPlayer.id);

    // Determine next player (wrap around to first player if at end)
    let nextPlayerIndex = (currentPlayerIndex + 1) % allPlayers.length;
    let nextPlayer = allPlayers[nextPlayerIndex];

    // Check if the next player has turn modifiers (turn skips)
    const turnModifiers = nextPlayer.turnModifiers;
    if (turnModifiers && turnModifiers.skipTurns > 0) {
      // Log turn skip
      this.loggingService.info(`Turn skipped (${turnModifiers.skipTurns} remaining)`, {
        playerId: nextPlayer.id,
        playerName: nextPlayer.name,
        action: 'skipTurn',
        skipCount: turnModifiers.skipTurns,
        reason: 'effect_modifier'
      });
      
      // Decrement skip count
      const newModifiers = { ...turnModifiers, skipTurns: turnModifiers.skipTurns - 1 };
      this.stateService.updatePlayer({ id: nextPlayer.id, turnModifiers: newModifiers });
      
      // If no more skips remaining, clean up
      if (newModifiers.skipTurns <= 0) {
        const restoredModifiers = { ...newModifiers, skipTurns: 0 };
        this.stateService.updatePlayer({ id: nextPlayer.id, turnModifiers: restoredModifiers });
        // Skip turns cleared
      }
      
      // Recursively call nextPlayer to skip to the following player
      // But first update current player to the skipped player so the recursion works correctly
      this.stateService.setCurrentPlayer(nextPlayer.id);
      // Advancing to next player
      
      return await this.nextPlayer();
    }

    // Update the current player in the game state
    this.stateService.setCurrentPlayer(nextPlayer.id);

    // Advance turn counter and reset turn flags
    this.stateService.advanceTurn();
    this.stateService.clearPlayerHasMoved();
    this.stateService.clearPlayerHasRolledDice();
    this.stateService.clearTurnActions();

    // Send End Turn notification for the previous player AFTER all state changes are complete
    if (this.notificationService) {
      const prevGameState = this.stateService.getGameState();
      const turnNumber = prevGameState.turn - 1; // Previous turn that just ended
      this.notificationService.notify(
        {
          short: 'Turn Ended',
          medium: `🏁 Turn ${turnNumber} ended`,
          detailed: `${currentPlayer.name} ended Turn ${turnNumber} at ${currentPlayer.currentSpace}`
        },
        {
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          actionType: 'endTurn',
          notificationDuration: 3000
        }
      );
    }

    // Log turn start for new player
    const newGameState = this.stateService.getGameState();
    this.loggingService.info(`Turn ${newGameState.turn} started`, {
      playerId: nextPlayer.id,
      playerName: nextPlayer.name,
      action: 'startTurn',
      turn: newGameState.turn,
      space: nextPlayer.currentSpace
    });

    // Start-of-turn logic: Check for movement choices
    await this.startTurn(nextPlayer.id);

    return { nextPlayerId: nextPlayer.id };
  }

  /**
   * Handles the start-of-turn logic, including checking for movement choices
   * @private
   */
  private async startTurn(playerId: string): Promise<void> {
    console.log(`🎬 TurnService.startTurn - Starting turn logic for player ${playerId}`);

    try {
      // Check if the player's current space requires a movement choice
      const validMoves = this.movementService.getValidMoves(playerId);

      // Defensive check - ensure validMoves is an array
      if (!validMoves || !Array.isArray(validMoves)) {
        console.log(`🎬 TurnService.startTurn - No valid moves data available for player ${playerId}`);
        return;
      }

      if (validMoves.length > 1) {
        // Multiple moves available - present choice to player
        const player = this.stateService.getPlayer(playerId);
        const playerName = player?.name || 'Unknown Player';
        console.log(`🎯 Player ${playerName} is at a choice space with ${validMoves.length} options - creating movement choice`);

        // This will create the choice and wait for player input
        await this.movementService.handleMovementChoiceV2(playerId);
      } else {
        // 0 or 1 moves - no choice needed, turn proceeds normally
        console.log(`🎬 TurnService.startTurn - No choice needed (${validMoves.length} valid moves)`);
      }
    } catch (error) {
      // If movement service fails, log but don't crash the turn
      console.warn(`🎬 TurnService.startTurn - Error checking for movement choices:`, error);
    }
  }

  rollDice(): number {
    const roll = Math.floor(Math.random() * 6) + 1;
    
    // Safety check - dice should never be 0 or greater than 6
    if (roll < 1 || roll > 6) {
      console.error(`Invalid dice roll generated: ${roll}. Rolling again.`);
      return Math.floor(Math.random() * 6) + 1;
    }
    
    return roll;
  }

  canPlayerTakeTurn(playerId: string): boolean {
    const gameState = this.stateService.getGameState();
    
    // Game must be in PLAY phase
    if (gameState.gamePhase !== 'PLAY') {
      return false;
    }

    // Must be the current player's turn
    if (gameState.currentPlayerId !== playerId) {
      return false;
    }

    // Player must exist
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return false;
    }

    return true;
  }

  getCurrentPlayerTurn(): string | null {
    const gameState = this.stateService.getGameState();
    return gameState.currentPlayerId;
  }

  async processTurnEffects(playerId: string, diceRoll: number): Promise<GameState> {
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`🎯 Processing turn effects for ${currentPlayer.name} on ${currentPlayer.currentSpace} (${currentPlayer.visitType} visit)`);

    try {
      // Get space effect data from DataService
      const spaceEffectsData = this.dataService.getSpaceEffects(
        currentPlayer.currentSpace, 
        currentPlayer.visitType
      );
      
      // Filter space effects based on conditions (e.g., scope_le_4M, scope_gt_4M)
      const conditionFilteredEffects = this.filterSpaceEffectsByCondition(spaceEffectsData, currentPlayer);

      // Filter out manual effects and time effects - manual effects are triggered by buttons, time effects on leaving space
      const filteredSpaceEffects = conditionFilteredEffects.filter(effect =>
        effect.trigger_type !== 'manual' && effect.effect_type !== 'time'
      );
      
      // Get dice effect data from DataService  
      const diceEffectsData = this.dataService.getDiceEffects(
        currentPlayer.currentSpace, 
        currentPlayer.visitType
      );
      
      // Get space configuration for action processing
      const spaceConfig = this.dataService.getGameConfigBySpace(currentPlayer.currentSpace);
      
      // Generate all effects from space entry using EffectFactory
      const spaceEffects = EffectFactory.createEffectsFromSpaceEntry(
        filteredSpaceEffects,
        playerId,
        currentPlayer.currentSpace,
        currentPlayer.visitType,
        spaceConfig || undefined
      );
      
      // Generate all effects from dice roll using EffectFactory
      const diceEffects = EffectFactory.createEffectsFromDiceRoll(
        diceEffectsData,
        playerId,
        currentPlayer.currentSpace,
        diceRoll
      );
      
      // Add user messaging for OWNER-FUND-INITIATION space
      if (currentPlayer.currentSpace === 'OWNER-FUND-INITIATION') {
        console.log(`💰 Adding user messaging for OWNER-FUND-INITIATION space`);
        spaceEffects.push({
          effectType: 'LOG',
          payload: {
            message: `Reviewing project scope for funding level...`,
            level: 'INFO',
            source: `space:${currentPlayer.currentSpace}:${currentPlayer.visitType}`
          }
        });
      }

      // Combine all effects for unified processing
      const allEffects = [...spaceEffects, ...diceEffects];
      
      console.log(`🏭 Generated ${spaceEffects.length} space effects + ${diceEffects.length} dice effects = ${allEffects.length} total effects`);
      
      if (allEffects.length > 0) {
        if (!this.effectEngineService) {
          console.error(`❌ EffectEngineService not available - cannot process ${allEffects.length} effects`);
          throw new Error('EffectEngineService not initialized - effects cannot be processed');
        }
        
        // Create effect processing context
        const effectContext: EffectContext = {
          source: 'turn_effects:space_entry',
          playerId: playerId,
          triggerEvent: 'SPACE_ENTRY',
          metadata: {
            spaceName: currentPlayer.currentSpace,
            visitType: currentPlayer.visitType,
            diceRoll: diceRoll,
            playerName: currentPlayer.name
          }
        };
        
        // Process all effects through the unified Effect Engine
        console.log(`🔧 Processing ${allEffects.length} space/dice effects through Effect Engine...`);
        const processingResult = await this.effectEngineService.processEffects(allEffects, effectContext);
        
        if (!processingResult.success) {
          console.error(`❌ Failed to process some space/dice effects: ${processingResult.errors.join(', ')}`);
          // Log errors but don't throw - some effects may have succeeded
        } else {
          console.log(`✅ All space/dice effects processed successfully: ${processingResult.successfulEffects}/${processingResult.totalEffects} effects completed`);
        }
      } else {
        console.log(`ℹ️ No space or dice effects to process for ${currentPlayer.currentSpace}`);
      }
      
      return this.stateService.getGameState();
      
    } catch (error) {
      console.error(`❌ Error processing turn effects:`, error);
      throw new Error(`Failed to process turn effects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process ONLY dice effects (not space effects) for a dice roll
   */
  async processDiceRollEffects(playerId: string, diceRoll: number): Promise<GameState> {
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`🎲 Processing dice roll effects for ${currentPlayer.name} on ${currentPlayer.currentSpace} (rolled ${diceRoll})`);

    try {
      // Get ONLY dice effect data from DataService  
      const diceEffectsData = this.dataService.getDiceEffects(
        currentPlayer.currentSpace, 
        currentPlayer.visitType
      );
      
      if (diceEffectsData.length === 0) {
        console.log(`ℹ️ No dice effects to process for ${currentPlayer.currentSpace}`);
        return this.stateService.getGameState();
      }
      
      // Generate ONLY effects from dice roll using EffectFactory
      const diceEffects = EffectFactory.createEffectsFromDiceRoll(
        diceEffectsData,
        playerId,
        currentPlayer.currentSpace,
        diceRoll
      );
      
      console.log(`🎲 Generated ${diceEffects.length} dice effects from roll ${diceRoll}`);
      
      if (diceEffects.length > 0) {
        if (!this.effectEngineService) {
          console.error(`❌ EffectEngineService not available - cannot process ${diceEffects.length} dice effects`);
          throw new Error('EffectEngineService not initialized - dice effects cannot be processed');
        }
        
        // Create effect processing context for dice effects only
        const effectContext: EffectContext = {
          source: 'dice_roll',
          playerId: playerId,
          triggerEvent: 'DICE_ROLL',
          metadata: {
            spaceName: currentPlayer.currentSpace,
            visitType: currentPlayer.visitType,
            diceRoll: diceRoll,
            playerName: currentPlayer.name
          }
        };
        
        // Process ONLY dice effects through the Effect Engine
        console.log(`🔧 Processing ${diceEffects.length} dice effects through Effect Engine...`);
        const processingResult = await this.effectEngineService.processEffects(diceEffects, effectContext);
        
        if (!processingResult.success) {
          console.error(`❌ Failed to process some dice effects: ${processingResult.errors.join(', ')}`);
          // Log errors but don't throw - some effects may have succeeded
        } else {
          console.log(`✅ All dice effects processed successfully: ${processingResult.successfulEffects}/${processingResult.totalEffects} effects completed`);
        }
      }

      return this.stateService.getGameState();
    } catch (error) {
      console.error(`❌ Error processing dice effects for ${currentPlayer.name}:`, error);
      throw error;
    }
  }

  private applySpaceEffect(
    playerId: string, 
    effect: SpaceEffect, 
    currentState: GameState
  ): GameState {
    // Apply effect based on type
    switch (effect.effect_type) {
      case 'cards':
        return this.applySpaceCardEffect(playerId, effect);
      
      case 'money':
        return this.applySpaceMoneyEffect(playerId, effect);
      
      case 'time':
        return this.applySpaceTimeEffect(playerId, effect);
      
      default:
        console.warn(`Unknown space effect type: ${effect.effect_type}`);
        return currentState;
    }
  }

  private applyDiceEffect(
    playerId: string, 
    effect: DiceEffect, 
    diceRoll: number, 
    currentState: GameState
  ): GameState {
    // Get the effect for the specific dice roll
    const rollEffect = this.getDiceRollEffect(effect, diceRoll);
    
    if (!rollEffect || rollEffect === 'No change') {
      return currentState;
    }

    // Apply effect based on type
    switch (effect.effect_type) {
      case 'cards':
        return this.applyCardEffect(playerId, effect.card_type || 'W', rollEffect);
      
      case 'money':
        return this.applyMoneyEffect(playerId, rollEffect);
      
      case 'time':
        return this.applyTimeEffect(playerId, rollEffect);
      
      case 'quality':
        return this.applyQualityEffect(playerId, rollEffect);
      
      default:
        console.warn(`Unknown effect type: ${effect.effect_type}`);
        return currentState;
    }
  }

  private getDiceRollEffect(effect: DiceEffect, diceRoll: number): string | undefined {
    switch (diceRoll) {
      case 1: return effect.roll_1;
      case 2: return effect.roll_2;
      case 3: return effect.roll_3;
      case 4: return effect.roll_4;
      case 5: return effect.roll_5;
      case 6: return effect.roll_6;
      default: return undefined;
    }
  }

  private applyCardEffect(playerId: string, cardType: string, effect: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (effect.includes('Draw')) {
      const drawCount = this.parseNumericValue(effect);
      if (drawCount > 0) {
        // Use unified CardService.drawCards with source tracking
        const drawnCardIds = this.cardService.drawCards(
          playerId, 
          cardType as any, 
          drawCount, 
          'turn_effect', 
          `Draw ${drawCount} ${cardType} card${drawCount > 1 ? 's' : ''} from space effect`
        );
        console.log(`Player ${player.name} draws ${drawCount} ${cardType} cards:`, drawnCardIds);
      }
    } else if (effect.includes('Remove') || effect.includes('Discard')) {
      const removeCount = this.parseNumericValue(effect);
      if (removeCount > 0) {
        const currentCards = this.cardService.getPlayerCards(playerId, cardType as CardType);
        const cardsToRemove = currentCards.slice(0, removeCount);
        if (cardsToRemove.length > 0) {
          // Use unified CardService.discardCards with source tracking
          this.cardService.discardCards(
            playerId,
            cardsToRemove,
            'turn_effect',
            `Remove ${removeCount} ${cardType} card${removeCount > 1 ? 's' : ''} from space effect`
          );
        }
      }
    } else if (effect.includes('Replace')) {
      const replaceCount = this.parseNumericValue(effect);
      const currentCards = this.cardService.getPlayerCards(playerId, cardType as CardType);
      if (replaceCount > 0 && currentCards.length > 0) {
        // Remove old cards using discardCards
        const cardsToRemove = currentCards.slice(0, replaceCount);
        this.cardService.discardCards(
          playerId,
          cardsToRemove,
          'turn_effect',
          `Replace ${replaceCount} ${cardType} cards - removing old cards`
        );
        
        // Add new cards using drawCards
        const drawnCardIds = this.cardService.drawCards(
          playerId,
          cardType as any,
          replaceCount,
          'turn_effect',
          `Replace ${replaceCount} ${cardType} cards - adding new cards`
        );
        console.log(`Player ${player.name} replaces ${replaceCount} ${cardType} cards:`, drawnCardIds);
      }
    }

    // Return current state since CardService methods handle state updates
    return this.stateService.getGameState();
  }

  private applyMoneyEffect(playerId: string, effect: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    let moneyChange = 0;

    if (effect.includes('%')) {
      // Percentage-based effect
      const percentage = this.parseNumericValue(effect);
      moneyChange = Math.floor((player.money * percentage) / 100);
    } else {
      // Fixed amount effect
      moneyChange = this.parseNumericValue(effect);
    }

    // Use unified ResourceService for money changes
    if (moneyChange > 0) {
      this.resourceService.addMoney(playerId, moneyChange, 'turn_effect', `Space effect: +$${moneyChange.toLocaleString()}`);
    } else if (moneyChange < 0) {
      this.resourceService.spendMoney(playerId, Math.abs(moneyChange), 'turn_effect', `Space effect: -$${Math.abs(moneyChange).toLocaleString()}`);
    }

    // Return current state since ResourceService handles state updates
    return this.stateService.getGameState();
  }

  private applyTimeEffect(playerId: string, effect: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const timeChange = this.parseNumericValue(effect);

    // Use unified ResourceService for time changes
    if (timeChange > 0) {
      this.resourceService.addTime(playerId, timeChange, 'turn_effect', `Space effect: +${timeChange} time`);
    } else if (timeChange < 0) {
      this.resourceService.spendTime(playerId, Math.abs(timeChange), 'turn_effect', `Space effect: -${Math.abs(timeChange)} time`);
    }

    // Return current state since ResourceService handles state updates
    return this.stateService.getGameState();
  }

  private applyQualityEffect(playerId: string, effect: string): GameState {
    // Quality effects might affect other game state in the future
    // For now, just log the quality level
    console.log(`Player ${playerId} quality level: ${effect}`);
    return this.stateService.getGameState();
  }

  private applySpaceCardEffect(playerId: string, effect: SpaceEffect): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Parse the effect action and value
    const action = effect.effect_action; // e.g., "draw_w", "add", etc.
    const value = typeof effect.effect_value === 'string' ? 
      parseInt(effect.effect_value) : effect.effect_value;

    if (action === 'draw_w') {
      // Use CardService for W card draws (includes action logging)
      this.cardService.drawCards(
        playerId, 
        'W', 
        value, 
        'manual_effect', 
        `Manual action: Draw ${value} W card${value !== 1 ? 's' : ''}`
      );
      return this.stateService.getGameState();
    } else if (action === 'draw_b') {
      // Use CardService for B card draws (includes action logging)
      this.cardService.drawCards(
        playerId, 
        'B', 
        value, 
        'manual_effect', 
        `Manual action: Draw ${value} B card${value !== 1 ? 's' : ''}`
      );
      return this.stateService.getGameState();
    } else if (action === 'draw_e') {
      // Use CardService for E card draws (includes action logging)
      this.cardService.drawCards(
        playerId, 
        'E', 
        value, 
        'manual_effect', 
        `Manual action: Draw ${value} E card${value !== 1 ? 's' : ''}`
      );
      return this.stateService.getGameState();
    } else if (action === 'draw_l') {
      // Use CardService for L card draws (includes action logging)
      this.cardService.drawCards(
        playerId, 
        'L', 
        value, 
        'manual_effect', 
        `Manual action: Draw ${value} L card${value !== 1 ? 's' : ''}`
      );
      return this.stateService.getGameState();
    } else if (action === 'draw_i') {
      // Use CardService for I card draws (includes action logging)
      this.cardService.drawCards(
        playerId, 
        'I', 
        value, 
        'manual_effect', 
        `Manual action: Draw ${value} I card${value !== 1 ? 's' : ''}`
      );
      return this.stateService.getGameState();
    } else if (action === 'replace_e') {
      // Replace E cards - create choice if player has multiple E cards
      const currentECards = this.cardService.getPlayerCards(playerId, 'E');
      const replaceCount = Math.min(value, currentECards.length);

      if (replaceCount === 0) {
        console.log(`Player ${player.name} has no E cards to replace`);
        return this.stateService.getGameState();
      }

      if (currentECards.length === 1 || replaceCount === currentECards.length) {
        // Only one card or replacing all cards - no choice needed
        this.cardService.discardCards(
          playerId,
          currentECards.slice(0, replaceCount),
          'manual_effect',
          `Manual action: Replace ${replaceCount} E cards - removing old cards`
        );

        this.cardService.drawCards(
          playerId,
          'E',
          replaceCount,
          'manual_effect',
          `Manual action: Replace ${replaceCount} E cards - adding new cards`
        );
      } else {
        // Multiple cards available - create choice for which to replace
        console.log(`Player ${player.name} has ${currentECards.length} E cards, creating choice for replacement`);

        // Create choice options for each E card
        const options = currentECards.map(cardId => {
          const cardData = this.dataService.getCardById(cardId);
          return {
            id: cardId,
            label: cardData ? cardData.card_name : `E Card ${cardId}`
          };
        });

        // Use ChoiceService to create the choice
        this.choiceService.createChoice(
          playerId,
          'CARD_REPLACEMENT',
          `Choose ${replaceCount} E card${replaceCount !== 1 ? 's' : ''} to replace:`,
          options
        );

        // Note: The actual replacement will be handled by choice resolution
        // For now, we'll mark it as completed to allow turn progression
      }

      return this.stateService.getGameState();
    } else if (action === 'replace_l') {
      // Replace L cards using CardService (includes action logging)
      const currentLCards = this.cardService.getPlayerCards(playerId, 'L');
      const replaceCount = Math.min(value, currentLCards.length);
      
      if (replaceCount > 0) {
        // Use CardService for replacement (discard old + draw new)
        this.cardService.discardCards(
          playerId,
          currentLCards.slice(0, replaceCount),
          'manual_effect',
          `Manual action: Replace ${replaceCount} L cards - removing old cards`
        );
        this.cardService.drawCards(
          playerId, 
          'L', 
          replaceCount, 
          'manual_effect', 
          `Manual action: Replace ${replaceCount} L cards - adding new cards`
        );
      } else {
        console.log(`Player ${player.name} has no L cards to replace`);
      }
      
      return this.stateService.getGameState();
    } else if (action === 'return_e') {
      // Return E cards using CardService (includes action logging)
      const currentECards = this.cardService.getPlayerCards(playerId, 'E');
      const returnCount = Math.min(value, currentECards.length);
      
      if (returnCount > 0) {
        this.cardService.discardCards(
          playerId,
          currentECards.slice(0, returnCount),
          'manual_effect',
          `Manual action: Return ${returnCount} E cards`
        );
      } else {
        console.log(`Player ${player.name} has no E cards to return`);
      }
      
      return this.stateService.getGameState();
    } else if (action === 'return_l') {
      // Return L cards using CardService (includes action logging)
      const currentLCards = this.cardService.getPlayerCards(playerId, 'L');
      const returnCount = Math.min(value, currentLCards.length);
      
      if (returnCount > 0) {
        this.cardService.discardCards(
          playerId,
          currentLCards.slice(0, returnCount),
          'manual_effect',
          `Manual action: Return ${returnCount} L cards`
        );
      } else {
        console.log(`Player ${player.name} has no L cards to return`);
      }
      
      return this.stateService.getGameState();
    } else if (action === 'transfer') {
      // Transfer cards to another player
      const targetPlayer = this.getTargetPlayer(playerId, effect.condition);
      
      if (!targetPlayer) {
        console.log(`Player ${player.name} could not transfer cards - no target player found`);
        return this.stateService.getGameState();
      }

      // Transfer a card from player's hand to target
      // Priority order: W, B, E, L, I (transfer most valuable first)
      const cardTypes: CardType[] = ['W', 'B', 'E', 'L', 'I'];
      let transferredCard: string | null = null;

      for (const cardType of cardTypes) {
        const playerCards = this.cardService.getPlayerCards(playerId, cardType);
        if (playerCards.length > 0) {
          transferredCard = playerCards[0];
          break;
        }
      }

      if (transferredCard) {
        // Use CardService for transfer (includes action logging)
        this.cardService.transferCard(
          playerId,
          targetPlayer.id,
          transferredCard,
          'manual_effect',
          'Manual action: Transfer card'
        );
        console.log(`Player ${player.name} transfers card ${transferredCard} to ${targetPlayer.name}`);
      } else {
        console.log(`Player ${player.name} has no cards to transfer`);
      }

      return this.stateService.getGameState();
    }
    
    return this.stateService.getGameState();
  }

  private applySpaceMoneyEffect(playerId: string, effect: SpaceEffect): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const value = typeof effect.effect_value === 'string' ? 
      parseInt(effect.effect_value) : effect.effect_value;
    
    let newMoney = player.money;
    
    if (effect.effect_action === 'add') {
      newMoney += value;
    } else if (effect.effect_action === 'subtract') {
      newMoney -= value;
    } else if (effect.effect_action === 'fee_percent') {
      // Apply percentage-based fee
      const feeAmount = Math.floor((player.money * value) / 100);
      newMoney -= feeAmount;
      console.log(`Player ${player.name} pays ${value}% fee (${feeAmount}) based on condition: ${effect.condition}`);
    } else if (effect.effect_action === 'add_per_amount') {
      // This is typically used with money - add money based on some calculation
      // For now, implement a basic version - can be enhanced based on condition parsing
      const additionalAmount = value; // Placeholder logic
      newMoney += additionalAmount;
      console.log(`Player ${player.name} gains ${additionalAmount} per amount based on condition: ${effect.condition}`);
    }
    
    newMoney = Math.max(0, newMoney); // Ensure money doesn't go below 0

    console.log(`Player ${player.name} money change: ${effect.effect_action} ${value}, new total: ${newMoney}`);

    return this.stateService.updatePlayer({
      id: playerId,
      money: newMoney
    });
  }

  private applySpaceTimeEffect(playerId: string, effect: SpaceEffect): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const value = typeof effect.effect_value === 'string' ? 
      parseInt(effect.effect_value) : effect.effect_value;
    
    let newTime = player.timeSpent || 0;
    
    if (effect.effect_action === 'add') {
      newTime += value;
    } else if (effect.effect_action === 'subtract') {
      newTime -= value;
    } else if (effect.effect_action === 'add_per_amount') {
      // Add time based on some calculation (e.g., per $200K borrowed)
      // For now, implement basic version - can be enhanced based on condition parsing
      const additionalTime = value; // Placeholder logic
      newTime += additionalTime;
      console.log(`Player ${player.name} gains ${additionalTime} time per amount based on condition: ${effect.condition}`);
    }
    
    newTime = Math.max(0, newTime); // Ensure time doesn't go below 0

    console.log(`Player ${player.name} time change: ${effect.effect_action} ${value}, new total: ${newTime}`);

    return this.stateService.updatePlayer({
      id: playerId,
      timeSpent: newTime
    });
  }

  private getTargetPlayer(currentPlayerId: string, condition: string): Player | null {
    const gameState = this.stateService.getGameState();
    const players = gameState.players;
    const currentPlayerIndex = players.findIndex(p => p.id === currentPlayerId);
    
    if (currentPlayerIndex === -1) {
      return null;
    }

    if (condition === 'to_right') {
      // Get player to the right (next in turn order)
      const targetIndex = (currentPlayerIndex + 1) % players.length;
      return players[targetIndex];
    } else if (condition === 'to_left') {
      // Get player to the left (previous in turn order)  
      const targetIndex = (currentPlayerIndex - 1 + players.length) % players.length;
      return players[targetIndex];
    }
    
    // Unknown condition
    console.warn(`Unknown transfer condition: ${condition}`);
    return null;
  }

  private parseNumericValue(effect: string): number {
    // Extract numeric value from effect string (including negatives)
    const matches = effect.match(/(-?\d+)/);
    if (matches) {
      return parseInt(matches[1], 10);
    }
    
    // Handle special cases
    if (effect.toLowerCase().includes('many')) {
      return 3; // Default "many" to 3
    }
    
    return 0;
  }

  /**
   * Apply dice roll chance effects (like "draw_l_on_1" - draw a card if dice roll is 1)
   */
  private applyDiceRollChanceEffect(playerId: string, effect: SpaceEffect): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`🎲 Applying dice roll chance effect: ${effect.effect_action} for ${player.name}`);

    // Roll a dice (1-6)
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    console.log(`🎲 Dice rolled: ${diceRoll}`);

    // Parse the effect action to understand the condition
    // Format: "draw_l_on_1" means draw L card if roll is 1
    const actionParts = effect.effect_action.split('_');
    if (actionParts.length >= 3 && actionParts[0] === 'draw') {
      const cardType = actionParts[1].toUpperCase() as CardType;
      const triggerRoll = parseInt(actionParts[3]); // "on_1" -> 1
      const cardCount = parseInt(effect.effect_value.toString()) || 1;

      if (diceRoll === triggerRoll) {
        console.log(`🎯 Dice roll ${diceRoll} matches trigger ${triggerRoll}! Drawing ${cardCount} ${cardType} card(s)`);

        // Use the CardService to draw cards
        try {
          this.cardService.drawCards(playerId, cardType, cardCount, 'dice_roll_chance',
            `Manual effect: Drew ${cardCount} ${cardType} card(s) on dice roll ${diceRoll}`);
        } catch (error) {
          console.warn(`Failed to draw ${cardType} cards:`, error);
        }
      } else {
        console.log(`🎲 Dice roll ${diceRoll} does not match trigger ${triggerRoll}. No cards drawn.`);
      }
    } else {
      console.warn(`Unknown dice_roll_chance effect format: ${effect.effect_action}`);
    }

    return this.stateService.getGameState();
  }

  /**
   * Trigger a manual space effect for the current player
   */
  triggerManualEffect(playerId: string, effectType: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Get manual effects for current space and visit type
    const spaceEffects = this.dataService.getSpaceEffects(player.currentSpace, player.visitType);
    const manualEffect = spaceEffects.find(effect => 
      effect.trigger_type === 'manual' && 
      effect.effect_type === effectType
    );

    if (!manualEffect) {
      throw new Error(`No manual ${effectType} effect found for ${player.currentSpace} (${player.visitType})`);
    }

    // Evaluate condition before applying manual effect
    const conditionMet = this.evaluateEffectCondition(playerId, manualEffect.condition);
    if (!conditionMet) {
      throw new Error(`Manual ${effectType} effect condition not met: ${manualEffect.condition}`);
    }

    console.log(`🔧 Triggering manual ${effectType} effect for player ${player.name} on ${player.currentSpace}`);
    console.log(`🔧 Effect details: ${manualEffect.effect_action} ${manualEffect.effect_value}`);

    // Apply the effect based on type
    let newState = this.stateService.getGameState();

    if (effectType === 'cards') {
      newState = this.applySpaceCardEffect(playerId, manualEffect);
    } else if (effectType === 'money') {
      newState = this.applySpaceMoneyEffect(playerId, manualEffect);
    } else if (effectType === 'time') {
      newState = this.applySpaceTimeEffect(playerId, manualEffect);
    } else if (effectType === 'dice_roll_chance') {
      // Handle dice roll chance effects (like "draw_l_on_1")
      console.log(`🎲 Processing dice_roll_chance effect: ${manualEffect.effect_action}`);
      newState = this.applyDiceRollChanceEffect(playerId, manualEffect);

      // Mark that dice has been rolled to prevent duplicate dice roll buttons
      this.stateService.setPlayerHasRolledDice();
    } else if (effectType === 'turn') {
      // Handle turn effects (like "end_turn") - these are special and don't need processing here
      console.log(`🏁 Processing turn effect: ${manualEffect.effect_action}`);
      // Turn effects are handled by the UI component calling onEndTurn
    } else {
      console.warn(`⚠️ Unknown manual effect type: ${effectType}`);
    }

    // Mark that player has completed a manual action with specific type and message
    const { text: buttonText } = formatManualEffectButton(manualEffect);
    this.stateService.setPlayerCompletedManualAction(effectType, buttonText);
    
    console.log(`🔧 Manual ${effectType} effect completed for player ${player.name}`);
    return this.stateService.getGameState();
  }

  /**
   * Trigger manual effect with modal feedback - similar to rollDiceWithFeedback
   */
  triggerManualEffectWithFeedback(playerId: string, effectType: string): TurnEffectResult {
    console.log(`🔧 TurnService.triggerManualEffectWithFeedback - Starting for player ${playerId}, effect: ${effectType}`);
    
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    const beforeState = this.stateService.getGameState();
    const beforePlayer = beforeState.players.find(p => p.id === playerId)!;

    // Trigger the manual effect
    this.triggerManualEffect(playerId, effectType);

    const afterState = this.stateService.getGameState();
    const afterPlayer = afterState.players.find(p => p.id === playerId)!;

    // Get the effect details for feedback
    const spaceEffects = this.dataService.getSpaceEffects(currentPlayer.currentSpace, currentPlayer.visitType);
    const manualEffect = spaceEffects.find(effect => 
      effect.trigger_type === 'manual' && effect.effect_type === effectType
    );

    if (!manualEffect) {
      throw new Error(`No manual ${effectType} effect found for ${currentPlayer.currentSpace}`);
    }

    // Create effect description for modal
    const effects: DiceResultEffect[] = [];
    
    if (effectType === 'cards') {
      const cardType = manualEffect.effect_action.replace('draw_', '').toUpperCase();
      const count = typeof manualEffect.effect_value === 'string' ? parseInt(manualEffect.effect_value, 10) : manualEffect.effect_value;
      effects.push({
        type: 'cards',
        description: `You picked up ${count} ${cardType} cards!`,
        cardType: cardType,
        cardCount: count
      });
    } else if (effectType === 'money') {
      const action = manualEffect.effect_action; // 'add' or 'subtract'
      const amount = manualEffect.effect_value;
      const moneyChange = afterPlayer.money - beforePlayer.money;
      effects.push({
        type: 'money',
        description: `Money ${action === 'add' ? 'gained' : 'spent'}: $${Math.abs(moneyChange)}`,
        value: moneyChange
      });
    } else if (effectType === 'time') {
      const action = manualEffect.effect_action; // 'add' or 'subtract'
      const amount = manualEffect.effect_value;
      const timeChange = afterPlayer.timeSpent - beforePlayer.timeSpent;
      effects.push({
        type: 'time',
        description: `Time ${action === 'add' ? 'spent' : 'saved'}: ${Math.abs(timeChange)} days`,
        value: timeChange
      });
    }

    const summary = effects.map(e => e.description).join(', ');

    // Send Manual Effect notification
    if (this.notificationService) {
      this.notificationService.notify(
        {
          short: 'Action Complete',
          medium: `✅ ${summary}`,
          detailed: `${currentPlayer.name} completed manual action: ${summary}`
        },
        {
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          actionType: 'manualEffect',
          notificationDuration: 3000
        }
      );
    }

    return {
      diceValue: 0, // No dice roll for manual effects
      spaceName: currentPlayer.currentSpace,
      effects,
      summary,
      hasChoices: false
    };
  }

  /**
   * Initiate negotiation for a player - delegates to NegotiationService
   */
  async performNegotiation(playerId: string): Promise<{ success: boolean; message: string }> {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`🤝 Starting negotiation for player ${player.name} on space ${player.currentSpace}`);

    try {
      // Simply delegate to NegotiationService to initiate negotiation
      const result = await this.negotiationService.initiateNegotiation(playerId, {
        type: 'space_negotiation',
        space: player.currentSpace,
        initiatedBy: playerId
      });

      return {
        success: result.success,
        message: result.message
      };
    } catch (error) {
      console.error(`Error initiating negotiation for player ${player.name}:`, error);
      return {
        success: false,
        message: `Failed to start negotiation: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Try again on space - apply time penalty and reset dice state for re-roll
   * Based on CSV: "negotiate by repeating the roll next turn" / "waste time and hope to renegotiate next turn"
   * @param playerId - The player trying again
   * @returns Promise resolving to the action result
   */
  async tryAgainOnSpace(playerId: string): Promise<{ success: boolean; message: string }> {
    console.log(`🔄 Try Again requested for player ${playerId}`);
    
    try {
      // 1. Get the current player to determine their space
      const currentPlayer = this.stateService.getPlayer(playerId);
      if (!currentPlayer) {
        return {
          success: false,
          message: 'Player not found'
        };
      }

      // 2. Check for the snapshot for this specific player and space
      if (!this.stateService.hasPreSpaceEffectSnapshot(playerId, currentPlayer.currentSpace)) {
        return {
          success: false,
          message: 'No snapshot available - Try Again not possible at this time'
        };
      }

      // 3. Get the snapshot object (do not restore it yet)
      const snapshotState = this.stateService.getPlayerSnapshot(playerId);
      if (!snapshotState) {
        throw new Error('Snapshot exists but could not be retrieved');
      }

      // Find player in snapshot to get their space info
      const snapshotPlayer = snapshotState.players.find(p => p.id === playerId);
      if (!snapshotPlayer) {
        throw new Error(`Player ${playerId} not found in snapshot`);
      }

      console.log(`🔄 ${snapshotPlayer.name} trying again on space ${snapshotPlayer.currentSpace}`);

      // Check if space allows negotiation (try again)
      const spaceContent = this.dataService.getSpaceContent(snapshotPlayer.currentSpace, snapshotPlayer.visitType);
      if (!spaceContent || !spaceContent.can_negotiate) {
        return {
          success: false,
          message: 'Try again not available on this space'
        };
      }

      // 3. Calculate the timePenalty
      const spaceEffects = this.dataService.getSpaceEffects(snapshotPlayer.currentSpace, snapshotPlayer.visitType);
      const timePenalty = spaceEffects
        .filter(effect => effect.effect_type === 'time' && effect.effect_action === 'add')
        .reduce((total, effect) => total + Number(effect.effect_value || 0), 0);

      console.log(`⏰ Applying ${timePenalty} day penalty for Try Again on ${snapshotPlayer.currentSpace}`);

      // 4. Get current game state to preserve turn context
      const currentGameState = this.stateService.getGameState();

      // 5. Create a new state object preserving current game state but reverting specific player
      // Only revert the player who used Try Again, preserve all other players' current state
      const newStateObject: GameState = {
        ...currentGameState, // Start with current game state
        players: currentGameState.players.map(player => {
          if (player.id === playerId) {
            // Revert this player to their snapshot state
            const snapshotPlayerState = snapshotState.players.find(p => p.id === playerId);
            return snapshotPlayerState ? { ...snapshotPlayerState } : player;
          } else {
            // Preserve other players' current state
            return { ...player };
          }
        }),
        globalActionLog: [...currentGameState.globalActionLog], // Preserve current action log
        // Preserve all player snapshots (including the current one for multiple Try Again attempts)
        playerSnapshots: {
          ...currentGameState.playerSnapshots,
          [playerId]: {
            spaceName: snapshotPlayer.currentSpace,
            gameState: snapshotState
          }
        },
        // Reset action states so player can take actions again
        hasPlayerRolledDice: false,
        hasPlayerMovedThisTurn: false,
        completedActionCount: 0,
        completedActions: {
          diceRoll: undefined,
          manualActions: {},
        },
        requiredActions: 1,
        availableActionTypes: ['movement']
      };

      // 6. Add time penalty to the reverted player's timeSpent
      // Use the current player's timeSpent as base to accumulate penalties across multiple Try Again attempts
      const currentPlayerState = this.stateService.getPlayer(playerId);
      const targetPlayerIndex = newStateObject.players.findIndex(p => p.id === playerId);
      if (targetPlayerIndex === -1) {
        throw new Error(`Player ${playerId} not found in new state object`);
      }

      newStateObject.players[targetPlayerIndex] = {
        ...newStateObject.players[targetPlayerIndex],
        timeSpent: (currentPlayerState?.timeSpent || 0) + timePenalty
      };

      // Add action log entry
      newStateObject.globalActionLog.push({
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'manual_action',
        timestamp: new Date(),
        playerId: playerId,
        playerName: snapshotPlayer.name,
        description: `Try Again: Reverted to ${snapshotPlayer.currentSpace} with ${timePenalty} day${timePenalty !== 1 ? 's' : ''} penalty`,
        details: { 
          action: 'try_again', 
          space: snapshotPlayer.currentSpace,
          timePenalty: timePenalty
        }
      });

      // 7. Now, call setGameState(newStateObject) - atomic operation
      this.stateService.setGameState(newStateObject);

      console.log(`✅ ${snapshotPlayer.name} reverted to ${snapshotPlayer.currentSpace} with ${timePenalty} day penalty`);

      // 8. DO NOT save a new snapshot - preserve the original clean snapshot for multiple Try Again attempts
      // This ensures subsequent Try Again attempts revert to the original state, not the penalty-applied state

      // 9. Prepare success message for immediate display
      const successMessage = `${snapshotPlayer.name} used Try Again: Reverted to ${snapshotPlayer.currentSpace} with ${timePenalty} day${timePenalty !== 1 ? 's' : ''} penalty.`;

      // Send Try Again notification
      if (this.notificationService) {
        this.notificationService.notify(
          {
            short: 'Try Again Used',
            medium: `🔄 Try Again: ${timePenalty} day penalty`,
            detailed: successMessage
          },
          {
            playerId: snapshotPlayer.id,
            playerName: snapshotPlayer.name,
            actionType: 'tryAgain',
            notificationDuration: 3000
          }
        );
      }

      // 10. Return success - state reversion has reset turn flags automatically
      // No turn advancement needed - player should continue their current turn
      return {
        success: true,
        message: successMessage
      };

    } catch (error) {
      console.error(`❌ Failed to process Try Again:`, error);
      return {
        success: false,
        message: `Failed to try again: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Re-roll dice if player has re-roll ability from E066 card
   * Consumes the re-roll ability and returns new dice result
   */
  async rerollDice(playerId: string): Promise<TurnEffectResult> {
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }
    
    // Log re-roll attempt
    this.loggingService.info('Used re-roll ability', {
      playerId: playerId,
      playerName: currentPlayer.name,
      action: 'reroll',
      space: currentPlayer.currentSpace
    });
    
    // Validate player can re-roll
    if (!currentPlayer.turnModifiers?.canReRoll) {
      throw new Error(`Player ${playerId} does not have re-roll ability`);
    }
    
    // Re-roll ability usage is logged above
    
    // Consume the re-roll ability
    this.stateService.updatePlayer({
      id: playerId,
      turnModifiers: {
        ...currentPlayer.turnModifiers,
        canReRoll: false
      }
    });
    
    // Note: Snapshot already saved after movement, no need to save again
    
    // Roll new dice
    const newDiceRoll = this.rollDice();
    
    // Log re-roll to action history
    this.loggingService.info(`Re-rolled a ${newDiceRoll}`, {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      action: 'rollDice',
      roll: newDiceRoll,
      space: currentPlayer.currentSpace,
      isReroll: true
    });
    
    // Process effects for new dice roll
    const effects: DiceResultEffect[] = [];
    await this.processTurnEffectsWithTracking(playerId, newDiceRoll, effects);
    
    // Generate summary for new result
    const summary = this.generateEffectSummary(effects, newDiceRoll);
    const hasChoices = effects.some(effect => effect.type === 'choice');
    
    return {
      diceValue: newDiceRoll,
      spaceName: currentPlayer.currentSpace,
      effects,
      summary,
      hasChoices,
      canReRoll: false // No longer available after use
    };
  }

  /**
   * Roll dice and process effects with detailed feedback for UI
   * Returns comprehensive information about the dice roll and its effects
   */
  async rollDiceWithFeedback(playerId: string): Promise<TurnEffectResult> {
    // Starting dice roll with feedback
    
    // Note: Snapshot is now saved immediately after movement in MovementService
    // This ensures Try Again always works regardless of when player presses it
    
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    const beforeState = this.stateService.getGameState();
    const beforePlayer = beforeState.players.find(p => p.id === playerId)!;

    // Roll dice
    const diceRoll = this.rollDice();
    
    // Log dice roll to action history
    this.loggingService.info(`Rolled a ${diceRoll}`, {
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      action: 'rollDice',
      roll: diceRoll,
      space: currentPlayer.currentSpace
    });
    
    // Note: Dice roll logging now handled above in rollDice action

    // Process effects and track changes
    const effects: DiceResultEffect[] = [];
    await this.processTurnEffectsWithTracking(playerId, diceRoll, effects);

    // Mark dice roll states
    this.stateService.setPlayerHasRolledDice();
    this.stateService.setPlayerHasMoved();

    // Generate summary
    const summary = this.generateEffectSummary(effects, diceRoll);
    const hasChoices = effects.some(effect => effect.type === 'choice');

    // Generate detailed feedback message and store it in state
    const feedbackMessage = formatDiceRollFeedback(diceRoll, effects);
    this.stateService.setDiceRollCompletion(feedbackMessage);

    // Check if player can re-roll (from E066 card effect)
    const canReRoll = currentPlayer.turnModifiers?.canReRoll || false;

    return {
      diceValue: diceRoll,
      spaceName: currentPlayer.currentSpace,
      effects,
      summary,
      hasChoices,
      canReRoll
    };
  }

  /**
   * Process turn effects while tracking changes for feedback
   */
  private async processTurnEffectsWithTracking(playerId: string, diceRoll: number, effects: DiceResultEffect[]): Promise<void> {
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) return;

    const beforeMoney = currentPlayer.money;
    const beforeTime = currentPlayer.timeSpent;
    // Track card counts by type before processing
    const beforeCards: Record<string, number> = {
      W: this.cardService.getPlayerCardCount(playerId, 'W'),
      B: this.cardService.getPlayerCardCount(playerId, 'B'),
      E: this.cardService.getPlayerCardCount(playerId, 'E'),
      L: this.cardService.getPlayerCardCount(playerId, 'L'),
      I: this.cardService.getPlayerCardCount(playerId, 'I')
    };

    // Process effects using the dice-only method (not space effects)
    await this.processDiceRollEffects(playerId, diceRoll);

    // Capture changes after processing
    const afterPlayer = this.stateService.getPlayer(playerId);
    if (!afterPlayer) return;

    // Track money changes
    const moneyChange = afterPlayer.money - beforeMoney;
    if (moneyChange !== 0) {
      effects.push({
        type: 'money',
        description: moneyChange > 0 ? 'Received project funding' : 'Paid project costs',
        value: moneyChange
      });
    }

    // Track time changes
    const timeChange = afterPlayer.timeSpent - beforeTime;
    if (timeChange !== 0) {
      effects.push({
        type: 'time',
        description: timeChange > 0 ? 'Project delayed' : 'Gained efficiency',
        value: timeChange
      });
    }

    // Track card changes
    Object.keys(beforeCards).forEach(cardType => {
      const before = beforeCards[cardType];
      const after = this.cardService.getPlayerCardCount(playerId, cardType as CardType);
      const cardChange = after - before;
      
      if (cardChange > 0) {
        effects.push({
          type: 'cards',
          description: `Drew ${this.getCardTypeName(cardType)} cards`,
          cardType: cardType,
          cardCount: cardChange
        });
      } else if (cardChange < 0) {
        effects.push({
          type: 'cards',
          description: `Used ${this.getCardTypeName(cardType)} cards`,
          cardType: cardType,
          cardCount: Math.abs(cardChange)
        });
      }
    });

    // Check for movement choices
    const movementRule = this.dataService.getMovement(currentPlayer.currentSpace, currentPlayer.visitType);

    if (movementRule && movementRule.movement_type === 'choice') {
        const moveOptions = [
            movementRule.destination_1,
            movementRule.destination_2,
            movementRule.destination_3,
            movementRule.destination_4,
            movementRule.destination_5
        ].filter((dest): dest is string => !!dest);

        if (moveOptions.length > 0) {
            effects.push({
                type: 'choice',
                description: 'Choose your next destination',
                moveOptions: moveOptions
            });
        }
    }
  }

  /**
   * Generate a human-readable summary of the effects
   */
  private generateEffectSummary(effects: DiceResultEffect[], diceValue: number): string {
    if (effects.length === 0) {
      return `Rolled ${diceValue} - No special effects this turn.`;
    }

    const summaryParts: string[] = [];
    let hasPositive = false;
    let hasNegative = false;

    effects.forEach(effect => {
      switch (effect.type) {
        case 'money':
          if (effect.value! > 0) {
            summaryParts.push('gained funding');
            hasPositive = true;
          } else {
            summaryParts.push('paid costs');
            hasNegative = true;
          }
          break;
        case 'cards':
          summaryParts.push(`drew ${effect.cardCount} card${effect.cardCount! > 1 ? 's' : ''}`);
          hasPositive = true;
          break;
        case 'time':
          if (effect.value! > 0) {
            summaryParts.push('faced delays');
            hasNegative = true;
          } else {
            summaryParts.push('gained efficiency');
            hasPositive = true;
          }
          break;
        case 'choice':
          summaryParts.push('must choose next move');
          break;
      }
    });

    const tone = hasPositive && !hasNegative ? 'Great roll!' :
                hasNegative && !hasPositive ? 'Challenging turn.' :
                'Mixed results.';

    return `${tone} You ${summaryParts.join(', ')}.`;
  }

  /**
   * Get human-readable name for card type
   */
  private getCardTypeName(cardType: string): string {
    switch (cardType) {
      case 'W': return 'Work';
      case 'B': return 'Business';
      case 'E': return 'Expeditor';
      case 'L': return 'Life Events';
      case 'I': return 'Investment';
      default: return cardType;
    }
  }

  /**
   * Evaluate whether an effect condition is met
   */
  private evaluateEffectCondition(playerId: string, condition: string | undefined, diceRoll?: number): boolean {
    // If no condition is specified, assume it should always apply
    if (!condition || condition.trim() === '') {
      return true;
    }

    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      console.warn(`Player ${playerId} not found for condition evaluation`);
      return false;
    }

    const conditionLower = condition.toLowerCase().trim();

    try {
      // Always apply conditions
      if (conditionLower === 'always') {
        return true;
      }

      // Dice roll conditions (used in SPACE_EFFECTS.csv)
      if (conditionLower.startsWith('dice_roll_') && diceRoll !== undefined) {
        const requiredRoll = parseInt(conditionLower.replace('dice_roll_', ''));
        return diceRoll === requiredRoll;
      }

      // Project scope conditions
      if (conditionLower === 'scope_le_4m') {
        const projectScope = this.calculateProjectScope(player);
        return projectScope <= 4000000; // $4M
      }
      
      if (conditionLower === 'scope_gt_4m') {
        const projectScope = this.calculateProjectScope(player);
        return projectScope > 4000000; // $4M
      }

      // Loan amount conditions
      if (conditionLower.startsWith('loan_')) {
        const playerMoney = player.money || 0;
        
        if (conditionLower === 'loan_up_to_1_4m') {
          return playerMoney <= 1400000; // $1.4M
        }
        if (conditionLower === 'loan_1_5m_to_2_75m') {
          return playerMoney >= 1500000 && playerMoney <= 2750000; // $1.5M to $2.75M
        }
        if (conditionLower === 'loan_above_2_75m') {
          return playerMoney > 2750000; // Above $2.75M
        }
      }

      // Percentage-based conditions (often used in dice effects)
      if (conditionLower.includes('%')) {
        // These are typically values, not conditions - return true for now
        return true;
      }

      // Direction conditions (for movement or targeting)
      if (conditionLower === 'to_left' || conditionLower === 'to_right') {
        // These would need game board context to evaluate properly
        // For now, return true (placeholder implementation)
        return true;
      }

      // High/low conditions
      if (conditionLower === 'high') {
        return diceRoll !== undefined && diceRoll >= 4; // 4, 5, 6 are "high"
      }
      
      if (conditionLower === 'low') {
        return diceRoll !== undefined && diceRoll <= 3; // 1, 2, 3 are "low"
      }

      // Amount-based conditions
      if (conditionLower.includes('per_') || conditionLower.includes('of_borrowed_amount')) {
        // These are typically calculation modifiers, not boolean conditions
        return true;
      }

      // Fallback for unknown conditions
      console.warn(`Unknown effect condition: "${condition}" - defaulting to true`);
      return true;

    } catch (error) {
      console.error(`Error evaluating condition "${condition}":`, error);
      return false;
    }
  }

  /**
   * Calculate total project scope from player's work cards
   */
  private calculateProjectScope(player: Player): number {
    let totalScope = 0;

    // Sum up all work cards (W cards represent project scope)
    const workCards = this.cardService.getPlayerCards(player.id, 'W');
    for (const cardId of workCards) {
      const cardData = this.dataService.getCardById(cardId);
      if (cardData && cardData.cost && cardData.cost > 0) {
        // Work cards use cost to represent project scope value
        totalScope += Number(cardData.cost);
      }
    }

    console.log(`🏗️ Player ${player.name} total project scope: $${totalScope.toLocaleString()} (from ${workCards.length} work cards)`);
    return totalScope;
  }

  /**
   * Process space effects for a player after movement (for arrival effects)
   * This is separate from processTurnEffects which processes effects before movement
   */
  private async processSpaceEffectsAfterMovement(playerId: string, spaceName: string, visitType: VisitType): Promise<void> {
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`🏠 Processing arrival space effects for ${currentPlayer.name} at ${spaceName} (${visitType} visit)`);

    try {
      // Check if there's already a snapshot for this player at this same space (multiple Try Again logic)
      if (this.stateService.hasPreSpaceEffectSnapshot(playerId, spaceName)) {
        console.log(`🔄 Snapshot exists for player ${playerId} at ${spaceName} - skipping CSV effects (player used Try Again)`);
        // Don't apply CSV effects again, snapshot already contains the baseline state for this space
        return;
      }

      // Get space effect data from DataService for the arrival space
      const spaceEffectsData = this.dataService.getSpaceEffects(spaceName, visitType);

      // Filter space effects based on conditions (e.g., scope_le_4M, scope_gt_4M)
      const conditionFilteredEffects = this.filterSpaceEffectsByCondition(spaceEffectsData, currentPlayer);

      // Filter out manual effects and time effects - manual effects are triggered by buttons, time effects on leaving space
      const filteredSpaceEffects = conditionFilteredEffects.filter(effect =>
        effect.trigger_type !== 'manual' && effect.effect_type !== 'time'
      );

      if (filteredSpaceEffects.length === 0) {
        console.log(`ℹ️ No automatic space effects for arrival at ${spaceName}`);
        return;
      }

      // Generate effects from space arrival using EffectFactory
      const spaceEffects = EffectFactory.createEffectsFromSpaceEntry(
        filteredSpaceEffects,
        playerId,
        spaceName,
        visitType
      );

      if (spaceEffects.length === 0) {
        console.log(`ℹ️ No processed space effects for arrival at ${spaceName}`);
        return;
      }

      console.log(`⚡ Processing ${spaceEffects.length} space arrival effects for ${spaceName}`);

      // Create effect context for space arrival
      const effectContext = {
        source: 'space_arrival',
        playerId,
        triggerEvent: 'SPACE_ENTRY' as const,
        metadata: {
          spaceName,
          visitType,
          playerName: currentPlayer.name
        }
      };

      // Process effects using EffectEngine
      if (this.effectEngineService) {
        const result = await this.effectEngineService.processEffects(spaceEffects, effectContext);
        if (result.success) {
          console.log(`✅ Applied ${result.successfulEffects} space arrival effects for ${spaceName}`);
        } else {
          console.warn(`⚠️ Some space arrival effects failed for ${spaceName}:`, result.errors);
        }
      } else {
        console.warn(`⚠️ EffectEngineService not available - skipping space arrival effects for ${spaceName}`);
      }
    } catch (error) {
      console.error(`❌ Error processing space arrival effects for ${spaceName}:`, error);
    }
  }

  /**
   * Process starting space effects for all players when the game begins
   * This should be called once when the game starts to apply initial space effects
   */
  public async processStartingSpaceEffects(): Promise<void> {
    const gameState = this.stateService.getGameState();
    const players = gameState.players;

    console.log(`🏁 Processing starting space effects for ${players.length} players`);

    for (const player of players) {
      console.log(`🏠 Processing starting space effects for ${player.name} at ${player.currentSpace}`);
      try {
        // Create snapshot for Try Again functionality on starting space
        this.stateService.savePreSpaceEffectSnapshot(player.id, player.currentSpace);
        console.log(`📸 Created snapshot for ${player.name} on starting space ${player.currentSpace}`);

        await this.processSpaceEffectsAfterMovement(player.id, player.currentSpace, player.visitType);
      } catch (error) {
        console.error(`❌ Error processing starting space effects for ${player.name}:`, error);
      }
    }

    console.log(`✅ Completed processing starting space effects for all players`);
  }

  /**
   * Process time effects for a player when leaving a space
   * Time effects represent the time spent working on activities at that space
   * and should be applied when the player finishes their work and leaves
   */
  private async processLeavingSpaceEffects(playerId: string, spaceName: string, visitType: VisitType): Promise<void> {
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`🚪 Processing leaving space time effects for ${currentPlayer.name} leaving ${spaceName} (${visitType} visit)`);

    try {
      // Get space effect data from DataService for the current space
      const spaceEffectsData = this.dataService.getSpaceEffects(spaceName, visitType);

      // Filter space effects based on conditions and only get time effects
      const conditionFilteredEffects = this.filterSpaceEffectsByCondition(spaceEffectsData, currentPlayer);
      const timeEffects = conditionFilteredEffects.filter(effect =>
        effect.effect_type === 'time' && effect.trigger_type !== 'manual'
      );

      if (timeEffects.length === 0) {
        console.log(`ℹ️ No time effects for leaving ${spaceName}`);
        return;
      }

      console.log(`⏰ Processing ${timeEffects.length} time effects for leaving ${spaceName}`);

      // Generate effects from leaving space using EffectFactory
      const leavingEffects = EffectFactory.createEffectsFromSpaceEntry(
        timeEffects,
        playerId,
        spaceName,
        visitType
      );

      if (leavingEffects.length === 0) {
        console.log(`ℹ️ No processed time effects for leaving ${spaceName}`);
        return;
      }

      // Create effect context for leaving space
      const effectContext = {
        source: 'space_leaving',
        playerId,
        triggerEvent: 'SPACE_EXIT' as const,
        metadata: {
          spaceName,
          visitType,
          playerName: currentPlayer.name
        }
      };

      // Process effects using EffectEngine
      if (this.effectEngineService) {
        const result = await this.effectEngineService.processEffects(leavingEffects, effectContext);
        if (result.success) {
          console.log(`✅ Applied ${result.successfulEffects} time effects for leaving ${spaceName}`);
        } else {
          console.warn(`⚠️ Some time effects failed for leaving ${spaceName}:`, result.errors);
        }
      } else {
        console.warn(`⚠️ EffectEngineService not available - skipping time effects for leaving ${spaceName}`);
      }
    } catch (error) {
      console.error(`❌ Error processing leaving space time effects for ${spaceName}:`, error);
    }
  }

  /**
   * Set turn modifier for a player (e.g., skip their next turn)
   *
   * @param playerId - The ID of the player to apply the modifier to
   * @param action - The turn control action to apply ('SKIP_TURN')
   * @returns true if the modifier was successfully applied, false otherwise
   */
  public setTurnModifier(playerId: string, action: 'SKIP_TURN'): boolean {
    try {
      console.log(`🔄 TurnService.setTurnModifier - Applying ${action} to player ${playerId}`);
      
      // Get current player state
      const player = this.stateService.getPlayer(playerId);
      if (!player) {
        console.error(`❌ Cannot apply turn modifier: Player ${playerId} not found`);
        return false;
      }
      
      // Apply the turn modifier based on action type
      switch (action) {
        case 'SKIP_TURN':
          // Initialize player's turn modifiers if they don't exist
          const currentModifiers = player.turnModifiers || { skipTurns: 0 };
          
          // Increment skip turns count
          const newModifiers = { ...currentModifiers, skipTurns: currentModifiers.skipTurns + 1 };
          this.stateService.updatePlayer({ id: playerId, turnModifiers: newModifiers });
          
          console.log(`✅ Player ${player.name} will skip their next ${newModifiers.skipTurns} turn(s)`);
          
          return true;
          
        default:
          console.error(`❌ Unknown turn control action: ${action}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Error applying turn modifier:`, error);
      return false;
    }
  }

  /**
   * Filter space effects based on their conditions
   * Evaluates conditions like scope_le_4M, scope_gt_4M, etc.
   */
  private filterSpaceEffectsByCondition(spaceEffects: SpaceEffect[], player: Player): SpaceEffect[] {
    return spaceEffects.filter(effect => {
      return this.evaluateSpaceEffectCondition(effect.condition, player);
    });
  }

  /**
   * Evaluate a single space effect condition
   * Returns true if the condition is met, false otherwise
   */
  private evaluateSpaceEffectCondition(condition: string, player: Player): boolean {
    console.log(`🔍 Evaluating condition: "${condition}" for player ${player.name}`);

    switch (condition) {
      case 'always':
        return true;

      case 'scope_le_4M':
        const projectScope = player.projectScope || 0;
        const result_le = projectScope <= 4000000; // 4M = 4,000,000
        console.log(`💰 Project scope ${projectScope} ≤ $4M? ${result_le}`);
        return result_le;

      case 'scope_gt_4M':
        const projectScopeGt = player.projectScope || 0;
        const result_gt = projectScopeGt > 4000000; // 4M = 4,000,000
        console.log(`💰 Project scope ${projectScopeGt} > $4M? ${result_gt}`);
        return result_gt;

      default:
        console.warn(`⚠️ Unknown space effect condition: "${condition}", defaulting to false`);
        return false;
    }
  }

  /**
   * Handle automatic funding for OWNER-FUND-INITIATION space
   * Awards B card if project scope ≤ $4M, I card otherwise
   */
  handleAutomaticFunding(playerId: string): TurnEffectResult {
    console.log(`💰 TurnService.handleAutomaticFunding - Starting for player ${playerId}`);
    
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (currentPlayer.currentSpace !== 'OWNER-FUND-INITIATION') {
      throw new Error(`Player is not on OWNER-FUND-INITIATION space`);
    }

    const beforeState = this.stateService.getGameState();
    const projectScope = currentPlayer.projectScope || 0;
    
    // Determine funding type based on project scope
    const fundingCardType = projectScope <= 4000000 ? 'B' : 'I';
    const fundingDescription = projectScope <= 4000000 
      ? `Bank funding approved (scope ≤ $4M)`
      : `Investor funding required (scope > $4M)`;

    console.log(`💰 Project scope: $${projectScope.toLocaleString()}, awarding ${fundingCardType} card`);

    // Draw and automatically play the funding card using atomic method
    try {
      const result = this.cardService.drawAndApplyCard(
        playerId,
        fundingCardType,
        'auto_funding',
        'Automatic funding for OWNER-FUND-INITIATION space'
      );

      if (!result.success) {
        throw new Error('Failed to draw and apply funding card.');
      }

      console.log(`💰 Automatically awarded and played ${fundingCardType} card: ${result.drawnCardId}`);

      // Mark that player has "rolled dice" to continue turn flow
      this.stateService.setPlayerHasRolledDice();

      const afterState = this.stateService.getGameState();

      // Create effect description for modal feedback
      const effects: DiceResultEffect[] = [{
        type: 'cards',
        description: `${fundingDescription} - ${fundingCardType} card awarded and applied!`,
        cardType: fundingCardType,
        cardCount: 1
      }];

      // Send Automatic Funding notification
      if (this.notificationService) {
        this.notificationService.notify(
          {
            short: 'Funding Approved',
            medium: `💰 ${fundingDescription}`,
            detailed: `${currentPlayer.name} received automatic funding: ${fundingDescription}`
          },
          {
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            actionType: 'automaticFunding',
            notificationDuration: 3000
          }
        );
      }

      return {
        diceValue: 0, // No actual dice roll
        spaceName: currentPlayer.currentSpace,
        effects: effects,
        summary: fundingDescription,
        hasChoices: false,
        canReRoll: false
      };

    } catch (error) {
      console.error(`❌ Error in automatic funding:`, error);
      throw new Error(`Failed to process automatic funding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}