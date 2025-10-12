import React, { useState } from 'react';
import { ExpandableSection } from '../ExpandableSection';
import { ActionButton } from '../ActionButton';
import { IServiceContainer } from '../../../types/ServiceContracts';
import { CardType } from '../../../types/DataTypes';
import './CardsSection.css';

/**
 * Props for the CardsSection component
 */
export interface CardsSectionProps {
  /** Game services container providing access to all game services */
  gameServices: IServiceContainer;

  /** ID of the player whose card portfolio to display */
  playerId: string;

  /** Whether the section is currently expanded */
  isExpanded: boolean;

  /** Callback fired when the section header is clicked */
  onToggle: () => void;

  /** Callback to handle dice roll action */
  onRollDice?: () => Promise<void>;

  /** Completed actions tracking */
  completedActions?: {
    diceRoll?: string;
    manualActions: { [effectType: string]: string };
  };
}

/**
 * CardsSection Component
 *
 * Displays the player's card portfolio summary and provides actions for acquiring cards.
 * Part of the mobile-first Player Panel UI redesign.
 *
 * **Displays:**
 * - Total cards in hand
 * - Card type breakdown (W, B, etc. with counts)
 *
 * **Actions:**
 * - "Roll for W Cards" button (appears when `ROLL_FOR_CARDS_W` is available)
 * - "Roll for B Cards" button (appears when `ROLL_FOR_CARDS_B` is available)
 * - "View Discarded" button (always visible - secondary action)
 *
 * **Features:**
 * - Automatically detects available card actions from game state
 * - Dynamic card type counting with CardService integration
 * - Error handling with retry functionality for roll actions
 * - Loading states during action execution
 * - Conditional rendering of roll action buttons
 * - Multiple simultaneous action buttons with proper spacing
 *
 * **Integration:**
 * - Uses `triggerManualEffectWithFeedback` from TurnService for roll actions
 * - Uses `getCardType` from CardService for portfolio analysis
 * - Subscribes to state changes via ExpandableSection
 * - Shows action indicator (🔴) when any card action is available
 *
 * @example
 * ```tsx
 * <CardsSection
 *   gameServices={gameServices}
 *   playerId="player-1"
 *   isExpanded={isCardsExpanded}
 *   onToggle={() => setIsCardsExpanded(!isCardsExpanded)}
 * />
 * ```
 */
