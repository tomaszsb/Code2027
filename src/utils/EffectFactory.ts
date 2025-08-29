// src/utils/EffectFactory.ts

import { Card, CardType, SpaceEffect, DiceEffect, GameConfig } from '../types/DataTypes';
import { Effect } from '../types/EffectTypes';

/**
 * Effect Factory Utility
 * 
 * This utility is responsible for converting raw game data (from CSV files, 
 * API responses, etc.) into standardized Effect objects that can be processed
 * by the EffectEngineService.
 * 
 * By centralizing this conversion logic, we decouple the raw data format
 * from the effect processing engine. If the CSV format changes, we only
 * need to update the factory methods, not the engine itself.
 */
export class EffectFactory {

  /**
   * Create effects from a Card object
   * 
   * Analyzes a card's properties and converts them into standardized Effect objects.
   * This method handles the complex card mechanics from the expanded CSV format.
   * 
   * @param card The card object from CSV data
   * @param playerId The player who will be affected by these effects
   * @returns Array of Effect objects representing the card's effects
   */
  static createEffectsFromCard(card: Card, playerId: string): Effect[] {
    const effects: Effect[] = [];
    const cardSource = `card:${card.card_id}`;
    const cardName = card.card_name || 'Unknown Card';

    console.log(`🏭 EFFECT_FACTORY: Creating effects from card: ${cardName} (${card.card_id})`);

    // === CARD COST DEDUCTION ===
    if (card.cost && card.cost > 0) {
      effects.push({
        effectType: 'RESOURCE_CHANGE',
        payload: {
          playerId,
          resource: 'MONEY',
          amount: -card.cost,
          source: cardSource,
          reason: `${cardName}: Card cost of $${card.cost.toLocaleString()}`
        }
      });
    }

    // === MONEY EFFECTS ===
    if (card.money_effect && card.money_effect !== '0' && card.money_effect !== '') {
      const moneyAmount = this.parseMoneyEffect(card.money_effect);
      if (moneyAmount !== 0) {
        effects.push({
          effectType: 'RESOURCE_CHANGE',
          payload: {
            playerId,
            resource: 'MONEY',
            amount: moneyAmount,
            source: cardSource,
            reason: `${cardName}: ${card.money_effect}`
          }
        });
      }
    }

    // === TIME EFFECTS ===
    if (card.time_effect && card.time_effect !== '0' && card.time_effect !== '') {
      const timeAmount = this.parseTimeEffect(card.time_effect);
      if (timeAmount !== 0) {
        effects.push({
          effectType: 'RESOURCE_CHANGE',
          payload: {
            playerId,
            resource: 'TIME',
            amount: timeAmount,
            source: cardSource,
            reason: `${cardName}: ${card.time_effect}`
          }
        });
      }
    }

    // === CARD DRAW EFFECTS ===
    if (card.draw_cards && card.draw_cards !== '0' && card.draw_cards !== '') {
      const cardDraws = this.parseCardDrawEffect(card.draw_cards);
      cardDraws.forEach(draw => {
        effects.push({
          effectType: 'CARD_DRAW',
          payload: {
            playerId,
            cardType: draw.cardType,
            count: draw.count,
            source: cardSource,
            reason: `${cardName}: Draw ${draw.count} ${draw.cardType} card${draw.count > 1 ? 's' : ''}`
          }
        });

        // Add scope recalculation if W cards are drawn
        if (draw.cardType === 'W') {
          effects.push({
            effectType: 'RECALCULATE_SCOPE',
            payload: {
              playerId
            }
          });
        }
      });
    }

    // === LOAN AMOUNT EFFECTS (New expanded mechanic) ===
    if (card.loan_amount && card.loan_amount !== '0' && card.loan_amount !== '') {
      const loanAmount = this.parseLoanAmount(card.loan_amount);
      if (loanAmount > 0) {
        effects.push({
          effectType: 'RESOURCE_CHANGE',
          payload: {
            playerId,
            resource: 'MONEY',
            amount: loanAmount,
            source: cardSource,
            reason: `${cardName}: Loan of $${loanAmount.toLocaleString()}`
          }
        });
      }
    }

    // === TICK MODIFIER EFFECTS (New expanded mechanic) ===
    if (card.tick_modifier && card.tick_modifier !== '0' && card.tick_modifier !== '') {
      const tickModifier = this.parseTickModifier(card.tick_modifier);
      if (tickModifier !== 0) {
        effects.push({
          effectType: 'RESOURCE_CHANGE',
          payload: {
            playerId,
            resource: 'TIME',
            amount: tickModifier,
            source: cardSource,
            reason: `${cardName}: Time modifier ${tickModifier > 0 ? '+' : ''}${tickModifier}`
          }
        });
      }
    }

    // === TURN SKIP EFFECTS (New expanded mechanic) ===
    if (card.turn_skip && card.turn_skip !== '0' && card.turn_skip !== '') {
      const skipTurns = this.parseTurnSkip(card.turn_skip);
      if (skipTurns > 0) {
        for (let i = 0; i < skipTurns; i++) {
          effects.push({
            effectType: 'TURN_CONTROL',
            payload: {
              action: 'SKIP_TURN',
              playerId,
              source: cardSource,
              reason: `${cardName}: Skip turn ${i + 1}/${skipTurns}`
            }
          });
        }
      }
    }

    // === CARD ACTIVATION EFFECTS (Duration-based cards) ===
    if (card.duration && card.duration !== '0' && card.duration !== '') {
      let duration = this.parseDuration(card.duration);
      
      // If duration field doesn't contain a number, check duration_count field
      if (duration === 0 && card.duration_count && card.duration_count !== '0' && card.duration_count !== '') {
        duration = parseInt(card.duration_count);
        if (isNaN(duration)) {
          duration = 0;
        }
      }
      
      if (duration > 0) {
        effects.push({
          effectType: 'CARD_ACTIVATION',
          payload: {
            playerId,
            cardId: card.card_id,
            duration,
            source: cardSource,
            reason: `${cardName}: Activate for ${duration} turn${duration > 1 ? 's' : ''}`
          }
        });
      }
    }

    // === TARGETING LOGIC ===
    // If the card has a target property, wrap appropriate effects in EFFECT_GROUP_TARGETED
    if (card.target && card.target !== '' && card.target !== 'self') {
      const targetableEffects = this.extractTargetableEffects(effects);
      
      if (targetableEffects.length > 0) {
        console.log(`   Card has target: ${card.target} - wrapping ${targetableEffects.length} effects for targeting`);
        
        // Remove targetable effects from the main effects array
        const nonTargetableEffects = effects.filter(effect => 
          !this.isTargetableEffectType(effect.effectType)
        );
        
        // Create targeting effects for each targetable effect
        for (const targetableEffect of targetableEffects) {
          const targetType = this.parseTargetType(card.target);
          const prompt = this.generateTargetPrompt(card.target, cardName, targetableEffect);
          
          nonTargetableEffects.push({
            effectType: 'EFFECT_GROUP_TARGETED',
            payload: {
              targetType: targetType,
              templateEffect: targetableEffect,
              prompt: prompt,
              source: cardSource
            }
          });
        }
        
        // === LOG EFFECT (Always add for tracking) ===
        nonTargetableEffects.push({
          effectType: 'LOG',
          payload: {
            message: `Targeted card played: ${cardName} by player ${playerId} (target: ${card.target})`,
            level: 'INFO',
            source: cardSource
          }
        });

        console.log(`🏭 EFFECT_FACTORY: Generated ${nonTargetableEffects.length} effects from targeted card ${cardName}`);
        return nonTargetableEffects;
      }
    }

    // === LOG EFFECT (Always add for tracking) ===
    effects.push({
      effectType: 'LOG',
      payload: {
        message: `Card played: ${cardName} by player ${playerId}`,
        level: 'INFO',
        source: cardSource
      }
    });

    console.log(`🏭 EFFECT_FACTORY: Generated ${effects.length} effects from card ${cardName}`);
    return effects;
  }

