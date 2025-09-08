#!/bin/bash

# Script to fix TypeScript color syntax errors in React components

echo "Fixing color syntax errors..."

# List of all files to fix
files=(
  "src/components/debug/PlayerDebug.tsx"
  "src/components/game/CardPortfolioDashboard.tsx"
  "src/components/game/DiceRoller.tsx"
  "src/components/game/FinancialStatusDisplay.tsx"
  "src/components/game/GameLog.tsx"
  "src/components/game/GameSpace.tsx"
  "src/components/game/MovementPathVisualization.tsx"
  "src/components/game/PlayerStatusItem.tsx"
  "src/components/game/PlayerStatusPanel.tsx"
  "src/components/game/ProjectProgress.tsx"
  "src/components/game/SpaceExplorerPanel.tsx"
  "src/components/game/TurnControls.tsx"
  "src/components/game/TurnControlsWithActions.tsx"
  "src/components/layout/GameLayout.tsx"
  "src/components/modals/CardActions.tsx"
  "src/components/modals/CardContent.tsx"
  "src/components/modals/CardDetailsModal.tsx"
  "src/components/modals/CardModal.tsx"
  "src/components/modals/CardReplacementModal.tsx"
  "src/components/modals/ChoiceModal.tsx"
  "src/components/modals/DiceResultModal.tsx"
  "src/components/modals/DiscardedCardsModal.tsx"
  "src/components/modals/EndGameModal.tsx"
  "src/components/modals/NegotiationModal.tsx"
  "src/components/modals/RulesModal.tsx"
  "src/components/setup/PlayerForm.tsx"
  "src/components/setup/PlayerList.tsx"
  "src/components/setup/PlayerSetup.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Fix malformed template literals - colors.property.subproperty' -> colors.property.subproperty
    sed -i "s/colors\.\([a-zA-Z_]*\)\.\([a-zA-Z_]*\)'/colors.\1.\2/g" "$file"
    
    # Fix duplicate colors.colors.* -> colors.*
    sed -i "s/colors\.colors\./colors./g" "$file"
    
    # Fix malformed template literals with backticks - missing ${}
    sed -i "s/border: '\([^']*\)colors\.\([a-zA-Z_]*\)\.\([a-zA-Z_]*\)\([^']*\)'/border: \`\1\${colors.\2.\3}\4\`/g" "$file"
    sed -i "s/backgroundColor: '\([^']*\)colors\.\([a-zA-Z_]*\)\.\([a-zA-Z_]*\)\([^']*\)'/backgroundColor: \`\1\${colors.\2.\3}\4\`/g" "$file"
    sed -i "s/color: '\([^']*\)colors\.\([a-zA-Z_]*\)\.\([a-zA-Z_]*\)\([^']*\)'/color: \`\1\${colors.\2.\3}\4\`/g" "$file"
    
    # Fix trailing quotes after commas - colors.property.subproperty', -> colors.property.subproperty,
    sed -i "s/colors\.\([a-zA-Z_]*\)\.\([a-zA-Z_]*\)',/colors.\1.\2,/g" "$file"
    
    # Fix standalone template literals ending with }` -> `
    sed -i "s/\}'/}/g" "$file"
    sed -i "s/\}`/}/g" "$file"
    
    # Fix trailing quotes in strings - colors.property.subproperty'}
    sed -i "s/colors\.\([a-zA-Z_]*\)\.\([a-zA-Z_]*\)'\}/colors.\1.\2}/g" "$file"
    
    echo "  Fixed: $file"
  else
    echo "  Warning: File not found: $file"
  fi
done

echo "All fixes completed!"