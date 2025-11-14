# Test Failure Analysis (CORRECTED): Code vs Test Issues

**DEEP DIVE ANALYSIS** - After thorough code review and error trace analysis

## Summary

Out of 9 failing test files:
- **4 are CODE PROBLEMS** (implementation bugs)
- **4 are TEST PROBLEMS** (incorrect test setup/expectations)
- **1 is PASSING NOW** (SpaceExplorerPanel shows no errors)

---

## Detailed Analysis with Evidence

### 1. ❌ CODE PROBLEM: tests/E2E-01_HappyPath.test.ts

**Error**: `expected 0 to be greater than 0` - Player hand empty after card draw

**Evidence**:
- Test line 106: `await turnService.triggerManualEffectWithFeedback(player.id, 'cards')`
- CSV config: OWNER-SCOPE-INITIATION has `cards,draw_E,Draw 3` manual effect
- Expected: hand.length > 0
- Actual: hand.length = 0

**Why it's CODE**:
- Test correctly calls the card drawing method
- CSV configuration exists and is correct
- The implementation of card drawing is broken
- Either `applySpaceCardEffect()` or `CardService` integration has a bug

**Root cause**: Card drawing logic not working despite valid configuration and API calls

---

### 2. ❌ CODE PROBLEM: tests/E2E-04_SpaceTryAgain.test.ts

**Error**: `expected false to be true` - tryAgainOnSpace returns success: false

**Evidence**:
- Test line 102: `stateService.savePreSpaceEffectSnapshot(playerA.id, 'OWNER-SCOPE-INITIATION')`
- Test line 110: `await turnService.tryAgainOnSpace(playerA.id)` returns `{success: false}`
- CSV config (Spaces.csv line 4): OWNER-SCOPE-INITIATION,First has `can_negotiate: YES`

**Why it's CODE**:
- Test properly saves snapshot before calling tryAgainOnSpace
- CSV has can_negotiate flag set correctly
- TurnService.tryAgainOnSpace() (src/services/TurnService.ts:1965-2015) has THREE validation checks:
  1. `if (!this.stateService.isInitialized())` - returns false
  2. `if (!this.stateService.hasPreSpaceEffectSnapshot(...))` - returns false
  3. `if (!spaceContent.can_negotiate)` - returns false
- One of these checks is failing despite proper test setup

**Root cause**: Either game initialization state is broken, OR CSV parsing of can_negotiate field is incorrect

---

### 3. ❌ CODE PROBLEM: tests/E2E-03_ComplexSpace.test.ts

**Two failures in this file:**

**3a. Try Again failure** - Same as #2 above

**3b. Negotiation detection failure**
**Error**: Line 205: `expect(ownerScopeContent?.can_negotiate).toBe(true)` - returns false

**Evidence**:
- CSV line (Spaces.csv:4): `OWNER-SCOPE-INITIATION,SETUP,First,...,YES,Yes,Main,1`
- Column for can_negotiate shows `YES`
- Test gets `false` instead of `true`

**Why it's CODE**:
- CSV has the correct value `YES`
- DataService is parsing it as `false`
- This is a **CSV parsing bug** - the YES/NO string is not being converted to boolean correctly

**Root cause**: DataService CSV parser not converting "YES" string to boolean true

---

### 4. ✅ TEST PROBLEM: tests/components/CardDetailsModal.test.tsx

**Error**: `Unable to find an element with the text: 🔄 Transfer Card`

**Evidence**:
```javascript
// Component code (CardDetailsModal.tsx:45-52)
const canTransferCard = (): boolean => {
  if (!currentPlayer || !card) return false;
  if (!card.is_transferable) return false;  // ← CHECKS THIS
  return currentPlayer.hand?.includes(card.card_id) || false;
};

// Test mock (CardDetailsModal.test.tsx:83-90)
mockTransferableCard = {
  card_id: 'E001',
  card_name: 'Permit Expeditor',
  card_type: 'E',
  description: 'Expedites permit processing',
  effects_on_play: 'time:-2',
  cost: 200
  // ❌ MISSING: is_transferable: true
};
```

**Why it's TEST**:
- Component correctly checks for `is_transferable` property (line 49)
- Mock card object doesn't include this property
- Component behaves correctly by NOT showing button for non-transferable cards
- Test expects button without setting up prerequisite data

**Fix**: Add `is_transferable: true` to mock card in test

---

### 5. ✅ PASSING: tests/components/game/SpaceExplorerPanel.test.tsx

**Status**: No errors shown in output (empty section in error dump)

**Verdict**: Likely passing now or times out gracefully

---

### 6. ✅ TEST PROBLEM: tests/components/modals/DiceResultModal.test.tsx

**Error**: `useGameContext must be used within a ServiceProvider`

**Evidence**:
```
Error: useGameContext must be used within a ServiceProvider
 ❯ useGameContext src/context/GameContext.ts:23:11
 ❯ DiceResultModal src/components/modals/DiceResultModal.tsx:23:27
```

**Why it's TEST**:
- Component calls `useGameContext()` which requires `<GameContext.Provider>` wrapper
- Test renders component directly without provider:
  ```javascript
  render(<DiceResultModal {...props} />)  // ❌ Missing provider
  ```
- Should be:
  ```javascript
  render(
    <GameContext.Provider value={mockServices}>
      <DiceResultModal {...props} />
    </GameContext.Provider>
  )
  ```

**Fix**: Wrap component in GameContext.Provider in all 12 tests

---

### 7. ❌ CODE PROBLEM: tests/components/player/NextStepButton.test.tsx

**Error**: Component shows "Roll to Move" when it should show "End Turn"

