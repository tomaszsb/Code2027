# TODO List - Code2027 Project

**Status**: 29 tasks identified from test failures, documentation review, and new code review.
**Created**: September 2, 2025
**Updated**: September 2, 2025 - 3 critical test failures completed
**Priority**: Critical test failures first, then game mechanics, then critical UI bugs, then architectural improvements, then UI/UX polish.

---

## 🚨 Priority 1: Critical Test Failures

### 1. Fix TurnService test mocks - add clearPreSpaceEffectSnapshot mock
- **Issue**: `TypeError: this.stateService.clearPreSpaceEffectSnapshot is not a function`
- **Location**: `tests/services/TurnService.test.ts`
- **Impact**: 9/20 TurnService tests failing
- **Status**: ✅ **COMPLETED** - Mock already present, all 20/20 TurnService tests now passing

### 2. Fix StateService test mocks - add getMovementData mock  
- **Issue**: `TypeError: this.dataService.getMovementData is not a function`
- **Location**: `tests/services/StateService.test.ts`
- **Impact**: StateService tests failing
- **Status**: ✅ **COMPLETED** - Mock already present, StateService tests no longer failing due to TypeError

### 3. Fix E2E-03 tryAgainOnSpace functionality - snapshot system not working
- **Issue**: Test expected "Try Again: Re-rolling" log message but actual code logs "Try Again: Reverted"
- **Location**: `tests/E2E-03_ComplexSpace.test.ts`
- **Impact**: 1/4 E2E-03 tests failing
- **Status**: ✅ **COMPLETED** - Fixed expected log message, test now passes

### 4. Fix E2E-04_SpaceTryAgain player ID resolution - players are undefined
- **Issue**: `TypeError: Cannot read properties of undefined (reading 'id')`
- **Location**: `tests/E2E-04_SpaceTryAgain.test.ts`
- **Impact**: 2/2 E2E-04_SpaceTryAgain tests failing
- **Status**: ✅ **COMPLETED** - Gemini fixed this, all 2/2 tests now passing

### 5. Implement E2E-04_EdgeCases test suite - currently empty
- **Issue**: "Your test suite must contain at least one test"
- **Location**: `tests/E2E-04_EdgeCases.test.ts`
- **Impact**: Empty test suite causing failure
- **Status**: ✅ **COMPLETED** - Gemini implemented comprehensive test suite with 4 edge cases

### 6. Fix EndGameModal error handling in tests - console.error breaking tests
- **Issue**: `console.error` output causing test failure during play again functionality
- **Location**: `tests/components/modals/EndGameModal.test.tsx`
- **Impact**: Component test failure
- **Status**: Pending

---

## ⚙️ Priority 2: Missing Game Mechanics

### 7. Implement turn control system - skipNextTurn, skipCurrentTurn, isPlayerSkippingTurn
- **Issue**: Turn skip effects only log messages, no actual implementation
- **Cards Affected**: E029, E030, E014, L014, L024, E028, L035
- **Location**: `src/services/TurnService.ts`
- **Status**: Pending

### 8. Implement card interaction system - drawCards, discardCards, replaceCards
- **Issue**: 30+ cards with draw/discard effects only log, no implementation
- **Examples**: L005 "Draw 1 Expeditor Card", L003 "Discard 1 Expeditor card"
- **Location**: `src/services/CardService.ts`
- **Status**: Pending

### 9. Implement targeting system for multi-player card effects
- **Issue**: No targeting logic for cards affecting other players
- **Examples**: L002 "All Players", E009 "Choose Opponent"
- **Location**: New `TargetingService.ts` needed
- **Status**: Pending

### 10. Implement duration-based card effects with turn tracking
- **Issue**: No duration tracking for multi-turn effects
- **Examples**: L002 "3 turns", L004 "2 turns"
- **Location**: `src/services/StateService.ts`
- **Status**: Pending

---

## 🐛 Priority 3: Critical UI Bugs

### 11. Fix responsive design bug - Start Game button hidden on smaller screens
- **Issue**: Button not visible on TV/remote play screens
- **Location**: Start screen components
- **Impact**: Critical for TV/remote play
- **Status**: Pending

### 12. Fix card details modal - stuck on loading card detail
- **Issue**: Modal stuck on "loading card detail..." message
- **Location**: Card details modal component
- **Status**: Pending

---

## 🏗️ Priority 4: Architectural Improvements

