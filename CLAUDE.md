# Claude Charter: Code2027 Project Guide

## 🎯 Current Project Status: PRODUCTION READY

**Core Game Complete**: Fully playable multi-player board game with clean service architecture
**Last Updated**: August 23, 2025

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

### August 23, 2025: Critical Bug Fixes ✅
**Issue**: Players starting on wrong space, tutorial space showing on game board
**Root Cause**: CSV data loading from `/public/data/` not `/data/` directory  
**Solution**: Updated correct GAME_CONFIG.csv, added tutorial space filtering in GameBoard.tsx
**Result**: Players now start correctly, clean game board display

*See `TASK_HISTORY.md` for complete technical details*

---

**Development Status**: Core game complete and production-ready. Focus on maintaining architectural quality while extending functionality.