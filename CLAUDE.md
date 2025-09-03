# Claude Programmer Guide: Code2027 Production System

## ⚡ **INSTANT CONTEXT** (Read in 30 seconds)

### **What This Is**
Production-ready TypeScript React game with clean service-oriented architecture. **All anti-patterns eliminated**. Ready for feature development.

### **Architecture Pattern**
```typescript
// ✅ CORRECT: Always use dependency injection
const { dataService, stateService, turnService } = useGameContext();
const result = await turnService.executePlayerAction(playerId, action);

// ❌ FORBIDDEN: Never access global state
window.GameStateManager.doSomething(); // Will not exist
```

### **Current Status**
- **Production Ready**: `npm run dev` fully functional
- **Test Suite**: 95% passing (21 test files) 
- **TypeScript**: Strict mode, 54 files, some compile errors (non-blocking)
- **Architecture**: Service-oriented with dependency injection

---

## 🎯 **CORE PROGRAMMING PRINCIPLES**

### **1. Service-First Architecture**
```typescript
// All business logic lives in services
interface ICardService {
  playCard(playerId: string, cardId: string): Promise<CardPlayResult>;
  drawCards(playerId: string, cardType: string, count: number): Promise<Card[]>;
  // ... other methods
}

// Components are pure UI renderers
export function CardDisplay({ cards, onCardPlay }: CardDisplayProps) {
  const { cardService } = useGameContext();
  
  const handleCardClick = useCallback(async (cardId: string) => {
    const result = await cardService.playCard(playerId, cardId);
    onCardPlay(result);
  }, [cardService, playerId, onCardPlay]);

  return <div>{/* Pure JSX rendering */}</div>;
}
```

### **2. TypeScript Strictness**
```typescript
// ✅ REQUIRED: All interfaces properly typed
interface Player {
  id: string;
  name: string;
  money: number;
  timeRemaining: number;
  cards: Card[];
  currentSpace: string;
}

// ✅ REQUIRED: Service contracts
interface GameServices {
  dataService: IDataService;
  stateService: IStateService;
  turnService: ITurnService;
  cardService: ICardService;
  // ... all services
}

// ❌ FORBIDDEN: Any types
function doSomething(data: any) {} // Never use 'any'
```

### **3. Data Access Patterns**
```typescript
// ✅ CORRECT: Always through DataService
const { dataService } = useGameContext();
const cards = dataService.getCardsByType('W');
const spaceEffects = dataService.getSpaceEffects(spaceName);

// ✅ CORRECT: CSV data validation
if (!dataService.isLoaded()) {
  return <LoadingSpinner />;
}

// ❌ FORBIDDEN: Direct CSV access
import cardsData from './data/cards.csv'; // Never do this
```

---

## 🏗️ **SERVICE ARCHITECTURE GUIDE**

### **Core Services (All Implemented)**
```typescript
DataService      // CSV data access, caching, validation
StateService     // Game state management, immutable updates  
TurnService      // Turn progression, action orchestration
CardService      // Card operations, effect processing
PlayerActionService  // Player command handling
MovementService  // Movement validation, space transitions
GameRulesService // Business rules, win conditions
EffectEngineService  // Card/space effect processing
ResourceService  // Resource management (money/time)
ChoiceService    // Player choice handling
NegotiationService   // Player-to-player interactions
```

### **Service Usage Patterns**
```typescript
// ✅ STANDARD: Service method calls
export function GameComponent() {
  const { turnService, stateService } = useGameContext();
  
  const handleTurnEnd = useCallback(async () => {
    try {
      const result = await turnService.endTurn(currentPlayerId);
      if (result.success) {
        // Handle success
      } else {
        // Handle failure
      }
    } catch (error) {
      console.error('Turn end failed:', error);
    }
  }, [turnService, currentPlayerId]);

  return (
    <TurnControls onEndTurn={handleTurnEnd} />
  );
}
```

---

## 📐 **COMPONENT ARCHITECTURE RULES**

### **Component Guidelines**
- **Size Limit**: <1,000 lines (prefer <400 lines)
- **Responsibility**: UI rendering only, no business logic
- **Data**: All data via props, never global access
- **TypeScript**: All props and state strongly typed
- **Testing**: Every component has tests

### **Component Structure Template**
```typescript
interface ComponentProps {
  // All props explicitly typed
  data: ComponentData;
  loading?: boolean;
  onAction: (action: ComponentAction) => void;
}

export function Component({ 
  data, 
  loading = false, 
  onAction 
}: ComponentProps): JSX.Element {
  // UI-only state
  const [isExpanded, setExpanded] = useState(false);
  
  // Service access for actions only
  const { someService } = useGameContext();
  
  // Event handlers
  const handleClick = useCallback(async () => {
    const result = await someService.performAction(data.id);
    onAction(result);
  }, [someService, data.id, onAction]);
  
  // Loading states
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Pure JSX rendering
  return (
    <div className="component">
      {/* Only UI logic here */}
      <button onClick={handleClick}>
        {isExpanded ? 'Collapse' : 'Expand'}
      </button>
    </div>
  );
}
```

