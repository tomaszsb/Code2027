# Regression Testing Agent Prompt

## Overview

This prompt guides a specialized testing subagent to add regression tests for specific bugs to Code2027's existing comprehensive test suite (617 tests passing).

## Current Test Infrastructure ✅

Code2027 already has robust test coverage:

- **617 tests passing** (100% success rate)
- **Framework**: Vitest with React Testing Library
- **Component tests**: 20+ files in `tests/components/`
- **Service tests**: 15+ files in `tests/services/`
- **E2E tests**: `E2E-01` through `E2E-05` covering critical user flows
- **Regression tests**: Existing files like `GameLogRegression.test.ts`
- **Coverage**: >80% for components, >90% for services

## Mission: Add Regression Tests for Recent Bugs

### Bug #1: Button Nesting (Invalid HTML)
**What happened**: `ActionButtons` were rendered inside `ExpandableSection` header `<button>`, creating nested buttons (invalid HTML) and breaking click events.

**Root cause**: `headerActions` prop rendered inside the header button element.

**Fix**: Moved `headerActions` to render outside the button.

**Test needed**: `tests/regression/ButtonNesting.regression.test.tsx`

### Bug #2: NaN Card Count
**What happened**: Manual card effect showed "You picked up NaN E cards".

**Root cause**: `effect_value` was `undefined` or invalid string, not parsed correctly.

**Fix**: Added fallback to actual drawn card count in `TurnService.triggerManualEffectWithFeedback()`.

**Test needed**: `tests/regression/CardCountNaN.regression.test.tsx`

## Test Files to Create

### File 1: `tests/regression/ButtonNesting.regression.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ExpandableSection } from '../../../src/components/player/ExpandableSection';
import { ActionButton } from '../../../src/components/ActionButton';

describe('ButtonNesting Regression Tests', () => {
  describe('ExpandableSection with headerActions', () => {
    it('should not nest buttons inside header button', () => {
      const mockAction = vi.fn();
      const { container } = render(
        <ExpandableSection
          title="Test Section"
          isExpanded={false}
          onToggle={vi.fn()}
          headerActions={
            <ActionButton
              onClick={mockAction}
              label="Action"
              variant="primary"
            />
          }
        >
          <div>Content</div>
        </ExpandableSection>
      );

      // Check for nested buttons in DOM
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const nestedButtons = button.querySelectorAll('button');
        expect(nestedButtons.length).toBe(0);
      });
    });

    it('should allow headerActions button click without interference', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();
      const mockToggle = vi.fn();

      render(
        <ExpandableSection
          title="Cards"
          isExpanded={false}
          onToggle={mockToggle}
          headerActions={
            <ActionButton
              onClick={mockAction}
              label="Draw Cards"
              variant="primary"
            />
          }
        >
          <div>Card content</div>
        </ExpandableSection>
      );

      // Click the action button
      const actionButton = screen.getByRole('button', { name: /draw cards/i });
      await user.click(actionButton);

      // Action should fire, toggle should NOT
      expect(mockAction).toHaveBeenCalledTimes(1);
      expect(mockToggle).not.toHaveBeenCalled();
    });

    it('should allow section toggle without triggering headerActions', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();
      const mockToggle = vi.fn();

      render(
        <ExpandableSection
          title="Cards"
          isExpanded={false}
          onToggle={mockToggle}
          headerActions={
            <ActionButton
              onClick={mockAction}
              label="Draw Cards"
              variant="primary"
            />
          }
        >
          <div>Card content</div>
        </ExpandableSection>
      );

      // Click the section title/header (not the action button)
      const header = screen.getByText('Cards').closest('button');
      if (header) {
        await user.click(header);
      }

      // Toggle should fire, action should NOT
      expect(mockToggle).toHaveBeenCalledTimes(1);
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should not produce React warnings about invalid DOM nesting', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ExpandableSection
          title="Test"
          isExpanded={false}
          onToggle={vi.fn()}
          headerActions={
            <ActionButton onClick={vi.fn()} label="Action" variant="primary" />
          }
        >
          <div>Content</div>
        </ExpandableSection>
      );

      // Check for React warnings about nesting
      const nestingWarnings = consoleErrorSpy.mock.calls.filter(call =>
        call.some(arg =>
          typeof arg === 'string' &&
          (arg.includes('validateDOMNesting') || arg.includes('button'))
        )
      );

      expect(nestingWarnings.length).toBe(0);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('CardsSection integration', () => {
    it('should render manual action buttons without nesting issues', () => {
      // This test would import CardsSection and verify no button nesting
      // when manual effects are present
      // TODO: Implement once we determine CardsSection structure
    });
  });
});
```

### File 2: `tests/regression/CardCountNaN.regression.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TurnService } from '../../src/services/TurnService';
import { StateService } from '../../src/services/StateService';
import { DataService } from '../../src/services/DataService';
import { CardService } from '../../src/services/CardService';
import { Player, GameState } from '../../src/types/game';

