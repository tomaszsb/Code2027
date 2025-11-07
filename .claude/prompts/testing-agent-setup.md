# Testing Agent Setup Prompt

## Overview
This prompt is designed for a specialized testing subagent that will create comprehensive test coverage for the Code2027 game application. The agent should focus on preventing regressions and ensuring code quality through automated testing.

## Context

### Recent Regressions That Should Have Been Caught
1. **Button Nesting Bug**: ActionButtons rendered inside ExpandableSection header button, creating invalid HTML and breaking click events
2. **NaN Card Count**: Card drawing logic returned "NaN E cards" due to improper effect_value parsing

### Current Testing Gaps
- No unit tests for interactive components (ExpandableSection, ActionButton, CardsSection)
- No integration tests for critical user flows (card drawing, dice rolling)
- No E2E tests for main game actions
- No automated regression testing

## Agent Mission

Create a comprehensive, maintainable test suite for the Code2027 game application that:
1. **Prevents regressions** like the button nesting and NaN bugs
2. **Validates critical user flows** (setup, turn taking, card actions)
3. **Ensures service reliability** (StateService, TurnService, CardService)
4. **Maintains code quality** through CI/CD integration

## Project Structure

```
Code2027/
├── src/
│   ├── components/          # React components
│   │   ├── player/         # Player panel components
│   │   ├── modals/         # Modal dialogs
│   │   ├── setup/          # Game setup
│   │   └── game/           # Game board & controls
│   ├── services/           # Business logic services
│   │   ├── StateService.ts
│   │   ├── TurnService.ts
│   │   ├── CardService.ts
│   │   └── DataService.ts
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── package.json
└── tsconfig.json
```

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: Custom StateService with pub/sub pattern
- **Build Tool**: Vite
- **Styling**: CSS modules

## Testing Requirements

### 1. Unit Tests (Priority: HIGH)

#### Component Tests
Test files to create in `src/components/**/__tests__/`:

**ExpandableSection.test.tsx**
```typescript
// Test cases:
- Renders with correct title and icon
- Toggles expanded/collapsed state on click
- Does not nest buttons inside buttons (regression test)
- Renders headerActions outside button element
- Calls onToggle when header clicked
- Displays action indicator when hasAction is true
- Shows summary content when provided
- Handles loading state
- Handles error state with retry
```

**ActionButton.test.tsx**
```typescript
// Test cases:
- Renders with correct label and variant
- Handles onClick callback
- Disables when disabled prop is true
- Shows loading state with spinner
- Applies correct styles for each variant (primary, secondary, danger)
- Handles keyboard interaction (Enter, Space)
- Sets correct ARIA attributes
```

**CardsSection.test.tsx**
```typescript
// Test cases:
- Displays correct card counts by type
- Shows manual effect buttons when available
- Shows dice effect buttons when available
- Triggers manual effect on button click (regression test)
- Does not nest buttons (regression test)
- Handles loading state during actions
- Displays error messages
- Shows empty state when no cards
- Toggles card type expansion
- Shows E card play button when phase matches
```

#### Service Tests
Test files to create in `src/services/__tests__/`:

**TurnService.test.ts**
```typescript
// Test cases:
- triggerManualEffectWithFeedback handles undefined effect_value (regression)
- triggerManualEffectWithFeedback parses string numbers correctly
- triggerManualEffectWithFeedback falls back to actual card count
- Card drawing returns correct count message (no NaN)
- Dice rolling processes effects correctly
- Manual actions update player state
- Effect results include correct card IDs
```

**StateService.test.ts**
```typescript
// Test cases:
- Player state updates trigger subscribers
- Game state mutations are atomic
- Snapshot save/restore works correctly
- Action counts track correctly
- Completed actions are recorded properly
```

**CardService.test.ts**
```typescript
// Test cases:
- Card type detection works for all types (W, B, E, L, I)
- Play card validates phase restrictions
- E cards can only be played in correct phase
- Card drawing updates player hand
- Deck shuffling is random but deterministic
```

### 2. Integration Tests (Priority: MEDIUM)

Test files to create in `src/__tests__/integration/`:

**CardDrawing.integration.test.tsx**
```typescript
// Test workflow:
1. Start game with player
2. Player lands on space with E card manual effect
3. Click "Draw 3 E cards" button
4. Verify cards are added to player hand
5. Verify correct message shown (no NaN)
6. Verify action marked as complete
```

**PlayerTurn.integration.test.tsx**
```typescript
// Test workflow:
1. Start game
2. Roll dice
3. Process space effects
4. Complete manual actions
5. End turn
6. Verify state transitions
```

**ModalInteractions.integration.test.tsx**
```typescript
// Test workflow:
1. Trigger choice modal
2. Select option
3. Verify DiceResultModal shows
4. Click Continue button (standardized styling)
5. Verify modal closes and state updates
```

### 3. E2E Tests (Priority: LOW - but important)

Test files to create in `e2e/`:

**GameSetupFlow.spec.ts**
```typescript
// Using Playwright or Cypress:
1. Navigate to game
2. Add players
3. Customize player names/colors
4. Start game
5. Verify game board renders
```

