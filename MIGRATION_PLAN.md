# Step-by-Step Migration Plan

## Overview

This migration plan guides you through replacing your existing messy CSV parsing with the new clean CSV architecture. Follow these steps in order to avoid breaking your game while transitioning to the new data structure.

## Prerequisites

✅ **Completed:**
- 6 clean CSV files created in `/data/CLEAN_FILES/`
- Data integrity validated (zero data loss)
- Integration documentation reviewed
- JavaScript code examples studied

## Migration Strategy: Parallel Implementation

**🎯 Goal:** Run old and new systems side-by-side, then gradually switch over to minimize risk.

---

## Phase 1: Setup New Data Loading (Week 1)

### Step 1.1: Add New Files to Project

```bash
# Copy files to your web directory
cp data/CLEAN_FILES/*.csv your-web-directory/data/CLEAN_FILES/
cp CODE_EXAMPLES.js your-web-directory/js/
cp INTEGRATION_GUIDE.md your-web-directory/docs/
```

### Step 1.2: Include New JavaScript

Add to your main HTML file:

```html
<!-- Add after your existing scripts -->
<script src="js/CODE_EXAMPLES.js"></script>
```

### Step 1.3: Test Data Loading

Add this test to your existing code:

```javascript
// Test the new data loading (doesn't affect existing game)
async function testNewDataSystem() {
  try {
    const gameManager = new GameManager();
    await gameManager.initialize();
    console.log('✅ New data system loaded successfully');
    
    // Test a few key spaces
    const testSpaces = ['OWNER-SCOPE-INITIATION', 'PM-DECISION-CHECK', 'FINISH'];
    testSpaces.forEach(space => {
      const content = gameManager.contentEngine.getSpaceContent(space, 'First');
      console.log(`📍 ${space}:`, content?.title);
    });
    
    return gameManager;
  } catch (error) {
    console.error('❌ New data system failed:', error);
    return null;
  }
}

// Run test on page load
document.addEventListener('DOMContentLoaded', async () => {
  const newSystem = await testNewDataSystem();
  if (newSystem) {
    window.newGameManager = newSystem; // Store for Phase 2
  }
});
```

**✅ Success Criteria:** Console shows "New data system loaded successfully" with no errors.

---

## Phase 2: Parallel Content Display (Week 2)

### Step 2.1: Identify Current Content Code

Find where your game currently displays space information. Look for:

```javascript
// Old pattern - find code like this:
document.getElementById('story').textContent = spaceData.Event;
document.getElementById('action').textContent = spaceData.Action;
```

### Step 2.2: Create Comparison Function

Add this to test content accuracy:

```javascript
function compareContentSystems(spaceName, visitType, oldSpaceData) {
  if (!window.newGameManager) return;
  
  const newContent = window.newGameManager.contentEngine.getSpaceContent(spaceName, visitType);
  
  console.log(`🔍 Comparing content for ${spaceName} (${visitType}):`);
  console.log('Old story:', oldSpaceData.Event);
  console.log('New story:', newContent?.story);
  console.log('Old action:', oldSpaceData.Action);
  console.log('New action:', newContent?.action_description);
  
  // Check if content matches
  if (oldSpaceData.Event?.trim() === newContent?.story?.trim()) {
    console.log('✅ Story content matches');
  } else {
    console.log('⚠️  Story content differs');
  }
}
```

### Step 2.3: Add Side-by-Side Testing

Modify your space display function:

```javascript
function displaySpaceContent(spaceName, visitType, oldSpaceData) {
  // Existing old code (keep working)
  document.getElementById('story').textContent = oldSpaceData.Event;
  document.getElementById('action').textContent = oldSpaceData.Action;
  
  // NEW: Add comparison test (doesn't affect game)
  compareContentSystems(spaceName, visitType, oldSpaceData);
  
  // NEW: Optional - show new content in different elements for comparison
  if (window.newGameManager) {
    const newContent = window.newGameManager.contentEngine.getSpaceContent(spaceName, visitType);
    
    // Create test elements (add to HTML)
    const testDiv = document.getElementById('new-content-test');
    if (testDiv && newContent) {
      testDiv.innerHTML = `
        <h4>New System Content:</h4>
        <p><strong>Title:</strong> ${newContent.title}</p>
        <p><strong>Story:</strong> ${newContent.story}</p>
        <p><strong>Action:</strong> ${newContent.action_description}</p>
      `;
    }
  }
}
```

**✅ Success Criteria:** Both old and new content display correctly, comparison logs show matches.

---

## Phase 3: Parallel Movement Logic (Week 3)

### Step 3.1: Test Movement Calculations

Add movement comparison:

