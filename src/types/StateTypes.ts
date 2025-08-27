import { Player, ActiveCard } from './DataTypes';
import { Effect } from './EffectTypes';

export type GamePhase = 'SETUP' | 'PLAY' | 'END';

export interface Choice {
  id: string;
  playerId: string;
  type: 'MOVEMENT' | 'PLAYER_TARGET' | 'GENERAL';
  prompt: string;
  options: Array<{ id: string; label: string; }>;
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
}

export interface NegotiationResult {
  success: boolean;
  message: string;
  negotiationId?: string;
  effects: Effect[];
  data?: any;
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
  gameStartTime?: Date;
  gameEndTime?: Date;
  winner?: string;
  // Action tracking for turn management
  requiredActions: number;
  completedActions: number;
  availableActionTypes: string[];
  hasCompletedManualActions: boolean;
  // Turn control for skip turn effects
  turnModifiers: { [playerId: string]: { skipTurns: number } };
  // Negotiation state
  activeNegotiation: NegotiationState | null;
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
  money?: number;
  time?: number;
  projectScope?: number;
  cards?: {
    W?: string[];
    B?: string[];
    E?: string[];
    L?: string[];
    I?: string[];
  };
  availableCards?: {
    W?: string[];
    B?: string[];
    E?: string[];
    L?: string[];
    I?: string[];
  };
  activeCards?: ActiveCard[];
  discardedCards?: {
    W?: string[];
    B?: string[];
    E?: string[];
    L?: string[];
    I?: string[];
  };
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
    availableCards: {
      W: string[];
      B: string[];
      E: string[];
      L: string[];
      I: string[];
    };
    activeCards: ActiveCard[];
    discardedCards: {
      W: string[];
      B: string[];
      E: string[];
      L: string[];
      I: string[];
    };
  };
}

export type PlayerCards = {
  W: string[];
  B: string[];
  E: string[];
  L: string[];
  I: string[];
};

export { Player, ActiveCard } from './DataTypes';

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
}