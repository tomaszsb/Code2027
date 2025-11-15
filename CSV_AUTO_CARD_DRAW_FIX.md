# CSV Auto Card Draw Fix - Claude Code Web

## Problem Summary

Several card draws are marked as `manual` in SPACE_EFFECTS.csv but should be `auto` according to game design:

1. **OWNER-FUND-INITIATION:** B/I cards (seed money from owner) should auto-draw, not require buttons
2. **PM-DECISION-CHECK:** L cards (life surprises) should auto-draw when dice condition met, not require buttons
3. **UI Bug:** When multiple card draw buttons appear, clicking one makes both disappear

---

## Root Cause

**Not a code bug** - code correctly implements what CSV says. **CSV data doesn't match game design.**

Current CSV has these marked as `manual`:
```csv
OWNER-FUND-INITIATION,First,cards,draw_B,...,manual  ← Should be auto
OWNER-FUND-INITIATION,First,cards,draw_I,...,manual  ← Should be auto
PM-DECISION-CHECK,First,cards,draw_L,...,manual      ← Should be auto
```

---

## Task 1: Fix OWNER-FUND-INITIATION (CRITICAL)

### Game Design Intent

**Previous Space (OWNER-SCOPE-INITIATION):**
- Player draws W cards (work types given by owner)
- W cards define project scope

**Current Space (OWNER-FUND-INITIATION):**
- Owner automatically gives seed money based on scope:
  - Scope ≤ $4M → **Automatic** B card (bank-level funding)
  - Scope > $4M → **Automatic** I card (investor-level funding)
- No interest because it's seed money from owner
- **No user interaction needed** - it's automatic funding

### Current CSV (WRONG)
```csv
OWNER-FUND-INITIATION,First,cards,draw_B,Draw 1 if scope ≤ $ 4 M (fees do not matter this turn as it is owner's money),,Draw 1 if scope ≤ $ 4 M (fees do not matter this turn as it is owner's money) B cards,manual
OWNER-FUND-INITIATION,First,cards,draw_I,Draw 1 if scope > $ 4 M (fees do not matter this turn as it is owner's money),,Draw 1 if scope > $ 4 M (fees do not matter this turn as it is owner's money) I cards,manual
```

### Required Fix
Change `manual` → `auto` for both draw_B and draw_I:

```csv
OWNER-FUND-INITIATION,First,cards,draw_B,Draw 1 if scope ≤ $ 4 M (fees do not matter this turn as it is owner's money),,Draw 1 if scope ≤ $ 4 M (fees do not matter this turn as it is owner's money) B cards,auto
OWNER-FUND-INITIATION,First,cards,draw_I,Draw 1 if scope > $ 4 M (fees do not matter this turn as it is owner's money),,Draw 1 if scope > $ 4 M (fees do not matter this turn as it is owner's money) I cards,auto
```

Apply same fix to `Subsequent` visit:
```csv
OWNER-FUND-INITIATION,Subsequent,cards,draw_B,...,auto
OWNER-FUND-INITIATION,Subsequent,cards,draw_I,...,auto
```

### Files to Update

**Option 1: Direct CSV Edit (Fastest)**
```bash
# Edit the generated CSV file
nano public/data/CLEAN_FILES/SPACE_EFFECTS.csv

# Find OWNER-FUND-INITIATION lines
# Change "manual" → "auto" for draw_B and draw_I

# Hard refresh browser to reload CSV
```

**Option 2: Fix Source Data (Proper)**
```bash
# Find the source data file that generates SPACE_EFFECTS.csv
# Likely in data/ folder

# Common locations:
ls data/*.csv | grep -i "space\|effect"
ls data/*.xlsx

# Update source, then regenerate:
cd data
python3 process_game_data.py
# or
python3 process_remaining_files.py
```

---

## Task 2: Fix PM-DECISION-CHECK L Cards

### Game Design Intent

L cards are **life surprises** - unexpected events thrown at the player. When dice condition is met, the L card should automatically appear, not require a button click.

**Current:** "Draw 1 if you roll a 1" but player must click button
**Expected:** L card automatically drawn when dice roll = 1 (no button)

### Current CSV (WRONG)
```csv
PM-DECISION-CHECK,First,cards,draw_L,Draw 1 if you roll a 1,,Draw 1 if you roll a 1 L cards,manual
PM-DECISION-CHECK,Subsequent,cards,draw_L,Draw 1 if you roll a 2,,Draw 1 if you roll a 2 L cards,manual
```

### Required Fix
Change `manual` → `auto`:

```csv
PM-DECISION-CHECK,First,cards,draw_L,Draw 1 if you roll a 1,,Draw 1 if you roll a 1 L cards,auto
PM-DECISION-CHECK,Subsequent,cards,draw_L,Draw 1 if you roll a 2,,Draw 1 if you roll a 2 L cards,auto
```

---

## Task 3: Verify Code Handles Auto vs Manual Correctly

