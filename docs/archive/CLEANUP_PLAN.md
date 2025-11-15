# Code2027 Cleanup Plan - Post Movement Refactor

**Created:** November 14, 2025
**Executor:** Claude Code web
**Status:** READY FOR EXECUTION

---

## Executive Summary

After the movement system refactor merge, several cleanup tasks are needed:
- Remove 6 merged remote branches
- Reorganize 9 root-level .md files to docs/archive/
- Restore 2 accidentally deleted regression test files
- Update 7 documentation files with movement refactor details
- Add 10-15 new tests for pathChoiceMemory and LOGIC movement features

**Estimated Time:** 2-3 hours
**Risk Level:** LOW (all changes reversible via git)

---

## Phase 1: Git Branch Cleanup (15 min)

### Objective
Remove merged remote branches to keep repository clean.

### Branches to Delete (All merged to master)
```bash
# Delete remote branches (6 total)
git push origin --delete claude/add-regression-tests-011CUuHg3knoab1Vd2Z46jKE
git push origin --delete claude/create-ui-style-guide-011CUqFJ9C7ANBCfLc5RU2di
git push origin --delete claude/csv-based-space-movement-011CUwFMKQdAZGdEnEkpkf6u
git push origin --delete claude/menu-layout-polish-011CUqGwVJV7ALBxAZzJrgiG
git push origin --delete claude/standardize-all-buttons-011CUqH3aTiHikYZwtbnDCUy
git push origin --delete claude/ui-animations-011CUqGxjSpQn8WrqM8dtnFM

# Delete local branch
git branch -d claude/csv-based-space-movement-011CUwFMKQdAZGdEnEkpkf6u
```

### Verification
```bash
git branch -r --merged master | grep claude  # Should show no claude/* branches
```

---

## Phase 2: Critical - Restore Deleted Regression Tests (15 min)

### Objective
Restore regression tests that were accidentally deleted during movement refactor merge.

### Files to Restore
1. `tests/regression/ButtonNesting.regression.test.tsx` (269 lines, 7 tests)
2. `tests/regression/CardCountNaN.regression.test.tsx` (523 lines)

### Why These Are Important
These tests prevent regressions of bugs fixed in commit baa3ddf:
- **ButtonNesting**: Tests that ActionButtons aren't nested inside ExpandableSection header buttons (invalid HTML)
- **CardCountNaN**: Tests that card count displays correctly, not NaN

### Restore Commands
```bash
# Restore from the commit where they were created
git checkout baa3ddf -- tests/regression/ButtonNesting.regression.test.tsx
git checkout baa3ddf -- tests/regression/CardCountNaN.regression.test.tsx

# Verify they work
npm test tests/regression/ButtonNesting.regression.test.tsx
npm test tests/regression/CardCountNaN.regression.test.tsx
```

### Expected Result
- Both test files restored
- All tests should pass (7 tests in ButtonNesting, multiple in CardCountNaN)

---

## Phase 3: Reorganize Root-Level .md Files (20 min)

### Objective
Move temporary analysis/debugging .md files to docs/archive/ to keep root clean.

### Files to Move (9 files)

#### Definite Moves to docs/archive/
```bash
git mv BUTTON_STANDARDIZATION_SUMMARY.md docs/archive/
git mv FIXES_APPLIED_SO_FAR.md docs/archive/
git mv TEST_FAILURE_ANALYSIS.md docs/archive/
git mv TEST_FAILURE_ANALYSIS_CORRECTED.md docs/archive/
git mv TEST_FAILURE_ROOT_CAUSE_ANALYSIS.md docs/archive/
git mv TEST_RESULTS_SEPARATE_RUN.md docs/archive/
```

#### Files to Review First (might be duplicates)
```bash
# Check if these are duplicates before moving:
# 1. POLISH_PLAN.md vs docs/PRE_LAUNCH_POLISH_PLAN.md
diff POLISH_PLAN.md docs/PRE_LAUNCH_POLISH_PLAN.md

# 2. ROADMAP.md vs docs/archive/REFACTORING_ROADMAP.md
diff ROADMAP.md docs/archive/REFACTORING_ROADMAP.md

# 3. TESTING_INSTRUCTIONS.md vs docs/TESTING_REQUIREMENTS.md
diff TESTING_INSTRUCTIONS.md docs/TESTING_REQUIREMENTS.md

# If duplicates, delete the root version. If different, move to docs/archive/
```

