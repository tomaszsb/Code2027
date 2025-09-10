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

    // Check if deck has cards available (stateful deck system)
    const gameState = this.stateService.getGameState();
    if (!gameState.decks || !gameState.decks[cardType] || gameState.decks[cardType].length === 0) {
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

    // Check if card is in player's hand
    return player.hand ? player.hand.includes(cardId) : false;
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
    if (!player || !player.hand) {
      return 0;
    }

    if (cardType) {
      // Count cards of specific type in player's hand
      return player.hand.filter(cardId => {
        const type = this.getCardType(cardId);
        return type === cardType;
      }).length;
    }

    // Return total card count
    return player.hand.length;
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

  /**
   * Check if the game should end due to turn limit being reached
   * @param turnLimit - Maximum number of turns before game ends (default 50)
   * @returns true if the turn limit has been reached
   */
  checkTurnLimit(turnLimit: number = 50): boolean {
    try {
      const gameState = this.stateService.getGameState();
      const currentTurn = gameState.turn || 0;
      
      if (currentTurn >= turnLimit) {
        console.log(`Turn limit reached: Turn ${currentTurn} >= ${turnLimit}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking turn limit:', error);
      return false;
    }
  }

  /**
   * Check if the game should end for any reason (win condition or turn limit)
   * @param playerId - The ID of the player to check for win condition
   * @param turnLimit - Maximum number of turns before game ends (default 50)
   * @returns Object indicating if game should end and why
   */
  async checkGameEndConditions(playerId: string, turnLimit: number = 50): Promise<{
    shouldEnd: boolean;
    reason: 'win' | 'turn_limit' | null;
    winnerId?: string;
  }> {
    try {
      // Check if player won by reaching ending space
      const playerWon = await this.checkWinCondition(playerId);
      if (playerWon) {
        return {
          shouldEnd: true,
          reason: 'win',
          winnerId: playerId
        };
      }

      // Check if turn limit reached
      const turnLimitReached = this.checkTurnLimit(turnLimit);
      if (turnLimitReached) {
        return {
          shouldEnd: true,
          reason: 'turn_limit'
        };
      }

      return {
        shouldEnd: false,
        reason: null
      };
    } catch (error) {
      console.error('Error checking game end conditions:', error);
      return {
        shouldEnd: false,
        reason: null
      };
    }
  }

  /**
   * Calculates the total project scope for a player based on their Work (W) cards
   * @param playerId - The ID of the player
   * @returns The total cost/value of all W cards owned by the player
   */
  calculateProjectScope(playerId: string): number {
    try {
      const player = this.stateService.getPlayer(playerId);
      if (!player) {
        console.error(`Player ${playerId} not found when calculating project scope`);
        return 0;
      }

      let totalScope = 0;

      // Get all W cards for this player
      const workCards = player.hand.filter(cardId => cardId.startsWith('W'));

      // Calculate total scope by summing up card costs
      for (const cardId of workCards) {
        // Extract base card ID from generated ID (e.g., W111_1756274803252_sezfko0rc_0 -> W111)
        const baseCardId = cardId.split('_')[0];
        const cardData = this.dataService.getCardById(baseCardId);
        if (cardData) {
          // Use cost field from CSV
          const cardCost = cardData.cost || 0;
          totalScope += cardCost;
          console.log(`   ✅ Card ${baseCardId}: ${cardData.card_name} = $${cardCost.toLocaleString()}`);
        } else {
          console.warn(`Card data not found for base card ID: ${baseCardId} (from ${cardId})`);
        }
      }

      return totalScope;
    } catch (error) {
      console.error(`Error calculating project scope for player ${playerId}:`, error);
      return 0;
    }
  }

  /**
   * Calculate a player's final score based on their assets and liabilities
   * @param playerId - The ID of the player
   * @returns The calculated score
   */
  calculatePlayerScore(playerId: string): number {
    try {
      const player = this.stateService.getPlayer(playerId);
      if (!player) {
        console.error(`Player ${playerId} not found when calculating score`);
        return 0;
      }

      let score = 0;

      // Add player's final money
      score += player.money;

      // Add player's project scope (using existing calculateProjectScope method)
      score += this.calculateProjectScope(playerId);

      // Subtract penalty for loans (each loan costs 5000 points)
      score -= player.loans.length * 5000;

      // Subtract penalty for time spent (each time unit costs 1000 points)
      score -= player.timeSpent * 1000;

      console.log(`Score calculation for ${player.name}:`);
      console.log(`  Money: +$${player.money.toLocaleString()}`);
      console.log(`  Project Scope: +$${this.calculateProjectScope(playerId).toLocaleString()}`);
      console.log(`  Loan Penalty: -$${(player.loans.length * 5000).toLocaleString()} (${player.loans.length} loans)`);
      console.log(`  Time Penalty: -$${(player.timeSpent * 1000).toLocaleString()} (${player.timeSpent} time units)`);
      console.log(`  Final Score: $${score.toLocaleString()}`);

      return Math.max(0, score); // Ensure score doesn't go negative
    } catch (error) {
      console.error(`Error calculating score for player ${playerId}:`, error);
      return 0;
    }
  }

  /**
   * Determine the winner of the game based on highest score
   * @returns The player ID of the winner, or null if no winner can be determined
   */
  determineWinner(): string | null {
    try {
      const gameState = this.stateService.getGameState();
      const players = gameState.players;

      if (players.length === 0) {
        return null;
      }

      let highestScore = -1;
      let winnerId: string | null = null;

      // Calculate scores for all players and update their score property
      for (const player of players) {
        const playerScore = this.calculatePlayerScore(player.id);
        
        // Update the player's score in the game state
        this.stateService.updatePlayer({
          id: player.id,
          score: playerScore
        });

        // Track the highest score
        if (playerScore > highestScore) {
          highestScore = playerScore;
          winnerId = player.id;
        }
      }

      console.log(`Winner determined: Player ${winnerId} with score $${highestScore.toLocaleString()}`);
      return winnerId;
    } catch (error) {
      console.error('Error determining winner:', error);
      return null;
    }
  }
}