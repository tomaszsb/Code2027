import { StateService } from '../src/services/StateService';
import { DataService } from '../src/services/DataService';
import { CardService } from '../src/services/CardService';
import { ChoiceService } from '../src/services/ChoiceService';
import { EffectEngineService } from '../src/services/EffectEngineService';
import { GameRulesService } from '../src/services/GameRulesService';
import { MovementService } from '../src/services/MovementService';
import { ResourceService } from '../src/services/ResourceService';
import { TurnService } from '../src/services/TurnService';
import { IDataService, IStateService, ITurnService } from '../src/types/ServiceContracts';
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

describe('E2E-01: Happy Path', () => {
  let dataService: IDataService;
  let stateService: IStateService;
  let turnService: ITurnService;

  beforeAll(async () => {
    // 1. Initialize all the real services
    dataService = new NodeDataService();
    await dataService.loadData();

    stateService = new StateService(dataService);
    const resourceService = new ResourceService(stateService);
    const cardService = new CardService(dataService, stateService, resourceService);
    const choiceService = new ChoiceService(stateService);
    const movementService = new MovementService(dataService, stateService, choiceService);
    const gameRulesService = new GameRulesService(dataService, stateService);

    // Handle circular dependency between TurnService and EffectEngineService
    const turnServiceInstance = new TurnService(dataService, stateService, gameRulesService, cardService, resourceService, movementService);
    const effectEngine = new EffectEngineService(resourceService, cardService, choiceService, stateService, movementService, turnServiceInstance, gameRulesService);
    turnServiceInstance.setEffectEngineService(effectEngine);

    turnService = turnServiceInstance;
  });

  it('should allow a single player to start a game and take one turn', async () => {
    // Setup: Add a player and start the game
    stateService.addPlayer('Player 1');
    stateService.startGame();

    const initialGameState = stateService.getGameState();
    const player = initialGameState.players[0];

    // Assert Phase 1: Check that the setup is correct
    expect(player.name).toBe('Player 1');
    expect(player.currentSpace).toBe('OWNER-SCOPE-INITIATION');

    // Action: Take a turn
    await turnService.rollDiceAndProcessEffects(player.id);
    await turnService.triggerManualEffect(player.id, 'cards'); // Perform the manual card draw
    await turnService.endTurnWithMovement();

    // Assert Phase 2: Check that the player has moved
    const finalGameState = stateService.getGameState();
    const finalPlayer = finalGameState.players[0];

    expect(finalPlayer.currentSpace).not.toBe('OWNER-SCOPE-INITIATION');
    console.log(`E2E test success: Player moved from ${player.currentSpace} to ${finalPlayer.currentSpace}`);
  });
});