### Temporary File Cleanup
```bash
# Remove duplicate file
rm .tmp/UI_REDESIGN_IMPLEMENTATION_PLAN.md

# Remove old IPC message
rm .server/gemini-outbox/20251013-180000-gemini-to-claude.md
```

---

## Phase 4: Add New Tests for Movement Refactor Features (60 min)

### Objective
Add test coverage for new pathChoiceMemory feature and LOGIC movement improvements.

### Test File 1: `tests/services/MovementService.pathChoiceMemory.test.ts`
**Purpose:** Test the new path choice memory feature for REG-DOB-TYPE-SELECT

```typescript
/**
 * Path Choice Memory Tests
 * Tests the pathChoiceMemory feature added in movement system refactor (Nov 2025)
 * REG-DOB-TYPE-SELECT: Once player chooses Plan Exam vs Prof Cert, choice is locked
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MovementService } from '../../src/services/MovementService';
import { Player } from '../../src/types/StateTypes';
import { Movement } from '../../src/types/DataTypes';
import { createMockDataService, createMockStateService, createMockChoiceService,
         createMockLoggingService, createMockGameRulesService } from '../mocks/mockServices';

describe('MovementService - Path Choice Memory', () => {
  let movementService: MovementService;
  let mockPlayer: Player;
  let mockDataService: any;
  let mockStateService: any;

  beforeEach(() => {
    mockDataService = createMockDataService();
    mockStateService = createMockStateService();
    // ... setup other mocks

    movementService = new MovementService(
      mockDataService, mockStateService, createMockChoiceService(),
      createMockLoggingService(), createMockGameRulesService()
    );

    mockPlayer = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'REG-DOB-TYPE-SELECT',
      visitType: 'First',
      // ... other required fields
    };
  });

  describe('REG-DOB-TYPE-SELECT - First Visit', () => {
    it('should return both choice options on First visit', () => {
      const mockMovement: Movement = {
        space_name: 'REG-DOB-TYPE-SELECT',
        visit_type: 'First',
        movement_type: 'choice',
        destination_1: 'REG-DOB-PLAN-EXAM',
        destination_2: 'REG-DOB-PROF-CERT'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = movementService.getValidMoves('player1');

      expect(result).toHaveLength(2);
      expect(result).toContain('REG-DOB-PLAN-EXAM');
      expect(result).toContain('REG-DOB-PROF-CERT');
    });

    it('should NOT filter moves when no pathChoiceMemory exists', () => {
      // Test that First visit doesn't filter even if memory exists for other spaces
      mockPlayer.pathChoiceMemory = { 'OTHER-SPACE': 'SOME-CHOICE' } as any;

      const mockMovement: Movement = {
        space_name: 'REG-DOB-TYPE-SELECT',
        visit_type: 'First',
        movement_type: 'choice',
        destination_1: 'REG-DOB-PLAN-EXAM',
        destination_2: 'REG-DOB-PROF-CERT'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = movementService.getValidMoves('player1');

      expect(result).toHaveLength(2);
    });
  });

  describe('REG-DOB-TYPE-SELECT - Subsequent Visit', () => {
    it('should filter to remembered choice when pathChoiceMemory exists', () => {
      mockPlayer.visitType = 'Subsequent';
      mockPlayer.pathChoiceMemory = {
        'REG-DOB-TYPE-SELECT': 'REG-DOB-PLAN-EXAM'
      };

      const mockMovement: Movement = {
        space_name: 'REG-DOB-TYPE-SELECT',
        visit_type: 'Subsequent',
        movement_type: 'choice',
        destination_1: 'REG-DOB-PLAN-EXAM',
        destination_2: 'REG-DOB-PROF-CERT'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = movementService.getValidMoves('player1');

      expect(result).toHaveLength(1);
      expect(result).toEqual(['REG-DOB-PLAN-EXAM']);
    });

    it('should filter to PROF-CERT when that was the remembered choice', () => {
      mockPlayer.visitType = 'Subsequent';
      mockPlayer.pathChoiceMemory = {
        'REG-DOB-TYPE-SELECT': 'REG-DOB-PROF-CERT'
      };

      const mockMovement: Movement = {
        space_name: 'REG-DOB-TYPE-SELECT',
        visit_type: 'Subsequent',
        movement_type: 'choice',
        destination_1: 'REG-DOB-PLAN-EXAM',
        destination_2: 'REG-DOB-PROF-CERT'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = movementService.getValidMoves('player1');

      expect(result).toHaveLength(1);
      expect(result).toEqual(['REG-DOB-PROF-CERT']);
    });

    it('should return both choices if no memory exists (fallback)', () => {
      mockPlayer.visitType = 'Subsequent';
      mockPlayer.pathChoiceMemory = undefined;

      const mockMovement: Movement = {
        space_name: 'REG-DOB-TYPE-SELECT',
        visit_type: 'Subsequent',
        movement_type: 'choice',
        destination_1: 'REG-DOB-PLAN-EXAM',
        destination_2: 'REG-DOB-PROF-CERT'
      };

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue(mockMovement);

      const result = movementService.getValidMoves('player1');

      // Fallback behavior - if no memory, allow both (shouldn't happen in normal gameplay)
      expect(result).toHaveLength(2);
    });
  });

  describe('Path Choice Storage', () => {
    it('should store path choice when moving from REG-DOB-TYPE-SELECT on First visit', async () => {
      // This tests MovementService.finalizeMove() logic (lines 217-230)
      mockPlayer.visitType = 'First';
      mockPlayer.currentSpace = 'REG-DOB-TYPE-SELECT';

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue({
        space_name: 'REG-DOB-TYPE-SELECT',
        visit_type: 'First',
        movement_type: 'choice',
        destination_1: 'REG-DOB-PLAN-EXAM',
        destination_2: 'REG-DOB-PROF-CERT'
      });

      // Mock the state update to capture what was stored
      let storedMemory: any;
      mockStateService.updatePlayer.mockImplementation((update: any) => {
        storedMemory = update.pathChoiceMemory;
        return { players: [{ ...mockPlayer, ...update }] } as any;
      });

      await movementService.movePlayer('player1', 'REG-DOB-PLAN-EXAM');

      expect(storedMemory).toBeDefined();
      expect(storedMemory['REG-DOB-TYPE-SELECT']).toBe('REG-DOB-PLAN-EXAM');
    });

    it('should NOT store path choice when moving from other spaces', async () => {
      mockPlayer.currentSpace = 'OWNER-SCOPE-INITIATION';

      mockStateService.getPlayer.mockReturnValue(mockPlayer);
      mockDataService.getMovement.mockReturnValue({
        space_name: 'OWNER-SCOPE-INITIATION',
        visit_type: 'First',
        movement_type: 'fixed',
        destination_1: 'OWNER-FUND-INITIATION'
      });

      let storedMemory: any;
      mockStateService.updatePlayer.mockImplementation((update: any) => {
        storedMemory = update.pathChoiceMemory;
        return { players: [{ ...mockPlayer, ...update }] } as any;
      });

      await movementService.movePlayer('player1', 'OWNER-FUND-INITIATION');

      expect(storedMemory).toBeUndefined();
    });
  });
});
```

