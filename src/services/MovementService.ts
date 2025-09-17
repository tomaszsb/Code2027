// src/services/MovementService.ts

import { IMovementService, IDataService, IStateService, IChoiceService, ILoggingService } from '../types/ServiceContracts';
import { GameState, Player } from '../types/StateTypes';
import { Movement, VisitType } from '../types/DataTypes';

/**
 * MovementService handles all player movement logic.
 * This is a stateless service that orchestrates movement validation and execution.
 */
export class MovementService implements IMovementService {
  constructor(
    private dataService: IDataService,
    private stateService: IStateService,
    private choiceService: IChoiceService,
    private loggingService: ILoggingService
  ) {}

  /**
   * Gets all valid destination spaces for a player from their current position
   * @param playerId - The ID of the player
   * @returns Array of valid destination space names
   * @throws Error if player not found or no movement data available
   */
  getValidMoves(playerId: string): string[] {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player with ID ${playerId} not found`);
    }

    const movement = this.dataService.getMovement(player.currentSpace, player.visitType);
    if (!movement) {
      throw new Error(`No movement data found for space ${player.currentSpace} with visit type ${player.visitType}`);
    }

    if (movement.movement_type === 'dice') {
      return this.getDiceDestinations(player.currentSpace, player.visitType);
    }

    if (movement.movement_type === 'logic') {
      return this.getLogicDestinations(playerId, movement);
    }

    return this.extractDestinationsFromMovement(movement);
  }

  /**
   * Moves a player to a destination space
   * @param playerId - The ID of the player to move
   * @param destinationSpace - The target space name
   * @returns Updated game state after the move
   * @throws Error if move is invalid or player not found
   */
  async movePlayer(playerId: string, destinationSpace: string): Promise<GameState> {
    const validMoves = this.getValidMoves(playerId);
    
    if (!validMoves.includes(destinationSpace)) {
      throw new Error(`Invalid move: ${destinationSpace} is not a valid destination from current position`);
    }

    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player with ID ${playerId} not found`);
    }

    // Store current space for logging
    const sourceSpace = player.currentSpace;

    // Determine visit type for destination space
    const newVisitType: VisitType = this.hasPlayerVisitedSpace(player, destinationSpace)
      ? 'Subsequent'
      : 'First';

    // Update visited spaces array if this is a first visit
    const updatedVisitedSpaces = newVisitType === 'First'
      ? [...player.visitedSpaces, destinationSpace]
      : player.visitedSpaces;

    // Update player's position
    const updatedState = this.stateService.updatePlayer({
      id: playerId,
      currentSpace: destinationSpace,
      visitType: newVisitType,
      visitedSpaces: updatedVisitedSpaces
    });

    // Log the movement
    this.loggingService.info(`Moved from ${sourceSpace} to ${destinationSpace}`, {
      playerId: playerId,
      playerName: player.name,
      action: 'movePlayer',
      sourceSpace: sourceSpace,
      destinationSpace: destinationSpace,
      visitType: newVisitType
    });

    // Note: Space effects are processed by TurnService.processTurnEffects, not here
    // MovementService only handles the physical movement of players between spaces

    // Check if the destination space has multiple movement options
    // If so, proactively create a movement choice for TurnControls integration
    try {
      const newValidMoves = this.getValidMoves(playerId);
      if (newValidMoves.length > 1) {
        console.log(`🚶 Player ${player.name} arrived at ${destinationSpace} with ${newValidMoves.length} movement options - creating choice`);

        // Create movement choice without awaiting (fire and forget)
        // This will set awaitingChoice in the game state for TurnControls to detect
        this.createMovementChoiceAsync(playerId, newValidMoves);
      }
    } catch (error) {
      console.warn(`Warning: Could not check for movement options at ${destinationSpace}:`, error);
    }

    return updatedState;
  }

  /**
   * Extracts valid destinations from movement data
   * @private
   */
  private extractDestinationsFromMovement(movement: Movement): string[] {
    // For 'none' movement type, return empty array (terminal space)
    if (movement.movement_type === 'none') {
      return [];
    }

    const destinations: string[] = [];
    
    // Collect all non-empty values from destination_1 through destination_5
    if (movement.destination_1) destinations.push(movement.destination_1);
    if (movement.destination_2) destinations.push(movement.destination_2);
    if (movement.destination_3) destinations.push(movement.destination_3);
    if (movement.destination_4) destinations.push(movement.destination_4);
    if (movement.destination_5) destinations.push(movement.destination_5);

    return destinations;
  }

  /**
   * Gets destinations for dice-based movement
   * @private
   */
  private getDiceDestinations(spaceName: string, visitType: VisitType): string[] {
    const diceOutcome = this.dataService.getDiceOutcome(spaceName, visitType);
    if (!diceOutcome) {
      return [];
    }

    const destinations: string[] = [];
    if (diceOutcome.roll_1) destinations.push(diceOutcome.roll_1);
    if (diceOutcome.roll_2) destinations.push(diceOutcome.roll_2);
    if (diceOutcome.roll_3) destinations.push(diceOutcome.roll_3);
    if (diceOutcome.roll_4) destinations.push(diceOutcome.roll_4);
    if (diceOutcome.roll_5) destinations.push(diceOutcome.roll_5);
    if (diceOutcome.roll_6) destinations.push(diceOutcome.roll_6);

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
   * Gets the destination for a dice-based movement
   * @param spaceName - The current space name
   * @param visitType - The visit type (First/Subsequent)
   * @param diceRoll - The dice roll result (2-12)
   * @returns The destination space name or null if no destination for this roll
   */
  getDiceDestination(spaceName: string, visitType: VisitType, diceRoll: number): string | null {
    // Validate dice roll range first (before calling dataService)
    if (diceRoll < 2 || diceRoll > 12) {
      return null;
    }

    const diceOutcome = this.dataService.getDiceOutcome(spaceName, visitType);
    if (!diceOutcome) {
      return null;
    }

    // Map dice roll total to appropriate roll field
    // For two-dice games, we typically map the sum modulo 6, or use a lookup table
    // This is a simplified mapping - actual game rules may vary
    
    // Map dice total (2-12) to roll fields (1-6)
    // Simple modulo mapping: (diceRoll - 2) % 6 + 1 gives us 1-6
    const rollIndex = ((diceRoll - 2) % 6) + 1;
    const rollField = `roll_${rollIndex}` as keyof typeof diceOutcome;

    const destination = diceOutcome[rollField];
    return destination && destination.trim() !== '' ? destination : null;
  }

  /**
   * Handles movement choices by presenting options and awaiting player selection
   * @param playerId - The ID of the player making the choice
   * @returns Promise that resolves with the updated game state after movement
   */
  async handleMovementChoice(playerId: string): Promise<GameState> {
    const validMoves = this.getValidMoves(playerId);
    
    if (validMoves.length === 0) {
      throw new Error(`No valid moves available for player ${playerId}`);
    }
    
    if (validMoves.length === 1) {
      // Only one option - move automatically without presenting a choice
      console.log(`🚶 Auto-moving player ${playerId} to ${validMoves[0]} (only option)`);
      return await this.movePlayer(playerId, validMoves[0]);
    }

    // Multiple options - present choice to player
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const options = validMoves.map(destination => ({
      id: destination,
      label: destination
    }));

    const prompt = `Choose your destination from ${player.currentSpace}:`;
    
    console.log(`🎯 Presenting movement choice to ${player.name}: ${validMoves.length} options`);
    
    // Use ChoiceService to handle the choice
    const selectedDestination = await this.choiceService.createChoice(
      playerId,
      'MOVEMENT',
      prompt,
      options
    );

    console.log(`✅ Player ${player.name} chose to move to: ${selectedDestination}`);
    
    // Move the player to the selected destination
    return await this.movePlayer(playerId, selectedDestination);
  }



  /**
   * Checks if a player has previously visited a space
   * @private
   */
  private hasPlayerVisitedSpace(player: Player, spaceName: string): boolean {
    // Use the proper visitedSpaces tracking instead of faulty heuristics
    return player.visitedSpaces.includes(spaceName);
  }

  /**
   * Gets valid destinations for logic-based movement by evaluating conditions
   * @private
   */
  private getLogicDestinations(playerId: string, movement: Movement): string[] {
    const validDestinations: string[] = [];
    
    // Check each destination and its corresponding condition
    const destinationConditionPairs = [
      { destination: movement.destination_1, condition: movement.condition_1 },
      { destination: movement.destination_2, condition: movement.condition_2 },
      { destination: movement.destination_3, condition: movement.condition_3 },
      { destination: movement.destination_4, condition: movement.condition_4 },
      { destination: movement.destination_5, condition: movement.condition_5 }
    ];

    for (const pair of destinationConditionPairs) {
      if (pair.destination && this.evaluateCondition(playerId, pair.condition)) {
        validDestinations.push(pair.destination);
      }
    }

    console.log(`🧠 Logic-based movement for player ${playerId}: ${validDestinations.length} valid destinations`);
    return validDestinations;
  }

  /**
   * Evaluates a movement condition against the current player's state
   * @private
   */
  private evaluateCondition(playerId: string, condition: string | undefined): boolean {
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

      // Project scope conditions
      if (conditionLower === 'scope_le_4m') {
        const projectScope = this.calculateProjectScope(player);
        return projectScope <= 4000000; // $4M
      }
      
      if (conditionLower === 'scope_gt_4m') {
        const projectScope = this.calculateProjectScope(player);
        return projectScope > 4000000; // $4M
      }

      // Money-based conditions
      if (conditionLower.startsWith('money_')) {
        const playerMoney = player.money || 0;
        
        if (conditionLower === 'money_le_1m') {
          return playerMoney <= 1000000; // $1M
        }
        if (conditionLower === 'money_gt_1m') {
          return playerMoney > 1000000; // $1M
        }
        if (conditionLower === 'money_le_2m') {
          return playerMoney <= 2000000; // $2M
        }
        if (conditionLower === 'money_gt_2m') {
          return playerMoney > 2000000; // $2M
        }
      }

      // Time-based conditions
      if (conditionLower.startsWith('time_')) {
        const timeSpent = player.timeSpent || 0;
        
        if (conditionLower === 'time_le_5') {
          return timeSpent <= 5;
        }
        if (conditionLower === 'time_gt_5') {
          return timeSpent > 5;
        }
        if (conditionLower === 'time_le_10') {
          return timeSpent <= 10;
        }
        if (conditionLower === 'time_gt_10') {
          return timeSpent > 10;
        }
      }

      // Card count conditions
      if (conditionLower.startsWith('cards_')) {
        const handSize = player.hand?.length || 0;
        
        if (conditionLower === 'cards_le_3') {
          return handSize <= 3;
        }
        if (conditionLower === 'cards_gt_3') {
          return handSize > 3;
        }
        if (conditionLower === 'cards_le_5') {
          return handSize <= 5;
        }
        if (conditionLower === 'cards_gt_5') {
          return handSize > 5;
        }
      }

      console.warn(`🧠 Unknown movement condition: ${condition}`);
      return false;
      
    } catch (error) {
      console.error(`🧠 Error evaluating movement condition "${condition}":`, error);
      return false;
    }
  }

  /**
   * Calculate the player's current project scope based on Work cards
   * @private
   */
  private calculateProjectScope(player: Player): number {
    // This mirrors the logic from TurnService.calculateProjectScope
    // We need to count the Work cards in the player's hand
    let projectScope = 0;
    const hand = player.hand || [];

    // Count W cards to determine scope
    const workCards = hand.filter(cardId => cardId.startsWith('W'));

    // Each Work card represents a certain amount of project scope
    // Using simplified logic: each W card = $500K scope
    projectScope = workCards.length * 500000;

    return projectScope;
  }

  /**
   * Creates a movement choice asynchronously for TurnControls integration
   * @private
   */
  private createMovementChoiceAsync(playerId: string, validMoves: string[]): void {
    // Run asynchronously to avoid blocking the movement operation
    setTimeout(async () => {
      try {
        const player = this.stateService.getPlayer(playerId);
        if (!player) {
          console.warn(`Player ${playerId} not found when creating movement choice`);
          return;
        }

        const options = validMoves.map(destination => ({
          id: destination,
          label: destination
        }));

        const prompt = `Choose your destination from ${player.currentSpace}:`;

        console.log(`🎯 Creating movement choice for ${player.name}: ${validMoves.length} options`);

        // Set the movement choice in the game state for TurnControls to display
        // Note: We don't await this since it's meant to be displayed in TurnControls
        await this.choiceService.createChoice(
          playerId,
          'MOVEMENT',
          prompt,
          options
        );

        console.log(`✅ Movement choice created successfully for ${player.name}`);
      } catch (error) {
        console.error('Error creating movement choice:', error);
      }
    }, 0); // No delay - run immediately on next tick
  }
}