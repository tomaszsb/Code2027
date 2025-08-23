# CSV Integration Guide

## Overview

This guide shows how to integrate the new clean CSV files into your existing JavaScript game code. The restructured data provides cleaner, more maintainable code architecture.

## File Structure

```
data/CLEAN_FILES/
├── MOVEMENT.csv         # Space-to-space connections
├── DICE_OUTCOMES.csv    # Dice roll destinations  
├── SPACE_EFFECTS.csv    # Card/time/money effects
├── DICE_EFFECTS.csv     # Dice-based effects
├── SPACE_CONTENT.csv    # UI display content
└── GAME_CONFIG.csv      # Metadata & configuration
```

## Data Loading

### Basic CSV Loading Function

```javascript
async function loadCSV(filename) {
  const response = await fetch(`data/CLEAN_FILES/${filename}`);
  const text = await response.text();
  
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    return row;
  });
}
```

### Load All Game Data

```javascript
class GameDataLoader {
  constructor() {
    this.movement = [];
    this.diceOutcomes = [];
    this.spaceEffects = [];
    this.diceEffects = [];
    this.spaceContent = [];
    this.gameConfig = [];
  }

  async loadAllData() {
    try {
      [
        this.movement,
        this.diceOutcomes, 
        this.spaceEffects,
        this.diceEffects,
        this.spaceContent,
        this.gameConfig
      ] = await Promise.all([
        loadCSV('MOVEMENT.csv'),
        loadCSV('DICE_OUTCOMES.csv'),
        loadCSV('SPACE_EFFECTS.csv'), 
        loadCSV('DICE_EFFECTS.csv'),
        loadCSV('SPACE_CONTENT.csv'),
        loadCSV('GAME_CONFIG.csv')
      ]);
      
      console.log('✅ All game data loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error loading game data:', error);
      return false;
    }
  }
}
```

## Data Access Patterns

### 1. Movement Engine

```javascript
class MovementEngine {
  constructor(gameData) {
    this.movementData = gameData.movement;
    this.diceOutcomes = gameData.diceOutcomes;
  }

  // Get available moves for a player at a space
  getAvailableMoves(spaceName, visitType) {
    const moveData = this.movementData.find(row => 
      row.space_name === spaceName && row.visit_type === visitType
    );
    
    if (!moveData) return [];

    switch (moveData.movement_type) {
      case 'fixed':
        return [moveData.destination_1].filter(Boolean);
        
      case 'choice':
        return [
          moveData.destination_1,
          moveData.destination_2, 
          moveData.destination_3,
          moveData.destination_4,
          moveData.destination_5
        ].filter(Boolean);
        
      case 'dice':
        return ['REQUIRES_DICE_ROLL'];
        
      case 'dice_outcome':
        return this.getDiceDestinations(spaceName, visitType);
        
      case 'logic':
        return this.getLogicDestinations(spaceName, visitType);
        
      default:
        return [];
    }
  }

  // Handle dice roll outcomes
  getDiceDestinations(spaceName, visitType) {
    const outcome = this.diceOutcomes.find(row =>
      row.space_name === spaceName && row.visit_type === visitType
    );
    
    if (!outcome) return [];
    
    return [
      outcome.roll_1, outcome.roll_2, outcome.roll_3,
      outcome.roll_4, outcome.roll_5, outcome.roll_6
    ].filter(Boolean);
  }

  // Execute movement based on dice roll
  executeDiceMovement(spaceName, visitType, diceRoll) {
    const outcome = this.diceOutcomes.find(row =>
      row.space_name === spaceName && row.visit_type === visitType
    );
    
    if (!outcome) return null;
    
    return outcome[`roll_${diceRoll}`];
  }
}
```

### 2. Effects Engine

