/**
 * COMPLETE JAVASCRIPT CODE EXAMPLES FOR CSV INTEGRATION
 * 
 * This file contains working JavaScript code that demonstrates how to:
 * 1. Load the new clean CSV files
 * 2. Create game engines for movement, effects, and content
 * 3. Handle complete game turns
 * 4. Replace old messy CSV parsing
 */

// ============================================================================
// DATA LOADING UTILITIES
// ============================================================================

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    return row;
  });
}

/**
 * Load a single CSV file
 */
async function loadCSV(filename) {
  try {
    const response = await fetch(`data/CLEAN_FILES/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.status}`);
    }
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    throw error;
  }
}

// ============================================================================
// GAME DATA MANAGER
// ============================================================================

class GameDataManager {
  constructor() {
    this.isLoaded = false;
    this.movement = [];
    this.diceOutcomes = [];
    this.spaceEffects = [];
    this.diceEffects = [];
    this.spaceContent = [];
    this.gameConfig = [];
  }

  /**
   * Load all CSV files in parallel
   */
  async loadAllData() {
    console.log('🔄 Loading game data...');
    
    try {
      const [movement, diceOutcomes, spaceEffects, diceEffects, spaceContent, gameConfig] = 
        await Promise.all([
          loadCSV('MOVEMENT.csv'),
          loadCSV('DICE_OUTCOMES.csv'),
          loadCSV('SPACE_EFFECTS.csv'),
          loadCSV('DICE_EFFECTS.csv'),
          loadCSV('SPACE_CONTENT.csv'),
          loadCSV('GAME_CONFIG.csv')
        ]);

      this.movement = movement;
      this.diceOutcomes = diceOutcomes;
      this.spaceEffects = spaceEffects;
      this.diceEffects = diceEffects;
      this.spaceContent = spaceContent;
      this.gameConfig = gameConfig;
      
      this.isLoaded = true;
      console.log('✅ All game data loaded successfully');
      console.log(`📊 Loaded: ${movement.length} movement rules, ${spaceEffects.length} effects, ${spaceContent.length} content items`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load game data:', error);
      this.isLoaded = false;
      throw error;
    }
  }

  /**
   * Get data by space and visit type
   */
  findBySpace(dataArray, spaceName, visitType) {
    return dataArray.filter(row => 
      row.space_name === spaceName && row.visit_type === visitType
    );
  }

  findOneBySpace(dataArray, spaceName, visitType) {
    return dataArray.find(row => 
      row.space_name === spaceName && row.visit_type === visitType
    );
  }
}

// ============================================================================
// MOVEMENT ENGINE
// ============================================================================

class MovementEngine {
  constructor(gameData) {
    this.gameData = gameData;
  }

  /**
   * Get all available destinations from current space
   */
  getAvailableDestinations(spaceName, visitType) {
    const moveRule = this.gameData.findOneBySpace(this.gameData.movement, spaceName, visitType);
    
    if (!moveRule) {
      console.warn(`No movement rule found for ${spaceName} (${visitType})`);
      return [];
    }

    switch (moveRule.movement_type) {
      case 'fixed':
        return this.getFixedDestinations(moveRule);
      
      case 'choice':
        return this.getChoiceDestinations(moveRule);
      
      case 'dice':
        return ['REQUIRES_DICE_ROLL'];
      
      case 'dice_outcome':
        return this.getDiceOutcomeDestinations(spaceName, visitType);
      
      case 'logic':
        return this.getLogicDestinations(spaceName, visitType);
      
      case 'none':
        return []; // End of game
      
      default:
        console.warn(`Unknown movement type: ${moveRule.movement_type}`);
        return [];
    }
  }

  getFixedDestinations(moveRule) {
    return [moveRule.destination_1].filter(dest => dest && dest.trim());
  }

  getChoiceDestinations(moveRule) {
    return [
      moveRule.destination_1,
      moveRule.destination_2,
      moveRule.destination_3,
      moveRule.destination_4,
      moveRule.destination_5
    ].filter(dest => dest && dest.trim());
  }

  getDiceOutcomeDestinations(spaceName, visitType) {
    const outcomes = this.gameData.findOneBySpace(this.gameData.diceOutcomes, spaceName, visitType);
    
    if (!outcomes) {
      console.warn(`No dice outcomes found for ${spaceName} (${visitType})`);
      return [];
    }

    return [
      outcomes.roll_1, outcomes.roll_2, outcomes.roll_3,
      outcomes.roll_4, outcomes.roll_5, outcomes.roll_6
    ].filter(dest => dest && dest.trim()).filter((dest, index, arr) => arr.indexOf(dest) === index); // Remove duplicates
  }

