# 🎲 Conditional Effects Parsing Patterns

## Overview

This document details the parsing patterns and implementation for conditional effects in the Code2027 game system. Conditional effects enable cards with dice roll-based mechanics like "Roll a die. On 1-3, do X. On 4-6, do Y."

## Architecture Components

### 1. Effect Type Definition
```typescript
// src/types/EffectTypes.ts
export type Effect = 
  // ... other effect types
  | {
      effectType: 'CONDITIONAL_EFFECT';
      payload: {
        playerId: string;
        condition: {
          type: 'DICE_ROLL'; // Future: could support other condition types
          ranges: Array<{
            min: number; // Minimum dice roll value (inclusive)
            max: number; // Maximum dice roll value (inclusive)
            effects: Effect[]; // Effects to execute if roll is in range
          }>;
        };
        source?: string;
        reason?: string;
      };
    };
```

### 2. Context Enhancement
```typescript
// src/types/EffectTypes.ts
export interface EffectContext {
  source: string;
  playerId?: string;
  triggerEvent?: 'CARD_PLAY' | 'SPACE_ENTRY' | 'DICE_ROLL' | 'TURN_START' | 'TURN_END';
  diceRoll?: number; // Required for CONDITIONAL_EFFECT processing
  metadata?: Record<string, any>;
}
```

## Parsing Implementation

### 1. Main Parsing Method
Located in `src/utils/EffectFactory.ts`:

```typescript
private parseConditionalEffect(card: any, playerId: string): Effect | null {
  const description = card.description || '';
  
  // Match pattern: "Roll a die. On X-Y [effect]. On Z-W [effect]."
  const dicePattern = /Roll a die\./i;
  if (!dicePattern.test(description)) {
    return null;
  }
  
  // Extract all conditional ranges and their effects
  const rangePattern = /On (\d+)-(\d+)\s+([^.]+)\./g;
  const ranges: Array<{ min: number; max: number; effects: Effect[] }> = [];
  
  let match;
  while ((match = rangePattern.exec(description)) !== null) {
    const min = parseInt(match[1], 10);
    const max = parseInt(match[2], 10);
    const effectText = match[3].trim();
    
    // Parse the effect text into actual effects
    const effects = this.parseConditionalEffectText(effectText, playerId, card);
    
    ranges.push({ min, max, effects });
  }
  
  if (ranges.length === 0) {
    return null; // No valid conditional ranges found
  }
  
  return {
    effectType: 'CONDITIONAL_EFFECT',
    payload: {
      playerId,
      condition: {
        type: 'DICE_ROLL',
        ranges
      },
      source: `Card: ${card.name}`,
      reason: `Conditional effect based on dice roll`
    }
  };
}
```

### 2. Effect Text Parsing
```typescript
private parseConditionalEffectText(effectText: string, playerId: string, card: any): Effect[] {
  // Handle "no effect" cases
  if (/no effect/i.test(effectText)) {
    return []; // Return empty effects array
  }
  
  const effects: Effect[] = [];
  const cardSource = `Card: ${card.name}`;
  
  // Parse time-related effects
  if (/increase.*time.*by (\d+)/i.test(effectText)) {
    const timeMatch = effectText.match(/increase.*time.*by (\d+)/i);
    if (timeMatch) {
      const timeAmount = parseInt(timeMatch[1], 10);
      effects.push({
        effectType: 'RESOURCE_CHANGE',
        payload: {
          playerId,
          resource: 'TIME',
          amount: timeAmount,
          source: cardSource,
          reason: `Conditional effect: ${effectText}`
        }
      });
    }
  }
  
  // Parse money-related effects
  if (/increase.*money.*by (\d+)/i.test(effectText) || /gain.*\$(\d+)/i.test(effectText)) {
    const moneyMatch = effectText.match(/increase.*money.*by (\d+)|gain.*\$(\d+)/i);
    if (moneyMatch) {
      const moneyAmount = parseInt(moneyMatch[1] || moneyMatch[2], 10);
      effects.push({
        effectType: 'RESOURCE_CHANGE',
        payload: {
          playerId,
          resource: 'MONEY',
          amount: moneyAmount,
          source: cardSource,
          reason: `Conditional effect: ${effectText}`
        }
      });
    }
  }
  
  // Parse negative effects (subtract money/time)
  if (/lose.*\$(\d+)/i.test(effectText) || /decrease.*money.*by (\d+)/i.test(effectText)) {
    const lossMatch = effectText.match(/lose.*\$(\d+)|decrease.*money.*by (\d+)/i);
    if (lossMatch) {
      const lossAmount = parseInt(lossMatch[1] || lossMatch[2], 10);
      effects.push({
        effectType: 'RESOURCE_CHANGE',
        payload: {
          playerId,
          resource: 'MONEY',
          amount: -lossAmount, // Negative amount for loss
          source: cardSource,
          reason: `Conditional effect: ${effectText}`
        }
      });
    }
  }
  
  return effects;
}
```

## Regex Patterns

### Primary Detection Pattern
```regex
/Roll a die\./i
```
- **Purpose**: Detect cards with dice-based conditional mechanics
- **Case Insensitive**: Matches "roll a die", "Roll A Die", etc.

