# CLAUDE.md - Clean CSV Architecture Project

**Board Game Data Restructure - Zero Data Loss Migration**

## Project Summary
Converting messy, multi-purpose CSV files into clean, single-responsibility data architecture. Eliminates 4 months of debugging issues caused by mixed data types and complex parsing.

## Repository Context
- **Base Project**: https://github.com/tomaszsb/code2026 (working game implementation)
- **This Project**: code2027 - Clean CSV data restructure and integration preparation
- **Owner**: tomaszsb@gmail.com
- **Branch**: main

## Project Boundaries

### ✅ **What This Project Covers**
- **CSV Data Restructuring**: Converting 2 messy CSVs into 6 clean, purpose-built files
- **Data Validation**: Ensuring zero data loss during restructure
- **Integration Planning**: Preparing JavaScript integration examples
- **Documentation**: Creating migration guides and implementation examples

### ✅ **What This Project Now Includes**
- **CSV Data Restructuring**: ✅ COMPLETED - 6 clean CSV files created
- **JavaScript Integration**: ✅ COMPLETED - New engines and database system
- **Data Validation**: ✅ COMPLETED - Comprehensive validation system
- **Test Interface**: ✅ COMPLETED - Working test page with game manager
- **Migration Documentation**: ✅ COMPLETED - Integration guides and examples

## Architecture Status

### ✅ **Clean CSV Files (COMPLETED)**
```
data/CLEAN_FILES/
├── MOVEMENT.csv            # ✅ Space-to-space connections
├── DICE_OUTCOMES.csv       # ✅ Dice roll destinations  
├── SPACE_EFFECTS.csv       # ✅ Card/time/money effects with conditions
├── DICE_EFFECTS.csv        # ✅ Dice-based effects
├── SPACE_CONTENT.csv       # ✅ UI display text and story content
└── GAME_CONFIG.csv         # ✅ Metadata & configuration
```

### ✅ **JavaScript Architecture (COMPLETED)**
```
js/
├── data/
│   ├── CSVDatabase.js      # ✅ Multi-file CSV loader with unified API
│   └── GameStateManager.js # ✅ Event-driven state management
├── utils/
│   ├── MovementEngine.js   # ✅ Clean movement logic for all types
│   ├── EffectsEngine.js    # ✅ Card/time/money effects processor
│   ├── ContentEngine.js    # ✅ UI content and configuration manager
│   └── CardUtils.js        # ✅ Card type utilities
└── components/
    └── GameManager.js      # ✅ Master coordinator for all systems
```

### ✅ **Original Source Files (Reference)**
```
data/SOURCE_FILES/
├── Spaces.csv              # Original 22-column messy file
└── DiceRoll Info.csv       # Original inconsistent dice data
├── SPACE_CONTENT.csv       # UI display text and story content
└── GAME_CONFIG.csv         # Metadata, phases, game configuration
```

**Benefits of Clean Structure**:
- ✅ Single responsibility per file
- ✅ Consistent data types within columns
- ✅ Easy parsing and validation
- ✅ Isolated debugging (movement vs effects vs content)
- ✅ Simple code integration
- ✅ Future-proof extensibility

## Data Integrity Requirements

### Critical Constraints
1. **Zero Data Loss**: Every piece of information from source files must be preserved
2. **Exact Value Preservation**: Space names, visit types, card values must be identical
3. **Logic Preservation**: All game mechanics must work identically after restructure
4. **Validation Required**: Each target file must be validated against source data

### Data Validation Process
```python
# Use provided validation script
python data/VALIDATION/validate_data.py

# Expected output:
# ✅ All movement paths preserved
# ✅ All dice outcomes preserved  
# ✅ All effects preserved
# ✅ All content preserved
# ✅ All config preserved
# ✅ Zero data loss confirmed
```

## File Specifications

### 1. MOVEMENT.csv
**Purpose**: Pure space-to-space connections  
**Columns**: `space_name,visit_type,movement_type,destination_1,destination_2,destination_3,destination_4,destination_5`

