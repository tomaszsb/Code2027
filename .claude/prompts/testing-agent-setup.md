# Add Regression Tests for Recent Bugs

## Overview
This prompt adds regression tests for two recent bugs to the **existing comprehensive test suite** (617 tests passing).

## Current Test Infrastructure ✅

Code2027 already has excellent test coverage:
- **617 tests passing** (confirmed in package.json)
- ✅ Vitest configured (`vitest.config.dev.ts`, `vitest.config.ci.ts`)
- ✅ Component tests: `tests/components/` (modals, player panel, game board)
- ✅ Service tests: `tests/services/` (StateService, TurnService, CardService, etc.)
- ✅ E2E tests: `E2E-01_HappyPath.test.ts` through `E2E-05_MultiPlayerEffects.test.ts`
- ✅ Regression tests: `GameLogRegression.test.ts`, `ActionSequenceRegression.test.ts`, `SpaceProgressionRegression.test.ts`
- ✅ Integration tests, isolated tests, and performance tests

**We are NOT setting up testing from scratch.** We are adding specific regression tests for two new bugs.

## Recent Regressions That Need Tests

### Bug #1: Button Nesting in ExpandableSection
**What happened**: ActionButton components were rendered inside the ExpandableSection header `<button>` element, creating invalid HTML (`<button>` inside `<button>`). This broke click events.

**Fixed in commit**: f663877 (fix(ui): Fix button nesting regression and NaN card count bug)

**Files affected**:
- `src/components/player/ExpandableSection.tsx`
- `src/components/player/ExpandableSection.css`

**Test needed**: Verify ActionButtons in `headerActions` don't create nested buttons

### Bug #2: NaN Card Count in Manual Effects
**What happened**: Card drawing returned "You picked up NaN E cards!" when `effect_value` was undefined or unparseable.

**Fixed in commit**: f663877

**Files affected**:
- `src/services/TurnService.ts` (line 1709-1727)

**Test needed**: Verify card count parsing handles edge cases correctly

## Task: Add Two Regression Tests

### Test 1: Button Nesting Regression Test

**File**: `tests/components/player/ExpandableSectionRegression.test.tsx`