### Range Extraction Pattern
```regex
/On (\d+)-(\d+)\s+([^.]+)\./g
```
- **Group 1**: `(\d+)` - Minimum dice value
- **Group 2**: `(\d+)` - Maximum dice value  
- **Group 3**: `([^.]+)` - Effect description text
- **Global Flag**: Extracts all conditional ranges from card text

### Effect Text Patterns
```regex
/no effect/i                           # "no effect" detection
/increase.*time.*by (\d+)/i           # Time increase: "increase filing time by 5"
/increase.*money.*by (\d+)/i          # Money increase: "increase money by 100"
/gain.*\$(\d+)/i                      # Money gain: "gain $50"
/lose.*\$(\d+)/i                      # Money loss: "lose $25"
/decrease.*money.*by (\d+)/i          # Money decrease: "decrease money by 30"
```

## Processing Flow

### 1. Factory Creation
1. `EffectFactory.createCardEffects()` called with card data
2. `parseConditionalEffect()` checks for dice pattern in description
3. Regex extracts all conditional ranges and effect texts
4. Each effect text parsed into structured `Effect` objects
5. Returns `CONDITIONAL_EFFECT` with structured ranges

### 2. Engine Processing
1. `EffectEngineService.processEffect()` receives `CONDITIONAL_EFFECT`
2. Checks `context.diceRoll` for dice value
3. Iterates through ranges to find matching dice roll
4. Executes effects for matching range via `processEffects()`
5. Returns success/failure result

### 3. Integration Points
```typescript
// In game logic, provide dice roll in context
const context: EffectContext = {
  source: 'Card Play',
  playerId: 'player1',
  diceRoll: Math.floor(Math.random() * 6) + 1, // 1-6 dice roll
  triggerEvent: 'CARD_PLAY'
};

const result = await effectEngineService.processEffect(conditionalEffect, context);
```

## Production Cards Enabled

### L-Series Cards (Labor/Legal)
- **L003**: "All players must discard 1 Expeditor card" (discard effect)
- **L005**: "Each opponent must discard 1 Expeditor card" (targeted discard)
- **L007**: "All opponents must discard 1 Expeditor card" (group discard)
- **L009**: "Roll a die. On 1-3 increase filing time by 5 ticks. On 4-6 no effect."
- **L011**: "Roll a die. On 1-2 gain $100. On 3-4 gain $50. On 5-6 no effect."

### E-Series Cards (Expeditor)
- **E002**: "Roll a die. On 1-4 gain $25. On 5-6 lose $10."
- **E004**: "Roll a die. On 1-3 no effect. On 4-6 gain $75."
- **E006**: "Roll a die. On 1-2 lose $50. On 3-6 gain $100."
- **E008**: "Roll a die. On 1-3 gain $50. On 4-6 gain $100."
- **E010**: "Roll a die. On 1-4 no effect. On 5-6 gain $150."

And 4 additional cards with conditional mechanics.

## Error Handling

### Validation Checks
1. **Dice Roll Required**: `context.diceRoll` must be provided
2. **Range Validation**: Dice value must fall within valid ranges
3. **Effect Parsing**: Invalid effect text logs warnings but continues
4. **Empty Effects**: "no effect" ranges return empty effects arrays

### Error Messages
```typescript
// Missing dice roll
return { success: false, effectType: 'CONDITIONAL_EFFECT', error: 'No dice roll provided' };

// No matching range (shouldn't happen with proper card design)
// Returns success: true with no effects executed
```

## Testing Patterns

### Unit Test Structure
```typescript
describe('Conditional Effects Parsing', () => {
  it('should parse L009 conditional effect correctly', () => {
    const card = {
      name: 'L009',
      description: 'Roll a die. On 1-3 increase filing time by 5 ticks. On 4-6 no effect.'
    };
    
    const effect = effectFactory.parseConditionalEffect(card, 'player1');
    
    expect(effect?.effectType).toBe('CONDITIONAL_EFFECT');
    expect(effect?.payload.condition.ranges).toHaveLength(2);
    expect(effect?.payload.condition.ranges[0]).toEqual({
      min: 1, max: 3,
      effects: [{ effectType: 'RESOURCE_CHANGE', payload: { resource: 'TIME', amount: 5 } }]
    });
    expect(effect?.payload.condition.ranges[1]).toEqual({
      min: 4, max: 6,
      effects: [] // "no effect"
    });
  });
});
```

## Future Extensibility

### Condition Types
The `condition.type` field currently supports only `'DICE_ROLL'` but can be extended:
```typescript
type ConditionType = 
  | 'DICE_ROLL'
  | 'CARD_COUNT'    // "If you have 3+ cards..."
  | 'RESOURCE_CHECK' // "If you have $100+..."
  | 'PLAYER_COUNT'   // "If 4+ players..."
```

### Complex Patterns
Future parsing could support:
- Multiple dice rolls: "Roll 2 dice..."
- Card-specific conditions: "If this is your 2nd Labor card..."
- Player state conditions: "If you are on a Legal space..."

---

*This document serves as the definitive guide for understanding and extending the conditional effects system in Code2027.*