  /**
   * Create effects from space entry
   * 
   * @param spaceEffects Array of SpaceEffect objects for the current space and visit type
   * @param playerId The player entering the space
   * @param spaceName The space being entered for logging purposes
   * @param visitType Whether this is first or subsequent visit
   * @param spaceConfig Optional space configuration containing action data
   * @returns Array of Effect objects for space entry
   */
  static createEffectsFromSpaceEntry(
    spaceEffects: SpaceEffect[], 
    playerId: string, 
    spaceName: string, 
    visitType: 'First' | 'Subsequent',
    spaceConfig?: GameConfig
  ): Effect[] {
    const effects: Effect[] = [];
    const spaceSource = `space:${spaceName}`;

    console.log(`🏭 EFFECT_FACTORY: Creating effects from space entry: ${spaceName} (${visitType} visit)`);
    console.log(`   Found ${spaceEffects.length} space effects to process`);

    // Process each space effect
    spaceEffects.forEach((spaceEffect, index) => {
      console.log(`   Processing space effect ${index + 1}: ${spaceEffect.effect_type} - ${spaceEffect.effect_action} ${spaceEffect.effect_value}`);
      
      const effectsFromSpaceEffect = this.parseSpaceEffect(spaceEffect, playerId, spaceSource);
      effects.push(...effectsFromSpaceEffect);
    });

    // Process space action if present
    if (spaceConfig && spaceConfig.action && spaceConfig.action !== '') {
      console.log(`   Processing space action: ${spaceConfig.action}`);
      const actionEffects = this.createEffectsFromSpaceAction(spaceConfig.action, playerId, spaceName, spaceSource);
      effects.push(...actionEffects);
    }

    // Log effect for space entry
    effects.push({
      effectType: 'LOG',
      payload: {
        message: `Player ${playerId} entered space: ${spaceName} (${visitType} visit) - ${spaceEffects.length} effects processed${spaceConfig?.action ? `, action: ${spaceConfig.action}` : ''}`,
        level: 'INFO',
        source: spaceSource
      }
    });

    console.log(`🏭 EFFECT_FACTORY: Generated ${effects.length} effects from space ${spaceName}`);
    return effects;
  }