### Test File 2: `tests/features/REG-FDNY-FEE-REVIEW.test.ts`
**Purpose:** Test that REG-FDNY-FEE-REVIEW LOGIC movement returns valid space names

```typescript
/**
 * REG-FDNY-FEE-REVIEW LOGIC Movement Tests
 * Tests the fix for LOGIC movement corruption (Nov 2025 refactor)
 * Before: Returned question text like "Did the scope change..."
 * After: Returns valid space names: CON-INITIATION, PM-DECISION-CHECK, etc.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MovementService } from '../../src/services/MovementService';
import { createMockDataService, createMockStateService, createMockChoiceService,
         createMockLoggingService, createMockGameRulesService } from '../mocks/mockServices';

describe('REG-FDNY-FEE-REVIEW - LOGIC Movement', () => {
  let movementService: MovementService;
  let mockDataService: any;
  let mockStateService: any;

  beforeEach(() => {
    mockDataService = createMockDataService();
    mockStateService = createMockStateService();

    movementService = new MovementService(
      mockDataService, mockStateService, createMockChoiceService(),
      createMockLoggingService(), createMockGameRulesService()
    );
  });

  it('should return valid space names, not question text (LOGIC movement fix)', () => {
    const mockPlayer = {
      id: 'player1',
      name: 'Test Player',
      currentSpace: 'REG-FDNY-FEE-REVIEW',
      visitType: 'First',
      // ... other required fields
    };

    const mockMovement = {
      space_name: 'REG-FDNY-FEE-REVIEW',
      visit_type: 'First',
      movement_type: 'choice',
      destination_1: 'CON-INITIATION',
      destination_2: 'PM-DECISION-CHECK',
      destination_3: 'REG-DOB-TYPE-SELECT',
      destination_4: 'REG-FDNY-PLAN-EXAM'
    };

    mockStateService.getPlayer.mockReturnValue(mockPlayer);
    mockDataService.getMovement.mockReturnValue(mockMovement);

    const result = movementService.getValidMoves('player1');

    // Should return 4 valid space names
    expect(result).toHaveLength(4);
    expect(result).toContain('CON-INITIATION');
    expect(result).toContain('PM-DECISION-CHECK');
    expect(result).toContain('REG-DOB-TYPE-SELECT');
    expect(result).toContain('REG-FDNY-PLAN-EXAM');

    // Should NOT contain question text
    result.forEach(dest => {
      expect(dest).not.toContain('?');
      expect(dest).not.toContain('Did');
      expect(dest).not.toContain('YES');
      expect(dest).not.toContain('NO');
    });
  });

  it('should handle Subsequent visit with same destinations', () => {
    const mockPlayer = {
      id: 'player1',
      currentSpace: 'REG-FDNY-FEE-REVIEW',
      visitType: 'Subsequent',
      // ... other required fields
    };

    const mockMovement = {
      space_name: 'REG-FDNY-FEE-REVIEW',
      visit_type: 'Subsequent',
      movement_type: 'choice',
      destination_1: 'CON-INITIATION',
      destination_2: 'PM-DECISION-CHECK',
      destination_3: 'REG-DOB-TYPE-SELECT',
      destination_4: 'REG-FDNY-PLAN-EXAM'
    };

    mockStateService.getPlayer.mockReturnValue(mockPlayer);
    mockDataService.getMovement.mockReturnValue(mockMovement);

    const result = movementService.getValidMoves('player1');

    expect(result).toHaveLength(4);
    expect(result).toEqual([
      'CON-INITIATION',
      'PM-DECISION-CHECK',
      'REG-DOB-TYPE-SELECT',
      'REG-FDNY-PLAN-EXAM'
    ]);
  });
});
```