export const CardsSection: React.FC<CardsSectionProps> = ({
  gameServices,
  playerId,
  isExpanded,
  onToggle,
  onRollDice,
  completedActions = { manualActions: {} }
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [expandedCardType, setExpandedCardType] = useState<CardType | null>(null);

  // Get player state
  const player = gameServices.stateService.getPlayer(playerId);
  if (!player) {
    return null;
  }

  // Get ALL manual effects for cards from current space
  const allSpaceEffects = gameServices.dataService.getSpaceEffects(player.currentSpace, player.visitType);
  const cardManualEffects = allSpaceEffects.filter(
    effect => effect.trigger_type === 'manual' && effect.effect_type === 'cards'
  );

  // Get dice effects for cards (excluding W which shows in Project Scope)
  const allDiceEffects = gameServices.dataService.getDiceEffects(player.currentSpace, player.visitType);
  const cardDiceEffects = allDiceEffects.filter(
    effect => effect.effect_type === 'cards' && effect.card_type !== 'W' // W cards shown in Project Scope
  );

  // Check if there are any card actions available (manual or dice)
  const hasCardActions = cardManualEffects.length > 0 || cardDiceEffects.length > 0;

  // Calculate card counts
  const playerHand = player.hand || [];
  const totalCards = playerHand.length;
  
  // Count cards by type
  const cardCounts: { [key in CardType]?: number } = {};
  playerHand.forEach(cardId => {
    const cardType = gameServices.cardService.getCardType(cardId);
    if (cardType) {
      cardCounts[cardType] = (cardCounts[cardType] || 0) + 1;
    }
  });

  const handleManualEffect = async (effectType: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await gameServices.turnService.triggerManualEffectWithFeedback(playerId, effectType);
    } catch (err) {
      setError(`Failed to perform ${effectType} action. Please try again.`);
      console.error(`Manual effect error (${effectType}):`, err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for dice roll
  const handleDiceRoll = async () => {
    if (!onRollDice) return;

    setIsRollingDice(true);
    setError(null);

    try {
      await onRollDice();
    } catch (err) {
      setError('Failed to roll dice. Please try again.');
      console.error('Dice roll error:', err);
    } finally {
      setIsRollingDice(false);
    }
  };

  // Helper to format button label from manual effect
  const getManualEffectButtonLabel = (effect: any): string => {
    if (effect.description) return effect.description;
    if (effect.effect_action === 'draw_e') return 'Pick up E Cards';
    if (effect.effect_action === 'draw_l') return 'Get L Cards';
    if (effect.effect_action === 'draw_i') return 'Get I Cards';
    if (effect.effect_action === 'draw_b') return 'Get B Cards';
    return 'Get Cards';
  };

  // Helper to format dice button label
  const getDiceButtonLabel = (cardType: string): string => {
    switch (cardType) {
      case 'B': return 'Roll for B Cards';
      case 'E': return 'Roll for E Cards';
      case 'L': return 'Roll for L Cards';
      case 'I': return 'Roll for I Cards';
      default: return 'Roll for Cards';
    }
  };

  // Create header actions (action buttons always visible)
  const headerActions = (cardManualEffects.length > 0 || cardDiceEffects.length > 0) ? (
    <>
      {/* Dice roll buttons for cards (excluding W which is in Project Scope) */}
      {cardDiceEffects.map((effect, index) => {
        // Check if dice roll is completed
        const isDiceCompleted = completedActions.diceRoll !== undefined;

        return onRollDice && !isDiceCompleted && (
          <ActionButton
            key={`dice-${index}`}
            label={getDiceButtonLabel(effect.card_type || '')}
            variant="primary"
            onClick={handleDiceRoll}
            disabled={isLoading || isRollingDice}
            isLoading={isRollingDice}
            ariaLabel={`Roll dice to gain ${effect.card_type} type cards`}
          />
        );
      })}

      {/* Manual effect buttons */}
      {cardManualEffects.map((effect, index) => {
        // Check if this specific manual effect is completed
        const isEffectCompleted = completedActions.manualActions[effect.effect_type] !== undefined;

        return !isEffectCompleted && (
          <ActionButton
            key={`manual-${index}`}
            label={getManualEffectButtonLabel(effect)}
            variant="primary"
            onClick={() => handleManualEffect(effect.effect_type)}
            disabled={isLoading}
            isLoading={isLoading}
            ariaLabel={`Perform ${effect.effect_action} action`}
          />
        );
      })}
    </>
  ) : undefined;

  const handleViewDiscarded = () => {
    // TODO: Implement discard pile modal/drawer
    console.log('View discarded cards - to be implemented');
  };

  const handleRetry = () => {
    setError(null);
  };

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const toggleCardType = (cardType: CardType) => {
    if (expandedCardType === cardType) {
      setExpandedCardType(null);
    } else {
      setExpandedCardType(cardType);
    }
  };

  // Summary content - always visible
  const summary = (
    <span>
      Total: {totalCards}
      {Object.keys(cardCounts).length > 0 && (
        <> | {(Object.keys(cardCounts) as CardType[]).map((type, idx, arr) => (
          <span key={type}>
            {type}: {cardCounts[type]}
            {idx < arr.length - 1 && ', '}
          </span>
        ))}</>
      )}
    </span>
  );

  return (
    <ExpandableSection
      title="CARDS"
      icon="🎴"
      hasAction={hasCardActions}
      isExpanded={isExpanded}
      onToggle={onToggle}
      ariaControls="cards-content"
      isLoading={isLoading}
      error={error || undefined}
      onRetry={error ? handleRetry : undefined}
      headerActions={headerActions}
      summary={summary}
    >
      <div className="cards-content" id="cards-content">

        {/* Card List - grouped by type */}
        {playerHand.length > 0 ? (
          <div className="card-list">
            {(Object.keys(cardCounts) as CardType[]).map((cardType) => {
              // Get all cards of this type
              const cardsOfType = playerHand
                .map(cardId => ({
                  id: cardId,
                  card: gameServices.dataService.getCardById(cardId)
                }))
                .filter(item => item.card && gameServices.cardService.getCardType(item.id) === cardType);

              const isTypeExpanded = expandedCardType === cardType;

              return (
                <div key={cardType} className="card-type-group">
                  <button
                    className="card-type-header"
                    onClick={() => toggleCardType(cardType)}
                  >
                    <span className="card-type-info">
                      <span className="expand-icon">{isTypeExpanded ? '▼' : '▶'}</span>
                      <span className="card-type-name">{cardType} Cards ({cardsOfType.length})</span>
                    </span>
                  </button>

                  {isTypeExpanded && (
                    <div className="cards-list">
                      {cardsOfType.map((item) => {
                        if (!item.card) return null;
                        const isCardExpanded = expandedCards.has(item.id);

                        return (
                          <div key={item.id} className="card-item">
                            <button
                              className="card-header"
                              onClick={() => toggleCard(item.id)}
                            >
                              <span className="card-title">
                                <span className="expand-icon-small">{isCardExpanded ? '▼' : '▶'}</span>
                                {item.card.card_name || item.id}
                              </span>
                            </button>

                            {isCardExpanded && (
                              <div className="card-details">
                                {item.card.description && (
                                  <div className="card-detail-row">
                                    <span className="detail-label">Description:</span>
                                    <span className="detail-value">{item.card.description}</span>
                                  </div>
                                )}
                                {item.card.work_type_restriction && (
                                  <div className="card-detail-row">
                                    <span className="detail-label">Work Type:</span>
                                    <span className="detail-value">{item.card.work_type_restriction}</span>
                                  </div>
                                )}
                                {item.card.work_cost && (
                                  <div className="card-detail-row">
                                    <span className="detail-label">Cost:</span>
                                    <span className="detail-value">${Number(item.card.work_cost).toLocaleString()}</span>
                                  </div>
                                )}
                                {item.card.duration_turns && (
                                  <div className="card-detail-row">
                                    <span className="detail-label">Duration:</span>
                                    <span className="detail-value">{item.card.duration_turns} turns</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            No cards in hand yet.
          </div>
        )}

        <div className="card-actions">
          <ActionButton
            label="View Discarded"
            variant="secondary"
            onClick={handleViewDiscarded}
            disabled={isLoading}
            ariaLabel="View your discarded cards"
          />
        </div>
      </div>
    </ExpandableSection>
  );
};
