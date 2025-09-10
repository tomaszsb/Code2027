## 🐛 **CRITICAL ARCHITECTURE FLAW DISCOVERED - September 7, 2025**

### **🚨 Issue: Card Service allows duplicate cards to be drawn**
**Status**: ✅ **RESOLVED** - Stateful decks have been implemented in `StateService` and are used by `CardService`.

**Problem Description**:
A critical flaw has been identified in the card drawing logic. The current implementation in `CardService.drawCards()` does not use a stateful deck. Instead, it randomly selects from a master list of card templates from the CSV files.

**Impact**:
This allows the same card (e.g., L003) to be in multiple players' hands at the same time, which violates the fundamental rules of most card games and breaks the strategic balance.

### **🔍 Root Cause Analysis**

The `CardService.drawCards` method is stateless. It fetches all possible cards of a given type from `DataService` and picks one at random. It does not track which cards have already been dealt from the "deck".

### **🎯 Resolution Plan**

A significant refactor of the card system is required to introduce stateful decks.

**Proposed Solution:**
1.  **Update Game State**: The `GameState` in `StateService` must be modified to include deck and discard piles for each card type (e.g., `w_deck: string[]`, `w_discard: string[]`).
2.  **Initialize Decks**: At the start of a new game, the `StateService` must populate and shuffle these decks with all unique card IDs from the `DataService`.
3.  **Refactor `CardService.drawCards`**: This method must be changed to:
    a.  Draw one or more cards from the top of the appropriate deck in the `GameState`.
    b.  Remove the drawn cards from that deck.
    c.  Place the drawn cards into the player's hand.
    d.  (Optional but recommended) Implement logic to reshuffle the discard pile into the deck if the deck runs out of cards.

This architectural change is necessary to ensure the integrity and fairness of the game's card mechanics.

---

## 🐛 **CRITICAL BUG DISCOVERED (P2 BLOCKER) - September 7, 2025**

### **🚨 Issue: `Card not found` in Automatic Funding Logic**
**Status**: ✅ **RESOLVED** - The atomic `drawAndApplyCard` method has been implemented in `CardService`, fixing the race condition.

**Problem Description**:
A critical bug was identified in the `handleAutomaticFunding` method within `TurnService.ts`. When a player lands on `OWNER-FUND-INITIATION` and qualifies for funding, the service throws a `Card ... not found` error.

### **🔍 Root Cause Analysis**

The error is caused by a state consistency issue. The `handleAutomaticFunding` method performs two separate actions back-to-back:
1.  `cardService.drawCards()`: This method creates a new card and updates the game state.
2.  `cardService.playCard()`: This method is called immediately after, but it fails because the state update from the `drawCards` call has not been fully propagated or is not available in the current execution context. `playCard` attempts to find the card in the player's hand and fails.

This is a race condition within the service layer logic.

### **🎯 Resolution Plan**

To resolve this, a new, atomic method must be created in `CardService.ts` to ensure the entire transaction is handled in a single, state-safe operation.

**Proposed Solution:**
1.  **Create `drawAndApplyCard()` in `CardService.ts`**: This new public method will encapsulate the entire logic:
    *   Draw a new card.
    *   Apply its effects via `applyCardEffects()`.
    *   Move the card to the appropriate pile (e.g., discarded).
2.  **Refactor `handleAutomaticFunding` in `TurnService.ts`**: This method will be simplified to make a single call to the new `cardService.drawAndApplyCard()` method.

This architectural change will eliminate the race condition and ensure the automatic funding feature is robust and reliable.

---

# Development Status: Code2027 Project

## Current Status: P1 COMPLETE - ALL CRITICAL ISSUES RESOLVED ✅

**Project Status**: Production ready with complete P1 milestone achievement  
**Last Updated**: September 7, 2025  
**Phase**: P1 Complete - Ready for P2 Feature Development  
**Major Achievement**: Complete theme system & OWNER-FUND-INITIATION UX implementation

---

(Rest of the file remains unchanged)
