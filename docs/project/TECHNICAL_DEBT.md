# Technical Debt Log

This document tracks identified technical debt in the `code2027` codebase.

## Recently Resolved ✅

### CSV-Based Movement System Data Corruption (November 14, 2025)
- **Status**: ✅ Resolved
- **Issues Fixed**:
  - REG-FDNY-FEE-REVIEW destination corruption (question text → valid space names)
  - Dice movement false positives (41 → 18 spaces, game no longer stuck at start)
  - REG-DOB-TYPE-SELECT path switching (implemented pathChoiceMemory for DOB compliance)
  - Missing validation in data processing pipeline
- **Resolution**:
  - Implemented path-first decision tree in data/process_game_data.py
  - Enhanced is_valid_space_name() with stricter regex validation
  - Added pathChoiceMemory to Player interface for regulatory compliance
  - Created validate_movement_data.py for ongoing data integrity checks
- **Test Coverage**: 21 new/restored tests (7 pathChoiceMemory + 14 regression tests)
- **Impact**: Game progression now works correctly from start, all critical spaces validated

### `usedTryAgain` Flag Refactor (November 2025)
- **Status**: ✅ COMPLETED
- **Description**: The "Try Again" feature was implemented using a persistent `usedTryAgain` boolean flag on the core `Player` state object. This proved to be a brittle, bug-prone pattern, as it required multiple, disparate functions to remember to manually clear the flag.
- **Resolution**: The flag has been completely removed from the Player interface (`src/types/DataTypes.ts:158-201`). The logic was refactored to use ephemeral UI state in the `GameLayout.tsx` component, which passes a `skipAutoMove` parameter to the `endTurnWithMovement` function. This correctly separates UI state from core game state.
- **Evidence**: No `usedTryAgain` field exists in production code (only appears in archived test files)
- **Impact**: Eliminated inconsistent state management and hard-to-trace bugs

### Circular Dependency Pattern - Properly Handled (November 2025)
- **Status**: ✅ NOT TECHNICAL DEBT - Industry-standard implementation
- **Description**: TurnService ↔ EffectEngineService have a circular dependency that is correctly managed using setter injection (standard dependency injection pattern).
- **Implementation**: `src/context/ServiceProvider.tsx:56-67`
  - Creates temporary EffectEngine → NegotiationService → TurnService
  - Creates final EffectEngineService with TurnService reference
  - Uses setters to complete wiring: `turnService.setEffectEngineService(effectEngineService)`
- **Conclusion**: This is a properly implemented dependency injection pattern, NOT a bug or technical debt. This pattern is widely used in enterprise applications.
- **Impact**: No action required - this is correct architecture

---

## High Priority Refactoring Candidates

- **TurnService.ts (2,421 lines)**
  - **Suggestion:** Could be split into smaller, more focused services (e.g., TurnPhaseService, EffectProcessingService, TurnValidationService).
  - **Impact:** High - central service, complex logic.
  - **Risk:** High - touches many systems.

- **EffectEngineService.ts (1,589 lines)**
  - **Suggestion:** Could be split into smaller services based on effect types.
  - **Impact:** High - central service for game logic.
  - **Risk:** Medium - can be refactored incrementally.

---

## In Progress

*(No active refactoring tasks)*
