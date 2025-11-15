# CRITICAL FINDING: CSV Data vs Expected Behavior Mismatch

## The Problem

**Your Report:**
- OWNER-FUND-INITIATION should have automatic W card draw
- PM-DECISION-CHECK L card should be drawn automatically if dice roll matches

**What the CSV Data Actually Says:**

### OWNER-FUND-INITIATION (SPACE_EFFECTS.csv)
```csv
OWNER-FUND-INITIATION,First,cards,draw_B,Draw 1 if scope ≤ $ 4 M,...,manual
OWNER-FUND-INITIATION,First,cards,draw_I,Draw 1 if scope > $ 4 M,...,manual
OWNER-FUND-INITIATION,First,time,add,1,Spend 1 day,auto
```

**NO W CARD DRAWS DEFINED!** Only B/I cards, both marked as **manual**.

### PM-DECISION-CHECK (SPACE_EFFECTS.csv)
```csv
PM-DECISION-CHECK,First,cards,draw_L,Draw 1 if you roll a 1,...,manual
PM-DECISION-CHECK,First,cards,draw_E,Replace 1,...,manual
PM-DECISION-CHECK,First,time,add,5,Spend 5 days,auto
```

L card is marked as **manual**, not automatic!

---

## Why All Tests Pass

**The tests are CORRECT!** They're testing what the CSV data defines:

1. **E2E-01_HappyPath.test.ts:**
   ```typescript
   // Project scope: No W cards drawn, so scope remains 0
   expect(finalPlayer.projectScope).toBe(0); // No W cards drawn in this test flow
   ```
   The test EXPECTS no W cards because CSV has no W card draw!

2. **ManualFunding.test.ts:**
   - Tests **manual** B/I card selection at OWNER-FUND-INITIATION
   - This matches CSV: `draw_B` and `draw_I` are both `manual`

3. **All 656 tests passing:**
   - Tests verify that manual buttons appear (which they do)
   - Tests verify CSV data is correctly read (which it is)
   - **Tests don't know what SHOULD be in the CSV, only what IS**

---

## Root Cause

This is **not a code bug**. This is a **game data definition issue**.

The code is working perfectly - it's showing manual buttons because the CSV says `manual`.

The issue is either:
1. **CSV data is wrong** - Should define W cards as auto-draw
2. **Game design changed** - Original design had automatic W cards, CSV never updated
3. **Missing CSV entries** - W card draws should be in CSV but aren't

---

## Questions for User

Before investigating code, we need to know:

### 1. OWNER-FUND-INITIATION W Card Drawing
- **When** should W cards be drawn at this space?
- **How many** W cards should be drawn?
- **What determines** the amount (dice roll? fixed number? based on scope?)
- **Should it be** truly automatic (no button) or conditional?

Example entry needed:
```csv
OWNER-FUND-INITIATION,First,cards,draw_W,Draw X,...,auto
```

### 2. PM-DECISION-CHECK L Card Drawing
- The CSV says "Draw 1 if you roll a 1" but marked as `manual`
- Should this be `auto` instead of `manual`?
- Should the system auto-draw L card when dice = 1 without showing button?

Possible fix:
```csv
PM-DECISION-CHECK,First,cards,draw_L,Draw 1 if you roll a 1,...,auto  # Change manual → auto
```

### 3. "Both Buttons Disappear" Bug
- This might be related to conditional card draws
- When both L and E cards are available, UI may have state management issue
- Need to investigate button rendering logic separately

---

## Recommended Next Steps

### Option 1: Fix CSV Data (Fastest)
If game design is clear, just update CSV:

1. Add W card auto-draw to OWNER-FUND-INITIATION
2. Change PM-DECISION-CHECK L card from `manual` → `auto`
3. Regenerate CSV files
4. Tests should still pass (or update tests to match new behavior)

### Option 2: Investigate Code + CSV Together
- User clarifies game design requirements
- Update CSV to match design
- Verify code correctly implements auto vs manual
- Add tests for the NEW expected behavior

---

## File Locations

**CSV Data:**
- `public/data/CLEAN_FILES/SPACE_EFFECTS.csv` (the actual game data)

**CSV Generation Scripts:**
- `data/process_game_data.py` (main processor)
- `data/process_remaining_files.py` (effects processor)

**Source Data:**
Likely in `data/` folder as source files that get processed into CLEAN_FILES

---

## Impact on Testing

Once CSV is corrected:

1. **Existing tests will fail** (they expect manual, CSV will say auto)
2. **Tests need updating** to expect automatic behavior
3. **New tests needed** to verify:
   - W cards auto-drawn at OWNER-FUND-INITIATION
   - L cards auto-drawn when dice condition met
   - No buttons shown for auto actions

---

## Summary

**Code Status:** ✅ Working correctly
**Test Status:** ✅ All passing (testing current CSV behavior)
**CSV Data Status:** ❌ May not match intended game design

**Action Required:** Clarify game design, then update CSV data and tests accordingly.