  /**
   * Create effects from space action keywords
   * 
   * @param action The action keyword from space configuration
   * @param playerId The player who triggered the action
   * @param spaceName The space name for logging
   * @param spaceSource The source identifier for effects
   * @returns Array of Effect objects for the space action
   */
  private static createEffectsFromSpaceAction(action: string, playerId: string, spaceName: string, spaceSource: string): Effect[] {
    const effects: Effect[] = [];
    
    console.log(`🎯 EFFECT_FACTORY: Processing space action '${action}' for player ${playerId} at ${spaceName}`);
    
    switch (action.toUpperCase()) {
      case 'GOTO_JAIL':
        // GOTO_JAIL just creates a log effect - the actual penalties come from existing space effects
        effects.push({
          effectType: 'LOG',
          payload: {
            message: `Player ${playerId} triggered regulatory violation at ${spaceName} - penalties applied via existing space effects`,
            level: 'WARN',
            source: spaceSource
          }
        });
        console.log(`   Generated GOTO_JAIL trigger: existing space effects will handle penalties`);
        break;
        
      case 'PAY_TAX':
        // Create RESOURCE_CHANGE effect to deduct fixed tax amount
        effects.push({
          effectType: 'RESOURCE_CHANGE',
          payload: {
            playerId: playerId,
            resource: 'MONEY',
            amount: -500,  // Fixed tax amount as specified
            source: spaceSource,
            reason: `Space action: Pay tax at ${spaceName}`
          }
        });
        console.log(`   Generated RESOURCE_CHANGE effect: ${playerId} pays $500 tax`);
        break;
        
      case 'AUCTION':
        // Create LOG effect as placeholder for auction mechanic
        effects.push({
          effectType: 'LOG',
          payload: {
            message: `Auction would start here for player ${playerId} at ${spaceName}`,
            level: 'INFO',
            source: spaceSource
          }
        });
        console.log(`   Generated LOG effect: Auction placeholder`);
        break;
        
      default:
        console.warn(`   Unknown space action '${action}' at ${spaceName} - no effects generated`);
        break;
    }
    
    console.log(`🎯 EFFECT_FACTORY: Generated ${effects.length} effects from action '${action}'`);
    return effects;
  }

