import React, { useState } from 'react';
import { ExpandableSection } from '../ExpandableSection';
import { ActionButton } from '../ActionButton';
import { IServiceContainer } from '../../../types/ServiceContracts';
import './FinancesSection.css';

/**
 * Props for the FinancesSection component
 */
export interface FinancesSectionProps {
  /** Game services container providing access to all game services */
  gameServices: IServiceContainer;

  /** ID of the player whose finances to display */
  playerId: string;

  /** Whether the section is currently expanded */
  isExpanded: boolean;

  /** Callback fired when the section header is clicked */
  onToggle: () => void;

  /** Callback to handle dice roll / Get Funding action */
  onRollDice?: () => Promise<void>;

  /** Completed actions tracking */
  completedActions?: {
    diceRoll?: string;
    manualActions: { [effectType: string]: string };
  };
}

/**
 * FinancesSection Component
 *
 * Displays the player's financial information and provides ALL money-related manual actions.
 * Part of the mobile-first Player Panel UI redesign.
 *
 * **Displays:**
 * - Current balance (money)
 * - Surplus (if positive - currently placeholder)
 *
 * **Actions:**
 * - Dynamically shows ALL manual money effects from current space
 * - Note: Funding at OWNER-FUND-INITIATION is automatic (no manual button needed)
 *
 * **Features:**
 * - Automatically detects ALL manual effects from current space
 * - Error handling with retry functionality
 * - Loading states during action execution
 * - Conditional rendering of action buttons
 *
 * **Integration:**
 * - Uses `triggerManualEffectWithFeedback` from TurnService
 * - Dynamically queries space effects from DataService
 * - Shows action indicator (🔴) when manual actions are available
 *
 * @example
 * ```tsx
 * <FinancesSection
 *   gameServices={gameServices}
 *   playerId="player-1"
 *   isExpanded={isFinancesExpanded}
 *   onToggle={() => setIsFinancesExpanded(!isFinancesExpanded)}
 * />
 * ```
 */
export const FinancesSection: React.FC<FinancesSectionProps> = ({
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
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  // Get player state
  const player = gameServices.stateService.getPlayer(playerId);
  if (!player) {
    return null;
  }

  // Get ALL manual effects for money from current space
  const allSpaceEffects = gameServices.dataService.getSpaceEffects(player.currentSpace, player.visitType);
  const moneyManualEffects = allSpaceEffects.filter(
    effect => effect.trigger_type === 'manual' && effect.effect_type === 'money'
  );

  // Check if on OWNER-FUND-INITIATION space (special funding action)
  const isOnFundingSpace = player.currentSpace === 'OWNER-FUND-INITIATION';
  const canGetFunding = isOnFundingSpace && onRollDice && completedActions.diceRoll === undefined;

  // Check if there are any money manual actions available
  const hasMoneyActions = moneyManualEffects.length > 0 || canGetFunding;

  // Calculate surplus (optional - may not exist in current implementation)
  const surplus = 0; // TODO: Implement surplus calculation if needed

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

  const handleRetry = () => {
    setError(null);
  };

  const toggleSource = (sourceName: string) => {
    setExpandedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceName)) {
        newSet.delete(sourceName);
      } else {
        newSet.add(sourceName);
      }
      return newSet;
    });
  };

  // Money sources structure (showing completed funding)
  const moneySources = [
    {
      name: 'Owner Funding',
      amount: 0, // TODO: Track from game state
      description: 'Seed money',
      processed: isOnFundingSpace || completedActions.manualActions.funding !== undefined
    },
    {
      name: 'Bank Loans',
      amount: 0, // TODO: Track from game state
      description: 'Bank financing',
      processed: false // TODO: Track from game state
    },
    {
      name: 'Investment Deals',
      amount: 0, // TODO: Track from game state
      description: 'Investor funding',
      processed: false // TODO: Track from game state
    }
  ].filter(source => source.processed); // Only show processed sources

  // Handler for Get Funding / dice roll
  const handleGetFunding = async () => {
    if (!onRollDice) return;

    setIsRollingDice(true);
    setError(null);

    try {
      await onRollDice();
    } catch (err) {
      setError('Failed to get funding. Please try again.');
      console.error('Get funding error:', err);
    } finally {
      setIsRollingDice(false);
    }
  };

  // Helper to format button label from effect
  const getButtonLabel = (effect: any): string => {
    if (effect.description) return effect.description;
    if (effect.effect_type === 'money') return 'Get Money';
    return effect.effect_type;
  };

  // Create header actions (action buttons always visible)
  const headerActions = (moneyManualEffects.length > 0 || canGetFunding) ? (
    <>
      {/* Get Funding button for OWNER-FUND-INITIATION space */}
      {canGetFunding && (
        <ActionButton
          key="get-funding"
          label="💰 Get Funding"
          variant="primary"
          onClick={handleGetFunding}
          disabled={isLoading || isRollingDice}
          isLoading={isRollingDice}
          ariaLabel="Get funding from owner"
        />
      )}

      {/* Render ALL money manual effects as buttons */}
      {moneyManualEffects.map((effect, index) => {
        const isEffectCompleted = completedActions.manualActions[effect.effect_type] !== undefined;
        return !isEffectCompleted && (
          <ActionButton
            key={index}
            label={getButtonLabel(effect)}
            variant="primary"
            onClick={() => handleManualEffect(effect.effect_type)}
            disabled={isLoading}
            isLoading={isLoading}
            ariaLabel={`Perform ${effect.effect_type} action`}
          />
        );
      })}
    </>
  ) : undefined;

  // Summary content - always visible
  const summary = <span>Balance: ${player.money.toLocaleString()}</span>;

  return (
    <ExpandableSection
      title="FINANCES"
      icon="💰"
      hasAction={hasMoneyActions}
      isExpanded={isExpanded}
      onToggle={onToggle}
      ariaControls="finances-content"
      isLoading={isLoading}
      error={error || undefined}
      onRetry={error ? handleRetry : undefined}
      headerActions={headerActions}
      summary={summary}
    >
      <div className="finances-content" id="finances-content">
        {/* Money Sources (only show if sources exist) */}
        {moneySources.length > 0 && (
          <div className="money-sources-section">
            <div className="sources-header">💰 Sources of Money</div>
            {moneySources.map((source, index) => {
              const isExpanded = expandedSources.has(source.name);
              return (
                <div key={index} className="money-source-group">
                  <button
                    className="money-source-header"
                    onClick={() => toggleSource(source.name)}
                  >
                    <span className="source-info">
                      <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                      <span className="source-name">{source.name}</span>
                    </span>
                    {source.amount > 0 && (
                      <span className="source-amount">${source.amount.toLocaleString()}</span>
                    )}
                  </button>
                  {isExpanded && (
                    <div className="source-details">
                      <div className="source-description">{source.description}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {surplus > 0 && (
          <div className="stat-line">
            <span className="stat-label">Surplus:</span>
            <span className="stat-value">${surplus}</span>
          </div>
        )}
      </div>
    </ExpandableSection>
  );
};