  /**
   * Execute dice roll and return destination
   */
  executeDiceMovement(spaceName, visitType, diceRoll) {
    const outcomes = this.gameData.findOneBySpace(this.gameData.diceOutcomes, spaceName, visitType);
    
    if (!outcomes) {
      console.error(`No dice outcomes for ${spaceName} (${visitType})`);
      return null;
    }

    const destination = outcomes[`roll_${diceRoll}`];
    console.log(`🎲 Dice roll ${diceRoll} at ${spaceName} → ${destination}`);
    
    return destination;
  }

  /**
   * Handle logic-based movement (like FDNY review)
   */
  getLogicDestinations(spaceName, visitType) {
    // For FDNY logic, return all possible destinations
    // The game logic will determine which one to use based on conditions
    if (spaceName === 'REG-FDNY-FEE-REVIEW') {
      return ['PM-DECISION-CHECK', 'CON-INITIATION', 'REG-FDNY-PLAN-EXAM', 'REG-DOB-TYPE-SELECT'];
    }
    
    return [];
  }

  /**
   * Check if space requires dice roll
   */
  requiresDiceRoll(spaceName, visitType) {
    const destinations = this.getAvailableDestinations(spaceName, visitType);
    return destinations.includes('REQUIRES_DICE_ROLL');
  }

  /**
   * Check if space offers player choice
   */
  offersChoice(spaceName, visitType) {
    const destinations = this.getAvailableDestinations(spaceName, visitType);
    return destinations.length > 1 && !destinations.includes('REQUIRES_DICE_ROLL');
  }
}

// ============================================================================
// EFFECTS ENGINE
// ============================================================================

class EffectsEngine {
  constructor(gameData) {
    this.gameData = gameData;
  }

  /**
   * Apply all space effects for a visit
   */
  applySpaceEffects(player, spaceName, visitType, gameState) {
    const effects = this.gameData.findBySpace(this.gameData.spaceEffects, spaceName, visitType);
    
    console.log(`⚡ Applying ${effects.length} space effects for ${spaceName} (${visitType})`);
    
    effects.forEach(effect => {
      if (this.checkCondition(effect.condition, gameState)) {
        this.applyEffect(player, effect);
        console.log(`  ✓ Applied: ${effect.description}`);
      } else {
        console.log(`  ⏭️  Skipped: ${effect.description} (condition not met: ${effect.condition})`);
      }
    });
  }

  /**
   * Apply dice-based effects
   */
  applyDiceEffects(player, spaceName, visitType, diceRoll, gameState) {
    const effects = this.gameData.findBySpace(this.gameData.diceEffects, spaceName, visitType);
    
    console.log(`🎲 Applying dice effects for ${spaceName} (${visitType}) with roll ${diceRoll}`);
    
    effects.forEach(effect => {
      const rollResult = effect[`roll_${diceRoll}`];
      if (rollResult && rollResult !== 'No change') {
        this.applyDiceEffect(player, effect, rollResult, gameState);
        console.log(`  🎯 Dice effect: ${effect.effect_type} ${effect.card_type} - ${rollResult}`);
      }
    });
  }

  /**
   * Check if effect condition is met
   */
  checkCondition(condition, gameState) {
    switch (condition) {
      case 'always':
        return true;
      
      case 'scope_le_4M':
        return gameState.projectScope <= 4000000;
      
      case 'scope_gt_4M':
        return gameState.projectScope > 4000000;
      
      case 'dice_roll_1':
        return gameState.lastDiceRoll === 1;
      
      case 'dice_roll_2':
        return gameState.lastDiceRoll === 2;
      
      case 'dice_roll_3':
        return gameState.lastDiceRoll === 3;
      
      case 'dice_roll_4':
        return gameState.lastDiceRoll === 4;
      
      case 'dice_roll_5':
        return gameState.lastDiceRoll === 5;
      
      case 'dice_roll_6':
        return gameState.lastDiceRoll === 6;
      
      case 'per_200k':
        return true; // Special handling needed in applyEffect
      
      default:
        console.warn(`Unknown condition: ${condition}`);
        return false;
    }
  }

  /**
   * Apply a single effect to player
   */
  applyEffect(player, effect) {
    const value = parseInt(effect.effect_value) || 0;
    
    switch (effect.effect_type) {
      case 'time':
        this.applyTimeEffect(player, effect.effect_action, value, effect.condition);
        break;
      
      case 'cards':
        this.applyCardEffect(player, effect.effect_action, value);
        break;
      
      case 'money':
        this.applyMoneyEffect(player, effect.effect_action, value, effect.condition);
        break;
      
      default:
        console.warn(`Unknown effect type: ${effect.effect_type}`);
    }
  }