  /**
   * Create effects from dice roll outcomes
   * 
   * @param diceEffects Array of DiceEffect objects for the current space and visit type
   * @param playerId The player who rolled
   * @param spaceName The space where the dice was rolled
   * @param diceResult The dice roll result (1-6)
   * @returns Array of Effect objects for dice outcomes
   */
  static createEffectsFromDiceRoll(
    diceEffects: DiceEffect[], 
    playerId: string, 
    spaceName: string, 
    diceResult: number
  ): Effect[] {
    const effects: Effect[] = [];
    const diceSource = `dice:${spaceName}`;

    console.log(`🏭 EFFECT_FACTORY: Creating effects from dice roll: ${diceResult} at ${spaceName}`);
    console.log(`   Found ${diceEffects.length} dice effects to process`);

    // Process each dice effect
    diceEffects.forEach((diceEffect, index) => {
      console.log(`   Processing dice effect ${index + 1}: ${diceEffect.effect_type} for roll ${diceResult}`);
      
      const effectsFromDiceEffect = this.parseDiceEffect(diceEffect, diceResult, playerId, diceSource);
      effects.push(...effectsFromDiceEffect);
    });

    // Log effect for dice roll
    effects.push({
      effectType: 'LOG',
      payload: {
        message: `Player ${playerId} rolled ${diceResult} at space: ${spaceName} - ${diceEffects.length} effects processed`,
        level: 'INFO',
        source: diceSource
      }
    });

    console.log(`🏭 EFFECT_FACTORY: Generated ${effects.length} effects from dice roll ${diceResult}`);
    return effects;
  }

  // === PRIVATE PARSING METHODS ===

  /**
   * Parse a SpaceEffect into Effect objects
   */
  private static parseSpaceEffect(spaceEffect: SpaceEffect, playerId: string, source: string): Effect[] {
    const effects: Effect[] = [];
    
    switch (spaceEffect.effect_type) {
      case 'money':
        const moneyAmount = this.parseEffectValue(spaceEffect.effect_value, spaceEffect.effect_action);
        if (moneyAmount !== 0) {
          effects.push({
            effectType: 'RESOURCE_CHANGE',
            payload: {
              playerId,
              resource: 'MONEY',
              amount: moneyAmount,
              source,
              reason: `${spaceEffect.description || 'Space effect'}: ${spaceEffect.effect_action} ${spaceEffect.effect_value}`
            }
          });
        }
        break;

      case 'time':
        const timeAmount = this.parseEffectValue(spaceEffect.effect_value, spaceEffect.effect_action);
        if (timeAmount !== 0) {
          effects.push({
            effectType: 'RESOURCE_CHANGE',
            payload: {
              playerId,
              resource: 'TIME',
              amount: timeAmount,
              source,
              reason: `${spaceEffect.description || 'Space effect'}: ${spaceEffect.effect_action} ${spaceEffect.effect_value}`
            }
          });
        }
        break;

      case 'cards':
        const cardEffect = this.parseCardEffect(spaceEffect.effect_action, spaceEffect.effect_value);
        if (cardEffect) {
          if (cardEffect.action === 'draw') {
            effects.push({
              effectType: 'CARD_DRAW',
              payload: {
                playerId,
                cardType: cardEffect.cardType,
                count: cardEffect.count,
                source,
                reason: `${spaceEffect.description || 'Space effect'}: Draw ${cardEffect.count} ${cardEffect.cardType} card${cardEffect.count > 1 ? 's' : ''}`
              }
            });

            // Add scope recalculation if W cards are drawn
            if (cardEffect.cardType === 'W') {
              effects.push({
                effectType: 'RECALCULATE_SCOPE',
                payload: {
                  playerId
                }
              });
            }
          }
        }
        break;

      default:
        console.warn(`Unknown space effect type: ${spaceEffect.effect_type}`);
        break;
    }

    return effects;
  }

