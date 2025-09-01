import { StateService } from '../src/services/StateService';
import { DataService } from '../src/services/DataService';
import { CardService } from '../src/services/CardService';
import { ChoiceService } from '../src/services/ChoiceService';
import { EffectEngineService } from '../src/services/EffectEngineService';
import { GameRulesService } from '../src/services/GameRulesService';
import { MovementService } from '../src/services/MovementService';
import { ResourceService } from '../src/services/ResourceService';
import { TurnService } from '../src/services/TurnService';
import { PlayerActionService } from '../src/services/PlayerActionService';
import { NegotiationService } from '../src/services/NegotiationService';
import { readFileSync } from 'fs';
import { join } from 'path';

// Node.js compatible DataService for E2E testing
class NodeDataService extends DataService {
  // Override the loadData method to use filesystem instead of fetch
  async loadData(): Promise<void> {
    if ((this as any).loaded) return;

    try {
      const dataDir = join(process.cwd(), 'public', 'data', 'CLEAN_FILES');
      
      // Load all CSV files using filesystem
      const gameConfigCsv = readFileSync(join(dataDir, 'GAME_CONFIG.csv'), 'utf-8');
      const movementCsv = readFileSync(join(dataDir, 'MOVEMENT.csv'), 'utf-8');
      const diceOutcomesCsv = readFileSync(join(dataDir, 'DICE_OUTCOMES.csv'), 'utf-8');
      const spaceEffectsCsv = readFileSync(join(dataDir, 'SPACE_EFFECTS.csv'), 'utf-8');
      const diceEffectsCsv = readFileSync(join(dataDir, 'DICE_EFFECTS.csv'), 'utf-8');
      const spaceContentsCsv = readFileSync(join(dataDir, 'SPACE_CONTENT.csv'), 'utf-8');
      const cardsCsv = readFileSync(join(dataDir, 'CARDS_EXPANDED.csv'), 'utf-8');
      
      // Parse CSV data using existing methods
      (this as any).gameConfigs = (this as any).parseGameConfigCsv(gameConfigCsv);
      (this as any).movements = (this as any).parseMovementCsv(movementCsv);
      (this as any).diceOutcomes = (this as any).parseDiceOutcomesCsv(diceOutcomesCsv);
      (this as any).spaceEffects = (this as any).parseSpaceEffectsCsv(spaceEffectsCsv);
      (this as any).diceEffects = (this as any).parseDiceEffectsCsv(diceEffectsCsv);
      (this as any).spaceContents = (this as any).parseSpaceContentCsv(spaceContentsCsv);
      (this as any).cards = (this as any).parseCardsCsv(cardsCsv);
      
      (this as any).buildSpaces();
      (this as any).loaded = true;
    } catch (error) {
      console.error('Error loading CSV data from filesystem:', error);
      throw new Error('Failed to load game data from filesystem');
    }
  }
}

