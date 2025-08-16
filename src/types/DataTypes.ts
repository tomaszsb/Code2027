export interface GameConfig {
  space_name: string;
  phase: string;
  path_type: string;
  is_starting_space: boolean;
  is_ending_space: boolean;
  min_players: number;
  max_players: number;
  requires_dice_roll: boolean;
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
}

export interface SpaceContent {
  space_name: string;
  visit_type: 'First' | 'Subsequent';
  title: string;
  story: string;
  action_description: string;
  outcome_description: string;
  can_negotiate: boolean;
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
  time: number;
  color?: string;
  avatar?: string;
  cards: {
    W: string[];
    B: string[];
    E: string[];
    L: string[];
    I: string[];
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
}

export type VisitType = 'First' | 'Subsequent';
export type MovementType = 'fixed' | 'choice' | 'dice' | 'logic' | 'none';
export type EffectType = 'time' | 'cards' | 'money';
export type CardType = 'W' | 'B' | 'E' | 'L' | 'I';