**Movement Types**:
- `fixed` - Single predetermined destination
- `choice` - Player chooses from multiple destinations  
- `dice` - Requires dice roll to determine destination
- `logic` - Conditional logic determines destination
- `none` - Terminal space (game end)

### 2. DICE_OUTCOMES.csv
**Purpose**: Maps dice rolls to destinations  
**Columns**: `space_name,visit_type,roll_1,roll_2,roll_3,roll_4,roll_5,roll_6`

### 3. SPACE_EFFECTS.csv
**Purpose**: Card, time, and money effects for spaces  
**Columns**: `space_name,visit_type,effect_type,effect_action,effect_value,condition,description`

**Effect Types**: `time`, `cards`, `money`  
**Conditions**: `always`, `scope_le_4M`, `scope_gt_4M`, `dice_roll_1`, etc.

### 4. DICE_EFFECTS.csv
**Purpose**: Effects that happen based on dice roll results  
**Columns**: `space_name,visit_type,effect_type,card_type,roll_1,roll_2,roll_3,roll_4,roll_5,roll_6`

### 5. SPACE_CONTENT.csv
**Purpose**: All UI display text and story content  
**Columns**: `space_name,visit_type,title,story,action_description,outcome_description,can_negotiate`

### 6. GAME_CONFIG.csv
**Purpose**: Game metadata and configuration  
**Columns**: `space_name,phase,path_type,is_starting_space,is_ending_space,min_players,max_players`

## Using the Clean Architecture

### ✅ **Completed Systems**

**1. Multi-File CSV Database**
```javascript
// Load all clean CSV files
await window.CSVDatabase.loadAll();

// Query movement data
const movement = window.CSVDatabase.movement.find(spaceName, visitType);
const destinations = window.CSVDatabase.movement.getDestinations(spaceName, visitType);

// Query effects data
const spaceEffects = window.CSVDatabase.spaceEffects.find(spaceName, visitType);
const diceEffects = window.CSVDatabase.diceEffects.find(spaceName, visitType);

// Query content data
const content = window.CSVDatabase.spaceContent.find(spaceName, visitType);
const config = window.CSVDatabase.gameConfig.find(spaceName);
```

**2. Clean Movement System**
```javascript
// Initialize movement engine
window.MovementEngine.initialize(window.CSVDatabase);

// Get available movements
const movement = window.MovementEngine.getAvailableMovements(spaceName, visitType);

// Execute different movement types
if (movement.requiresDice) {
    const result = window.MovementEngine.executeDiceMovement(spaceName, visitType, diceRoll);
} else if (movement.requiresChoice) {
    const result = window.MovementEngine.executeChoiceMovement(spaceName, visitType, chosenDest);
} else if (movement.isAutomatic) {
    const result = window.MovementEngine.executeAutomaticMovement(spaceName, visitType);
}
```

**3. Effects Processing System**
```javascript
// Initialize effects engine
window.EffectsEngine.initialize(window.CSVDatabase);

// Apply space effects
const spaceEffects = window.EffectsEngine.applySpaceEffects(
    player, spaceName, visitType, gameState
);

// Apply dice effects
const diceEffects = window.EffectsEngine.applyDiceEffects(
    player, spaceName, visitType, diceRoll, gameState
);
```

**4. Content Management System**
```javascript
// Initialize content engine
window.ContentEngine.initialize(window.CSVDatabase);

// Get space content
const content = window.ContentEngine.getSpaceContent(spaceName, visitType);
const title = window.ContentEngine.getSpaceTitle(spaceName, visitType);
const canNegotiate = window.ContentEngine.canNegotiate(spaceName, visitType);

// Get configuration
const phase = window.ContentEngine.getSpacePhase(spaceName);
const isEndSpace = window.ContentEngine.isEndingSpace(spaceName);
```

**5. Complete Game Manager**
```javascript
// Initialize complete system
const gameManager = window.GameManager;
await gameManager.initialize();

// Process complete turns
const result = await gameManager.processSpaceTurn(player, spaceName, visitType);

// Handle different turn types
if (result.type === 'DICE_REQUIRED') {
    const diceResult = await gameManager.processDiceRoll(player, spaceName, visitType);
} else if (result.type === 'PLAYER_CHOICE') {
    const choiceResult = await gameManager.processChoiceMovement(
        player, spaceName, visitType, chosenDestination
    );
}
```

