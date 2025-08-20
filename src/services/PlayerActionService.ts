import { IPlayerActionService, IDataService, IStateService, IGameRulesService, IMovementService, ITurnService } from '../types/ServiceContracts';

/**
 * PlayerActionService handles player actions and orchestrates interactions between multiple services.
 * This service acts as the "brain" of the game, coordinating player intentions with game state updates.
 */
export class PlayerActionService implements IPlayerActionService {
  constructor(
    private dataService: IDataService,
    private stateService: IStateService,
    private gameRulesService: IGameRulesService,
    private movementService: IMovementService,
    private turnService: ITurnService
  ) {}

  /**
   * Handles a player playing a card from their hand.
   * 
   * @param playerId - The ID of the player attempting to play the card
   * @param cardId - The ID of the card being played
   * @throws Error if the action is invalid (validation failures)
   */
  public async playCard(playerId: string, cardId: string): Promise<void> {
    try {
      // 1. Get current game state and player
      const gameState = this.stateService.getGameState();
      const player = this.stateService.getPlayer(playerId);
      
      if (!player) {
        throw new Error(`Player with ID '${playerId}' not found`);
      }

      // 2. Get card data from DataService
      const card = this.dataService.getCardById(cardId);
      
      if (!card) {
        throw new Error(`Card with ID '${cardId}' not found`);
      }

      // 3. Validate the action using GameRulesService
      const canPlayCard = this.gameRulesService.canPlayCard(playerId, cardId);
      
      if (!canPlayCard) {
        throw new Error(`Player '${player.name}' cannot play card '${card.card_name}'. Validation failed.`);
      }

      // 4. Validate player can afford the card cost
      if (card.cost !== undefined && card.cost > 0) {
        const canAfford = this.gameRulesService.canPlayerAfford(playerId, card.cost);
        
        if (!canAfford) {
          throw new Error(`Player '${player.name}' cannot afford card '${card.card_name}'. Cost: $${card.cost}, Available: $${player.money}`);
        }
      }

      // 5. Update player state - remove card from hand and deduct cost
      const updatedCards = { ...player.cards };
      const cardType = card.card_type;
      const cardIndex = updatedCards[cardType].indexOf(cardId);
      
      if (cardIndex === -1) {
        throw new Error(`Player '${player.name}' does not have card '${card.card_name}' in their ${cardType} hand`);
      }

      // Remove the card from the player's hand
      updatedCards[cardType] = updatedCards[cardType].filter(id => id !== cardId);

      // Calculate new money after cost deduction
      const newMoney = player.money - (card.cost || 0);

      // Update the player state
      this.stateService.updatePlayer({
        id: playerId,
        money: newMoney,
        cards: updatedCards
      });

      // 6. Card effects will be processed by a dedicated effect system in future phases
      // For now, the card play is complete after state update

      // 7. End the player's turn and advance to next player
      await this.turnService.endTurn();

    } catch (error) {
      // Re-throw with additional context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to play card: ${errorMessage}`);
    }
  }

  /**
   * Handles a player rolling dice.
   * 
   * @param playerId - The ID of the player rolling the dice
   * @returns Promise resolving to dice roll result with individual rolls and total
   * @throws Error if the action is invalid (player not found, etc.)
   */
  public async rollDice(playerId: string): Promise<{ roll1: number; roll2: number; total: number }> {
    try {
      // 1. Get current game state and player
      const gameState = this.stateService.getGameState();
      const player = this.stateService.getPlayer(playerId);
      
      if (!player) {
        throw new Error(`Player with ID '${playerId}' not found`);
      }

      // 2. Generate two random dice rolls (1-6)
      const roll1 = Math.floor(Math.random() * 6) + 1;
      const roll2 = Math.floor(Math.random() * 6) + 1;
      const total = roll1 + roll2;

      const diceResult = { roll1, roll2, total };

      // 3. Update player state with dice roll result
      this.stateService.updatePlayer({
        id: playerId,
        lastDiceRoll: diceResult
      });

      // 4. Trigger movement based on dice roll
      await this.handlePlayerMovement(playerId, diceResult.total);

      // 5. End the player's turn and advance to next player
      await this.turnService.endTurn();

      // 6. Return the dice roll result
      return diceResult;

    } catch (error) {
      // Re-throw with additional context
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to roll dice: ${errorMessage}`);
    }
  }

  /**
   * Handles player movement after dice roll.
   * 
   * @private
   * @param playerId - The ID of the player to move
   * @param diceTotal - The total dice roll result
   * @throws Error if movement fails
   */
  private async handlePlayerMovement(playerId: string, diceTotal: number): Promise<void> {
    try {
      const player = this.stateService.getPlayer(playerId);
      if (!player) {
        throw new Error(`Player with ID '${playerId}' not found`);
      }

      // Check if this space has movement options
      const validMoves = this.movementService.getValidMoves(playerId);
      
      if (validMoves.length === 0) {
        // Terminal space - no movement possible
        return;
      }

      // For dice-based movement, find the destination based on dice roll
      const destination = this.movementService.getDiceDestination(
        player.currentSpace, 
        player.visitType, 
        diceTotal
      );

      if (destination) {
        // Move player to the determined destination
        this.movementService.movePlayer(playerId, destination);
      }
      // If no destination found for this dice roll, player stays in current space

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to handle player movement: ${errorMessage}`);
    }
  }
}