import { ICardService, IDataService, IStateService, IResourceService, IEffectEngineService, ILoggingService } from '../types/ServiceContracts';
import { GameState, Player } from '../types/StateTypes';
import { CardType } from '../types/DataTypes';
import { Effect } from '../types/EffectTypes';

export class CardService implements ICardService {
  private readonly dataService: IDataService;
  private readonly stateService: IStateService;
  private readonly resourceService: IResourceService;
  private readonly loggingService: ILoggingService;
  public effectEngineService!: IEffectEngineService;

  constructor(dataService: IDataService, stateService: IStateService, resourceService: IResourceService, loggingService: ILoggingService) {
    this.dataService = dataService;
    this.stateService = stateService;
    this.resourceService = resourceService;
    this.loggingService = loggingService;
  }

  // Circular dependency resolution methods
  setEffectEngineService(effectEngineService: IEffectEngineService): void {
    this.effectEngineService = effectEngineService;
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

    // Check phase restrictions
    const card = this.dataService.getCardById(cardId);
    if (card && card.phase_restriction && card.phase_restriction !== 'Any') {
      const currentActivityPhase = this.getCurrentActivityPhase(playerId);
      if (currentActivityPhase && card.phase_restriction !== currentActivityPhase) {
        return false;
      }
      // If currentActivityPhase is null (player not on a phased space), allow any cards to be played
    }

    return true;
  }

  isValidCardType(cardType: string): boolean {
    const validTypes: CardType[] = ['W', 'B', 'E', 'L', 'I'];
    return validTypes.includes(cardType as CardType);
  }

  playerOwnsCard(playerId: string, cardId: string): boolean {
    return this.playerOwnsCardInCollection(playerId, cardId, 'all');
  }


  /**
   * Draw cards for a player from stateful decks
   * @param playerId - Player to draw cards for
   * @param cardType - Type of cards to draw (W, B, E, L, I)
   * @param count - Number of cards to draw
   * @param source - Source of the draw (e.g., "card:E029", "space:PM-DECISION-CHECK") 
   * @param reason - Human-readable reason for the draw
   * @returns Array of drawn card IDs
   */
  drawCards(playerId: string, cardType: CardType, count: number, source?: string, reason?: string): string[] {
    if (!this.isValidCardType(cardType)) {
      throw new Error(`Invalid card type: ${cardType}`);
    }

    if (count <= 0) {
      return [];
    }

    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const gameState = this.stateService.getGameState();
    let availableDeck = [...gameState.decks[cardType]];
    let discardPile = [...gameState.discardPiles[cardType]];
    const drawnCards: string[] = [];

    // Draw cards from the deck
    for (let i = 0; i < count; i++) {
      // If deck is empty, reshuffle discard pile back into deck
      if (availableDeck.length === 0) {
        if (discardPile.length === 0) {
          console.warn(`No more ${cardType} cards available (deck and discard pile both empty)`);
          break; // Cannot draw any more cards
        }
        
        // Reshuffle discard pile into deck
        availableDeck = this.shuffleArray([...discardPile]);
        discardPile = [];
        
        // Log deck reshuffle to action history
        this.loggingService.info(`Deck for ${cardType} cards was empty. Discard pile reshuffled.`, {
          playerId: player.id,
          cardType: cardType,
          reshuffledCount: availableDeck.length
        });
      }

      // Draw the top card from the deck
      const drawnCard = availableDeck.pop()!;
      drawnCards.push(drawnCard);
    }

    // Update global game state with new deck and discard pile state
    const updatedDecks = {
      ...gameState.decks,
      [cardType]: availableDeck
    };
    
    const updatedDiscardPiles = {
      ...gameState.discardPiles,
      [cardType]: discardPile
    };

    // Update player's hand with drawn cards
    const updatedHand = [...player.hand, ...drawnCards];

    // Apply updates atomically - single state update to prevent race conditions
    this.stateService.updateGameState({
      decks: updatedDecks,
      discardPiles: updatedDiscardPiles,
      players: gameState.players.map(p => 
        p.id === playerId 
          ? { ...p, hand: updatedHand }
          : p
      )
    });

    // Log the card draw with source tracking
    const sourceInfo = source || 'unknown';
    const reasonInfo = reason || `Drew ${count} ${cardType} cards`;
    // Card draw already logged to action history by core system
    // Card details logged in action history
    // Deck status logged internally

    // Log to action history
    this.loggingService.info(`Drew ${drawnCards.length} ${cardType} card${drawnCards.length > 1 ? 's' : ''}`, {
      playerId: playerId,
      cardType: cardType,
      cardCount: drawnCards.length,
      cards: drawnCards
    });

    return drawnCards;
  }

  /**
   * Fisher-Yates shuffle algorithm for array randomization
   * @param array - Array to shuffle (creates a copy, does not mutate original)
   * @returns Shuffled copy of the array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Draw and automatically apply a card in a single atomic operation.
   * This method is designed for scenarios like automatic funding where we need to
   * draw a card and immediately apply its effects without user interaction.
   * 
   * @param playerId - The player who will receive and apply the card
   * @param cardType - The type of card to draw (B, I, E, L, W)
   * @param source - The source of this action for tracking
   * @param reason - Human-readable reason for this action
   * @returns Object with drawnCardId and success status
   */
  drawAndApplyCard(playerId: string, cardType: CardType, source: string, reason: string): { drawnCardId: string | null; success: boolean } {
    console.log(`🎴 CARD_SERVICE: drawAndApplyCard - Drawing and applying ${cardType} card for player ${playerId}`);
    
    try {
      // Step 1: Draw the card
      const drawnCards = this.drawCards(playerId, cardType, 1, source, reason);
      
      if (drawnCards.length === 0) {
        console.warn(`No ${cardType} cards available to draw for player ${playerId}`);
        return { drawnCardId: null, success: false };
      }
      
      const drawnCardId = drawnCards[0];
      console.log(`🎴 Successfully drew card: ${drawnCardId}`);
      
      // Step 2: Apply card effects directly (bypassing cost validation/charging)
      // For automatic funding, we apply effects without charging costs
      this.applyCardEffects(playerId, drawnCardId);
      
      // Step 3: Handle card lifecycle (move to active or discard based on duration)
      this.finalizePlayedCard(playerId, drawnCardId);
      
      console.log(`🎴 Successfully applied and processed card: ${drawnCardId}`);
      
      return { drawnCardId, success: true };
      
    } catch (error) {
      console.error(`❌ Error in drawAndApplyCard for player ${playerId}:`, error);
      return { drawnCardId: null, success: false };
    }
  }