describe('CardCountNaN Regression Tests', () => {
  let turnService: TurnService;
  let stateService: StateService;
  let dataService: DataService;
  let cardService: CardService;
  let testPlayer: Player;

  beforeEach(() => {
    // Initialize services with proper mocks
    stateService = new StateService();
    dataService = new DataService();
    cardService = new CardService(dataService, stateService);
    turnService = new TurnService(stateService, dataService, cardService);

    testPlayer = {
      id: 'player1',
      name: 'Test Player',
      position: 'SPACE-001',
      cards: { W: [], B: [], E: [], L: [], I: [] },
      money: 1000000,
      ticks: 0,
      loans: [],
      investments: [],
      color: '#FF0000',
      isActive: true
    };

    const gameState: GameState = {
      players: [testPlayer],
      currentPlayerIndex: 0,
      deck: { W: [], B: [], E: [], L: [], I: [] },
      discardedCards: { W: [], B: [], E: [], L: [], I: [] },
      currentTurn: 1,
      gamePhase: 'playing',
      winner: null
    };

    stateService.initializeGame(gameState);
  });

  describe('triggerManualEffectWithFeedback', () => {
    it('should handle undefined effect_value without showing NaN', async () => {
      const spaceEffect = {
        effect_type: 'manual',
        effect_subtype: 'draw_cards',
        effect_value: undefined, // This was causing NaN
        card_type: 'E'
      };

      const result = await turnService.triggerManualEffectWithFeedback(
        testPlayer.id,
        spaceEffect
      );

      // Should not contain NaN
      expect(result.message).not.toContain('NaN');

      // Should show actual count
      expect(result.message).toMatch(/\d+ E cards?/i);
    });

    it('should handle invalid string effect_value without showing NaN', async () => {
      const spaceEffect = {
        effect_type: 'manual',
        effect_subtype: 'draw_cards',
        effect_value: 'invalid', // Non-numeric string
        card_type: 'E'
      };

      const result = await turnService.triggerManualEffectWithFeedback(
        testPlayer.id,
        spaceEffect
      );

      expect(result.message).not.toContain('NaN');
      expect(result.message).toMatch(/\d+ E cards?/i);
    });

    it('should correctly parse numeric string effect_value', async () => {
      const spaceEffect = {
        effect_type: 'manual',
        effect_subtype: 'draw_cards',
        effect_value: '3', // String number
        card_type: 'E'
      };

      const result = await turnService.triggerManualEffectWithFeedback(
        testPlayer.id,
        spaceEffect
      );

      expect(result.message).toContain('3 E cards');
      expect(result.message).not.toContain('NaN');
    });

    it('should use actual drawn card count when effect_value is missing', async () => {
      const spaceEffect = {
        effect_type: 'manual',
        effect_subtype: 'draw_cards',
        effect_value: undefined,
        card_type: 'W'
      };

      // Mock CardService to return specific cards
      const mockCards = ['W001', 'W002', 'W003', 'W004', 'W005'];
      vi.spyOn(cardService, 'drawCards').mockReturnValue({
        cards: mockCards,
        drawnCards: mockCards.map(id => ({ card_id: id, card_type: 'W' }))
      });

      const result = await turnService.triggerManualEffectWithFeedback(
        testPlayer.id,
        spaceEffect
      );

      // Should show actual count of 5, not NaN
      expect(result.message).toContain('5 W cards');
      expect(result.message).not.toContain('NaN');
    });

    it('should handle zero card draws gracefully', async () => {
      const spaceEffect = {
        effect_type: 'manual',
        effect_subtype: 'draw_cards',
        effect_value: '0',
        card_type: 'B'
      };

      const result = await turnService.triggerManualEffectWithFeedback(
        testPlayer.id,
        spaceEffect
      );

      expect(result.message).not.toContain('NaN');
      // Should handle zero appropriately
      expect(result.message).toMatch(/0 B cards?|no B cards/i);
    });
  });

  describe('UI Message Formatting', () => {
    it('should produce grammatically correct singular/plural messages', async () => {
      // Test singular
      const singularEffect = {
        effect_type: 'manual',
        effect_subtype: 'draw_cards',
        effect_value: '1',
        card_type: 'E'
      };

      const singularResult = await turnService.triggerManualEffectWithFeedback(
        testPlayer.id,
        singularEffect
      );

      expect(singularResult.message).toMatch(/1 E card(?!s)/i); // "card" not "cards"

      // Test plural
      const pluralEffect = {
        effect_type: 'manual',
        effect_subtype: 'draw_cards',
        effect_value: '3',
        card_type: 'E'
      };

      const pluralResult = await turnService.triggerManualEffectWithFeedback(
        testPlayer.id,
        pluralEffect
      );

      expect(pluralResult.message).toMatch(/3 E cards/i);
    });
  });
});
```

## Implementation Plan

### Phase 1: Create Regression Test Files (Priority: HIGH)
1. Create `tests/regression/` directory if it doesn't exist
2. Add `ButtonNesting.regression.test.tsx`
3. Add `CardCountNaN.regression.test.tsx`

### Phase 2: Verify Tests Catch the Bugs (Priority: HIGH)
1. Temporarily revert the fixes
2. Run regression tests - they should FAIL
3. Re-apply fixes
4. Run regression tests - they should PASS
5. Document the verification process

### Phase 3: Integration with Existing Suite (Priority: MEDIUM)
1. Add regression tests to CI/CD pipeline
2. Update test scripts in `package.json` if needed:
   ```json
   {
     "test:regression": "vitest run tests/regression/"
   }
   ```
3. Ensure all 617+ tests still pass

### Phase 4: Documentation (Priority: MEDIUM)
1. Update `docs/TESTING_REQUIREMENTS.md` with regression testing guidelines
2. Add section: "Adding Regression Tests for New Bugs"
3. Document the two bugs and their tests as examples

## Success Criteria

✅ **Phase 1 Complete When:**
- Both regression test files exist
- All tests in both files pass
- No TypeScript errors

✅ **Phase 2 Complete When:**
- Tests fail with bugs reintroduced
- Tests pass with fixes in place
- Verification documented in PR

✅ **Phase 3 Complete When:**
- All 617+ existing tests still pass
- New regression tests included in CI/CD
- Coverage report updated

✅ **Phase 4 Complete When:**
- Testing docs updated
- Future developers know how to add regression tests
- Examples provided

## Test Execution Commands

```bash
# Run only regression tests
npm run test tests/regression/

# Run all tests including new regression tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode during development
npm run test:watch tests/regression/
```

## Agent Invocation

To invoke this regression testing agent:

```bash
Task({
  subagent_type: "general-purpose",
  description: "Add regression tests for recent bugs",
  prompt: "Using the regression-testing-agent.md prompt in .claude/prompts/, create regression tests for the button nesting and NaN card count bugs. Follow Phase 1 and Phase 2 of the implementation plan. Verify the tests catch the bugs when fixes are temporarily reverted."
})
```

## Notes for Developers

- **Always add regression tests** when fixing bugs
- **Verify tests fail** before the fix (TDD approach)
- **Keep tests focused** on the specific bug
- **Document the bug** in test comments
- **Use descriptive test names** that explain the bug

---

**Last Updated**: 2025-11-07
**Purpose**: Add regression tests for button nesting and NaN bugs to existing 617-test suite
**Key Change**: Refocused from "setup testing" to "add specific regression tests"
