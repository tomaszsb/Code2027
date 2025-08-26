import { ITurnService, IDataService, IStateService, IGameRulesService, ICardService, IResourceService, IEffectEngineService, TurnResult } from '../types/ServiceContracts';
import { GameState, Player, DiceResultEffect, TurnEffectResult } from '../types/StateTypes';
import { DiceEffect, SpaceEffect, Movement } from '../types/DataTypes';
import { EffectFactory } from '../utils/EffectFactory';
import { EffectContext } from '../types/EffectTypes';

export class TurnService implements ITurnService {
  private readonly dataService: IDataService;
  private readonly stateService: IStateService;
  private readonly gameRulesService: IGameRulesService;
  private readonly cardService: ICardService;
  private readonly resourceService: IResourceService;
  private effectEngineService?: IEffectEngineService;

  constructor(dataService: IDataService, stateService: IStateService, gameRulesService: IGameRulesService, cardService: ICardService, resourceService: IResourceService, effectEngineService?: IEffectEngineService) {
    this.dataService = dataService;
    this.stateService = stateService;
    this.gameRulesService = gameRulesService;
    this.cardService = cardService;
    this.resourceService = resourceService;
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
    console.log(`🎮 TurnService.takeTurn - Starting turn for player ${playerId}`);
    
    try {
      // Validation: Check if it's the player's turn
      if (!this.canPlayerTakeTurn(playerId)) {
        throw new Error(`It is not player ${playerId}'s turn`);
      }

      // Check if player has already moved this turn
      const gameState = this.stateService.getGameState();
      console.log(`🎮 TurnService.takeTurn - State check: hasPlayerMovedThisTurn=${gameState.hasPlayerMovedThisTurn}, currentPlayerId=${gameState.currentPlayerId}`);
      if (gameState.hasPlayerMovedThisTurn) {
        console.warn(`🎮 TurnService.takeTurn - Player ${playerId} has already moved, clearing flag and continuing (AI turn recovery)`);
        this.stateService.clearPlayerHasMoved();
      }

      // Get current player data
      const currentPlayer = this.stateService.getPlayer(playerId);
      if (!currentPlayer) {
        throw new Error(`Player ${playerId} not found`);
      }

      console.log(`🎮 TurnService.takeTurn - Player ${currentPlayer.name} on space ${currentPlayer.currentSpace}`);

      // Roll dice
      const diceRoll = this.rollDice();
      console.log(`🎮 TurnService.takeTurn - Rolled dice: ${diceRoll}`);

      // Process turn effects based on dice roll
      console.log(`🎮 TurnService.takeTurn - Processing turn effects...`);
      await this.processTurnEffects(playerId, diceRoll);

      // Handle movement based on current space
      console.log(`🎮 TurnService.takeTurn - Handling movement...`);
      const newGameState = this.handleMovement(playerId, diceRoll);

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
    console.log(`🎲 TurnService.rollDiceAndProcessEffects - Starting for player ${playerId}`);
    
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

      console.log(`🎲 TurnService.rollDiceAndProcessEffects - Player ${currentPlayer.name} on space ${currentPlayer.currentSpace}`);

      // Roll dice
      const diceRoll = this.rollDice();
      console.log(`🎲 TurnService.rollDiceAndProcessEffects - Rolled dice: ${diceRoll}`);

      // Process turn effects based on dice roll (but NO movement)
      console.log(`🎲 TurnService.rollDiceAndProcessEffects - Processing turn effects...`);
      await this.processTurnEffects(playerId, diceRoll);

      // Mark that the player has rolled dice this turn (enables End Turn button)
      console.log(`🎲 TurnService.rollDiceAndProcessEffects - Marking dice as rolled`);
      this.stateService.setPlayerHasRolledDice();

      // Mark that the player has taken an action (increments action counter)
      console.log(`🎲 TurnService.rollDiceAndProcessEffects - Marking player action taken`);
      this.stateService.setPlayerHasMoved();

      console.log(`🎲 TurnService.rollDiceAndProcessEffects - Dice roll completed successfully`);
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

      console.log(`🏁 TurnService.endTurnWithMovement - Moving player ${currentPlayer.name} from ${currentPlayer.currentSpace}`);

      // Handle movement based on current space
      // Note: We don't need dice roll here for fixed movement, but we'll pass 0 as placeholder
      this.handleMovement(gameState.currentPlayerId, 0);

      // Check for win condition before ending turn
      const hasWon = await this.gameRulesService.checkWinCondition(gameState.currentPlayerId);
      if (hasWon) {
        // Player has won - end the game
        this.stateService.endGame(gameState.currentPlayerId);
        return { nextPlayerId: gameState.currentPlayerId }; // Winner remains current player
      }

      // Advance to next player
      const nextPlayerResult = this.nextPlayer();
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

    // Check for win condition before ending turn
    const hasWon = await this.gameRulesService.checkWinCondition(gameState.currentPlayerId);
    if (hasWon) {
      // Player has won - end the game
      this.stateService.endGame(gameState.currentPlayerId);
      return { nextPlayerId: gameState.currentPlayerId }; // Winner remains current player
    }

    // Use the common nextPlayer method
    return this.nextPlayer();
  }

  private nextPlayer(): { nextPlayerId: string } {
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
    console.log(`🃏 Processing card expirations at end of turn ${gameState.turn}`);
    this.cardService.endOfTurn();

    // Determine next player (wrap around to first player if at end)
    let nextPlayerIndex = (currentPlayerIndex + 1) % allPlayers.length;
    let nextPlayer = allPlayers[nextPlayerIndex];

    // Check if the next player has turn modifiers (turn skips)
    const turnModifiers = gameState.turnModifiers[nextPlayer.id];
    if (turnModifiers && turnModifiers.skipTurns > 0) {
      console.log(`🔄 Player ${nextPlayer.name} has ${turnModifiers.skipTurns} turn(s) to skip - skipping their turn`);
      
      // Decrement skip count
      turnModifiers.skipTurns -= 1;
      
      // If no more skips remaining, clean up
      if (turnModifiers.skipTurns <= 0) {
        delete gameState.turnModifiers[nextPlayer.id];
        console.log(`✅ Player ${nextPlayer.name} skip turns cleared`);
      }
      
      // Recursively call nextPlayer to skip to the following player
      // But first update current player to the skipped player so the recursion works correctly
      this.stateService.setCurrentPlayer(nextPlayer.id);
      console.log(`⏭️ Skipping to next player after ${nextPlayer.name}`);
      
      return this.nextPlayer();
    }

    // Update the current player in the game state
    this.stateService.setCurrentPlayer(nextPlayer.id);

    // Advance turn counter and reset turn flags
    this.stateService.advanceTurn();
    this.stateService.clearPlayerHasMoved();
    this.stateService.clearPlayerHasRolledDice();
    this.stateService.clearPlayerCompletedManualActions();

    return { nextPlayerId: nextPlayer.id };
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
      
      // Get dice effect data from DataService  
      const diceEffectsData = this.dataService.getDiceEffects(
        currentPlayer.currentSpace, 
        currentPlayer.visitType
      );
      
      // Get space configuration for action processing
      const spaceConfig = this.dataService.getGameConfigBySpace(currentPlayer.currentSpace);
      
      // Generate all effects from space entry using EffectFactory
      const spaceEffects = EffectFactory.createEffectsFromSpaceEntry(
        spaceEffectsData,
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

    const cardTypeKey = cardType as keyof typeof player.availableCards;

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
        const currentCards = player.availableCards[cardTypeKey] || [];
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
      const currentCards = player.availableCards[cardTypeKey] || [];
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
      // Draw W cards
      const newCards = { ...player.availableCards };
      const newCardIds = this.generateCardIds('W', value);
      newCards.W = [...newCards.W, ...newCardIds];
      
      console.log(`Player ${player.name} draws ${value} W cards:`, newCardIds);
      
      return this.stateService.updatePlayer({
        id: playerId,
        availableCards: newCards
      });
    } else if (action === 'draw_b') {
      // Draw B cards
      const newCards = { ...player.availableCards };
      const newCardIds = this.generateCardIds('B', value);
      newCards.B = [...newCards.B, ...newCardIds];
      
      console.log(`Player ${player.name} draws ${value} B cards:`, newCardIds);
      
      return this.stateService.updatePlayer({
        id: playerId,
        availableCards: newCards
      });
    } else if (action === 'draw_e') {
      // Draw E cards
      const newCards = { ...player.availableCards };
      const newCardIds = this.generateCardIds('E', value);
      newCards.E = [...newCards.E, ...newCardIds];
      
      console.log(`Player ${player.name} draws ${value} E cards:`, newCardIds);
      
      return this.stateService.updatePlayer({
        id: playerId,
        availableCards: newCards
      });
    } else if (action === 'draw_l') {
      // Draw L cards  
      const newCards = { ...player.availableCards };
      const newCardIds = this.generateCardIds('L', value);
      newCards.L = [...newCards.L, ...newCardIds];
      
      console.log(`Player ${player.name} draws ${value} L cards:`, newCardIds);
      
      return this.stateService.updatePlayer({
        id: playerId,
        availableCards: newCards
      });
    } else if (action === 'draw_i') {
      // Draw I cards
      const newCards = { ...player.availableCards };
      const newCardIds = this.generateCardIds('I', value);
      newCards.I = [...newCards.I, ...newCardIds];
      
      console.log(`Player ${player.name} draws ${value} I cards:`, newCardIds);
      
      return this.stateService.updatePlayer({
        id: playerId,
        availableCards: newCards
      });
    } else if (action === 'replace_e') {
      // Replace E cards - remove old E cards and add new ones
      const newCards = { ...player.availableCards };
      const replaceCount = Math.min(value, newCards.E.length);
      
      if (replaceCount > 0) {
        // Remove old E cards
        newCards.E = newCards.E.slice(replaceCount);
        // Add new E cards
        const newCardIds = this.generateCardIds('E', replaceCount);
        newCards.E = [...newCards.E, ...newCardIds];
        
        console.log(`Player ${player.name} replaces ${replaceCount} E cards:`, newCardIds);
      } else {
        console.log(`Player ${player.name} has no E cards to replace`);
      }
      
      return this.stateService.updatePlayer({
        id: playerId,
        availableCards: newCards
      });
    } else if (action === 'replace_l') {
      // Replace L cards - remove old L cards and add new ones
      const newCards = { ...player.availableCards };
      const replaceCount = Math.min(value, newCards.L.length);
      
      if (replaceCount > 0) {
        // Remove old L cards
        newCards.L = newCards.L.slice(replaceCount);
        // Add new L cards
        const newCardIds = this.generateCardIds('L', replaceCount);
        newCards.L = [...newCards.L, ...newCardIds];
        
        console.log(`Player ${player.name} replaces ${replaceCount} L cards:`, newCardIds);
      } else {
        console.log(`Player ${player.name} has no L cards to replace`);
      }
      
      return this.stateService.updatePlayer({
        id: playerId,
        availableCards: newCards
      });
    } else if (action === 'return_e') {
      // Return E cards - remove them from hand
      const newCards = { ...player.availableCards };
      const returnCount = Math.min(value, newCards.E.length);
      
      if (returnCount > 0) {
        newCards.E = newCards.E.slice(returnCount);
        console.log(`Player ${player.name} returns ${returnCount} E cards`);
      } else {
        console.log(`Player ${player.name} has no E cards to return`);
      }
      
      return this.stateService.updatePlayer({
        id: playerId,
        availableCards: newCards
      });
    } else if (action === 'return_l') {
      // Return L cards - remove them from hand
      const newCards = { ...player.availableCards };
      const returnCount = Math.min(value, newCards.L.length);
      
      if (returnCount > 0) {
        newCards.L = newCards.L.slice(returnCount);
        console.log(`Player ${player.name} returns ${returnCount} L cards`);
      } else {
        console.log(`Player ${player.name} has no L cards to return`);
      }
      
      return this.stateService.updatePlayer({
        id: playerId,
        availableCards: newCards
      });
    } else if (action === 'transfer') {
      // Transfer cards to another player
      const targetPlayer = this.getTargetPlayer(playerId, effect.condition);
      
      if (!targetPlayer) {
        console.log(`Player ${player.name} could not transfer cards - no target player found`);
        return this.stateService.getGameState();
      }

      // For now, transfer a random card from player's hand to target
      // Priority order: W, B, E, L, I (transfer most valuable first)
      const cardTypes: (keyof typeof player.cards)[] = ['W', 'B', 'E', 'L', 'I'];
      let transferredCard: string | null = null;
      let transferredType: string | null = null;

      for (const cardType of cardTypes) {
        if (player.cards[cardType].length > 0) {
          transferredCard = player.cards[cardType][0];
          transferredType = cardType;
          break;
        }
      }

      if (transferredCard && transferredType) {
        // Remove card from current player
        const currentPlayerCards = { ...player.cards };
        currentPlayerCards[transferredType as keyof typeof currentPlayerCards] = 
          currentPlayerCards[transferredType as keyof typeof currentPlayerCards].slice(1);

        // Add card to target player  
        const targetPlayerCards = { ...targetPlayer.cards };
        targetPlayerCards[transferredType as keyof typeof targetPlayerCards] = 
          [...targetPlayerCards[transferredType as keyof typeof targetPlayerCards], transferredCard];

        // Update both players
        this.stateService.updatePlayer({
          id: playerId,
          cards: currentPlayerCards
        });

        this.stateService.updatePlayer({
          id: targetPlayer.id,
          cards: targetPlayerCards
        });

        console.log(`Player ${player.name} transfers ${transferredType} card to ${targetPlayer.name}`);
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

  private handleMovement(playerId: string, diceRoll: number): GameState {
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`🚶 Movement Debug: Player ${currentPlayer.name} on ${currentPlayer.currentSpace} (${currentPlayer.visitType} visit)`);

    // Get movement data for current space
    const movement = this.dataService.getMovement(currentPlayer.currentSpace, currentPlayer.visitType);
    console.log('🚶 Movement data found:', movement);
    
    if (!movement) {
      // No movement data - player stays in current space
      console.log('🚶 No movement data found - staying in place');
      return this.stateService.getGameState();
    }

    // Handle movement based on type
    switch (movement.movement_type) {
      case 'choice':
        // Player must choose destination - set awaitingChoice state
        return this.setAwaitingChoice(playerId, movement);
      
      case 'fixed':
        // Move to fixed destination
        return this.moveToFixedDestination(playerId, movement);
      
      case 'dice':
        // Move based on dice roll
        return this.moveToDiceDestination(playerId, movement, diceRoll);
      
      case 'none':
        // Terminal space - stay in place
        return this.stateService.getGameState();
      
      default:
        console.warn(`Unknown movement type: ${movement.movement_type}`);
        return this.stateService.getGameState();
    }
  }

  private setAwaitingChoice(playerId: string, movement: Movement): GameState {
    // Extract destination options
    const options: string[] = [];
    if (movement.destination_1) options.push(movement.destination_1);
    if (movement.destination_2) options.push(movement.destination_2);
    if (movement.destination_3) options.push(movement.destination_3);
    if (movement.destination_4) options.push(movement.destination_4);
    if (movement.destination_5) options.push(movement.destination_5);

    // Update game state with choice waiting
    return this.stateService.setAwaitingChoice(playerId, options);
  }

  private moveToFixedDestination(playerId: string, movement: Movement): GameState {
    const destination = movement.destination_1;
    if (!destination) {
      throw new Error('Fixed movement requires a destination');
    }

    // Move player to destination
    this.movePlayerToSpace(playerId, destination);
    
    // Return current game state
    return this.stateService.getGameState();
  }

  private moveToDiceDestination(playerId: string, movement: Movement, diceRoll: number): GameState {
    const diceOutcome = this.dataService.getDiceOutcome(movement.space_name, movement.visit_type);
    if (!diceOutcome) {
      throw new Error(`No dice outcome data for space ${movement.space_name}`);
    }

    // Get destination based on dice roll
    let destination: string | undefined;
    switch (diceRoll) {
      case 1: destination = diceOutcome.roll_1; break;
      case 2: destination = diceOutcome.roll_2; break;
      case 3: destination = diceOutcome.roll_3; break;
      case 4: destination = diceOutcome.roll_4; break;
      case 5: destination = diceOutcome.roll_5; break;
      case 6: destination = diceOutcome.roll_6; break;
    }

    if (!destination) {
      throw new Error(`No destination for dice roll ${diceRoll} on space ${movement.space_name}`);
    }

    // Move player to destination
    this.movePlayerToSpace(playerId, destination);
    
    // Return current game state
    return this.stateService.getGameState();
  }

  private movePlayerToSpace(playerId: string, destinationSpace: string): void {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Determine visit type for destination space
    const newVisitType = this.hasPlayerVisitedSpace(player, destinationSpace) 
      ? 'Subsequent' 
      : 'First';

    // Update player's position
    this.stateService.updatePlayer({
      id: playerId,
      currentSpace: destinationSpace,
      visitType: newVisitType
    });

    // Update action counts for the new space
    this.stateService.updateActionCounts();
  }

  private hasPlayerVisitedSpace(player: Player, spaceName: string): boolean {
    // Simple heuristic: if player is at starting space, destination is first visit
    const allSpaces = this.dataService.getAllSpaces();
    const startingSpaces = allSpaces
      .filter(space => space.config.is_starting_space)
      .map(space => space.name);
    
    if (startingSpaces.includes(player.currentSpace) && player.currentSpace !== spaceName) {
      return false;
    }
    
    return true;
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
    }

    // Mark that player has completed a manual action
    this.stateService.setPlayerCompletedManualAction();
    
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
      const count = manualEffect.effect_value;
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
        description: `Time ${action === 'add' ? 'spent' : 'saved'}: ${Math.abs(timeChange)} hours`,
        value: timeChange
      });
    }