  applyTimeEffect(player, action, value, condition) {
    if (action === 'add') {
      if (condition === 'per_200k') {
        // Special case: time per borrowed amount
        const timeToAdd = Math.ceil(player.borrowedAmount / 200000) * value;
        player.time += timeToAdd;
        console.log(`    ⏰ Added ${timeToAdd} days (${value} per $200K of $${player.borrowedAmount})`);
      } else {
        player.time += value;
        console.log(`    ⏰ Added ${value} days`);
      }
    }
  }

  applyCardEffect(player, action, value) {
    const [actionType, cardType] = action.split('_');
    
    if (!player.cards[cardType]) {
      player.cards[cardType] = 0;
    }
    
    switch (actionType) {
      case 'draw':
        player.cards[cardType] += value;
        console.log(`    🃏 Drew ${value} ${cardType.toUpperCase()} card(s)`);
        break;
      
      case 'remove':
        player.cards[cardType] = Math.max(0, player.cards[cardType] - value);
        console.log(`    🗑️  Removed ${value} ${cardType.toUpperCase()} card(s)`);
        break;
      
      case 'replace':
        console.log(`    🔄 Replace ${value} ${cardType.toUpperCase()} card(s)`);
        // Implement replacement logic based on your game rules
        break;
      
      case 'return':
        player.cards[cardType] = Math.max(0, player.cards[cardType] - value);
        console.log(`    ↩️  Returned ${value} ${cardType.toUpperCase()} card(s)`);
        break;
      
      case 'transfer':
        // Handle transfer to other players
        console.log(`    ➡️  Transfer ${value} card(s) ${action.split('_')[2]}`);
        break;
    }
  }

  applyMoneyEffect(player, action, value, condition) {
    if (action === 'fee_percent') {
      const fee = (player.borrowedAmount || 0) * (value / 100);
      player.money -= fee;
      console.log(`    💰 Applied ${value}% fee: $${fee.toLocaleString()}`);
    }
  }

  /**
   * Apply dice-specific effects
   */
  applyDiceEffect(player, effectType, cardType, rollResult, gameState) {
    switch (effectType) {
      case 'cards':
        this.parseDiceCardEffect(player, cardType, rollResult);
        break;
      
      case 'money':
        this.parseDiceMoneyEffect(player, rollResult);
        break;
      
      case 'time':
        this.parseDiceTimeEffect(player, rollResult);
        break;
      
      case 'quality':
        this.parseDiceQualityEffect(player, rollResult);
        break;
      
      case 'multiplier':
        this.parseDiceMultiplierEffect(player, rollResult);
        break;
    }
  }

  parseDiceCardEffect(player, cardType, rollResult) {
    if (rollResult === 'No change') return;
    
    const match = rollResult.match(/(Draw|Remove|Replace)\s+(\d+)/i);
    if (match) {
      const action = match[1].toLowerCase();
      const amount = parseInt(match[2]);
      
      if (!player.cards[cardType]) player.cards[cardType] = 0;
      
      switch (action) {
        case 'draw':
          player.cards[cardType] += amount;
          break;
        case 'remove':
          player.cards[cardType] = Math.max(0, player.cards[cardType] - amount);
          break;
        case 'replace':
          // Implement replace logic
          break;
      }
      
      console.log(`    🎲 ${action} ${amount} ${cardType} card(s)`);
    }
  }

  parseDiceMoneyEffect(player, rollResult) {
    const feeMatch = rollResult.match(/(\d+)%/);
    if (feeMatch) {
      const percentage = parseInt(feeMatch[1]);
      const fee = (player.borrowedAmount || 0) * (percentage / 100);
      player.money -= fee;
      console.log(`    💰 Applied ${percentage}% fee: $${fee.toLocaleString()}`);
    }
  }

  parseDiceTimeEffect(player, rollResult) {
    const timeMatch = rollResult.match(/(\d+)/);
    if (timeMatch) {
      const days = parseInt(timeMatch[1]);
      player.time += days;
      console.log(`    ⏰ Added ${days} days`);
    }
  }

  parseDiceQualityEffect(player, rollResult) {
    player.contractorQuality = rollResult;
    console.log(`    🏗️  Contractor quality: ${rollResult}`);
  }

