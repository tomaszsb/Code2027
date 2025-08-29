# Expanded Space Mechanics: Implementation Gaps

## Current Status: Rich Space Data vs. Limited Logic

We have successfully imported a new `Spaces.csv` file with numerous new columns that enable complex and dynamic player experiences on the game board. However, the current service logic in `code2027` was built for a much simpler data structure and cannot handle these new mechanics.

This document outlines the critical gaps between the data we have and the logic required to make it functional.

## ✅ What's Currently Implemented

*   **Basic Movement:** The `MovementService` can move players from one space to another in a linear fashion.
*   **Dice Rolls:** The `PlayerActionService` can simulate a dice roll.
*   **State Management:** The `StateService` has a robust concept of game state, including a player's `currentSpace` and `visitType`. It also includes an `awaitingChoice` state, which is a perfect foundation for choice-based movement.
*   **Card Drawing:** The `CardService` has a `drawCards` method that can be used to give cards to a player.

## ❌ Critical Implementation Gaps

The following is a breakdown of the new data columns in `Spaces.csv` and the corresponding logic that is completely missing from the current implementation.

### 1. Choice-Based Movement (`space_1` to `space_5`)

*   **The Gap:** The `MovementService` currently only supports linear movement to a single destination. It does not read the `space_1` through `space_5` columns to identify when a player has multiple movement options.
*   **Required Logic:**
    *   The `DataService` must be updated to expose these columns.
    *   The `MovementService` needs to detect when a space offers a choice.
    *   The `TurnService` must be able to trigger the `awaitingChoice` state in the `StateService`.
    *   The UI needs to be able to present these choices to the player.

### 2. Resource Costs & Gains (`Fee`, `Time`)

*   **The Gap:** The `TurnService` does not read the `Fee` or `Time` columns. There is no logic to modify a player's money or time resources when they land on a space.
*   **Required Logic:**
    *   The `TurnService` must read these columns when processing a player's turn.
    *   Logic must be added to deduct fees from `player.money` and add/subtract time from `player.timeSpent`.

### 3. Space-Triggered Card Draws (`w_card`, `b_card`, `i_card`, `l_card`, `e_card`)

*   **The Gap:** Although the `CardService` can draw cards, nothing calls it when a player lands on a space that should grant a card.
*   **Required Logic:**
    *   The `TurnService` must read these columns.
    *   When a value is present, the `TurnService` must call the `CardService.drawCards()` method with the correct player ID and card type.

### 4. Dynamic Actions (`Action` column)

*   **The Gap:** This is one of the largest missing pieces. The `Action` column contains keywords for dynamic events (e.g., `GOTO_JAIL`, `PAY_TAX`, `AUCTION`), but there is no system to parse or execute these actions.
*   **Required Logic:**
    *   An `ActionService` (or similar) needs to be created.
    *   This service will act as a registry, mapping action strings from the CSV to concrete functions in the codebase.
    *   The `TurnService` will call this `ActionService` when a space has an action defined.

### 5. Conditional Events (`requires_dice_roll`, `Negotiate`)

*   **The Gap:** The game cannot handle spaces that have conditional outcomes.
*   **Required Logic:**
    *   **`requires_dice_roll`**: The `TurnService` needs to check this column. If true, it must trigger a dice roll *after* the player has landed on the space to determine the outcome of the event.
    *   **`Negotiate`**: A negotiation mechanic is completely absent. This will require a new `NegotiationService`, UI components, and logic within the `TurnService` to trigger and resolve negotiations.

### 6. Advanced Movement (`path`, `rolls`)

*   **The Gap:** The current `MovementService` assumes simple, one-space-at-a-time movement.
*   **Required Logic:**
    *   **`path`**: A `PathService` is needed to handle multi-space, predefined movement paths. The `MovementService` would need to be updated to use this service.
    *   **`rolls`**: The logic for handling a variable number of dice rolls is not implemented.

## Conclusion

While the `code2027` refactor has established a solid architectural foundation, it is currently unable to support the rich gameplay defined in the new data files. The next phase of development must focus on closing these gaps by implementing the missing service logic, starting with the most critical features like **Choice-Based Movement** and **Resource Costs**.