## Essential Commands

```bash
# Navigation
cd /mnt/d/unravel/current_game/code2027

# Start test server
python -m http.server 8000
# Then visit: http://localhost:8000/

# Data validation
python data/VALIDATION/validate_data.py

# Data inspection
head -5 data/CLEAN_FILES/MOVEMENT.csv
head -5 data/CLEAN_FILES/SPACE_EFFECTS.csv

# File comparison
wc -l data/SOURCE_FILES/*.csv
wc -l data/CLEAN_FILES/*.csv
```

## Key Files to Reference

### Project Documentation
- `CSV_RESTRUCTURE_PLAN.md` - Complete architectural specification
- `INTEGRATION_GUIDE.md` - JavaScript integration examples
- `MIGRATION_PLAN.md` - Step-by-step migration process

### Working Examples
- `CODE_EXAMPLES.js` - Complete JavaScript implementation examples
- `data/VALIDATION/validate_data.py` - Data integrity validation script

### Source Data
- `data/SOURCE_FILES/Spaces.csv` - Original messy space data
- `data/SOURCE_FILES/DiceRoll Info.csv` - Original dice roll data

## Success Criteria

### Technical Requirements
- ✅ All 6 clean CSV files created with proper structure
- ✅ Zero data loss validated by Python script
- ✅ Consistent data types within each column
- ✅ Proper CSV formatting (no parsing errors)

### Architectural Requirements  
- ✅ Single responsibility per CSV file
- ✅ Clear separation of concerns (movement, effects, content, config)
- ✅ Easy integration patterns demonstrated
- ✅ Future extensibility enabled

### Validation Requirements
- ✅ All movement paths preserved exactly
- ✅ All dice outcomes match source data
- ✅ All card/time/money effects preserved
- ✅ All story content and UI text preserved
- ✅ All game configuration preserved

## Testing the System

### **Interactive Test Page**
1. Start local server: `python -m http.server 8000`
2. Open: `http://localhost:8000/index.html`
3. Click "Initialize Game System" to load all CSV files
4. Create test player and explore movement/effects

### **System Validation**
```javascript
// Check system status
const status = gameManager.getStatus();
console.log('System ready:', status);

// Validate data integrity
const validation = gameManager.validateDataIntegrity();
console.log('Data valid:', validation);

// Get statistics
const stats = gameManager.getGameStats();
console.log('Game stats:', stats);
```

### **Debug Mode**
```javascript
// Enable detailed logging
gameManager.enableDebug();

// All engines will now log their operations
// Check browser console for detailed logs
```

## Achieved Benefits

### ✅ **System Integration Completed**
- **Clean Data Architecture**: 6 single-purpose CSV files replace 2 messy files
- **Unified Database API**: Simple, consistent queries across all data types
- **Specialized Engines**: Movement, Effects, and Content engines handle specific concerns
- **Complete Game Manager**: Coordinates all systems with comprehensive turn processing
- **Data Validation**: Built-in integrity checking across all CSV files
- **Interactive Testing**: Working test interface demonstrates all functionality

### ✅ **Developer Experience Improvements**
- **Simple Queries**: `database.movement.find(space, visitType)` vs complex CSV parsing
- **Type Safety**: Consistent data types within each CSV column
- **Easy Debugging**: Issues isolated to specific engines and CSV files
- **Comprehensive Logging**: Debug mode provides detailed operation logs
- **Zero Data Loss**: All original game data preserved in clean structure

### ✅ **Architecture Advantages**
- **Single Responsibility**: Each CSV file has one clear purpose
- **Engine Separation**: Movement, effects, and content processed independently  
- **Event Integration**: Ready for GameStateManager and UI component integration
- **Validation Built-in**: Data integrity checks prevent runtime errors
- **Performance Optimized**: Efficient caching and query patterns

