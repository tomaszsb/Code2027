// tests/utils/vitestMocks.ts
// Vitest-compatible lightweight mock services

import { 
  TEST_PLAYERS, 
  TEST_CARDS
} from '../fixtures/testData';

// Vitest-compatible fast mock DataService
export const createFastMockDataService = () => ({
  isLoaded: vi.fn(() => true),
  loadData: vi.fn(async () => Promise.resolve()),
  
  // Card access
  getCardById: vi.fn((id: string) => TEST_CARDS.find(card => card.id === id)),
  getCardsByType: vi.fn((type: string) => TEST_CARDS.filter(card => card.type === type)),
  getCards: vi.fn(() => TEST_CARDS),
  getAllCardTypes: vi.fn(() => ['W', 'B', 'E', 'L', 'I']),
  
  // Space access  
  getAllSpaces: vi.fn(() => []),
  getSpaceByName: vi.fn(() => undefined),
  getSpaceEffects: vi.fn(() => []),
  getSpaceContent: vi.fn(() => undefined),
  getMovement: vi.fn(() => undefined),
  getDiceOutcome: vi.fn(() => undefined),
  getDiceEffects: vi.fn(() => []),
  
  // Game config
  getGameConfig: vi.fn(() => []),
  getGameConfigBySpace: vi.fn(() => undefined),
  getPhaseOrder: vi.fn(() => ['Design', 'Funding', 'Construction', 'Operations'])
});

// Lightweight ResourceService mock for Vitest
export const createLightweightResourceService = () => ({
  addMoney: vi.fn(async (playerId: string, amount: number, reason?: string) => Promise.resolve()),
  spendMoney: vi.fn(async (playerId: string, amount: number, reason?: string) => Promise.resolve()),
  canAfford: vi.fn((playerId: string, amount: number) => true),
  
  addTime: vi.fn(async (playerId: string, amount: number, reason?: string) => Promise.resolve()),
  spendTime: vi.fn(async (playerId: string, amount: number, reason?: string) => Promise.resolve()),
  
  updateResources: vi.fn(async (playerId: string, moneyChange: number, timeChange: number, reason?: string) => Promise.resolve()),
  
  validateResourceChange: vi.fn((playerId: string, moneyChange: number, timeChange: number) => 
    ({ valid: true, errors: [] }))
});

// Lightweight StateService mock for Vitest
export const createLightweightStateService = () => ({
  isStateLoaded: vi.fn(() => true),
  getGameState: vi.fn(() => ({
    currentPlayer: 'player1',
    phase: 'PLAY',
    turn: 1,
    players: TEST_PLAYERS,
    gamePhase: 'PLAY',
    gameStarted: true,
    gameEnded: false,
    winner: null,
    maxPlayers: 6,
    decks: {
      W: { cards: [], shuffled: true },
      B: { cards: [], shuffled: true },
      E: { cards: [], shuffled: true },
      L: { cards: [], shuffled: true },
      I: { cards: [], shuffled: true }
    },
    discardPiles: { W: [], B: [], E: [], L: [], I: [] },
    actionHistory: [],
    modal: null,
    awaitingChoice: null,
    negotiationState: null,
    preSpaceEffectSnapshot: null
  })),
  
  getPlayer: vi.fn((id: string) => TEST_PLAYERS.find(p => p.id === id) || TEST_PLAYERS[0]),
  getAllPlayers: vi.fn(() => TEST_PLAYERS),
  updatePlayer: vi.fn(async (player) => Promise.resolve()),
  addPlayer: vi.fn(async (player) => Promise.resolve()),
  
  setCurrentPlayer: vi.fn(async (playerId: string) => Promise.resolve()),
  setGamePhase: vi.fn(async (phase: string) => Promise.resolve()),
  advanceTurn: vi.fn(async () => Promise.resolve()),
  nextPlayer: vi.fn(async () => Promise.resolve()),
  
  initializeGame: vi.fn(async (players) => Promise.resolve()),
  startGame: vi.fn(async () => Promise.resolve()),
  updateGameState: vi.fn(async (updates) => Promise.resolve()),
  updateActionCounts: vi.fn(async (playerId, requiredActions, completedActions) => Promise.resolve())
});

// Factory function to create all Vitest mocks
export const createVitestMockServices = () => ({
  dataService: createFastMockDataService(),
  stateService: createLightweightStateService(),
  resourceService: createLightweightResourceService()
});