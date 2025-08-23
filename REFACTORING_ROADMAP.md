# Code2027: Complete Refactoring Roadmap

**Objective:** Transform the critically broken `code2026` prototype into a robust, scalable, and maintainable application (`code2027`) by eliminating severe technical debt and implementing modern software architecture patterns.

**CRITICAL STATUS**: Code2026 exhibits Service Locator anti-patterns, God Objects, and fragmented architecture requiring complete rebuild, not incremental fixes.

**Revised Timeline:** 8-10 Weeks (Realistic Effort) - *Originally 6 weeks was too aggressive*

---

## ARCHITECTURAL PROBLEMS TO SOLVE

### Current Code2026 Issues:
- **Service Locator Anti-Pattern**: 312 `window.*` calls creating untestable, tightly-coupled code
- **God Objects**: GameStateManager.js (30,133+ tokens) violating single responsibility  
- **Mixed Responsibilities**: Components handling UI + business logic + state management
- **Event Spaghetti**: 106 events across 31 files creating debugging nightmares
- **React Anti-Patterns**: 940 `React.createElement` calls instead of JSX
- **File Size Violations**: 4 files >500 lines, 10 files >300 lines
- **No Testing**: 0% test coverage, no type safety

### Target Architecture:
- **Dependency Injection**: All services injected via props/constructor
- **Service-Oriented**: Single-responsibility services handling business logic
- **Component-Based**: UI components <200 lines, pure rendering only
- **TypeScript**: 90%+ type coverage with strict mode
- **Comprehensive Testing**: 80%+ test coverage with meaningful tests

---

## PHASE 1: Foundation (Weeks 1-3) - CRITICAL ⚠️

*Extended timeline due to severity of architectural problems*

### 1.1 Eliminate Service Locator Anti-Pattern
**Goal:** Eradicate all 312 calls to global `window.*` singletons

**Week 1 Actions:**
```typescript
// Create dependency injection foundation
src/context/GameContext.ts              // Service container with typed interfaces
src/context/ServiceProvider.tsx         // React context provider for DI
src/types/ServiceContracts.ts           // All service interface definitions
```

**Week 1 Targets:**
- [ ] GameContext with typed service container
- [ ] First 50 `window.*` calls replaced with DI
- [ ] Service interfaces defined
- [ ] Basic DI pattern working in 3-5 components

### 1.2 Create Services Architecture  
**Goal:** Extract business logic from God Objects into focused services

**Week 2-3 Services to Create:**
```typescript
src/services/
├── DataService.ts          // CSV data access wrapper (Week 2)
├── StateService.ts         // Immutable state management (Week 2)  
├── TurnService.ts          // Turn progression logic (Week 2)
├── CardService.ts          // Card operations & deck management (Week 3)
├── PlayerActionService.ts  // Command handling & orchestration (Week 3)
├── MovementService.ts      // Movement logic extraction (Week 3)
└── GameRulesService.ts     // Business rules validation (Week 3)
```

**Service Implementation Pattern:**
```typescript
// Example service structure
export class CardService {
  constructor(
    private dataService: DataService,
    private stateService: StateService
  ) {}

  playCard(playerId: string, cardId: string): CardPlayResult {
    // Pure business logic, no side effects
    const card = this.dataService.getCard(cardId);
    const player = this.stateService.getPlayer(playerId);
    
    // Validation & business rules
    const validation = this.validateCardPlay(player, card);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Pure computation, return result
    return { success: true, effects: this.calculateCardEffects(card, player) };
  }
}
```

### 1.3 Break Down God Objects
**Goal:** Reduce GameStateManager from 30K+ tokens to <5K tokens

**GameStateManager.js Refactoring:**
- **Keep (Week 2):** 
  - State storage (`players`, `currentPlayer`, `turnCount`)
  - Event bus (`on`, `emit`, `off` methods)
  - Basic getters/setters (`getPlayer`, `setState`)
