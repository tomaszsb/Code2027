// src/services/GameRulesService.ts

import { IGameRulesService, IDataService, IStateService } from '../types/ServiceContracts';
import { CardType } from '../types/DataTypes';

/**
 * GameRulesService acts as the centralized authority for all game rule validations.
 * This service keeps validation logic centralized and helps other services stay focused
 * on their primary responsibilities.
 */
export class GameRulesService implements IGameRulesService {
  constructor(
    private dataService: IDataService,
    private stateService: IStateService
  ) {}

  /**
   * Validates if a player can move to a specific destination
   * @param playerId - The ID of the player attempting to move
   * @param destination - The destination space name
   * @returns true if the move is valid
   */
  isMoveValid(playerId: string, destination: string): boolean {
    try {
      // Game must be in progress
      if (!this.isGameInProgress()) {
        return false;
      }

      // Player must exist
      const player = this.stateService.getPlayer(playerId);
      if (!player) {
        return false;
      }

      // Get movement data for player's current space
      const movement = this.dataService.getMovement(player.currentSpace, player.visitType);
      if (!movement) {
        return false;
      }

      // Check if destination is in the list of valid destinations
      const validDestinations = this.extractValidDestinations(movement);
      return validDestinations.includes(destination);
    } catch (error) {
      return false;
    }
  }