## TypeScript Service Architecture (Phase 1 COMPLETED)

Building on the clean CSV foundation, a comprehensive TypeScript service layer has been implemented following modern architectural patterns. Each service is fully tested with dependency injection and strict typing.

### ✅ **DataService** 
**Status**: COMPLETED with 100% test coverage  
**Purpose**: Centralized data access layer wrapping all CSV operations  
**Key Features**:
- Unified API for querying movement, effects, content, and configuration data
- Comprehensive caching system for performance optimization  
- Type-safe data access with full TypeScript integration
- CSV parsing and validation with error handling
- Support for complex queries across space/visit type combinations
- 200+ test cases covering all data access patterns

### ✅ **StateService**
**Status**: COMPLETED with 94.44% line coverage  
**Purpose**: Immutable game state management with validation  
**Key Features**:
- Immutable state updates preventing accidental mutations
- Player lifecycle management (add, update, remove)
- Game phase transitions (SETUP → PLAY → END)
- Turn management and current player tracking
- Comprehensive validation for all state changes
- Event-driven architecture ready for UI integration
- 50+ test scenarios covering all state transitions

### ✅ **TurnService**
**Status**: COMPLETED with 92.85% line coverage  
**Purpose**: Complete turn orchestration and dice-based effects processing  
**Key Features**:
- Dice rolling with configurable randomization
- Turn effect processing based on space and dice outcomes
- Player turn validation and progression logic
- Integration with DataService for turn-specific rules
- Comprehensive error handling for invalid turns
- 30+ test cases covering all turn scenarios

### ✅ **CardService**  
**Status**: COMPLETED with 95.86% line coverage  
**Purpose**: Complete card ecosystem with complex effect processing  
**Key Features**:
- Card play validation with turn and ownership checks
- Dynamic card drawing with type-specific logic
- Advanced card effects including resource modifications
- Card replacement mechanics for complex interactions
- Support for all 5 card types (W, B, E, L, I) with unique behaviors
- Comprehensive validation ensuring game rule compliance
- 60+ test cases covering all card operations and edge cases

### ✅ **MovementService**
**Status**: COMPLETED with 100% test coverage  
**Purpose**: Stateless movement orchestration across all movement types  
**Key Features**:
- Support for fixed, choice, dice, logic, and none movement types
- Dynamic movement validation based on current player state
- Visit type management (First/Subsequent) with automatic detection
- Integration with dice outcomes for complex movement scenarios
- Comprehensive error handling for invalid moves
- Clean separation between validation and execution logic
- 15+ test scenarios covering all movement patterns

### ✅ **GameRulesService**
**Status**: COMPLETED with 94.39% statement coverage  
**Purpose**: Centralized validation authority for all game rule compliance  
**Key Features**:
- Movement validation using DataService integration
- Card play validation with complex business rule checks
- Resource affordability checks for player actions
- Turn validation ensuring proper game flow
- Game state validation (in-progress, setup, ended)
- Player action authorization with comprehensive checks
- Modular validation system supporting rule extensions
- 38+ test cases covering all validation scenarios

### **Service Architecture Benefits**
- **Dependency Injection**: Clean separation of concerns with testable dependencies
- **Immutable Patterns**: State changes through pure functions preventing bugs
- **Type Safety**: Full TypeScript coverage eliminating runtime type errors
- **Test Coverage**: >90% coverage across all services with comprehensive scenarios
- **Single Responsibility**: Each service has a focused, well-defined role
- **Service Orchestration**: Services collaborate without tight coupling
- **Error Handling**: Consistent error patterns across all service operations

### **Integration Status**
- **ServiceProvider**: Dependency injection container implemented
- **Context Integration**: React context provider for component access
- **Mock Testing**: All services tested in isolation with mocked dependencies
- **Type Contracts**: Comprehensive interfaces defining service boundaries
- **Quality Gates**: All services pass strict TypeScript compilation
- **Performance**: Efficient service instantiation and method execution

---

**✅ COMPLETE: Clean CSV architecture implemented with full JavaScript integration, testing interface, and comprehensive TypeScript service layer.**