  /**
   * Parse a DiceEffect into Effect objects for a specific dice roll
   */
  private static parseDiceEffect(diceEffect: DiceEffect, diceRoll: number, playerId: string, source: string): Effect[] {
    const effects: Effect[] = [];
    
    // Get the effect value for the specific dice roll
    const rollEffect = this.getDiceRollEffectValue(diceEffect, diceRoll);
    
    if (!rollEffect || rollEffect.trim() === '') {
      // No effect for this dice roll
      return effects;
    }

    console.log(`   Dice effect for roll ${diceRoll}: ${diceEffect.effect_type} = "${rollEffect}"`);
    switch (diceEffect.effect_type) {
      case 'cards':
        if (diceEffect.card_type) {
          // For dice effects, rollEffect is like "Draw 3" and card_type is separate
          // Extract the number from rollEffect and use the card_type from the dice effect
          const countMatch = rollEffect.match(/(\d+)/);
          if (countMatch) {
            const count = parseInt(countMatch[1]);
            const cardDrawEffectPayload = {
              effectType: 'CARD_DRAW' as const,
              payload: {
                playerId,
                cardType: diceEffect.card_type as CardType,
                count: count,
                source,
                reason: `Dice effect: Draw ${count} ${diceEffect.card_type} card${count > 1 ? 's' : ''} (rolled ${diceRoll})`
              }
            };
            effects.push(cardDrawEffectPayload);

            // Add scope recalculation if W cards are drawn
            if (diceEffect.card_type === 'W') {
              effects.push({
                effectType: 'RECALCULATE_SCOPE',
                payload: {
                  playerId
                }
              });
            }
          } else {
            console.warn(`   ⚠️ Could not parse dice effect count from: "${rollEffect}"`);
          }
        } else {
          console.warn(`   ⚠️ Dice effect missing card_type:`, diceEffect);
        }
        break;

      case 'money':
        const moneyAmount = this.parseMoneyEffect(rollEffect);
        if (moneyAmount !== 0) {
          effects.push({
            effectType: 'RESOURCE_CHANGE',
            payload: {
              playerId,
              resource: 'MONEY',
              amount: moneyAmount,
              source,
              reason: `Dice effect: ${rollEffect} (rolled ${diceRoll})`
            }
          });
        }
        break;

      case 'time':
        const timeAmount = this.parseTimeEffect(rollEffect);
        if (timeAmount !== 0) {
          effects.push({
            effectType: 'RESOURCE_CHANGE',
            payload: {
              playerId,
              resource: 'TIME',
              amount: timeAmount,
              source,
              reason: `Dice effect: ${rollEffect} (rolled ${diceRoll})`
            }
          });
        }
        break;

      default:
        console.warn(`Unknown dice effect type: ${diceEffect.effect_type}`);
        break;
    }

    return effects;
  }

  /**
   * Get the dice roll effect value for a specific roll
   */
  private static getDiceRollEffectValue(diceEffect: DiceEffect, diceRoll: number): string | undefined {
    switch (diceRoll) {
      case 1: return diceEffect.roll_1;
      case 2: return diceEffect.roll_2;
      case 3: return diceEffect.roll_3;
      case 4: return diceEffect.roll_4;
      case 5: return diceEffect.roll_5;
      case 6: return diceEffect.roll_6;
      default: return undefined;
    }
  }

  /**
   * Parse effect value with action context (e.g., "add", "subtract")
   */
  private static parseEffectValue(effectValue: string | number, effectAction: string): number {
    let value = typeof effectValue === 'number' ? effectValue : parseInt(String(effectValue).replace(/[^\d-]/g, ''));
    
    if (isNaN(value)) {
      value = 0;
    }

    // Apply action context
    if (effectAction.toLowerCase().includes('subtract') || effectAction.toLowerCase().includes('lose') || effectAction.toLowerCase().includes('pay')) {
      value = -Math.abs(value);
    } else if (effectAction.toLowerCase().includes('add') || effectAction.toLowerCase().includes('gain') || effectAction.toLowerCase().includes('receive')) {
      value = Math.abs(value);
    }

    return value;
  }

