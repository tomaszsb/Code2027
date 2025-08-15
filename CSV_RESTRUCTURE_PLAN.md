# CSV Data Structure Restructure Plan

## Current Problem Analysis

Your current CSV files mix multiple concerns, making the code complex and error-prone:

### Issues with Current Structure:

**Spaces.csv** - Doing too much (22 columns):
```csv
space_name,phase,visit_type,Event,Action,Outcome,w_card,b_card,i_card,l_card,e_card,Time,Fee,space_1,space_2,space_3,space_4,space_5,Negotiate,requires_dice_roll,path,rolls
```

Problems:
- ❌ Movement logic mixed with effects
- ❌ Story text mixed with game rules  
- ❌ Complex parsing: `"Draw 1 if scope ≤ $ 4 M"`
- ❌ Hard to code: multiple data types in single row
- ❌ Difficult to maintain: changes affect multiple systems

**DiceRoll Info.csv** - Multiple effect types:
```csv
space_name,die_roll,visit_type,1,2,3,4,5,6
OWNER-SCOPE-INITIATION,W Cards,First,Draw 1,Draw 1,Draw 2,Draw 2,Draw 3,Draw 3
ARCH-FEE-REVIEW,Fees Paid,First,8%,8%,10%,10%,12%,12%
CHEAT-BYPASS,Next Step,First,ENG-INITIATION,REG-DOB-FEE-REVIEW,REG-FDNY-FEE-REVIEW,CON-INITIATION,PM-DECISION-CHECK,PM-DECISION-CHECK
```

Problems:
- ❌ Mixed data types (cards, money, movement) in same structure
- ❌ Hard to parse different effect types
- ❌ Inconsistent data format across rows

## Proposed Clean Structure

### 1. **Movement Data** - `MOVEMENT.csv`
**Purpose**: Pure space-to-space connections  
**Used by**: MovementEngine

```csv
space_name,visit_type,movement_type,destination_1,destination_2,destination_3,destination_4,destination_5
START-QUICK-PLAY-GUIDE,First,fixed,OWNER-SCOPE-INITIATION,,,,
OWNER-SCOPE-INITIATION,First,dice,OWNER-FUND-INITIATION,,,,
OWNER-FUND-INITIATION,First,fixed,PM-DECISION-CHECK,,,,
PM-DECISION-CHECK,First,choice,LEND-SCOPE-CHECK,ARCH-INITIATION,CHEAT-BYPASS,,
PM-DECISION-CHECK,Subsequent,choice,LEND-SCOPE-CHECK,ARCH-INITIATION,CHEAT-BYPASS,PM-DECISION-CHECK,OWNER-DECISION-REVIEW
LEND-SCOPE-CHECK,First,dice,BANK-FUND-REVIEW,INVESTOR-FUND-REVIEW,,,
BANK-FUND-REVIEW,First,fixed,PM-DECISION-CHECK,,,,
INVESTOR-FUND-REVIEW,First,fixed,PM-DECISION-CHECK,,,,
ARCH-INITIATION,First,dice,ENG-INITIATION,,,,
ENG-INITIATION,First,dice,REG-DOB-FEE-REVIEW,,,,
REG-DOB-FEE-REVIEW,First,choice,REG-DOB-PLAN-EXAM,REG-DOB-PROF-CERT,,,
CON-INITIATION,First,fixed,CON-ISSUES,,,,
FINISH,First,none,,,,,
```

**Coding Benefits**:
```javascript
// Simple, focused parsing
const destinations = row.destination_1, row.destination_2, etc.
const movementType = row.movement_type; // 'fixed', 'dice', 'choice'

// Clean logic
if (movementType === 'choice') {
  showChoiceModal(destinations);
} else if (movementType === 'dice') {
  requireDiceRoll(destinations);
}
```

### 2. **Dice Outcomes** - `DICE_OUTCOMES.csv`
**Purpose**: What happens when you roll dice  
**Used by**: DiceEngine

