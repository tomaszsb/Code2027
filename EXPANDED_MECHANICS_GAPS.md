# Expanded Mechanics Implementation Gaps

## Current Status: 95 Complex Cards vs Limited Logic

We have successfully restored 95 complex cards with expanded mechanics, but our current service logic only handles basic functionality. Here's the gap analysis:

## ✅ What's Currently Implemented

### CardService.applyExpandedMechanics()
- ✅ **tick_modifier**: Time reduction/increase (E029: -3, E030: -5)
- ✅ **money_effect**: Direct money changes
- ✅ **loan_amount**: B card loan amounts (500K-4M)
- ✅ **investment_amount**: I card investments (4M-12M)
- ❌ **turn_effect**: Only logs "Skip next turn" - NO ACTUAL IMPLEMENTATION
- ❌ **draw_cards**: Only logs - NO ACTUAL IMPLEMENTATION  
- ❌ **discard_cards**: Only logs - NO ACTUAL IMPLEMENTATION

## ❌ Critical Missing Logic

### 1. Turn Control System (CRITICAL)
**Cards Affected**: E029, E030, E014, L014, L024, E028, L035
**Current**: Just console.log() messages
**Needed**: 
```typescript
// TurnService needs:
skipNextTurn(playerId: string): void
skipCurrentTurn(playerId: string): void
isPlayerSkippingTurn(playerId: string): boolean
```

### 2. Card Interaction System (HIGH PRIORITY)
**Cards Affected**: 30+ cards with draw_cards/discard_cards
**Examples**:
- L005: "Draw 1 Expeditor Card"
- L007: "Draw 1 Expeditor Card"  
- L024: "Draw 2 Expeditor Cards"
- L003: "Discard 1 Expeditor card"

**Current**: Only console.log() messages
**Needed**:
```typescript
// CardService needs:
drawCards(playerId: string, cardType: string, count: number): void
discardCards(playerId: string, cardType: string, count: number): void
replaceCards(playerId: string, discardType: string, drawType: string, count: number): void
```

### 3. Targeting System (MEDIUM PRIORITY)  
**Cards Affected**: Cards with target: "All Players", "Choose Player", "Choose Opponent"
**Examples**:
- L002: target="All Players", scope="Global"
- L003: target="All Players" - "All players must discard 1 Expeditor card"
- E009: target="Choose Opponent" - "Choose an opponent. Their current filing takes 2 ticks more time"

**Current**: No targeting logic
**Needed**:
```typescript
// New TargetingService:
applyEffectToAllPlayers(effect: CardEffect): void
applyEffectToChosenPlayer(playerId: string, targetId: string, effect: CardEffect): void
promptPlayerChoice(playerId: string, availableTargets: string[]): string
```

### 4. Duration-Based Effects (MEDIUM PRIORITY)
**Cards Affected**: Cards with duration="Turns", duration_count="2-5"
**Examples**:
- L002: duration="Turns", duration_count="3" - "All permit and inspection times increase by 2 ticks for the next 3 turns"
- L004: duration="Turns", duration_count="2" - "All construction times increase by 4 ticks for the next 2 turns"

**Current**: No duration tracking
**Needed**:
```typescript
// StateService needs:
interface ActiveEffect {
  cardId: string;
  playerId: string;
  effect: string;
  remainingTurns: number;
  affectedPlayers: string[];
}

addDurationEffect(effect: ActiveEffect): void
processTurnBasedEffects(): void
```

### 5. Conditional Logic (LOW PRIORITY)
**Cards Affected**: Cards with dice rolls, conditions, prerequisites
**Examples**:
- L009: "Roll a die. On 1-3 increase filing time by 5 ticks. On 4-6 no effect"
- L013: "Roll a die. On 1-3 increase permit filing time by 6 ticks. On 4-6 no effect"

**Current**: No conditional processing
**Needed**: Enhanced effect processing with dice-based conditions

## 📊 Impact Assessment

### Broken Gameplay Examples:
1. **E029 Weekend Work**: Player plays card → time reduces by 3 → **SHOULD skip next turn BUT DOESN'T**
2. **L005 Positive Press**: Player plays card → time reduces → **SHOULD draw E card BUT DOESN'T**  
3. **L002 Economic Downturn**: Affects all players for 3 turns → **ONLY APPLIES ONCE**
4. **E009 Favor Called In**: Target opponent → **NO TARGETING SYSTEM**

### Cards That Don't Work Properly:
- **Turn Skip Cards (8 cards)**: E029, E030, E014, L014, L024, E028, L035 - skip turns don't work
- **Card Draw Cards (20+ cards)**: All draw/discard effects ignored
- **Multi-Player Cards (15+ cards)**: All targeting ignored 
- **Duration Cards (12+ cards)**: Effects only apply once instead of multiple turns

**Estimated Broken Cards**: 55+ out of 95 complex cards (~60% broken)

## 🚀 Recommended Implementation Plan

### Phase 1: Critical Turn Control (Week 1)
1. **TurnService Enhancement**
   - Add turn skipping logic
   - Track skipped players in game state
   - Modify turn advancement to handle skips

### Phase 2: Card Interaction System (Week 2)  
1. **CardService Enhancement**
   - Implement draw/discard mechanics
   - Add card type filtering
   - Integrate with existing card management

### Phase 3: Targeting & Multi-Player (Week 3)
1. **New TargetingService**
   - Player selection UI
   - Effect application to multiple targets
   - Target validation

### Phase 4: Duration Effects (Week 4)
1. **StateService Enhancement** 
   - Active effects tracking
   - Turn-based effect processing
   - Effect expiration management

## 🎯 Success Metrics
- **Phase 1**: Turn skip cards work correctly (8 cards functional)
- **Phase 2**: Draw/discard cards work correctly (+20 cards functional) 
- **Phase 3**: Multi-player targeting works (+15 cards functional)
- **Phase 4**: Duration effects persist across turns (+12 cards functional)

**Total Goal**: 90%+ of complex cards fully functional (85+ out of 95 cards)