```javascript
function compareMovementSystems(spaceName, visitType, oldSpaceData) {
  if (!window.newGameManager) return;
  
  // Old movement logic (extract from your existing code)
  const oldDestinations = [
    oldSpaceData.space_1,
    oldSpaceData.space_2,
    oldSpaceData.space_3,
    oldSpaceData.space_4,
    oldSpaceData.space_5
  ].filter(dest => dest && dest.trim());
  
  // New movement logic
  const newDestinations = window.newGameManager.movementEngine
    .getAvailableDestinations(spaceName, visitType);
  
  console.log(`🔍 Comparing movement for ${spaceName} (${visitType}):`);
  console.log('Old destinations:', oldDestinations);
  console.log('New destinations:', newDestinations);
  
  if (JSON.stringify(oldDestinations.sort()) === JSON.stringify(newDestinations.sort())) {
    console.log('✅ Movement destinations match');
  } else {
    console.log('⚠️  Movement destinations differ');
  }
}
```

### Step 3.2: Test Dice Roll Logic

```javascript
function compareDiceRolls(spaceName, visitType, diceRoll) {
  if (!window.newGameManager) return;
  
  // Test dice outcomes
  const newDestination = window.newGameManager.movementEngine
    .executeDiceMovement(spaceName, visitType, diceRoll);
  
  console.log(`🎲 Dice test ${spaceName} roll ${diceRoll} → ${newDestination}`);
  
  // Compare with your existing dice logic here
}
```

**✅ Success Criteria:** Movement comparisons show matching destinations.

---

## Phase 4: Parallel Effects System (Week 4)

### Step 4.1: Test Effects Calculation

```javascript
function compareEffectsSystems(player, spaceName, visitType, gameState) {
  if (!window.newGameManager) return;
  
  // Save player state
  const originalPlayer = JSON.parse(JSON.stringify(player));
  
  // Test new effects (don't modify real player)
  const testPlayer = JSON.parse(JSON.stringify(player));
  window.newGameManager.effectsEngine.applySpaceEffects(testPlayer, spaceName, visitType, gameState);
  
  console.log(`🔍 Comparing effects for ${spaceName} (${visitType}):`);
  console.log('Original player:', originalPlayer);
  console.log('After new effects:', testPlayer);
  
  // Compare specific changes
  if (testPlayer.time !== originalPlayer.time) {
    console.log(`⏰ Time change: ${originalPlayer.time} → ${testPlayer.time}`);
  }
  
  Object.keys(testPlayer.cards).forEach(cardType => {
    if (testPlayer.cards[cardType] !== originalPlayer.cards[cardType]) {
      console.log(`🃏 ${cardType} cards: ${originalPlayer.cards[cardType]} → ${testPlayer.cards[cardType]}`);
    }
  });
}
```

**✅ Success Criteria:** Effects calculations match expected results from old system.

---

## Phase 5: Gradual Cutover (Week 5-6)

### Step 5.1: Switch Content First

Replace old content display:

```javascript
// OLD CODE (comment out):
// document.getElementById('story').textContent = oldSpaceData.Event;
// document.getElementById('action').textContent = oldSpaceData.Action;

// NEW CODE:
function displaySpaceContent(spaceName, visitType) {
  const content = window.newGameManager.contentEngine.getSpaceContent(spaceName, visitType);
  
  if (content) {
    document.getElementById('story').textContent = content.story;
    document.getElementById('action').textContent = content.action_description;
    document.getElementById('outcome').textContent = content.outcome_description;
    
    // Handle negotiate button
    const negotiateBtn = document.getElementById('negotiate-btn');
    if (negotiateBtn) {
      negotiateBtn.style.display = content.can_negotiate === 'Yes' ? 'block' : 'none';
    }
  } else {
    console.error(`No content found for ${spaceName} (${visitType})`);
  }
}
```

### Step 5.2: Switch Movement Logic

Replace movement code:

```javascript
// OLD CODE (comment out):
// const destinations = [spaceData.space_1, spaceData.space_2, ...].filter(Boolean);

// NEW CODE:
function getPlayerDestinations(spaceName, visitType) {
  const destinations = window.newGameManager.movementEngine
    .getAvailableDestinations(spaceName, visitType);
  
  if (destinations.includes('REQUIRES_DICE_ROLL')) {
    return 'DICE_REQUIRED';
  }
  
  return destinations;
}

function executeDiceMovement(spaceName, visitType, diceRoll) {
  return window.newGameManager.movementEngine
    .executeDiceMovement(spaceName, visitType, diceRoll);
}
```

### Step 5.3: Switch Effects Logic

Replace effects code:

```javascript
// OLD CODE (comment out):
// if (spaceData.w_card === "Draw 3") { player.cards.w += 3; }
// if (spaceData.Time) { player.time += parseInt(spaceData.Time); }

// NEW CODE:
function applySpaceEffects(player, spaceName, visitType, gameState) {
  window.newGameManager.effectsEngine
    .applySpaceEffects(player, spaceName, visitType, gameState);
}

function applyDiceEffects(player, spaceName, visitType, diceRoll, gameState) {
  window.newGameManager.effectsEngine
    .applyDiceEffects(player, spaceName, visitType, diceRoll, gameState);
}
```

**✅ Success Criteria:** Game works identically to before, but using new CSV system.

---

## Phase 6: Complete Transition (Week 7)

### Step 6.1: Remove Old CSV Files

```javascript
// Remove old CSV loading code
// Delete or comment out old parseSpacesCSV(), parseDiceRollCSV() functions
```

### Step 6.2: Clean Up Code

