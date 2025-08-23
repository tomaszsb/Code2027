import { ITurnService, IDataService, IStateService, IGameRulesService, TurnResult } from '../types/ServiceContracts';
import { GameState, Player } from '../types/StateTypes';
import { DiceEffect, SpaceEffect, Movement } from '../types/DataTypes';

export class TurnService implements ITurnService {
  private readonly dataService: IDataService;
  private readonly stateService: IStateService;
  private readonly gameRulesService: IGameRulesService;

  constructor(dataService: IDataService, stateService: IStateService, gameRulesService: IGameRulesService) {
    this.dataService = dataService;
    this.stateService = stateService;
    this.gameRulesService = gameRulesService;
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

  takeTurn(playerId: string): TurnResult {
    console.log(`🎮 TurnService.takeTurn - Starting turn for player ${playerId}`);
    
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

      console.log(`🎮 TurnService.takeTurn - Player ${currentPlayer.name} on space ${currentPlayer.currentSpace}`);

      // Roll dice
      const diceRoll = this.rollDice();
      console.log(`🎮 TurnService.takeTurn - Rolled dice: ${diceRoll}`);

      // Process turn effects based on dice roll
      console.log(`🎮 TurnService.takeTurn - Processing turn effects...`);
      this.processTurnEffects(playerId, diceRoll);

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
  rollDiceAndProcessEffects(playerId: string): { diceRoll: number } {
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
      this.processTurnEffects(playerId, diceRoll);

      // Mark that the player has moved this turn (enables End Turn button)
      console.log(`🎲 TurnService.rollDiceAndProcessEffects - Marking player as moved`);
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

    // Determine next player (wrap around to first player if at end)
    const nextPlayerIndex = (currentPlayerIndex + 1) % allPlayers.length;
    const nextPlayer = allPlayers[nextPlayerIndex];

    // Update the current player in the game state
    this.stateService.setCurrentPlayer(nextPlayer.id);

    // Advance turn counter and clear player moved flag
    this.stateService.advanceTurn();
    this.stateService.clearPlayerHasMoved();

    return { nextPlayerId: nextPlayer.id };
  }

  rollDice(): number {
    return Math.floor(Math.random() * 6) + 1;
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

  processTurnEffects(playerId: string, diceRoll: number): GameState {
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    let currentState = this.stateService.getGameState();

    console.log(`🎯 Processing turn effects for ${currentPlayer.name} on ${currentPlayer.currentSpace} (${currentPlayer.visitType} visit)`);

    // First, process space effects (always applied when landing on a space)
    const spaceEffects = this.dataService.getSpaceEffects(
      currentPlayer.currentSpace, 
      currentPlayer.visitType
    );

    console.log(`📋 Found ${spaceEffects.length} space effects:`, spaceEffects);

    for (const effect of spaceEffects) {
      console.log(`⚡ Applying space effect: ${effect.effect_type} ${effect.effect_action} ${effect.effect_value} (condition: ${effect.condition})`);
      currentState = this.applySpaceEffect(playerId, effect, currentState);
    }

    // Then, process dice effects (specific to dice roll results)
    const diceEffects = this.dataService.getDiceEffects(
      currentPlayer.currentSpace, 
      currentPlayer.visitType
    );

    console.log(`🎲 Found ${diceEffects.length} dice effects:`, diceEffects);

    for (const effect of diceEffects) {
      console.log(`🎲 Applying dice effect for roll ${diceRoll}:`, effect);
      currentState = this.applyDiceEffect(playerId, effect, diceRoll, currentState);
    }

    return currentState;
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

    const cardTypeKey = cardType as keyof typeof player.cards;
    let newCards = { ...player.cards };

    if (effect.includes('Draw')) {
      const drawCount = this.parseNumericValue(effect);
      if (drawCount > 0) {
        // Generate proper card IDs based on actual CSV card data
        const newCardIds = this.generateCardIds(cardType, drawCount);
        console.log(`Player ${player.name} draws ${drawCount} ${cardType} cards:`, newCardIds);
        newCards[cardTypeKey] = [...newCards[cardTypeKey], ...newCardIds];
      }
    } else if (effect.includes('Remove')) {
      const removeCount = this.parseNumericValue(effect);
      if (removeCount > 0) {
        newCards[cardTypeKey] = newCards[cardTypeKey].slice(removeCount);
      }
    } else if (effect.includes('Replace')) {
      const replaceCount = this.parseNumericValue(effect);
      if (replaceCount > 0 && newCards[cardTypeKey].length > 0) {
        // Remove old cards and add new ones
        newCards[cardTypeKey] = newCards[cardTypeKey].slice(replaceCount);
        const newCardIds = this.generateCardIds(cardType, replaceCount);
        console.log(`Player ${player.name} replaces ${replaceCount} ${cardType} cards:`, newCardIds);
        newCards[cardTypeKey] = [...newCards[cardTypeKey], ...newCardIds];
      }
    }

    return this.stateService.updatePlayer({
      id: playerId,
      cards: newCards
    });
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

    const newMoney = Math.max(0, player.money + moneyChange);

    return this.stateService.updatePlayer({
      id: playerId,
      money: newMoney
    });
  }

  private applyTimeEffect(playerId: string, effect: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const timeChange = this.parseNumericValue(effect);
    const newTime = Math.max(0, player.time + timeChange);

    return this.stateService.updatePlayer({
      id: playerId,
      time: newTime
    });
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
      const newCards = { ...player.cards };
      const newCardIds = this.generateCardIds('W', value);
      newCards.W = [...newCards.W, ...newCardIds];
      
      console.log(`Player ${player.name} draws ${value} W cards:`, newCardIds);
      
      return this.stateService.updatePlayer({
        id: playerId,
        cards: newCards
      });
    } else if (action === 'draw_b') {
      // Draw B cards
      const newCards = { ...player.cards };
      const newCardIds = this.generateCardIds('B', value);
      newCards.B = [...newCards.B, ...newCardIds];
      
      console.log(`Player ${player.name} draws ${value} B cards:`, newCardIds);
      
      return this.stateService.updatePlayer({
        id: playerId,
        cards: newCards
      });
    } else if (action === 'draw_e') {
      // Draw E cards
      const newCards = { ...player.cards };
      const newCardIds = this.generateCardIds('E', value);
      newCards.E = [...newCards.E, ...newCardIds];
      
      console.log(`Player ${player.name} draws ${value} E cards:`, newCardIds);
      
      return this.stateService.updatePlayer({
        id: playerId,
        cards: newCards
      });
    } else if (action === 'draw_l') {
      // Draw L cards  
      const newCards = { ...player.cards };
      const newCardIds = this.generateCardIds('L', value);
      newCards.L = [...newCards.L, ...newCardIds];
      
      console.log(`Player ${player.name} draws ${value} L cards:`, newCardIds);
      
      return this.stateService.updatePlayer({
        id: playerId,
        cards: newCards
      });
    } else if (action === 'draw_i') {
      // Draw I cards
      const newCards = { ...player.cards };
      const newCardIds = this.generateCardIds('I', value);
      newCards.I = [...newCards.I, ...newCardIds];
      
      console.log(`Player ${player.name} draws ${value} I cards:`, newCardIds);
      
      return this.stateService.updatePlayer({
        id: playerId,
        cards: newCards
      });
    } else if (action === 'replace_e') {
      // Replace E cards - remove old E cards and add new ones
      const newCards = { ...player.cards };
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
        cards: newCards
      });
    } else if (action === 'replace_l') {
      // Replace L cards - remove old L cards and add new ones
      const newCards = { ...player.cards };
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
        cards: newCards
      });
    } else if (action === 'return_e') {
      // Return E cards - remove them from hand
      const newCards = { ...player.cards };
      const returnCount = Math.min(value, newCards.E.length);
      
      if (returnCount > 0) {
        newCards.E = newCards.E.slice(returnCount);
        console.log(`Player ${player.name} returns ${returnCount} E cards`);
      } else {
        console.log(`Player ${player.name} has no E cards to return`);
      }
      
      return this.stateService.updatePlayer({
        id: playerId,
        cards: newCards
      });
    } else if (action === 'return_l') {
      // Return L cards - remove them from hand
      const newCards = { ...player.cards };
      const returnCount = Math.min(value, newCards.L.length);
      
      if (returnCount > 0) {
        newCards.L = newCards.L.slice(returnCount);
        console.log(`Player ${player.name} returns ${returnCount} L cards`);
      } else {
        console.log(`Player ${player.name} has no L cards to return`);
      }
      
      return this.stateService.updatePlayer({
        id: playerId,
        cards: newCards
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
}