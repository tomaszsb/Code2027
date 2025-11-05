# Technical Implementation Details - October 24, 2025

This document provides detailed technical information about the changes implemented on October 24, 2025.

## Overview

This session focused on four major areas:
1. **Browser Compatibility** - Fixing Node.js-specific code causing browser crashes
2. **Money Source Tracking** - Ensuring accurate categorization and tracking of funding sources
3. **Fee Calculation & Display** - Fixing fee charging logic and modal feedback
4. **Investment Funding UX** - Unifying the investment funding flow to match bank/owner funding

---

## 1. Browser Compatibility Fix

### Problem
The application was crashing in the browser due to use of `setImmediate`, which is a Node.js-only function and not available in browser environments.

**Location:** `src/services/CardService.ts:180` in the `drawAndApplyCard()` method

**Error:** `setImmediate is not defined`

### Solution
Replaced `setImmediate` with the browser-compatible `setTimeout(resolve, 0)`.

```typescript
// Before
await new Promise(resolve => setImmediate(resolve));

// After
await new Promise(resolve => setTimeout(resolve, 0));
```

**Impact:** Automatic card draw/apply flow (e.g., automatic funding at OWNER-FUND-INITIATION) now works correctly in browsers.

**Tests:** All 30 CardService tests passing.

---

## 2. Bank Loan Tracking

### Problem
When players took out loans via `ResourceService.takeOutLoan()`, the `player.moneySources.bankLoans` field was not being updated. This caused the "Bank Loans" display in the Finance section to show $0 even after taking loans.

### Root Cause
The `takeOutLoan()` function was:
1. Adding loan to `player.loans` array ✅
2. Adding money to `player.money` ✅
3. But NOT updating `player.moneySources.bankLoans` ❌

### Solution
Modified `ResourceService.takeOutLoan()` to update `moneySources` when creating a loan:

```typescript
// Update moneySources to track bank loan
const currentMoneySources = player.moneySources || {
  ownerFunding: 0,
  bankLoans: 0,
  investmentDeals: 0,
  other: 0
};

const updatedMoneySources = {
  ...currentMoneySources,
  bankLoans: currentMoneySources.bankLoans + amount
};

// Update player with new loan and moneySources
this.stateService.updatePlayer({
  id: playerId,
  loans: updatedLoans,
  moneySources: updatedMoneySources
});
```

**Tests:** Updated ResourceService tests to expect `moneySources` in loan creation. All 55 tests passing.

---

## 3. Money Source Categorization

### Problem
Money from OWNER-FUND-INITIATION was being incorrectly categorized as "Investment Deals" instead of "Owner Funding", showing 100% external funding instead of owner funding. This has been corrected to reflect that OWNER-FUND-INITIATION provides an automatic, direct cash deposit (seed money) based on project scope, categorized as "Owner Funding".

**Example:**
- Player at OWNER-FUND-INITIATION with scope > $4M
- System draws and auto-plays I card (correct)
- Money source shows "Investment Deals" instead of "Owner Funding" (incorrect)

### Root Cause
The `categorizeMoneySource()` function checked card type patterns **before** checking space context:

```typescript
// OLD - Wrong order
if (sourceLower.match(/^card:i\d+/)) {
  return 'investmentDeals';  // Matched first!
}

if (currentSpace === 'OWNER-FUND-INITIATION') {
  return 'ownerFunding';  // Never reached
}
```

### Solution
Reordered checks to prioritize **space-based context** over card patterns:

```typescript
// NEW - Correct order
// Check space context FIRST
if (currentSpace === 'OWNER-FUND-INITIATION' || sourceLower.includes('owner')) {
  return 'ownerFunding';  // Checked first!
}

// Then check card patterns
if (sourceLower.match(/^card:i\d+/)) {
  return 'investmentDeals';
}
```

### Comprehensive Testing
Added 8 new tests to prevent regression:

**Owner Funding Tests:**
- ✅ Money from OWNER-FUND-INITIATION categorized as owner funding (even with I card)
- ✅ Money with "owner" in source categorized as owner funding

**Bank Loans Tests:**
- ✅ B card money categorized as bank loans
- ✅ B card money at BANK-FUND-REVIEW categorized as bank loans

**Investment Deals Tests:**
- ✅ I card money categorized as investment deals (when NOT at OWNER-FUND-INITIATION)
- ✅ Money with "investor" in source categorized as investment deals
- ✅ I card money at INVESTOR-FUND-REVIEW categorized as investment deals

**Other Sources Tests:**
- ✅ Unrecognized sources (e.g., W cards) categorized as other

**Test Coverage:** ResourceService tests increased from 47 to 55 tests.

---

## 4. Turn Transition UI Fix

### Problem
After clicking "End Turn", action buttons were still visible for the player whose turn just ended, even though `clearTurnActions()` was being called.

### Root Cause
The sequence in `nextPlayer()` was incorrect:

```typescript
// OLD - Wrong sequence
this.stateService.advanceTurn();
this.stateService.setCurrentPlayer(nextPlayer.id);  // Switch first
this.stateService.clearPlayerHasMoved();
this.stateService.clearPlayerHasRolledDice();
this.stateService.clearTurnActions();  // Clear after switching
```

The UI was updating for the **new player** before the previous player's actions were cleared.

### Solution
Reordered the sequence to clear actions BEFORE switching players:

```typescript
// NEW - Correct sequence
this.stateService.advanceTurn();

// Clear actions while still on previous player
this.stateService.clearPlayerHasMoved();
this.stateService.clearPlayerHasRolledDice();
this.stateService.clearTurnActions();

// Force UI update for previous player
this.stateService.updateActionCounts();

// Send end turn notification
// (notification code)

// NOW switch to next player
this.stateService.setCurrentPlayer(nextPlayer.id);
await this.startTurn(nextPlayer.id);
```

**Impact:** The UI now properly shows no pending actions for the player whose turn just ended before switching to the next player.

**Tests:** Updated test to expect new sequence. All 144 TurnService tests passing.

---

## 5. Unified Investment Funding

### Problem
Investment funding at INVESTOR-FUND-REVIEW required multiple separate actions and didn't match the user experience of bank or owner funding.

**Old Flow:**
1. Roll dice for I cards → Get I card(s)
2. Separately roll dice for time → Get time
3. Fee was supposed to apply but wasn't working

### Solution - CSV Changes

**SPACE_EFFECTS.csv:**
```csv
# Before
INVESTOR-FUND-REVIEW,First,cards,replace_e,1,always,Negotiate Investment Terms,manual

# After
INVESTOR-FUND-REVIEW,First,money,get_investment_funding,1,always,Negotiate Investment Terms,manual
```

**DICE_EFFECTS.csv:**
```csv
# Removed I card dice rolls (redundant)
# INVESTOR-FUND-REVIEW,First,cards,I,Draw 1,Draw 1,Draw 1,Draw 2,Draw 2,Draw 2

# Kept time dice rolls (needed)
INVESTOR-FUND-REVIEW,First,time,days,30,30,30,50,50,70
INVESTOR-FUND-REVIEW,Subsequent,time,days,30,30,50,50,70,70
```

### Solution - Code Implementation

Created `get_investment_funding` handler in `TurnService.applySpaceMoneyEffect()`:

```typescript
else if (action === 'get_investment_funding') {
  // Step 1: Roll dice
  const diceRoll = Math.floor(Math.random() * 6) + 1;

  // Step 2: Apply time based on dice roll
  const diceEffects = this.dataService.getDiceEffects(space, visitType);
  const timeEffect = diceEffects.find(e => e.effect_type === 'time');
  if (timeEffect) {
    const days = getDiceRollEffect(timeEffect, diceRoll);
    this.resourceService.addTime(playerId, days, source, reason);
  }

  // Step 3: Capture investment before
  const investmentBefore = player.moneySources?.investmentDeals || 0;

  // Step 4: Draw and apply I card
  await this.cardService.drawAndApplyCard(playerId, 'I', source, reason);

  // Step 5: Calculate and charge 5% fee on NEW investment only
  const updatedPlayer = this.stateService.getPlayer(playerId);
  const investmentAfter = updatedPlayer.moneySources?.investmentDeals || 0;
  const newInvestment = investmentAfter - investmentBefore;
  const feeAmount = Math.floor((newInvestment * 5) / 100);

  this.resourceService.recordCost(playerId, 'investor', feeAmount, description);

  // Step 6: Mark dice as rolled
  this.stateService.setPlayerHasRolledDice();
}
```

**New Flow:**
Single button click → Automatic dice roll + time calculation + I card draw + 5% fee

**Impact:** Investment funding now matches the one-click simplicity of bank and owner funding.

---

## 6. Investment Fee Calculation Fix

### Problem
The 5% investor fee was being calculated on the **cumulative total** of all investments instead of just the **new investment**.

**Example:**
- Player already has $5 from previous automatic effect
- Draws I card worth $9,025,000
- Fee calculated on $9,025,005 instead of $9,025,000

### Root Cause
The fee calculation used `moneySources.investmentDeals` directly, which is cumulative across all investments.

### Solution
Capture before/after amounts to calculate fee only on new investment:

```typescript
// Before drawing card
const investmentBefore = player.moneySources?.investmentDeals || 0;

// Draw investment card
await this.cardService.drawAndApplyCard(...);

// After drawing card
const investmentAfter = updatedPlayer.moneySources?.investmentDeals || 0;
const newInvestmentAmount = investmentAfter - investmentBefore;

// Fee only on NEW investment
const feeAmount = Math.floor((newInvestmentAmount * 5) / 100);
```

**Tests:** All 144 TurnService tests passing.

---

## 7. Architect/Engineer Fee Charging Fix

### Problem
When clicking "Negotiate Architect Fee", the dice rolled but **no fee was charged**.

**DICE_EFFECTS.csv shows:**
```csv
ARCH-FEE-REVIEW,First,money,fee,8%,8%,10%,10%,12%,12%
```

But no fee appeared in the modal or was deducted from player's money.

### Root Cause
The `applyMoneyEffect()` function was broken for percentage-based fees:

```typescript
// BROKEN CODE
if (effect.includes('%')) {
  const percentage = this.parseNumericValue(effect); // e.g., 10
  moneyChange = Math.floor((player.money * percentage) / 100);  // WRONG BASE!
}

// Then it ADDED money instead of charging!
if (moneyChange > 0) {
  this.resourceService.addMoney(...);  // WRONG DIRECTION!
}
```

**Two bugs:**
1. Calculated percentage of player's **cash** instead of **project scope**
2. **Added money** instead of charging a fee

### Solution
Added special handling after dice roll in `triggerManualEffectWithFeedback()`:

```typescript
if (shouldTriggerDiceRoll && currentPlayer.currentSpace.includes('FEE-REVIEW')) {
  const afterFeePlayer = this.stateService.getPlayer(playerId);

  // Get dice-determined fee percentage from DICE_EFFECTS
  const diceEffects = this.dataService.getDiceEffects(space, visitType);
  const feeEffect = diceEffects.find(e => e.effect_type === 'money');
  const feePercentageStr = this.getDiceRollEffect(feeEffect, diceValue);
  const feePercentage = this.parseNumericValue(feePercentageStr); // 8, 10, or 12

  // Calculate fee base (project scope for First visit)
  const feeBase = afterFeePlayer.visitType === 'First' && projectScope > 0
    ? projectScope
    : afterFeePlayer.money;

  const feeAmount = Math.floor((feeBase * feePercentage) / 100);

  // Charge fee and add to modal
  this.resourceService.recordCost(playerId, category, feeAmount, description);
  diceResult.effects.push({
    type: 'money',
    description: `Architectural fee: ${feePercentage}% ($${feeAmount})`,
    value: -feeAmount
  });
}
```

