#!/bin/bash
# This script runs all tests sequentially to avoid the Jest runner hanging issue.
# Modified to run all tests regardless of failures.

echo "Running all test suites sequentially..."
echo "---"

# E2E Tests
echo "Running 1/21: tests/E2E-01_HappyPath.test.ts"
npx jest tests/E2E-01_HappyPath.test.ts
echo "---"

echo "Running 2/21: tests/E2E-02_ComplexCard.test.ts"
npx jest tests/E2E-02_ComplexCard.test.ts
echo "---"

echo "Running 3/21: tests/E2E-03_ComplexSpace.test.ts"
npx jest tests/E2E-03_ComplexSpace.test.ts
echo "---"

echo "Running 4/21: tests/E2E-04_EdgeCases.test.ts"
npx jest tests/E2E-04_EdgeCases.test.ts
echo "---"

echo "Running 5/21: tests/E2E-04_SpaceTryAgain.test.ts"
npx jest tests/E2E-04_SpaceTryAgain.test.ts
echo "---"

# Service Tests
echo "Running 6/21: tests/services/CardService.test.ts"
npx jest tests/services/CardService.test.ts
echo "---"

echo "Running 7/21: tests/services/DataService.test.ts"
npx jest tests/services/DataService.test.ts
echo "---"

echo "Running 8/21: tests/services/GameRulesService.test.ts"
npx jest tests/services/GameRulesService.test.ts
echo "---"

echo "Running 9/21: tests/services/MovementService.test.ts"
npx jest tests/services/MovementService.test.ts
echo "---"

echo "Running 10/21: tests/services/PlayerActionService.test.ts"
npx jest tests/services/PlayerActionService.test.ts
echo "---"

echo "Running 11/21: tests/services/StateService.test.ts"
npx jest tests/services/StateService.test.ts
echo "---"

echo "Running 12/21: tests/services/TurnService.test.ts"
npx jest tests/services/TurnService.test.ts
echo "---"

echo "Running 13/21: tests/services/TurnService-tryAgainOnSpace.test.ts"
npx jest tests/services/TurnService-tryAgainOnSpace.test.ts
echo "---"

# Component Tests
echo "Running 14/21: tests/components/game/DiceRoller.test.tsx"
npx jest tests/components/game/DiceRoller.test.tsx
echo "---"

echo "Running 15/21: tests/components/game/MovementPathVisualization.test.tsx"
npx jest tests/components/game/MovementPathVisualization.test.tsx
echo "---"

echo "Running 16/21: tests/components/game/SpaceExplorerPanel.test.tsx"
npx jest tests/components/game/SpaceExplorerPanel.test.tsx
echo "---"

echo "Running 17/21: tests/components/modals/CardActions.test.tsx"
npx jest tests/components/modals/CardActions.test.tsx
echo "---"

echo "Running 18/21: tests/components/modals/CardReplacementModal.test.tsx"
npx jest tests/components/modals/CardReplacementModal.test.tsx
echo "---"

echo "Running 19/21: tests/components/modals/DiceResultModal.test.tsx"
npx jest tests/components/modals/DiceResultModal.test.tsx
echo "---"

echo "Running 20/21: tests/components/modals/EndGameModal.test.tsx"
npx jest tests/components/modals/EndGameModal.test.tsx
echo "---"

# Utility Tests
echo "Running 21/21: tests/utils/FormatUtils.test.ts"
npx jest tests/utils/FormatUtils.test.ts
echo "---"

echo "✅ All test suites have been executed."