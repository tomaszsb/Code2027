# Complex Card Mechanics Implementation Plan

## 🎯 Objective
Transform 95 complex cards from "data-only" to "fully functional" by implementing the missing game mechanics while maintaining clean service architecture.

## 📊 Current State Analysis

### Functional vs Broken Cards:
- ✅ **Basic Cards (309)**: Money, time, simple effects - WORKING
- ⚠️ **Complex Cards (95)**: Advanced mechanics - 60% BROKEN
- 🔥 **Critical Issues**: Turn skips, card draws, multi-player effects, duration effects

### Architecture Status:
- ✅ **Data Layer**: All 21 columns loaded correctly
- ✅ **Basic Logic**: tick_modifier, money_effect, loan_amount working
- ❌ **Advanced Logic**: 4 major systems missing

---

## 🗺️ IMPLEMENTATION ROADMAP

## PHASE 1: Turn Control System 🎮
**Timeline**: Week 1 (5 days)
**Priority**: CRITICAL - Breaks core gameplay
**Cards Fixed**: 8 turn skip cards (E029, E030, L014, etc.)

### 1.1 StateService Enhancement
**File**: `src/types/StateTypes.ts`
```typescript
// Add to Player interface
interface Player {
  // ... existing fields
  skipNextTurn?: boolean;
  skipCurrentTurn?: boolean;
  turnSkipSource?: string; // Which card caused the skip
}
```

**File**: `src/services/StateService.ts`
```typescript
// New methods
markPlayerSkipNextTurn(playerId: string, cardId: string): void
markPlayerSkipCurrentTurn(playerId: string, cardId: string): void  
isPlayerSkippingTurn(playerId: string): boolean
clearTurnSkipFlags(playerId: string): void
```

### 1.2 TurnService Enhancement
**File**: `src/services/TurnService.ts`
```typescript
// Enhanced turn advancement
advanceToNextPlayer(): void {
  // Check if current player should skip
  // Handle consecutive skips
  // Clear skip flags after processing
}

// New skip validation
canPlayerTakeTurn(playerId: string): boolean {
  // Check skip flags
  // Validate turn sequence
}
```

### 1.3 CardService Integration
**File**: `src/services/CardService.ts`
```typescript
// Replace TODO with actual implementation
if (card.turn_effect?.toLowerCase().includes('skip next turn')) {
  this.stateService.markPlayerSkipNextTurn(playerId, card.card_id);
  console.log(`${playerId} will skip their next turn due to ${card.card_name}`);
}

if (card.turn_effect?.toLowerCase().includes('skip this turn')) {
  this.stateService.markPlayerSkipCurrentTurn(playerId, card.card_id);
  console.log(`${playerId} is skipping their current turn due to ${card.card_name}`);
}
```

### 1.4 UI Updates
**File**: `src/components/game/TurnControls.tsx`
- Show skip turn indicators
- Display skip reason ("Due to Weekend Work card")
- Auto-advance through skipped turns

**Testing**: E029, E030, L014 turn skips work correctly

---

## PHASE 2: Card Interaction System 🎴
**Timeline**: Week 2 (5 days)  
**Priority**: HIGH - Many cards use draw/discard
**Cards Fixed**: 20+ draw/discard cards

### 2.1 CardService Draw/Discard Logic
**File**: `src/services/CardService.ts`
```typescript
// New card interaction methods
drawCardsForPlayer(playerId: string, cardType: string, count: number): string[] {
  // Generate dynamic card IDs
  // Add to player's available cards
  // Log the draw action
  // Return drawn card IDs
}

discardCardsFromPlayer(playerId: string, cardType: string, count: number): string[] {
  // Remove from player's available cards  
  // Add to discarded cards
  // Handle insufficient cards case
  // Return discarded card IDs
}

replacePlayerCards(playerId: string, discardType: string, drawType: string, count: number): void {
  // Combine discard + draw operations
  // Ensure atomic operation
  // Update player state once
}
```