```csv
space_name,visit_type,roll_1,roll_2,roll_3,roll_4,roll_5,roll_6
OWNER-SCOPE-INITIATION,First,OWNER-FUND-INITIATION,OWNER-FUND-INITIATION,OWNER-FUND-INITIATION,OWNER-FUND-INITIATION,OWNER-FUND-INITIATION,OWNER-FUND-INITIATION
LEND-SCOPE-CHECK,First,BANK-FUND-REVIEW,BANK-FUND-REVIEW,BANK-FUND-REVIEW,INVESTOR-FUND-REVIEW,INVESTOR-FUND-REVIEW,INVESTOR-FUND-REVIEW
ARCH-INITIATION,First,ENG-INITIATION,ENG-INITIATION,ENG-INITIATION,ARCH-FEE-REVIEW,ARCH-FEE-REVIEW,ARCH-FEE-REVIEW
ARCH-INITIATION,Subsequent,PM-DECISION-CHECK,PM-DECISION-CHECK,PM-DECISION-CHECK,ARCH-FEE-REVIEW,ARCH-FEE-REVIEW,ARCH-FEE-REVIEW
CON-INITIATION,First,CON-ISSUES,CON-ISSUES,CON-ISSUES,CON-ISSUES,CON-ISSUES,CON-ISSUES
CON-ISSUES,First,CON-INSPECT,CON-INSPECT,REG-FDNY-FEE-REVIEW,REG-DOB-FEE-REVIEW,ENG-INITIATION,ARCH-INITIATION
REG-DOB-PLAN-EXAM,First,REG-FDNY-FEE-REVIEW,REG-DOB-PLAN-EXAM,ARCH-INITIATION,ARCH-INITIATION,REG-FDNY-FEE-REVIEW,REG-FDNY-FEE-REVIEW
```

**Coding Benefits**:
```javascript
// Super simple dice resolution
const destination = diceOutcome[`roll_${diceValue}`];
movePlayer(player, destination);
```

### 3. **Space Effects** - `SPACE_EFFECTS.csv`
**Purpose**: All card, time, and money effects  
**Used by**: EffectsEngine

```csv
space_name,visit_type,effect_type,effect_action,effect_value,condition,description
OWNER-SCOPE-INITIATION,First,time,add,1,always,1 day for scope review
OWNER-SCOPE-INITIATION,First,cards,draw,3,always,Draw 3 W cards
OWNER-FUND-INITIATION,First,time,add,1,always,1 day for funding review
OWNER-FUND-INITIATION,First,cards,draw,1,scope_le_4M,Draw 1 B card if scope ≤ $4M
OWNER-FUND-INITIATION,First,cards,draw,1,scope_gt_4M,Draw 1 B card if scope > $4M
PM-DECISION-CHECK,First,time,add,5,always,5 days for decision making
PM-DECISION-CHECK,First,cards,draw,1,dice_roll_1,Draw 1 L card if rolled 1
PM-DECISION-CHECK,First,cards,replace,1,always,Replace 1 E card
PM-DECISION-CHECK,Subsequent,cards,transfer,1,to_right,Give 1 card to right player
BANK-FUND-REVIEW,First,time,add_per_amount,1,per_200k,1 day per $200K borrowed
BANK-FUND-REVIEW,First,money,fee_percent,1,loan_up_to_1.4M,1% fee for loans up to $1.4M
BANK-FUND-REVIEW,First,money,fee_percent,2,loan_1.5M_to_2.75M,2% fee for loans $1.5M-$2.75M
BANK-FUND-REVIEW,First,money,fee_percent,3,loan_above_2.75M,3% fee for loans above $2.75M
BANK-FUND-REVIEW,First,cards,draw,1,always,Draw 1 B card
BANK-FUND-REVIEW,First,cards,draw,2,always,Draw 2 L cards
INVESTOR-FUND-REVIEW,First,money,fee_percent,5,of_borrowed_amount,5% of amount borrowed
INVESTOR-FUND-REVIEW,First,cards,draw,1,dice_roll_5,Draw 1 L card if rolled 5
INVESTOR-FUND-REVIEW,First,cards,replace,1,always,Replace 1 E card
CON-INITIATION,First,cards,draw,1,dice_roll_3,Draw 1 L card if rolled 3
CON-INITIATION,First,cards,draw,3,always,Draw 3 E cards
CON-INSPECT,First,cards,draw,1,dice_roll_1,Draw 1 L card if rolled 1
CON-INSPECT,First,cards,return,1,always,Return 1 E card
```

