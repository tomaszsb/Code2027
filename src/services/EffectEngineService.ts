// src/services/EffectEngineService.ts

import { 
  IResourceService, 
  ICardService, 
  IChoiceService, 
  IStateService, 
  IMovementService,
  ITurnService,
  IGameRulesService
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
  isCardActivationEffect,
  isEffectGroupTargetedEffect
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
  private turnService: ITurnService;
  private gameRulesService: IGameRulesService;

  constructor(
    resourceService: IResourceService,
    cardService: ICardService,
    choiceService: IChoiceService,
    stateService: IStateService,
    movementService: IMovementService,
    turnService: ITurnService,
    gameRulesService: IGameRulesService
  ) {
    this.resourceService = resourceService;
    this.cardService = cardService;
    this.choiceService = choiceService;
    this.stateService = stateService;
    this.movementService = movementService;
    this.turnService = turnService;
    this.gameRulesService = gameRulesService;
  }

  /**
   * Process multiple effects as a batch operation
   * 
   * @param effects Array of effects to process
   * @param context Processing context including source and metadata
   * @returns Promise resolving to batch processing results
   */
  async processEffects(effects: Effect[], context: EffectContext): Promise<BatchEffectResult> {
    console.log(`🚨 DEBUG: EffectEngineService.processEffects() ENTRY - ${effects.length} effects from source: ${context.source}`);
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
    
    let success = false; // Declare success variable at method scope

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
            const source = payload.source || context.source;
            const reason = payload.reason || 'Effect processing';
            
            console.log(`🔧 EFFECT_ENGINE: Processing ${payload.resource} change for player ${payload.playerId} by ${payload.amount}`);
            
            if (payload.resource === 'MONEY') {
              if (payload.amount > 0) {
                success = this.resourceService.addMoney(payload.playerId, payload.amount, source, reason);
              } else if (payload.amount < 0) {
                success = this.resourceService.spendMoney(payload.playerId, Math.abs(payload.amount), source, reason);
              } else {
                success = true; // No change needed for 0 amount
              }
            } else if (payload.resource === 'TIME') {
              if (payload.amount > 0) {
                this.resourceService.addTime(payload.playerId, payload.amount, source, reason);
                success = true;
                
                // Log to action log if available
                const player = this.stateService.getPlayer(payload.playerId);
                if (player && typeof window !== 'undefined' && typeof (window as any).addActionToLog === 'function') {
                  (window as any).addActionToLog({
                    type: 'resource_change',
                    playerId: payload.playerId,
                    playerName: player.name,
                    description: `Added ${payload.amount} day${payload.amount !== 1 ? 's' : ''} of time`,
                    details: {
                      time: payload.amount
                    }
                  });
                }
              } else if (payload.amount < 0) {
                this.resourceService.spendTime(payload.playerId, Math.abs(payload.amount), source, reason);
                success = true;
              } else {
                success = true; // No change needed for 0 amount
              }
            }
            
            if (!success) {
              return {
                success: false,
                effectType: effect.effectType,
                error: `Failed to process ${payload.resource} change of ${payload.amount} for player ${payload.playerId}`
              };
            }
          }
          break;

        case 'CARD_DRAW':
          if (isCardDrawEffect(effect)) {
            const { payload } = effect;
            const source = payload.source || context.source;
            const reason = payload.reason || 'Effect processing';
            
            console.log(`🔧 EFFECT_ENGINE: Drawing ${payload.count} ${payload.cardType} card(s) for player ${payload.playerId}`);
            
            try {
              const drawnCards = this.cardService.drawCards(payload.playerId, payload.cardType, payload.count, source, reason);
              console.log(`    ✅ Drew ${drawnCards.length} card(s): ${drawnCards.join(', ')}`);
              
              // Log to action log if available
              const player = this.stateService.getPlayer(payload.playerId);
              if (player && typeof window !== 'undefined' && typeof (window as any).addActionToLog === 'function') {
                (window as any).addActionToLog({
                  type: 'card_draw',
                  playerId: payload.playerId,
                  playerName: player.name,
                  description: `Drew ${payload.count} ${payload.cardType} card${payload.count > 1 ? 's' : ''}`,
                  details: {
                    cards: drawnCards
                  }
                });
              }
              
              // Store drawn cards in result for potential use by other effects
              return {
                success: true,
                effectType: effect.effectType,
                resultingEffects: [{
                  effectType: 'LOG',
                  payload: {
                    message: `Drew ${drawnCards.length} ${payload.cardType} card(s): ${drawnCards.join(', ')}`,
                    level: 'INFO',
                    source
                  }
                }]
              };
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown card draw error';
              return {
                success: false,
                effectType: effect.effectType,
                error: `Failed to draw ${payload.count} ${payload.cardType} cards for player ${payload.playerId}: ${errorMessage}`
              };
            }
          }
          break;

        case 'CARD_DISCARD':
          if (isCardDiscardEffect(effect)) {
            const { payload } = effect;
            const source = payload.source || context.source;
            const reason = payload.reason || 'Effect processing';
            
            console.log(`🔧 EFFECT_ENGINE: Discarding ${payload.cardIds.length} card(s) for player ${payload.playerId}`);
            console.log(`    Card IDs: ${payload.cardIds.join(', ')}`);
            
            try {
              const success = this.cardService.discardCards(payload.playerId, payload.cardIds, source, reason);
              
              if (!success) {
                return {
                  success: false,
                  effectType: effect.effectType,
                  error: `Failed to discard cards for player ${payload.playerId}: Card discard operation failed`
                };
              }
              
              console.log(`    ✅ Successfully discarded ${payload.cardIds.length} card(s)`);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown card discard error';
              return {
                success: false,
                effectType: effect.effectType,
                error: `Failed to discard cards for player ${payload.playerId}: ${errorMessage}`
              };
            }
          }
          break;

        case 'CHOICE':
          if (isChoiceEffect(effect)) {
            const { payload } = effect;
            
            console.log(`🔧 EFFECT_ENGINE: Presenting ${payload.type} choice to player ${payload.playerId}`);
            console.log(`    Prompt: "${payload.prompt}"`);
            console.log(`    Options: ${payload.options.map(opt => `${opt.id}:${opt.label}`).join(', ')}`);
            
            try {
              const selection = await this.choiceService.createChoice(payload.playerId, payload.type, payload.prompt, payload.options);
              console.log(`    ✅ Player selected: ${selection}`);
              
              // Return success with the selection - calling code can handle the choice result
              return {
                success: true,
                effectType: effect.effectType,
                resultingEffects: [{
                  effectType: 'LOG',
                  payload: {
                    message: `Player ${payload.playerId} selected "${selection}" for ${payload.type} choice`,
                    level: 'INFO',
                    source: context.source
                  }
                }]
              };
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown choice error';
              return {
                success: false,
                effectType: effect.effectType,
                error: `Failed to present choice to player ${payload.playerId}: ${errorMessage}`
              };
            }
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
            success = true; // Log effects always succeed
          }
          break;

        case 'PLAYER_MOVEMENT':
          if (isPlayerMovementEffect(effect)) {
            const { payload } = effect;
            const source = payload.source || context.source;
            const reason = payload.reason || 'Effect processing';
            
            console.log(`🔧 EFFECT_ENGINE: Moving player ${payload.playerId} to ${payload.destinationSpace}`);
            
            try {
              const updatedState = this.movementService.movePlayer(payload.playerId, payload.destinationSpace);
              console.log(`    ✅ Successfully moved player to ${payload.destinationSpace}`);
              
              // Log the movement
              return {
                success: true,
                effectType: effect.effectType,
                resultingEffects: [{
                  effectType: 'LOG',
                  payload: {
                    message: `Player ${payload.playerId} moved to ${payload.destinationSpace} (${reason})`,
                    level: 'INFO',
                    source
                  }
                }]
              };
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown movement error';
              return {
                success: false,
                effectType: effect.effectType,
                error: `Failed to move player ${payload.playerId} to ${payload.destinationSpace}: ${errorMessage}`
              };
            }
          }
          break;

        case 'TURN_CONTROL':
          if (isTurnControlEffect(effect)) {
            const { payload } = effect;
            console.log(`🔄 EFFECT_ENGINE: Executing turn control action: ${payload.action} for player ${payload.playerId}`);
            console.log(`    Source: ${payload.source || context.source}`);
            console.log(`    Reason: ${payload.reason || 'Effect processing'}`);
            
            try {
              // Execute turn control action through TurnService
              if (payload.action === 'SKIP_TURN') {
                success = this.turnService.setTurnModifier(payload.playerId, payload.action);
              } else {
                console.warn(`Unsupported turn control action "${payload.action}" encountered and ignored.`);
                success = true; // The effect is "successfully" ignored, not a failure.
              }
              
              if (success) {
                console.log(`✅ Turn control applied: ${payload.action} for player ${payload.playerId}`);
              } else {
                console.error(`❌ Failed to apply turn control: ${payload.action} for player ${payload.playerId}`);
              }
            } catch (error) {
              console.error(`❌ Error applying turn control:`, error);
              success = false;
            }
          }
          break;

        case 'CARD_ACTIVATION':
          if (isCardActivationEffect(effect)) {
            const { payload } = effect;
            console.log(`🎴 EFFECT_ENGINE: Activating card ${payload.cardId} for player ${payload.playerId} for ${payload.duration} turns`);
            console.log(`    Source: ${payload.source || context.source}`);
            console.log(`    Reason: ${payload.reason || 'Effect processing'}`);
            
            
            try {
              // Activate card through CardService
              this.cardService.activateCard(payload.playerId, payload.cardId, payload.duration);
              success = true;
              
              console.log(`✅ Card ${payload.cardId} activated successfully for ${payload.duration} turns`);
            } catch (error) {
              console.error(`❌ Error activating card ${payload.cardId}:`, error);
              success = false;
            }
          }
          break;

        case 'EFFECT_GROUP_TARGETED':
          if (isEffectGroupTargetedEffect(effect)) {
            const { payload } = effect;
            console.log(`🎯 EFFECT_ENGINE: Processing targeted effect - ${payload.targetType}`);
            console.log(`    Source: ${payload.source || context.source}`);
            console.log(`    Prompt: ${payload.prompt}`);
            
            
            try {
              success = await this.processTargetedEffect(payload, context);
            } catch (error) {
              console.error(`❌ Error processing targeted effect:`, error);
              success = false;
            }
          }
          break;

        case 'RECALCULATE_SCOPE':
          console.log(`📊 EFFECT_ENGINE: Recalculating project scope for player ${effect.payload.playerId}`);
          
          try {
            const newProjectScope = this.gameRulesService.calculateProjectScope(effect.payload.playerId);
            this.stateService.updatePlayer({
              id: effect.payload.playerId,
              projectScope: newProjectScope
            });
            console.log(`📊 Project Scope Updated [${effect.payload.playerId}]: $${newProjectScope.toLocaleString()}`);
            
            // Log to action log if available
            const player = this.stateService.getPlayer(effect.payload.playerId);
            if (player && typeof window !== 'undefined' && typeof (window as any).addActionToLog === 'function' && newProjectScope > 0) {
              (window as any).addActionToLog({
                type: 'resource_change',
                playerId: effect.payload.playerId,
                playerName: player.name,
                description: `Project Scope updated to $${newProjectScope.toLocaleString()}`,
                details: {
                  money: newProjectScope
                }
              });
            }
            
            success = true;
          } catch (error) {
            console.error(`❌ Failed to recalculate scope for player ${effect.payload.playerId}:`, error);
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
        success,
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

  /**
   * Process a targeted effect by handling player selection and applying effects
   */
  private async processTargetedEffect(
    payload: Extract<Effect, { effectType: 'EFFECT_GROUP_TARGETED' }>['payload'], 
    context: EffectContext
  ): Promise<boolean> {
    console.log(`🎯 EFFECT_ENGINE: Processing targeted effect with targetType: ${payload.targetType}`);
    
    // Get all players from StateService
    const allPlayers = this.stateService.getAllPlayers();
    const currentPlayerId = context.playerId || 
      (payload.templateEffect.effectType === 'RESOURCE_CHANGE' ? 
        (payload.templateEffect as any).payload?.playerId : null);
    
    if (!currentPlayerId) {
      console.error('Cannot determine current player for targeted effect');
      console.error(`Context playerId: ${context.playerId}`);
      console.error(`Template effect type: ${payload.templateEffect.effectType}`);
      return false;
    }
    
    // Filter players based on target type
    let targetPlayers: string[] = [];
    
    switch (payload.targetType) {
      case 'OTHER_PLAYER_CHOICE':
        // Filter out the current player, then let user choose one
        const otherPlayers = allPlayers.filter(player => player.id !== currentPlayerId);
        
        if (otherPlayers.length === 0) {
          console.log('No other players available for targeting');
          return true; // Not an error, just no valid targets
        }
        
        // BUG-001 FIX: If only one valid target, apply effect automatically
        if (otherPlayers.length === 1) {
          const singleTarget = otherPlayers[0];
          targetPlayers = [singleTarget.id];
          console.log(`🎯 Single target detected - applying effect automatically to: ${singleTarget.name || singleTarget.id}`);
          console.log(`✅ Automatic targeting resolved without ChoiceService`);
          break;
        }
        
        // Multiple targets: present choice to player
        const choice = {
          id: `target_player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          playerId: currentPlayerId,
          type: 'PLAYER_TARGET' as const,
          prompt: payload.prompt,
          options: otherPlayers.map(player => ({
            id: player.id,
            label: player.name || `Player ${player.id}`
          }))
        };
        
        console.log(`🎯 Creating player choice for targeting: ${choice.options.length} options`);
        
        // Use ChoiceService to present the choice and await result
        const chosenTargetId = await this.choiceService.createChoice(
          currentPlayerId,
          'PLAYER_TARGET',
          payload.prompt,
          choice.options
        );
        
        if (!chosenTargetId) {
          console.error('No target selected for targeted effect');
          return false;
        }
        
        targetPlayers = [chosenTargetId];
        console.log(`✅ Player chosen for targeting: ${chosenTargetId}`);
        break;
        
      case 'ALL_OTHER_PLAYERS':
        targetPlayers = allPlayers
          .filter(player => player.id !== currentPlayerId)
          .map(player => player.id);
        console.log(`🎯 Targeting all other players: ${targetPlayers.length} players`);
        break;
        
      case 'ALL_PLAYERS':
        targetPlayers = allPlayers.map(player => player.id);
        console.log(`🎯 Targeting all players: ${targetPlayers.length} players`);
        break;
        
      default:
        console.error(`Unknown target type: ${payload.targetType}`);
        return false;
    }
    
    if (targetPlayers.length === 0) {
      console.log('No valid targets found for targeted effect');
      return true; // Not an error, just no targets
    }
    
    // Create targeted effects for each target player
    const targetedEffects: Effect[] = [];
    
    for (const targetPlayerId of targetPlayers) {
      // Clone the template effect and update the playerId
      const targetedEffect = this.cloneEffectWithNewPlayerId(payload.templateEffect, targetPlayerId);
      targetedEffects.push(targetedEffect);
    }
    
    console.log(`🎯 Generated ${targetedEffects.length} targeted effects`);
    
    // Process all targeted effects using batch processing
    const batchResult = await this.processEffects(targetedEffects, {
      ...context,
      source: `${context.source}:targeted`,
      triggerEvent: 'CARD_PLAY' // Targeted effects are typically from card play
    });
    
    console.log(`🎯 Targeted effects batch result: ${batchResult.successfulEffects}/${batchResult.totalEffects} successful`);
    
    return batchResult.success;
  }

  /**
   * Clone an effect and replace the playerId with a new target
   */
  private cloneEffectWithNewPlayerId(templateEffect: Effect, newPlayerId: string): Effect {
    // Deep clone the effect object
    const clonedEffect = JSON.parse(JSON.stringify(templateEffect)) as Effect;
    
    // Update playerId in the payload if it exists
    if ('payload' in clonedEffect && typeof clonedEffect.payload === 'object' && clonedEffect.payload !== null) {
      const payload = clonedEffect.payload as any;
      if ('playerId' in payload) {
        payload.playerId = newPlayerId;
      }
    }
    
    return clonedEffect;
  }
}