- **Extract (Week 2-3):**
  - Turn logic → `TurnService`
  - Card logic → `CardService` 
  - Movement logic → `MovementService`
  - Business rules → `GameRulesService`
- **Remove (Week 2):**
  - UI state (`activeModal`, `showingSpace`, etc.) → Component state
  - Direct effect processing → Service layer

**GameManager.js Elimination:**
- **Week 3:** Delete file entirely
- **Migrate:** Event orchestration → `PlayerActionService`
- **Migrate:** Business logic → Appropriate services

**Phase 1 Milestone Targets:**
- [ ] 6 core services implemented with TypeScript
- [ ] GameStateManager reduced to <5K tokens
- [ ] GameManager.js deleted
- [ ] 200+ `window.*` calls eliminated
- [ ] All services have comprehensive unit tests
- [ ] 0 regressions in core game functionality

---

## PHASE 2: Component Architecture (Weeks 4-6)

### 2.1 Component Size Reduction & Single Responsibility
**Goal:** All components <200 lines, UI rendering only

**Week 4 Targets:**
```typescript
// Current → Target decomposition
FixedApp.js (693 lines) → 
├── App.tsx (~100 lines)                 // Composition root
├── GameLayout.tsx (~150 lines)          // Layout container  
├── ServiceProvider.tsx (~50 lines)      // DI provider

CardModalContent.js (705 lines) →
├── CardModal.tsx (~100 lines)           // Modal container
├── CardContent.tsx (~150 lines)         // Card display
└── CardActions.tsx (~100 lines)         // Action buttons

EnhancedPlayerSetup.js (575 lines) →
├── PlayerSetup.tsx (~100 lines)         // Setup container
├── PlayerForm.tsx (~150 lines)          // Form handling
├── PlayerValidation.tsx (~100 lines)    // Validation logic
└── PlayerList.tsx (~80 lines)           // Player display
```

**Week 5-6 Targets:**
- [ ] All components converted to TypeScript
- [ ] All components <200 lines (hard limit)
- [ ] All components receive data via props only
- [ ] No business logic in UI components
- [ ] Component tests for all new components

### 2.2 Separation of Concerns Implementation
**Goal:** Strict UI/Business logic separation

**Component Pattern (Enforced):**
```typescript
interface ComponentProps {
  data: ComponentData;              // All data via props
  actions: ComponentActions;        // All actions via props
}

export function GameComponent({ data, actions }: ComponentProps): JSX.Element {
  // ONLY UI rendering and user input handling
  // NO business logic
  // NO direct service calls
  // NO state mutations
  
  return (
    <div className="game-component">
      {data.items.map(item => (
        <ItemComponent 
          key={item.id}
          item={item}
          onAction={actions.handleItemAction}
        />
      ))}
    </div>
  );
}
```

### 2.3 Event System Simplification
**Goal:** Reduce from 106 events to <20 core events

**Week 5-6 Event Cleanup:**
```typescript
// BEFORE: Event chaos (106 events)
gameStateManager.emit('showCardReplacement', ...);
gameStateManager.emit('showCardReplacementModal', ...);
gameStateManager.emit('cardReplacementConfirmed', ...);

// AFTER: Clean Command/Event pattern (<20 events)
// Commands (user intent)
playerActionService.executeCommand('PLAY_CARD', { playerId, cardId });

// Events (facts that occurred)  
stateService.emit('CARD_WAS_PLAYED', { playerId, cardId, effects });
stateService.emit('TURN_DID_END', { previousPlayer, currentPlayer });
```

**Core Events (Final List):**
- `GAME_STARTED`, `GAME_ENDED`
- `TURN_STARTED`, `TURN_ENDED` 
- `CARD_WAS_PLAYED`, `CARD_WAS_DRAWN`
- `PLAYER_MOVED`, `PLAYER_STATE_CHANGED`
- `DICE_WAS_ROLLED`, `ACTION_WAS_COMPLETED`

---

## PHASE 3: Modern Patterns (Weeks 7-8)

