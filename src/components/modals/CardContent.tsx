// src/components/modals/CardContent.tsx

import React from 'react';

/**
 * Card data interface based on the legacy component's expected structure
 */
interface CardData {
  card_name?: string;
  description?: string;
  phase_restriction?: string;
  space_restriction?: string;
  scope_restriction?: string;
  work_type_restriction?: string;
  time_effect?: string;
  tick_modifier?: string;
  duration?: string;
  money_cost?: string;
  money_effect?: string;
  loan_amount?: string;
  investment_amount?: string;
  work_cost?: string;
  loan_rate?: string;
  draw_cards?: string;
  discard_cards?: string;
  card_type_filter?: string;
  turn_effect?: string;
  conditional_logic?: string;
  dice_trigger?: string;
  dice_effect?: string;
  movement_effect?: string;
  space_effect?: string;
  immediate_effect?: string;
  chain_effect?: string;
  nullify_effect?: string;
  percentage_effect?: string;
  inspection_effect?: string;
  usage_limit?: string;
  cooldown?: string;
  stacking_limit?: string;
}

interface CardContentProps {
  card?: CardData;
  isFlipped?: boolean;
}

/**
 * Effect structure for organized display
 */
interface CardEffect {
  category: string;
  type: string;
  label: string;
  value: string;
  icon: string;
}

/**
 * CardContent component displays the visual details of a card
 * Extracted from the legacy CardModalContent component's rendering logic
 */