describe('E2E-03: Complex Space Negotiation Test', () => {
  let dataService: DataService;
  let stateService: StateService;
  let cardService: CardService;
  let choiceService: ChoiceService;
  let effectEngineService: EffectEngineService;
  let gameRulesService: GameRulesService;
  let movementService: MovementService;
  let resourceService: ResourceService;
  let turnService: TurnService;
  let playerActionService: PlayerActionService;
  let negotiationService: NegotiationService;

  beforeAll(async () => {
    // Initialize services
    dataService = new NodeDataService();
    stateService = new StateService(dataService);
    resourceService = new ResourceService(stateService);
    choiceService = new ChoiceService(stateService);
    gameRulesService = new GameRulesService(dataService, stateService);
    cardService = new CardService(dataService, stateService, resourceService);
    movementService = new MovementService(dataService, stateService, choiceService);
    
    // Create temporary services for circular dependency resolution
    const tempEffectEngine = new EffectEngineService(resourceService, cardService, choiceService, stateService, movementService);
    negotiationService = new NegotiationService(stateService, tempEffectEngine);
    
    // Create TurnService with NegotiationService dependency
    turnService = new TurnService(dataService, stateService, gameRulesService, cardService, resourceService, movementService, negotiationService);
    
    // Create EffectEngineService with TurnService dependency
    effectEngineService = new EffectEngineService(resourceService, cardService, choiceService, stateService, movementService, turnService);
    
    // Set EffectEngineService on TurnService to complete the circular dependency
    turnService.setEffectEngineService(effectEngineService);
    
    playerActionService = new PlayerActionService(dataService, stateService, gameRulesService, movementService, turnService, effectEngineService);

    // Load game data
    await dataService.loadData();
  });

  it('should handle negotiation card offer and cancellation properly', async () => {
    // Reset game state for this test
    stateService.resetGame();
    
    // 1. Setup: Create player with some cards
    stateService.addPlayer('Negotiator');
    stateService.startGame();
    
    const gameState = stateService.getGameState();
    const player = gameState.players[0];
    expect(player).toBeDefined();
    expect(player.name).toBe('Negotiator');

    // Give player some cards to offer
    stateService.updatePlayer({ 
      id: player.id, 
      currentSpace: 'OWNER-SCOPE-INITIATION',
      availableCards: {
        W: ['W001', 'W002'],
        E: ['E001'], 
        B: [],
        L: [],
        I: []
      }
    });

    // Get initial player state for comparison
    const initialPlayerState = stateService.getPlayer(player.id)!;
    const initialWCards = [...(initialPlayerState.availableCards?.W || [])];
    const initialECards = [...(initialPlayerState.availableCards?.E || [])];
    
    console.log('Initial player cards:', {
      W: initialWCards,
      E: initialECards
    });

    // 2. Action: Start negotiation
    const negotiationResult = await negotiationService.initiateNegotiation(player.id, {
      type: 'space_negotiation',
      space: 'OWNER-SCOPE-INITIATION'
    });
    
    expect(negotiationResult.success).toBe(true);
    expect(negotiationResult.negotiationId).toBeDefined();
    
    // 3. Action: Make offer with cards
    const offerResult = await negotiationService.makeOffer(player.id, {
      cards: ['W001', 'E001']
    });
    
    expect(offerResult.success).toBe(true);
    
    // 4. Verify cards moved to negotiation state
    const playerAfterOffer = stateService.getPlayer(player.id)!;
    expect(playerAfterOffer.availableCards?.W).not.toContain('W001');
    expect(playerAfterOffer.availableCards?.E).not.toContain('E001');
    expect(playerAfterOffer.availableCards?.W).toContain('W002'); // Should still have this one
    
    console.log('Player cards after offer:', {
      W: playerAfterOffer.availableCards?.W || [],
      E: playerAfterOffer.availableCards?.E || []
    });
    
    // 5. Action: Cancel negotiation (this is where the bug was)
    const cancelResult = await negotiationService.cancelNegotiation(negotiationResult.negotiationId!);
    
    expect(cancelResult.success).toBe(true);
    
    // 6. CRITICAL VERIFICATION: Cards should be restored to player
    const playerAfterCancel = stateService.getPlayer(player.id)!;
    expect(playerAfterCancel.availableCards?.W).toContain('W001'); // BUG FIX: Should be restored
    expect(playerAfterCancel.availableCards?.E).toContain('E001'); // BUG FIX: Should be restored
    expect(playerAfterCancel.availableCards?.W).toContain('W002'); // Should still be there
    
    console.log('Player cards after cancellation:', {
      W: playerAfterCancel.availableCards?.W || [],
      E: playerAfterCancel.availableCards?.E || []
    });
    
    // 7. Verify no active negotiation
    const activeNegotiation = negotiationService.getActiveNegotiation();
    expect(activeNegotiation).toBeNull();
    
    console.log('✅ Negotiation cancellation and card restoration test passed');
  });

  it('should complete negotiation and transfer cards permanently', async () => {
    // Reset game state for this test
    stateService.resetGame();
    
    // 1. Setup: Create players
    stateService.addPlayer('Negotiator');
    stateService.addPlayer('Counterpart');
    stateService.startGame();
    
    const gameState = stateService.getGameState();
    const negotiator = gameState.players[0];
    const counterpart = gameState.players[1];

    // Give negotiator cards to offer
    stateService.updatePlayer({ 
      id: negotiator.id, 
      availableCards: {
        W: ['W001'],
        E: ['E001'], 
        B: [],
        L: [],
        I: []
      }
    });

    // 2. Start negotiation and make offer
    const negotiationResult = await negotiationService.initiateNegotiation(negotiator.id, {
      type: 'space_negotiation'
    });
    
    await negotiationService.makeOffer(negotiator.id, {
      cards: ['W001', 'E001']
    });
    
    // 3. Complete negotiation (cards remain transferred)
    const completeResult = await negotiationService.completeNegotiation(
      negotiationResult.negotiationId!, 
      { agreed: true }
    );
    
    expect(completeResult.success).toBe(true);
    
    // 4. Verify cards remain transferred (not restored)
    const playerAfterComplete = stateService.getPlayer(negotiator.id)!;
    expect(playerAfterComplete.availableCards?.W).not.toContain('W001');
    expect(playerAfterComplete.availableCards?.E).not.toContain('E001');
    
    // 5. Verify no active negotiation
    expect(negotiationService.getActiveNegotiation()).toBeNull();
    
    console.log('✅ Negotiation completion test passed');
  });

  it('should validate card ownership before allowing offers', async () => {
    // Reset game state for this test
    stateService.resetGame();
    
    // Setup
    stateService.addPlayer('Test Player');
    stateService.startGame();
    
    const gameState = stateService.getGameState();
    const player = gameState.players[0];

    // Give player only W cards
    stateService.updatePlayer({ 
      id: player.id,
      availableCards: {
        W: ['W001'],
        E: [], 
        B: [],
        L: [],
        I: []
      }
    });

    // Start negotiation
    const negotiationResult = await negotiationService.initiateNegotiation(player.id, {});
    expect(negotiationResult.success).toBe(true);
    
    // Try to offer card player doesn't own
    const invalidOfferResult = await negotiationService.makeOffer(player.id, {
      cards: ['E999'] // Player doesn't have this card
    });
    
    expect(invalidOfferResult.success).toBe(false);
    expect(invalidOfferResult.message).toContain('does not own card E999');
    
    // Valid offer should work
    const validOfferResult = await negotiationService.makeOffer(player.id, {
      cards: ['W001'] // Player has this card
    });
    
    expect(validOfferResult.success).toBe(true);
    
    console.log('✅ Card ownership validation test passed');
  });

  it('should detect negotiation capability for OWNER-FUND-INITIATION space', async () => {
    // Check space content for negotiation capability
    const spaceContent = dataService.getSpaceContent('OWNER-FUND-INITIATION', 'First');
    expect(spaceContent).toBeDefined();
    expect(spaceContent?.can_negotiate).toBe(true); // CSV parsing converts 'Yes' to true
    expect(spaceContent?.title).toBe('Initial Funding');
    
    // Verify NegotiationService integration
    expect(negotiationService).toBeDefined();
    expect(typeof negotiationService.initiateNegotiation).toBe('function');
    expect(typeof negotiationService.makeOffer).toBe('function');
    expect(typeof negotiationService.cancelNegotiation).toBe('function');
    expect(typeof negotiationService.completeNegotiation).toBe('function');
  });
});