  removeCard(playerId: string, cardId: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (!this.playerOwnsCard(playerId, cardId)) {
      throw new Error(`Player ${playerId} does not own card ${cardId}`);
    }

    let cardRemoved = false;
    let updatedHand = [...player.hand];
    let updatedActiveCards = [...player.activeCards];

    // Check hand first
    const handIndex = updatedHand.indexOf(cardId);
    if (handIndex !== -1) {
      updatedHand = [
        ...updatedHand.slice(0, handIndex),
        ...updatedHand.slice(handIndex + 1)
      ];
      cardRemoved = true;
      console.log(`Removed card ${cardId} from ${playerId} hand`);
    }

    // Check active cards if not found in hand
    if (!cardRemoved) {
      const activeCardIndex = updatedActiveCards.findIndex(activeCard => activeCard.cardId === cardId);
      if (activeCardIndex !== -1) {
        updatedActiveCards = [
          ...updatedActiveCards.slice(0, activeCardIndex),
          ...updatedActiveCards.slice(activeCardIndex + 1)
        ];
        cardRemoved = true;
        console.log(`Removed card ${cardId} from ${playerId} active cards`);
      }
    }

    // Note: We don't remove from discard piles as those are managed centrally
    // and cards shouldn't be removed once discarded (except for reshuffling)

    if (!cardRemoved) {
      console.warn(`Could not find card ${cardId} in player ${playerId}'s collections`);
    }

    return this.stateService.updatePlayer({
      id: playerId,
      hand: updatedHand,
      activeCards: updatedActiveCards
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

    // Get old card details before removal
    const oldCard = this.dataService.getCardById(oldCardId);
    
    // Remove the old card and add a new one
    this.removeCard(playerId, oldCardId);
    const drawnCards = this.drawCards(playerId, newCardType, 1);
    
    // Log card replacement to action history
    const newCardId = drawnCards.length > 0 ? drawnCards[0] : null;
    const newCard = newCardId ? this.dataService.getCardById(newCardId) : null;
    
    this.loggingService.info(`Replaced "${oldCard?.card_name}" with "${newCard?.card_name}".`, {
      playerId: playerId,
      oldCardId: oldCardId,
      newCardId: newCardId,
      newCardType: newCardType
    });

    return this.stateService.getGameState();
  }

  // Card information methods
  getCardType(cardId: string): CardType | null {
    // Robust approach: First try to get card type from the Card object via DataService
    const card = this.dataService.getCardById(cardId);
    if (card && card.card_type && this.isValidCardType(card.card_type)) {
      return card.card_type as CardType;
    }
    
    // Fallback: Extract card type from card ID format for backwards compatibility
    const cardTypePart = cardId.split('_')[0];
    if (this.isValidCardType(cardTypePart)) {
      console.warn(`getCardType fallback: Using ID parsing for card ${cardId}. Consider updating card data.`);
      return cardTypePart as CardType;
    }
    
    console.error(`Cannot determine card type for ${cardId}. Card not found in database and ID format unrecognized.`);
    return null;
  }

  getPlayerCards(playerId: string, cardType?: CardType): string[] {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return [];
    }

    // Combine all card collections
    const allPlayerCards: string[] = [];
    
    // Add cards from hand
    if (player.hand) {
      if (cardType) {
        // Filter hand by card type if specified
        const filteredCards = player.hand.filter(cardId => {
          const type = this.getCardType(cardId);
          return type === cardType;
        });
        allPlayerCards.push(...filteredCards);
      } else {
        allPlayerCards.push(...player.hand);
      }
    }
    
    // Add active cards
    if (player.activeCards) {
      for (const activeCard of player.activeCards) {
        if (cardType) {
          const activeCardType = this.getCardType(activeCard.cardId);
          if (activeCardType === cardType) {
            allPlayerCards.push(activeCard.cardId);
          }
        } else {
          allPlayerCards.push(activeCard.cardId);
        }
      }
    }
    
    // Note: Discarded cards are now in global discard piles and not tracked per player
    // If needed to include discarded cards, they would need to be filtered by player history
    // For now, we only return cards currently in player's hand and active cards

    return allPlayerCards;
  }

  getPlayerCardCount(playerId: string, cardType?: CardType): number {
    return this.getPlayerCards(playerId, cardType).length;
  }

  /**
   * Gets the first available card of a specific type from a player's hand for discarding.
   * This method prioritizes cards from the available cards collection over active/discarded cards.
   * 
   * @param playerId The ID of the player
   * @param cardType The type of card to find (W, B, E, L, I)
   * @returns The card ID if found, null if no cards of that type are available
   */
  getCardToDiscard(playerId: string, cardType: CardType): string | null {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return null;
    }

    // First, try to get from hand (preferred for discarding)
    if (player.hand) {
      const cardInHand = player.hand.find(cardId => {
        const type = this.getCardType(cardId);
        return type === cardType;
      });
      if (cardInHand) {
        return cardInHand; // Return the first card of this type in hand
      }
    }

    // If no available cards of this type, check active cards
    if (player.activeCards) {
      for (const activeCard of player.activeCards) {
        const activeCardType = this.getCardType(activeCard.cardId);
        if (activeCardType === cardType) {
          return activeCard.cardId;
        }
      }
    }

    // No cards of the requested type found
    return null;
  }