**Coding Benefits**:
```javascript
// Clean effect processing
effects.forEach(effect => {
  if (meetsCondition(effect.condition, gameState)) {
    switch(effect.effect_type) {
      case 'time':
        if (effect.effect_action === 'add') {
          addTime(player, effect.effect_value);
        }
        break;
      case 'cards':
        if (effect.effect_action === 'draw') {
          drawCards(player, effect.effect_value);
        } else if (effect.effect_action === 'replace') {
          replaceCards(player, effect.effect_value);
        }
        break;
      case 'money':
        if (effect.effect_action === 'fee_percent') {
          applyFee(player, effect.effect_value);
        }
        break;
    }
  }
});
```

### 4. **Dice Effects** - `DICE_EFFECTS.csv`
**Purpose**: Effects that happen based on dice rolls  
**Used by**: DiceEngine + EffectsEngine

```csv
space_name,visit_type,effect_type,card_type,roll_1,roll_2,roll_3,roll_4,roll_5,roll_6
OWNER-SCOPE-INITIATION,First,cards,W,Draw 1,Draw 1,Draw 2,Draw 2,Draw 3,Draw 3
OWNER-SCOPE-INITIATION,Subsequent,cards,W,Draw 1,Draw 1,Draw 2,Draw 2,Draw 3,Draw 3
ARCH-FEE-REVIEW,First,money,fee,8%,8%,10%,10%,12%,12%
ARCH-FEE-REVIEW,Subsequent,money,fee,0%,0%,1%,1%,2%,2%
ARCH-SCOPE-CHECK,First,cards,W,Remove 1,Draw 1,Replace 1,No change,No change,No change
ARCH-SCOPE-CHECK,Subsequent,cards,W,Remove 1,Draw 1,Replace 1,No change,No change,No change
CHEAT-BYPASS,First,time,days,1,2,3,4,60,365
CHEAT-BYPASS,Subsequent,time,days,1,2,3,4,60,365
CON-INITIATION,First,quality,contractor,HIGH,HIGH,MED,MED,LOW,LOW
CON-INITIATION,First,multiplier,cost,1,2,3,4,5,6
CON-INITIATION,Subsequent,time,days,5,10,15,20,25,30
CON-INITIATION,Subsequent,money,fee,0%,2%,4%,6%,8%,10%
ENG-FEE-REVIEW,First,money,fee,2%,2%,4%,4%,6%,6%
ENG-FEE-REVIEW,Subsequent,money,fee,0%,0%,1%,1%,2%,2%
ENG-SCOPE-CHECK,First,cards,W,Remove 1,Draw 1,Replace 1,No change,No change,No change
ENG-SCOPE-CHECK,Subsequent,cards,W,Remove 1,Draw 1,Replace 1,No change,No change,No change
INVESTOR-FUND-REVIEW,First,cards,I,Draw 1,Draw 1,Draw 1,Draw 2,Draw 2,Draw 2
INVESTOR-FUND-REVIEW,Subsequent,cards,I,Draw 1,Draw 1,Draw 1,Draw 2,Draw 2,Draw 2
INVESTOR-FUND-REVIEW,First,time,days,30,30,30,50,50,70
INVESTOR-FUND-REVIEW,Subsequent,time,days,30,30,50,50,70,70
```

**Coding Benefits**:
```javascript
// Simple dice effect resolution
const effect = diceEffects[`roll_${diceValue}`];
if (effect !== 'No change') {
  applyEffect(effect, player);
}
```

### 5. **Space Content** - `SPACE_CONTENT.csv`
**Purpose**: All display text and story content  
**Used by**: UI Components

