// src/services/MovementService.ts

import { IMovementService, IDataService, IStateService, IChoiceService } from '../types/ServiceContracts';
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
    private choiceService: IChoiceService
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

    return this.extractDestinationsFromMovement(movement);
  }

  /**
   * Moves a player to a destination space
   * @param playerId - The ID of the player to move
   * @param destinationSpace - The target space name
   * @returns Updated game state after the move
   * @throws Error if move is invalid or player not found
   */
  movePlayer(playerId: string, destinationSpace: string): GameState {
    const validMoves = this.getValidMoves(playerId);
    
    if (!validMoves.includes(destinationSpace)) {
      throw new Error(`Invalid move: ${destinationSpace} is not a valid destination from current position`);
    }

    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player with ID ${playerId} not found`);
    }

    // Determine visit type for destination space
    const newVisitType: VisitType = this.hasPlayerVisitedSpace(player, destinationSpace) 
      ? 'Subsequent' 
      : 'First';

    // Update player's position
    const updatedState = this.stateService.updatePlayer({
      id: playerId,
      currentSpace: destinationSpace,
      visitType: newVisitType
    });

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
      return this.movePlayer(playerId, validMoves[0]);
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
    return this.movePlayer(playerId, selectedDestination);
  }

  /**
   * Checks if a player has previously visited a space
   * @private
   */
  private hasPlayerVisitedSpace(player: Player, spaceName: string): boolean {
    // For now, we'll use a simple heuristic:
    // If the player is not at their starting position, they've visited other spaces
    // This is a simplified implementation - in a full game, we'd track visit history
    
    // Get starting spaces from game config
    const allSpaces = this.dataService.getAllSpaces();
    const startingSpaces = allSpaces
      .filter(space => space.config.is_starting_space)
      .map(space => space.name);
    
    // If player is currently at a starting space and the destination is different,
    // it's likely their first visit to the destination
    if (startingSpaces.includes(player.currentSpace) && player.currentSpace !== spaceName) {
      return false;
    }
    
    // For any other case, assume it's a subsequent visit
    // In a full implementation, we'd maintain a visited spaces history for each player
    return true;
  }
}