### Test File 3: `tests/regression/MovementTypeRegression.test.ts`
**Purpose:** Prevent regression of dice detection bug (41→18 spaces fix)

```typescript
/**
 * Movement Type Regression Tests
 * Tests the fix for dice movement detection bug (Nov 2025 refactor)
 *
 * Bug: 41 spaces were incorrectly marked as 'dice' because card-drawing dice
 * were confused with movement dice.
 *
 * Fix: Only mark as 'dice' movement when "Next Step" dice data exists.
 * Result: 41→18 dice spaces, 4→20 fixed spaces restored
 */

import { describe, it, expect } from 'vitest';
import { DataService } from '../../src/services/DataService';

describe('Movement Type Regression Tests', () => {
  let dataService: DataService;

  beforeAll(() => {
    dataService = new DataService();
  });

  describe('Fixed Movement Type (should NOT be dice)', () => {
    it('OWNER-SCOPE-INITIATION should be fixed, not dice', () => {
      const movement = dataService.getMovement('OWNER-SCOPE-INITIATION', 'First');

      expect(movement).toBeDefined();
      expect(movement?.movement_type).toBe('fixed');
      expect(movement?.destination_1).toBe('OWNER-FUND-INITIATION');
    });

    it('OWNER-FUND-INITIATION should be fixed, not dice', () => {
      const movement = dataService.getMovement('OWNER-FUND-INITIATION', 'First');

      expect(movement).toBeDefined();
      expect(movement?.movement_type).toBe('fixed');
      expect(movement?.destination_1).toBe('PM-DECISION-CHECK');
    });

    it('ARCH-INITIATION should be fixed, not dice (Subsequent)', () => {
      const movement = dataService.getMovement('ARCH-INITIATION', 'Subsequent');

      expect(movement).toBeDefined();
      expect(movement?.movement_type).toBe('fixed');
      // Card drawing dice exist but movement should be fixed
    });
  });

  describe('Dice Movement Type (should have dice data)', () => {
    it('PM-DECISION-CHECK should be dice with outcomes', () => {
      const movement = dataService.getMovement('PM-DECISION-CHECK', 'First');
      const diceOutcome = dataService.getDiceOutcome('PM-DECISION-CHECK', 'First', 7);

      expect(movement?.movement_type).toBe('dice');
      expect(diceOutcome).toBeDefined();
      expect(diceOutcome).toBeTruthy();
    });

    it('CHEAT-BYPASS should be dice with outcomes', () => {
      const movement = dataService.getMovement('CHEAT-BYPASS', 'First');
      const diceOutcome = dataService.getDiceOutcome('CHEAT-BYPASS', 'First', 7);

      expect(movement?.movement_type).toBe('dice');
      expect(diceOutcome).toBeDefined();
    });
  });

  describe('Movement type distribution', () => {
    it('should have ~18 dice movement spaces (not 41)', () => {
      const allMovements = dataService.getAllMovements();
      const diceMovements = allMovements.filter(m => m.movement_type === 'dice');

      // After fix: ~18 dice spaces (was 41 before fix)
      expect(diceMovements.length).toBeGreaterThanOrEqual(15);
      expect(diceMovements.length).toBeLessThanOrEqual(20);
    });

    it('should have ~20 fixed movement spaces (not 4)', () => {
      const allMovements = dataService.getAllMovements();
      const fixedMovements = allMovements.filter(m => m.movement_type === 'fixed');

      // After fix: ~20 fixed spaces (was only 4 before fix)
      expect(fixedMovements.length).toBeGreaterThanOrEqual(18);
      expect(fixedMovements.length).toBeLessThanOrEqual(25);
    });
  });
});
```