### 3.1 TypeScript Implementation (Priority #1)
**Goal:** 90%+ TypeScript coverage with strict mode

**Week 7 TypeScript Conversion:**
```typescript
// Core type definitions
src/types/
├── GameTypes.ts           // Player, GameState, Card interfaces
├── ServiceTypes.ts        // All service contracts
├── ComponentTypes.ts      // Component props & state
├── EventTypes.ts          // Typed events and payloads
└── UtilityTypes.ts        // Helper and utility types

// Example game types
interface Player {
  id: string;
  name: string;
  position: string;
  money: number;
  timeSpent: number;
  cards: PlayerCards;
}

interface GameState {
  players: Player[];
  currentPlayer: string;
  turnCount: number;
  gamePhase: GamePhase;
}

// Service contracts
interface CardService {
  playCard(playerId: string, cardId: string): Promise<CardPlayResult>;
  drawCard(playerId: string, cardType: CardType): Promise<Card[]>;
  validateCardPlay(playerId: string, cardId: string): ValidationResult;
}
```

**Week 7 Targets:**
- [ ] All services typed with strict interfaces
- [ ] All components typed with prop interfaces  
- [ ] All events typed with payload interfaces
- [ ] TypeScript strict mode enabled
- [ ] Build process updated for TypeScript

### 3.2 JSX Conversion (Background Task)
**Goal:** Replace 940 `React.createElement` calls with JSX

**Strategy:** File-by-file conversion during regular development
- **Priority:** Low - do as components are touched
- **Benefit:** Developer experience, not architectural
- **Timeline:** Ongoing background task, not blocking

**Week 8 JSX Targets:**
- [ ] 50% of components converted to JSX
- [ ] JSX linting rules configured
- [ ] Build process supports JSX compilation

---

## PHASE 4: Advanced Patterns & Quality (Weeks 9-10)

### 4.1 State Management Replacement
**Goal:** Replace custom event bus with Redux Toolkit

**Week 9 State Management:**
```typescript
// Redux store with service integration
const store = configureStore({
  reducer: {
    game: gameReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: {
          dataService,
          turnService,
          cardService,
          playerActionService
        }
      }
    })
});

// Typed thunk actions
export const playCardThunk = createAsyncThunk<
  CardPlayResult,
  { playerId: string; cardId: string },
  { extra: GameServices }
>('game/playCard', async ({ playerId, cardId }, { extra }) => {
  return await extra.cardService.playCard(playerId, cardId);
});
```

### 4.2 Comprehensive Testing & Quality
**Goal:** 80%+ test coverage with meaningful tests

**Week 10 Testing Infrastructure:**
```typescript
tests/
├── services/
│   ├── CardService.test.ts      // Business logic tests
│   ├── TurnService.test.ts      // Turn progression tests  
│   └── DataService.test.ts      // Data access tests
├── components/
│   ├── CardComponent.test.tsx   // UI component tests
│   ├── GameBoard.test.tsx       // Layout component tests
│   └── PlayerSetup.test.tsx     // Form component tests
├── integration/
│   ├── GameFlow.test.ts         // End-to-end game flow
│   ├── CardPlay.test.ts         // Card play integration
│   └── TurnProgression.test.ts  // Turn system integration
└── utils/
    ├── TestHelpers.ts           // Test utilities
    └── MockServices.ts          // Service mocks
```

**Testing Requirements:**
- [ ] All services: >95% unit test coverage
- [ ] All components: Render & interaction tests
- [ ] Integration tests: Core game flows
- [ ] E2E tests: Complete game scenarios
- [ ] Performance tests: Render times & memory usage

---

## SUCCESS METRICS & MILESTONES

### Technical Debt Elimination:
- **Files > 500 lines:** 4 → 0 ✅
- **Files > 300 lines:** 10 → 2 (only test files)
- **Global `window.*` calls:** 312 → 0 ✅
- **Event emissions:** 106 → <20 ✅
- **React.createElement calls:** 940 → <50 ✅

