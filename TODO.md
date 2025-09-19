### 🔥 **PRIORITY 1: Critical Bug Fixes**
*   [x] **Fix "Get Funding" Button Error**: Refactored `drawAndApplyCard` to bypass cost validation for automatic funding. ✅ **COMPLETED (Sept 9)**
*   [x] **Restore Movement Arrows**: Implemented board-based visual movement indicators. Current player position (📍) and valid destinations (🎯) now display directly on game spaces during PLAY phase. ✅ **COMPLETED (Sept 11)**
*   [x] **Fix "Try Again" Snapshot Logic**: Refactored snapshot clearing to be tied to explicit player actions ("End Turn", "Try Again"), eliminating the race condition that caused snapshots to disappear. ✅ **COMPLETED (Sept 15)**
*   [x] **Fix E2E-05_MultiPlayerEffects.test.ts Multi-Player Effects**: Fixed critical bug where multi-player card effects (L003 "All Players" targeting) only affected the playing player instead of all players. Root cause: PlayerActionService was calling `processEffects()` instead of `processCardEffects()`, preventing access to card targeting data. All 4 tests now pass in 5.8 seconds. ✅ **FIXED (Sept 11)**

### 🎯 **Core Game Mechanics & Systems**
*   [x] **Implement Core Card Effects via Unified Effect Engine**: Successfully integrated card data with the Effect Engine, enabling dynamic card effects. ✅ **COMPLETED (Sept 11)**

### 🎨 **PRIORITY 2: UI/UX Enhancements**
*   [x] **Enhanced Financial Summary with Card Details**: Removed duplicate Financial Status section and enhanced Financial Summary to show detailed funding information including expandable B/I card sections and one-line funding source display (Bank/Investor/Owner). Fixed automatic funding completion messages to show proper card details using unified notification system. ✅ **COMPLETED (Sept 17)**
*   [x] **Fixed Button Text and Notification Messages**: Corrected card type names in unified notification system (Business → Bank) and added special handling for OWNER-FUND-INITIATION space to show "Owner seed money" instead of card type. Fixed completed actions clearing to occur on End Turn and Try Again button clicks. ✅ **COMPLETED (Sept 17)**
*   [x] **Ledger-Style Financial Layout**: Reorganized Financial Summary into professional ledger layout with hierarchical structure: Sources of Money (expandable), Project Scope (unchanged), Fees & Costs (expandable), and Surplus/Deficit (final calculation). Each section shows totals with detailed breakdowns when expanded. ✅ **COMPLETED (Sept 17)**
*   [x] **Individual Funding Breakdown**: Enhanced Sources of Money expansion to show individual funding transactions (Owner/Bank/Investor) with amounts and descriptions, matching the detail level of Project Scope expansions. Fixed OWNER-FUND-INITIATION space detection for proper "Owner - Seed money" display regardless of underlying card mechanics. ✅ **COMPLETED (Sept 17)**
*   [x] **Unified Notification System Implementation**: Replaced three separate notification systems (button feedback, player notifications, GameLog) with single NotificationService engine generating short/medium/detailed message variants. Integrated across all major UI components including GameLayout, TurnControlsWithActions, and ChoiceModal for consistent user feedback. ✅ **COMPLETED (Sept 19)**
*   [x] **Display Space Time Cost**: Show the time that will be spent on a space in the Turn Controls UI *before* the action is taken.
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
- [x] **Fix Action Buttons & Implement Path Selection:** Corrected the data in `SPACE_EFFECTS.csv` and fixed the underlying `visitType` bug in `MovementService` to properly display all manual actions on the `PM-DECISION-CHECK` space. This includes the corrected "Roll for Bonus" button, path selection buttons, and the "End Turn" button. ✅ **COMPLETED (Sept 16)**

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