```typescript
/**
 * Regression test for button nesting bug (commit f663877)
 * Ensures ActionButtons in headerActions don't create nested buttons
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpandableSection } from '../../../src/components/player/ExpandableSection';
import { ActionButton } from '../../../src/components/player/ActionButton';

describe('ExpandableSection - Button Nesting Regression', () => {
  it('should not nest buttons inside header button when headerActions provided', () => {
    const { container } = render(
      <ExpandableSection
        title="Test Section"
        icon="🧪"
        hasAction={true}
        isExpanded={false}
        onToggle={() => {}}
        ariaControls="test-section"
        headerActions={
          <>
            <ActionButton
              label="Test Action"
              variant="primary"
              onClick={() => {}}
            />
          </>
        }
      >
        <div>Content</div>
      </ExpandableSection>
    );

    // Find all buttons
    const buttons = container.querySelectorAll('button');

    // Verify no button is a descendant of another button
    buttons.forEach((button) => {
      const parentButton = button.parentElement?.closest('button');
      expect(parentButton).toBeNull();
    });
  });

  it('should render headerActions outside the header button element', () => {
    render(
      <ExpandableSection
        title="Test Section"
        icon="🧪"
        hasAction={true}
        isExpanded={false}
        onToggle={() => {}}
        ariaControls="test-section"
        headerActions={
          <ActionButton
            label="Draw Cards"
            variant="primary"
            onClick={() => {}}
          />
        }
      >
        <div>Content</div>
      </ExpandableSection>
    );

    const actionButton = screen.getByRole('button', { name: /draw cards/i });
    const headerButton = screen.getByRole('button', { name: /test section/i });

    // Verify action button is NOT a child of header button
    expect(headerButton.contains(actionButton)).toBe(false);
  });

  it('should allow ActionButton clicks when in headerActions', async () => {
    const handleClick = vi.fn();
    const { user } = render(
      <ExpandableSection
        title="Cards"
        icon="🎴"
        hasAction={true}
        isExpanded={false}
        onToggle={() => {}}
        ariaControls="cards-section"
        headerActions={
          <ActionButton
            label="Draw 3 E Cards"
            variant="primary"
            onClick={handleClick}
          />
        }
      >
        <div>Cards content</div>
      </ExpandableSection>
    );

    const drawButton = screen.getByRole('button', { name: /draw 3 e cards/i });
    await user.click(drawButton);

    // Verify click event fired (would fail with nested buttons)
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test 2: NaN Card Count Regression Test

**File**: `tests/services/TurnServiceCardCountRegression.test.ts`

```typescript
/**
 * Regression test for NaN card count bug (commit f663877)
 * Ensures card count parsing handles undefined/invalid effect_value
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TurnService } from '../../src/services/TurnService';
import { StateService } from '../../src/services/StateService';
import { DataService } from '../../src/services/DataService';
import { CardService } from '../../src/services/CardService';
import { LoggingService } from '../../src/services/LoggingService';
import type { SpaceEffect } from '../../src/types/DataTypes';

describe('TurnService - Card Count NaN Regression', () => {
  let turnService: TurnService;
  let stateService: StateService;
  let dataService: DataService;
  let cardService: CardService;
  let loggingService: LoggingService;

  beforeEach(() => {
    // Setup services (use existing test setup patterns)
    loggingService = new LoggingService();
    dataService = new DataService();
    cardService = new CardService(dataService);
    stateService = new StateService(loggingService, dataService);
    turnService = new TurnService(
      stateService,
      dataService,
      cardService,
      loggingService
    );

    // Setup test player
    stateService.addPlayer('test-player', 'Test Player', 'red', '👤');
  });

  it('should handle undefined effect_value and show actual card count', async () => {
    // Mock space effect with undefined effect_value
    const mockEffect: SpaceEffect = {
      space_name: 'TEST-SPACE',
      trigger_type: 'manual',
      effect_type: 'cards',
      effect_action: 'draw_E',
      effect_value: undefined as any, // Simulating missing value
      visit_type: 'first',
      description: 'Draw 3'
    };

    vi.spyOn(dataService, 'getSpaceEffects').mockReturnValue([mockEffect]);

    // Mock card drawing (3 cards drawn)
    const drawnCards = ['E001', 'E002', 'E003'];
    vi.spyOn(cardService, 'drawCards').mockReturnValue(drawnCards);

    const result = await turnService.triggerManualEffectWithFeedback(
      'test-player',
      'cards'
    );

    // Verify result doesn't contain NaN
    expect(result.summary).not.toContain('NaN');
    // Should show actual count (3) as fallback
    expect(result.summary).toContain('3');
    expect(result.summary).toMatch(/You picked up 3 E cards!/i);
  });

  it('should handle unparseable string effect_value', async () => {
    const mockEffect: SpaceEffect = {
      space_name: 'TEST-SPACE',
      trigger_type: 'manual',
      effect_type: 'cards',
      effect_action: 'draw_E',
      effect_value: 'invalid-string' as any,
      visit_type: 'first',
      description: 'Draw E'
    };

    vi.spyOn(dataService, 'getSpaceEffects').mockReturnValue([mockEffect]);

    const drawnCards = ['E004', 'E005'];
    vi.spyOn(cardService, 'drawCards').mockReturnValue(drawnCards);

    const result = await turnService.triggerManualEffectWithFeedback(
      'test-player',
      'cards'
    );

    // Should NOT show NaN, should use actual drawn card count (2)
    expect(result.summary).not.toContain('NaN');
    expect(result.summary).toContain('2');
  });

  it('should correctly parse valid string effect_value', async () => {
    const mockEffect: SpaceEffect = {
      space_name: 'TEST-SPACE',
      trigger_type: 'manual',
      effect_type: 'cards',
      effect_action: 'draw_E',
      effect_value: '3', // String that should parse to 3
      visit_type: 'first',
      description: 'Draw 3'
    };

    vi.spyOn(dataService, 'getSpaceEffects').mockReturnValue([mockEffect]);

    const drawnCards = ['E006', 'E007', 'E008'];
    vi.spyOn(cardService, 'drawCards').mockReturnValue(drawnCards);

    const result = await turnService.triggerManualEffectWithFeedback(
      'test-player',
      'cards'
    );

    // Should parse string "3" to number 3
    expect(result.summary).toContain('3');
    expect(result.summary).toMatch(/You picked up 3 E cards!/i);
  });

  it('should handle numeric effect_value correctly', async () => {
    const mockEffect: SpaceEffect = {
      space_name: 'TEST-SPACE',
      trigger_type: 'manual',
      effect_type: 'cards',
      effect_action: 'draw_B',
      effect_value: 2, // Proper number
      visit_type: 'first',
      description: 'Draw 2'
    };

    vi.spyOn(dataService, 'getSpaceEffects').mockReturnValue([mockEffect]);

    const drawnCards = ['B001', 'B002'];
    vi.spyOn(cardService, 'drawCards').mockReturnValue(drawnCards);

    const result = await turnService.triggerManualEffectWithFeedback(
      'test-player',
      'cards'
    );

    expect(result.summary).toContain('2');
    expect(result.summary).toMatch(/You picked up 2 B cards!/i);
  });
});
```

## Implementation Steps

### Step 1: Create Button Nesting Regression Test
```bash
# Create test file
touch tests/components/player/ExpandableSectionRegression.test.tsx

# Add the test code from Test 1 above
# Run to verify it passes
npm test tests/components/player/ExpandableSectionRegression.test.tsx
```

### Step 2: Create Card Count Regression Test
```bash
# Create test file
touch tests/services/TurnServiceCardCountRegression.test.ts

# Add the test code from Test 2 above
# Run to verify it passes
npm test tests/services/TurnServiceCardCountRegression.test.ts
```

### Step 3: Verify Tests Fail on Old Code
To ensure these tests actually catch the bugs, you can:

1. Temporarily revert the fix in ExpandableSection.tsx (move headerActions back inside button)
2. Run button nesting test - should FAIL
3. Restore the fix - test should PASS

4. Temporarily revert the fix in TurnService.ts (remove fallback logic)
5. Run card count test - should FAIL (show NaN)
6. Restore the fix - test should PASS

### Step 4: Update Test Count
After adding both tests, update package.json description:
```json
"description": "Clean architecture refactor of code2026 board game with comprehensive test suite (619 tests passing)"
```

### Step 5: Run Full Test Suite
```bash
# Verify all tests still pass
npm test

# Check test count increased by 2
npm run test:progress
```

## Success Criteria

- ✅ Both regression test files created
- ✅ All new tests pass
- ✅ Total test count: 619 (was 617 + 2 new)
- ✅ Tests fail when bugs are reintroduced
- ✅ No existing tests broken
- ✅ Package.json description updated

## Integration with Existing Test Infrastructure

These tests integrate seamlessly with the existing structure:
- Follow same patterns as existing regression tests (GameLogRegression.test.ts, etc.)
- Use same testing utilities (@testing-library/react, vitest)
- Run with existing test scripts (`npm test`, `npm run test:components`, `npm run test:services`)
- Counted in existing coverage reports

## Notes

- **DO NOT** modify vitest config (already properly configured)
- **DO NOT** add new testing dependencies (all already installed)
- **DO NOT** create new test infrastructure (use existing patterns)
- **DO** follow existing test file naming conventions
- **DO** use existing mock patterns and test utilities

---

**Last Updated**: 2025-11-07
**Purpose**: Add regression tests for button nesting and NaN card count bugs
**Context**: Supplement existing 617-test suite, not replace it
