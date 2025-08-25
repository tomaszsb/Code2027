import { Player, ActiveCard } from './DataTypes';

export type GamePhase = 'SETUP' | 'PLAY' | 'END';

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
  awaitingChoice: { playerId: string; options: string[] } | null;
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