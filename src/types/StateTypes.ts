import { Player, ActiveCard, ActiveEffect } from './DataTypes';
import { Effect } from './EffectTypes';
import { Choice } from './CommonTypes';

export type GamePhase = 'SETUP' | 'PLAY' | 'END';

export interface ActionLogEntry {
  id: string;
  type: 'space_entry' | 'space_effect' | 'time_effect' | 'dice_roll' | 'card_draw' | 'resource_change' | 'manual_action' | 'turn_start' | 'turn_end' | 'card_play' | 'card_transfer' | 'card_discard' | 'player_movement' | 'card_activate' | 'card_expire' | 'deck_reshuffle' | 'game_start' | 'game_end' | 'error_event' | 'choice_made' | 'negotiation_resolved' | 'system_log';
  timestamp: Date;
  playerId: string;
  playerName: string;
  description: string;
  details?: Record<string, any>;
}


export interface NegotiationState {
  negotiationId: string;
  initiatorId: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
  context: any;
  offers: Array<{
    playerId: string;
    offerData: any;
    timestamp: Date;
  }>;
  createdAt: Date;
  lastUpdatedAt: Date;
  participantIds?: string[];
  expiresAt?: Date;
  playerSnapshots?: Array<{
    id: string;
    availableCards: {
      W?: string[];
      B?: string[];
      E?: string[];
      L?: string[];
      I?: string[];
    };
    negotiationOffer: string[];
  }>;
}

export interface NegotiationResult {
  success: boolean;
  message: string;
  negotiationId?: string;
  effects: Effect[];
  data?: any;
  newState?: GameState;
}

export interface ActiveModal {
  type: 'CARD';
  cardId: string;
}

export interface GameState {
  players: Player[];
  currentPlayerId: string | null;
  gamePhase: GamePhase;
  turn: number;
  activeModal: ActiveModal | null;
  awaitingChoice: Choice | null;
  hasPlayerMovedThisTurn: boolean;
  hasPlayerRolledDice: boolean;
  isGameOver: boolean;
  isMoving: boolean;
  isProcessingArrival: boolean;
  gameStartTime?: Date;
  gameEndTime?: Date;
  winner?: string;
  // Action tracking for turn management
  requiredActions: number;
  completedActionCount: number;
  availableActionTypes: string[];
  completedActions: {
    diceRoll: string | undefined;
    manualActions: { [key: string]: string };
  };
  // Negotiation state
  activeNegotiation: NegotiationState | null;
  // Movement selection state
  selectedDestination: string | null;
  // Global action log
  globalActionLog: ActionLogEntry[];
  // Try Again state snapshotting (per player)
  playerSnapshots: {
    [playerId: string]: {
      spaceName: string;
      gameState: GameState;
    } | null;
  };
  // Stateful decks and discard piles
  decks: {
    W: string[];
    B: string[];
    E: string[];
    L: string[];
    I: string[];
  };
  discardPiles: {
    W: string[];
    B: string[];
    E: string[];
    L: string[];
    I: string[];
  };
}

export interface PlayerAction {
  id: string;
  playerId: string;
  action: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export interface GameHistory {
  actions: PlayerAction[];
  gameStates: GameState[];
}

export interface StateUpdateResult {
  success: boolean;
  newState: GameState;
  error?: string;
}

export interface PlayerUpdateData {
  id?: string;
  name?: string;
  currentSpace?: string;
  visitType?: 'First' | 'Subsequent';
  visitedSpaces?: string[];
  money?: number;
  timeSpent?: number;
  projectScope?: number;
  hand?: string[]; // Replaces availableCards and discardedCards
  activeCards?: ActiveCard[];
  lastDiceRoll?: {
    roll1: number;
    roll2: number;
    total: number;
  };
  spaceEntrySnapshot?: {
    space: string;
    visitType: 'First' | 'Subsequent';
    money: number;
    timeSpent: number;
    hand: string[];
    activeCards: ActiveCard[];
  };
  turnModifiers?: {
    skipTurns: number;
    canReRoll?: boolean;
  };
  activeEffects?: ActiveEffect[];
  loans?: import('./DataTypes').Loan[];
  score?: number;
}

export type PlayerCards = {
  W: string[];
  B: string[];
  E: string[];
  L: string[];
  I: string[];
};

export type { Player, ActiveCard, ActiveEffect } from './DataTypes';

// Dice result feedback types
export interface DiceResultEffect {
  type: 'money' | 'time' | 'cards' | 'movement' | 'choice';
  description: string;
  value?: number;
  cardType?: string;
  cardCount?: number;
  moveOptions?: string[];
}

export interface TurnEffectResult {
  diceValue: number;
  spaceName: string;
  effects: DiceResultEffect[];
  summary: string;
  hasChoices: boolean;
  canReRoll?: boolean; // True if player can re-roll dice this turn
}