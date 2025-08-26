#!/usr/bin/env ts-node

/**
 * E2E-01: Happy Path Test
 * 
 * End-to-End test that simulates a complete 2-player game for 10 turns (5 turns each).
 * This test verifies that all services work together correctly and that the core
 * game flow functions without errors.
 */

// Node.js specific imports
import { readFileSync } from 'fs';
import { join } from 'path';

// Service Imports (matching ServiceProvider.tsx)
import { DataService } from '../src/services/DataService';
import { StateService } from '../src/services/StateService';
import { TurnService } from '../src/services/TurnService';
import { CardService } from '../src/services/CardService';
import { PlayerActionService } from '../src/services/PlayerActionService';
import { MovementService } from '../src/services/MovementService';
import { GameRulesService } from '../src/services/GameRulesService';
import { ResourceService } from '../src/services/ResourceService';
import { ChoiceService } from '../src/services/ChoiceService';
import { EffectEngineService } from '../src/services/EffectEngineService';
import { NegotiationService } from '../src/services/NegotiationService';

// Node.js compatible DataService for E2E testing
class NodeDataService extends DataService {
  // Override the loadData method to use filesystem instead of fetch
  async loadData(): Promise<void> {
    if (this.loaded) return;

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

async function runHappyPathTest(): Promise<void> {
  console.log('--- Starting E2E-01: Happy Path Test ---');
  
  try {
    // === SETUP: Instantiate all services (matching ServiceProvider.tsx) ===
    console.log('🔧 Setting up services...');
    
    const dataService = new NodeDataService();
    const stateService = new StateService(dataService);
    const resourceService = new ResourceService(stateService);
    const choiceService = new ChoiceService(stateService);
    const gameRulesService = new GameRulesService(dataService, stateService);
    const cardService = new CardService(dataService, stateService, resourceService);
    const movementService = new MovementService(dataService, stateService, choiceService);
    
    // Create TurnService first (without EffectEngineService initially)
    const turnService = new TurnService(dataService, stateService, gameRulesService, cardService, resourceService);
    
    // Create EffectEngineService with TurnService dependency
    const effectEngineService = new EffectEngineService(resourceService, cardService, choiceService, stateService, movementService, turnService);
    
    // Set EffectEngineService on TurnService to complete the circular dependency
    turnService.setEffectEngineService(effectEngineService);
    
    const playerActionService = new PlayerActionService(dataService, stateService, gameRulesService, movementService, turnService, effectEngineService);
    const negotiationService = new NegotiationService(stateService, effectEngineService);
    
    console.log('✅ All services instantiated successfully');
    
    // === INITIALIZATION ===
    console.log('🎮 Initializing game...');
    
    // Load data
    await dataService.loadData();
    console.log('✅ Game data loaded');
    
    // Add two players
    let gameState = stateService.addPlayer('Player A');
    gameState = stateService.addPlayer('Player B');
    console.log('✅ Added Player A and Player B');
    
    // Start the game
    gameState = stateService.startGame();
    console.log('✅ Game started');
    console.log(`   Current player: ${gameState.currentPlayerId}`);
    console.log(`   Game phase: ${gameState.gamePhase}`);
    
    // === GAME LOOP: 10 turns (5 per player) ===
    console.log('🎯 Starting game loop...');
    
    for (let turn = 1; turn <= 10; turn++) {
      console.log(`\n--- Turn ${turn} ---`);
      
      // Get current player
      gameState = stateService.getGameState();
      const currentPlayerId = gameState.currentPlayerId;
      
      if (!currentPlayerId) {
        throw new Error(`No current player at turn ${turn}`);
      }
      
      const currentPlayer = stateService.getPlayer(currentPlayerId);
      const playerName = currentPlayer?.name || currentPlayerId;
      
      console.log(`🎲 ${playerName}'s turn`);
      console.log(`   Money: $${currentPlayer?.money || 0}`);
      console.log(`   Time: ${currentPlayer?.timeSpent || 0} hours`);
      console.log(`   Current space: ${currentPlayer?.currentSpace || 'Unknown'}`);
      
      // Roll dice and process effects
      console.log('   Rolling dice and processing effects...');
      const diceResult = await turnService.rollDiceAndProcessEffects(currentPlayerId);
      console.log(`   🎲 Rolled: ${diceResult.diceRoll}`);
      
      // End turn (handles movement and advances to next player)
      console.log('   Ending turn...');
      const endTurnResult = await turnService.endTurnWithMovement();
      console.log(`   ➡️ Next player: ${endTurnResult.nextPlayerId}`);
      
      // Check if game ended
      gameState = stateService.getGameState();
      if (gameState.isGameOver) {
        console.log(`🏆 Game ended! Winner: ${gameState.winner}`);
        break;
      }
    }
    
    // === VERIFICATION ===
    console.log('\n🔍 Final game state verification...');
    
    const finalGameState = stateService.getGameState();
    const allPlayers = stateService.getAllPlayers();
    
    console.log('📊 Final Player States:');
    allPlayers.forEach((player, index) => {
      console.log(`\n   Player ${index + 1}: ${player.name}`);
      console.log(`   • Money: $${player.money}`);
      console.log(`   • Time: ${player.timeSpent} hours`);
      console.log(`   • Current space: ${player.currentSpace}`);
      console.log(`   • Cards: W(${player.availableCards?.W?.length || 0}) B(${player.availableCards?.B?.length || 0}) E(${player.availableCards?.E?.length || 0}) L(${player.availableCards?.L?.length || 0}) I(${player.availableCards?.I?.length || 0})`);
    });
    
    console.log(`\n🎮 Game Status:`);
    console.log(`   • Phase: ${finalGameState.gamePhase}`);
    console.log(`   • Turn: ${finalGameState.turn}`);
    console.log(`   • Game Over: ${finalGameState.isGameOver}`);
    console.log(`   • Winner: ${finalGameState.winner || 'None'}`);
    console.log(`   • Active Negotiation: ${finalGameState.activeNegotiation ? 'Yes' : 'No'}`);
    
    console.log('\n--- E2E-01: Happy Path Test Complete ---');
    console.log('✅ All tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ E2E Test Failed:');
    console.error(error);
    process.exit(1);
  }
}

// Execute the test
if (require.main === module) {
  runHappyPathTest()
    .then(() => {
      console.log('\n🎉 E2E test execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 E2E test execution failed:');
      console.error(error);
      process.exit(1);
    });
}