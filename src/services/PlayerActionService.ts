import { IPlayerActionService, IDataService, IStateService, IGameRulesService, IMovementService, ITurnService, IEffectEngineService } from '../types/ServiceContracts';
import { EffectFactory } from '../utils/EffectFactory';
import { EffectContext } from '../types/EffectTypes';

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
    private turnService: ITurnService,
    private effectEngineService: IEffectEngineService
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
      console.log('SERVICE: playCard function has started.');
      console.log(`🎮 PLAYER_ACTION: Player ${playerId} attempting to play card ${cardId}`);

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

      console.log(`🎴 Card being played: ${card.card_name} (${card.card_id})`);

      // 3. Validate the action using GameRulesService
      const canPlayCard = this.gameRulesService.canPlayCard(playerId, cardId);
      
      if (!canPlayCard) {
        throw new Error(`Player '${player.name}' cannot play card '${card.card_name}'. Validation failed.`);
      }

      // 3.5. Validate player owns the card in their hand
      const playerCardType = card.card_type;
      const playerCards = player.availableCards[playerCardType] || [];
      
      if (!playerCards.includes(cardId)) {
        throw new Error(`Player '${player.name}' does not have card '${card.card_name}' in their ${playerCardType} hand`);
      }

      // 4. Validate player can afford the card cost (Effect Engine will handle the deduction)
      if (card.cost !== undefined && card.cost > 0) {
        const canAfford = this.gameRulesService.canPlayerAfford(playerId, card.cost);
        
        if (!canAfford) {
          throw new Error(`Player '${player.name}' cannot afford card '${card.card_name}'. Cost: $${card.cost}, Available: $${player.money}`);
        }
      }

      // 5. Generate effects from the card using EffectFactory
      const effects = EffectFactory.createEffectsFromCard(card, playerId);
      console.log(`🏭 Generated ${effects.length} effects from card ${card.card_name}`);

      // 6. Create effect processing context
      const effectContext: EffectContext = {
        source: `player_action:card_play`,
        playerId: playerId,
        triggerEvent: 'CARD_PLAY',
        metadata: {
          cardId: cardId,
          cardName: card.card_name,
          cardType: card.card_type,
          playerName: player.name
        }
      };

      // 7. Process all effects through the Effect Engine
      console.log(`🔧 Processing card effects through Effect Engine...`);
      console.log('SERVICE: About to wait for Effect Engine...');
      const processingResult = await this.effectEngineService.processEffects(effects, effectContext);
      console.log('SERVICE: Effect Engine has finished.');
      
      if (!processingResult.success) {
        throw new Error(`Failed to process card effects: ${processingResult.errors.join(', ')}`);
      }

      console.log(`✅ Card effects processed successfully: ${processingResult.successfulEffects}/${processingResult.totalEffects} effects completed`);

      // 8. The Effect Engine has now handled all card effects including:
      //    - Card cost deduction (via RESOURCE_CHANGE effects from EffectFactory)
      //    - Money/time changes (via card-specific effects)
      //    - Drawing additional cards (via CARD_DRAW effects)
      //    - Loan amounts (via expanded card mechanics)
      //    - Any other card-specific effects

      // TODO: We still need to handle card removal from hand
      // This should probably be done after successful effect processing
      // For now, let's remove the card manually since the EffectFactory doesn't include this
      const updatedCards = { ...player.availableCards };
      const cardType = card.card_type;
      
      if (updatedCards[cardType] && updatedCards[cardType].includes(cardId)) {
        updatedCards[cardType] = updatedCards[cardType].filter(id => id !== cardId);
        
        this.stateService.updatePlayer({
          id: playerId,
          availableCards: updatedCards
        });
        
        console.log(`🗂️ Removed card ${cardId} from player's ${cardType} collection`);
      }

      console.log(`🎉 Card play complete for ${card.card_name}`);

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
   * @returns Promise resolving to dice roll result with single die value
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

      // 2. Generate single die roll (1-6) - matching CSV data expectations
      const diceRoll = Math.floor(Math.random() * 6) + 1;
      
      // Safety check - dice should never be 0 or greater than 6
      if (diceRoll < 1 || diceRoll > 6) {
        console.error(`Invalid dice roll generated in PlayerActionService: ${diceRoll}`);
        throw new Error(`Invalid dice roll: ${diceRoll}. Please try rolling again.`);
      }
      
      // Maintain interface compatibility by setting both roll1 and roll2 to the same value
      const diceResult = { roll1: diceRoll, roll2: diceRoll, total: diceRoll };

      // 3. Update player state with dice roll result
      this.stateService.updatePlayer({
        id: playerId,
        lastDiceRoll: diceResult
      });

      // 4. Process turn effects based on dice roll result (space effects, dice effects, etc.)
      // This must happen before movement as effects might alter movement conditions
      this.turnService.processTurnEffects(playerId, diceResult.total);

      // 5. Trigger movement based on dice roll
      await this.handlePlayerMovement(playerId, diceResult.total);

      // 6. Mark that the player has moved this turn (enables End Turn button)
      this.stateService.setPlayerHasMoved();

      // 7. Dice roll and movement complete - turn ending is now handled separately

      // 8. Return the dice roll result
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

  /**
   * Ends the current player's turn and advances to the next player.
   * This method should be called explicitly after all player actions are complete.
   * 
   * @throws Error if ending the turn fails
   */
  public async endTurn(): Promise<void> {
    try {
      await this.turnService.endTurn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to end turn: ${errorMessage}`);
    }
  }
}