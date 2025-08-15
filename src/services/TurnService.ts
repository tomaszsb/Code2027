import { ITurnService, IDataService, IStateService } from '../types/ServiceContracts';
import { GameState, Player } from '../types/StateTypes';
import { DiceEffect } from '../types/DataTypes';

export class TurnService implements ITurnService {
  private readonly dataService: IDataService;
  private readonly stateService: IStateService;

  constructor(dataService: IDataService, stateService: IStateService) {
    this.dataService = dataService;
    this.stateService = stateService;
  }

  takeTurn(playerId: string): GameState {
    // Validation: Check if it's the player's turn
    if (!this.canPlayerTakeTurn(playerId)) {
      throw new Error(`It is not player ${playerId}'s turn`);
    }

    // Get current player data
    const currentPlayer = this.stateService.getPlayer(playerId);
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Roll dice
    const diceRoll = this.rollDice();

    // Process turn effects based on dice roll
    const updatedState = this.processTurnEffects(playerId, diceRoll);

    // Advance turn counter and move to next player
    const advancedState = this.stateService.advanceTurn();
    const nextPlayerState = this.stateService.nextPlayer();

    return nextPlayerState;
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
}