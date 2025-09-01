#!/bin/bash
# This script runs all passing tests sequentially to avoid the Jest runner hanging issue.

echo "Running all passing test suites sequentially..."
echo "---"

# Note: Excluding E2E-04 (empty) for now.

echo "Running 1/12: tests/services/TurnService-performNegotiation.test.ts"
npx jest tests/services/TurnService-performNegotiation.test.ts || exit 1
echo "---"

echo "Running 2/12: tests/E2E-03_ComplexSpace.test.ts"
npx jest tests/E2E-03_ComplexSpace.test.ts || exit 1
echo "---"

echo "Running 3/12: tests/E2E-01_HappyPath.test.ts"
npx jest tests/E2E-01_HappyPath.test.ts || exit 1
echo "---"

echo "Running 4/12: tests/E2E-02_ComplexCard.test.ts"
npx jest tests/E2E-02_ComplexCard.test.ts || exit 1
echo "---"

echo "Running 5/12: tests/services/CardService.test.ts"
npx jest tests/services/CardService.test.ts || exit 1
echo "---"

echo "Running 6/12: tests/services/StateService.test.ts"
npx jest tests/services/StateService.test.ts || exit 1
echo "---"

echo "Running 7/12: tests/services/DataService.test.ts"
npx jest tests/services/DataService.test.ts || exit 1
echo "---"

echo "Running 8/12: tests/services/MovementService.test.ts"
npx jest tests/services/MovementService.test.ts || exit 1
echo "---"

echo "Running 9/12: tests/services/PlayerActionService.test.ts"
npx jest tests/services/PlayerActionService.test.ts || exit 1
echo "---"

echo "Running 10/12: tests/services/GameRulesService.test.ts"
npx jest tests/services/GameRulesService.test.ts || exit 1
echo "---"

echo "Running 11/12: tests/services/TurnService.test.ts"
npx jest tests/services/TurnService.test.ts || exit 1
echo "---"

echo "Running 12/12: tests/utils/FormatUtils.test.ts"
npx jest tests/utils/FormatUtils.test.ts || exit 1
echo "---"

echo "✅ All passing tests completed successfully."