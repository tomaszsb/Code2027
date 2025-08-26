# Bug Fixes Log

This document tracks all bug fixes implemented in the Code2027 project.

## Card System Bug Fixes (August 24, 2025)

### 1. Runtime Error: "Cannot convert undefined or null to object"

*   **Description:** A critical runtime error occurred when attempting to play a card, manifesting as "Cannot convert undefined or null to object". This was traced to incorrect property access within the `CardService`.
*   **Fix:**
    *   The `playerOwnsCard` method in `src/services/CardService.ts` was updated to correctly check for card ownership across `availableCards`, `activeCards`, and `discardedCards`, resolving the incorrect `player.cards` access.
    *   Duplicate `playCard` method definitions were removed, ensuring a single, consistent implementation.
    *   `moveCardToDiscarded` was updated to use proper immutable array operations, preventing direct state mutations.
*   **Impact:** The core card playing functionality is now fully operational, with correct validation, effect application, and state management.

### 2. Incorrect Card Handling (W-Cards and others)

*   **Description:** Initially, all played cards were moved to `discardedCards`, which was incorrect for cards like "W" (Work) and "L" (Life Events) that should remain "in use" to signify ongoing effects or progress.
*   **Fix:**
    *   The `CardService.ts` was updated to implement a new logic for card state transitions:
        *   **W (Work) and L (Life Events) cards:** Moved from `availableCards` to `activeCards` upon playing.
        *   **B (Bank Loan), E (Expeditor), and I (Investor Loan) cards:** Moved from `availableCards` to `discardedCards` upon playing.
    *   The `Card` interface was extended with `duration` and `phase_restriction` properties.
    *   A new `ActiveCard` interface and `activeCards` collection were introduced in the `Player` state to track cards with ongoing effects and their expiration turns.
    *   A new `endOfTurn` method was added to `CardService.ts` (called by `TurnService`) to automatically process card expirations, moving expired active cards to `discardedCards`.
*   **Impact:** The game now accurately reflects the state of played cards, distinguishing between immediate effects and ongoing, time-bound effects. This significantly enhances game mechanics and strategic depth.

### 3. Missing Card Details View

*   **Description:** Players were unable to view detailed information about cards in their portfolio (available, active, discarded).
*   **Fix:**
    *   A new `CardDetailsModal.tsx` component was created to display comprehensive card information (name, description, effects, cost, duration, phase restrictions).
    *   Click handlers were added to card elements (badges and names) in `CardPortfolioDashboard.tsx` to open the `CardDetailsModal` with the selected card's ID.
    *   State management for the modal was integrated into `GameLayout.tsx`, with prop drilling to `PlayerStatusPanel.tsx` and `PlayerStatusItem.tsx`.
*   **Impact:** Players now have full visibility into card details, enabling more informed strategic decisions. The UI is more intuitive and user-friendly.

### 4. Card Transfer Functionality

*   **Description:** The ability to transfer certain cards between players, a feature present in `code2026`, was missing.
*   **Fix:**
    *   The `CardService.ts` was extended with a `transferCard` method. This method handles validation (player ownership, card transferability, self-transfer prevention) and moves the card from the source player's `availableCards` to the target player's `availableCards`.
    *   Only "E" (Expeditor) and "L" (Life Events) cards were identified as transferable, aligning with game design principles.
    *   The `CardDetailsModal.tsx` was enhanced to include a conditional "Transfer Card" button and a player selection UI (radio buttons) for transferable cards owned by the current player.
*   **Impact:** The game now supports strategic cooperation and resource sharing between players, adding a new layer of dynamic gameplay.