  /**
   * Validates if a player can play a specific card
   * @param playerId - The ID of the player
   * @param cardId - The ID of the card to play
   * @returns true if the card can be played
   */
  canPlayCard(playerId: string, cardId: string): boolean {
    // Game must be in progress
    if (!this.isGameInProgress()) {
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

    // Get card type to check additional restrictions
    const cardType = this.getCardType(cardId);
    if (!cardType) {
      return false;
    }

    // Some card types may require it to be the player's turn
    if (this.cardRequiresPlayerTurn(cardType)) {
      if (!this.isPlayerTurn(playerId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validates if a player can draw a card of a specific type
   * @param playerId - The ID of the player
   * @param cardType - The type of card to draw
   * @returns true if the player can draw the card
   */
  canDrawCard(playerId: string, cardType: CardType): boolean {
    // Game must be in progress
    if (!this.isGameInProgress()) {
      return false;
    }

    // Player must exist
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return false;
    }

    // Validate card type
    if (!this.isValidCardType(cardType)) {
      return false;
    }

    // Check if player has space for more cards (optional business rule)
    const currentCardCount = this.getPlayerCardCount(playerId, cardType);
    const maxCardsPerType = 10; // Business rule: max 10 cards per type
    
    if (currentCardCount >= maxCardsPerType) {
      return false;
    }

    return true;
  }

  /**
   * Validates if a player can afford a specific cost
   * @param playerId - The ID of the player
   * @param cost - The cost amount
   * @returns true if the player can afford the cost
   */
  canPlayerAfford(playerId: string, cost: number): boolean {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return false;
    }

    return player.money >= cost;
  }

  /**
   * Validates if it's currently a specific player's turn
   * @param playerId - The ID of the player
   * @returns true if it's the player's turn
   */
  isPlayerTurn(playerId: string): boolean {
    const gameState = this.stateService.getGameState();
    return gameState.currentPlayerId === playerId;
  }

  /**
   * Validates if the game is currently in progress
   * @returns true if the game is in the PLAY phase
   */
  isGameInProgress(): boolean {
    const gameState = this.stateService.getGameState();
    return gameState.gamePhase === 'PLAY';
  }

  /**
   * Validates if a player can take any action (combines multiple checks)
   * @param playerId - The ID of the player
   * @returns true if the player can take actions
   */
  canPlayerTakeAction(playerId: string): boolean {
    // Game must be in progress
    if (!this.isGameInProgress()) {
      return false;
    }

    // Player must exist
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return false;
    }

    // For most actions, it should be the player's turn
    // Exception: some cards might be playable out of turn
    return this.isPlayerTurn(playerId);
  }

  /**
   * Extracts valid destinations from movement data
   * @private
   */
  private extractValidDestinations(movement: any): string[] {
    const destinations: string[] = [];
    
    // Handle different movement types
    if (movement.movement_type === 'none') {
      return []; // Terminal space
    }

    // For dice movement, get destinations from dice outcomes
    if (movement.movement_type === 'dice') {
      const diceOutcome = this.dataService.getDiceOutcome(movement.space_name, movement.visit_type);
      if (diceOutcome) {
        if (diceOutcome.roll_1) destinations.push(diceOutcome.roll_1);
        if (diceOutcome.roll_2) destinations.push(diceOutcome.roll_2);
        if (diceOutcome.roll_3) destinations.push(diceOutcome.roll_3);
        if (diceOutcome.roll_4) destinations.push(diceOutcome.roll_4);
        if (diceOutcome.roll_5) destinations.push(diceOutcome.roll_5);
        if (diceOutcome.roll_6) destinations.push(diceOutcome.roll_6);
      }
    } else {
      // For other movement types, get destinations from movement data
      if (movement.destination_1) destinations.push(movement.destination_1);
      if (movement.destination_2) destinations.push(movement.destination_2);
      if (movement.destination_3) destinations.push(movement.destination_3);
      if (movement.destination_4) destinations.push(movement.destination_4);
      if (movement.destination_5) destinations.push(movement.destination_5);
    }

    // Remove duplicates and filter out empty strings
    const filteredDests = destinations.filter(dest => dest && dest.trim() !== '');
    const uniqueDests: string[] = [];
    filteredDests.forEach(dest => {
      if (!uniqueDests.includes(dest)) {
        uniqueDests.push(dest);
      }
    });
    
    return uniqueDests;
  }

  /**
   * Checks if a player owns a specific card
   * @private
   */
  private playerOwnsCard(playerId: string, cardId: string): boolean {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return false;
    }

    // Check all available card types
    const allCards = [
      ...(player.availableCards?.W || []),
      ...(player.availableCards?.B || []),
      ...(player.availableCards?.E || []),
      ...(player.availableCards?.L || []),
      ...(player.availableCards?.I || [])
    ];

    return allCards.includes(cardId);
  }

  /**
   * Gets the type of a card from its ID
   * @private
   */
  private getCardType(cardId: string): CardType | null {
    // Extract card type from card ID (assumes format like "W_001", "B_002", etc.)
    const cardType = cardId.charAt(0) as CardType;
    return this.isValidCardType(cardType) ? cardType : null;
  }

  /**
   * Validates if a card type is valid
   * @private
   */
  private isValidCardType(cardType: string): boolean {
    const validTypes: CardType[] = ['W', 'B', 'E', 'L', 'I'];
    return validTypes.includes(cardType as CardType);
  }

  /**
   * Checks if a card type requires the player's turn to play
   * @private
   */
  private cardRequiresPlayerTurn(cardType: CardType): boolean {
    // Business rule: Most cards require player's turn, but some might be playable anytime
    // For now, assume all cards require player's turn
    return true;
  }

  /**
   * Gets the count of cards a player has of a specific type
   * @private
   */
  private getPlayerCardCount(playerId: string, cardType?: CardType): number {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return 0;
    }

    if (cardType) {
      return player.cards[cardType].length;
    }

    // Return total card count across all types
    return Object.values(player.cards).reduce((total, cards) => total + cards.length, 0);
  }

  /**
   * Checks if a player has met the win condition
   * @param playerId - The ID of the player to check
   * @returns Promise<boolean> - true if the player has won
   */
  async checkWinCondition(playerId: string): Promise<boolean> {
    try {
      // Get the player's current state
      const player = this.stateService.getPlayer(playerId);
      if (!player) {
        return false;
      }

      // Get the space configuration for the player's current space
      const spaceConfig = this.dataService.getGameConfigBySpace(player.currentSpace);
      if (!spaceConfig) {
        return false;
      }

      // Check if the current space is marked as an ending space
      return spaceConfig.is_ending_space === true;
    } catch (error) {
      console.error(`Error checking win condition for player ${playerId}:`, error);
      return false;
    }
  }
}