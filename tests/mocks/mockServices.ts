// tests/mocks/mockServices.ts

/**
 * Centralized Mock Service Utility
 * 
 * This file provides mock creator functions for all core services used in tests.
 * Each function returns a fully mocked service object where every method is an instance of jest.fn().
 * 
 * Usage:
 * import { createMockDataService, createMockStateService } from '../mocks/mockServices';
 * const mockDataService = createMockDataService();
 * const mockStateService = createMockStateService();
 */

import {
  IDataService,
  IStateService,
  IGameRulesService,
  ICardService,
  IResourceService,
  IMovementService,
  INegotiationService,
  IEffectEngineService,
  IChoiceService,
  ITurnService
} from '../../src/types/ServiceContracts';

export const createMockDataService = (): jest.Mocked<IDataService> => ({
  // Configuration methods
  getGameConfig: jest.fn(),
  getGameConfigBySpace: jest.fn(),
  getPhaseOrder: jest.fn(),
  
  // Space methods
  getAllSpaces: jest.fn(),
  getSpaceByName: jest.fn(),
  
  // Movement methods
  getMovement: jest.fn(),
  getAllMovements: jest.fn(),
  
  // Dice outcome methods
  getDiceOutcome: jest.fn(),
  getAllDiceOutcomes: jest.fn(),
  
  // Space effects methods
  getSpaceEffects: jest.fn(),
  getAllSpaceEffects: jest.fn(),
  
  // Dice effects methods
  getDiceEffects: jest.fn(),
  getAllDiceEffects: jest.fn(),
  
  // Content methods
  getSpaceContent: jest.fn(),
  getAllSpaceContent: jest.fn(),
  
  // Card methods
  getCards: jest.fn(),
  getCardById: jest.fn(),
  getCardsByType: jest.fn(),
  getAllCardTypes: jest.fn(),
  
  // Data loading
  isLoaded: jest.fn(),
  loadData: jest.fn()
});

export const createMockStateService = (): jest.Mocked<IStateService> => ({
  // State access methods
  getGameState: jest.fn(),
  getGameStateDeepCopy: jest.fn(),
  isStateLoaded: jest.fn(),
  
  // Subscription methods
  subscribe: jest.fn(),
  
  // Player management methods
  addPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  removePlayer: jest.fn(),
  getPlayer: jest.fn(),
  getAllPlayers: jest.fn(),
  
  // Game flow methods
  setCurrentPlayer: jest.fn(),
  setGamePhase: jest.fn(),
  advanceTurn: jest.fn(),
  nextPlayer: jest.fn(),
  
  // Game lifecycle methods
  initializeGame: jest.fn(),
  startGame: jest.fn(),
  endGame: jest.fn(),
  resetGame: jest.fn(),
  
  // Negotiation management methods
  updateNegotiationState: jest.fn(),
  
  // Utility methods
  fixPlayerStartingSpaces: jest.fn(),
  forceResetAllPlayersToCorrectStartingSpace: jest.fn(),
  
  // Choice management methods
  setAwaitingChoice: jest.fn(),
  clearAwaitingChoice: jest.fn(),
  
  // Turn state management methods
  setPlayerHasMoved: jest.fn(),
  clearPlayerHasMoved: jest.fn(),
  setPlayerCompletedManualAction: jest.fn(),
  setPlayerHasRolledDice: jest.fn(),
  clearPlayerCompletedManualActions: jest.fn(),
  clearPlayerHasRolledDice: jest.fn(),
  updateActionCounts: jest.fn(),
  
  // Modal management methods
  showCardModal: jest.fn(),
  dismissModal: jest.fn(),
  
  // Snapshot management methods
  createPlayerSnapshot: jest.fn(),
  restorePlayerSnapshot: jest.fn(),
  
  // Validation methods
  validatePlayerAction: jest.fn(),
  canStartGame: jest.fn(),
  
  // Action logging methods
  logToActionHistory: jest.fn(),
  
  // Pre-space effect snapshot methods (Try Again feature)
  savePreSpaceEffectSnapshot: jest.fn(),
  clearPreSpaceEffectSnapshot: jest.fn(),
  hasPreSpaceEffectSnapshot: jest.fn(),
  getPreSpaceEffectSnapshot: jest.fn(),
  
  // State management methods
  setGameState: jest.fn()
});

