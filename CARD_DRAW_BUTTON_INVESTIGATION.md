# Card Draw Button Investigation - Claude Code Web

## Problem Report (November 15, 2025)

During playtesting after the movement system refactor merge and cache busting fixes, automatic card drawing behavior has changed unexpectedly. Cards that should be drawn automatically now show manual buttons.

---

## Issues Identified

### Issue 1: OWNER-FUND-INITIATION - Unexpected Buttons

**Space**: `OWNER-FUND-INITIATION`

**Expected Behavior:**
- Automatic W card draw (no user interaction needed)
- This is owner-issued money based on the amount determined by W cards
- No buttons should appear - the card draw should happen automatically when arriving at the space

**Current Behavior:**
- Manual buttons are now appearing
- User has to click a button to draw cards
- This breaks the intended automatic flow

**Game Design Intent:**
- Owner funding is automatic - player receives money based on W card draws
- No decision point for the player at this space

---

### Issue 2: PM-DECISION-CHECK - Unexpected L Card Button

**Space**: `PM-DECISION-CHECK`

**Expected Behavior:**
- L card should be drawn **automatically** if the dice roll result matches the required number
- No user interaction needed - the system determines if L card is drawn based on dice outcome

**Current Behavior:**
- A button now appears for L card drawing
- User has to manually click to draw the L card
- This breaks the dice-determined automatic flow

**Game Design Intent:**
- Dice roll determines if L card is drawn
- If dice result matches requirement → automatic L card draw
- No manual button needed

---

### Issue 3: Both Buttons Disappear Bug

**Observed Behavior:**
- When there are 2 card draw buttons visible (L and E cards)
- Pressing one button causes BOTH buttons to disappear
- This suggests a UI state management bug

**Expected Behavior:**
- Pressing one button should only affect that specific card draw
- Other buttons should remain until their respective actions are taken

---

## Investigation Tasks

### Task 1: Identify When This Broke

**Timeline Investigation:**
1. **Recent Changes** (Nov 14-15, 2025):
   - Movement system refactor merged
   - Cache busting added
   - DICE_EFFECTS normalization applied

2. **Check Git History:**
   ```bash
   # When did automatic card drawing logic last work correctly?
   git log --all --oneline --since="2025-11-01" -- src/services/CardService.ts
   git log --all --oneline --since="2025-11-01" -- src/services/EffectEngineService.ts
   git log --all --oneline --since="2025-11-01" -- src/components/game/NextStepButton.tsx
   git log --all --oneline --since="2025-11-01" -- src/components/modals/ChoiceModal.tsx
   ```

3. **Questions to Answer:**
   - Did this break in the recent movement refactor?
   - Did this break in the cache busting/DICE_EFFECTS fixes?
   - Or was this a pre-existing bug that's now more visible?

---

### Task 2: Investigate Automatic vs Manual Card Drawing Logic

**Files to Examine:**

#### 1. CardService.ts
```bash
# Check for automatic card drawing logic
grep -n "automatic\|auto" src/services/CardService.ts
grep -n "drawCard" src/services/CardService.ts

# Look for conditions that determine automatic vs manual draws
grep -n "OWNER-FUND-INITIATION\|PM-DECISION-CHECK" src/services/CardService.ts
```

**Questions:**
- Is there a flag or property that determines automatic vs manual card draws?
- How does the system know which cards should be drawn automatically?
- Is this controlled by CSV data or hardcoded logic?

#### 2. EffectEngineService.ts
```bash
# Check space arrival effects
grep -n "OWNER-FUND-INITIATION\|PM-DECISION-CHECK" src/services/EffectEngineService.ts

# Check for automatic effect processing
grep -n "processArrival\|arrivalEffect" src/services/EffectEngineService.ts
```

**Questions:**
- Do these spaces have arrival effects that should trigger automatic card draws?
- Is there effect processing logic that's not firing?

#### 3. CSV Data Files
```bash
# Check SPACE_ARRIVAL_EFFECTS.csv
grep "OWNER-FUND-INITIATION\|PM-DECISION-CHECK" public/data/CLEAN_FILES/SPACE_ARRIVAL_EFFECTS.csv

# Check DICE_EFFECTS.csv (just normalized)
grep "OWNER-FUND-INITIATION\|PM-DECISION-CHECK" public/data/CLEAN_FILES/DICE_EFFECTS.csv

# Check if there's card draw configuration
cat public/data/CLEAN_FILES/SPACE_ARRIVAL_EFFECTS.csv | grep -i "card"
```