  /**
   * Parse card effect from effect action and value
   */
  private static parseCardEffect(effectAction: string, effectValue: string | number): { action: string; cardType: CardType; count: number } | null {
    const action = effectAction.toLowerCase().includes('draw') ? 'draw' : 'unknown';
    
    if (action === 'unknown') {
      return null;
    }

    // Try to extract card type and count from effect value
    // This is a simplified parser - may need enhancement based on actual data format
    const valueStr = String(effectValue);
    const match = valueStr.match(/(\d+)\s*([WBEIL])/i);
    
    if (match) {
      const count = parseInt(match[1]);
      const cardType = match[2].toUpperCase() as CardType;
      
      if (['W', 'B', 'E', 'I', 'L'].includes(cardType)) {
        return { action, cardType, count };
      }
    }

    return null;
  }

  /**
   * Parse money effect string (e.g., "+50000", "-25000", "10% of current")
   */
  private static parseMoneyEffect(moneyEffect: string): number {
    const cleanEffect = moneyEffect.trim();
    
    // Handle percentage effects (e.g., "10% of current")
    if (cleanEffect.includes('%')) {
      // TODO: Handle percentage-based money effects
      // This would require current player state to calculate percentage
      console.warn(`EFFECT_FACTORY: Percentage money effects not yet implemented: ${moneyEffect}`);
      return 0;
    }

    // Handle fixed amount effects (e.g., "+50000", "-25000")
    const amount = parseInt(cleanEffect.replace(/[^-\d]/g, ''));
    return isNaN(amount) ? 0 : amount;
  }

  /**
   * Parse time effect string (e.g., "+2", "-1", "0")
   */
  private static parseTimeEffect(timeEffect: string): number {
    const cleanEffect = timeEffect.trim();
    const amount = parseInt(cleanEffect.replace(/[^-\d]/g, ''));
    return isNaN(amount) ? 0 : amount;
  }

  /**
   * Parse card draw effect string (e.g., "2 W", "1 B", "3 E")
   */
  private static parseCardDrawEffect(drawEffect: string): Array<{ cardType: CardType; count: number }> {
    const draws: Array<{ cardType: CardType; count: number }> = [];
    const cleanEffect = drawEffect.trim();

    // Simple parsing - assumes format like "2 W" or "1 B"
    const match = cleanEffect.match(/(\d+)\s*([WBEIL])/i);
    if (match) {
      const count = parseInt(match[1]);
      const cardType = match[2].toUpperCase() as CardType;
      
      if (['W', 'B', 'E', 'I', 'L'].includes(cardType)) {
        draws.push({ cardType, count });
      }
    }

    return draws;
  }

  /**
   * Parse loan amount (e.g., "50000", "100000")
   */
  private static parseLoanAmount(loanAmount: string): number {
    const cleanAmount = loanAmount.trim().replace(/[^\d]/g, '');
    const amount = parseInt(cleanAmount);
    return isNaN(amount) ? 0 : amount;
  }

  /**
   * Parse tick modifier (e.g., "+1", "-2", "0")
   */
  private static parseTickModifier(tickModifier: string): number {
    const cleanModifier = tickModifier.trim();
    const modifier = parseInt(cleanModifier.replace(/[^-\d]/g, ''));
    return isNaN(modifier) ? 0 : modifier;
  }

  /**
   * Parse turn skip count (e.g., "1", "2")
   */
  private static parseTurnSkip(turnSkip: string): number {
    const cleanSkip = turnSkip.trim().replace(/[^\d]/g, '');
    const skip = parseInt(cleanSkip);
    return isNaN(skip) ? 0 : skip;
  }