```csv
space_name,visit_type,title,story,action_description,outcome_description,can_negotiate
START-QUICK-PLAY-GUIDE,First,Getting Started,Congratulations! You are hired as the project manager. Learn the game rules.,Review the tutorial and game mechanics,Understand how to play the game,No
OWNER-SCOPE-INITIATION,First,Project Scope,The owner dreams up an idea of project scope.,Review their scope and either accept it or negotiate by repeating the roll next turn,Scope is determined for the project,Yes
OWNER-FUND-INITIATION,First,Initial Funding,Owner does some number crunching and comes up with their share of money.,Look at scope estimates and money. Take it or waste time hoping to renegotiate next turn,Take Owner's Money,Yes
PM-DECISION-CHECK,First,Strategic Decision,As project manager your first decision is to determine the direction of project.,You and expeditor strategize and come up with changes. Life happens and you choose a path forward,Path forward is determined,No
LEND-SCOPE-CHECK,First,Funding Review,You need more money! The lender reviews the business plan and negotiates scope for a better rate.,Scope negotiations last a while as life passes you by. Your expeditor comes up with an idea and the deal is struck,Deal is struck with lender,Yes
BANK-FUND-REVIEW,First,Bank Underwriting,You wait patiently as the bank underwrites to determine the loan amount and rate.,Having money will allow you to hire and spend maybe even have a life,Bank loan terms are set,Yes
INVESTOR-FUND-REVIEW,First,Investor Review,You wait patiently as the investors determine the loan amount and rate.,Having money will allow you to hire and spend maybe even have a life,Investor terms are determined,Yes
ARCH-INITIATION,First,Finding Architect,You are searching for the architect.,Making phone calls and looking at qualifications while others play,Architect is selected,No
ENG-INITIATION,First,Finding Engineer,You are searching for the engineer.,More phone calls and qualification reviews while others play,Engineer is selected,No
REG-DOB-FEE-REVIEW,First,DOB Fees,Owner pays DOB fees.,Fork over the cash and hire a few staff,Fees are paid and staff hired,No
CON-INITIATION,First,Contractor Selection,The contractor has to be chosen to finally make your dreams come true.,Roll for quality and cost multiplier then do the math,Contractor is selected,Yes
CON-ISSUES,First,Construction Problems,Construction unearths unforeseen issues in the field.,Attempt to resolve everything on the spot because delays are expensive,Issues are resolved or escalated,No
CON-INSPECT,First,Inspection,That inspector looks fresh - this is either good or bad news.,Notice safety violation and distract inspector - will it work?,Inspection passes or fails,No
FINISH,First,Project Complete,You completed the project!,Calculate final score,YOU ARE DONE!,No
```

**Coding Benefits**:
```javascript
// Clean UI content loading
const content = spaceContent.find(c => c.space_name === spaceName && c.visit_type === visitType);
displayTitle(content.title);
displayStory(content.story);
showNegotiateButton(content.can_negotiate === 'Yes');
```

### 6. **Game Metadata** - `GAME_CONFIG.csv`
**Purpose**: Game configuration and phase information  
**Used by**: Game setup and validation

```csv
space_name,phase,path_type,is_starting_space,is_ending_space,min_players,max_players
START-QUICK-PLAY-GUIDE,SETUP,Tutorial,Yes,No,1,6
OWNER-SCOPE-INITIATION,SETUP,Main,No,No,1,6
OWNER-FUND-INITIATION,SETUP,Main,No,No,1,6
PM-DECISION-CHECK,OWNER,Choice,No,No,1,6
LEND-SCOPE-CHECK,FUNDING,Side_Quest,No,No,1,6
BANK-FUND-REVIEW,FUNDING,Side_Quest,No,No,1,6
INVESTOR-FUND-REVIEW,FUNDING,Side_Quest,No,No,1,6
ARCH-INITIATION,DESIGN,Main,No,No,1,6
ARCH-FEE-REVIEW,DESIGN,Main,No,No,1,6
ARCH-SCOPE-CHECK,DESIGN,Main,No,No,1,6
ENG-INITIATION,DESIGN,Main,No,No,1,6
ENG-FEE-REVIEW,DESIGN,Main,No,No,1,6
ENG-SCOPE-CHECK,DESIGN,Main,No,No,1,6
REG-DOB-FEE-REVIEW,REGULATORY,Main,No,No,1,6
REG-DOB-TYPE-SELECT,REGULATORY,Choice,No,No,1,6
REG-DOB-PLAN-EXAM,REGULATORY,Main,No,No,1,6
REG-DOB-PROF-CERT,REGULATORY,Main,No,No,1,6
REG-FDNY-FEE-REVIEW,REGULATORY,Logic,No,No,1,6
CON-INITIATION,CONSTRUCTION,Main,No,No,1,6
CON-ISSUES,CONSTRUCTION,Main,No,No,1,6
CON-INSPECT,CONSTRUCTION,Main,No,No,1,6
FINISH,END,Main,No,Yes,1,6
```

