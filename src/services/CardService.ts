import { ICardService, IDataService, IStateService, IResourceService } from '../types/ServiceContracts';
import { GameState, Player } from '../types/StateTypes';
import { CardType } from '../types/DataTypes';

export class CardService implements ICardService {
  private readonly dataService: IDataService;
  private readonly stateService: IStateService;
  private readonly resourceService: IResourceService;

  constructor(dataService: IDataService, stateService: IStateService, resourceService: IResourceService) {
    this.dataService = dataService;
    this.stateService = stateService;
    this.resourceService = resourceService;
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
    return this.playerOwnsCardInCollection(playerId, cardId, 'all');
  }


  /**
   * Draw cards for a player with source tracking
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

    // Generate new card IDs that reference actual CSV cards
    const availableCards = this.dataService.getCardsByType(cardType);
    if (availableCards.length === 0) {
      console.warn(`No cards of type ${cardType} found in CSV data`);
      return [];
    }

    const newCardIds: string[] = [];
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);

    for (let i = 0; i < count; i++) {
      // Randomly select a card from available cards of this type
      const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      // Create dynamic ID that starts with the static card ID
      const dynamicId = `${randomCard.card_id}_${timestamp}_${randomString}_${i}`;
      newCardIds.push(dynamicId);
    }

    // Update player's available cards
    const updatedAvailableCards = {
      ...player.availableCards,
      [cardType]: [...(player.availableCards[cardType] || []), ...newCardIds]
    };

    this.stateService.updatePlayer({
      id: playerId,
      availableCards: updatedAvailableCards
    });

    // Log the card draw with source tracking
    const sourceInfo = source || 'unknown';
    const reasonInfo = reason || `Drew ${count} ${cardType} cards`;
    console.log(`🎴 Card Draw [${playerId}]: ${reasonInfo} (Source: ${sourceInfo})`);
    console.log(`   Cards: ${newCardIds.join(', ')}`);

    // Log to action log if available
    if (typeof (window as any)[`addActionToLog_${playerId}`] === 'function') {
      (window as any)[`addActionToLog_${playerId}`]({
        type: 'card_draw',
        playerId: playerId,
        playerName: player.name,
        description: `Drew ${count} ${cardType} card${count > 1 ? 's' : ''}`,
        details: {
          cardType: cardType,
          cardCount: count,
          cards: newCardIds
        }
      });
    }

    return newCardIds;
  }

  removeCard(playerId: string, cardId: string): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (!this.playerOwnsCard(playerId, cardId)) {
      throw new Error(`Player ${playerId} does not own card ${cardId}`);
    }

    // Find which card collection and type the card belongs to and remove it
    const updatedAvailableCards = { ...player.availableCards };
    let updatedActiveCards = [...player.activeCards];
    const updatedDiscardedCards = { ...player.discardedCards };
    
    let cardRemoved = false;

    // Check available cards first
    if (!cardRemoved) {
      for (const cardType of Object.keys(updatedAvailableCards) as CardType[]) {
        const cards = updatedAvailableCards[cardType] || [];
        const cardIndex = cards.indexOf(cardId);
        if (cardIndex !== -1) {
          updatedAvailableCards[cardType] = [
            ...cards.slice(0, cardIndex),
            ...cards.slice(cardIndex + 1)
          ];
          cardRemoved = true;
          break;
        }
      }
    }

    // Check active cards if not found in available
    if (!cardRemoved) {
      const activeCardIndex = updatedActiveCards.findIndex(activeCard => activeCard.cardId === cardId);
      if (activeCardIndex !== -1) {
        updatedActiveCards = [
          ...updatedActiveCards.slice(0, activeCardIndex),
          ...updatedActiveCards.slice(activeCardIndex + 1)
        ];
        cardRemoved = true;
      }
    }

    // Check discarded cards if not found elsewhere
    if (!cardRemoved) {
      for (const cardType of Object.keys(updatedDiscardedCards) as CardType[]) {
        const cards = updatedDiscardedCards[cardType] || [];
        const cardIndex = cards.indexOf(cardId);
        if (cardIndex !== -1) {
          updatedDiscardedCards[cardType] = [
            ...cards.slice(0, cardIndex),
            ...cards.slice(cardIndex + 1)
          ];
          cardRemoved = true;
          break;
        }
      }
    }

    return this.stateService.updatePlayer({
      id: playerId,
      availableCards: updatedAvailableCards,
      activeCards: updatedActiveCards,
      discardedCards: updatedDiscardedCards
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
    this.removeCard(playerId, oldCardId);
    this.drawCards(playerId, newCardType, 1);

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
    
    // Add available cards
    if (player.availableCards) {
      for (const type of Object.keys(player.availableCards) as CardType[]) {
        const cards = player.availableCards[type] || [];
        if (cardType) {
          if (type === cardType) {
            allPlayerCards.push(...cards);
          }
        } else {
          allPlayerCards.push(...cards);
        }
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
    
    // Add discarded cards
    if (player.discardedCards) {
      for (const type of Object.keys(player.discardedCards) as CardType[]) {
        const cards = player.discardedCards[type] || [];
        if (cardType) {
          if (type === cardType) {
            allPlayerCards.push(...cards);
          }
        } else {
          allPlayerCards.push(...cards);
        }
      }
    }

    return allPlayerCards;
  }

  getPlayerCardCount(playerId: string, cardType?: CardType): number {
    return this.getPlayerCards(playerId, cardType).length;
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
      const numericCost = typeof card.cost === 'string' ? parseInt(card.cost, 10) : card.cost;
      if (numericCost > 0) {
        if (player.money < numericCost) {
          return { isValid: false, errorMessage: `Insufficient funds. Need $${numericCost}, have $${player.money}` };
        }
      }
    }
    
    // Check phase restrictions for all card types
    if (card.phase_restriction && card.phase_restriction !== 'Any') {
      // Map game phases to card phase restrictions
      const currentPhase = this.mapGamePhaseToCardPhase(gameState.gamePhase);
      if (card.phase_restriction !== currentPhase) {
        return { 
          isValid: false, 
          errorMessage: `Card can only be played during ${card.phase_restriction} phase. Current phase: ${currentPhase}` 
        };
      }
    }
    
    return { isValid: true };
  }

  // Helper method to map game phases to card phase restrictions
  private mapGamePhaseToCardPhase(gamePhase: string): string {
    // Map the game's internal phases to card phase restriction names
    switch (gamePhase.toUpperCase()) {
      case 'SETUP':
        return 'Planning';
      case 'PLAY':
        return 'Development';
      case 'END':
        return 'Marketing';
      default:
        return 'Any';
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

    console.log(`Card ${cardId} activated for player ${playerId}, expires on turn ${expirationTurn}`);
  }

  // Card transfer method
  transferCard(sourcePlayerId: string, targetPlayerId: string, cardId: string): GameState {
    console.log(`Transferring card [${cardId}] from player [${sourcePlayerId}] to player [${targetPlayerId}]`);
    
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
      
      // Check if source player owns the card (only in available cards for transfer)
      if (!this.playerOwnsCardInCollection(sourcePlayerId, cardId, 'available')) {
        throw new Error('You do not own this card or it is not available for transfer');
      }
      
      // Get card type and validate it's transferable
      const cardType = this.getCardType(cardId);
      if (!cardType || !this.isCardTransferable(cardType)) {
        throw new Error(`${cardType || 'Unknown'} cards cannot be transferred`);
      }
      
      // Remove card from source player's available cards
      this.removeCard(sourcePlayerId, cardId);
      
      // Add card to target player's available cards
      const updatedTargetAvailableCards = {
        ...targetPlayer.availableCards,
        [cardType]: [...(targetPlayer.availableCards[cardType] || []), cardId]
      };
      
      this.stateService.updatePlayer({
        id: targetPlayerId,
        availableCards: updatedTargetAvailableCards
      });
      
      console.log(`Successfully transferred card [${cardId}] from ${sourcePlayer.name} to ${targetPlayer.name}`);
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
    collection: 'available' | 'active' | 'discarded' | 'all' = 'all'
  ): boolean {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      return false;
    }

    // Check available cards
    if (collection === 'available' || collection === 'all') {
      const availableCards = player.availableCards || {};
      for (const cardType of Object.keys(availableCards) as CardType[]) {
        const cards = availableCards[cardType];
        if (cards && cards.includes(cardId)) {
          return true;
        }
      }
    }

    // Check active cards
    if (collection === 'active' || collection === 'all') {
      if (player.activeCards && player.activeCards.some(activeCard => activeCard.cardId === cardId)) {
        return true;
      }
    }

    // Check discarded cards
    if (collection === 'discarded' || collection === 'all') {
      const discardedCards = player.discardedCards || {};
      for (const cardType of Object.keys(discardedCards) as CardType[]) {
        const cards = discardedCards[cardType];
        if (cards && cards.includes(cardId)) {
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

    console.log(`Processing card expirations for turn ${currentTurn}`);

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
        console.log(`Player ${player.id}: ${expiredCards.length} cards expired`);
        
        // Move expired cards to discarded collection
        for (const expiredCardId of expiredCards) {
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

    // Add to discarded cards (immutable)
    const discardedCards = {
      ...player.discardedCards,
      [cardType]: [...(player.discardedCards[cardType] || []), cardId]
    };

    this.stateService.updatePlayer({
      id: playerId,
      discardedCards
    });

    console.log(`Expired card ${cardId} moved to discarded pile for player ${playerId}`);
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
    
    // Verify card exists in available cards
    const availableCardsForType = player.availableCards[cardType] || [];
    const cardIndex = availableCardsForType.indexOf(cardId);
    if (cardIndex === -1) {
      throw new Error(`Card ${cardId} not found in player's available cards`);
    }
    
    // Atomic operation: remove from available cards and add to discarded cards
    const availableCards = {
      ...player.availableCards,
      [cardType]: [
        ...availableCardsForType.slice(0, cardIndex),
        ...availableCardsForType.slice(cardIndex + 1)
      ]
    };
    
    const discardedCards = {
      ...player.discardedCards,
      [cardType]: [...(player.discardedCards[cardType] || []), cardId]
    };
    
    // Single state update
    this.stateService.updatePlayer({
      id: playerId,
      availableCards,
      discardedCards
    });
    
    console.log(`Moved card ${cardId} from available to discarded for player ${playerId}`);
  }

  // Card effect methods
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

    console.log(`Applying effects for card ${cardId}: "${card.effects_on_play}"`);

    // Apply expanded mechanics first (common across all card types)
    this.applyExpandedMechanics(playerId, card);

    // Apply effects based on card type and effects_on_play field
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
      // TODO: Implement turn skipping logic in TurnService
      // For now, just log the effect
    }

    // Handle card interaction effects (draw/discard)
    if (card.draw_cards) {
      console.log(`Card ${card.card_id}: Draw cards effect "${card.draw_cards}"`);
      // TODO: Implement unified card drawing logic
    }

    if (card.discard_cards) {
      console.log(`Card ${card.card_id}: Discard cards effect "${card.discard_cards}"`);
      // TODO: Implement unified card discarding logic
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
    const updatedAvailableCards = { ...player.availableCards };
    const updatedActiveCards = [...player.activeCards];
    const updatedDiscardedCards = { ...player.discardedCards };

    // Process each card type
    for (const [cardType, cards] of Object.entries(cardsByType)) {
      const typedCardType = cardType as CardType;
      
      // Remove from available cards
      if (updatedAvailableCards[typedCardType]) {
        updatedAvailableCards[typedCardType] = updatedAvailableCards[typedCardType]!.filter(
          cardId => !cards.includes(cardId)
        );
      }

      // Remove from active cards
      for (const cardId of cards) {
        const activeIndex = updatedActiveCards.findIndex(active => active.cardId === cardId);
        if (activeIndex !== -1) {
          updatedActiveCards.splice(activeIndex, 1);
        }
      }

      // Add to discarded cards
      if (!updatedDiscardedCards[typedCardType]) {
        updatedDiscardedCards[typedCardType] = [];
      }
      updatedDiscardedCards[typedCardType] = [
        ...updatedDiscardedCards[typedCardType]!,
        ...cards
      ];
    }

    // Update player state
    try {
      this.stateService.updatePlayer({
        id: playerId,
        availableCards: updatedAvailableCards,
        activeCards: updatedActiveCards,
        discardedCards: updatedDiscardedCards
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

      return true;

    } catch (error) {
      console.error(`CardService.discardCards: Failed to discard cards for player ${playerId}:`, error);
      return false;
    }
  }
}