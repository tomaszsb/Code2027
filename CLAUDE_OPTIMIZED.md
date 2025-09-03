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

### **4. State Management**
```typescript
// ✅ CORRECT: Immutable updates through StateService
const { stateService } = useGameContext();
await stateService.updatePlayer(playerId, { money: newMoney });

// ✅ CORRECT: React state for UI-only state
const [isModalOpen, setModalOpen] = useState(false);

// ❌ FORBIDDEN: Direct mutations
player.money += amount; // Never mutate directly
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

## 📚 **REFERENCE DOCUMENTATION**

- **TODO.md** - Current priorities and task tracking
- **DEVELOPMENT.md** - Project status and work history  
- **TECHNICAL_DEEP_DIVE.md** - Architecture details
- **src/types/ServiceContracts.ts** - All service interfaces
- **DATA_STRUCTURE.md** - CSV data specifications

---

**Remember**: This is a production system with clean architecture. Focus on maintaining the established patterns, adding features through services, and keeping components purely for UI rendering. The hard architectural work is done - now build great features on this solid foundation.

---

*Last Updated: September 2, 2025*  
*Project Status: Production Ready*  
*Next Focus: Feature Development & Code Quality*