  // Main card playing method
  playCard(playerId: string, cardId: string): GameState {
    console.log(`Attempting to play card [${cardId}] for player [${playerId}]`);
    
    try {
      // Step 1: Validate that the card can be played (includes phase restrictions)
      const validationResult = this.validateCardPlay(playerId, cardId);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errorMessage);
      }
      
      // Step 2: Get card data
      const card = this.dataService.getCardById(cardId);
      if (!card) {
        throw new Error(`Card ${cardId} not found in database`);
      }
      
      // Step 3: Pay card cost if any
      if (card.cost && card.cost > 0) {
        // Skip cost charging for funding cards (B = Bank loans, I = Investor funding)
        if (card.card_type !== 'B' && card.card_type !== 'I') {
          const player = this.stateService.getPlayer(playerId);
          if (!player) {
            throw new Error(`Player ${playerId} not found`);
          }
          
          this.stateService.updatePlayer({
            id: playerId,
            money: player.money - card.cost
          });
          console.log(`Player ${playerId} paid $${card.cost} to play card ${cardId}`);
        }
      }
      
      // Step 4: Apply card effects
      this.applyCardEffects(playerId, cardId);
      
      // Step 5: Handle card activation based on duration
      if (card.duration) {
        const numericDuration = typeof card.duration === 'string' ? parseInt(card.duration, 10) : card.duration;
        if (numericDuration > 0) {
          // Card has duration - move to activeCards
          this.activateCard(playerId, cardId, numericDuration);
          console.log(`Card [${cardId}] activated for ${numericDuration} turns`);
        } else {
          // Card has immediate effect - move to discarded
          this.moveCardToDiscarded(playerId, cardId);
          console.log(`Card [${cardId}] used immediately and discarded`);
        }
      } else {
        // Card has immediate effect - move to discarded
        this.moveCardToDiscarded(playerId, cardId);
        console.log(`Card [${cardId}] used immediately and discarded`);
      }
      
      console.log(`Successfully played card [${cardId}] for player [${playerId}]`);
      
      // Log card play to action history
      const player = this.stateService.getPlayer(playerId);
      if (player) {
        this.loggingService.info(`Played ${card.card_name || cardId}`, {
          playerId: playerId,
          cardId: cardId,
          cardName: card.card_name,
          cardType: card.card_type,
          cost: card.cost || 0
        });
      }
      
