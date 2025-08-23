# Technical Deep Dive: Code2027 Project

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

---

## Development Standards & Guidelines

## 🏗️ Code Quality Standards

### File Size Enforcement:
- **Components**: <200 lines (hard limit) - Break down into smaller, focused components
- **Services**: <300 lines (split if larger into focused services)
- **Utilities**: <150 lines (single-purpose functions)
- **Tests**: No limit (comprehensive coverage required)

### Architecture Quality Checklist:
- [ ] No `window.*` access anywhere (use dependency injection)
- [ ] All dependencies injected via props/constructor
- [ ] TypeScript types for all interfaces and function signatures
- [ ] Unit tests for all business logic
- [ ] Component tests for all UI components
- [ ] File size limits respected
- [ ] Single responsibility principle followed
- [ ] CSV data accessed only through DataService

### Component Development Guidelines:
- **Single Responsibility**: UI rendering only, no business logic
- **Props-Based Data**: All data via props, no global state access
- **TypeScript Required**: All props and state fully typed
- **Service Integration**: Use `useGameContext()` hook for service access
- **Error Handling**: Graceful error handling with user feedback

### Service Development Guidelines:
- **Dependency Injection**: Constructor-based injection of dependencies
- **Interface Contracts**: Implement defined interfaces from ServiceContracts.ts  
- **Immutable Patterns**: Return new objects, never mutate existing state
- **Error Handling**: Comprehensive try-catch with meaningful error messages
- **Testing**: 90%+ test coverage with both success and error scenarios

---

### Architectural Patterns Established 🏗️

The recent work has successfully established key architectural patterns that resolve the critical gaps identified in the audit:

#### **1. Service-Oriented Architecture (SOA) - PROVEN**
```typescript
// Clean service orchestration established
PlayerActionService → DataService + StateService + GameRulesService
```
- **Single Responsibility:** Each service has a focused, well-defined role
- **Dependency Injection:** All services receive dependencies via constructor
- **Interface Contracts:** Proper TypeScript interfaces define service boundaries
- **Testability:** Services can be tested in isolation with mocked dependencies

#### **2. UI-to-Service Communication Pattern - ESTABLISHED**
```typescript
// Pattern now established for all future UI components
const { playerActionService, stateService } = useGameContext();

const handleAction = async () => {
  try {
    await playerActionService.someAction(params);
    // Handle success
  } catch (error) {
    // Handle error with user feedback
  }
};
```
- **Hook-Based Access:** useGameContext() provides clean service access
- **Async Error Handling:** Consistent try-catch with user feedback
- **State Integration:** Automatic UI updates through service state changes
- **Type Safety:** Full TypeScript coverage from UI to services

#### **3. Data-Driven Architecture - IMPLEMENTED**
```typescript
// CSV data properly integrated throughout stack
DataService.loadCards() → Card[] → PlayerActionService.playCard() → UI Updates
```
- **Single Source of Truth:** All card data comes from CSV files
- **Validation Pipeline:** Data validated at load time and usage time
- **Type Safety:** Full TypeScript types from CSV to UI
- **Error Resilience:** Comprehensive error handling at each layer

#### **4. Testing Strategy - PROVEN**
```typescript
// Comprehensive testing patterns established
- Service Unit Tests: Mock dependencies, test business logic
- Integration Tests: Verify service interactions
- Component Tests: Mock useGameContext, test UI integration
```
- **Mock-Based Testing:** Clean isolation with jest mocks
- **Error Scenario Coverage:** Test both success and failure paths
- **Service Contract Testing:** Verify interface compliance
- **Integration Validation:** Test service interaction patterns
