// src/utils/EffectFactory.ts

import { Card, CardType } from '../types/DataTypes';
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
      const duration = this.parseDuration(card.duration);
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
   * @param spaceName The space being entered
   * @param playerId The player entering the space
   * @param visitType Whether this is first or subsequent visit
   * @returns Array of Effect objects for space entry
   */
  static createEffectsFromSpaceEntry(spaceName: string, playerId: string, visitType: 'First' | 'Subsequent'): Effect[] {
    const effects: Effect[] = [];
    const spaceSource = `space:${spaceName}`;

    // Log effect for space entry
    effects.push({
      effectType: 'LOG',
      payload: {
        message: `Player ${playerId} entered space: ${spaceName} (${visitType} visit)`,
        level: 'INFO',
        source: spaceSource
      }
    });

    // TODO: In future, add logic to read space effects from CSV and convert to effects
    // This would involve parsing SPACE_EFFECTS.csv and DICE_EFFECTS.csv

    return effects;
  }

  /**
   * Create effects from dice roll outcomes
   * 
   * @param spaceName The space where the dice was rolled
   * @param playerId The player who rolled
   * @param diceResult The dice roll result
   * @returns Array of Effect objects for dice outcomes
   */
  static createEffectsFromDiceRoll(spaceName: string, playerId: string, diceResult: number): Effect[] {
    const effects: Effect[] = [];
    const diceSource = `dice:${spaceName}`;

    // Log effect for dice roll
    effects.push({
      effectType: 'LOG',
      payload: {
        message: `Player ${playerId} rolled ${diceResult} at space: ${spaceName}`,
        level: 'INFO',
        source: diceSource
      }
    });

    // TODO: In future, add logic to read dice effects from CSV and convert to effects

    return effects;
  }

  // === PRIVATE PARSING METHODS ===

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
}