---

## 🧪 **TESTING REQUIREMENTS**

### **Test Structure (21 Files)**
```
tests/
├── E2E-*.test.ts          # End-to-end game scenarios
├── services/*.test.ts     # Service unit tests  
├── components/*.test.tsx  # Component tests with mocked services
└── utils/*.test.ts        # Utility function tests
```

### **Testing Patterns**
```typescript
// ✅ SERVICE TESTS: Mock dependencies
describe('CardService', () => {
  let cardService: CardService;
  let mockDataService: jest.Mocked<IDataService>;
  let mockStateService: jest.Mocked<IStateService>;
  
  beforeEach(() => {
    mockDataService = createMockDataService();
    mockStateService = createMockStateService();
    cardService = new CardService(mockDataService, mockStateService);
  });
  
  it('should play card successfully', async () => {
    // Arrange
    mockDataService.getCardById.mockReturnValue(mockCard);
    mockStateService.getPlayer.mockReturnValue(mockPlayer);
    
    // Act
    const result = await cardService.playCard('player1', 'card1');
    
    // Assert
    expect(result.success).toBe(true);
  });
});

// ✅ COMPONENT TESTS: Mock services
describe('CardDisplay', () => {
  const mockServices = createMockServices();
  
  it('should render cards correctly', () => {
    render(
      <GameContextProvider services={mockServices}>
        <CardDisplay cards={mockCards} onCardPlay={jest.fn()} />
      </GameContextProvider>
    );
    
    expect(screen.getByText('Mock Card')).toBeInTheDocument();
  });
});
```

---

## 🚨 **FORBIDDEN PATTERNS** (Will Break Architecture)

```typescript
// ❌ NEVER: Global access
window.GameStateManager.doSomething();
window.someGlobal = value;

// ❌ NEVER: Direct mutations  
player.money += amount;
gameState.currentPlayer = nextPlayer;

// ❌ NEVER: Mixed responsibilities
function Component() {
  // Business logic in UI component
  const calculateWinCondition = () => { /* ... */ };
  const updateDatabase = () => { /* ... */ };
  return <div>{/* UI */}</div>;
}

// ❌ NEVER: Service Locator pattern
const service = ServiceContainer.get('CardService');

// ❌ NEVER: Untyped code
function doSomething(data: any): any { /* ... */ }

// ❌ NEVER: React.createElement (use JSX)
return React.createElement('div', { className: 'card' }, content);
```

---

## ⚙️ **DEVELOPMENT WORKFLOW**

### **Daily Commands**
```bash
cd /mnt/d/unravel/current_game/code2027

# Development
npm run dev           # Start dev server (port 3007)
npm run test          # Run test suite
npm run test:watch    # Watch mode for TDD
npm run typecheck     # Check TypeScript
npm run lint          # Lint code

# Production
npm run build         # Build for production
npm run preview       # Preview production build
```

### **File Organization**
```
src/
├── services/         # Business logic (11 services)
├── components/       # UI components (33 files)  
├── types/           # TypeScript interfaces
├── utils/           # Pure utility functions
├── context/         # React context providers
└── App.tsx          # Main application
```

---

## 🎯 **CURRENT PRIORITIES** (See TODO.md)

### **🔥 Priority 1: Critical**
- [ ] Fix EndGameModal timeout (1 failing test)
- [ ] Resolve 89 TypeScript errors

### **🎯 Priority 2: Features**
- [ ] Implement missing card effects
- [ ] Add advanced negotiation
- [ ] Complete win condition variations

### **🔧 Priority 3: Quality**
- [ ] Performance optimization  
- [ ] Bundle size reduction
- [ ] Enhanced logging

---

## 🔍 **QUICK DEBUGGING**

### **Common Issues**
```typescript
// Issue: Service not found
// Solution: Check GameContextProvider wraps component
const { cardService } = useGameContext(); // Must be inside provider

// Issue: TypeScript errors  
// Solution: Check service contracts
interface IMyService extends BaseService {
  // All methods must match implementation
}

// Issue: Tests failing
// Solution: Check mock implementations
const mockService = {
  method: jest.fn().mockResolvedValue(expectedResult)
};

// Issue: Component too large
// Solution: Extract into smaller components
// Rule: <400 lines preferred, <1,000 lines maximum
```

### **Performance Monitoring**
```typescript
// Add performance markers for slow operations
performance.mark('card-play-start');
const result = await cardService.playCard(playerId, cardId);
performance.mark('card-play-end');
performance.measure('card-play', 'card-play-start', 'card-play-end');
```

