# Space Mechanics Implementation Plan

## 🎯 Objective

To implement the missing service logic required to make the new, data-rich spaces in `Spaces.csv` fully functional. This plan will transform the game from a linear board to a dynamic experience with player choices, resource management, and unique events.

## 📊 Current State Analysis

*   **Data:** `Spaces.csv` contains columns for choice-based movement, resource costs, card draws, and dynamic actions.
*   **Logic:** The existing services (`MovementService`, `TurnService`, etc.) only support a simple, linear game flow. They are not aware of the new data columns.
*   **Gaps:** As detailed in `EXPANDED_SPACE_MECHANICS_GAPS.md`, there is a significant disconnect between the available data and the implemented logic.

## 🗺️ 3-Phase Implementation Plan

This plan is designed to be incremental, focusing on the most critical gameplay features first.

### Phase 1: Core Gameplay Loop (Estimated Time: 1-2 weeks)

**Goal:** Implement the fundamental mechanics that players will interact with on every turn.

**1. Choice-Based Movement (`space_1` to `space_5`)**

*   **Priority:** 🔴 CRITICAL
*   **Services to Modify:** `DataService`, `MovementService`, `TurnService`, `StateService`.
*   **Logic to Implement:**
    1.  **`DataService`:** Update the data loading process to parse the `space_1` through `space_5` columns from `Spaces.csv`.
    2.  **`MovementService`:** Modify `getValidMoves()` to return an array of destinations if a space has multiple options.
    3.  **`TurnService`:** When a player lands on a choice space, call `stateService.setAwaitingChoice()` with the available options.
    4.  **UI:** Create a new UI component that subscribes to the `awaitingChoice` state and displays the movement options to the player.
    5.  **`MovementService`:** Enhance `resolveChoice()` to handle the player's selection and update their position.

**2. Resource Costs & Gains (`Fee`, `Time`)**

*   **Priority:** 🟠 HIGH
*   **Services to Modify:** `TurnService`, `StateService`.
*   **Logic to Implement:**
    1.  **`TurnService`:** In `processTurnEffects()`, read the `Fee` and `Time` columns for the player's current space.
    2.  **`StateService`:** Ensure the `Player` state object can properly handle time as a resource that can be gained and lost.
    3.  **`TurnService`:** If a `Fee` exists, deduct the amount from `player.money`. If `Time` exists, add or subtract it from `player.timeSpent`.

**3. Space-Triggered Card Draws (`w_card`, `b_card`, etc.)**

*   **Priority:** 🟠 HIGH
*   **Services to Modify:** `TurnService`, `CardService`.
*   **Logic to Implement:**
    1.  **`TurnService`:** In `processTurnEffects()`, check the `w_card`, `b_card`, etc. columns.
    2.  **`TurnService`:** If a value is present (e.g., `w_card` = 1), call `cardService.drawCards()` with the correct player ID, card type, and count.

### Phase 2: Advanced Interactions (Estimated Time: 1 week)

**Goal:** Bring the spaces to life with unique events and strategic depth.

**1. Dynamic `Action` System**

*   **Priority:** 🟡 MEDIUM
*   **Services to Create/Modify:** `ActionService` (new), `TurnService`.
*   **Logic to Implement:**
    1.  **`ActionService`:** Create a new service that acts as a registry, mapping action strings (e.g., "GOTO_JAIL") to functions.
    2.  **`TurnService`:** In `processTurnEffects()`, read the `Action` column. If an action exists, call the corresponding method in the `ActionService`.

**2. Conditional Events (`requires_dice_roll`, `Negotiate`)**

*   **Priority:** 🟡 MEDIUM
*   **Services to Create/Modify:** `NegotiationService` (new), `TurnService`, `UI`.
*   **Logic to Implement:**
    1.  **`TurnService`:** Add logic to handle `requires_dice_roll` by triggering a post-landing dice roll.
    2.  **`NegotiationService`:** Create a new service to manage the state and logic of a negotiation.
    3.  **`TurnService`:** When a space has a `Negotiate` value, trigger the negotiation process via the `NegotiationService`.
    4.  **UI:** Create components for the negotiation interface.

### Phase 3: Complex Movement (Estimated Time: 1 week)

**Goal:** Implement advanced movement patterns.

**1. Path-Based Movement (`path`, `rolls`)**

*   **Priority:** 🟢 LOW
*   **Services to Create/Modify:** `PathService` (new), `MovementService`.
*   **Logic to Implement:**
    1.  **`PathService`:** Create a service to manage predefined, multi-space movement paths.
    2.  **`MovementService`:** Update to use the `PathService` when a `path` is defined for a space.
    3.  **`TurnService`:** Implement logic to handle a variable number of `rolls`.

## 🎯 Success Metrics

*   **Phase 1:** Players can navigate branching paths, and their resources and cards are correctly updated by the spaces they land on.
*   **Phase 2:** Spaces trigger unique, dynamic events, and players can engage in negotiations.
*   **Phase 3:** The game supports complex, multi-step movement paths.
*   **Architecture:** All new logic is cleanly separated into services, adhering to the project's architectural principles.