## Implementation Strategy

### Phase 1: Create New CSV Files
1. Extract movement logic → `MOVEMENT.csv`
2. Extract dice outcomes → `DICE_OUTCOMES.csv`
3. Extract effects → `SPACE_EFFECTS.csv` + `DICE_EFFECTS.csv`
4. Extract content → `SPACE_CONTENT.csv`
5. Create metadata → `GAME_CONFIG.csv`

### Phase 2: Update Code Architecture
Create specialized engines:

```javascript
// Clean separation of concerns
class MovementEngine {
  // Only handles space-to-space movement
  getAvailableMoves(player, spaceName, visitType)
  executeMovement(player, targetSpace)
}

class EffectsEngine {
  // Only handles card/time/money effects
  applySpaceEffects(player, spaceName, visitType)
  applyDiceEffects(player, spaceName, visitType, diceRoll)
}

class ContentEngine {
  // Only handles display content
  getSpaceContent(spaceName, visitType)
  getSpaceTitle(spaceName, visitType)
}

class DiceEngine {
  // Only handles dice mechanics
  getDiceOutcome(spaceName, visitType, rollValue)
  rollDice(sides = 6)
}
```

### Phase 3: Benefits Achieved

**Before (mixed CSV)**:
```javascript
// Complex, error-prone parsing
if (spaceData.w_card === "Draw 3") {
  drawCards('W', 3);
} else if (spaceData.w_card === "Draw 1 if scope ≤ $ 4 M") {
  if (player.scope <= 4000000) {
    drawCards('W', 1);
  }
}

// Movement mixed with effects
const moves = [spaceData.space_1, spaceData.space_2].filter(Boolean);
const time = parseInt(spaceData.Time || '0');
const fee = parseFloat(spaceData.Fee || '0');
```

**After (clean CSVs)**:
```javascript
// Simple, reliable parsing
const movement = MovementEngine.getAvailableMoves(player);
const effects = EffectsEngine.getSpaceEffects(spaceName, visitType);
const content = ContentEngine.getSpaceContent(spaceName, visitType);

effects.forEach(effect => {
  EffectsEngine.applyEffect(player, effect);
});
```

### Data Validation Examples

Each CSV can be validated independently:

```javascript
// Movement validation
function validateMovement(movementData) {
  return movementData.every(row => {
    return row.destination_1 && 
           ['fixed', 'dice', 'choice'].includes(row.movement_type);
  });
}

// Effects validation  
function validateEffects(effectsData) {
  return effectsData.every(row => {
    return ['time', 'cards', 'money'].includes(row.effect_type) &&
           ['add', 'draw', 'replace', 'return'].includes(row.effect_action);
  });
}
```

## Migration Path

### Step 1: Backup Current Files
```bash
cp Spaces.csv Spaces_BACKUP.csv
cp "DiceRoll Info.csv" "DiceRoll_Info_BACKUP.csv"
```

### Step 2: Generate Clean Files
Run data extraction scripts to populate new CSVs from existing data

### Step 3: Update Code Gradually
1. Update MovementEngine to use `MOVEMENT.csv`
2. Update EffectsEngine to use `SPACE_EFFECTS.csv` + `DICE_EFFECTS.csv`
3. Update UI to use `SPACE_CONTENT.csv`
4. Remove old CSV dependencies

### Step 4: Verify Game Logic
Test that all game mechanics work with new structure

## Expected Benefits

1. **Easier Coding**: Single-purpose CSVs with consistent data types
2. **Better Debugging**: Issues isolated to specific systems
3. **Faster Development**: No more parsing complex mixed data
4. **Cleaner Architecture**: Separation of concerns enforced by data structure
5. **Easier Maintenance**: Changes only affect relevant systems
6. **Better Testing**: Each CSV can be tested independently

This restructure will make your movement and card engines much simpler to implement and maintain!