    const summary = effects.map(e => e.description).join(', ');

    return {
      diceValue: 0, // No dice roll for manual effects
      spaceName: currentPlayer.currentSpace,
      effects,
      summary,
      hasChoices: false
    };
  }

  /**
   * Perform negotiation for a player - either restore from snapshot or apply time penalty
   */
  async performNegotiation(playerId: string): Promise<{ success: boolean; message: string }> {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`🤝 Performing negotiation for player ${player.name}`);

    try {
      if (player.spaceEntrySnapshot) {
        // Restore player state from snapshot
        console.log(`🔄 Restoring player ${player.name} from snapshot`);
        this.stateService.restorePlayerSnapshot(playerId);
        
        // End the player's turn after restoration
        await this.endTurn();
        
        return {
          success: true,
          message: `Negotiation successful! ${player.name} was restored to their previous state.`
        };
      } else {
        // Apply time penalty - look up time effect for current space
        console.log(`⏰ Applying time penalty for player ${player.name} on ${player.currentSpace}`);
        
        const spaceEffects = this.dataService.getSpaceEffects(player.currentSpace, player.visitType);
        const timeEffect = spaceEffects.find(effect => effect.effect_type === 'time');
        
        let penaltyTime = 5; // Default penalty
        if (timeEffect) {
          penaltyTime = typeof timeEffect.effect_value === 'string' ? 
            parseInt(timeEffect.effect_value) : timeEffect.effect_value;
        }
        
        // Apply time penalty
        const currentTime = player.timeSpent || 0;
        this.stateService.updatePlayer({
          id: playerId,
          timeSpent: currentTime + penaltyTime
        });
        
        console.log(`Player ${player.name} received ${penaltyTime} time penalty`);
        
        // End the player's turn after penalty
        await this.endTurn();
        
        return {
          success: false,
          message: `Negotiation failed. ${player.name} received a ${penaltyTime}-day time penalty.`
        };
      }
    } catch (error) {
      console.error(`Error during negotiation for player ${player.name}:`, error);
      throw error;
    }
  }

  /**
   * Roll dice and process effects with detailed feedback for UI
   * Returns comprehensive information about the dice roll and its effects
   */
  async rollDiceWithFeedback(playerId: string): Promise<TurnEffectResult> {
    console.log(`🎲 TurnService.rollDiceWithFeedback - Starting for player ${playerId}`);
    
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    const beforeState = this.stateService.getGameState();
    const beforePlayer = beforeState.players.find(p => p.id === playerId)!;

    // Roll dice
    const diceRoll = this.rollDice();
    console.log(`🎲 Rolled: ${diceRoll} for ${currentPlayer.name} on ${currentPlayer.currentSpace}`);

    // Process effects and track changes
    const effects: DiceResultEffect[] = [];
    await this.processTurnEffectsWithTracking(playerId, diceRoll, effects);

    // Mark dice roll states
    this.stateService.setPlayerHasRolledDice();
    this.stateService.setPlayerHasMoved();

    // Generate summary
    const summary = this.generateEffectSummary(effects, diceRoll);
    const hasChoices = effects.some(effect => effect.type === 'choice');

    return {
      diceValue: diceRoll,
      spaceName: currentPlayer.currentSpace,
      effects,
      summary,
      hasChoices
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
    const beforeCards = { ...currentPlayer.availableCards };

    // Process effects using the existing method
    await this.processTurnEffects(playerId, diceRoll);

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
      const typedCardType = cardType as keyof typeof beforeCards;
      const before = beforeCards[typedCardType].length;
      const after = afterPlayer.availableCards[typedCardType].length;
      const cardChange = after - before;
      
      if (cardChange > 0) {
        effects.push({
          type: 'cards',
          description: `Drew ${this.getCardTypeName(typedCardType)} cards`,
          cardType: typedCardType,
          cardCount: cardChange
        });
      } else if (cardChange < 0) {
        effects.push({
          type: 'cards',
          description: `Used ${this.getCardTypeName(typedCardType)} cards`,
          cardType: typedCardType,
          cardCount: Math.abs(cardChange)
        });
      }
    });

    // Check for movement choices (this would require additional logic)
    // For now, we'll detect if the player has movement options
    const availableMoves = this.dataService.getAllMovements()
      .filter(m => m.from_space === currentPlayer.currentSpace && m.visit_type === currentPlayer.visitType);
    
    if (availableMoves.length > 1) {
      effects.push({
        type: 'choice',
        description: 'Choose your next destination',
        moveOptions: availableMoves.map(m => m.to_space)
      });
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
    const workCards = player.availableCards?.W || [];
    for (const cardId of workCards) {
      const cardData = this.dataService.getCardById(cardId);
      if (cardData && cardData.card_cost && cardData.card_cost > 0) {
        // Work cards use card_cost to represent project scope value
        totalScope += cardData.card_cost;
      }
    }

    console.log(`🏗️ Player ${player.name} total project scope: $${totalScope.toLocaleString()} (from ${workCards.length} work cards)`);
    return totalScope;
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
      
      // Get current game state
      const gameState = this.stateService.getGameState();
      
      // Validate player exists
      const player = this.stateService.getPlayer(playerId);
      if (!player) {
        console.error(`❌ Cannot apply turn modifier: Player ${playerId} not found`);
        return false;
      }
      
      // Apply the turn modifier based on action type
      switch (action) {
        case 'SKIP_TURN':
          // Initialize player's turn modifiers if they don't exist
          if (!gameState.turnModifiers[playerId]) {
            gameState.turnModifiers[playerId] = { skipTurns: 0 };
          }
          
          // Increment skip turns count
          gameState.turnModifiers[playerId].skipTurns += 1;
          
          console.log(`✅ Player ${player.name} will skip their next ${gameState.turnModifiers[playerId].skipTurns} turn(s)`);
          
          // Note: The gameState object is a reference, so our changes are already applied
          // The StateService will notify listeners of the change
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
}