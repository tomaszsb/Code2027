# Technical Deep Dive: Code2027 Project

**Objective:** Transform the critically broken `code2026` prototype into a robust, scalable, and maintainable application (`code2027`) by eliminating severe technical debt and implementing modern software architecture patterns.

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

## 🃏 Card System Architecture

The card system is a core component of the game's mechanics. It is designed to be robust, extensible, and easy to maintain.

### Card Service (`CardService.ts`)

The `CardService` is the heart of the card system. It is responsible for all business logic related to cards, including:

*   **Playing Cards:** The `playCard` method is the main entry point for playing a card. It handles validation, effect application, and state changes.
*   **Card State Management:** The service correctly handles the different states of a card:
    *   **Available:** Cards that are in the player's hand and can be played.
    *   **Active:** Cards that have been played and have an ongoing effect with a specific duration.
    *   **Discarded:** Cards that have been played and their effect has been resolved, or active cards that have expired.
*   **Card Expiration:** The `endOfTurn` method is called by the `TurnService` at the end of each turn to process card expirations.
*   **Card Transfer:** The `transferCard` method allows players to give "E" (Expeditor) and "L" (Life Events) cards to other players.

### Card-Related Components

*   **`CardPortfolioDashboard.tsx`:** This component provides a comprehensive view of the player's card portfolio, including their available, active, and discarded cards.
*   **`CardDetailsModal.tsx`:** This modal component displays the full details of a selected card, including its name, description, effects, cost, duration, and phase restriction. It also provides the UI for the card transfer functionality.

---

## Development Standards & Guidelines

## 🏗️ Code Quality Standards

### File Size Enforcement:
- **Components**: <200 lines (hard limit) - Break down into smaller, focused components
- **Services**: <300 lines (split if larger into focused services)
- **Utilities**: <150 lines (single-purpose functions)
- **Tests**: No limit (comprehensive coverage required)

### Architecture Quality Checklist:
- [x] No `window.*` access anywhere (use dependency injection)
- [x] All dependencies injected via props/constructor
- [x] TypeScript types for all interfaces and function signatures
- [ ] Unit tests for all business logic
- [ ] Component tests for all UI components
- [x] File size limits respected
- [x] Single responsibility principle followed
- [x] CSV data accessed only through DataService

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

## 🚀 The Unified Effect Engine

The **Unified Effect Engine** is the crown achievement of the code2027 refactor. It represents a complete paradigm shift from the fragmented, ad-hoc game logic of code2026 to a centralized, standardized system for handling all game events.

### Core Concept

All game events in code2027 - whether triggered by cards, spaces, dice rolls, or player actions - are translated into standardized `Effect` objects. This creates a single, unified pipeline for processing all game logic, eliminating code duplication and ensuring consistent behavior across all game mechanics.

```typescript
// Data Flow: Event Source -> EffectFactory -> Effect[] -> EffectEngineService -> State Change

Card Play Event     →  EffectFactory  →  [ResourceChangeEffect, CardDrawEffect]  →  EffectEngineService  →  Player State Update
Space Entry Event   →  EffectFactory  →  [MovementChoiceEffect, TimeEffect]     →  EffectEngineService  →  Game State Update  
Dice Roll Event     →  EffectFactory  →  [TurnControlEffect]                    →  EffectEngineService  →  Turn State Update
```

### The Three Key Components

#### 1. **EffectFactory** (`src/utils/EffectFactory.ts`)
**Role**: Converts raw game data into standardized Effect objects, decoupling the engine from data sources.

```typescript
// Transforms CSV data into executable effects
EffectFactory.createEffectsFromSpaceEffects(spaceEffects, context)
EffectFactory.createEffectsFromCardData(cardData, playerId)
EffectFactory.createEffectsFromDiceEffects(diceEffects, context)
```

The EffectFactory eliminates the need for the engine to understand CSV structures, card formats, or data schemas. It acts as a translation layer, ensuring that all game data - regardless of source - becomes a consistent array of Effect objects.

#### 2. **Effect Types** (Discriminated Union Pattern)
**Role**: Standardized data structures representing all possible game actions.

The system defines **9 core Effect types** using TypeScript's discriminated union pattern:

```typescript
type Effect = 
  | ResourceChangeEffect     // Money, time, reputation changes
  | CardDrawEffect          // Drawing cards from decks
  | CardDiscardEffect       // Discarding cards from hand
  | CardActivationEffect    // Activating cards with duration
  | MovementChoiceEffect    // Player movement decisions
  | TurnControlEffect       // Turn skipping, extra turns
  | EffectGroupTargeted     // Multi-player targeting effects
  | ConditionalEffect       // Conditional logic (scope, dice conditions)
  | RecalculateScopeEffect  // Project scope recalculation for W cards
```