After CSV changes, verify the code correctly processes `auto` vs `manual`:

### Check EffectEngineService.ts
```bash
cat src/services/EffectEngineService.ts | grep -A 20 "processEffect"
```

**Expected behavior:**
- If effect mode = `auto`: Trigger immediately, no button
- If effect mode = `manual`: Show button, wait for user click

### Check TurnService.ts
```bash
cat src/services/TurnService.ts | grep -A 10 "OWNER-FUND-INITIATION"
```

**Code already has special handling:**
```typescript
// Special handling for OWNER-FUND-INITIATION: automatically play drawn funding cards
if (player.currentSpace === 'OWNER-FUND-INITIATION' && drawnCards.length > 0) {
  console.log(`💰 OWNER-FUND-INITIATION: Automatically playing ${drawnCards.length} funding card(s)`);
  // Auto-play logic here
}
```

This suggests code EXPECTS automatic funding at this space.

### Check Space Effects Processing
```bash
grep -r "effect.mode\|effect_mode\|auto\|manual" src/services/EffectEngineService.ts
grep -r "effect.mode\|effect_mode\|auto\|manual" src/services/TurnService.ts
```

Verify:
- [ ] Code reads the `mode` column from CSV
- [ ] Code branches on `auto` vs `manual`
- [ ] Auto effects trigger without user interaction
- [ ] Manual effects show buttons

---

## Task 4: Fix "Both Buttons Disappear" Bug

### Issue
When 2 card draw buttons are visible (e.g., L and E cards at PM-DECISION-CHECK):
- Clicking one button causes BOTH buttons to disappear
- Other button's action is lost

### Investigation

**Likely Locations:**
1. `src/components/game/NextStepButton.tsx`
2. `src/components/modals/ChoiceModal.tsx`
3. `src/components/game/TurnControls.tsx`

**Search for button rendering:**
```bash
grep -n "draw.*card\|card.*button" src/components/game/NextStepButton.tsx
grep -n "draw.*card\|card.*button" src/components/modals/ChoiceModal.tsx
```

### Likely Causes

**Hypothesis 1: Shared state for multiple buttons**
```typescript
// WRONG - one state for all buttons
const [showButtons, setShowButtons] = useState(true);
onClick={() => setShowButtons(false)} // Hides ALL buttons

// CORRECT - individual button tracking
const [completedActions, setCompletedActions] = useState<string[]>([]);
const isButtonVisible = (actionId: string) => !completedActions.includes(actionId);
onClick={() => setCompletedActions(prev => [...prev, actionId])} // Only hides clicked button
```

**Hypothesis 2: Modal closing instead of button removal**
```typescript
// WRONG - closes entire modal
onClick={() => setShowModal(false)}

// CORRECT - marks specific action complete, modal decides if it should close
onClick={() => markActionComplete(actionId)}
```

**Hypothesis 3: React key issues**
```typescript
// WRONG - reusing same key
{buttons.map((btn, index) => <Button key={index} />)} // Index as key causes issues

// CORRECT - unique stable keys
{buttons.map(btn => <Button key={btn.id} />)} // Unique identifier
```

### Fix Implementation

1. **Find where card draw buttons are rendered**
2. **Check how button visibility is managed**
3. **Ensure each button has independent state**
4. **Use unique keys for list rendering**

**Test after fix:**
```typescript
describe('Multiple card draw buttons', () => {
  it('should only remove clicked button, leaving others visible', () => {
    // Setup: Player at PM-DECISION-CHECK with both L and E card options
    // Click L card button
    // Verify: L button disappears, E button still visible
    // Click E card button
    // Verify: E button disappears
  });
});
```

---

## Task 5: Update Tests

After CSV changes, tests will need updating because behavior changes from manual → auto.

### Tests That Will Fail

**E2E-01_HappyPath.test.ts:**
```typescript
// OLD expectation (manual buttons):
expect(finalPlayer.projectScope).toBe(0); // No W cards drawn in this test flow

// NEW expectation (auto B/I cards):
// Will need to expect automatic B or I card draw based on scope
```

**ManualFunding.test.ts:**
- File is named "ManualFunding" but now funding is automatic
- May need to rename to "AutomaticFunding.test.ts"
- Update test expectations for automatic card draws

### New Tests Needed

