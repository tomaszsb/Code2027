# Test Failure Analysis: Code vs Test Issues

## Summary

Out of 9 failing test files, analysis shows:
- **4 are TEST PROBLEMS** (incorrect test setup/expectations)
- **3 are CODE PROBLEMS** (implementation bugs)
- **2 are AMBIGUOUS** (need deeper investigation)

---

## Detailed Analysis

### 1. tests/E2E-01_HappyPath.test.ts ❓ AMBIGUOUS (likely CODE PROBLEM)

**Error**: `expected 0 to be greater than 0` - Player hand is empty after drawing cards

**Evidence**:
- Test calls: `turnService.triggerManualEffectWithFeedback(player.id, 'cards')`
- CSV data shows OWNER-SCOPE-INITIATION has manual cards effect: `cards,draw_E,Draw 3`
- Code path exists in TurnService.triggerManualEffect() to handle card drawing
- BUT cards aren't actually being drawn

**Verdict**: **Likely CODE PROBLEM**

**How I know**:
1. The test setup appears correct - it's calling the right method with valid parameters
2. The CSV configuration exists for this manual effect
3. The code should draw cards based on the implementation
4. The fact that cards aren't drawn suggests a bug in the card drawing logic, possibly in `applySpaceCardEffect()` or a missing CardService integration
5. Similar tests for other features work, suggesting the test framework is sound

**Root cause hypothesis**: The CardService may not be properly wired or `applySpaceCardEffect()` has a bug

---

### 2. tests/E2E-04_SpaceTryAgain.test.ts ❓ AMBIGUOUS (likely CODE PROBLEM)

**Error**: `expected false to be true` - tryAgainOnSpace returns success: false

**Evidence**:
- Test correctly saves snapshot: `stateService.savePreSpaceEffectSnapshot(playerA.id, 'OWNER-SCOPE-INITIATION')`
- CSV data shows OWNER-SCOPE-INITIATION First visit has `can_negotiate: YES`
- Code checks multiple conditions: game initialized, snapshot exists, space allows negotiation
- One of these checks is failing

**Verdict**: **Likely CODE PROBLEM**

**How I know**:
1. Test setup includes proper snapshot saving (line 102)
2. CSV configuration has can_negotiate=YES for this space
3. The implementation has 3 failure points:
   - `!this.stateService.isInitialized()` returns false
   - `!this.stateService.hasPreSpaceEffectSnapshot()` returns false
   - `!spaceContent.can_negotiate` returns false
4. Since the test saves a snapshot and CSV has the flag, one of these checks is buggy
5. Most likely issue: CSV parsing or the `isInitialized()` check

**Root cause hypothesis**: Either game initialization state management is broken OR CSV parsing of can_negotiate field is incorrect

---

### 3. tests/E2E-03_ComplexSpace.test.ts - Same as #2

**Verdict**: **CODE PROBLEM** (same root cause as E2E-04_SpaceTryAgain)

---

### 4. tests/components/CardDetailsModal.test.tsx ✅ TEST PROBLEM

**Error**: `Unable to find an element with the text: 🔄 Transfer Card`

**Evidence**:
- Component code (line 524): `{canTransferCard() && !showTransferUI && (`
- `canTransferCard()` function (line 45-53) checks: `if (!card.is_transferable) return false;`
- Test mock card (line 83-90):
```javascript
mockTransferableCard = {
  card_id: 'E001',
  card_name: 'Permit Expeditor',
  card_type: 'E',
  description: 'Expedites permit processing',
  effects_on_play: 'time:-2',
  cost: 200
  // ❌ Missing: is_transferable: true
};
```

**Verdict**: **TEST PROBLEM**

**How I know**:
1. Component code explicitly checks for `card.is_transferable` property
2. Mock card object in test does NOT include this property
3. Component is behaving correctly by NOT showing transfer button for non-transferable cards
4. Test expects button to appear but didn't set up the prerequisite property

**Fix needed**: Add `is_transferable: true` to mockTransferableCard in test setup

---

### 5. tests/components/game/SpaceExplorerPanel.test.tsx ❓ NEEDS INVESTIGATION

**Error**: Unknown (background process still running)

**Verdict**: **AMBIGUOUS** - Need to see full error details

---

### 6. tests/components/modals/DiceResultModal.test.tsx ❓ NEEDS INVESTIGATION

**Error**: Unknown

**Verdict**: **AMBIGUOUS** - Need to see full error details

---

### 7. tests/components/player/NextStepButton.test.tsx ✅ TEST PROBLEM

