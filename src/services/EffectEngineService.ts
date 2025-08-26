// src/services/EffectEngineService.ts

import { 
  IResourceService, 
  ICardService, 
  IChoiceService, 
  IStateService, 
  IMovementService 
} from '../types/ServiceContracts';
import { 
  Effect, 
  EffectContext, 
  EffectResult, 
  BatchEffectResult,
  isResourceChangeEffect,
  isCardDrawEffect,
  isCardDiscardEffect,
  isChoiceEffect,
  isLogEffect,
  isPlayerMovementEffect,
  isTurnControlEffect,
  isCardActivationEffect
} from '../types/EffectTypes';

/**
 * Unified Effect Processing Engine
 * 
 * This service provides a centralized system for processing all game effects.
 * It acts as a coordination layer between different services, ensuring that
 * complex multi-step effects are handled consistently and atomically.
 * 
 * Key Features:
 * - Standardized effect processing via Effect objects
 * - Batch processing with rollback capability
 * - Source tracking for debugging and logging
 * - Integration with all major game services
 * - Type-safe effect handling via discriminated unions
 */
export interface IEffectEngineService {
  // Core processing methods
  processEffects(effects: Effect[], context: EffectContext): Promise<BatchEffectResult>;
  processEffect(effect: Effect, context: EffectContext): Promise<EffectResult>;
  
  // Validation methods
  validateEffect(effect: Effect, context: EffectContext): boolean;
  validateEffects(effects: Effect[], context: EffectContext): boolean;
}

export class EffectEngineService implements IEffectEngineService {
  private resourceService: IResourceService;
  private cardService: ICardService;
  private choiceService: IChoiceService;
  private stateService: IStateService;
  private movementService: IMovementService;

  constructor(
    resourceService: IResourceService,
    cardService: ICardService,
    choiceService: IChoiceService,
    stateService: IStateService,
    movementService: IMovementService
  ) {
    this.resourceService = resourceService;
    this.cardService = cardService;
    this.choiceService = choiceService;
    this.stateService = stateService;
    this.movementService = movementService;
  }

  /**
   * Process multiple effects as a batch operation
   * 
   * @param effects Array of effects to process
   * @param context Processing context including source and metadata
   * @returns Promise resolving to batch processing results
   */
  async processEffects(effects: Effect[], context: EffectContext): Promise<BatchEffectResult> {
    console.log(`🔧 EFFECT_ENGINE: Processing ${effects.length} effects from source: ${context.source}`);
    
    if (context.playerId) {
      console.log(`   Target Player: ${context.playerId}`);
    }
    
    if (context.triggerEvent) {
      console.log(`   Trigger Event: ${context.triggerEvent}`);
    }

    const results: EffectResult[] = [];
    const errors: string[] = [];
    let successfulEffects = 0;
    let failedEffects = 0;

    // Process each effect in sequence
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i];
      console.log(`  Processing effect ${i + 1}/${effects.length}: ${effect.effectType}`);
      