### 2.2 Enhanced Card Effect Processing
**File**: `src/services/CardService.ts`
```typescript
// Replace TODO with actual implementation  
if (card.draw_cards) {
  const [count, cardType] = this.parseCardEffect(card.draw_cards);
  const drawnCards = this.drawCardsForPlayer(playerId, cardType, count);
  console.log(`${playerId} drew ${count} ${cardType} cards: ${drawnCards.join(', ')}`);
}

if (card.discard_cards) {
  const [count, cardType] = this.parseCardEffect(card.discard_cards);
  const discardedCards = this.discardCardsFromPlayer(playerId, cardType, count);
  console.log(`${playerId} discarded ${count} ${cardType} cards: ${discardedCards.join(', ')}`);
}

// New parsing method
parseCardEffect(effectString: string): [number, string] {
  // Parse "1 Expeditor Card" -> [1, "E"]
  // Parse "2 E" -> [2, "E"] 
  // Handle edge cases
}
```

### 2.3 Card Type Mapping
**File**: `src/utils/CardUtils.ts` (new file)
```typescript
export const CARD_TYPE_MAPPINGS = {
  'Expeditor': 'E',
  'Expeditor Card': 'E',
  'E': 'E',
  'Work': 'W',
  'Work Card': 'W', 
  'Bank': 'B',
  'Life': 'L',
  'Investment': 'I'
};

export function parseCardType(typeString: string): string {
  // Normalize card type strings
  // Handle variations and plurals
}
```

**Testing**: L005, L007, L024, L003 draw/discard effects work

---

## PHASE 3: Multi-Player Targeting 🎯
**Timeline**: Week 3 (5 days)
**Priority**: MEDIUM - Affects player interaction
**Cards Fixed**: 15+ multi-player cards

### 3.1 New TargetingService
**File**: `src/services/TargetingService.ts` (new)
```typescript
export interface TargetingService {
  // Player selection
  promptPlayerChoice(playerId: string, availableTargets: string[], reason: string): Promise<string>;
  
  // Effect application
  applyEffectToAllPlayers(effect: CardEffect, excludePlayer?: string): void;
  applyEffectToChosenPlayer(sourcePlayer: string, targetPlayer: string, effect: CardEffect): void;
  applyEffectToMultiplePlayers(targetPlayers: string[], effect: CardEffect): void;
  
  // Targeting validation
  getValidTargets(playerId: string, targetType: string): string[];
  canTargetPlayer(sourcePlayer: string, targetPlayer: string): boolean;
}

export class TargetingService implements ITargetingService {
  constructor(
    private stateService: IStateService,
    private cardService: ICardService
  ) {}
  
  // Implementation methods...
}
```

### 3.2 Enhanced CardService Integration  
**File**: `src/services/CardService.ts`
```typescript
// Add TargetingService dependency
constructor(
  private dataService: IDataService, 
  private stateService: IStateService,
  private targetingService: ITargetingService // NEW
) {}

// Enhanced effect application
private async applyCardEffects(playerId: string, cardId: string): Promise<GameState> {
  const card = this.dataService.getCardById(cardId);
  
  // Handle targeting
  if (card.target === 'All Players') {
    await this.targetingService.applyEffectToAllPlayers({
      type: 'tick_modifier',
      value: card.tick_modifier,
      source: card.card_id
    }, card.scope === 'Single' ? playerId : undefined);
  }
  
  if (card.target === 'Choose Player' || card.target === 'Choose Opponent') {
    const targetId = await this.targetingService.promptPlayerChoice(
      playerId, 
      this.targetingService.getValidTargets(playerId, card.target),
      `Choose target for ${card.card_name}`
    );
    await this.targetingService.applyEffectToChosenPlayer(playerId, targetId, {
      type: 'tick_modifier', 
      value: card.tick_modifier,
      source: card.card_id
    });
  }
}
```

### 3.3 UI Component for Player Selection
**File**: `src/components/modals/PlayerSelectionModal.tsx` (new)
```typescript
interface PlayerSelectionModalProps {
  isOpen: boolean;
  sourcePlayer: Player;
  availableTargets: Player[];
  reason: string;
  onPlayerSelected: (playerId: string) => void;
  onCancel: () => void;
}

export function PlayerSelectionModal({ ... }: PlayerSelectionModalProps): JSX.Element {
  // Interactive player selection UI
  // Show player avatars and names
  // Highlight valid targets
  // Confirmation buttons
}
```