**Error**: `Unable to find an element with the text: End Turn` - Component shows "Roll to Move" instead

**Evidence from failures**:
- Test expects: `"End Turn"` or `"End Turn (2 actions remaining)"`
- Component renders: `"Roll to Move"`
- Multiple tests (11 failed, 11 passed = 22 total)
- All failures expect "End Turn" state but component is in "Roll to Move" state

**Verdict**: **TEST PROBLEM**

**How I know**:
1. Component is rendering "Roll to Move" which is a valid state (player hasn't rolled dice yet)
2. Tests are setting up game state expecting "End Turn" button to appear
3. The component behavior is internally consistent - showing correct button for game state
4. The issue is that test mocks aren't properly setting the game state to the "end turn" phase
5. Game flow: Roll Dice → Process Effects → Do Actions → End Turn
6. Tests skip to expecting "End Turn" without properly advancing through earlier phases

**Fix needed**: Test setup must properly advance game state to the end-turn phase before expecting "End Turn" button

---

### 8. tests/features/E2E-MultiPathMovement.test.tsx ❓ NEEDS INVESTIGATION

**Error**: Multi-path movement logic issue

**Verdict**: **AMBIGUOUS** - Need full error details, but likely CODE PROBLEM given it's E2E test

---

### 9. tests/components/player/TimeSection.test.tsx ✅ TEST or COMPONENT PROBLEM

**Error**: `Unable to find an element with the text: 10d`

**Evidence**:
- Test expects to find "10d" text (10 days formatted)
- Component renders but doesn't show expected time format
- Could be formatting issue or render issue

**Verdict**: **Likely TEST PROBLEM** (incorrect selector or timing issue)

**How I know**:
1. Time rendering is a basic feature that likely works in actual app
2. The test may be looking for text before component fully renders
3. Or the time formatting function returns different format than expected
4. Need to check if test uses proper async waiting or if component uses different format

**Possibilities**:
- Test needs `await` for async rendering
- Component formats as "10 days" instead of "10d"
- Test selector is wrong

---

## Summary Table

| Test File | Verdict | Confidence | Issue Type |
|-----------|---------|------------|------------|
| E2E-01_HappyPath | CODE PROBLEM | 75% | Card drawing not working |
| E2E-04_SpaceTryAgain | CODE PROBLEM | 70% | Try Again initialization/negotiation check |
| E2E-03_ComplexSpace | CODE PROBLEM | 70% | Same as E2E-04 |
| CardDetailsModal | TEST PROBLEM | 100% | Missing `is_transferable` in mock |
| SpaceExplorerPanel | AMBIGUOUS | N/A | Need error details |
| DiceResultModal | AMBIGUOUS | N/A | Need error details |
| NextStepButton | TEST PROBLEM | 95% | Wrong game state in test setup |
| E2E-MultiPathMovement | AMBIGUOUS | 60% | Likely code, need details |
| TimeSection | TEST PROBLEM | 80% | Wrong selector or timing |

---

## Recommendations

### Immediate Fixes Needed (Test Problems)

1. **CardDetailsModal.test.tsx**: Add `is_transferable: true` to mock card
2. **NextStepButton.test.tsx**: Fix test setup to properly advance game state
3. **TimeSection.test.tsx**: Check time format and add proper async waiting

### Investigate & Fix (Code Problems)

1. **E2E-01_HappyPath**: Debug `applySpaceCardEffect()` and CardService integration
2. **E2E-04 & E2E-03**: Debug Try Again functionality:
   - Check `isInitialized()` implementation
   - Verify CSV can_negotiate parsing
   - Validate snapshot retrieval

### Need More Info

1. **SpaceExplorerPanel**: Get full error output
2. **DiceResultModal**: Get full error output
3. **E2E-MultiPathMovement**: Get full error output

---

## Methodology

To determine if an issue is a test problem or code problem, I:

1. **Read the test code** - Understand what it's testing and how it sets up mocks
2. **Read the implementation code** - See what the actual component/service does
3. **Check the error message** - Identify what's expected vs actual
4. **Trace the logic** - Follow code paths to find where behavior diverges
5. **Look for mismatches** - Compare test expectations with code requirements

**Test Problem indicators**:
- Mock data missing required properties
- Test expects state without proper setup
- Test selector doesn't match actual rendered output
- Other similar tests pass with proper setup

**Code Problem indicators**:
- Test setup appears correct and complete
- CSV/config data exists as expected
- Code path exists but produces wrong result
- Feature doesn't work despite proper test configuration