```typescript
describe('Automatic Card Draws', () => {
  describe('OWNER-FUND-INITIATION', () => {
    it('should automatically draw B card when scope ≤ $4M', () => {
      // Player has W cards totaling ≤ $4M scope
      // Player moves to OWNER-FUND-INITIATION
      // Expected: B card automatically drawn (no button)
      // Expected: B card automatically played (seed money applied)
    });

    it('should automatically draw I card when scope > $4M', () => {
      // Player has W cards totaling > $4M scope
      // Player moves to OWNER-FUND-INITIATION
      // Expected: I card automatically drawn (no button)
      // Expected: I card automatically played (seed money applied)
    });

    it('should not show manual buttons for B/I cards', () => {
      // Player at OWNER-FUND-INITIATION
      // Expected: No buttons shown
      // Expected: Card automatically drawn and applied
    });
  });

  describe('PM-DECISION-CHECK L Cards', () => {
    it('should automatically draw L card when dice roll matches', () => {
      // Player at PM-DECISION-CHECK (First visit)
      // Dice roll result = 1
      // Expected: L card automatically drawn (no button)
    });

    it('should not draw L card when dice roll does not match', () => {
      // Player at PM-DECISION-CHECK (First visit)
      // Dice roll result ≠ 1
      // Expected: No L card drawn
      // Expected: No button shown
    });

    it('should not show manual button for L cards', () => {
      // Even when dice condition met
      // Expected: Automatic draw, no button
    });
  });
});
```

---

## Task 6: Verification Steps

### Step 1: Update CSV
- [ ] OWNER-FUND-INITIATION draw_B: `manual` → `auto` (First and Subsequent)
- [ ] OWNER-FUND-INITIATION draw_I: `manual` → `auto` (First and Subsequent)
- [ ] PM-DECISION-CHECK draw_L: `manual` → `auto` (First and Subsequent)

### Step 2: Verify Code Implementation
- [ ] Code reads `mode` column from CSV
- [ ] Code handles `auto` mode correctly (no buttons)
- [ ] Code handles `manual` mode correctly (shows buttons)
- [ ] EffectEngineService processes auto effects on arrival

### Step 3: Fix UI Bug
- [ ] Both buttons disappear bug fixed
- [ ] Each button has independent state
- [ ] Multiple buttons can coexist without interference

### Step 4: Test in Browser
```bash
npm run dev -- --force
```

**Test Scenario 1: OWNER-FUND-INITIATION**
1. Start game, draw W cards at OWNER-SCOPE-INITIATION
2. Move to OWNER-FUND-INITIATION
3. ✅ Expected: B or I card automatically drawn (no button)
4. ✅ Expected: Card automatically played, money added
5. ❌ Should NOT see: Manual card draw buttons

**Test Scenario 2: PM-DECISION-CHECK**
1. Move to PM-DECISION-CHECK
2. Roll dice
3. ✅ Expected: If dice = 1 (First) or 2 (Subsequent), L card automatically drawn
4. ❌ Should NOT see: Manual L card draw button

**Test Scenario 3: Multiple Buttons (if any remain)**
1. Find a space with multiple manual actions
2. Verify clicking one button doesn't hide others
3. Each button works independently

### Step 5: Run Tests
```bash
# Run affected tests
npm test tests/E2E-01_HappyPath.test.ts
npm test tests/features/ManualFunding.test.ts
npm test tests/services/TurnService.test.ts
npm test tests/services/EffectEngineService.test.ts

# Update tests as needed to expect automatic behavior
```

---

## Success Criteria

✅ **OWNER-FUND-INITIATION:**
- No manual buttons shown
- B card auto-drawn when scope ≤ $4M
- I card auto-drawn when scope > $4M
- Card automatically played (seed money applied)

✅ **PM-DECISION-CHECK:**
- No manual L card button
- L card auto-drawn when dice condition met
- No L card when dice doesn't match

✅ **UI Bug Fixed:**
- Multiple buttons (if any) work independently
- Clicking one button doesn't affect others

✅ **Tests Updated:**
- All tests passing with new automatic behavior
- New tests added for automatic card draws
- Test names reflect automatic vs manual correctly

---

## Files to Modify

**CSV Data:**
- `public/data/CLEAN_FILES/SPACE_EFFECTS.csv` (direct edit)
- OR source files in `data/` folder + regenerate

**Code (verify, may not need changes):**
- `src/services/EffectEngineService.ts` (check auto mode handling)
- `src/services/TurnService.ts` (verify OWNER-FUND-INITIATION logic)

**UI (fix button bug):**
- `src/components/game/NextStepButton.tsx`
- `src/components/modals/ChoiceModal.tsx`
- `src/components/game/TurnControls.tsx`

**Tests (update expectations):**
- `tests/E2E-01_HappyPath.test.ts`
- `tests/features/ManualFunding.test.ts` → rename to AutomaticFunding?
- `tests/services/TurnService.test.ts`
- Add new automatic card draw tests

---

## Estimated Time

- Task 1-2 (CSV updates): 15 minutes
- Task 3 (Code verification): 15 minutes
- Task 4 (UI bug fix): 30-45 minutes
- Task 5 (Test updates): 30 minutes
- Task 6 (Verification): 15 minutes

**Total: 1.5-2 hours**

---

## Priority

**CRITICAL** - This fixes core game mechanics that are currently broken. Automatic card draws are essential to game flow.

Start with Tasks 1-2 (CSV fixes) - these are quick wins that may fix most issues immediately.