```javascript
class EffectsEngine {
  constructor(gameData) {
    this.spaceEffects = gameData.spaceEffects;
    this.diceEffects = gameData.diceEffects;
  }

  // Apply all effects for a space visit
  applySpaceEffects(player, spaceName, visitType, gameState) {
    const effects = this.spaceEffects.filter(row =>
      row.space_name === spaceName && row.visit_type === visitType
    );

    effects.forEach(effect => {
      if (this.meetsCondition(effect.condition, gameState)) {
        this.applyEffect(player, effect);
      }
    });
  }

  // Apply dice-based effects
  applyDiceEffects(player, spaceName, visitType, diceRoll) {
    const effects = this.diceEffects.filter(row =>
      row.space_name === spaceName && row.visit_type === visitType
    );

    effects.forEach(effect => {
      const rollResult = effect[`roll_${diceRoll}`];
      if (rollResult && rollResult !== 'No change') {
        this.applyDiceEffect(player, effect.effect_type, effect.card_type, rollResult);
      }
    });
  }

  // Check if effect condition is met
  meetsCondition(condition, gameState) {
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
      // Add more conditions as needed
      default:
        return false;
    }
  }

  // Apply individual effect
  applyEffect(player, effect) {
    switch (effect.effect_type) {
      case 'time':
        if (effect.effect_action === 'add') {
          player.time += parseInt(effect.effect_value);
        }
        break;
        
      case 'cards':
        this.handleCardEffect(player, effect);
        break;
        
      case 'money':
        this.handleMoneyEffect(player, effect);
        break;
    }
  }

  handleCardEffect(player, effect) {
    const cardType = effect.effect_action.split('_')[1]; // draw_w -> w
    const action = effect.effect_action.split('_')[0];   // draw_w -> draw
    const value = parseInt(effect.effect_value);

    switch (action) {
      case 'draw':
        player.cards[cardType] += value;
        break;
      case 'remove':
        player.cards[cardType] = Math.max(0, player.cards[cardType] - value);
        break;
      case 'replace':
        // Implementation depends on your replace logic
        break;
    }
  }
}
```

### 3. Content Engine

```javascript
class ContentEngine {
  constructor(gameData) {
    this.spaceContent = gameData.spaceContent;
  }

  // Get all content for a space
  getSpaceContent(spaceName, visitType) {
    return this.spaceContent.find(row =>
      row.space_name === spaceName && row.visit_type === visitType
    );
  }

  // Get specific content elements
  getSpaceTitle(spaceName, visitType) {
    const content = this.getSpaceContent(spaceName, visitType);
    return content?.title || 'Unknown Space';
  }

  getSpaceStory(spaceName, visitType) {
    const content = this.getSpaceContent(spaceName, visitType);
    return content?.story || '';
  }

  canNegotiate(spaceName, visitType) {
    const content = this.getSpaceContent(spaceName, visitType);
    return content?.can_negotiate === 'Yes';
  }

  // Render space UI
  renderSpaceUI(spaceName, visitType) {
    const content = this.getSpaceContent(spaceName, visitType);
    if (!content) return;

    document.getElementById('space-title').textContent = content.title;
    document.getElementById('space-story').textContent = content.story;
    document.getElementById('space-action').textContent = content.action_description;
    
    const negotiateBtn = document.getElementById('negotiate-btn');
    negotiateBtn.style.display = content.can_negotiate === 'Yes' ? 'block' : 'none';
  }
}
```

### 4. Game Configuration

```javascript
class GameConfig {
  constructor(gameData) {
    this.gameConfig = gameData.gameConfig;
  }

  isStartingSpace(spaceName) {
    const config = this.gameConfig.find(row => row.space_name === spaceName);
    return config?.is_starting_space === 'Yes';
  }

  isEndingSpace(spaceName) {
    const config = this.gameConfig.find(row => row.space_name === spaceName);
    return config?.is_ending_space === 'Yes';
  }

  getSpacePhase(spaceName) {
    const config = this.gameConfig.find(row => row.space_name === spaceName);
    return config?.phase || 'UNKNOWN';
  }

  requiresDiceRoll(spaceName) {
    const config = this.gameConfig.find(row => row.space_name === spaceName);
    return config?.requires_dice_roll === 'Yes';
  }
}
```

## Integration Example

### Complete Game Turn Handler