Each effect type carries all necessary data for execution, creating a self-contained instruction set that the engine can process uniformly.

#### 3. **EffectEngineService** (`src/services/EffectEngineService.ts`)
**Role**: Central processor that executes Effect arrays by calling appropriate low-level services.

```typescript
// Single entry point for all game logic
await effectEngineService.executeEffects(effects, context);

// Internally routes to specialized services:
// ResourceChangeEffect    → ResourceService.adjustResource()
// CardDrawEffect          → CardService.drawCards()  
// MovementChoiceEffect    → MovementService + ChoiceService
// TurnControlEffect       → TurnService.setTurnModifier()
// RecalculateScopeEffect  → GameRulesService.calculateProjectScope()
```

The EffectEngineService acts as an orchestration layer, taking arrays of Effect objects and systematically executing them through the appropriate domain services (ResourceService, CardService, etc.).

### Benefits Achieved

1. **Centralized Logic**: All game mechanics flow through a single, testable pipeline
2. **Data Independence**: Game logic is completely decoupled from CSV structures
3. **Consistent Behavior**: All events follow the same execution patterns
4. **Easy Extension**: New effect types can be added without changing existing code
5. **Comprehensive Testing**: Single engine can be tested against all game scenarios

This architecture transformation eliminated the Service Locator anti-patterns, God Objects, and event spaghetti that plagued code2026, replacing them with a clean, predictable, and maintainable system.

---

## 🏛️ State Management Philosophy

### The Redux Alternative Decision

The original `REFACTORING_ROADMAP.md` considered adopting a formal state management library like Redux, which is a common choice for complex React applications requiring centralized state management. However, after careful architectural analysis, we implemented a **custom StateService** instead.

### Rationale Behind the Custom StateService

#### **1. Simplicity & Control**
Our custom StateService gives us complete control over state management logic without the boilerplate and complexity that accompanies large libraries like Redux. We avoided:
- Action creators, reducers, and middleware setup
- Complex debugging tools and DevTools integration overhead  
- Learning curve for team members unfamiliar with Redux patterns
- Rigid architectural constraints that may not fit our specific use case

```typescript
// Our Simple Approach
stateService.updatePlayer({ id: 'player1', money: 500 });

// vs Redux Approach
dispatch(updatePlayerMoney('player1', 500));
// + action creator + reducer + type definitions
```

#### **2. Performance Optimization**
For our specific board game use case, a simple, observable-based service delivers superior performance:
- **Direct Updates**: No action dispatching overhead or reducer processing chains
- **Targeted Subscriptions**: Components subscribe only to relevant state changes  
- **Minimal Re-renders**: Precise control over when and how components update
- **Memory Efficiency**: No action history, time travel, or debugging overhead in production

#### **3. Dependency-Free Architecture**
Keeping our core state logic free from third-party library dependencies provides several advantages:
- **Future-Proof**: No risk of Redux version conflicts, breaking changes, or library abandonment
- **Bundle Size**: Reduced application bundle size without Redux, React-Redux, and related dependencies
- **Testing Simplicity**: Pure TypeScript service logic is easier to unit test than Redux integration
- **Portability**: StateService could be adapted to other frameworks beyond React if needed

#### **4. Sufficiency for Our Use Case**
Our StateService, combined with React Context API (`useGameContext`), provides comprehensive functionality:

```typescript
// Complete State Management Features Achieved:
✅ Centralized state management through StateService
✅ Immutable state updates with proper type safety  
✅ Component subscriptions via React Context
✅ Real-time UI updates across all components
✅ State validation and business rule enforcement
✅ Easy debugging with straightforward service calls
```

### Implementation Benefits Realized

The custom StateService approach has proven its value throughout development:

1. **Rapid Development**: No learning curve or Redux setup overhead
2. **Clear Debugging**: Direct service calls are easy to trace and debug
3. **Type Safety**: Full TypeScript integration without Redux type complexity
4. **Performance**: Minimal overhead with targeted updates
5. **Maintainability**: Simple, readable code that team members can quickly understand

### Context API Integration

The StateService integrates seamlessly with React's Context API through our `useGameContext()` hook:

```typescript
// Clean Service Access Pattern
const { stateService, cardService, turnService } = useGameContext();

// Direct service calls with full TypeScript support
const player = stateService.getPlayer(playerId);
const result = cardService.playCard(playerId, cardId);
```

This hybrid approach combines the benefits of centralized state management with the simplicity of direct service calls, proving that complex applications don't always require complex state management libraries.

**Conclusion**: The custom StateService decision demonstrates that **architectural choices should be driven by actual requirements rather than popular trends**. For code2027's board game mechanics, our lightweight, purpose-built solution delivers superior performance, maintainability, and developer experience compared to a heavyweight library like Redux.

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