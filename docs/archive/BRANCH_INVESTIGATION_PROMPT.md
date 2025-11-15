# Branch Investigation Task for Claude Code Web

## Context

Two unmerged remote branches remain after cleanup. These appear to be earlier/alternative attempts at fixing movement system issues, but they predate the comprehensive movement refactor that was just merged to master (November 14, 2025).

Your task: Investigate these branches to determine if they should be merged, cherry-picked, or deleted.

---

## Branches to Investigate

### Branch 1: `claude/fix-owner-scope-w-cards-011CUv1TXM1LvgdySS9mZ8GG`

**4 unique commits (not in master):**
```
9f32919 - fix: Add cache busting to all CSV file loads
2f4a71e - chore: Update DICE_EFFECTS.csv with normalized effect types
a15f5ac - fix: Normalize dice effect types in DICE_EFFECTS.csv generation
6edb8bf - fix: Correct OWNER-SCOPE-INITIATION to use dice-based W card drawing
```

**Suspected purpose:** W card drawing fixes and cache busting

### Branch 2: `claude/game-movement-csv-system-01YVy7nynGXqudrXB1xdmxee`

**1 unique commit (not in master):**
```
b93759f - feat: Improve game movement system CSV processing
```

**Suspected purpose:** Alternative movement system improvements

---

## Investigation Steps

### Step 1: Checkout and Examine Each Branch

For each branch:

```bash
# Checkout branch
git checkout <branch-name>

# Check commit details
git log master..<branch-name> --oneline --stat

# Check file changes vs master
git diff master --stat
git diff master --name-only

# Identify key changes
git show <commit-hash> --stat
```

### Step 2: Compare with Recent Movement Refactor

The comprehensive movement refactor was merged on Nov 14, 2025 with these commits:
- `fb6559d` - docs: Add comprehensive implementation summary
- `2c88401` - feat: Add path choice memory for REG-DOB-TYPE-SELECT
- `e64a973` - fix: Correct dice movement detection in processing script
- `806e840` - fix: Implement path-first CSV processing for movement data
- `0830880` - docs: Add comprehensive movement system refactor plan

**Key changes in movement refactor:**
- Fixed OWNER-SCOPE-INITIATION to be 'fixed' movement (not dice)
- Fixed dice detection (41→18 dice spaces)
- Path-first CSV processing in `data/process_game_data.py`
- Movement type corrections in `MOVEMENT.csv`

**Questions to answer:**
1. Do these branches attempt to fix the same issues?
2. Are there any unique fixes not covered by the movement refactor?
3. Do these changes conflict with what's now in master?

### Step 3: Specific Investigation for Each Branch

#### For `fix-owner-scope-w-cards` branch:

1. **Cache Busting (commit 9f32919):**
   - Check: Does master already have cache busting for CSV files?
   - Look in: `src/services/DataService.ts`
   - Search for: timestamp, cache-control, query parameters on CSV loads
   - Question: Is this fix still needed or already implemented?

2. **OWNER-SCOPE-INITIATION (commit 6edb8bf):**
   - Check what this commit does to OWNER-SCOPE-INITIATION
   - Compare with master's current implementation
   - Master has: `OWNER-SCOPE-INITIATION,First,fixed,OWNER-FUND-INITIATION`
   - Question: Does this conflict? Which approach is correct?

3. **DICE_EFFECTS normalization (commits 2f4a71e, a15f5ac):**
   - Check: What normalization was done?
   - Compare with current `DICE_EFFECTS.csv` in master
   - Question: Are these changes already incorporated or still needed?

#### For `game-movement-csv-system` branch:

1. **Single commit analysis (b93759f):**
   - What does this commit change in CSV processing?
   - Compare with `data/process_game_data.py` in master (which was heavily refactored)
   - Question: Is this an earlier version of the movement refactor or something different?

### Step 4: Test Compatibility

If any changes look valuable:

```bash
# Try merging branch to see conflicts
git checkout master
git merge --no-commit --no-ff <branch-name>

# Review conflicts
git diff --cached

# Abort merge
git merge --abort
```

### Step 5: Check Creation Dates

```bash
# When were these branches created?
git log <branch-name> --reverse --oneline | head -1

# Compare with movement refactor timing
git log master --grep="movement" --since="2025-11-01" --oneline
```

---

## Questions to Answer

