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
    return this.playerOwnsCardInCollection(playerId, cardId, 'all');
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

    // Update player's available cards
    const updatedAvailableCards = {
      ...player.availableCards,
      [cardType]: [...(player.availableCards[cardType] || []), ...newCards]
    };

    return this.stateService.updatePlayer({
      id: playerId,
      availableCards: updatedAvailableCards
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
    let updatedState = this.removeCard(playerId, oldCardId);
    updatedState = this.drawCards(playerId, newCardType, 1);

    return updatedState;
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
      if (card.duration && card.duration > 0) {
        // Card has duration - move to activeCards
        this.activateCard(playerId, cardId, card.duration);
        console.log(`Card [${cardId}] activated for ${card.duration} turns`);
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
    if (card.cost && card.cost > 0) {
      if (player.money < card.cost) {
        return { isValid: false, errorMessage: `Insufficient funds. Need $${card.cost}, have $${player.money}` };
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

  // Card activation helper method
  private activateCard(playerId: string, cardId: string, duration: number): void {
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
    // E (Equipment) and L (Legal) cards can be transferred
    // These represent physical equipment and legal permits that can be shared
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

    // Apply effects based on card type and effects_on_play field
    switch (card.card_type) {
      case 'W': // Work cards - Apply Work effects
        return this.applyWorkCardEffect(playerId, card);
      
      case 'B': // Business/Budget cards - Apply Loan effects
        return this.applyBusinessCardEffect(playerId, card);
      
      case 'E': // Equipment/Enhancement cards - Parse specific effects
        return this.applyEquipmentCardEffect(playerId, card);
      
      case 'L': // Legal cards - Enable actions and reduce risks
        return this.applyLegalCardEffect(playerId, card);
      
      case 'I': // Investment cards - Various funding effects
        return this.applyInvestmentCardEffect(playerId, card);
      
      default:
        console.warn(`Unknown card type: ${card.card_type}`);
        return this.stateService.getGameState();
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

  private applyBusinessCardEffect(playerId: string, card: any): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Business cards are loans - add money based on card name/description
    let loanAmount = 0;
    
    if (card.card_name.toLowerCase().includes('small business')) {
      loanAmount = 10000;
    } else if (card.card_name.toLowerCase().includes('startup capital')) {
      loanAmount = 25000;
    } else if (card.card_name.toLowerCase().includes('new venture')) {
      loanAmount = 50000;
    } else if (card.card_name.toLowerCase().includes('building fund')) {
      loanAmount = 100000;
    } else if (card.card_name.toLowerCase().includes('retail space')) {
      loanAmount = 75000;
    } else {
      loanAmount = 20000; // Default loan amount
    }
    
    console.log(`Business loan approved: $${loanAmount}`);
    
    return this.stateService.updatePlayer({
      id: playerId,
      money: player.money + loanAmount
    });
  }

  private applyEquipmentCardEffect(playerId: string, card: any): GameState {
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
        console.log(`Equipment card provided $${moneyGain}`);
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
        console.log(`Equipment card saved ${timeGain} time units`);
      }
    }
    
    if (effects.includes('Draw 1 card')) {
      // Draw 1 additional card of any type
      // For now, we'll draw a random card type (W, B, I, L, E)
      const cardTypes: CardType[] = ['W', 'B', 'I', 'L', 'E'];
      const randomCardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
      
      try {
        this.drawCards(playerId, randomCardType, 1);
        console.log(`Equipment card effect: Drew 1 ${randomCardType} card`);
      } catch (error) {
        console.warn(`Could not draw ${randomCardType} card:`, error);
        // Try a different card type if the first fails
        for (const fallbackType of cardTypes) {
          if (fallbackType !== randomCardType) {
            try {
              this.drawCards(playerId, fallbackType, 1);
              console.log(`Equipment card effect: Drew 1 ${fallbackType} card (fallback)`);
              break;
            } catch (fallbackError) {
              // Continue to next type
            }
          }
        }
      }
    }
    
    console.log(`Equipment effect applied: ${effects}`);
    return this.stateService.getGameState();
  }

  private applyLegalCardEffect(playerId: string, card: any): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Legal cards provide regulatory compliance and enable specific actions
    // Parse the effects_on_play field for specific benefits
    const effects = card.effects_on_play || '';
    console.log(`Legal card played: ${card.card_name}`);
    
    if (effects.includes('Enables')) {
      console.log(`✅ Legal compliance acquired: ${effects}`);
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
    
    // Legal cards provide compliance that can be checked by other game mechanics
    console.log(`Legal requirement fulfilled: ${card.card_name}`);
    
    return this.stateService.getGameState();
  }

  private applyInvestmentCardEffect(playerId: string, card: any): GameState {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Parse investment effects from card name and description
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
      moneyGain = 25000; // Default investment amount
    }
    
    if (moneyGain > 0) {
      console.log(`Investment secured: $${moneyGain}`);
      this.stateService.updatePlayer({
        id: playerId,
        money: player.money + moneyGain
      });
    }
    
    return this.stateService.getGameState();
  }
}