**BasicGameplay.spec.ts**
```typescript
// Test complete turn:
1. Roll dice
2. Click manual action buttons
3. Verify card count updates
4. End turn
5. Verify turn advances
```

### 4. Regression Tests

Create `src/__tests__/regression/` with specific tests for known bugs:

**ButtonNesting.regression.test.tsx**
```typescript
// Validates button nesting fix:
- ExpandableSection with headerActions doesn't create nested buttons
- ActionButton clicks work inside ExpandableSection
- No React warnings about invalid HTML
```

**CardCountNaN.regression.test.tsx**
```typescript
// Validates NaN card count fix:
- Manual card effect with undefined value doesn't show NaN
- Manual card effect with invalid string doesn't show NaN
- Falls back to actual drawn card count
```

## Testing Framework Setup

### Recommended Stack
1. **Test Runner**: Vitest (fast, Vite-compatible)
2. **Component Testing**: React Testing Library
3. **E2E Testing**: Playwright
4. **Mocking**: Vitest mocks
5. **Coverage**: Istanbul/c8

### Installation Commands
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @vitest/ui @vitest/coverage-c8
npm install -D jsdom
npm install -D @playwright/test  # For E2E
```

### Configuration Files to Create

**vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/*.test.{ts,tsx}'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**src/test/setup.ts**
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

**playwright.config.ts** (for E2E)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Package.json Scripts to Add
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Test Writing Guidelines

### 1. Mock External Dependencies
```typescript
// Mock services in tests
vi.mock('../../services/StateService', () => ({
  StateService: vi.fn(() => ({
    getPlayer: vi.fn(),
    updatePlayer: vi.fn(),
    subscribe: vi.fn()
  }))
}));
```

### 2. Use Testing Library Best Practices
```typescript
// Good: Query by role, label
const button = screen.getByRole('button', { name: /draw 3 e cards/i });

// Bad: Query by class or test ID
const button = screen.getByTestId('draw-button');
```

### 3. Test User Behavior, Not Implementation
```typescript
// Good: Test what user sees and does
await user.click(screen.getByRole('button', { name: 'Draw Cards' }));
expect(screen.getByText(/you picked up 3 e cards/i)).toBeInTheDocument();

// Bad: Test internal state
expect(component.state.cardCount).toBe(3);
```

### 4. Use Descriptive Test Names
```typescript
// Good
it('should display actual card count when effect_value is undefined', () => {});

// Bad
it('test card count', () => {});
```

## Success Criteria

The testing agent should achieve:

1. **✅ Coverage Goals**
   - Component coverage: >80%
   - Service coverage: >90%
   - Critical path coverage: 100%

2. **✅ Regression Prevention**
   - All known bugs have regression tests
   - Tests fail when bugs are reintroduced

3. **✅ CI/CD Integration**
   - Tests run on every commit
   - Pull requests blocked if tests fail
   - Coverage reports generated

4. **✅ Documentation**
   - Each test file has clear comments
   - Test README explains how to run tests
   - Examples provided for writing new tests

## Getting Started

### Phase 1: Setup (Day 1)
1. Install testing dependencies
2. Configure Vitest and React Testing Library
3. Create test setup file
4. Add npm scripts
5. Create example test to verify setup

### Phase 2: Regression Tests (Day 1-2)
1. Create tests for button nesting bug
2. Create tests for NaN card count bug
3. Verify tests fail with old code
4. Verify tests pass with fixed code

### Phase 3: Component Tests (Day 2-4)
1. Test ExpandableSection thoroughly
2. Test ActionButton thoroughly
3. Test CardsSection thoroughly
4. Test all modal components
5. Test PlayerPanel sections

### Phase 4: Service Tests (Day 4-6)
1. Test TurnService critical methods
2. Test StateService state management
3. Test CardService card operations
4. Test DataService data loading

### Phase 5: Integration Tests (Day 6-7)
1. Test card drawing flow
2. Test turn completion flow
3. Test modal interactions
4. Test game setup flow

### Phase 6: E2E Tests (Optional, Day 8+)
1. Setup Playwright
2. Create basic gameplay test
3. Create setup flow test
4. Create edge case tests

### Phase 7: CI/CD (Day 8+)
1. Create GitHub Actions workflow
2. Configure test coverage reporting
3. Set up pull request checks
4. Document testing process

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Documentation](https://playwright.dev/)

## Questions to Clarify

When starting work, the testing agent should clarify:
1. Are there any existing tests to build upon?
2. What is the preferred test runner? (Vitest recommended)
3. Should E2E tests be included in Phase 1?
4. What is the target code coverage percentage?
5. Is there a CI/CD pipeline already set up?
6. Are there any specific edge cases to test?

## Agent Invocation

To invoke this testing agent, use:

```bash
# Using Task tool
Task({
  subagent_type: "general-purpose",
  description: "Set up comprehensive testing",
  prompt: "Using the testing-agent-setup.md prompt in .claude/prompts/, set up comprehensive test coverage for the Code2027 game. Start with Phase 1 (setup) and Phase 2 (regression tests for button nesting and NaN card count bugs). Focus on preventing the regressions we just fixed."
})
```

---

**Last Updated**: 2025-11-07
**Created By**: Button Standardization Session
**Purpose**: Prevent future regressions and improve code quality