```javascript
// Remove comparison functions
// Remove test elements from HTML
// Remove old commented code
// Remove old CSV file references
```

### Step 6.3: Use Complete Game Manager

Replace ad-hoc function calls with complete turn processing:

```javascript
// Instead of calling individual functions, use complete turn handler:
async function processPlayerTurn(player, spaceName, visitType, gameState) {
  const result = await window.newGameManager.processSpaceTurn(
    player, spaceName, visitType, gameState
  );
  
  switch (result.type) {
    case 'DICE_REQUIRED':
      const diceResult = window.newGameManager.rollDiceAndMove(
        player, spaceName, visitType, gameState
      );
      
      if (diceResult.destination) {
        const newVisitType = window.newGameManager.movePlayer(player, diceResult.destination);
        // Continue with next turn at new location
        return { moved: true, destination: diceResult.destination, visitType: newVisitType };
      }
      break;
      
    case 'AUTOMATIC_MOVE':
      const newVisitType = window.newGameManager.movePlayer(player, result.destination);
      return { moved: true, destination: result.destination, visitType: newVisitType };
      
    case 'PLAYER_CHOICE':
      // Show choice UI to player
      showChoiceModal(result.destinations);
      return { moved: false, requiresChoice: true, destinations: result.destinations };
      
    case 'GAME_END':
      // Handle game completion
      showGameEndScreen();
      return { moved: false, gameEnded: true };
  }
}
```

**✅ Success Criteria:** Game runs entirely on new CSV system with cleaner, more maintainable code.

---

## Phase 7: Optimization & Enhancement (Week 8+)

### Step 7.1: Add Error Handling

```javascript
// Add robust error handling
try {
  const result = await gameManager.processSpaceTurn(player, spaceName, visitType, gameState);
  // Handle result...
} catch (error) {
  console.error('Game turn error:', error);
  // Show user-friendly error message
  showErrorMessage('Game error occurred. Please refresh the page.');
}
```

### Step 7.2: Add Data Caching

```javascript
// Cache frequently accessed data
class CachedGameManager extends GameManager {
  constructor() {
    super();
    this.contentCache = new Map();
    this.movementCache = new Map();
  }
  
  getCachedContent(spaceName, visitType) {
    const key = `${spaceName}_${visitType}`;
    if (!this.contentCache.has(key)) {
      const content = this.contentEngine.getSpaceContent(spaceName, visitType);
      this.contentCache.set(key, content);
    }
    return this.contentCache.get(key);
  }
}
```

### Step 7.3: Add Enhanced Features

Now that you have clean data, you can easily add:

- **Save/Load Game State**: Export player state and reload later
- **Game Statistics**: Track time spent, cards drawn, etc.
- **Difficulty Levels**: Modify effect values based on difficulty
- **New Game Modes**: Use same data with different rules
- **AI Players**: Automated decision making using clean data structure

---

## Rollback Plan

If issues arise during migration:

### Emergency Rollback Steps

1. **Comment out new system initialization:**
   ```javascript
   // const gameManager = new GameManager();
   // await gameManager.initialize();
   ```

2. **Uncomment old CSV loading:**
   ```javascript
   // Restore old parseSpacesCSV(), parseDiceRollCSV() calls
   ```

3. **Switch display functions back:**
   ```javascript
   // Use old displaySpaceContent() function
   ```

4. **Test thoroughly** before re-attempting migration

---

## Success Metrics

### Technical Metrics
- ✅ All game spaces display correctly
- ✅ All movement paths work identically  
- ✅ All effects calculate correctly
- ✅ Dice rolls produce same outcomes
- ✅ No JavaScript errors in console

### Performance Metrics
- ✅ Page load time unchanged or improved
- ✅ Turn processing speed unchanged or improved
- ✅ Memory usage acceptable

### User Experience Metrics
- ✅ Game plays identically to before
- ✅ No new bugs introduced
- ✅ All features work as expected

---

## Post-Migration Benefits

After successful migration, you'll have:

1. **Cleaner Code**: Easier to read, debug, and maintain
2. **Better Architecture**: Separated concerns (movement, effects, content)
3. **Easier Updates**: Modify CSV files instead of complex JavaScript
4. **Better Testing**: Each system can be tested independently
5. **Future-Proof**: Easy to add new spaces, effects, or game mechanics
6. **Less Debugging**: Consistent data structure eliminates parsing errors

---

## Support & Resources

### Documentation
- `INTEGRATION_GUIDE.md` - Technical integration details
- `CODE_EXAMPLES.js` - Working code examples
- `CSV_RESTRUCTURE_PLAN.md` - Original data structure design

### Testing Tools
- `validate_data.py` - Verify data integrity
- Browser console comparison functions
- Step-by-step verification checklist

### Getting Help

If you get stuck:

1. **Check console logs** for specific error messages
2. **Compare old vs new data** using provided comparison functions  
3. **Test one component at a time** (content → movement → effects)
4. **Use the working examples** in `CODE_EXAMPLES.js` as reference

**Remember:** Take it slow, test at each step, and you'll have a much cleaner, more maintainable game system!