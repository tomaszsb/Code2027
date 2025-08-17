import { ITurnService, IDataService, IStateService, TurnResult } from '../types/ServiceContracts';
import { GameState, Player } from '../types/StateTypes';
import { DiceEffect, Movement } from '../types/DataTypes';

export class TurnService implements ITurnService {
  private readonly dataService: IDataService;
  private readonly stateService: IStateService;

  constructor(dataService: IDataService, stateService: IStateService) {
    this.dataService = dataService;
    this.stateService = stateService;
  }

  takeTurn(playerId: string): TurnResult {
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

    // Roll dice
    const diceRoll = this.rollDice();

    // Process turn effects based on dice roll
    this.processTurnEffects(playerId, diceRoll);

    // Handle movement based on current space
    const newGameState = this.handleMovement(playerId, diceRoll);

    // Mark that the player has moved this turn
    this.stateService.setPlayerHasMoved();

    return {
      newState: newGameState,
      diceRoll: diceRoll
    };
  }

  endTurn(): GameState {
    const gameState = this.stateService.getGameState();
    
    // Validation: Game must be in PLAY phase
    if (gameState.gamePhase !== 'PLAY') {
      throw new Error('Cannot end turn outside of PLAY phase');
    }

    // Validation: Must have a current player
    if (!gameState.currentPlayerId) {
      throw new Error('No current player to end turn for');
    }

    // Validation: Player must have moved this turn
    if (!gameState.hasPlayerMovedThisTurn) {
      throw new Error('Cannot end turn: player has not moved yet');
    }

    // Validation: Cannot end turn while awaiting choice
    if (gameState.awaitingChoice) {
      throw new Error('Cannot end turn while awaiting player choice');
    }

    // Advance turn counter and move to next player
    this.stateService.advanceTurn();
    return this.stateService.nextPlayer();
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

    // Get dice effects for the player's current space and visit type
    const diceEffects = this.dataService.getDiceEffects(
      currentPlayer.currentSpace, 
      currentPlayer.visitType
    );

    let currentState = this.stateService.getGameState();

    // Process each dice effect
    for (const effect of diceEffects) {
      currentState = this.applyDiceEffect(playerId, effect, diceRoll, currentState);
    }

    return currentState;
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
        // Add placeholder cards (in real implementation, these would come from a deck)
        const newCardIds = Array.from({ length: drawCount }, (_, i) => 
          `${cardType}_${Date.now()}_${i}`
        );
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
        const newCardIds = Array.from({ length: replaceCount }, (_, i) => 
          `${cardType}_${Date.now()}_${i}`
        );
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

    // Get movement data for current space
    const movement = this.dataService.getMovement(currentPlayer.currentSpace, currentPlayer.visitType);
    if (!movement) {
      // No movement data - player stays in current space
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