**Questions:**
- Is automatic card drawing configured in CSV data?
- Did the DICE_EFFECTS normalization break card draw triggers?
- Are there missing entries for these spaces?

#### 4. NextStepButton.tsx / ChoiceModal.tsx
```bash
# Check button rendering logic
grep -n "card.*button\|draw.*card" src/components/game/NextStepButton.tsx
grep -n "OWNER-FUND\|PM-DECISION" src/components/game/NextStepButton.tsx

# Check choice modal logic
grep -n "cardType\|card_type" src/components/modals/ChoiceModal.tsx
```

**Questions:**
- Why are buttons being shown when they shouldn't be?
- Is there a condition check missing for automatic draws?
- Is the UI incorrectly creating manual choice modals?

---

### Task 3: Compare Current vs Expected Behavior

**Create Test Cases:**

```typescript
// Expected: OWNER-FUND-INITIATION automatic W card draw
describe('OWNER-FUND-INITIATION', () => {
  it('should automatically draw W cards without buttons', () => {
    // Player arrives at OWNER-FUND-INITIATION
    // Expected: W cards automatically drawn based on amount
    // Expected: No buttons shown
    // Expected: Player proceeds to next space after automatic draw
  });
});

// Expected: PM-DECISION-CHECK automatic L card draw (if dice matches)
describe('PM-DECISION-CHECK', () => {
  it('should automatically draw L card if dice roll matches', () => {
    // Player arrives at PM-DECISION-CHECK
    // Dice roll result = required number
    // Expected: L card automatically drawn
    // Expected: No button shown
  });

  it('should not draw L card if dice roll does not match', () => {
    // Player arrives at PM-DECISION-CHECK
    // Dice roll result ≠ required number
    // Expected: No L card drawn
    // Expected: No button shown
    // Expected: Player proceeds to next space
  });
});
```

**Run Existing Tests:**
```bash
# Check if there are existing tests for automatic card draws
npm test -- --testNamePattern="automatic.*card|card.*automatic"
npm test tests/services/CardService.test.tsx
npm test tests/services/EffectEngineService.test.tsx
```

**Questions:**
- Are there existing tests that verify automatic card drawing?
- Are those tests currently passing or failing?
- Do we need to add new tests for this behavior?

---

### Task 4: Root Cause Analysis

**Hypothesis 1: DICE_EFFECTS Normalization Broke Card Triggers**

The recent DICE_EFFECTS.csv normalization changed effect types from unnormalized strings ("W Cards", "Fees Paid") to normalized values (effect_type='cards', card_type='W').

**Check:**
1. Does `EffectFactory.ts` handle the new normalized card effect types correctly?
2. Are automatic card draws triggered by DICE_EFFECTS processing?
3. Did the normalization break the trigger logic?

```bash
# Examine EffectFactory switch statement
cat src/services/EffectFactory.ts | grep -A 20 "switch.*effect"
```

**Hypothesis 2: Movement Refactor Changed Arrival Processing**

The movement system refactor changed how space arrivals are processed.

**Check:**
1. Does `TurnService.startTurn()` still process arrival effects correctly?
2. Are automatic card draws part of arrival effects?
3. Did the refactor skip automatic effect processing?

```bash
# Check TurnService arrival processing
cat src/services/TurnService.ts | grep -A 30 "processArrival"
```

**Hypothesis 3: Button Logic Regression**

The button rendering logic may have regressed to always show manual buttons.

**Check:**
1. Is there a condition that should hide buttons for automatic draws?
2. Was this condition removed or broken?
3. Is there a missing flag like `requiresManualAction` or `isAutomatic`?

```bash
# Check for automatic/manual flags
grep -r "automatic\|manual.*draw\|auto.*card" src/services/
grep -r "automatic\|manual.*draw\|auto.*card" src/components/
```

---

### Task 5: Fix Implementation

Once root cause is identified, implement the fix following these patterns:

#### Pattern 1: If Missing Automatic Flag
```typescript
interface CardDrawEffect {
  cardType: 'W' | 'L' | 'E';
  amount: number;
  isAutomatic: boolean; // <-- Add this flag
}

// In EffectEngineService or CardService
if (effect.isAutomatic) {
  // Draw cards automatically, no button
  this.cardService.drawCards(playerId, effect.cardType, effect.amount);
} else {
  // Show manual button choice
  this.showCardDrawButton(effect);
}
```

#### Pattern 2: If CSV Data Missing
```csv
# SPACE_ARRIVAL_EFFECTS.csv
space_name,effect_type,card_type,amount,is_automatic
OWNER-FUND-INITIATION,cards,W,<amount>,true
PM-DECISION-CHECK,cards,L,1,true
```

#### Pattern 3: If Button Logic Broken
```typescript
// In NextStepButton.tsx or ChoiceModal.tsx
const shouldShowButton = !effect.isAutomatic && requiresUserChoice;

if (shouldShowButton) {
  return <Button>Draw Card</Button>;
}

// Otherwise, trigger automatic draw
triggerAutomaticCardDraw(effect);
```

---

### Task 6: Fix the "Both Buttons Disappear" Bug

**Investigation:**
1. Find where button state is managed (likely in a modal or turn controls component)
2. Check if button removal is scoped to the specific button or all buttons
3. Identify why clicking one button affects other buttons

**Likely Causes:**
- Shared state for multiple buttons (should be individual state)
- Incorrect key props in React list rendering
- Event handler closing entire modal instead of specific button

**Example Fix:**
```typescript
// Before (incorrect):
const [showButtons, setShowButtons] = useState(true);
onClick={() => setShowButtons(false)} // Hides ALL buttons

// After (correct):
const [visibleButtons, setVisibleButtons] = useState(['L', 'E']);
onClick={() => setVisibleButtons(prev => prev.filter(b => b !== 'L'))} // Only hides L button
```

---

## Expected Deliverables

### 1. Investigation Report
Create a file: `CARD_DRAW_BUTTON_INVESTIGATION_REPORT.md`

Include:
- **Root Cause**: What broke and when
- **Affected Spaces**: List all spaces with incorrect button behavior
- **Code Changes**: Specific commits/lines that caused the regression
- **Comparison**: Before vs After behavior

### 2. Fix Implementation
- Code changes to restore automatic card drawing
- Test coverage for automatic vs manual card draws
- Verification that both issues are resolved

### 3. Test Results
```bash
# Run all card-related tests
npm test -- --testNamePattern="card"

# Run affected service tests
npm test tests/services/CardService.test.tsx
npm test tests/services/EffectEngineService.test.tsx

# Run integration tests
npm test tests/integration/
```

Expected: All tests passing, automatic card draws working correctly

### 4. Regression Prevention
- Add tests specifically for automatic card draws at OWNER-FUND-INITIATION and PM-DECISION-CHECK
- Document the automatic vs manual card draw logic
- Add comments in code explaining why certain cards are automatic

---

## Success Criteria

✅ **OWNER-FUND-INITIATION**:
- Player arrives at space
- W cards drawn automatically (no button)
- Player receives money based on W card amounts
- Player proceeds to next space

✅ **PM-DECISION-CHECK**:
- Player arrives at space and rolls dice
- If dice matches requirement: L card drawn automatically (no button)
- If dice doesn't match: No L card, player proceeds
- No manual button shown in either case

✅ **Button Bug Fixed**:
- If multiple card draw buttons exist, clicking one only removes that button
- Other buttons remain functional

✅ **All Tests Passing**:
- 656+ tests passing (or current count)
- New tests for automatic card draws added and passing

---

## Priority

**CRITICAL** - This breaks core game mechanics. Automatic card draws are essential to gameplay flow.

**Estimated Time**: 2-3 hours
- Investigation: 1 hour
- Fix Implementation: 1 hour
- Testing & Verification: 1 hour

---

## Additional Notes

- The movement system refactor (Nov 14) touched arrival processing logic
- The DICE_EFFECTS normalization (Nov 15) changed how card effects are represented
- Either or both could be the cause
- May also be a pre-existing bug that's now more visible with the new cache busting (no stale CSV data)

**Reference Files**:
- Movement refactor docs: `data/MOVEMENT_SYSTEM_REFACTOR_PLAN.md`
- Implementation summary: `data/IMPLEMENTATION_SUMMARY.md`
- Branch cleanup: `data/BRANCH_CLEANUP_SUMMARY.md`
