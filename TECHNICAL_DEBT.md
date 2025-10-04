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
