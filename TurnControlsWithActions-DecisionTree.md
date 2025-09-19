# TurnControlsWithActions Decision Tree

## Overview
When a player's turn controls render, the component asks these questions in order:

```
Player lands on space → What buttons should I show?
```

## Decision Tree

### 1️⃣ **DICE ROLL BUTTON**
```
❓ Can player roll dice?
├─ ❌ NO if:
│  ├─ Player already rolled dice this turn
│  ├─ Player is processing turn
│  ├─ Player has pending movement choice
│  └─ Player is on "OWNER-FUND-INITIATION" space
│
└─ ✅ YES → Show dice button with smart text:
   ├─ 🎯 Look up space data:
   │  ├─ getDiceEffects() → "What happens when I roll?"
   │  ├─ getSpaceEffects() → "Any special effects?"
   │  └─ getDiceOutcome() → "Where can dice take me?"
   │
   └─ 📝 Button text examples:
      ├─ "Roll for Movement" (basic spaces)
      ├─ "Roll for Cards + Move" (spaces with card effects)
      └─ "Roll for Outcome" (special spaces)
```

### 2️⃣ **FUNDING BUTTON** (Special Case)
```
❓ Is player on funding space?
├─ ✅ YES (space = "OWNER-FUND-INITIATION"):
│  └─ Show "💰 Get Funding" button
│
└─ ❌ NO → Skip this button
```

### 3️⃣ **MANUAL ACTION BUTTONS**
```
❓ Are there manual actions on this space?
├─ 🔍 Look up space data:
│  └─ getSpaceEffects() → Filter for manual effects
│
├─ 📋 For each manual effect found:
│  ├─ ❓ Is it trigger_type = "manual"? → ✅ Keep
│  ├─ ❓ Is it effect_type = "turn"? → ❌ Skip (duplicate)
│  ├─ ❓ Does condition match player? → Check scope/rules
│  └─ ❓ Already completed this turn? → ❌ Show completion ✅
│
└─ 🎯 Button examples:
   ├─ "📊 Analyze Market" (manual market analysis)
   ├─ "💡 Get Advice" (manual consulting)
   ├─ "🔧 Technical Review" (manual tech check)
   └─ "💰 Raise Funds" (manual funding)
```

### 4️⃣ **TRY AGAIN BUTTON**
```
❓ Can player negotiate/try again?
├─ 🔍 Look up space data:
│  └─ getSpaceContent() → Check "can_negotiate" field
│
├─ ✅ YES (can_negotiate = true):
│  └─ Show "🔄 Try Again" button
│
└─ ❌ NO → Skip this button
```

### 5️⃣ **END TURN BUTTON**
```
❓ Can player end turn?
├─ ❌ NO if:
│  ├─ Player hasn't rolled dice yet
│  ├─ Player has incomplete required actions
│  ├─ Player has pending movement choice
│  └─ Turn is processing
│
└─ ✅ YES → Show "⏹️ End Turn (2/3)"
   └─ Numbers show: completed/required actions
```

## Real Example Walkthrough

### Scenario: Player lands on "MARKET-VALIDATION" space (First visit)

#### Step 1: Space Data Lookup
```
🔍 DataService queries:
├─ getSpaceEffects("MARKET-VALIDATION", "First")
│  └─ Returns: [
│      { effect_type: "cards", trigger_type: "manual", description: "Draw market cards" },
│      { effect_type: "time", trigger_type: "auto", description: "Spend 2 months" }
│    ]
├─ getSpaceContent("MARKET-VALIDATION", "First")
│  └─ Returns: { can_negotiate: true, title: "Market Research" }
├─ getDiceEffects("MARKET-VALIDATION", "First")
│  └─ Returns: [{ effect_type: "movement", roll_1: "CUSTOMER-DISCOVERY" }]
└─ getDiceOutcome("MARKET-VALIDATION", "First")
   └─ Returns: { roll_1: "CUSTOMER-DISCOVERY", roll_2: "COMPETITIVE-ANALYSIS" }
```

#### Step 2: Decision Tree Results
```
🎲 Dice Roll Button: ✅ "Roll for Movement"
   └─ Because: dice outcome shows movement options

💡 Manual Action: ✅ "📊 Draw Market Cards"
   └─ Because: manual effect found for cards

🔄 Try Again: ✅ "Try Again"
   └─ Because: can_negotiate = true

⏹️ End Turn: ❌ Disabled
   └─ Because: hasn't rolled dice yet
```

#### Step 3: UI Result
```
┌─────────────────────────┐
│    Turn Controls        │
├─────────────────────────┤
│ 🎲 Roll for Movement    │ ← From dice data
│ 📊 Draw Market Cards    │ ← From manual effects
│ 🔄 Try Again           │ ← From space content
│ ⏹️ End Turn (0/1) ❌    │ ← Disabled until dice roll
└─────────────────────────┘
```

## Key Patterns

### 🎯 **Data → Decision → UI**
1. **Data**: Query space configuration from CSV
2. **Decision**: Apply game rules and filters
3. **UI**: Show appropriate buttons

### 🔄 **Dynamic Button Text**
- Dice button text changes based on what the dice will do
- Manual buttons show the actual effect description
- End turn shows progress: "End Turn (2/3)"

### ⚡ **Smart Filtering**
- Only shows buttons for available actions
- Hides completed actions (shows ✅ instead)
- Respects game state (turn phase, prerequisites)

### 🎮 **Space-Specific Behavior**
- Each space can have completely different buttons
- First vs Subsequent visits can show different options
- Player conditions (project scope) affect what's available
