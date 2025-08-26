# Code2027 Testing & Stabilization Plan

## 1. Objective

The primary objective of this phase is to ensure the `code2027` application is robust, stable, and free of critical bugs. We will systematically test all implemented features to verify they function as expected, both in isolation and as part of the complete gameplay loop. The goal is to move from a "feature-complete" state to a "release-ready" state.

## 2. Scope of Testing

### In Scope:

*   **All Services:** Every service within `/src/services/` will be subject to unit and integration testing.
*   **The Unified Effect Engine:** The core of the application will be rigorously tested to ensure it correctly processes all 8 effect types from all sources (cards, spaces, actions).
*   **All Implemented Game Mechanics:** This includes card playing, space entry effects, dice rolls, choice-based movement, turn control (skipping), duration-based effects, and player targeting.
*   **State Management:** Verification that the `GameState` is consistently and correctly updated after every action.

### Out of Scope:

*   The legacy `code2026` codebase.
*   Advanced performance, load, or stress testing.
*   UI/UX testing beyond ensuring functional correctness (e.g., cosmetic layout issues are low priority unless they impede functionality).
*   The `NegotiationService`, which is currently a scaffold and will be tested after its implementation.

## 3. Testing Strategy

We will employ a multi-layered testing strategy to ensure comprehensive coverage.

### 3.1. Unit & Integration Testing

*   **Objective:** To verify that individual services (`Unit`) and their interactions (`Integration`) function correctly.
*   **Methodology:** We will use the existing Jest testing framework (`jest.config.js`). Test files (`.test.ts` or `.spec.ts`) will be created for each core service.
*   **Priority Targets:**
    1.  `EffectEngineService`: The highest priority. We must test its ability to process every type of effect correctly.
    2.  `TurnService`: Test the turn lifecycle, including `nextPlayer` logic and the handling of turn modifiers.
    3.  `ChoiceService`: Test the creation and promise-based resolution of choices.
    4.  `ResourceService` & `CardService`: Verify the atomicity and correctness of resource and card operations.

### 3.2. End-to-End (E2E) Gameplay Testing

*   **Objective:** To simulate real gameplay scenarios to uncover bugs that only emerge from the complex interaction of all systems over multiple turns.
*   **Methodology:** We will define specific gameplay scenarios and manually (or via a simple script) execute the sequence of actions, verifying the game state at each step.
*   **Test Scenarios:**
    *   **Scenario E2E-01: "Happy Path"**
        *   **Description:** A standard 2-player game for 5 turns. Players draw and play simple cards, move, and incur basic resource changes from spaces.
        *   **Goal:** Verify the fundamental game loop is stable.
    *   **Scenario E2E-02: "Complex Card Play"**
        *   **Description:** A player plays a card that triggers multiple, chained effects, including targeting another player and activating a duration-based effect.
        *   **Goal:** Verify the Effect Engine's ability to handle complex, multi-step events.
    *   **Scenario E2E-03: "Complex Space Entry"**
        *   **Description:** A player lands on a space that requires a choice, has a fee, and grants a card.
        *   **Goal:** Verify space-triggered effects and the choice system work together seamlessly.
    *   **Scenario E2E-04: "Edge Case Gauntlet"**
        *   **Description:** Test various edge cases, such as a player trying to pay a fee with zero money, a card targeting the only other player, and a turn skip card being used on a player who is already set to be skipped.
        *   **Goal:** Ensure the system is resilient and handles edge cases gracefully.

## 4. Bug Tracking

*   **Methodology:** All identified bugs will be logged in `BUG_TRACKER.md`.
*   **Format:** Each bug report will follow a strict format:
    *   **ID:** `BUG-XXX` (e.g., `BUG-001`)
    *   **Title:** A brief, clear summary of the issue.
    *   **Severity:** `Critical` | `High` | `Medium` | `Low`
    *   **Status:** `Open` | `In Progress` | `Resolved`
    *   **Description:** Detailed description of the bug.
    *   **Steps to Reproduce:** A numbered list of the exact steps needed to trigger the bug.
    *   **Expected Result:** What should have happened.
    *   **Actual Result:** What actually happened.

## 5. Process

1.  **Phase 1: Test Execution:** We will begin by executing the E2E scenarios to identify the most critical, user-facing bugs first.
2.  **Phase 2: Bug Fixing:** Address the bugs logged in `BUG_TRACKER.md`, prioritizing by severity.
3.  **Phase 3: Regression Testing:** After a bug is fixed, the original test case and related E2E scenarios will be re-run to ensure the fix works and has not introduced new issues.

This structured approach will ensure we systematically improve the quality and stability of the application.
