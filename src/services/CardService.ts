import { ICardService, IDataService, IStateService } from '../types/ServiceContracts';
import { GameState, Player } from '../types/StateTypes';
import { CardType } from '../types/DataTypes';

export class CardService implements ICardService {
  private readonly dataService: IDataService;
  private readonly stateService: IStateService;

  constructor(dataService: IDataService, stateService: IStateService) {
    this.dataService = dataService;
    this.stateService = stateService;
  }

  // Card validation methods
  canPlayCard(playerId: string, cardId: string): boolean {
    const gameState = this.stateService.getGameState();
    
    // Game must be in PLAY phase
    if (gameState.gamePhase !== 'PLAY') {
      return false;
    }

    // Player must exist
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return false;
    }

    // Player must own the card
    if (!this.playerOwnsCard(playerId, cardId)) {
      return false;
    }

    // It must be the player's turn (for some card types)
    const cardType = this.getCardType(cardId);
    if (cardType && this.requiresPlayerTurn(cardType)) {
      if (gameState.currentPlayerId !== playerId) {
        return false;
      }
    }

    return true;
  }

  isValidCardType(cardType: string): boolean {
    const validTypes: CardType[] = ['W', 'B', 'E', 'L', 'I'];
    return validTypes.includes(cardType as CardType);
  }

  playerOwnsCard(playerId: string, cardId: string): boolean {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return false;
    }

    // Check all card types for the card ID
    for (const cardType of Object.keys(player.cards) as CardType[]) {
      if (player.cards[cardType].includes(cardId)) {
        return true;
      }
    }

    return false;
  }

  // Card management methods
  playCard(playerId: string, cardId: string): GameState {
    // Validate the card can be played
    if (!this.canPlayCard(playerId, cardId)) {
      throw new Error(`Player ${playerId} cannot play card ${cardId}`);
    }

    // Remove the card from player's hand
    let updatedState = this.removeCard(playerId, cardId);

    // Apply card effects
    updatedState = this.applyCardEffects(playerId, cardId);

    return updatedState;
  }

  drawCards(playerId: string, cardType: CardType, count: number): GameState {
    if (!this.isValidCardType(cardType)) {
      throw new Error(`Invalid card type: ${cardType}`);
    }

    if (count <= 0) {
      return this.stateService.getGameState();
    }

    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Generate new card IDs
    const newCards = Array.from({ length: count }, (_, i) => 
      `${cardType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`
    );

    // Update player's cards
    const updatedCards = {
      ...player.cards,
      [cardType]: [...player.cards[cardType], ...newCards]
    };

    return this.stateService.updatePlayer({
      id: playerId,
      cards: updatedCards
    });
  }

  removeCard(playerId: string, cardId: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (!this.playerOwnsCard(playerId, cardId)) {
      throw new Error(`Player ${playerId} does not own card ${cardId}`);
    }

    // Find which card type the card belongs to and remove it
    const updatedCards = { ...player.cards };
    for (const cardType of Object.keys(updatedCards) as CardType[]) {
      const cardIndex = updatedCards[cardType].indexOf(cardId);
      if (cardIndex !== -1) {
        updatedCards[cardType] = [
          ...updatedCards[cardType].slice(0, cardIndex),
          ...updatedCards[cardType].slice(cardIndex + 1)
        ];
        break;
      }
    }

    return this.stateService.updatePlayer({
      id: playerId,
      cards: updatedCards
    });
  }

  replaceCard(playerId: string, oldCardId: string, newCardType: CardType): GameState {
    if (!this.isValidCardType(newCardType)) {
      throw new Error(`Invalid card type: ${newCardType}`);
    }

    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (!this.playerOwnsCard(playerId, oldCardId)) {
      throw new Error(`Player ${playerId} does not own card ${oldCardId}`);
    }

    // Remove the old card and add a new one
    let updatedState = this.removeCard(playerId, oldCardId);
    updatedState = this.drawCards(playerId, newCardType, 1);

    return updatedState;
  }

  // Card information methods
  getCardType(cardId: string): CardType | null {
    // Extract card type from card ID format: "TYPE_timestamp_random_index"
    const cardTypePart = cardId.split('_')[0];
    if (this.isValidCardType(cardTypePart)) {
      return cardTypePart as CardType;
    }
    
    return null;
  }

  getPlayerCards(playerId: string, cardType?: CardType): string[] {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return [];
    }

    if (cardType) {
      if (!this.isValidCardType(cardType)) {
        return [];
      }
      return [...player.cards[cardType]];
    }

    // Return all cards if no specific type requested
    const allCards: string[] = [];
    for (const type of Object.keys(player.cards) as CardType[]) {
      allCards.push(...player.cards[type]);
    }
    return allCards;
  }

  getPlayerCardCount(playerId: string, cardType?: CardType): number {
    return this.getPlayerCards(playerId, cardType).length;
  }

  // Card effect methods
  applyCardEffects(playerId: string, cardId: string): GameState {
    const cardType = this.getCardType(cardId);
    if (!cardType) {
      return this.stateService.getGameState();
    }

    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Apply effects based on card type
    switch (cardType) {
      case 'W': // Work cards - typically add money
        return this.applyWorkCardEffect(playerId);
      
      case 'B': // Business cards - typically add more money
        return this.applyBusinessCardEffect(playerId);
      
      case 'E': // Education cards - typically reduce time or add skills
        return this.applyEducationCardEffect(playerId);
      
      case 'L': // Life cards - various effects
        return this.applyLifeCardEffect(playerId);
      
      case 'I': // Investment cards - typically add money over time
        return this.applyInvestmentCardEffect(playerId);
      
      default:
        console.warn(`Unknown card type: ${cardType}`);
        return this.stateService.getGameState();
    }
  }

  // Private helper methods
  private requiresPlayerTurn(cardType: CardType): boolean {
    // Some card types might require it to be the player's turn
    // For now, assume all cards can be played anytime during PLAY phase
    return false;
  }

  private applyWorkCardEffect(playerId: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Work cards typically add a base amount of money
    const moneyGain = 50; // Base work card value
    
    return this.stateService.updatePlayer({
      id: playerId,
      money: player.money + moneyGain
    });
  }

  private applyBusinessCardEffect(playerId: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Business cards typically add more money than work cards
    const moneyGain = 150; // Business card value
    
    return this.stateService.updatePlayer({
      id: playerId,
      money: player.money + moneyGain
    });
  }

  private applyEducationCardEffect(playerId: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Education cards typically reduce time (improve efficiency)
    const timeReduction = 1;
    
    return this.stateService.updatePlayer({
      id: playerId,
      time: Math.max(0, player.time - timeReduction)
    });
  }

  private applyLifeCardEffect(playerId: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Life cards have varied effects - for now, add some money and time
    const moneyGain = 25;
    const timeGain = 2;
    
    return this.stateService.updatePlayer({
      id: playerId,
      money: player.money + moneyGain,
      time: player.time + timeGain
    });
  }

  private applyInvestmentCardEffect(playerId: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Investment cards typically multiply existing money
    const multiplier = 0.1; // 10% return
    const moneyGain = Math.floor(player.money * multiplier);
    
    return this.stateService.updatePlayer({
      id: playerId,
      money: player.money + moneyGain
    });
  }
}