---

## 👥 **GEMINI PM COLLABORATION PROTOCOLS**

### **Gemini as Project Manager**
Gemini (Google's AI) serves as the **Project Manager** for code2027. Follow these collaboration protocols:

### **Task Assignment & Coordination**
```typescript
// When Gemini assigns tasks:
// 1. Acknowledge the task assignment
// 2. Clarify requirements if needed  
// 3. Provide time estimates
// 4. Update TODO.md with progress
// 5. Report completion with details

// Example acknowledgment:
"Acknowledged: Implementing card effect system for L005 cards. 
 Estimated time: 2 hours. Will update CardService and add tests."
```

### **Status Reporting to Gemini**
```markdown
## Status Update Format:
**Task**: [Task description]
**Progress**: [Percentage or milestone completed]
**Blockers**: [Any impediments or questions]
**Next Steps**: [What's planned next]
**ETA**: [Estimated completion time]

## Example:
**Task**: Fix EndGameModal timeout issue
**Progress**: 80% - Identified root cause in test setup
**Blockers**: Need clarification on expected modal behavior
**Next Steps**: Implement timeout handling, update tests
**ETA**: 30 minutes
```

### **Decision Making Protocol**
```typescript
// Architecture Decisions: Claude leads, inform Gemini
const architecturalChange = {
  decision: "Add new TargetingService for multi-player card effects",
  rationale: "Separates targeting logic from CardService",
  impact: "No breaking changes, enhances testability",
  implementation: "2 hours estimated"
};
// Report to Gemini after implementation

// Product Decisions: Gemini leads, Claude implements  
interface ProductDecision {
  feature: string;
  priority: 'P1' | 'P2' | 'P3';
  requirements: string[];
  acceptance_criteria: string[];
}
// Wait for Gemini approval before major features
```

### **Code Review Process**
```typescript
// When completing significant work:
// 1. Document what was implemented
// 2. Run full test suite  
// 3. Check TypeScript compliance
// 4. Update TODO.md status
// 5. Notify Gemini with summary

// Example completion report:
"✅ COMPLETED: TurnService test fixes
- Fixed all 20/20 TurnService tests
- Resolved mock implementation issues  
- Added comprehensive error handling
- All tests passing, no regressions
- Ready for next task assignment"
```

### **Priority Escalation**
```typescript
// When to escalate to Gemini:
const escalationTriggers = {
  blockedByRequirements: "Need product clarification",
  technicalComplexity: "Requires architectural decision", 
  timeOverrun: "Task exceeding estimate by >50%",
  testFailures: "Critical tests failing, unclear expectations",
  conflictingPriorities: "Multiple P1 tasks, need prioritization"
};

// Escalation format:
"🚨 ESCALATION NEEDED
Issue: [Brief description]  
Context: [What was attempted]
Decision Required: [Specific question for Gemini]
Impact: [What's blocked]
Suggested Options: [2-3 potential solutions]"
```

### **Communication Style with Gemini**
- **Be concise**: Gemini manages multiple priorities
- **Be specific**: Include file names, line numbers, error messages
- **Be proactive**: Suggest solutions, not just problems  
- **Be transparent**: Report both progress and blockers
- **Be collaborative**: Recognize Gemini's PM role in decisions

### **Regular Check-ins**
- **Daily**: Update TODO.md with progress
- **Weekly**: Comprehensive status report to Gemini
- **Ad-hoc**: Escalate blockers immediately
- **Milestone**: Full completion report with metrics

---

## 📚 **REFERENCE DOCUMENTATION**

- **TODO.md** - Current priorities and task tracking
- **DEVELOPMENT.md** - Project status and work history  
- **TECHNICAL_DEEP_DIVE.md** - Architecture details
- **src/types/ServiceContracts.ts** - All service interfaces
- **DATA_STRUCTURE.md** - CSV data specifications

---

## 🤝 **COLLABORATION SUMMARY**

**Claude Role**: Lead Programmer - Technical implementation, architecture maintenance, code quality
**Gemini Role**: Project Manager - Task prioritization, requirements, timeline management, product decisions

**Success Pattern**: 
1. Gemini assigns priorities → 2. Claude implements with quality → 3. Regular status updates → 4. Collaborative problem-solving → 5. Delivery with documentation

---

**Remember**: This is a production system with clean architecture. Focus on maintaining the established patterns, adding features through services, and keeping components purely for UI rendering. **Coordinate with Gemini PM** on priorities and report progress regularly.

---

*Last Updated: September 2, 2025*  
*Project Status: Production Ready*  
*Next Focus: Feature Development & Code Quality*  
*PM Collaboration: Active with Gemini*