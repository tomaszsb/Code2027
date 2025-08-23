# Claude Charter: Code2027 Project Guide

## 🎯 Current Project Status: PRODUCTION READY

**Core Game Complete**: Fully playable multi-player board game with clean service architecture
**Last Updated**: August 23, 2025 - All Critical Bugs Fixed

## 🏗️ Architecture Foundation

**CRITICAL PRINCIPLE**: Build clean, service-oriented architecture with dependency injection. The `code2026` reference codebase contains anti-patterns - study it to understand what NOT to do.

## ✅ Architecture Patterns (Current Implementation)

### Core Services (ALL COMPLETED):
```typescript
DataService.ts          // ✅ CSV data access with caching
StateService.ts         // ✅ Immutable game state management  
TurnService.ts          // ✅ Turn progression + win conditions
CardService.ts          // ✅ Card operations + validation
PlayerActionService.ts  // ✅ Command orchestration
MovementService.ts      // ✅ Movement logic + validation
GameRulesService.ts     // ✅ Business rules + validation
```

### Key Patterns to Follow:
- **Dependency Injection**: `constructor(private serviceA: IServiceA)`
- **Immutable State**: `return { ...player, ...changes }`  
- **Service Integration**: `const { dataService } = useGameContext()`
- **TypeScript Strict**: All code fully typed with interfaces

## 🎮 Current Game Features (COMPLETE)

- **✅ Complete Game Loop**: Start → Setup → Play → Win → Reset
- **✅ Multi-Player Support**: Turn-based gameplay with AI and human players  
- **✅ Card System**: 24 different cards with play validation and effects
- **✅ Movement System**: Choice, dice, and fixed movement types
- **✅ Win Condition System**: Automatic detection and end game sequence
- **✅ Real-time UI**: Immutable state with instant UI updates

## 📂 Data Architecture 

**CRITICAL**: Game loads CSV data from `/public/data/CLEAN_FILES/` directory (not root `/data/`)

### CSV Files (COMPLETE):
- `GAME_CONFIG.csv` - Space configuration, phases, starting positions
- `MOVEMENT.csv` - Space-to-space connections and movement rules
- `CARDS.csv` - 24 cards with types, costs, and effects
- `SPACE_CONTENT.csv` - UI text and story content
- `SPACE_EFFECTS.csv` + `DICE_EFFECTS.csv` - Game effects and mechanics
- `DICE_OUTCOMES.csv` - Dice roll destination mapping

### Data Access Pattern:
```typescript
// ✅ CORRECT: Always use DataService
const cards = dataService.getCardsByType('W');
const config = dataService.getGameConfigBySpace(spaceName);

// ❌ NEVER: Direct CSV access or hardcoded data
```

## 🚀 Quick Start Commands

```bash
cd /mnt/d/unravel/current_game/code2027
npm run dev           # Start development server (usually port 3001)
npm run build         # Build for production  
npm run test          # Run test suite
```

## 📚 Documentation Quick Reference

- **`TASK_HISTORY.md`** - Complete implementation log with code examples
- **`DEVELOPMENT.md`** - Current project status and any remaining priorities  
- **Service Contracts**: `src/types/ServiceContracts.ts` - All service interfaces
- **CSV Structure**: `CSV_RESTRUCTURE_PLAN.md` - Data file specifications

## 🎯 Development Focus

**Current Status**: Core game is production-ready and fully playable

**For New Features**:
1. Follow established service patterns with dependency injection
2. Use DataService for all CSV data access  
3. Maintain TypeScript strict typing
4. Add comprehensive tests for new functionality
5. Keep components under 200 lines

**Key Architecture Reminder**: Always use services through `useGameContext()` hook in components. Never access data directly.

---

## 📝 Recent Work Log

### August 23, 2025: Complete Bug Fix Session ✅
**ALL 5 Critical Bugs Successfully Resolved**

1. **CardModal Data Display Issue** ✅  
   - **Problem**: Cards showing no data when clicked  
   - **Root Cause**: Dynamic card IDs not mapping to static CSV card data  
   - **Fix**: Implemented proper card ID generation starting with CSV card IDs