**Impact:** ARCH-FEE-REVIEW and ENG-FEE-REVIEW now correctly charge fees based on project scope.

**Tests:** All 144 TurnService tests passing.

---

## 8. Modal Feedback Display Improvements

### Problem 1: Investment Funding Modal
The modal after "Negotiate Investment Terms" only showed money gained, not the fee or time:

```
Effects Applied:
💰 +$10.9M
   Money spent: $10,948,750
```

Should show:
```
Effects Applied:
💰 +$10.9M
   Money spent: $10,948,750
💰 -$547K
   Investment fee: 5% ($547,437)
⏱️ +50 days
   Investment review time: 50 days
```

### Solution 1
Added special handling for `get_investment_funding` in `triggerManualEffectWithFeedback()`:

```typescript
else if (action === 'get_investment_funding') {
  const moneyChange = afterPlayer.money - beforePlayer.money;
  const timeChange = afterPlayer.timeSpent - beforePlayer.timeSpent;

  const investmentBefore = beforePlayer.moneySources?.investmentDeals || 0;
  const investmentAfter = afterPlayer.moneySources?.investmentDeals || 0;
  const investmentGained = investmentAfter - investmentBefore;
  const feeCharged = investmentGained - moneyChange;

  // Add investment to effects
  effects.push({
    type: 'money',
    description: `Money spent: $${investmentGained}`,
    value: investmentGained
  });

  // Add fee to effects
  if (feeCharged > 0) {
    effects.push({
      type: 'money',
      description: `Investment fee: 5% ($${feeCharged})`,
      value: -feeCharged
    });
  }

  // Add time to effects
  if (timeChange > 0) {
    effects.push({
      type: 'time',
      description: `Investment review time: ${timeChange} days`,
      value: timeChange
    });
  }
}
```

### Problem 2: Architect Fee Placeholder
The architect fee modal showed a confusing placeholder:

```
Effects Applied:
💰 $0
   Initiating fee negotiation...
💰 -$444K
   Architectural fee: 12% ($444,000)
```

### Solution 2
Removed the placeholder effect from `negotiate_fee` action handler:

```typescript
// Before
if (action === 'negotiate_fee') {
  effects.push({
    type: 'money',
    description: 'Initiating fee negotiation...',
    value: 0
  });
}

// After
if (action === 'negotiate_fee') {
  // No placeholder - fee is added after dice roll
}
```

**Impact:** All funding modals now consistently show complete information.

---

## Summary

### Files Modified
- `src/services/CardService.ts` - Browser compatibility fix
- `src/services/ResourceService.ts` - Bank loan tracking, money categorization
- `src/services/TurnService.ts` - Turn transition, investment funding, fee charging, modal feedback
- `tests/services/ResourceService.test.ts` - Added 8 money categorization tests
- `tests/services/TurnService.test.ts` - Updated turn sequence test
- `public/data/CLEAN_FILES/SPACE_EFFECTS.csv` - Investment funding action change
- `public/data/CLEAN_FILES/DICE_EFFECTS.csv` - Removed redundant I card rolls

### Test Results
- **ResourceService:** 47 → 55 tests (8 new categorization tests)
- **TurnService:** 144 tests passing
- **CardService:** 30 tests passing
- **Total:** All tests passing ✅

### Key Improvements
1. ✅ Browser compatibility restored
2. ✅ Accurate money source tracking across all funding types
3. ✅ Consistent fee calculation and charging
4. ✅ Unified UX for all funding spaces (owner, bank, investor)
5. ✅ Complete modal feedback for all funding operations
6. ✅ Comprehensive test coverage to prevent regression
