# Technical Debt Log

This document tracks identified technical debt in the `code2027` codebase.

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

### `usedTryAgain` Flag in Player State
- **Status**: 🟡 In Progress (Refactor underway)
- **Description**: The "Try Again" feature was implemented using a persistent `usedTryAgain` boolean flag on the core `Player` state object. This proved to be a brittle, bug-prone pattern, as it required multiple, disparate functions (`rollDiceWithFeedback`, `handleAutomaticFunding`, etc.) to remember to manually clear the flag.
- **Impact**: This led to inconsistent state management, duplicate code, and hard-to-trace bugs where the flag was not cleared in all code paths (e.g., `triggerManualEffectWithFeedback`).
- **Resolution**: The flag is being removed from the core data model. The logic is being refactored to use a short-lived, ephemeral state variable in the `GameLayout.tsx` UI component, which passes a `skipAutoMove` parameter to the `endTurnWithMovement` function. This correctly separates UI state from core game state.