### Code Quality Targets:
- **TypeScript coverage:** 0% → 90%+ ✅
- **Test coverage:** 0% → 80%+ ✅
- **Build time:** Current → 50% faster
- **Bundle size:** Measured reduction via tree-shaking
- **Developer onboarding:** Days → Hours

### Architecture Quality:
- **Service boundaries:** Clear single responsibilities
- **Dependency injection:** No global access patterns
- **Immutable updates:** All state changes immutable
- **Error handling:** Comprehensive error boundaries
- **Performance:** <100ms render times

### Phase Gates (Hard Requirements):
- **Phase 1:** All services implemented & tested, 0 regressions
- **Phase 2:** All components <200 lines, full type coverage  
- **Phase 3:** TypeScript strict mode, comprehensive testing
- **Phase 4:** Production-ready with monitoring & documentation

---

## RISK MITIGATION & ROLLBACK PLAN

### High-Risk Areas:
1. **GameStateManager refactoring** - Most critical, highest impact
2. **Event system changes** - Affects all components simultaneously  
3. **State management replacement** - Could break existing functionality

### Mitigation Strategies:
- **Incremental changes** with feature flags for gradual rollout
- **Comprehensive testing** at each milestone before proceeding
- **Parallel development** branches to avoid blocking other work
- **Daily smoke tests** to catch regressions immediately

### Rollback Procedures:
- **Phase 1:** Can revert to code2026 if services fail
- **Phase 2:** Components can be reverted individually  
- **Phase 3:** TypeScript can be disabled, JSX is optional
- **Phase 4:** State management can fall back to event bus

### Success Probability:
- **Original 6-week plan:** 70% (timeline too aggressive)
- **Revised 8-10 week plan:** 90% (realistic scope & timeline)

---

## COMMUNICATION & PROJECT MANAGEMENT

### Weekly Milestones:
- **Week 1:** DataService + DI foundation
- **Week 2:** Core services extraction  
- **Week 3:** GameStateManager refactoring complete
- **Week 4:** Component decomposition
- **Week 5:** Event system cleanup
- **Week 6:** Component testing complete
- **Week 7:** TypeScript conversion
- **Week 8:** JSX conversion & type safety
- **Week 9:** Redux integration
- **Week 10:** Testing & quality assurance

### Daily Standups Required:
- Progress against current week milestones
- Service implementation & testing status
- Architecture decision points & blockers
- Code quality metrics (file sizes, test coverage)
- Integration challenges or regressions

### Stakeholder Updates:
- **Weekly:** Progress dashboard with metrics
- **Bi-weekly:** Architecture review & demos
- **End of phase:** Milestone review & go/no-go decisions

---

**REMEMBER:** This is not incremental improvement—this is a complete architectural rebuild. The code2026 patterns are anti-patterns to be avoided. Success requires discipline to build correctly from the ground up.

---

## PHASE 5: Feature Completion & Polish (Weeks 11-12)

*Goal: Achieve full feature parity with `code2026` and enhance the user experience.*

*   **Implement Game Save/Load:**
    *   Create a `SaveLoadService` to manage game state serialization.
    *   Integrate with `StateService` to get and set the game state.
    *   Add UI components for save/load slots.

*   **Implement Negotiation Service:**
    *   Build out the placeholder `NegotiationService` with full functionality.
    *   Handle player-to-player and space-based negotiation.
    *   Create `NegotiationModal.tsx` for the UI.

*   **Implement UI Feedback & Animations:**
    *   Create a `NotificationService` or similar for toast messages.
    *   Add animations for player movement and card effects.

*   **Enhance UI/UX:**
    *   Implement hand management features (sorting, filtering).
    *   Add a context-sensitive tooltip system.
    *   Implement final score calculation and display it on the end-game screen.

*   **Cross-Cutting Concerns:**
    *   **Accessibility (A11y):** Audit the application and add necessary ARIA attributes and screen reader support.
    *   **Advanced Effects Parsing**: Enhance `TurnService` to handle all conditional logic from the original CSV files.