### Verification
```bash
npm test tests/services/MovementService.pathChoiceMemory.test.ts
npm test tests/features/REG-FDNY-FEE-REVIEW.test.ts
npm test tests/regression/MovementTypeRegression.test.ts
```

**Expected:** All new tests should pass

---

## Phase 5: Update Documentation (45 min)

### File 1: `docs/project/TODO.md`
**Location:** After line 16 (after "Player Panel UI Redesign - Phase 1")
**Action:** Add new completed phase section

```markdown
---

## ✅ **PHASE COMPLETION: Movement System CSV Processing Refactor**
*Status: COMPLETED - November 14, 2025*

**Objective**: Fix critical CSV processing bugs causing movement data corruption and implement path choice memory for DOB compliance.

- **✅ REG-FDNY-FEE-REVIEW Corruption Fixed**: LOGIC movement parser now extracts valid space names from condition text instead of corrupted question text
- **✅ Dice Movement Detection Corrected**: Fixed false positives where card-drawing dice rolls were mistaken for movement dice (41→18 dice spaces), restored 20 fixed linear paths
- **✅ Path Choice Memory Implemented**: Added `pathChoiceMemory` to Player state for REG-DOB-TYPE-SELECT - enforces DOB rule that Plan Exam vs Prof Cert choice is locked
- **✅ Enhanced Data Processing**: Implemented path-first decision tree with stricter `is_valid_space_name()` validation
- **✅ Validation Tools Added**: Created `validate_movement_data.py` script for ongoing data integrity checks
- **✅ Comprehensive Documentation**: Added MOVEMENT_SYSTEM_REFACTOR_PLAN.md, IMPLEMENTATION_SUMMARY.md, USER_FIXES_VERIFICATION.md

**Files Changed**: 9 files (+1507/-90 lines)
**Tests**: All E2E tests passing, including previously failing E2E-01_HappyPath and E2E-MultiPathMovement

**Result**: Movement system data processing fixed with comprehensive validation. Path choice memory ensures regulatory compliance for DOB spaces. All movement types correctly classified.

---
```

