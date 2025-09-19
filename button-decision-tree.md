# Turn Controls & Action Buttons Decision Tree

## Visual Flow: Player Lands on PM-DECISION-CHECK Space

```
🎮 PLAYER LANDS ON SPACE: "PM-DECISION-CHECK"
│
└─► StateService.updatePlayer() triggers state broadcast
    │
    └─► GameLayout receives state update
        │
        └─► TurnControlsWithActions component renders
            │
            ┌─────────────────────────────────────────────────────────────┐
            │                    DECISION TREE START                      │
            └─────────────────────────────────────────────────────────────┘
            │
            ▼
    ┌───────────────────────────────────────┐
    │ ❓ IS GAME PHASE === 'PLAY'?          │
    └───────────────┬───────────────────────┘
                    │
        ┌───────────┴────────────┐
        │ ✅ YES                 │ ❌ NO
        │                        │
        ▼                        ▼
    ┌─────────────────┐      ┌─────────────────┐
    │ Continue...     │      │ Show "Start     │
    │                 │      │ Game" button    │
    └─────────────────┘      │ STOP            │
            │                └─────────────────┘
            ▼
    ┌───────────────────────────────────────┐
    │ ❓ IS CURRENT PLAYER != NULL?         │
    └───────────────┬───────────────────────┘
                    │
        ┌───────────┴────────────┐
        │ ✅ YES                 │ ❌ NO
        │                        │
        ▼                        ▼
    ┌─────────────────┐      ┌─────────────────┐
    │ Continue...     │      │ No buttons      │
    │                 │      │ STOP            │
    └─────────────────┘      └─────────────────┘
            │
            ▼
    ┌────────────────────────────────────────────────┐
    │ 📊 READ SPACE DATA                             │
    │ DataService.getSpaceEffects(                   │
    │   "PM-DECISION-CHECK", "First"                 │
    │ )                                              │
    └────────────────┬───────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────────┐
    │ 📋 SPACE EFFECTS FROM CSV:                     │
    │                                                │
    │ 1. dice_roll_chance,draw_l_on_1,manual         │
    │ 2. cards,replace_e,manual                      │
    │ 3. turn,end_turn,manual                        │
    └────────────────┬───────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────────┐
    │ 🔍 FILTER EFFECTS                              │
    │                                                │
    │ .filter(effect => effect.trigger_type === 'manual')  │
    │ .filter(effect => effect.effect_type !== 'turn')     │
    │ .filter(effect => evaluateEffectCondition())         │
    └────────────────┬───────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────────────┐
    │ ✅ FILTERED RESULTS:                           │
    │                                                │
    │ 1. dice_roll_chance effect → Manual Button     │
    │ 2. cards,replace_e effect → Manual Button      │
    │ 3. turn effect → FILTERED OUT                  │
    └────────────────┬───────────────────────────────┘
                     │
                     ▼
    ┌─────────────────────────────────────────────────┐
    │           BUTTON CONDITION CHECKS               │
    └─────────────────────────────────────────────────┘
            │
            ├──► ❓ CAN ROLL DICE?
            │   │  gamePhase === 'PLAY' ✅ AND
            │   │  isCurrentPlayersTurn ✅ AND
            │   │  !isProcessingTurn ✅ AND
            │   │  !hasPlayerRolledDice ✅ AND
            │   │  !hasPlayerMovedThisTurn ✅ AND
            │   │  !awaitingChoice ✅ AND
            │   │  currentSpace !== 'OWNER-FUND-INITIATION' ✅
            │   │
            │   └─► ✅ YES → CREATE DICE BUTTON
            │
            ├──► ❓ CAN END TURN?
            │   │  gamePhase === 'PLAY' ✅ AND
            │   │  isCurrentPlayersTurn ✅ AND
            │   │  !isProcessingTurn ✅ AND
            │   │  hasPlayerRolledDice ❌ AND  ← FAILS HERE
            │   │  actionCounts.completed >= required ❌
            │   │
            │   └─► ❌ NO → CREATE DISABLED END TURN BUTTON
            │
            ├──► ❓ CAN NEGOTIATE?
            │   │  spaceContent.can_negotiate === true?
            │   │
            │   └─► ❌ NO → NO TRY AGAIN BUTTON
            │
            └──► ❓ HAS MANUAL EFFECTS?
                │  manualEffects.length > 0 ✅
                │
                └─► ✅ YES → CREATE MANUAL EFFECT BUTTONS

    ┌─────────────────────────────────────────────────┐
    │              FINAL BUTTON CREATION               │
    └─────────────────────────────────────────────────┘
            │
            ├──► 🎲 ROLL DICE BUTTON
            │   │  Status: ENABLED
            │   │  onClick: handleRollDice()
            │   │  Style: Green/Success
            │
            ├──► 🎲 ROLL FOR L CARD CHANCE
            │   │  Status: ENABLED
            │   │  onClick: handleManualEffect('dice_roll_chance')
            │   │  Style: Warning/Orange
            │   │  From: dice_roll_chance effect
            │
            ├──► 📋 REPLACE E CARD
            │   │  Status: ENABLED
            │   │  onClick: handleManualEffect('cards')
            │   │  Style: Warning/Orange
            │   │  From: cards,replace_e effect
            │
            └──► ⏹️ END TURN (0/1)
                │  Status: DISABLED
                │  onClick: null (disabled)
                │  Style: Gray/Disabled
                │  Tooltip: "Complete 1 more action to end turn"

    ┌─────────────────────────────────────────────────┐
    │                 FINAL UI RESULT                  │
    └─────────────────────────────────────────────────┘

    ┌─ 🎲 Roll Dice ────────────────────┐ ← PRIMARY ACTION
    │   [ENABLED - Green Button]       │
    └───────────────────────────────────┘

    ┌─ 🎲 Roll for L Card Chance ──────┐ ← MANUAL EFFECT
    │   [ENABLED - Orange Button]      │
    └───────────────────────────────────┘

    ┌─ 📋 Replace E Card ──────────────┐ ← MANUAL EFFECT
    │   [ENABLED - Orange Button]      │
    └───────────────────────────────────┘

    ┌─ ⏹️ End Turn (0/1) ──────────────┐ ← TURN ENDING
    │   [DISABLED - Gray Button]       │
    └───────────────────────────────────┘
```

## Key Decision Points Summary:

| Question | Available Options | Current Answer | Result |
|----------|------------------|----------------|--------|
| Game Phase? | SETUP, PLAY | PLAY ✅ | Continue |
| Current Player? | null, Player Object | Player Object ✅ | Continue |
| Space Effects? | Read from CSV | 3 effects found | Process |
| Filter Manual? | manual, auto, dice | 2 manual effects | Create buttons |
| Can Roll Dice? | true, false | true ✅ | Enable button |
| Can End Turn? | true, false | false ❌ | Disable button |
| Can Negotiate? | true, false | false ❌ | No button |
| Manual Effects Count? | 0, 1, 2, 3+ | 2 effects | Create 2 buttons |

## Dynamic Nature:

- **Different Space = Different Buttons**: Each space in the CSV has unique effects
- **Visit Type Matters**: First vs Subsequent visits can have different effects
- **Conditions Apply**: Effects can have conditions like `scope_le_4M`
- **State Dependent**: Button enabled/disabled based on current game state
- **Progressive**: Buttons replace with ✅ completion messages after use

The entire system is **data-driven** from the `SPACE_EFFECTS.csv` file combined with real-time game state validation.