  parseDiceMultiplierEffect(player, rollResult) {
    player.costMultiplier = parseInt(rollResult);
    console.log(`    ✖️  Cost multiplier: ${rollResult}x`);
  }
}

// ============================================================================
// CONTENT ENGINE
// ============================================================================

class ContentEngine {
  constructor(gameData) {
    this.gameData = gameData;
  }

  /**
   * Get all content for a space
   */
  getSpaceContent(spaceName, visitType) {
    return this.gameData.findOneBySpace(this.gameData.spaceContent, spaceName, visitType);
  }

  /**
   * Get space configuration
   */
  getSpaceConfig(spaceName) {
    return this.gameData.gameConfig.find(row => row.space_name === spaceName);
  }

  /**
   * Render space content to DOM
   */
  renderSpaceContent(spaceName, visitType) {
    const content = this.getSpaceContent(spaceName, visitType);
    const config = this.getSpaceConfig(spaceName);
    
    if (!content) {
      console.error(`No content found for ${spaceName} (${visitType})`);
      return;
    }

    // Update DOM elements
    this.updateElement('space-title', content.title);
    this.updateElement('space-story', content.story);
    this.updateElement('space-action', content.action_description);
    this.updateElement('space-outcome', content.outcome_description);
    
    // Show/hide negotiate button
    const negotiateBtn = document.getElementById('negotiate-btn');
    if (negotiateBtn) {
      negotiateBtn.style.display = content.can_negotiate === 'Yes' ? 'block' : 'none';
    }
    
    // Update phase indicator
    if (config) {
      this.updateElement('space-phase', config.phase);
      this.updateElement('space-path', config.path_type);
    }
    
    console.log(`🎨 Rendered content for ${spaceName} (${visitType})`);
  }

  updateElement(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text || '';
    }
  }

  /**
   * Check if negotiation is allowed
   */
  canNegotiate(spaceName, visitType) {
    const content = this.getSpaceContent(spaceName, visitType);
    return content?.can_negotiate === 'Yes';
  }

  /**
   * Check if space is end of game
   */
  isGameEnd(spaceName) {
    const config = this.getSpaceConfig(spaceName);
    return config?.is_ending_space === 'Yes';
  }

  /**
   * Check if space is start of game
   */
  isGameStart(spaceName) {
    const config = this.getSpaceConfig(spaceName);
    return config?.is_starting_space === 'Yes';
  }
}

// ============================================================================
// MAIN GAME MANAGER
// ============================================================================

class GameManager {
  constructor() {
    this.dataManager = new GameDataManager();
    this.movementEngine = null;
    this.effectsEngine = null;
    this.contentEngine = null;
    this.isInitialized = false;
  }

