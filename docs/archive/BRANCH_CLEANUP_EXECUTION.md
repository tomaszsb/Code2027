# Branch Cleanup Execution Instructions for Claude Code Web

## Context

Based on the branch investigation completed, we have identified:
1. **CRITICAL**: Cache busting commit (9f32919) must be cherry-picked
2. **MEDIUM**: DICE_EFFECTS normalization may need cherry-picking
3. **LOW**: Both remote branches should be deleted after cherry-picking

---

## Task 1: Cherry-Pick Cache Busting (CRITICAL)

### Why This Is Critical
Currently, only `CARDS_EXPANDED.csv` has cache busting in `DataService.ts`. All other CSV files can serve stale cached data in production browsers, causing game data to be out of sync with the server.

### Commit to Cherry-Pick
- **Commit**: `9f32919`
- **Branch**: `origin/claude/fix-owner-scope-w-cards-011CUv1TXM1LvgdySS9mZ8GG`
- **What it does**: Adds `?_=${Date.now()}` cache-busting parameter to ALL CSV file loads in DataService.ts

### Execution Steps

```bash
# 1. Ensure you're on master and up to date
git checkout master
git pull origin master

# 2. Cherry-pick the cache busting commit
git cherry-pick 9f32919

# 3. Verify the changes
git show HEAD --stat

# 4. Check that DataService.ts now has cache busting on all CSV loads
cat src/services/DataService.ts | grep -A 2 "fetch.*\.csv"

# 5. Run tests to ensure nothing broke
npm test tests/services/DataService.test.tsx
npm test tests/integration/

# 6. If all tests pass, commit with descriptive message
# (cherry-pick already creates the commit, but verify the message is good)
git log -1 --pretty=format:"%s"

# 7. Push to master
git push origin master
```

### Expected Changes in DataService.ts

The file should now have cache busting (`?_=${timestamp}`) on these CSV loads:
- ✅ CARDS_EXPANDED.csv (already has it)
- ✅ MOVEMENT.csv (should be added)
- ✅ DICE_EFFECTS.csv (should be added)
- ✅ DICE_ROLL_INFO.csv (should be added)
- ✅ SPACE_ARRIVAL_EFFECTS.csv (should be added)
- ✅ SPACE_CHOICE_LOGIC.csv (should be added)
- ✅ Any other CSV files loaded

### Verification Checklist

- [ ] Cherry-pick completed without conflicts
- [ ] All CSV loads in DataService.ts have cache busting
- [ ] DataService tests pass
- [ ] Integration tests pass
- [ ] Commit pushed to master

---

## Task 2: Test DICE_EFFECTS Normalization (MEDIUM PRIORITY)

### Investigation Required

Before cherry-picking the DICE_EFFECTS normalization commits, we need to verify if the changes are still needed or already incorporated.

### Commits in Question
- **a15f5ac**: "fix: Normalize dice effect types in DICE_EFFECTS.csv generation"
- **2f4a71e**: "chore: Update DICE_EFFECTS.csv with normalized effect types"

### Investigation Steps

```bash
# 1. Check out the branch with the normalization
git fetch --all
git checkout origin/claude/fix-owner-scope-w-cards-011CUv1TXM1LvgdySS9mZ8GG

# 2. Examine the DICE_EFFECTS.csv normalization
git show a15f5ac --stat
git show a15f5ac -- public/data/CLEAN_FILES/DICE_EFFECTS.csv

# 3. Compare with current master
git checkout master
git diff origin/claude/fix-owner-scope-w-cards-011CUv1TXM1LvgdySS9mZ8GG -- public/data/CLEAN_FILES/DICE_EFFECTS.csv

# 4. Check if process_game_data.py already has the normalization logic
cat data/process_game_data.py | grep -A 10 "dice_effects"

# 5. Examine what the normalization actually does
git show a15f5ac -- data/process_game_data.py
```

### Decision Matrix

**If normalization is NOT in master:**
```bash
# Cherry-pick both commits
git cherry-pick a15f5ac
git cherry-pick 2f4a71e

# Run CSV generation to test
cd data
python3 process_game_data.py
cd ..

# Verify DICE_EFFECTS.csv has normalized effect types
cat public/data/CLEAN_FILES/DICE_EFFECTS.csv

# Run tests
npm test tests/services/
npm test tests/integration/

# If all tests pass, push
git push origin master
```

**If normalization is ALREADY in master:**
- Document finding: "DICE_EFFECTS normalization already incorporated in movement refactor"
- Skip cherry-picking these commits
- Proceed to Task 3

### Verification Checklist

- [ ] Investigated whether normalization is needed
- [ ] Decision made: Cherry-pick YES/NO
- [ ] If cherry-picked: Tests pass
- [ ] If cherry-picked: Changes pushed to master
- [ ] If skipped: Documented why

---

## Task 3: Delete Remote Branches (LOW PRIORITY)

### Branches to Delete