### File 2: `docs/project/TECHNICAL_DEEP_DIVE.md`
**Location:** After line 80 (in "Game Log & Action Feedback System" section or create new section)
**Action:** Add Player State Extensions documentation

```markdown
---

## 🎮 Player State Extensions

### Path Choice Memory (Added November 2025)

Some game spaces enforce permanent path choices per regulatory requirements (e.g., DOB regulations).

#### Interface Extension
```typescript
interface Player {
  // ... existing fields ...

  /**
   * Stores permanent path choices for spaces that lock decisions.
   * Once a choice is made, subsequent visits filter to the remembered choice.
   */
  pathChoiceMemory?: {
    'REG-DOB-TYPE-SELECT'?: 'REG-DOB-PLAN-EXAM' | 'REG-DOB-PROF-CERT';
    // Extensible for other spaces that require path locking
  };
}
```

#### Implementation Details
- **Location**: `src/services/MovementService.ts:79-89` (filtering logic), `217-230` (storage logic)
- **Usage**:
  - When player moves FROM `REG-DOB-TYPE-SELECT` on First visit → store choice
  - When player arrives AT `REG-DOB-TYPE-SELECT` on Subsequent visit → filter to remembered choice only
- **Rationale**: DOB rules require that once you choose Plan Exam vs Professional Certification path, you're locked in for that application

#### Example Flow
```typescript
// First visit to REG-DOB-TYPE-SELECT
getValidMoves('player1') // Returns: ['REG-DOB-PLAN-EXAM', 'REG-DOB-PROF-CERT']
movePlayer('player1', 'REG-DOB-PLAN-EXAM') // Stores: pathChoiceMemory['REG-DOB-TYPE-SELECT'] = 'REG-DOB-PLAN-EXAM'

// Subsequent visit to REG-DOB-TYPE-SELECT
getValidMoves('player1') // Returns: ['REG-DOB-PLAN-EXAM'] only
```

#### Testing
See `tests/services/MovementService.pathChoiceMemory.test.ts` for comprehensive test coverage.

---
```

### File 3: `docs/project/CLAUDE.md`
**Location:** After "Recent Work Log (October 21, 2025)" section
**Action:** Add new work log entry

```markdown
---

## Recent Work Log (November 14, 2025)

### 1. Movement System CSV Processing Refactor

**Objective**: Fix critical data corruption in movement CSV processing and implement regulatory compliance features.

#### Bugs Fixed:
- **REG-FDNY-FEE-REVIEW Corruption**: LOGIC movement parser was returning question text ("Did the scope change since last visit? YES - ...") as destination space names. Fixed by implementing space name extraction from condition text. Now returns valid space names: `CON-INITIATION`, `PM-DECISION-CHECK`, `REG-DOB-TYPE-SELECT`, `REG-FDNY-PLAN-EXAM`.

- **Dice Detection False Positives**: Processing script incorrectly marked 41 spaces as 'dice' movement when many were actually 'fixed' movement with card-drawing dice (not movement dice). Root cause: Script checked `requires_dice_roll=YES` flag without verifying "Next Step" dice data exists. Fixed by only marking as dice when Next Step outcomes exist. Result: 41→18 dice spaces, 4→20 fixed spaces restored. Critical fix - game was broken with player stuck at start.

#### Features Added:
- **Path Choice Memory**: Implemented `pathChoiceMemory` property in Player state to enforce DOB regulations. When player chooses between Plan Exam vs Professional Certification at `REG-DOB-TYPE-SELECT` space, choice is permanently locked for that application. Subsequent visits filter movement options to remembered choice only.

#### Data Processing Improvements:
- **Path-First Decision Tree**: Refactored `process_game_data.py` to check `path` column FIRST (authoritative source) before inferring from dice indicators
- **Stricter Validation**: Enhanced `is_valid_space_name()` with regex validation, question mark rejection, and minimum length checks
- **LOGIC Movement Parser**: New `extract_destinations_from_logic_conditions()` function extracts valid space names from conditional text
- **Validation Script**: Added `validate_movement_data.py` for ongoing data integrity checks

#### Files Changed:
- **Data Processing**: `data/process_game_data.py` (333 lines refactored)
- **Game Code**: `src/services/MovementService.ts` (+37 lines), `src/types/DataTypes.ts` (+4 lines)
- **Game Data**: `public/data/CLEAN_FILES/MOVEMENT.csv` (10 critical fixes)
- **Documentation**: 3 new comprehensive docs (MOVEMENT_SYSTEM_REFACTOR_PLAN.md, IMPLEMENTATION_SUMMARY.md, USER_FIXES_VERIFICATION.md)

#### Impact:
- **Gameplay**: Game now progresses correctly from start (was broken with players stuck)
- **Data Quality**: All movement destinations are now valid space names (no question text corruption)
- **Compliance**: DOB path choice rules enforced via pathChoiceMemory
- **Tests**: All E2E tests passing including E2E-01_HappyPath and E2E-MultiPathMovement (both were failing before fix)

---
```