export const createMockGameRulesService = (): jest.Mocked<IGameRulesService> => ({
  // Movement validation methods
  isMoveValid: jest.fn(),
  
  // Card validation methods
  canPlayCard: jest.fn(),
  canDrawCard: jest.fn(),
  
  // Player resource validation methods
  canPlayerAfford: jest.fn(),
  
  // Turn validation methods
  isPlayerTurn: jest.fn(),
  
  // Game state validation methods
  isGameInProgress: jest.fn(),
  
  // Win condition methods
  checkWinCondition: jest.fn(),
  
  canPlayerTakeAction: jest.fn(),
  
  // Project scope calculation methods
  calculateProjectScope: jest.fn()
});

export const createMockCardService = (): jest.Mocked<ICardService> => ({
  // Card validation methods
  canPlayCard: jest.fn(),
  isValidCardType: jest.fn(),
  playerOwnsCard: jest.fn(),
  
  // Card management methods with source tracking
  playCard: jest.fn(),
  drawCards: jest.fn(),
  discardCards: jest.fn(),
  removeCard: jest.fn(),
  replaceCard: jest.fn(),
  
  // Turn-based card lifecycle methods
  endOfTurn: jest.fn(),
  activateCard: jest.fn(),
  
  // Card transfer methods with source tracking
  transferCard: jest.fn(),
  
  // Card information methods
  getCardType: jest.fn(),
  getPlayerCards: jest.fn(),
  getPlayerCardCount: jest.fn(),
  getCardToDiscard: jest.fn(),
  
  // Card effect methods
  applyCardEffects: jest.fn(),
  effectEngineService: {} as IEffectEngineService // Will be mocked separately if needed
});

export const createMockResourceService = (): jest.Mocked<IResourceService> => ({
  // Money operations
  addMoney: jest.fn(),
  spendMoney: jest.fn(),
  canAfford: jest.fn(),
  
  // Time operations  
  addTime: jest.fn(),
  spendTime: jest.fn(),
  
  // Combined operations
  updateResources: jest.fn(),
  getResourceHistory: jest.fn(),
  
  // Validation
  validateResourceChange: jest.fn()
});

export const createMockMovementService = (): jest.Mocked<IMovementService> => ({
  // Movement validation methods
  getValidMoves: jest.fn(),
  
  // Movement execution methods
  movePlayer: jest.fn(),
  
  // Dice-based movement methods
  getDiceDestination: jest.fn(),
  
  // Choice-based movement methods
  handleMovementChoice: jest.fn()
});

export const createMockNegotiationService = (): jest.Mocked<INegotiationService> => ({
  // Core negotiation methods
  initiateNegotiation: jest.fn(),
  makeOffer: jest.fn(),
  acceptOffer: jest.fn(),
  declineOffer: jest.fn(),
  
  // Negotiation state methods
  getActiveNegotiation: jest.fn(),
  hasActiveNegotiation: jest.fn()
});

export const createMockEffectEngineService = (): jest.Mocked<IEffectEngineService> => ({
  // Core processing methods
  processEffects: jest.fn(),
  processEffect: jest.fn(),
  
  // Validation methods
  validateEffect: jest.fn(),
  validateEffects: jest.fn()
});

export const createMockChoiceService = (): jest.Mocked<IChoiceService> => ({
  // Choice creation and resolution methods
  createChoice: jest.fn(),
  resolveChoice: jest.fn(),
  
  // Choice query methods
  getActiveChoice: jest.fn(),
  hasActiveChoice: jest.fn()
});

export const createMockTurnService = (): jest.Mocked<ITurnService> => ({
  // Turn management methods
  takeTurn: jest.fn(),
  endTurn: jest.fn(),
  rollDice: jest.fn(),
  
  // Separate dice and movement methods
  rollDiceAndProcessEffects: jest.fn(),
  endTurnWithMovement: jest.fn(),
  
  // Turn validation methods  
  canPlayerTakeTurn: jest.fn(),
  getCurrentPlayerTurn: jest.fn(),
  
  // Turn effects processing
  processTurnEffects: jest.fn(),
  
  // Turn control methods
  setTurnModifier: jest.fn(),
  
  // Feedback methods for UI components
  rollDiceWithFeedback: jest.fn(),
  rerollDice: jest.fn(),
  triggerManualEffectWithFeedback: jest.fn(),
  performNegotiation: jest.fn(),
  tryAgainOnSpace: jest.fn(),
  handleAutomaticFunding: jest.fn()
});

// Convenience function to create all mocks at once
export const createAllMockServices = () => ({
  dataService: createMockDataService(),
  stateService: createMockStateService(),
  gameRulesService: createMockGameRulesService(),
  cardService: createMockCardService(),
  resourceService: createMockResourceService(),
  movementService: createMockMovementService(),
  negotiationService: createMockNegotiationService(),
  effectEngineService: createMockEffectEngineService(),
  choiceService: createMockChoiceService(),
  turnService: createMockTurnService()
});