After cherry-picking is complete and verified, delete these branches from the remote:

1. `origin/claude/fix-owner-scope-w-cards-011CUv1TXM1LvgdySS9mZ8GG`
2. `origin/claude/game-movement-csv-system-01YVy7nynGXqudrXB1xdmxee`

### Rationale

Both branches contain work that has been superseded by the comprehensive movement refactor merged on Nov 14, 2025. Any valuable commits (cache busting, potential normalization) will have been cherry-picked to master in Tasks 1 and 2.

### Execution Steps

```bash
# 1. Verify you have cherry-picked all needed commits
git log master --oneline | head -5

# 2. Delete the first branch
git push origin --delete claude/fix-owner-scope-w-cards-011CUv1TXM1LvgdySS9mZ8GG

# 3. Delete the second branch
git push origin --delete claude/game-movement-csv-system-01YVy7nynGXqudrXB1xdmxee

# 4. Clean up local tracking branches
git fetch --prune

# 5. Verify branches are gone
git branch -a | grep -E "fix-owner-scope-w-cards|game-movement-csv-system"
# (Should return nothing)
```

### Verification Checklist

- [ ] Cherry-picked commits are safely in master
- [ ] Both remote branches deleted
- [ ] Local tracking branches pruned
- [ ] Verification shows branches no longer exist

---

## Task 4: Update Documentation

### Files to Update

After completing the cherry-picking and branch deletion, document the work:

#### Update `docs/project/TODO.md`

Add after the Movement System CSV Processing Refactor entry:

```markdown
### Branch Cleanup - November 14, 2025
- ✅ Cherry-picked cache busting commit (9f32919) to master
- ✅ Evaluated DICE_EFFECTS normalization (cherry-picked/skipped as needed)
- ✅ Deleted superseded branches: fix-owner-scope-w-cards, game-movement-csv-system
- **Impact**: Production cache busting now active for all CSV files
```

#### Update `.claude/LESSONS_LEARNED.md`

Add a new section:

```markdown
## November 14, 2025 - Cherry-Picking from Superseded Branches

### Issue
Two unmerged branches remained after movement refactor. These branches predated the comprehensive refactor but contained one critical fix (cache busting) not in the refactor.

### Success Pattern
1. ✅ Investigated branches thoroughly using structured prompt
2. ✅ Identified critical commit (9f32919) that was still needed
3. ✅ Cherry-picked specific commit rather than merging entire branch
4. ✅ Deleted superseded branches after extracting value
5. ✅ Documented findings and actions

### Key Lesson
When branches are superseded by major refactors, don't assume ALL commits are obsolete. Systematically review each commit to identify hidden gems (like cache busting) that may have been overlooked in the refactor.

### Pattern to Remember
- Always investigate commit-by-commit
- Cherry-pick valuable commits from old branches
- Delete branches only after extracting all value
- Document what was kept vs. discarded
```

---

## Final Verification

Before considering this task complete, verify:

### Code Quality
- [ ] All tests passing: `npm test tests/services/` and `npm test tests/integration/`
- [ ] No new TypeScript errors: `npm run type-check`
- [ ] No console errors when loading game in browser
- [ ] CSV files load without 304 (Not Modified) responses in browser DevTools Network tab

### Git State
- [ ] Master branch has cherry-picked commits
- [ ] Remote branches deleted
- [ ] Local workspace clean: `git status` shows no uncommitted changes
- [ ] All changes pushed: `git log origin/master..master` shows nothing

### Documentation
- [ ] TODO.md updated with branch cleanup entry
- [ ] LESSONS_LEARNED.md updated with cherry-picking pattern
- [ ] BRANCH_INVESTIGATION_PROMPT.md can be archived (task complete)
- [ ] This file (BRANCH_CLEANUP_EXECUTION.md) can be archived after completion

---

## Timeline

**Estimated Time**: 30-45 minutes

- Task 1 (Cache Busting): 10-15 minutes
- Task 2 (DICE_EFFECTS Investigation): 10-15 minutes
- Task 3 (Branch Deletion): 5 minutes
- Task 4 (Documentation): 10 minutes

---

## Rollback Plan

If cherry-picking causes issues:

```bash
# Find the commit before cherry-pick
git reflog

# Reset to before cherry-pick (replace <commit> with SHA from reflog)
git reset --hard <commit>

# Force push to restore master
git push origin master --force

# Report the issue and investigation findings
```

---

## Success Criteria

This task is complete when:
1. ✅ Cache busting is active for ALL CSV files in production
2. ✅ DICE_EFFECTS normalization has been evaluated and handled appropriately
3. ✅ Both superseded branches are deleted from remote
4. ✅ All tests passing (617 tests, 100% success rate maintained)
5. ✅ Documentation updated with findings and actions
6. ✅ No regressions introduced

**Priority**: Execute Task 1 (Cache Busting) IMMEDIATELY. Tasks 2-4 can follow in sequence.