Please provide a structured report answering:

### For `fix-owner-scope-w-cards` branch:

1. **Cache Busting:**
   - [ ] Is cache busting already implemented in master?
   - [ ] If not, should we cherry-pick commit 9f32919?
   - [ ] Which CSV files would benefit from cache busting?

2. **OWNER-SCOPE-INITIATION:**
   - [ ] What does this branch's version do differently?
   - [ ] Does it conflict with master's 'fixed' movement type?
   - [ ] Which implementation is correct for the game rules?

3. **DICE_EFFECTS normalization:**
   - [ ] What normalization was performed?
   - [ ] Is it already in master or still needed?

4. **Overall recommendation:**
   - [ ] Merge entire branch?
   - [ ] Cherry-pick specific commits? (which ones?)
   - [ ] Delete as superseded?

### For `game-movement-csv-system` branch:

1. **Commit b93759f analysis:**
   - [ ] What does this commit change?
   - [ ] Is it an earlier version of the movement refactor?
   - [ ] Does it have unique value not in master?

2. **Overall recommendation:**
   - [ ] Merge?
   - [ ] Delete as superseded?

### General Questions:

1. **When were these branches created relative to the movement refactor?**
   - Timeline comparison needed

2. **Are there any unique, valuable changes not in master?**
   - List any commits worth preserving

3. **Will merging cause conflicts?**
   - If yes, describe conflicts

4. **Final recommendation for each branch:**
   - Merge / Cherry-pick (which commits) / Delete

---

## Output Format

Please provide your findings in this format:

```markdown
# Branch Investigation Report

## Branch 1: fix-owner-scope-w-cards

### Timeline
- Branch created: [date]
- Movement refactor merged: Nov 14, 2025
- Assessment: [before/after/during movement refactor]

### Commit-by-Commit Analysis

#### 9f32919 - Cache busting
- **What it does:** [description]
- **Master status:** [already has / doesn't have / different approach]
- **Recommendation:** [keep / skip / already covered]

#### 2f4a71e, a15f5ac - DICE_EFFECTS normalization
- **What it does:** [description]
- **Master status:** [already has / doesn't have / different approach]
- **Recommendation:** [keep / skip / already covered]

#### 6edb8bf - OWNER-SCOPE-INITIATION fix
- **What it does:** [description]
- **Conflicts with master:** [yes/no - explain]
- **Correct approach:** [this branch / master / neither]
- **Recommendation:** [keep / skip / conflicts]

### Overall Recommendation
- [ ] Merge entire branch
- [ ] Cherry-pick: [commit list]
- [ ] Delete (superseded by movement refactor)

**Reasoning:** [explanation]

---

## Branch 2: game-movement-csv-system

### Timeline
- Branch created: [date]
- Assessment: [before/after/during movement refactor]

### Commit Analysis

#### b93759f - Movement system improvements
- **What it does:** [description]
- **Overlap with master refactor:** [yes/no - explain]
- **Unique value:** [any unique changes not in master]

### Overall Recommendation
- [ ] Merge
- [ ] Delete (superseded)

**Reasoning:** [explanation]

---

## Summary & Action Plan

### Branches to Merge
[list with reasons]

### Commits to Cherry-Pick
[list with reasons]

### Branches to Delete
[list with reasons]

### Commands to Execute
```bash
# Provide exact git commands for recommended actions
```
```

---

## Additional Notes

- **Movement Refactor Docs:** See `data/MOVEMENT_SYSTEM_REFACTOR_PLAN.md` and `data/IMPLEMENTATION_SUMMARY.md` for details on what was changed
- **Current Test Status:** 656 tests passing (39 in MovementService)
- **Priority:** Understand if cache busting is needed - that could be important even if other changes are superseded
- **Safety:** All proposed merges should be tested with `npm test` before finalizing

---

## Files to Examine

Key files that may have changed:
- `data/process_game_data.py` - CSV processing script
- `public/data/CLEAN_FILES/MOVEMENT.csv` - Movement data
- `public/data/CLEAN_FILES/DICE_EFFECTS.csv` - Dice effects
- `src/services/DataService.ts` - CSV loading (check for cache busting)
- `src/services/MovementService.ts` - Movement logic

---

**Goal:** Determine the fate of these branches with confidence, preserving any valuable work while avoiding conflicts or redundancy.
