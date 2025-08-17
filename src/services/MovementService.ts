// src/services/MovementService.ts

import { IMovementService, IDataService, IStateService } from '../types/ServiceContracts';
import { GameState, Player } from '../types/StateTypes';
import { Movement, VisitType } from '../types/DataTypes';

/**
 * MovementService handles all player movement logic.
 * This is a stateless service that orchestrates movement validation and execution.
 */
export class MovementService implements IMovementService {
  constructor(
    private dataService: IDataService,
    private stateService: IStateService
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
    const destinations: string[] = [];
    
    // Check all destination fields and collect non-empty values
    if (movement.destination_1) destinations.push(movement.destination_1);
    if (movement.destination_2) destinations.push(movement.destination_2);
    if (movement.destination_3) destinations.push(movement.destination_3);
    if (movement.destination_4) destinations.push(movement.destination_4);
    if (movement.destination_5) destinations.push(movement.destination_5);

    // For 'none' movement type, return empty array (terminal space)
    if (movement.movement_type === 'none') {
      return [];
    }

    // For 'dice' movement type, we need to get dice outcomes
    if (movement.movement_type === 'dice') {
      return this.getDiceDestinations(movement.space_name, movement.visit_type);
    }

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
   * Resolves a player choice by moving them to the chosen destination
   * @param destination - The chosen destination space name
   * @returns Updated game state after the move and turn advancement
   * @throws Error if no choice is awaiting or destination is invalid
   */
  resolveChoice(destination: string): GameState {
    const gameState = this.stateService.getGameState();
    
    if (!gameState.awaitingChoice) {
      throw new Error('No choice is currently awaiting resolution');
    }

    const { playerId, options } = gameState.awaitingChoice;
    
    if (!options.includes(destination)) {
      throw new Error(`Invalid choice: ${destination} is not among the available options`);
    }

    this.movePlayer(playerId, destination);
    this.stateService.clearAwaitingChoice();
    
    // Don't advance turn - player's turn continues after resolving choice
    return this.stateService.getGameState();
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