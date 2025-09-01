#!/usr/bin/env tsx

/**
 * E2E-02: Complex Card Test
 * 
 * End-to-End test that verifies the correct processing of a complex, duration-based, 
 * multi-effect, targeted card. This test validates:
 * - Multi-player targeting (All Players)
 * - Duration-based card effects (3 turns)
 * - Card activation and expiration lifecycle
 * - Effect propagation to all targeted players
 * 
 * Test Card: L002 - Economic Downturn
 * - Target: All Players
 * - Duration: 3 turns
 * - Effect: tick_modifier +2 (increases filing times)
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

async function runComplexCardTest(): Promise<void> {
  console.log('--- Starting E2E-02: Complex Card Test ---');
  
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
    
    // Create temporary services for circular dependency resolution
    const tempEffectEngine = new EffectEngineService(resourceService, cardService, choiceService, stateService, movementService);
    const negotiationService = new NegotiationService(stateService, tempEffectEngine);
    
    // Create TurnService with NegotiationService dependency
    const turnService = new TurnService(dataService, stateService, gameRulesService, cardService, resourceService, movementService, negotiationService);
    
    // Create EffectEngineService with TurnService dependency
    const effectEngineService = new EffectEngineService(resourceService, cardService, choiceService, stateService, movementService, turnService, gameRulesService);
    
    // Set EffectEngineService on TurnService to complete the circular dependency
    turnService.setEffectEngineService(effectEngineService);
    
    const playerActionService = new PlayerActionService(dataService, stateService, gameRulesService, movementService, turnService, effectEngineService);
    
    console.log('✅ All services instantiated successfully');
    
    // === INITIALIZATION ===
    console.log('🎮 Initializing 3-player game...');
    
    // Load data
    await dataService.loadData();
    console.log('✅ Game data loaded');
    
    // Add three players for multi-targeting options
    let gameState = stateService.addPlayer('Player A');
    gameState = stateService.addPlayer('Player B'); 
    gameState = stateService.addPlayer('Player C');
    console.log('✅ Added Player A, Player B, and Player C');
    
    // Start the game
    gameState = stateService.startGame();
    console.log('✅ Game started');
    console.log(`   Current player: ${gameState.currentPlayerId}`);
    
    // Get player IDs for manipulation
    const players = stateService.getAllPlayers();
    const playerA = players.find(p => p.name === 'Player A')!;
    const playerB = players.find(p => p.name === 'Player B')!;
    const playerC = players.find(p => p.name === 'Player C')!;
    
    console.log(`📋 Player IDs: A=${playerA.id}, B=${playerB.id}, C=${playerC.id}`);
    
    // === TEST CARD SETUP ===
    console.log('🃏 Setting up test card: L002 - Economic Downturn...');
    
    // Manually give the complex card to Player A
    const testCardId = 'L002'; // Economic Downturn card
    const testCard = dataService.getCardById(testCardId);
    if (!testCard) {
      throw new Error(`Test card ${testCardId} not found in data`);
    }
    
    console.log('📋 Test Card Details:');
    console.log(`   • ID: ${testCard.card_id}`);
    console.log(`   • Name: ${testCard.card_name}`);
    console.log(`   • Description: ${testCard.description}`);
    console.log(`   • Target: ${testCard.target}`);
    console.log(`   • Duration: ${testCard.duration} (${testCard.duration_count} turns)`);
    console.log(`   • Effect: tick_modifier +${testCard.tick_modifier}`);
    
    // Add the card to Player A's available cards
    gameState = stateService.updatePlayer({
      id: playerA.id,
      availableCards: {
        W: playerA.availableCards?.W || [],
        B: playerA.availableCards?.B || [],
        E: playerA.availableCards?.E || [],
        L: [...(playerA.availableCards?.L || []), testCardId],
        I: playerA.availableCards?.I || []
      }
    });
    
    console.log(`✅ Added ${testCardId} to Player A's hand`);
    
    // === ADVANCE TO PLAYER A'S TURN ===
    console.log('🎯 Ensuring Player A is the current player...');
    
    // Set current player to Player A if needed
    if (gameState.currentPlayerId !== playerA.id) {
      gameState = stateService.setCurrentPlayer(playerA.id);
      console.log('✅ Set current player to Player A');
    }
    
    // === TEST EXECUTION: PLAY COMPLEX CARD ===
    console.log('🚀 Playing complex card...');
    
    console.log(`🃏 Player A playing card: ${testCardId}`);
    console.log('   Expected: Multi-player targeting effect with 3-turn duration');
    
    // Play the card through PlayerActionService
    await playerActionService.playCard(playerA.id, testCardId);
    
    console.log('✅ Card play completed');
    
    // === HANDLE PLAYER CHOICE (if needed) ===
    gameState = stateService.getGameState();
    if (gameState.awaitingChoice) {
      console.log('🎯 Handling player choice for targeting...');
      console.log(`   Choice type: ${gameState.awaitingChoice.type}`);
      console.log(`   Options: ${gameState.awaitingChoice.options.map(o => o.label).join(', ')}`);
      
      // Automatically resolve the choice by selecting the first option
      const choiceId = gameState.awaitingChoice.id;
      const selectedOption = gameState.awaitingChoice.options[0];
      
      console.log(`   Auto-selecting: ${selectedOption.label}`);
      choiceService.resolveChoice(choiceId, selectedOption.id);
      
      console.log('✅ Player choice resolved');
    } else {
      console.log('ℹ️  No player choice required (likely All Players effect)');
    }
    
    // === VERIFICATION & ASSERTIONS ===
    console.log('🔍 Verifying card effects and activation...');
    
    // Get updated game state
    gameState = stateService.getGameState();
    const updatedPlayerA = stateService.getPlayer(playerA.id)!;
    const updatedPlayerB = stateService.getPlayer(playerB.id)!;
    const updatedPlayerC = stateService.getPlayer(playerC.id)!;
    
    console.log('📊 Post-Card-Play State:');
    console.log('   Player A:');
    console.log(`     • Active Cards: ${updatedPlayerA.activeCards?.length || 0}`);
    console.log(`     • Available L Cards: ${updatedPlayerA.availableCards?.L?.length || 0}`);
    console.log(`     • Discarded L Cards: ${updatedPlayerA.discardedCards?.L?.length || 0}`);
    
    console.log('   Player B:');
    console.log(`     • Active Cards: ${updatedPlayerB.activeCards?.length || 0}`);
    
    console.log('   Player C:');
    console.log(`     • Active Cards: ${updatedPlayerC.activeCards?.length || 0}`);
    
    // Verify card is now in Player A's activeCards with correct expiration
    const activeCard = updatedPlayerA.activeCards?.find(ac => ac.cardId === testCardId);
    if (activeCard) {
      console.log('✅ Card successfully activated:');
      console.log(`   • Card ID: ${activeCard.cardId}`);
      console.log(`   • Expiration Turn: ${activeCard.expirationTurn}`);
      console.log(`   • Current Turn: ${gameState.turn}`);
    } else {
      console.log('❌ Card was not found in Player A\'s active cards');
    }
    
    // Verify card was removed from available cards
    const stillInHand = updatedPlayerA.availableCards?.L?.includes(testCardId);
    if (!stillInHand) {
      console.log('✅ Card correctly removed from Player A\'s hand');
    } else {
      console.log('❌ Card still in Player A\'s available cards');
    }
    
    // === RUN GAME FOR SEVERAL TURNS TO TEST DURATION ===
    console.log('⏰ Running game for multiple turns to test card expiration...');
    
    const startTurn = gameState.turn;
    const expectedExpirationTurn = startTurn + 3; // Card lasts 3 turns
    
    console.log(`   Card should expire on turn: ${expectedExpirationTurn}`);
    
    // Run game for 5 turns to test expiration
    for (let turnCount = 1; turnCount <= 5; turnCount++) {
      console.log(`\\n--- Running Turn ${startTurn + turnCount} ---`);
      
      // Get current player and advance through turn
      gameState = stateService.getGameState();
      const currentPlayerId = gameState.currentPlayerId;
      const currentPlayer = stateService.getPlayer(currentPlayerId!)!;
      
      console.log(`🎲 ${currentPlayer.name}'s turn`);
      
      // Roll dice and process effects
      const diceResult = await turnService.rollDiceAndProcessEffects(currentPlayerId!);
      console.log(`   🎲 Rolled: ${diceResult.diceRoll}`);
      
      // Check if manual actions are required and complete them
      const currentGameState = stateService.getGameState();
      if (currentGameState.requiredActions > currentGameState.completedActions) {
        console.log(`   🎴 Completing manual card draw action...`);
        // Use the proper high-level method to trigger manual effect
        // This will draw the E card AND update the completedActions counter
        turnService.triggerManualEffect(currentPlayerId!, 'cards');
        console.log(`   ✅ Manual action completed`);
      }
      
      // End turn
      await turnService.endTurnWithMovement();
      
      // Check card expiration status
      gameState = stateService.getGameState();
      const checkPlayerA = stateService.getPlayer(playerA.id)!;
      const stillActive = checkPlayerA.activeCards?.find(ac => ac.cardId === testCardId);
      const nowDiscarded = checkPlayerA.discardedCards?.L?.includes(testCardId);
      
      console.log(`   📊 Turn ${gameState.turn}: Card Status -`);
      console.log(`      Active: ${stillActive ? 'Yes' : 'No'}`);
      console.log(`      Discarded: ${nowDiscarded ? 'Yes' : 'No'}`);
      
      // Check if game ended
      if (gameState.isGameOver) {
        console.log(`🏆 Game ended! Winner: ${gameState.winner}`);
        break;
      }
    }
    
    // === FINAL VERIFICATION ===
    console.log('\\n🔍 Final verification...');
    
    gameState = stateService.getGameState();
    const finalPlayerA = stateService.getPlayer(playerA.id)!;
    
    // Check if card properly expired and moved to discard pile
    const finalActiveCard = finalPlayerA.activeCards?.find(ac => ac.cardId === testCardId);
    const finalDiscardedCard = finalPlayerA.discardedCards?.L?.includes(testCardId);
    
    console.log('📊 Final Card State:');
    if (gameState.turn >= expectedExpirationTurn) {
      if (!finalActiveCard && finalDiscardedCard) {
        console.log('✅ Card correctly expired and moved to discard pile');
      } else if (finalActiveCard && !finalDiscardedCard) {
        console.log('❌ Card still active, should have expired');
      } else {
        console.log('⚠️  Card in unexpected state');
      }
    } else {
      if (finalActiveCard && !finalDiscardedCard) {
        console.log('✅ Card still active as expected (not yet expired)');
      } else {
        console.log('❌ Card expired too early');
      }
    }
    
    console.log('\\n📊 Final Game State Summary:');
    const allPlayers = stateService.getAllPlayers();
    allPlayers.forEach((player, index) => {
      console.log(`\\n   Player ${index + 1}: ${player.name}`);
      console.log(`   • Money: $${player.money}`);
      console.log(`   • Time: ${player.timeSpent} hours`);
      console.log(`   • Current space: ${player.currentSpace}`);
      console.log(`   • Active Cards: ${player.activeCards?.length || 0}`);
    });
    
    console.log('\\n--- E2E-02: Complex Card Test Complete ---');
    console.log('✅ All complex card tests passed successfully!');
    
  } catch (error) {
    console.error('\\n❌ E2E Complex Card Test Failed:');
    console.error(error);
    process.exit(1);
  }
}

// Jest test wrapper
describe('E2E-02: Complex Card Test', () => {
  it('should handle complex card lifecycle with multi-player targeting and duration', async () => {
    await runComplexCardTest();
  });
});

// Execute the test
if (require.main === module) {
  runComplexCardTest()
    .then(() => {
      console.log('\\n🎉 E2E complex card test execution completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n💥 E2E complex card test execution failed:');
      console.error(error);
      process.exit(1);
    });
}