  /**
   * Parse duration (e.g., "3", "5", "permanent")
   */
  private static parseDuration(duration: string): number {
    const cleanDuration = duration.trim().toLowerCase();
    
    if (cleanDuration === 'permanent' || cleanDuration === 'infinite') {
      return 999; // Use 999 as "permanent" duration
    }

    const durationNum = parseInt(cleanDuration.replace(/[^\d]/g, ''));
    return isNaN(durationNum) ? 0 : durationNum;
  }

  // === UTILITY METHODS ===

  /**
   * Validate that a card object has the minimum required properties
   */
  static validateCard(card: any): card is Card {
    return card && 
           typeof card === 'object' && 
           typeof card.card_id === 'string' &&
           typeof card.card_name === 'string';
  }

  /**
   * Get a summary of effects by type
   */
  static getEffectTypeSummary(effects: Effect[]): { [effectType: string]: number } {
    const summary: { [effectType: string]: number } = {};
    effects.forEach(effect => {
      summary[effect.effectType] = (summary[effect.effectType] || 0) + 1;
    });
    return summary;
  }

  // === TARGETING HELPER METHODS ===

  /**
   * Extract effects that can be targeted at other players
   */
  private static extractTargetableEffects(effects: Effect[]): Effect[] {
    return effects.filter(effect => this.isTargetableEffectType(effect.effectType));
  }

  /**
   * Check if an effect type can be targeted at other players
   */
  private static isTargetableEffectType(effectType: Effect['effectType']): boolean {
    return ['RESOURCE_CHANGE', 'CARD_DRAW', 'CARD_DISCARD', 'TURN_CONTROL'].includes(effectType);
  }

  /**
   * Parse target string into targetType enum
   */
  private static parseTargetType(target: string): 'OTHER_PLAYER_CHOICE' | 'ALL_OTHER_PLAYERS' | 'ALL_PLAYERS' {
    const targetLower = target.toLowerCase().trim().replace(/\s+/g, '_');
    
    if (targetLower.includes('other_player') || targetLower.includes('choose') || targetLower === 'opponent') {
      return 'OTHER_PLAYER_CHOICE';
    } else if (targetLower.includes('all_other') || targetLower.includes('other_players')) {
      return 'ALL_OTHER_PLAYERS';
    } else if (targetLower.includes('all_players') || targetLower === 'everyone') {
      return 'ALL_PLAYERS';
    } else {
      // Default to single player choice for unknown formats
      return 'OTHER_PLAYER_CHOICE';
    }
  }

  /**
   * Generate a user-friendly prompt for target selection
   */
  private static generateTargetPrompt(target: string, cardName: string, effect: Effect): string {
    const targetType = this.parseTargetType(target);
    
    // Generate effect description for prompt
    let effectDescription = 'apply effect';
    if (effect.effectType === 'RESOURCE_CHANGE' && 'payload' in effect) {
      const payload = effect.payload as any;
      if (payload.resource === 'MONEY') {
        effectDescription = payload.amount > 0 
          ? `give $${Math.abs(payload.amount)}` 
          : `take $${Math.abs(payload.amount)}`;
      } else if (payload.resource === 'TIME') {
        effectDescription = payload.amount > 0 
          ? `add ${Math.abs(payload.amount)} time units` 
          : `remove ${Math.abs(payload.amount)} time units`;
      }
    } else if (effect.effectType === 'CARD_DRAW' && 'payload' in effect) {
      const payload = effect.payload as any;
      effectDescription = `draw ${payload.count} ${payload.cardType} card${payload.count > 1 ? 's' : ''}`;
    }
    
    switch (targetType) {
      case 'OTHER_PLAYER_CHOICE':
        return `${cardName}: Choose a player to ${effectDescription}`;
      case 'ALL_OTHER_PLAYERS':
        return `${cardName}: ${effectDescription} for all other players`;
      case 'ALL_PLAYERS':
        return `${cardName}: ${effectDescription} for all players`;
      default:
        return `${cardName}: Choose target for effect`;
    }
  }
}