**Testing**: L002, L003, E009 multi-player effects work

---

## PHASE 4: Duration Effects ⏰
**Timeline**: Week 4 (5 days)
**Priority**: MEDIUM - Adds strategic depth  
**Cards Fixed**: 12+ duration-based cards

### 4.1 Active Effects System
**File**: `src/types/StateTypes.ts`
```typescript
interface ActiveEffect {
  id: string;
  cardId: string;
  sourcePlayerId: string;
  effectType: 'tick_modifier' | 'money_effect' | 'card_draw';
  effectValue: any;
  affectedPlayerIds: string[];
  remainingTurns: number;
  activatedTurn: number;
  description: string;
}

interface GameState {
  // ... existing fields
  activeEffects: ActiveEffect[];
}
```

### 4.2 StateService Duration Management
**File**: `src/services/StateService.ts`
```typescript
// New duration effect methods
addActiveEffect(effect: Omit<ActiveEffect, 'id'>): void {
  // Generate unique effect ID
  // Add to game state
  // Log effect activation
}

processEndOfTurnEffects(): void {
  // Decrement remaining turns
  // Remove expired effects  
  // Apply ongoing effects
  // Log effect changes
}

getActiveEffectsForPlayer(playerId: string): ActiveEffect[] {
  // Filter effects affecting player
  // Sort by activation order
}

removeActiveEffect(effectId: string): void {
  // Remove from game state
  // Log effect removal
}
```

### 4.3 TurnService Integration
**File**: `src/services/TurnService.ts`
```typescript
// Enhanced turn end processing
endTurn(playerId: string): TurnResult {
  // ... existing turn logic
  
  // Process duration effects BEFORE advancing turn
  this.stateService.processEndOfTurnEffects();
  
  // ... continue with turn advancement
}
```

### 4.4 CardService Duration Integration
**File**: `src/services/CardService.ts`
```typescript
// Enhanced duration handling
if (card.duration === 'Turns' && card.duration_count) {
  const turns = parseInt(card.duration_count);
  if (turns > 0) {
    this.stateService.addActiveEffect({
      cardId: card.card_id,
      sourcePlayerId: playerId,
      effectType: 'tick_modifier',
      effectValue: card.tick_modifier,
      affectedPlayerIds: this.getAffectedPlayers(card.target, playerId),
      remainingTurns: turns,
      activatedTurn: this.stateService.getGameState().turnCount,
      description: `${card.card_name}: ${card.description}`
    });
  }
}
```

**Testing**: L002, L004, L018, L020 duration effects persist correctly

---

## 🚀 IMPLEMENTATION STRATEGY

### Development Approach:
1. **Service-First**: Build core logic in services before UI
2. **Incremental**: Test each phase thoroughly before moving to next  
3. **Backward Compatible**: Ensure existing simple cards continue working
4. **Event-Driven**: Use existing event patterns for UI updates

### Testing Strategy:
1. **Unit Tests**: Each new service method has comprehensive tests
2. **Integration Tests**: Card effects work end-to-end
3. **Regression Tests**: Existing functionality remains intact
4. **Game Flow Tests**: Complete turn sequences with complex cards

### Risk Mitigation:
1. **Feature Flags**: Toggle complex mechanics on/off during development
2. **Rollback Plan**: Can disable expanded mechanics if issues arise
3. **Gradual Rollout**: Enable one card type at a time
4. **Comprehensive Logging**: Track all effect applications for debugging

## 📈 SUCCESS METRICS

### Phase Completion Criteria:
- **Phase 1**: All 8 turn skip cards function correctly, no turn sequence bugs
- **Phase 2**: All 20+ draw/discard cards work, card counts update properly  
- **Phase 3**: All 15+ multi-player cards apply effects to correct targets
- **Phase 4**: All 12+ duration cards persist across multiple turns

### Final Success Target:
- **90%+ Complex Cards Functional** (85+ out of 95 cards)
- **Zero Regressions** in existing simple card functionality
- **Clean Architecture Maintained** with proper service separation
- **Comprehensive Test Coverage** for all new functionality

This plan transforms the current "data-rich, logic-poor" state into a fully functional complex card system while maintaining the clean service-oriented architecture.