**Evidence**:
```javascript
// Test expectation (NextStepButton.test.tsx:92)
expect(screen.getByText('End Turn')).toBeInTheDocument();

// Component renders
<button aria-label="Roll to Move">Roll to Move</button>

// Component code (NextStepButton.tsx:106-113) - WRONG!
if (needsRollToMove) {
  return {
    visible: true,
    label: 'Roll to Move',  // ← SHOULD NOT BE HERE
    disabled: false,
    action: 'roll-movement'
  };
}
```

**Why it's CODE**:
- **Architecture**: NextStepButton (green button) should ONLY show "End Turn" or be disabled
- **Separate blue buttons** exist in TurnControlsWithActions.tsx:444-446 for dice rolling
- User confirmed: "the green next step button is not supposed to have any other messages than end turn"
- Component has lines 90-113 that implement "Roll to Move" logic - **THIS SHOULD NOT EXIST**
- Tests correctly expect "End Turn" in all scenarios

**Root cause**: Component implementation violates architecture - lines 90-113 should be removed

---

### 8. ❌ CODE PROBLEM: tests/features/E2E-MultiPathMovement.test.tsx

**Error**: `expected 'MULTI-PATH-SPACE' to be 'DESTINATION-A'`

**Evidence**:
- Player should move from MULTI-PATH-SPACE to DESTINATION-A
- Player remains at MULTI-PATH-SPACE
- Movement didn't execute

**Why it's CODE**:
- This is an E2E test of the multi-path movement feature
- Test properly sets up the scenario
- The movement functionality is not working
- Player stays at origin instead of moving to destination

**Root cause**: Multi-path movement implementation has a bug preventing actual movement

---

### 9. ✅ TEST PROBLEM: tests/components/player/TimeSection.test.tsx

**Error**: `Unable to find an element with the text: 10d`

**Evidence**:
```javascript
// Test (TimeSection.test.tsx:94)
expect(screen.getByText('10d')).toBeInTheDocument();  // ❌ Looking for "10d"

// Component (TimeSection.tsx:139)
const summary = <span>Elapsed: {elapsed}d</span>;  // ✅ Renders "Elapsed: 10d"

// With elapsed = 10, it renders: "Elapsed: 10d"
```

**Why it's TEST**:
- Component correctly renders time as "Elapsed: 10d"
- Test looks for just "10d" without the "Elapsed: " prefix
- Selector mismatch - test is using wrong text matcher

**Fix**: Change test to `expect(screen.getByText('Elapsed: 10d'))` or use regex `/10d/`

---

## Summary Table

| # | Test File | Verdict | Confidence | Root Cause |
|---|-----------|---------|------------|------------|
| 1 | E2E-01_HappyPath | **CODE** | 90% | Card drawing broken |
| 2 | E2E-04_SpaceTryAgain | **CODE** | 85% | Try Again validation failing |
| 3 | E2E-03_ComplexSpace | **CODE** | 90% | CSV parsing (YES→boolean) |
| 4 | CardDetailsModal | **TEST** | 100% | Missing is_transferable in mock |
| 5 | SpaceExplorerPanel | **PASSING** | 95% | No errors detected |
| 6 | DiceResultModal | **TEST** | 100% | Missing Provider wrapper |
| 7 | NextStepButton | **CODE** | 100% | Wrong architecture - has "Roll to Move" |
| 8 | E2E-MultiPathMovement | **CODE** | 80% | Movement not executing |
| 9 | TimeSection | **TEST** | 100% | Wrong text selector |

---

## Immediate Action Items

### Fix Tests (4 quick fixes):

1. **CardDetailsModal.test.tsx** ← Add `is_transferable: true` to mock (1 line)
2. **DiceResultModal.test.tsx** ← Wrap in GameContext.Provider (12 tests)
3. **TimeSection.test.tsx** ← Fix text selector to "Elapsed: 10d" (1 line)

### Fix Code (4 bugs):

1. **NextStepButton.tsx** ← Remove lines 90-113 (Roll to Move logic)
2. **DataService CSV parser** ← Fix YES/NO → boolean conversion
3. **Card drawing** ← Debug applySpaceCardEffect() / CardService
4. **Multi-path movement** ← Debug movement execution

---

## Methodology

To determine code vs test issues, I:

1. **Read implementation code** - Understand what component/service actually does
2. **Read test code** - See what test expects and how it's set up
3. **Trace data flow** - Follow from test setup → service calls → component rendering
4. **Check configuration** - Verify CSV files, mock data, props
5. **Identify mismatch** - Find where expectation diverges from implementation

**TEST problem indicators:**
- Mock missing required properties
- Missing provider wrappers
- Wrong selectors (looking for "10d" when renders "Elapsed: 10d")
- Test expectations don't match documented architecture

**CODE problem indicators:**
- Test setup is correct and complete
- Config/CSV data exists as expected
- Code behavior violates stated architecture
- Feature doesn't work despite proper test setup

---

## Confidence Levels Explained

- **100%**: Smoking gun evidence (missing prop, wrong selector, explicit error)
- **90%**: Clear data flow shows bug location
- **85%**: Multiple evidence points, small uncertainty about exact line
- **80%**: E2E test - could be integration issue vs single bug
- **95%**: No errors shown, likely passing

---

## Previous Analysis Mistakes

**What I got wrong initially:**
1. ❌ Said NextStepButton was TEST problem - actually CODE problem
2. ❌ Didn't recognize architecture violation (green vs blue buttons)
3. ❌ Made assumptions without reading implementation thoroughly

**What I learned:**
- Always read BOTH test AND implementation code completely
- Understand architectural patterns before judging
- Trust E2E tests more than assumptions about "should work"
