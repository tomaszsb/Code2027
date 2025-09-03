export interface GameConfig {
  space_name: string;
  phase: string;
  path_type: string;
  is_starting_space: boolean;
  is_ending_space: boolean;
  min_players: number;
  max_players: number;
  requires_dice_roll: boolean;
  action?: string;  // Dynamic action keywords like 'GOTO_JAIL', 'PAY_TAX', 'AUCTION'
  game_phase?: string;
  space_order?: number;
  tutorial_step?: number;
}

export interface Movement {
  space_name: string;
  visit_type: 'First' | 'Subsequent';
  movement_type: 'fixed' | 'choice' | 'dice' | 'logic' | 'none';
  destination_1?: string;
  destination_2?: string;
  destination_3?: string;
  destination_4?: string;
  destination_5?: string;
}

export interface DiceOutcome {
  space_name: string;
  visit_type: 'First' | 'Subsequent';
  roll_1?: string;
  roll_2?: string;
  roll_3?: string;
  roll_4?: string;
  roll_5?: string;
  roll_6?: string;
}

export interface SpaceEffect {
  space_name: string;
  visit_type: 'First' | 'Subsequent';
  effect_type: 'time' | 'cards' | 'money';
  effect_action: string;
  effect_value: string | number;
  condition: string;
  description: string;
  trigger_type?: 'manual' | 'auto';
}

export interface DiceEffect {
  space_name: string;
  visit_type: 'First' | 'Subsequent';
  effect_type: string;
  card_type?: string;
  roll_1?: string;
  roll_2?: string;
  roll_3?: string;
  roll_4?: string;
  roll_5?: string;
  roll_6?: string;
  effect_action?: string;
  effect_value?: string | number;
  condition?: string;
  description?: string;
}

export interface SpaceContent {
  space_name: string;
  visit_type: 'First' | 'Subsequent';
  title: string;
  story: string;
  action_description: string;
  outcome_description: string;
  can_negotiate: boolean;
  content_text?: string;
  requires_choice?: boolean;
}

export interface Space {
  name: string;
  config: GameConfig;
  content: SpaceContent[];
  movement: Movement[];
  spaceEffects: SpaceEffect[];
  diceEffects: DiceEffect[];
  diceOutcomes: DiceOutcome[];
}

export interface Player {
  id: string;
  name: string;
  currentSpace: string;
  visitType: 'First' | 'Subsequent';
  money: number;
  timeSpent: number;
  projectScope: number;
  color?: string;
  avatar?: string;
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
  turnModifiers?: {
    skipTurns: number;
    canReRoll?: boolean; // Allow re-roll if player doesn't like dice outcome
  };
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  gamePhase: string;
  isGameOver: boolean;
  winner?: string;
}

export interface Card {
  card_id: string;
  card_name: string;
  card_type: 'W' | 'B' | 'E' | 'L' | 'I';
  description: string;
  effects_on_play?: string;
  cost?: number;
  phase_restriction?: string;
  work_type_restriction?: string;  // Work type (Plumbing, Electrical, Mechanical Systems, etc.)
  
  // Expanded card mechanics from code2026
  duration?: string;
  duration_count?: string;
  turn_effect?: string;
  activation_timing?: string;
  
  // Financial mechanics
  loan_amount?: string;
  loan_rate?: string;
  investment_amount?: string;
  work_cost?: string;
  
  // Effect mechanics
  money_effect?: string;
  tick_modifier?: string;
  
  // Card interaction mechanics
  draw_cards?: string;
  discard_cards?: string;
  target?: string;
  scope?: string;
  
  // Turn control mechanics
  turn_skip?: string;
}

export interface ActiveCard {
  cardId: string;
  expirationTurn: number;
}

export type VisitType = 'First' | 'Subsequent';
export type MovementType = 'fixed' | 'choice' | 'dice' | 'logic' | 'none';
export type EffectType = 'time' | 'cards' | 'money';
export type CardType = 'W' | 'B' | 'E' | 'L' | 'I';