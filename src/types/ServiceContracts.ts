// src/types/ServiceContracts.ts

/**
 * @file This file defines the contracts (interfaces) for all services in the application.
 * Adhering to these contracts is crucial for ensuring a decoupled and testable architecture.
 */

import { 
  GameConfig, 
  Movement, 
  DiceOutcome, 
  SpaceEffect, 
  DiceEffect, 
  SpaceContent, 
  Space,
  VisitType,
  Card
} from './DataTypes';

import { 
  GameState, 
  Player, 
  GamePhase, 
  PlayerUpdateData,
  StateUpdateResult 
} from './StateTypes';

import { CardType } from './DataTypes';

// Phase 1 Services
export interface IDataService {
  // Configuration methods
  getGameConfig(): GameConfig[];
  getGameConfigBySpace(spaceName: string): GameConfig | undefined;
  
  // Space methods
  getAllSpaces(): Space[];
  getSpaceByName(spaceName: string): Space | undefined;
  
  // Movement methods
  getMovement(spaceName: string, visitType: VisitType): Movement | undefined;
  getAllMovements(): Movement[];
  
  // Dice outcome methods
  getDiceOutcome(spaceName: string, visitType: VisitType): DiceOutcome | undefined;
  getAllDiceOutcomes(): DiceOutcome[];
  
  // Space effects methods
  getSpaceEffects(spaceName: string, visitType: VisitType): SpaceEffect[];
  getAllSpaceEffects(): SpaceEffect[];
  
  // Dice effects methods
  getDiceEffects(spaceName: string, visitType: VisitType): DiceEffect[];
  getAllDiceEffects(): DiceEffect[];
  
  // Content methods
  getSpaceContent(spaceName: string, visitType: VisitType): SpaceContent | undefined;
  getAllSpaceContent(): SpaceContent[];
  
  // Card methods
  getCards(): Card[];
  getCardById(cardId: string): Card | undefined;
  getCardsByType(cardType: CardType): Card[];
  getAllCardTypes(): CardType[];
  
  // Data loading
  isLoaded(): boolean;
  loadData(): Promise<void>;
}

export interface IStateService {
  // State access methods
  getGameState(): GameState;
  isStateLoaded(): boolean;
  
  // Player management methods
  addPlayer(name: string): GameState;
  updatePlayer(playerData: PlayerUpdateData): GameState;
  removePlayer(playerId: string): GameState;
  getPlayer(playerId: string): Player | undefined;
  getAllPlayers(): Player[];
  
  // Game flow methods
  setCurrentPlayer(playerId: string): GameState;
  setGamePhase(phase: GamePhase): GameState;
  advanceTurn(): GameState;
  nextPlayer(): GameState;
  
  // Game lifecycle methods
  initializeGame(): GameState;
  startGame(): GameState;
  endGame(winnerId?: string): GameState;
  resetGame(): GameState;
  
  // Choice management methods
  setAwaitingChoice(playerId: string, options: string[]): GameState;
  clearAwaitingChoice(): GameState;
  
  // Turn state management methods
  setPlayerHasMoved(): GameState;
  clearPlayerHasMoved(): GameState;
  
  // Modal management methods
  showCardModal(cardId: string): GameState;
  dismissModal(): GameState;
  
  // Validation methods
  validatePlayerAction(playerId: string, action: string): boolean;
  canStartGame(): boolean;
}

export interface TurnResult {
  newState: GameState;
  diceRoll: number;
}

export interface ITurnService {
  // Turn management methods
  takeTurn(playerId: string): TurnResult;
  endTurn(): Promise<{ nextPlayerId: string }>;
  rollDice(): number;
  
  // Turn validation methods  
  canPlayerTakeTurn(playerId: string): boolean;
  getCurrentPlayerTurn(): string | null;
  
  // Turn effects processing
  processTurnEffects(playerId: string, diceRoll: number): GameState;
}

export interface ICardService {
  // Card validation methods
  canPlayCard(playerId: string, cardId: string): boolean;
  isValidCardType(cardType: string): boolean;
  playerOwnsCard(playerId: string, cardId: string): boolean;
  
  // Card management methods
  playCard(playerId: string, cardId: string): GameState;
  drawCards(playerId: string, cardType: CardType, count: number): GameState;
  removeCard(playerId: string, cardId: string): GameState;
  replaceCard(playerId: string, oldCardId: string, newCardType: CardType): GameState;
  
  // Card information methods
  getCardType(cardId: string): CardType | null;
  getPlayerCards(playerId: string, cardType?: CardType): string[];
  getPlayerCardCount(playerId: string, cardType?: CardType): number;
  
  // Card effect methods
  applyCardEffects(playerId: string, cardId: string): GameState;
}

export interface IPlayerActionService {
  // Methods for handling player commands and orchestrating actions
  playCard(playerId: string, cardId: string): Promise<void>;
  rollDice(playerId: string): Promise<{ roll1: number; roll2: number; total: number }>;
}

export interface IMovementService {
  // Movement validation methods
  getValidMoves(playerId: string): string[];
  
  // Movement execution methods
  movePlayer(playerId: string, destinationSpace: string): GameState;
  
  // Dice-based movement methods
  getDiceDestination(spaceName: string, visitType: VisitType, diceRoll: number): string | null;
  
  // Choice resolution methods
  resolveChoice(destination: string): GameState;
}

export interface IGameRulesService {
  // Movement validation methods
  isMoveValid(playerId: string, destination: string): boolean;
  
  // Card validation methods
  canPlayCard(playerId: string, cardId: string): boolean;
  canDrawCard(playerId: string, cardType: CardType): boolean;
  
  // Player resource validation methods
  canPlayerAfford(playerId: string, cost: number): boolean;
  
  // Turn validation methods
  isPlayerTurn(playerId: string): boolean;
  
  // Game state validation methods
  isGameInProgress(): boolean;
  
  // Win condition methods
  checkWinCondition(playerId: string): Promise<boolean>;
  
  canPlayerTakeAction(playerId: string): boolean;
}


/**
 * Represents the complete container of all game services.
 * This will be provided via context to the rest of the application.
 */
export interface IServiceContainer {
  dataService: IDataService;
  stateService: IStateService;
  turnService: ITurnService;
  cardService: ICardService;
  playerActionService: IPlayerActionService;
  movementService: IMovementService;
  gameRulesService: IGameRulesService;
}