export function CardContent({ card, isFlipped = false }: CardContentProps): JSX.Element {
  // Default placeholder card when none provided
  const defaultCard: CardData = {
    card_name: "Sample Card",
    description: "This is a placeholder card for demonstration purposes.",
    phase_restriction: "DESIGN",
    time_effect: "Skip 1 turn",
    money_cost: "10000",
    draw_cards: "2",
    immediate_effect: "Gain extra resources"
  };

  const displayCard = card || defaultCard;

  /**
   * Phase restriction color mapping
   */
  const getPhaseColors = (phaseRestriction?: string) => {
    const colorMap = {
      'DESIGN': { 
        bg: '#fff9c4', 
        border: '#fbbf24', 
        accent: '#f59e0b',
        text: '#92400e' 
      },
      'CONSTRUCTION': { 
        bg: '#ede9fe', 
        border: '#8b5cf6', 
        accent: '#7c3aed',
        text: '#5b21b6' 
      },
      'FUNDING': { 
        bg: '#dcfce7', 
        border: '#22c55e', 
        accent: '#16a34a',
        text: '#15803d' 
      },
      'REGULATORY_REVIEW': { 
        bg: '#fee2e2', 
        border: '#ef4444', 
        accent: '#dc2626',
        text: '#991b1b' 
      }
    };
    return colorMap[phaseRestriction as keyof typeof colorMap] || { 
      bg: '#f8f9fa', 
      border: '#dee2e6', 
      accent: '#6c757d',
      text: '#495057' 
    };
  };

  /**
   * Parse card effects into organized structure
   */
  const parseCardEffects = (card: CardData): CardEffect[] => {
    const effects: CardEffect[] = [];

    const hasValue = (value?: string) => {
      return value && value !== '' && value !== '0' && value.toString().toLowerCase() !== 'null';
    };

    const formatMoney = (value: string) => {
      const num = parseInt(value);
      return isNaN(num) ? value : `$${num.toLocaleString()}`;
    };

    // Time Effects
    if (hasValue(card.time_effect)) {
      effects.push({
        category: 'Time Effects',
        type: 'time_effect',
        label: 'Time Effect',
        value: card.time_effect!,
        icon: '⏱️'
      });
    }

    if (hasValue(card.tick_modifier)) {
      const tickValue = parseInt(card.tick_modifier!);
      const tickText = tickValue > 0 ? `+${tickValue} ticks` : `${tickValue} ticks`;
      effects.push({
        category: 'Time Effects',
        type: 'tick_modifier',
        label: 'Tick Modifier',
        value: tickText,
        icon: '⏲️'
      });
    }

    // Money Effects
    if (hasValue(card.money_cost)) {
      effects.push({
        category: 'Money Effects',
        type: 'money_cost',
        label: 'Money Cost',
        value: formatMoney(card.money_cost!),
        icon: '💰'
      });
    }

    if (hasValue(card.money_effect)) {
      effects.push({
        category: 'Money Effects',
        type: 'money_effect',
        label: 'Money Effect',
        value: card.money_effect!,
        icon: '💵'
      });
    }

    // Card Effects
    if (hasValue(card.draw_cards)) {
      const drawCount = parseInt(card.draw_cards!);
      effects.push({
        category: 'Card Effects',
        type: 'draw_cards',
        label: 'Draw Cards',
        value: `Draw ${drawCount} card${drawCount !== 1 ? 's' : ''}`,
        icon: '🎴'
      });
    }

    // Special Effects
    if (hasValue(card.immediate_effect)) {
      effects.push({
        category: 'Special Effects',
        type: 'immediate_effect',
        label: 'Immediate Effect',
        value: card.immediate_effect!,
        icon: '⚡'
      });
    }

    return effects;
  };

  /**
   * Group effects by category
   */
  const groupEffectsByCategory = (effects: CardEffect[]) => {
    const grouped: Record<string, CardEffect[]> = {};
    effects.forEach(effect => {
      if (!grouped[effect.category]) {
        grouped[effect.category] = [];
      }
      grouped[effect.category].push(effect);
    });
    return grouped;
  };

  /**
   * Get category-specific colors
   */
  const getCategoryColors = (categoryName: string) => {
    const categoryColors = {
      'Time Effects': { bg: '#fff3cd', border: '#ffeaa7', text: '#856404' },
      'Money Effects': { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
      'Card Effects': { bg: '#e2e3f3', border: '#c3c6f7', text: '#4a2c7a' },
      'Special Effects': { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8' },
    };
    return categoryColors[categoryName as keyof typeof categoryColors] || { 
      bg: '#f8f9fa', 
      border: '#dee2e6', 
      text: '#495057' 
    };
  };

  // Handle flipped card state
  if (isFlipped) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'white',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px'
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          fontSize: '48px'
        }}>
          🎯
        </div>
        <h3 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '10px',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          UNRAVEL
        </h3>
        <p style={{
          fontSize: '14px',
          opacity: 0.8,
          fontStyle: 'italic'
        }}>
          Project Management Game
        </p>
        <p style={{
          fontSize: '12px',
          opacity: 0.6,
          marginTop: '20px'
        }}>
          Click to flip back
        </p>
      </div>
    );
  }

  // Main card content
  const effects = parseCardEffects(displayCard);
  const groupedEffects = groupEffectsByCategory(effects);
  const phaseColors = getPhaseColors(displayCard.phase_restriction);

  return (
    <div style={{
      padding: '20px',
      maxHeight: '400px',
      overflowY: 'auto',
      fontSize: '13px',
      background: phaseColors.bg,
      border: `2px solid ${phaseColors.border}`,
      borderRadius: '8px'
    }}>
      {/* Phase restriction header */}
      {displayCard.phase_restriction && displayCard.phase_restriction !== 'Any' && (
        <div style={{
          background: `linear-gradient(135deg, ${phaseColors.border}, ${phaseColors.accent})`,
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '15px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          🏷️ Phase: {displayCard.phase_restriction}
        </div>
      )}

      {/* Basic card information */}
      {(displayCard.card_name || displayCard.description) && (
        <div style={{
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: phaseColors.text,
            marginBottom: '10px',
            textTransform: 'uppercase'
          }}>
            Card Information
          </div>
          
          {displayCard.card_name && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Name: </strong>
              <span>{displayCard.card_name}</span>
            </div>
          )}
          
          {displayCard.description && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Description: </strong>
              <span>{displayCard.description}</span>
            </div>
          )}
        </div>
      )}

      {/* Effect categories */}
      {Object.entries(groupedEffects).map(([categoryName, categoryEffects], index) => {
        const colors = getCategoryColors(categoryName);
        
        return (
          <div key={`category-${index}`} style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '15px'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: colors.text,
              marginBottom: '10px',
              textTransform: 'uppercase'
            }}>
              {categoryName}
            </div>
            
            {categoryEffects.map((effect, effectIndex) => (
              <div key={`effect-${effect.type}-${effectIndex}`} style={{
                marginBottom: '8px',
                padding: '6px',
                background: 'rgba(255,255,255,0.7)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  marginRight: '8px',
                  fontSize: '14px'
                }}>
                  {effect.icon}
                </span>
                <strong style={{ marginRight: '4px' }}>
                  {effect.label}:
                </strong>
                <span>{effect.value}</span>
              </div>
            ))}
          </div>
        );
      })}

      {/* No effects message */}
      {Object.keys(groupedEffects).length === 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '8px',
          padding: '15px',
          textAlign: 'center',
          fontStyle: 'italic',
          color: '#6c757d'
        }}>
          📄 This card has no special effects.
        </div>
      )}
    </div>
  );
}