# Test Results - Individual File Execution

**Date**: 2025-11-08
**Total Test Files**: 61
**Passed**: 52 (85.2%)
**Failed**: 9 (14.8%)

## Summary

All 61 test files were run separately to identify which ones pass or fail in isolation. The results show that 52 test files pass completely when run individually, while 9 test files have failing tests.

## Passed Test Files (52)

✅ tests/E2E-02_ComplexCard.test.ts
✅ tests/E066-simple.test.ts
✅ tests/E066-reroll-integration.test.ts
✅ tests/E012-integration.test.ts
✅ tests/E2E-Lightweight.test.ts
✅ tests/E2E-05_MultiPlayerEffects.test.ts
✅ tests/E2E-04_EdgeCases.test.ts
✅ tests/P1_AutomaticFunding_Fix.test.ts
✅ tests/components/NegotiationModal.test.tsx
✅ tests/components/TurnControlsWithActions.test.tsx
✅ tests/components/ChoiceModal.test.tsx
✅ tests/components/game/DiceRoller.test.tsx
✅ tests/components/game/MovementPathVisualization.test.tsx
✅ tests/components/game/CardPortfolioDashboard.test.tsx
✅ tests/components/modals/CardReplacementModal.test.tsx
✅ tests/components/modals/CardActions.test.tsx
✅ tests/components/modals/EndGameModal.test.tsx
✅ tests/components/modals/DiscardedCardsModal.test.tsx
✅ tests/components/player/CardsSection.test.tsx
✅ tests/components/player/CurrentCardSection.test.tsx
✅ tests/components/player/FinancesSection.test.tsx
✅ tests/components/player/ExpandableSection.test.tsx
✅ tests/features/ManualFunding.test.ts
✅ tests/components/player/PlayerPanel.test.tsx
✅ tests/isolated/utils.test.ts
✅ tests/isolated/gameLogic.test.ts
✅ tests/performance/LoadTimeOptimization.test.ts
✅ tests/services/DataService.test.ts
✅ tests/services/ChoiceService.test.ts
✅ tests/services/ActionSequenceRegression.test.ts
✅ tests/services/CardService.test.ts
✅ tests/services/GameLogRegression.test.ts
✅ tests/services/EffectEngineService.test.ts
✅ tests/services/DurationEffects.test.ts
✅ tests/services/MovementService.test.ts
✅ tests/services/NegotiationService.test.ts
✅ tests/services/LoggingService.test.ts
✅ tests/services/GameRulesService.test.ts
✅ tests/services/PlayerActionService.test.ts
✅ tests/services/ResourceService.test.ts
✅ tests/services/NotificationService.test.ts
✅ tests/services/TargetingService.test.ts
✅ tests/services/TransactionalLogging.test.ts
✅ tests/services/SpaceProgressionRegression.test.ts
✅ tests/services/StateService.test.ts
✅ tests/utils/EffectFactory.test.ts
✅ tests/services/TurnService.test.ts
✅ tests/services/TurnService-tryAgainOnSpace.test.ts
✅ tests/utils/actionLogFormatting.test.ts
✅ tests/utils/NotificationUtils.test.ts
✅ tests/utils/buttonFormatting.test.ts
✅ tests/utils/FormatUtils.test.ts

## Failed Test Files (9)

### 1. ❌ tests/E2E-01_HappyPath.test.ts
**Error**: `AssertionError: expected 0 to be greater than 0`
**Location**: tests/E2E-01_HappyPath.test.ts:123:37
**Issue**: Player hand is empty when it should contain cards after drawing
**Expected**: Player hand should have E and B type cards
**Actual**: hand.length = 0

### 2. ❌ tests/E2E-04_SpaceTryAgain.test.ts
**Error**: `AssertionError: expected false to be true`
**Location**: tests/E2E-04_SpaceTryAgain.test.ts:111:28
**Issue**: tryAgainOnSpace returns success: false instead of true
**Expected**: result.success = true
**Actual**: result.success = false

### 3. ❌ tests/E2E-03_ComplexSpace.test.ts
**Error**: Multiple failures
1. `AssertionError: expected false to be true` at line 135:28
   - tryAgainOnSpace fails to execute properly
2. Negotiation capability detection fails
**Issue**: "Try Again" functionality not working and negotiation detection broken

### 4. ❌ tests/components/CardDetailsModal.test.tsx
**Error**: `TestingLibraryElementError: Unable to find an element with the text: 🔄 Transfer Card`
**Issue**: Component not rendering the "Transfer Card" button
**Affected Tests**:
- should call notificationService.notify on successful card transfer
- should call notificationService.notify on failed card transfer

### 5. ❌ tests/components/game/SpaceExplorerPanel.test.tsx
**Error**: Component rendering or interaction issue
**Issue**: Test failures related to SpaceExplorerPanel component

### 6. ❌ tests/components/modals/DiceResultModal.test.tsx
**Error**: Modal rendering or interaction issue
**Issue**: Test failures related to DiceResultModal component

### 7. ❌ tests/components/player/NextStepButton.test.tsx
**Error**: Button component issue
**Issue**: Test failures related to NextStepButton component

### 8. ❌ tests/features/E2E-MultiPathMovement.test.tsx
**Error**: Multi-path movement logic issue
**Issue**: End-to-end test for multi-path movement failing

### 9. ❌ tests/components/player/TimeSection.test.tsx
**Error**: TimeSection component issue
**Issue**: Test failures related to TimeSection component rendering or logic

## Analysis

### Categories of Failures

1. **E2E Test Logic Issues (3 files)**
   - Card drawing not working properly
   - "Try Again" functionality broken
   - Negotiation detection not working

2. **Component Rendering Issues (6 files)**
   - Missing UI elements (Transfer Card button)
   - Component state or prop handling issues
   - Potential issues with test setup or mocking

### Potential Root Causes

1. **Service Integration**: Tests failing suggest issues with:
   - Card drawing service
   - Try Again functionality in TurnService
   - Negotiation detection logic

2. **Component Props/State**: UI component tests failing suggest:
   - Props not being passed correctly
   - Component state not updating as expected
   - Conditional rendering logic issues

### Recommendations

1. **Priority 1**: Fix the "Try Again" functionality (affects 2 E2E tests)
2. **Priority 2**: Fix card drawing logic (affects E2E-01 HappyPath)
3. **Priority 3**: Investigate component rendering issues (6 component tests)
4. **Priority 4**: Review test setup and mocking strategies

## Conclusion

85.2% of test files pass when run individually, demonstrating that the majority of the codebase is working correctly. The 9 failing tests appear to be concentrated around specific features (Try Again, card drawing) and component rendering issues that need investigation.
