### 🔥 **PRIORITY 1: Critical Bug Fixes**
*   [x] **Fix "Get Funding" Button Error**: Refactored `drawAndApplyCard` to bypass cost validation for automatic funding. ✅ **COMPLETED (Sept 9)**
*   [x] **Restore Movement Arrows**: Implemented board-based visual movement indicators. Current player position (📍) and valid destinations (🎯) now display directly on game spaces during PLAY phase. ✅ **COMPLETED (Sept 11)**
*   [ ] **Investigate "Try Again" Snapshot Logic**: Analyze the conditions under which a pre-action snapshot is taken to understand why it's sometimes unavailable.
*   [x] **Fix E2E-05_MultiPlayerEffects.test.ts Multi-Player Effects**: Fixed critical bug where multi-player card effects (L003 "All Players" targeting) only affected the playing player instead of all players. Root cause: PlayerActionService was calling `processEffects()` instead of `processCardEffects()`, preventing access to card targeting data. All 4 tests now pass in 5.8 seconds. ✅ **FIXED (Sept 11)**

### 🎯 **Core Game Mechanics & Systems**
*   [x] **Implement Core Card Effects via Unified Effect Engine**: Successfully integrated card data with the Effect Engine, enabling dynamic card effects. ✅ **COMPLETED (Sept 11)**

### 🎨 **PRIORITY 2: UI/UX Enhancements**
*   [ ] **Display Space Time Cost**: Show the time that will be spent on a space in the Turn Controls UI *before* the action is taken.
*   [ ] **Display Full Card Titles**: Update the Card Portfolio to show the full card name/title instead of IDs like "e1".
*   [ ] **Clarify Space Explorer Close Buttons**: Rework the two "x" buttons so the blue one closes the details panel and the grey one closes the entire modal.
*   [ ] **Expand Location Story Text**: Augment the story display to include `action_description` and `outcome_description` from the CSV files.
*   [ ] **Dynamic Location Title**: Replace the static "Location" title in the story panel with the actual name of the current space.
*   [ ] **Refine Game Log Naming**: Investigate why "SYSTEM" is used in the game log and replace it with the relevant player's name where appropriate.

### 🔧 **PRIORITY 3: Infrastructure & Performance**
*   [ ] **Implement Base Service Class**: Create a `BaseService` to reduce code duplication across services.
*   [ ] **Develop Component Library**: Establish a shared component library for common UI elements.
*   [x] **Game Load Time Performance Investigation**: Completed comprehensive analysis identifying 4 major bottlenecks causing 20-30 second load times. Root causes: Large JavaScript bundle (414KB), multiple CSV network requests (7 requests, 115KB total), CPU-intensive CSV parsing, and complex service initialization. Detailed optimization roadmap provided with potential 75-85% improvement (target: 4-6 seconds). ✅ **COMPLETED (Sept 11)**
*   [ ] **Implement Load Time Optimizations**: Execute the recommended optimizations from the performance investigation - bundle CSV data, enable code splitting, lazy service initialization, and pre-parsed JSON data.
*   [ ] **Reduce Bundle Size**: Implement service decomposition and dynamic imports to reduce initial bundle from 414KB to <200KB.

### 🐞 **NEW: UI/Data Discrepancies (PM-DECISION-CHECK)**
- [ ] **Fix Action Buttons:** The action buttons on the `PM-DECISION-CHECK` space are incorrect.
    - The "Roll for Bonus Cards" button label is too generic. It should clarify the roll is for a *chance* at a Life card (on a roll of 1).
    - The "Pick up 1 TRANSFER card" button is not supported by the CSV data and should be removed.
- [ ] **Implement Path Selection UI:** A mechanism for the player to choose their next path (`LEND-SCOPE-CHECK`, `ARCH-INITIATION`, `CHEAT-BYPASS`) is missing and needs to be implemented, likely as a set of explicit buttons.
- [ ] **Implement End Turn Button:** A general "End Turn" or "Confirm Choices" button is needed. This button should trigger the consequences of the turn (card effects, time/fee costs) and finalize the player's chosen path.

### ❌ **NEW: Test Suite Regressions (P1 Blocker - Investigate Hang First)**
*   [x] **Fix CardService.test.ts: Card Collection Management: should draw cards from stateful decks and update player hand** (Regression) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService.test.ts: endTurn: should advance from first player to second player** (Regression - TypeError: Cannot read properties of undefined (reading 'shouldEnd')) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService.test.ts: endTurn: should advance from second player to third player** (Regression - TypeError: Cannot read properties of undefined (reading 'shouldEnd')) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService.test.ts: endTurn: should wrap around from last player to first player** (Regression - TypeError: Cannot read properties of undefined (reading 'shouldEnd')) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService.test.ts: endTurn: should work with two players** (Regression - TypeError: Cannot read properties of undefined (reading 'shouldEnd')) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService.test.ts: endTurn: should work with single player (wrap to self)** (Regression - TypeError: Cannot read properties of undefined (reading 'shouldEnd')) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService.test.ts: endTurn: should throw error if no players in game** (Regression - TypeError: Cannot read properties of undefined (reading 'shouldEnd')) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService.test.ts: endTurn: should throw error if current player not found in player list** (Regression - TypeError: Cannot read properties of undefined (reading 'shouldEnd')) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService.test.ts: endTurn: should call state service methods in correct order** (Regression - TypeError: Cannot read properties of undefined (reading 'shouldEnd')) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService.test.ts: endTurn: should handle state service errors gracefully** (Regression - TypeError: Cannot read properties of undefined (reading 'shouldEnd')) ✅ **FIXED (Sept 11)**
*   [x] **Fix E066-reroll-integration.test.ts: should include canReRoll in rollDiceWithFeedback result when flag is set** (Regression - TypeError: Cannot read properties of undefined (reading 'players')) ✅ **FIXED (Sept 11)**
*   [x] **Fix E066-reroll-integration.test.ts: should not include canReRoll when flag is not set** (Regression - TypeError: Cannot read properties of undefined (reading 'players')) ✅ **FIXED (Sept 11)**
*   [x] **Fix E066-reroll-integration.test.ts: should reset canReRoll flag at end of turn** (Regression - mock not called) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService-tryAgainOnSpace.test.ts: should revert to snapshot, apply penalty, and advance turn** (Regression - TypeError: gameConfigs.find is not a function) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService-tryAgainOnSpace.test.ts: should fail if no snapshot is available** (Regression - TypeError: gameConfigs.find is not a function) ✅ **FIXED (Sept 11)**
*   [x] **Fix TurnService-tryAgainOnSpace.test.ts: should fail if the space is not negotiable** (Regression - TypeError: gameConfigs.find is not a function) ✅ **FIXED (Sept 11)**