### File 4: `docs/CHANGELOG.md`
**Location:** Top of file (most recent entry)
**Action:** Add November 14, 2025 entry

```markdown
# Changelog

## [Unreleased] - 2025-11-14

### Fixed
- **Critical: REG-FDNY-FEE-REVIEW Movement Corruption** - LOGIC movement destinations now return valid space names instead of corrupted question text
- **Critical: Dice Movement Detection Bug** - Fixed false positives causing 41 spaces to be marked as dice when only 18 should be (players were stuck at game start)
- **Movement Type Distribution** - Restored 20 fixed linear movement paths that were incorrectly marked as dice

### Added
- **Path Choice Memory** - Implemented `pathChoiceMemory` in Player state to enforce DOB regulatory compliance for path selection
- **REG-DOB-TYPE-SELECT Locking** - Once player chooses Plan Exam vs Prof Cert, choice is locked for subsequent visits
- **Data Validation Tool** - Added `data/validate_movement_data.py` for ongoing movement data integrity checks
- **Comprehensive Documentation** - Added MOVEMENT_SYSTEM_REFACTOR_PLAN.md, IMPLEMENTATION_SUMMARY.md, USER_FIXES_VERIFICATION.md

### Changed
- **Data Processing** - Refactored `process_game_data.py` with path-first decision tree and stricter validation
- **Movement CSV** - Updated 10 space configurations with corrected movement types and destinations

### Technical Details
- Files changed: 9 files (+1507/-90 lines)
- Tests: Added pathChoiceMemory, LOGIC movement, and movement type regression tests
- Breaking: None (additive changes only)

---
```

### Files 5-7: Quick Updates

#### `docs/project/DEVELOPMENT.md`
**Location:** Find "Recent Development" or "Current Work" section
**Action:** Add brief entry about movement refactor completion

```markdown
### November 14, 2025 - Movement System Refactor
- Fixed critical CSV processing bugs (REG-FDNY-FEE-REVIEW corruption, dice detection)
- Implemented path choice memory for regulatory compliance
- All E2E tests passing after fixes
```

#### `docs/project/PROJECT_STATUS.md`
**Location:** Top of file (current status)
**Action:** Update if it mentions any movement system work as "in progress"

```markdown
**Movement System**: ✅ STABLE - CSV processing refactored, all tests passing (Nov 14, 2025)
```

#### `docs/project/PRODUCT_CHARTER.md`
**Location:** Check "Recent Updates" or "System Status" section
**Action:** Add note about movement system stability if relevant

---

## Phase 6: Commit and Verify (15 min)

### Commit Strategy
Create separate commits for each phase:

```bash
# Commit 1: Restore regression tests
git add tests/regression/ButtonNesting.regression.test.tsx
git add tests/regression/CardCountNaN.regression.test.tsx
git commit -m "test: Restore accidentally deleted regression tests

Regression tests for button nesting and NaN card count were accidentally
deleted during movement refactor merge. Restored from commit baa3ddf.

- ButtonNesting.regression.test.tsx (7 tests)
- CardCountNaN.regression.test.tsx (multiple tests)

Both test files prevent regressions of bugs fixed in Nov 2025."

# Commit 2: Add new movement refactor tests
git add tests/services/MovementService.pathChoiceMemory.test.ts
git add tests/features/REG-FDNY-FEE-REVIEW.test.ts
git add tests/regression/MovementTypeRegression.test.ts
git commit -m "test: Add comprehensive tests for movement system refactor

Added test coverage for pathChoiceMemory feature and movement fixes:
- Path choice memory tests (8 tests)
- REG-FDNY-FEE-REVIEW LOGIC movement tests (2 tests)
- Movement type regression tests (6 tests)

Total: 16 new tests for Nov 2025 movement refactor features."

# Commit 3: Reorganize documentation
git add docs/archive/*.md
git add .tmp/ .server/
git commit -m "docs: Reorganize and clean up temporary documentation files

Moved temporary analysis/debugging files to docs/archive/:
- BUTTON_STANDARDIZATION_SUMMARY.md
- FIXES_APPLIED_SO_FAR.md
- TEST_FAILURE_ANALYSIS*.md (3 files)
- TEST_RESULTS_SEPARATE_RUN.md

Removed duplicate/temporary files:
- .tmp/UI_REDESIGN_IMPLEMENTATION_PLAN.md (duplicate)
- .server/gemini-outbox/old message (outdated)"

# Commit 4: Update documentation for movement refactor
git add docs/project/TODO.md
git add docs/project/TECHNICAL_DEEP_DIVE.md
git add docs/project/CLAUDE.md
git add docs/CHANGELOG.md
git add docs/project/DEVELOPMENT.md
git add docs/project/PROJECT_STATUS.md
git commit -m "docs: Document movement system refactor completion

Updated documentation with movement refactor details:
- TODO.md: Added completed phase entry
- TECHNICAL_DEEP_DIVE.md: Documented pathChoiceMemory feature
- CLAUDE.md: Added detailed work log entry
- CHANGELOG.md: Listed all fixes and additions
- PROJECT_STATUS.md, DEVELOPMENT.md: Updated status

Movement refactor completed Nov 14, 2025."

# Commit 5: Delete merged branches (no local commit needed, just push)
# See Phase 1 commands

# Push all commits
git push origin master
```

### Final Verification
```bash
# Verify all tests pass
npm test tests/regression/
npm test tests/services/MovementService.pathChoiceMemory.test.ts
npm test tests/features/REG-FDNY-FEE-REVIEW.test.ts

# Verify documentation is up to date
cat docs/project/TODO.md | grep "Movement System"
cat docs/CHANGELOG.md | head -20

# Verify branches are cleaned
git branch -r | grep claude
```

---

## Success Criteria

### All Green ✅
- [ ] 2 regression test files restored and passing
- [ ] 16 new tests added and passing
- [ ] 9 root-level .md files moved to docs/archive/
- [ ] 7 documentation files updated
- [ ] 6 merged branches deleted from remote
- [ ] 5 commits created and pushed
- [ ] 0 test failures

### Expected Test Count
- **Before**: 617 tests passing
- **After**: 633 tests passing (617 + 16 new)

### Expected Branch Count
- **Before**: 9 remote branches
- **After**: 3 remote branches (master + 2 unmerged)

---

## Rollback Plan

If anything goes wrong:

```bash
# Restore from backup
git reset --hard HEAD~5  # Roll back 5 commits
git push origin master --force  # Restore remote (ONLY if needed)

# Restore branches if deleted prematurely
git push origin <commit-hash>:refs/heads/claude/<branch-name>
```

---

## Notes for Claude Code Web

- **Estimated time**: 2-3 hours total
- **Can be done in stages**: Each phase is independent
- **Test frequently**: Run tests after Phase 2 and Phase 4
- **Ask if unclear**: Better to clarify than make wrong assumptions
- **Key files to understand**:
  - `src/services/MovementService.ts` (pathChoiceMemory implementation)
  - `data/process_game_data.py` (data processing logic)
  - Existing test patterns in `tests/services/` and `tests/regression/`

---

**End of Cleanup Plan**