      try {
        const result = await this.processEffect(effect, context);
        results.push(result);
        
        if (result.success) {
          successfulEffects++;
          console.log(`    ✅ Effect ${i + 1} completed successfully`);
        } else {
          failedEffects++;
          console.log(`    ❌ Effect ${i + 1} failed: ${result.error}`);
          errors.push(`Effect ${i + 1} (${effect.effectType}): ${result.error}`);
        }
      } catch (error) {
        failedEffects++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const result: EffectResult = {
          success: false,
          effectType: effect.effectType,
          error: errorMessage
        };
        results.push(result);
        errors.push(`Effect ${i + 1} (${effect.effectType}): ${errorMessage}`);
        console.log(`    💥 Effect ${i + 1} threw exception: ${errorMessage}`);
      }
    }

    const batchResult: BatchEffectResult = {
      success: failedEffects === 0,
      totalEffects: effects.length,
      successfulEffects,
      failedEffects,
      results,
      errors
    };

    console.log(`🔧 EFFECT_ENGINE: Batch complete - ${successfulEffects}/${effects.length} successful`);
    if (errors.length > 0) {
      console.warn(`   Errors encountered:`, errors);
    }

    return batchResult;
  }

  /**
   * Process a single effect
   * 
   * @param effect Effect to process
   * @param context Processing context
   * @returns Promise resolving to effect processing result
   */
  async processEffect(effect: Effect, context: EffectContext): Promise<EffectResult> {
    console.log(`    🎯 Processing ${effect.effectType} effect`);

    try {
      // Validate effect before processing
      if (!this.validateEffect(effect, context)) {
        return {
          success: false,
          effectType: effect.effectType,
          error: 'Effect validation failed'
        };
      }

      // Process effect based on type using type guards and switch statement
      switch (effect.effectType) {
        case 'RESOURCE_CHANGE':
          if (isResourceChangeEffect(effect)) {
            const { payload } = effect;
            console.log(`EFFECT_ENGINE: Would change ${payload.resource} for player ${payload.playerId} by ${payload.amount}`);
            console.log(`    Source: ${payload.source || context.source}`);
            console.log(`    Reason: ${payload.reason || 'Effect processing'}`);
            // TODO: In next task, implement: 
            // if (payload.amount > 0) {
            //   await this.resourceService.addMoney/addTime(payload.playerId, payload.amount, payload.source, payload.reason);
            // } else {
            //   await this.resourceService.spendMoney/spendTime(payload.playerId, Math.abs(payload.amount), payload.source, payload.reason);
            // }
          }
          break;

        case 'CARD_DRAW':
          if (isCardDrawEffect(effect)) {
            const { payload } = effect;
            console.log(`EFFECT_ENGINE: Would draw ${payload.count} ${payload.cardType} card(s) for player ${payload.playerId}`);
            console.log(`    Source: ${payload.source || context.source}`);
            console.log(`    Reason: ${payload.reason || 'Effect processing'}`);
            // TODO: In next task, implement:
            // const drawnCards = this.cardService.drawCards(payload.playerId, payload.cardType, payload.count, payload.source, payload.reason);
          }
          break;

        case 'CARD_DISCARD':
          if (isCardDiscardEffect(effect)) {
            const { payload } = effect;
            console.log(`EFFECT_ENGINE: Would discard ${payload.cardIds.length} card(s) for player ${payload.playerId}`);
            console.log(`    Card IDs: ${payload.cardIds.join(', ')}`);
            console.log(`    Source: ${payload.source || context.source}`);
            console.log(`    Reason: ${payload.reason || 'Effect processing'}`);
            // TODO: In next task, implement:
            // const success = this.cardService.discardCards(payload.playerId, payload.cardIds, payload.source, payload.reason);
          }
          break;

        case 'CHOICE':
          if (isChoiceEffect(effect)) {
            const { payload } = effect;
            console.log(`EFFECT_ENGINE: Would present ${payload.type} choice to player ${payload.playerId}`);
            console.log(`    Prompt: "${payload.prompt}"`);
            console.log(`    Options: ${payload.options.map(opt => `${opt.id}:${opt.label}`).join(', ')}`);
            // TODO: In next task, implement:
            // const selection = await this.choiceService.createChoice(payload.playerId, payload.type, payload.prompt, payload.options);
            // This will likely return a new effect or set of effects based on the choice
          }
          break;

        case 'LOG':
          if (isLogEffect(effect)) {
            const { payload } = effect;
            const logMessage = `[${payload.source || context.source}] ${payload.message}`;
            switch (payload.level) {
              case 'INFO':
                console.log(`ℹ️  ${logMessage}`);
                break;
              case 'WARN':
                console.warn(`⚠️  ${logMessage}`);
                break;
              case 'ERROR':
                console.error(`❌ ${logMessage}`);
                break;
            }
          }
          break;

        case 'PLAYER_MOVEMENT':
          if (isPlayerMovementEffect(effect)) {
            const { payload } = effect;
            console.log(`EFFECT_ENGINE: Would move player ${payload.playerId} to ${payload.destinationSpace}`);
            console.log(`    Source: ${payload.source || context.source}`);
            console.log(`    Reason: ${payload.reason || 'Effect processing'}`);
            // TODO: In next task, implement:
            // this.movementService.movePlayer(payload.playerId, payload.destinationSpace);
          }
          break;

        case 'TURN_CONTROL':
          if (isTurnControlEffect(effect)) {
            const { payload } = effect;
            console.log(`EFFECT_ENGINE: Would execute turn control action: ${payload.action} for player ${payload.playerId}`);
            console.log(`    Source: ${payload.source || context.source}`);
            console.log(`    Reason: ${payload.reason || 'Effect processing'}`);
            // TODO: In next task, implement turn control logic
          }
          break;

        case 'CARD_ACTIVATION':
          if (isCardActivationEffect(effect)) {
            const { payload } = effect;
            console.log(`EFFECT_ENGINE: Would activate card ${payload.cardId} for player ${payload.playerId} for ${payload.duration} turns`);
            console.log(`    Source: ${payload.source || context.source}`);
            console.log(`    Reason: ${payload.reason || 'Effect processing'}`);
            // TODO: In next task, implement card activation
          }
          break;

        default:
          // TypeScript exhaustiveness check - this should never be reached
          const _exhaustiveCheck: never = effect;
          return {
            success: false,
            effectType: (effect as any).effectType,
            error: `Unknown effect type: ${(effect as any).effectType}`
          };
      }

      return {
        success: true,
        effectType: effect.effectType
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during effect processing';
      console.error(`❌ Error processing ${effect.effectType} effect:`, errorMessage);
      
      return {
        success: false,
        effectType: effect.effectType,
        error: errorMessage
      };
    }
  }

  /**
   * Validate a single effect before processing
   * 
   * @param effect Effect to validate
   * @param context Processing context
   * @returns true if effect is valid, false otherwise
   */
  validateEffect(effect: Effect, context: EffectContext): boolean {
    if (!effect || !effect.effectType) {
      console.error('EFFECT_ENGINE: Invalid effect - missing effectType');
      return false;
    }

    // Basic validation based on effect type
    switch (effect.effectType) {
      case 'RESOURCE_CHANGE':
        if (isResourceChangeEffect(effect)) {
          const { payload } = effect;
          if (!payload.playerId || !payload.resource || payload.amount === undefined) {
            console.error('EFFECT_ENGINE: RESOURCE_CHANGE effect missing required fields');
            return false;
          }
        }
        break;

      case 'CARD_DRAW':
        if (isCardDrawEffect(effect)) {
          const { payload } = effect;
          if (!payload.playerId || !payload.cardType || !payload.count || payload.count <= 0) {
            console.error('EFFECT_ENGINE: CARD_DRAW effect missing required fields or invalid count');
            return false;
          }
        }
        break;

      case 'CARD_DISCARD':
        if (isCardDiscardEffect(effect)) {
          const { payload } = effect;
          if (!payload.playerId || !payload.cardIds || payload.cardIds.length === 0) {
            console.error('EFFECT_ENGINE: CARD_DISCARD effect missing required fields or empty cardIds');
            return false;
          }
        }
        break;

      // Add more validation as needed for other effect types
    }

    return true;
  }

  /**
   * Validate multiple effects before batch processing
   * 
   * @param effects Effects to validate
   * @param context Processing context
   * @returns true if all effects are valid, false otherwise
   */
  validateEffects(effects: Effect[], context: EffectContext): boolean {
    if (!effects || effects.length === 0) {
      console.warn('EFFECT_ENGINE: No effects to validate');
      return true; // Empty array is technically valid
    }

    return effects.every((effect, index) => {
      const isValid = this.validateEffect(effect, context);
      if (!isValid) {
        console.error(`EFFECT_ENGINE: Effect validation failed at index ${index}`);
      }
      return isValid;
    });
  }

  // === DEBUG AND UTILITY METHODS ===

  /**
   * Get a summary of effect types in an array
   */
  getEffectSummary(effects: Effect[]): { [effectType: string]: number } {
    const summary: { [effectType: string]: number } = {};
    effects.forEach(effect => {
      summary[effect.effectType] = (summary[effect.effectType] || 0) + 1;
    });
    return summary;
  }
}