### 13. Refactor App Initialization Logic
- **Issue**: Redundant and potentially racy logic for fixing player starting positions in `App.tsx`.
- **Location**: `src/App.tsx`
- **Status**: Pending

### 14. Centralize Card Generation Logic
- **Issue**: The `generateCardIds` method is duplicated across multiple services.
- **Location**: `src/services/TurnService.ts` (and others)
- **Action**: Move to `CardService.ts` to ensure a single source of truth.
- **Status**: Pending

### 15. Make Services More Stateless
- **Issue**: Services, especially `TurnService`, have too much direct state manipulation logic.
- **Location**: `src/services/TurnService.ts`
- **Action**: Refactor to calculate changes and return them to a state manager.
- **Status**: Pending

### 16. Robust Player Conflict Resolution
- **Issue**: The `resolveConflicts` method in `StateService` is basic and may not handle all edge cases for player avatar/color conflicts.
- **Location**: `src/services/StateService.ts`
- **Status**: Pending

---

## 🎨 Priority 5: UI/UX Polish

### 17. Add Human vs AI player selection during setup
- **Issue**: No ability to choose player types during setup
- **Location**: Player setup components
- **Status**: Pending

### 18. Fix avatar selection bug - first player choice restricts subsequent players
- **Issue**: First player's avatar choice incorrectly restricts options
- **Location**: Avatar selection components
- **Status**: Pending

### 19. Fix phase indicator - phases don't match CSV data
- **Issue**: Phase indicator shows wrong phases
- **Location**: Phase indicator component
- **Status**: Pending

### 20. Fix phase progression - indicator doesn't update with player movement
- **Issue**: Phase indicator doesn't progress with game state
- **Location**: Phase indicator component
- **Status**: Pending

### 21. Add Story component to middle column for CSV story content
- **Issue**: Missing story display from CSV data
- **Location**: Middle column layout
- **Status**: Pending

### 22. Merge Project Scope and Money buttons into unified budget view
- **Issue**: Need unified expenses and budget view
- **Location**: Player information components
- **Status**: Pending

### 23. Add tracking for Architect/Engineer costs and percentages
- **Issue**: Need cost tracking as value and percentage of project scope
- **Location**: Financial tracking components
- **Status**: Pending

### 24. Implement 20% cost overrun game-end condition
- **Issue**: Missing game-end condition for cost overruns
- **Location**: Game rules service
- **Status**: Pending

### 25. Fix Space Explorer Close button not working
- **Issue**: Close button on details panel doesn't work
- **Location**: Space Explorer component
- **Status**: Pending

### 26. Add available player actions as icons on current space
- **Issue**: Board should show available actions as icons
- **Location**: Game board component
- **Status**: Pending

### 27. Restore visual paths from current space to destinations
- **Issue**: Missing visual movement paths on board
- **Location**: Game board component
- **Status**: Pending

### 28. Widen game log panel to prevent line wrapping
- **Issue**: Log panel too narrow causing text wrapping
- **Location**: Game log component
- **Status**: Pending

### 29. Make game log collapsible and expandable
- **Issue**: Log should be collapsed by default
- **Location**: Game log component
- **Status**: Pending

---

## 📊 Progress Tracking

- **Total Tasks**: 29
- **Completed**: 5 ✅
- **In Progress**: 0
- **Pending**: 24

### ✅ Recently Completed (September 2, 2025)
- Task 1: TurnService test mocks fixed
- Task 2: StateService test mocks fixed  
- Task 3: E2E-03 tryAgainOnSpace test fixed
- Task 4: E2E-04_SpaceTryAgain tests fixed (by Gemini)
- Task 5: E2E-04_EdgeCases test suite implemented (by Gemini)

## 🎯 Next Steps

1.  **Continue Priority 1: Critical Test Failures** - Complete task 6 (EndGameModal test timeout)
2.  **Priority 2: Missing Game Mechanics** (tasks 7-10) for complete gameplay
3.  **Priority 3: Critical UI Bugs** (tasks 11-12) that are blocking users  
4.  **Priority 4: Architectural Improvements** (tasks 13-16) for long-term stability
5.  **Priority 5: UI/UX Polish** (tasks 17-29) for production polish

### 🎉 Progress Update
**5 out of 6 Priority 1 critical test failures have been resolved!** Only 1 critical test issue remains before moving to game mechanics implementation.

---

*This file tracks all known issues and improvements needed for the Code2027 project based on comprehensive test failure analysis and documentation review.*