```javascript
class GameManager {
  constructor() {
    this.dataLoader = new GameDataLoader();
    this.movementEngine = null;
    this.effectsEngine = null;
    this.contentEngine = null;
    this.gameConfig = null;
  }

  async initialize() {
    await this.dataLoader.loadAllData();
    
    this.movementEngine = new MovementEngine(this.dataLoader);
    this.effectsEngine = new EffectsEngine(this.dataLoader);
    this.contentEngine = new ContentEngine(this.dataLoader);
    this.gameConfig = new GameConfig(this.dataLoader);
  }

  // Handle a complete turn at a space
  async handleSpaceTurn(player, spaceName, visitType, gameState) {
    console.log(`Player ${player.name} visiting ${spaceName} (${visitType})`);

    // 1. Display space content
    this.contentEngine.renderSpaceUI(spaceName, visitType);

    // 2. Apply space effects
    this.effectsEngine.applySpaceEffects(player, spaceName, visitType, gameState);

    // 3. Handle movement
    const availableMoves = this.movementEngine.getAvailableMoves(spaceName, visitType);
    
    if (availableMoves.includes('REQUIRES_DICE_ROLL')) {
      return this.handleDiceRoll(player, spaceName, visitType);
    } else if (availableMoves.length === 1) {
      return this.movePlayer(player, availableMoves[0]);
    } else if (availableMoves.length > 1) {
      return this.showChoiceModal(player, availableMoves);
    }

    return null; // No movement (e.g., FINISH space)
  }

  async handleDiceRoll(player, spaceName, visitType) {
    const diceResult = this.rollDice();
    console.log(`Rolled: ${diceResult}`);

    // Apply dice effects
    this.effectsEngine.applyDiceEffects(player, spaceName, visitType, diceResult);

    // Get destination
    const destination = this.movementEngine.executeDiceMovement(spaceName, visitType, diceResult);
    
    if (destination) {
      return this.movePlayer(player, destination);
    }

    return null;
  }

  rollDice(sides = 6) {
    return Math.floor(Math.random() * sides) + 1;
  }

  movePlayer(player, destination) {
    player.currentSpace = destination;
    console.log(`Player moved to: ${destination}`);
    return destination;
  }
}
```

## Migration Benefits

### Before (Old Messy CSV)
```javascript
// Complex, error-prone parsing
if (spaceData.w_card === "Draw 3") {
  drawCards('W', 3);
} else if (spaceData.w_card === "Draw 1 if scope ≤ $ 4 M") {
  if (player.scope <= 4000000) {
    drawCards('W', 1);
  }
}

// Movement mixed with effects
const moves = [spaceData.space_1, spaceData.space_2].filter(Boolean);
const time = parseInt(spaceData.Time || '0');
```

### After (Clean CSV)
```javascript
// Simple, reliable parsing
const effects = effectsEngine.getSpaceEffects(spaceName, visitType);
effects.forEach(effect => {
  effectsEngine.applyEffect(player, effect);
});

// Clean separation
const moves = movementEngine.getAvailableMoves(spaceName, visitType);
const content = contentEngine.getSpaceContent(spaceName, visitType);
```

## Testing the Integration

```javascript
// Simple test to verify data loading
async function testDataIntegration() {
  const gameManager = new GameManager();
  await gameManager.initialize();

  // Test movement
  const moves = gameManager.movementEngine.getAvailableMoves('OWNER-SCOPE-INITIATION', 'First');
  console.log('Available moves:', moves);

  // Test effects
  const testPlayer = { time: 0, cards: { w: 0, b: 0, l: 0, e: 0, i: 0 } };
  gameManager.effectsEngine.applySpaceEffects(testPlayer, 'OWNER-SCOPE-INITIATION', 'First', {});
  console.log('Player after effects:', testPlayer);

  // Test content
  const content = gameManager.contentEngine.getSpaceContent('OWNER-SCOPE-INITIATION', 'First');
  console.log('Space content:', content);
}
```

This integration provides clean, maintainable code that's much easier to debug and extend than the original mixed CSV approach.