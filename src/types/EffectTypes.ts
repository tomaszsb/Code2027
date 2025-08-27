// src/types/EffectTypes.ts

import { CardType } from './DataTypes';
import { Choice } from './StateTypes';

/**
 * Generic Effect System Type Definitions
 * 
 * These types define a standardized "language" for all game effects.
 * Every action in the game can be described by one or more Effect objects.
 * 
 * This discriminated union allows for type-safe effect processing while
 * maintaining flexibility for different effect types.
 */

export type Effect =
  | { 
      effectType: 'RESOURCE_CHANGE'; 
      payload: { 
        playerId: string; 
        resource: 'MONEY' | 'TIME'; 
        amount: number; 
        source?: string;
        reason?: string;
      }; 
    }
  | { 
      effectType: 'CARD_DRAW'; 
      payload: { 
        playerId: string; 
        cardType: CardType; 
        count: number; 
        source?: string;
        reason?: string;
      }; 
    }
  | { 
      effectType: 'CARD_DISCARD'; 
      payload: { 
        playerId: string; 
        cardIds: string[]; 
        source?: string;
        reason?: string;
      }; 
    }
  | { 
      effectType: 'CHOICE'; 
      payload: Choice; 
    }
  | { 
      effectType: 'LOG'; 
      payload: { 
        message: string; 
        level: 'INFO' | 'WARN' | 'ERROR'; 
        source?: string;
      }; 
    }
  | {
      effectType: 'PLAYER_MOVEMENT';
      payload: {
        playerId: string;
        destinationSpace: string;
        source?: string;
        reason?: string;
      };
    }
  | {
      effectType: 'TURN_CONTROL';
      payload: {
        action: 'SKIP_TURN' | 'EXTRA_TURN' | 'END_TURN';
        playerId: string;
        source?: string;
        reason?: string;
      };
    }
  | {
      effectType: 'CARD_ACTIVATION';
      payload: {
        playerId: string;
        cardId: string;
        duration: number;
        source?: string;
        reason?: string;
      };
    }
  | {
      effectType: 'EFFECT_GROUP_TARGETED';
      payload: {
        targetType: 'OTHER_PLAYER_CHOICE' | 'ALL_OTHER_PLAYERS' | 'ALL_PLAYERS';
        templateEffect: Effect;
        prompt: string;
        source?: string;
      };
    }
  | {
      effectType: 'RECALCULATE_SCOPE';
      payload: {
        playerId: string;
      };
    };

/**
 * Effect Processing Context
 * 
 * Provides context information for effect processing,
 * including the source of the effect and any additional metadata.
 */
export interface EffectContext {
  source: string;
  playerId?: string;
  triggerEvent?: 'CARD_PLAY' | 'SPACE_ENTRY' | 'DICE_ROLL' | 'TURN_START' | 'TURN_END';
  metadata?: Record<string, any>;
}

/**
 * Effect Processing Result
 * 
 * Contains the result of processing an effect, including
 * success status, any errors, and resulting state changes.
 */
export interface EffectResult {
  success: boolean;
  effectType: Effect['effectType'];
  error?: string;
  resultingEffects?: Effect[];  // Some effects may trigger additional effects
}

/**
 * Batch Effect Processing Result
 * 
 * Contains the results of processing multiple effects as a batch.
 */
export interface BatchEffectResult {
  success: boolean;
  totalEffects: number;
  successfulEffects: number;
  failedEffects: number;
  results: EffectResult[];
  errors: string[];
}

/**
 * Type Guards for Effect Types
 * 
 * These utility functions provide type-safe checking of effect types.
 */
export function isResourceChangeEffect(effect: Effect): effect is Extract<Effect, { effectType: 'RESOURCE_CHANGE' }> {
  return effect.effectType === 'RESOURCE_CHANGE';
}

export function isCardDrawEffect(effect: Effect): effect is Extract<Effect, { effectType: 'CARD_DRAW' }> {
  return effect.effectType === 'CARD_DRAW';
}

export function isCardDiscardEffect(effect: Effect): effect is Extract<Effect, { effectType: 'CARD_DISCARD' }> {
  return effect.effectType === 'CARD_DISCARD';
}

export function isChoiceEffect(effect: Effect): effect is Extract<Effect, { effectType: 'CHOICE' }> {
  return effect.effectType === 'CHOICE';
}

export function isLogEffect(effect: Effect): effect is Extract<Effect, { effectType: 'LOG' }> {
  return effect.effectType === 'LOG';
}

export function isPlayerMovementEffect(effect: Effect): effect is Extract<Effect, { effectType: 'PLAYER_MOVEMENT' }> {
  return effect.effectType === 'PLAYER_MOVEMENT';
}

export function isTurnControlEffect(effect: Effect): effect is Extract<Effect, { effectType: 'TURN_CONTROL' }> {
  return effect.effectType === 'TURN_CONTROL';
}

export function isCardActivationEffect(effect: Effect): effect is Extract<Effect, { effectType: 'CARD_ACTIVATION' }> {
  return effect.effectType === 'CARD_ACTIVATION';
}

export function isEffectGroupTargetedEffect(effect: Effect): effect is Extract<Effect, { effectType: 'EFFECT_GROUP_TARGETED' }> {
  return effect.effectType === 'EFFECT_GROUP_TARGETED';
}

export function isRecalculateScopeEffect(effect: Effect): effect is Extract<Effect, { effectType: 'RECALCULATE_SCOPE' }> {
  return effect.effectType === 'RECALCULATE_SCOPE';
}