2. **Player Money/Time Not Updating** ✅  
   - **Problem**: UI not reflecting player money/time changes  
   - **Root Cause**: Property name mismatch - code2026 used `timeSpent`, code2027 used `time`  
   - **Fix**: Updated all code to use consistent `timeSpent` property naming

3. **Roll Dice Button Remaining Active** ✅  
   - **Problem**: Button not becoming inactive during processing  
   - **Root Cause**: Missing turn state management (`hasPlayerMovedThisTurn`, `awaitingChoice`)  
   - **Fix**: Enhanced button logic with proper state tracking

4. **End Turn Button Not Advancing Turns** ✅  
   - **Problem**: End Turn button not progressing to next player  
   - **Root Cause**: `PlayerActionService.rollDice()` not calling `setPlayerHasMoved()`  
   - **Fix**: Added missing state update to enable End Turn button

5. **Negotiate Button Wrong Behavior** ✅  
   - **Problem**: Button asking for other players instead of space-specific negotiation  
   - **Root Cause**: Missing space-based negotiation logic  
   - **Fix**: Implemented space content checking for `can_negotiate` flag

**Result**: Game now has proper turn progression, card functionality, and UI state management

*See complete technical details in comments above*

---

## CRITICAL BUG FIXES COMPLETED - December 2024 ✅

### **Session Summary: Multi-Action Turn System & W Card Data Fixes**

**Date**: December 2024  
**Scope**: Fixed 5 critical bugs impacting game functionality and user experience

#### **Major Architectural Fix: Multi-Action Turn System**
**Problem**: Game was auto-advancing players on dice roll, breaking proper turn flow  
**Solution**: Completely separated dice rolling from movement:

1. **Roll Dice Button**: Now calls `TurnService.rollDiceAndProcessEffects()` 
   - Rolls dice + processes space/dice effects + marks player as moved
   - **Does NOT** move player to next space
2. **End Turn Button**: Now calls `TurnService.endTurnWithMovement()`
   - Handles movement + advances to next player + checks win condition
   - **Only available after** player has rolled dice

#### **Critical Data Fix: W Cards Show Construction Work Scope**
**Problem**: W cards showed generic planning content instead of construction work scopes  
**Root Cause**: Wrong CSV data - 2027 had placeholder cards instead of 2026 construction projects  
**Solution**: 
- Replaced W cards with correct construction work types from 2026
- W cards now show actual projects like "Lobby renovation", "Attic conversion", "Green wall installation"
- Set W cards to cost $0 (scope assignments, not purchases)
- Added estimated costs in descriptions for funding planning

#### **Data Structure Consolidation**
**Problem**: 3 copies of CARDS.csv causing confusion and deployment issues  
**Solution**: Consolidated to single source of truth in `/public/data/CLEAN_FILES/`
- ❌ Removed `/data/CLEAN_FILES/` (redundant)
- ❌ Removed `/dist/data/` (build output)  
- ✅ Kept `/public/data/CLEAN_FILES/` (web server source)

#### **UI Enhancement: Player Cards Show Work Scope**
**Problem**: W card buttons only showed "W" instead of actual work descriptions  
**Solution**: Enhanced PlayerStatusPanel to display:
- **Before**: `W` `W` `W` (meaningless)
- **After**: `Conversion of attic space...` `Lobby renovation...` (meaningful scope)
- Added tooltips with full descriptions and estimated costs

#### **Negotiation Button Fix**
**Problem**: Button showed "unavailable" despite `canNegotiate: true` in CSV  
**Root Cause**: Type mismatch - checking `=== 'Yes'` (string) vs `=== true` (boolean)  
**Solution**: Fixed comparison in TurnControls.tsx

#### **Game Flow Now Complete**
1. **Setup Phase**: Create players → Start game
2. **Turn Phase**: Roll dice (get cards/effects) → End turn (move to next space)  
3. **Win Phase**: Reach ending space → End game celebration
4. **Reset**: Play again button returns to setup

**Development Status**: Core game complete and production-ready with critical bugs resolved.