      return this.stateService.getGameState();
      
    } catch (error) {
      console.error(`Failed to play card [${cardId}] for player [${playerId}]:`, error);
      throw error;
    }
  }

  // Validation helper method
  private validateCardPlay(playerId: string, cardId: string): { isValid: boolean; errorMessage?: string } {
    const gameState = this.stateService.getGameState();
    
    // Check if game is in PLAY phase
    if (gameState.gamePhase !== 'PLAY') {
      return { isValid: false, errorMessage: 'Cards can only be played during the PLAY phase' };
    }
    
    // Check if player exists
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return { isValid: false, errorMessage: `Player ${playerId} not found` };
    }
    
    // Check if it's the player's turn
    if (gameState.currentPlayerId !== playerId) {
      return { isValid: false, errorMessage: 'You can only play cards on your turn' };
    }
    
    // Check if player owns the card
    if (!this.playerOwnsCard(playerId, cardId)) {
      return { isValid: false, errorMessage: 'You do not own this card' };
    }
    
    // Get card data for validation
    const card = this.dataService.getCardById(cardId);
    if (!card) {
      return { isValid: false, errorMessage: `Card ${cardId} not found` };
    }
    
    // Check if player has enough money to play the card
    if (card.cost) {
      const cardType = this.getCardType(cardId);

      // Skip cost validation for funding cards (B = Bank loans, I = Investor funding)
      if (cardType !== 'B' && cardType !== 'I') {
        const numericCost = typeof card.cost === 'string' ? parseInt(card.cost, 10) : card.cost;
        if (numericCost > 0) {
          if (player.money < numericCost) {
            return { isValid: false, errorMessage: `Insufficient funds. Need ${numericCost}, have ${player.money}` };
          }
        }
      }
    }
    
    // Check phase restrictions for all card types
    if (card.phase_restriction && card.phase_restriction !== 'Any') {
      const currentActivityPhase = this.getCurrentActivityPhase(playerId);
      if (currentActivityPhase && card.phase_restriction !== currentActivityPhase) {
        return { 
          isValid: false, 
          errorMessage: `Card can only be played during ${card.phase_restriction} phase. Current activity: ${currentActivityPhase}` 
        };
      }
      // If currentActivityPhase is null (player not on a phased space), allow any cards to be played
    }
    
    return { isValid: true };
  }

  // Helper method to get current activity phase based on player's current space
  private getCurrentActivityPhase(playerId: string): string | null {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return null;
    }
    
    // Get the game config for the player's current space to determine its phase
    const spaceConfig = this.dataService.getGameConfigBySpace(player.currentSpace);
    if (!spaceConfig || !spaceConfig.phase) {
      return null; // Space has no specific phase, allow any cards
    }
    
    // Map the space's phase to card phase restrictions
    // The CSV phases in GAME_CONFIG match the card phase_restriction values
    switch (spaceConfig.phase.toUpperCase()) {
      case 'CONSTRUCTION':
        return 'CONSTRUCTION';
      case 'DESIGN':
        return 'DESIGN';
      case 'FUNDING':
        return 'FUNDING';
      case 'REGULATORY':
        return 'REGULATORY_REVIEW';
      default:
        return null; // Unknown phase, allow any cards
    }
  }

  // Public method to activate a card with duration-based effects
  public activateCard(playerId: string, cardId: string, duration: number): void {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const gameState = this.stateService.getGameState();
    const expirationTurn = gameState.turn + duration;

    // Remove card from available cards
    this.removeCard(playerId, cardId);

    // Add to activeCards
    const updatedActiveCards = [...player.activeCards, { cardId, expirationTurn }];
    
    this.stateService.updatePlayer({
      id: playerId,
      activeCards: updatedActiveCards
    });

    // Log card activation to action history
    const card = this.dataService.getCardById(cardId);
    this.loggingService.info(`Activated "${card?.card_name}" for ${duration} turns.`, {
      playerId: playerId,
      cardId: cardId,
      duration: duration,
      expirationTurn: expirationTurn
    });
  }

  // Card transfer method
  transferCard(sourcePlayerId: string, targetPlayerId: string, cardId: string): GameState {
    // Transfer logged to action history below
    
    try {
      // Validate source player
      const sourcePlayer = this.stateService.getPlayer(sourcePlayerId);
      if (!sourcePlayer) {
        throw new Error(`Source player ${sourcePlayerId} not found`);
      }
      
      // Validate target player
      const targetPlayer = this.stateService.getPlayer(targetPlayerId);
      if (!targetPlayer) {
        throw new Error(`Target player ${targetPlayerId} not found`);
      }
      
      // Cannot transfer to yourself
      if (sourcePlayerId === targetPlayerId) {
        throw new Error('Cannot transfer card to yourself');
      }
      
      // Check if source player owns the card (only in hand for transfer)
      if (!this.playerOwnsCardInCollection(sourcePlayerId, cardId, 'hand')) {
        throw new Error('You do not own this card or it is not available for transfer');
      }
      
      // Get card type and validate it's transferable
      const cardType = this.getCardType(cardId);
      if (!cardType || !this.isCardTransferable(cardType)) {
        throw new Error(`${cardType || 'Unknown'} cards cannot be transferred`);
      }
      
      // Remove card from source player's available cards
      this.removeCard(sourcePlayerId, cardId);
      
      // Add card to target player's hand
      const updatedTargetHand = [...targetPlayer.hand, cardId];
      
      this.stateService.updatePlayer({
        id: targetPlayerId,
        hand: updatedTargetHand
      });
      
      // Transfer success logged to action history below
      
      // Log card transfer to action history
      const card = this.dataService.getCardById(cardId);
      this.loggingService.info(`Transferred ${card?.card_name || cardId} to ${targetPlayer.name}`, {
        playerId: sourcePlayerId,
        cardId: cardId,
        cardName: card?.card_name,
        cardType: cardType,
        sourcePlayer: sourcePlayer.name,
        targetPlayer: targetPlayer.name,
        sourcePlayerId: sourcePlayerId,
        targetPlayerId: targetPlayerId
      });
      
      return this.stateService.getGameState();
      
    } catch (error) {
      console.error(`Failed to transfer card [${cardId}]:`, error);
      throw error;
    }
  }

  // Helper method to check if a card type is transferable
  private isCardTransferable(cardType: CardType): boolean {
    // E (Expeditor) and L (Life Events) cards can be transferred
    // These represent filing representatives and events that can affect other players
    return cardType === 'E' || cardType === 'L';
  }

  // Enhanced method to check if player owns card in specific collection(s)
  private playerOwnsCardInCollection(
    playerId: string, 
    cardId: string, 
    collection: 'hand' | 'active' | 'discarded' | 'all' = 'all'
  ): boolean {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return false;
    }

    // Check hand (previously available cards)
    if (collection === 'hand' || collection === 'all') {
      if (player.hand && player.hand.includes(cardId)) {
        return true;
      }
    }

    // Check active cards
    if (collection === 'active' || collection === 'all') {
      if (player.activeCards && player.activeCards.some(activeCard => activeCard.cardId === cardId)) {
        return true;
      }
    }

    // Check discarded cards (now in global discard piles)
    if (collection === 'discarded' || collection === 'all') {
      const gameState = this.stateService.getGameState();
      for (const cardType of ['W', 'B', 'E', 'L', 'I'] as CardType[]) {
        const discardPile = gameState.discardPiles[cardType];
        if (discardPile && discardPile.includes(cardId)) {
          return true;
        }
      }
    }

    return false;
  }


  // Public method called at end of each turn to handle card expirations
  endOfTurn(): void {
    const gameState = this.stateService.getGameState();
    const currentTurn = gameState.turn;

    // Processing card expirations

    // Check each player's active cards for expiration
    for (const player of gameState.players) {
      const expiredCards: string[] = [];
      const remainingActiveCards = player.activeCards.filter(activeCard => {
        if (activeCard.expirationTurn <= currentTurn) {
          expiredCards.push(activeCard.cardId);
          return false; // Remove from active cards
        }
        return true; // Keep in active cards
      });

      // If there are expired cards, update the player
      if (expiredCards.length > 0) {
        // Move expired cards to discarded collection and log each expiration
        for (const expiredCardId of expiredCards) {
          // Log card expiration to action history
          const card = this.dataService.getCardById(expiredCardId);
          this.loggingService.info(`"${card?.card_name}" expired.`, {
            playerId: player.id,
            cardId: expiredCardId
          });
          
          this.moveExpiredCardToDiscarded(player.id, expiredCardId);
        }

        // Update active cards list
        this.stateService.updatePlayer({
          id: player.id,
          activeCards: remainingActiveCards
        });
      }
    }
  }

  // Helper method to move expired card to discarded collection
  private moveExpiredCardToDiscarded(playerId: string, cardId: string): void {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      console.error(`Player ${playerId} not found during card expiration`);
      return;
    }

    const cardType = this.getCardType(cardId);
    if (!cardType) {
      console.error(`Cannot determine card type for expired card ${cardId}`);
      return;
    }

    // Add expired card to global discard pile
    const gameState = this.stateService.getGameState();
    const updatedDiscardPiles = {
      ...gameState.discardPiles,
      [cardType]: [...gameState.discardPiles[cardType], cardId]
    };

    this.stateService.updateGameState({
      discardPiles: updatedDiscardPiles
    });

    console.log(`Expired card ${cardId} moved to ${cardType} discard pile for player ${playerId}`);
  }

  // Card discard helper method
  private moveCardToDiscarded(playerId: string, cardId: string): void {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }
    
    const cardType = this.getCardType(cardId);
    if (!cardType) {
      throw new Error(`Cannot determine card type for ${cardId}`);
    }
    
    // Verify card exists in player's hand
    const handIndex = player.hand.indexOf(cardId);
    if (handIndex === -1) {
      throw new Error(`Card ${cardId} not found in player's hand`);
    }
    
    // Remove from player's hand
    const updatedHand = [
      ...player.hand.slice(0, handIndex),
      ...player.hand.slice(handIndex + 1)
    ];
    
    // Add to global discard pile
    const gameState = this.stateService.getGameState();
    const updatedDiscardPiles = {
      ...gameState.discardPiles,
      [cardType]: [...gameState.discardPiles[cardType], cardId]
    };
    
    // Update game state and player state atomically
    this.stateService.updateGameState({
      discardPiles: updatedDiscardPiles
    });
    
    this.stateService.updatePlayer({
      id: playerId,
      hand: updatedHand
    });
    
    console.log(`Moved card ${cardId} from hand to ${cardType} discard pile for player ${playerId}`);
  }

  /**
   * Public method to discard a played card (move from available to discarded)
   * Used by EffectEngine for PLAY_CARD effects when card has no duration
   */
  public discardPlayedCard(playerId: string, cardId: string): void {
    console.log(`🗑️ Discarding played card ${cardId} for player ${playerId}`);
    this.moveCardToDiscarded(playerId, cardId);
  }

  /**
   * Public method to finalize a played card's lifecycle
   * Determines if card should be activated (has duration) or discarded (immediate effect)
   * Used by EffectEngine for PLAY_CARD effects
   */
  public finalizePlayedCard(playerId: string, cardId: string): void {
    console.log(`🎴 Finalizing played card ${cardId} for player ${playerId}`);
    
    const card = this.dataService.getCardById(cardId);
    if (!card) {
      throw new Error(`Card ${cardId} not found`);
    }
    
    // Check if card has duration
    const duration = card.duration_count && parseInt(card.duration_count, 10) > 0 
      ? parseInt(card.duration_count, 10) 
      : 0;

    if (duration > 0) {
      console.log(`🎴 Card ${cardId} has duration ${duration}, activating...`);
      this.activateCard(playerId, cardId, duration);
    } else {
      console.log(`🎴 Card ${cardId} has no duration, discarding...`);
      this.discardPlayedCard(playerId, cardId);
    }
  }

  // Card effect methods - Enhanced with UnifiedEffectEngine integration
  applyCardEffects(playerId: string, cardId: string): GameState {
    const card = this.dataService.getCardById(cardId);
    if (!card) {
      console.warn(`Card ${cardId} not found in database`);
      return this.stateService.getGameState();
    }

    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    console.log(`🎴 CARD_SERVICE: Applying effects for card ${cardId}: "${card.card_name}"`);

    // Step 1: Parse card data into standardized Effect objects
    const effects = this.parseCardIntoEffects(card, playerId);
    
    if (effects.length > 0) {
      console.log(`🎴 CARD_SERVICE: Parsed ${effects.length} effects from card ${cardId}`);
      
      // Step 2: Process effects through UnifiedEffectEngine
      const context = {
        source: `card:${cardId}`,
        playerId: playerId,
        triggerEvent: 'CARD_PLAY' as const
      };
      
      // Use async processing for complex effects
      this.effectEngineService.processCardEffects(effects, context, card).then(batchResult => {
        if (batchResult.success) {
          console.log(`✅ Successfully processed ${batchResult.successfulEffects}/${batchResult.totalEffects} card effects`);
        } else {
          console.error(`❌ Card effect processing failed: ${batchResult.errors.join(', ')}`);
        }
      }).catch(error => {
        console.error(`❌ Error processing card effects:`, error);
      });
    }

    // Step 3: Apply legacy expanded mechanics for compatibility
    this.applyExpandedMechanics(playerId, card);

    // Step 4: Apply legacy card type effects for compatibility
    switch (card.card_type) {
      case 'W': // Work cards - Apply Work effects
        return this.applyWorkCardEffect(playerId, card);
      
      case 'B': // Bank Loan cards - Apply loan funding effects
        return this.applyBankLoanCardEffect(playerId, card);
      
      case 'E': // Expeditor cards - Filing representative effects
        return this.applyExpeditorCardEffect(playerId, card);
      
      case 'L': // Life Events cards - Random events and unforeseen circumstances
        return this.applyLifeEventsCardEffect(playerId, card);
      
      case 'I': // Investor Loan cards - High-rate funding effects
        return this.applyInvestorLoanCardEffect(playerId, card);
      
      default:
        console.warn(`Unknown card type: ${card.card_type}`);
        return this.stateService.getGameState();
    }
  }

  /**
   * Parse card CSV data into standardized Effect objects for the UnifiedEffectEngine
   * This bridges the gap between CSV field structure and the Effect system
   */
  private parseCardIntoEffects(card: any, playerId: string): Effect[] {
    const effects: Effect[] = [];
    const cardSource = `card:${card.card_id}`;

    // MODIFY_RESOURCE effects from money_effect field
    if (card.money_effect && card.money_effect !== '0') {
      const moneyAmount = parseInt(card.money_effect, 10);
      if (!isNaN(moneyAmount) && moneyAmount !== 0) {
        effects.push({
          effectType: 'RESOURCE_CHANGE',
          payload: {
            playerId: playerId,
            resource: 'MONEY',
            amount: moneyAmount,
            source: cardSource,
            reason: `${card.card_name}: ${moneyAmount > 0 ? '+' : ''}$${Math.abs(moneyAmount).toLocaleString()}`
          }
        });
        console.log(`   💰 Added MODIFY_RESOURCE effect: ${moneyAmount > 0 ? '+' : ''}$${Math.abs(moneyAmount).toLocaleString()}`);
      }
    }

    // MODIFY_RESOURCE effects from tick_modifier field (time effects)
    if (card.tick_modifier && card.tick_modifier !== '0') {
      const timeAmount = parseInt(card.tick_modifier, 10);
      if (!isNaN(timeAmount) && timeAmount !== 0) {
        effects.push({
          effectType: 'RESOURCE_CHANGE',
          payload: {
            playerId: playerId,
            resource: 'TIME',
            amount: timeAmount, // Positive = add time, negative = spend time
            source: cardSource,
            reason: `${card.card_name}: ${timeAmount > 0 ? '+' : ''}${timeAmount} time ticks`
          }
        });
        console.log(`   ⏰ Added TIME effect: ${timeAmount > 0 ? '+' : ''}${timeAmount} time ticks`);
      }
    }

    // DRAW_CARDS effects from draw_cards field
    if (card.draw_cards && card.draw_cards.trim() !== '') {
      const drawMatch = card.draw_cards.match(/(\d+)\s*([WBELIS]?)/);
      if (drawMatch) {
        const count = parseInt(drawMatch[1], 10);
        const cardType = drawMatch[2] || 'W'; // Default to Work cards if no type specified
        
        if (count > 0) {
          effects.push({
            effectType: 'CARD_DRAW',
            payload: {
              playerId: playerId,
              cardType: cardType as any,
              count: count,
              source: cardSource,
              reason: `${card.card_name}: Draw ${count} ${cardType} card${count > 1 ? 's' : ''}`
            }
          });
          console.log(`   🎴 Added DRAW_CARDS effect: ${count} ${cardType} card${count > 1 ? 's' : ''}`);
        }
      }
    }

    // PLAYER_CHOICE_MOVE effects for movement-related cards
    if (card.movement_effect && card.movement_effect.trim() !== '') {
      const movementSpaces = parseInt(card.movement_effect, 10);
      if (!isNaN(movementSpaces) && movementSpaces > 0) {
        effects.push({
          effectType: 'CHOICE',
          payload: {
            playerId: playerId,
            type: 'MOVEMENT',
            prompt: `Choose where to move (${movementSpaces} spaces)`,
            options: [
              { id: 'forward', label: `Move forward ${movementSpaces} spaces` },
              { id: 'backward', label: `Move backward ${movementSpaces} spaces` }
            ]
          }
        });
        console.log(`   🚶 Added PLAYER_CHOICE_MOVE effect: ${movementSpaces} spaces`);
      }
    }

    // CARD_DISCARD effects from discard_cards field
    if (card.discard_cards && card.discard_cards.trim() !== '') {
      const discardMatch = card.discard_cards.match(/(\d+)\s*([WBELIS]?)/);
      if (discardMatch) {
        const count = parseInt(discardMatch[1], 10);
        const cardType = discardMatch[2];
        
        if (count > 0) {
          effects.push({
            effectType: 'CARD_DISCARD',
            payload: {
              playerId: playerId,
              cardIds: [], // Will be resolved at runtime
              cardType: cardType as any,
              count: count,
              source: cardSource,
              reason: `${card.card_name}: Discard ${count} ${cardType || 'any'} card${count > 1 ? 's' : ''}`
            }
          });
          console.log(`   🗑️ Added CARD_DISCARD effect: ${count} ${cardType || 'any'} card${count > 1 ? 's' : ''}`);
        }
      }
    }

    return effects;
  }

  // Apply expanded mechanics from code2026
  private applyExpandedMechanics(playerId: string, card: any): void {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const cardSource = `card:${card.card_id}`;

    // Apply time tick modifier effects using ResourceService
    if (card.tick_modifier && card.tick_modifier !== '0') {
      const tickModifier = parseInt(card.tick_modifier);
      if (!isNaN(tickModifier) && tickModifier !== 0) {
        if (tickModifier > 0) {
          this.resourceService.addTime(playerId, tickModifier, cardSource, `${card.card_name}: +${tickModifier} time ticks`);
        } else {
          this.resourceService.spendTime(playerId, Math.abs(tickModifier), cardSource, `${card.card_name}: ${tickModifier} time ticks`);
        }
      }
    }

    // Apply direct money effects using ResourceService
    if (card.money_effect) {
      const moneyEffect = parseInt(card.money_effect);
      if (!isNaN(moneyEffect) && moneyEffect !== 0) {
        if (moneyEffect > 0) {
          this.resourceService.addMoney(playerId, moneyEffect, cardSource, `${card.card_name}: +$${moneyEffect.toLocaleString()}`);
        } else {
          this.resourceService.spendMoney(playerId, Math.abs(moneyEffect), cardSource, `${card.card_name}: -$${Math.abs(moneyEffect).toLocaleString()}`);
        }
      }
    }

    // Apply loan amounts for B cards using ResourceService
    if (card.card_type === 'B' && card.loan_amount) {
      const loanAmount = parseInt(card.loan_amount);
      if (!isNaN(loanAmount) && loanAmount > 0) {
        this.resourceService.addMoney(
          playerId, 
          loanAmount, 
          cardSource, 
          `${card.card_name}: Loan of $${loanAmount.toLocaleString()} at ${card.loan_rate}% interest`
        );
      }
    }

    // Apply investment amounts for I cards using ResourceService
    if (card.card_type === 'I' && card.investment_amount) {
      const investmentAmount = parseInt(card.investment_amount);
      if (!isNaN(investmentAmount) && investmentAmount > 0) {
        this.resourceService.addMoney(
          playerId, 
          investmentAmount, 
          cardSource, 
          `${card.card_name}: Investment of $${investmentAmount.toLocaleString()}`
        );
      }
    }

    // Handle turn effects (skip next turn)
    if (card.turn_effect && card.turn_effect.toLowerCase().includes('skip')) {
      console.log(`Card ${card.card_id}: Turn effect "${card.turn_effect}" - player will skip next turn`);
      this.effectEngineService.processEffect({
        effectType: 'TURN_CONTROL',
        payload: {
          action: 'SKIP_TURN',
          playerId,
          source: `card:${card.card_id}`,
          reason: `Card effect: ${card.card_name}`
        }
      }, {
        source: `card:${card.card_id}`,
        playerId,
        triggerEvent: 'CARD_PLAY'
      });
    }

    // Handle card interaction effects (draw/discard)
    if (card.draw_cards) {
      const [count, cardType] = card.draw_cards.split(' ');
      this.effectEngineService.processEffect({
        effectType: 'CARD_DRAW',
        payload: {
          playerId,
          cardType,
          count: parseInt(count, 10),
          source: `card:${card.card_id}`,
          reason: `Card effect: ${card.card_name}`
        }
      }, {
        source: `card:${card.card_id}`,
        playerId,
        triggerEvent: 'CARD_PLAY'
      });
    }

    if (card.discard_cards) {
      const [count, cardType] = card.discard_cards.split(' ');
      const playerCards = this.getPlayerCards(playerId, cardType as CardType);
      if (playerCards.length > 0) {
        const cardsToDiscard = playerCards.slice(0, parseInt(count, 10));
        this.effectEngineService.processEffect({
          effectType: 'CARD_DISCARD',
          payload: {
            playerId,
            cardIds: cardsToDiscard,
            source: `card:${card.card_id}`,
            reason: `Card effect: ${card.card_name}`
          }
        }, {
          source: `card:${card.card_id}`,
          playerId,
          triggerEvent: 'CARD_PLAY'
        });
      }
    }

    // Handle targeted effects
    if (card.target) {
      this.effectEngineService.processEffect({
        effectType: 'EFFECT_GROUP_TARGETED',
        payload: {
          targetType: card.target,
          templateEffect: {
            effectType: 'RESOURCE_CHANGE',
            payload: {
              playerId: '', // This will be replaced by the EffectEngineService
              resource: 'MONEY',
              amount: -100, // Example: all other players lose 100
              source: `card:${card.card_id}`,
              reason: `Card effect: ${card.card_name}`
            }
          },
          prompt: `Choose a player to lose $100`,
          source: `card:${card.card_id}`
        }
      }, {
        source: `card:${card.card_id}`,
        playerId,
        triggerEvent: 'CARD_PLAY'
      });
    }
  }

  // Private helper methods
  private requiresPlayerTurn(cardType: CardType): boolean {
    // Some card types might require it to be the player's turn
    // For now, assume all cards can be played anytime during PLAY phase
    return false;
  }

  private applyWorkCardEffect(playerId: string, card: any): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Work cards represent project scopes that add to the player's project value
    // Extract estimated cost from description for project value calculation
    const costMatch = card.description.match(/\$([0-9,]+)/);
    if (costMatch) {
      const projectValue = parseInt(costMatch[1].replace(/,/g, ''));
      console.log(`Work card played: ${card.card_name}`);
      console.log(`Added project scope worth $${projectValue.toLocaleString()}`);
      
      // Work cards contribute to player's total project portfolio value
      // This could be used for win conditions or scoring in future phases
      const currentProjectValue = player.money; // For now, work cards don't change money directly
      console.log(`Work scope acquired: ${card.card_name} (Est. $${projectValue.toLocaleString()})`);
    } else {
      console.log(`Work card played: ${card.card_name}`);
      console.log('Work card represents project scope for completion requirements');
    }
    
    return this.stateService.getGameState();
  }

  private applyBankLoanCardEffect(playerId: string, card: any): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Bank Loan card effects are now handled in applyExpandedMechanics via loan_amount field
    // Log loan details if available
    if (card.loan_amount) {
      const loanAmount = parseInt(card.loan_amount);
      if (!isNaN(loanAmount) && loanAmount > 0) {
        console.log(`Bank Loan approved: ${card.card_name} - $${loanAmount.toLocaleString()}`);
        if (card.loan_rate) {
          console.log(`Interest rate: ${card.loan_rate}%`);
        }
      }
    }
    
    return this.stateService.getGameState();
  }

  private applyExpeditorCardEffect(playerId: string, card: any): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Parse E card effects from effects_on_play field
    const effects = card.effects_on_play || '';
    
    if (effects.includes('gain $')) {
      // Extract money amount
      const moneyMatch = effects.match(/gain \$(\d+)/);
      if (moneyMatch) {
        const moneyGain = parseInt(moneyMatch[1]);
        this.stateService.updatePlayer({
          id: playerId,
          money: player.money + moneyGain
        });
        console.log(`Expeditor card provided $${moneyGain}`);
      }
    }
    
    if (effects.includes('time units')) {
      // Extract time amount
      const timeMatch = effects.match(/(\d+)\s+time\s+units/);
      if (timeMatch) {
        const timeGain = parseInt(timeMatch[1]);
        this.stateService.updatePlayer({
          id: playerId,
          timeSpent: Math.max(0, player.timeSpent - timeGain) // Reduce time spent
        });
        console.log(`Expeditor card saved ${timeGain} time units`);
      }
    }
    
    if (effects.includes('Draw 1 card')) {
      // Draw 1 additional card of any type
      // For now, we'll draw a random card type (W, B, I, L, E)
      const cardTypes: CardType[] = ['W', 'B', 'I', 'L', 'E'];
      const randomCardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
      
      try {
        this.drawCards(playerId, randomCardType, 1);
        console.log(`Expeditor card effect: Drew 1 ${randomCardType} card`);
      } catch (error) {
        console.warn(`Could not draw ${randomCardType} card:`, error);
        // Try a different card type if the first fails
        for (const fallbackType of cardTypes) {
          if (fallbackType !== randomCardType) {
            try {
              this.drawCards(playerId, fallbackType, 1);
              console.log(`Expeditor card effect: Drew 1 ${fallbackType} card (fallback)`);
              break;
            } catch (fallbackError) {
              // Continue to next type
            }
          }
        }
      }
    }
    
    console.log(`Expeditor effect applied: ${effects}`);
    return this.stateService.getGameState();
  }

  private applyLifeEventsCardEffect(playerId: string, card: any): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Life Events cards create random events and unforeseen circumstances
    // Parse the effects_on_play field for specific benefits
    const effects = card.effects_on_play || '';
    console.log(`Life Events card played: ${card.card_name}`);
    
    if (effects.includes('Enables')) {
      console.log(`✅ Life event enabled: ${effects}`);
    }
    
    if (effects.includes('reduces') && effects.includes('risk')) {
      console.log(`🛡️ Risk reduction applied: ${effects}`);
    }
    
    if (effects.includes('Prevents')) {
      console.log(`🚫 Prevention effect activated: ${effects}`);
    }
    
    if (effects.includes('Expands')) {
      console.log(`📈 Expansion benefit acquired: ${effects}`);
    }
    
    // Life Events cards provide random circumstances that affect gameplay
    console.log(`Life event processed: ${card.card_name}`);
    
    return this.stateService.getGameState();
  }

  private applyInvestorLoanCardEffect(playerId: string, card: any): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Parse investor loan effects from card name and description
    let moneyGain = 0;
    const cardName = card.card_name.toLowerCase();
    
    if (cardName.includes('angel investor')) {
      moneyGain = 50000;
    } else if (cardName.includes('venture capital')) {
      moneyGain = 200000;
    } else if (cardName.includes('government grant')) {
      moneyGain = 100000;
    } else if (cardName.includes('crowdfunding')) {
      // Variable based on player's current project value
      moneyGain = Math.floor(player.money * 0.2) + 10000;
    } else {
      moneyGain = 25000; // Default investor loan amount
    }
    
    if (moneyGain > 0) {
      this.resourceService.addMoney(
        playerId, 
        moneyGain, 
        `card:${card.card_id}`, 
        `${card.card_name}: Investment secured $${moneyGain.toLocaleString()}`
      );
    }
    
    return this.stateService.getGameState();
  }

  // Discard cards with source tracking
  discardCards(playerId: string, cardIds: string[], source?: string, reason?: string): boolean {
    if (!cardIds || cardIds.length === 0) {
      console.warn(`CardService.discardCards: No cards provided for player ${playerId}`);
      return false;
    }

    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      console.error(`CardService.discardCards: Player ${playerId} not found`);
      return false;
    }

    // Validate all cards exist and are owned by player
    const invalidCards = cardIds.filter(cardId => !this.playerOwnsCard(playerId, cardId));
    if (invalidCards.length > 0) {
      console.error(`CardService.discardCards: Player ${playerId} does not own cards: ${invalidCards.join(', ')}`);
      return false;
    }

    // Group cards by type for efficient discarding
    const cardsByType: { [cardType: string]: string[] } = {};
    
    for (const cardId of cardIds) {
      const cardType = this.getCardType(cardId);
      if (cardType) {
        if (!cardsByType[cardType]) {
          cardsByType[cardType] = [];
        }
        cardsByType[cardType].push(cardId);
      }
    }

    // Copy current player card collections  
    let updatedHand = [...player.hand];
    let updatedActiveCards = [...player.activeCards];
    const gameState = this.stateService.getGameState();
    const updatedDiscardPiles = { ...gameState.discardPiles };

    // Process each card type
    for (const [cardType, cards] of Object.entries(cardsByType)) {
      const typedCardType = cardType as CardType;
      
      // Remove from hand
      updatedHand = updatedHand.filter(cardId => !cards.includes(cardId));

      // Remove from active cards
      for (const cardId of cards) {
        const activeIndex = updatedActiveCards.findIndex(active => active.cardId === cardId);
        if (activeIndex !== -1) {
          updatedActiveCards.splice(activeIndex, 1);
        }
      }

      // Add to global discard pile
      if (!updatedDiscardPiles[typedCardType]) {
        updatedDiscardPiles[typedCardType] = [];
      }
      updatedDiscardPiles[typedCardType] = [
        ...updatedDiscardPiles[typedCardType],
        ...cards
      ];
    }

    // Update game state and player state
    try {
      this.stateService.updateGameState({
        discardPiles: updatedDiscardPiles
      });
      
      this.stateService.updatePlayer({
        id: playerId,
        hand: updatedHand,
        activeCards: updatedActiveCards
      });

      // Log the transaction
      const cardSummary = Object.entries(cardsByType)
        .map(([type, cards]) => `${cards.length}x${type}`)
        .join(', ');
      
      const sourceInfo = source || 'manual';
      const reasonInfo = reason || `Discarded ${cardIds.length} card${cardIds.length > 1 ? 's' : ''}`;
      
      console.log(`🗑️ Cards Discarded [${playerId}]: ${cardSummary} (Source: ${sourceInfo})`);
      console.log(`   Reason: ${reasonInfo}`);
      console.log(`   Card IDs: ${cardIds.join(', ')}`);

      // Log card discard to action history
      this.loggingService.info(`Discarded ${cardIds.length} card${cardIds.length > 1 ? 's' : ''}`, {
        playerId: playerId,
        cardIds: cardIds,
        cardsByType: cardsByType,
        source: sourceInfo,
        reason: reasonInfo
      });

      return true;

    } catch (error) {
      console.error(`CardService.discardCards: Failed to discard cards for player ${playerId}:`, error);
      return false;
    }
  }
}