  /**
   * Initialize all game systems
   */
  async initialize() {
    console.log('🚀 Initializing Game Manager...');
    
    try {
      await this.dataManager.loadAllData();
      
      this.movementEngine = new MovementEngine(this.dataManager);
      this.effectsEngine = new EffectsEngine(this.dataManager);
      this.contentEngine = new ContentEngine(this.dataManager);
      
      this.isInitialized = true;
      console.log('✅ Game Manager initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Game Manager:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Handle a complete turn at a space
   */
  async processSpaceTurn(player, spaceName, visitType, gameState) {
    if (!this.isInitialized) {
      throw new Error('Game Manager not initialized');
    }

    console.log(`\n🎮 Processing turn: ${player.name} at ${spaceName} (${visitType})`);
    
    // 1. Render space content
    this.contentEngine.renderSpaceContent(spaceName, visitType);
    
    // 2. Apply space effects
    this.effectsEngine.applySpaceEffects(player, spaceName, visitType, gameState);
    
    // 3. Check for game end
    if (this.contentEngine.isGameEnd(spaceName)) {
      console.log('🏁 Game finished!');
      return { type: 'GAME_END', destination: null };
    }
    
    // 4. Handle movement
    const destinations = this.movementEngine.getAvailableDestinations(spaceName, visitType);
    
    if (destinations.length === 0) {
      console.log('🛑 No destinations available');
      return { type: 'NO_MOVEMENT', destination: null };
    }
    
    if (destinations.includes('REQUIRES_DICE_ROLL')) {
      return { type: 'DICE_REQUIRED', destinations };
    }
    
    if (destinations.length === 1) {
      const destination = destinations[0];
      console.log(`➡️  Automatic move to: ${destination}`);
      return { type: 'AUTOMATIC_MOVE', destination };
    }
    
    // Multiple choices available
    console.log(`🤔 Player choice required: ${destinations.join(', ')}`);
    return { type: 'PLAYER_CHOICE', destinations };
  }

  /**
   * Handle dice roll
   */
  rollDiceAndMove(player, spaceName, visitType, gameState) {
    const diceRoll = this.rollDice();
    gameState.lastDiceRoll = diceRoll;
    
    console.log(`🎲 Rolled: ${diceRoll}`);
    
    // Apply dice effects
    this.effectsEngine.applyDiceEffects(player, spaceName, visitType, diceRoll, gameState);
    
    // Get destination
    const destination = this.movementEngine.executeDiceMovement(spaceName, visitType, diceRoll);
    
    return {
      type: 'DICE_MOVE',
      diceRoll,
      destination
    };
  }

  /**
   * Roll a six-sided die
   */
  rollDice(sides = 6) {
    return Math.floor(Math.random() * sides) + 1;
  }

  /**
   * Move player to new space
   */
  movePlayer(player, destination) {
    if (!destination) {
      console.warn('No destination provided for player move');
      return false;
    }
    
    const oldSpace = player.currentSpace;
    player.currentSpace = destination;
    
    // Determine visit type
    if (!player.visitHistory) player.visitHistory = {};
    
    const visitType = player.visitHistory[destination] ? 'Subsequent' : 'First';
    player.visitHistory[destination] = true;
    
    console.log(`🚶 ${player.name}: ${oldSpace} → ${destination} (${visitType} visit)`);
    
    return visitType;
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: Complete game turn workflow
 */
async function exampleGameTurn() {
  // Initialize game
  const gameManager = new GameManager();
  await gameManager.initialize();
  
  // Create test player
  const player = {
    name: 'Test Player',
    currentSpace: 'OWNER-SCOPE-INITIATION',
    time: 0,
    money: 1000000,
    borrowedAmount: 0,
    cards: { w: 0, b: 0, i: 0, l: 0, e: 0 },
    visitHistory: {}
  };
  
  // Create game state
  const gameState = {
    projectScope: 3000000,
    lastDiceRoll: null
  };
  
  // Process the turn
  const result = await gameManager.processSpaceTurn(
    player, 
    'OWNER-SCOPE-INITIATION', 
    'First', 
    gameState
  );
  
  console.log('Turn result:', result);
  
  // Handle the result
  switch (result.type) {
    case 'DICE_REQUIRED':
      const diceResult = gameManager.rollDiceAndMove(player, 'OWNER-SCOPE-INITIATION', 'First', gameState);
      console.log('Dice result:', diceResult);
      
      if (diceResult.destination) {
        const visitType = gameManager.movePlayer(player, diceResult.destination);
        console.log(`Player moved to ${diceResult.destination} (${visitType})`);
      }
      break;
      
    case 'AUTOMATIC_MOVE':
      const visitType = gameManager.movePlayer(player, result.destination);
      console.log(`Player moved to ${result.destination} (${visitType})`);
      break;
      
    case 'PLAYER_CHOICE':
      console.log('Available choices:', result.destinations);
      // In real game, show choice UI to player
      break;
  }
  
  console.log('Final player state:', player);
}

/**
 * Example: Testing specific game mechanics
 */
async function testGameMechanics() {
  const gameManager = new GameManager();
  await gameManager.initialize();
  
  // Test movement engine
  console.log('\n🧪 Testing Movement Engine:');
  const destinations = gameManager.movementEngine.getAvailableDestinations('PM-DECISION-CHECK', 'First');
  console.log('PM-DECISION-CHECK destinations:', destinations);
  
  // Test effects engine
  console.log('\n🧪 Testing Effects Engine:');
  const testPlayer = { time: 0, money: 100000, cards: { w: 0, b: 0, l: 0, e: 0, i: 0 } };
  const testGameState = { projectScope: 2000000, lastDiceRoll: 3 };
  
  gameManager.effectsEngine.applySpaceEffects(testPlayer, 'OWNER-SCOPE-INITIATION', 'First', testGameState);
  console.log('Player after effects:', testPlayer);
  
  // Test content engine
  console.log('\n🧪 Testing Content Engine:');
  const content = gameManager.contentEngine.getSpaceContent('OWNER-SCOPE-INITIATION', 'First');
  console.log('Space content:', content);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Auto-run example when loaded (comment out in production)
// document.addEventListener('DOMContentLoaded', async () => {
//   try {
//     await exampleGameTurn();
//     await testGameMechanics();
//   } catch (error) {
//     console.error('Example failed:', error);
//   }
// });

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GameManager,
    GameDataManager,
    MovementEngine,
    EffectsEngine,
    ContentEngine,
    loadCSV,
    parseCSV
  };
}