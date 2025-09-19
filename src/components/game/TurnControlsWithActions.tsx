// src/components/game/TurnControlsWithActions.tsx

import React, { useState, useEffect } from 'react';
import { colors } from '../../styles/theme';
import { useGameContext } from '../../context/GameContext';
// Modal imports removed - using persistent GameLog instead
import { Player } from '../../types/DataTypes';
import { GamePhase, ActionLogEntry } from '../../types/StateTypes';
import { Choice } from '../../types/CommonTypes';
import { formatActionDescription } from '../../utils/actionLogFormatting';
import { formatManualEffectButton, formatDiceRollButton, getManualEffectButtonStyle, formatDiceRollFeedback } from '../../utils/buttonFormatting';
import { NotificationUtils } from '../../utils/NotificationUtils';

interface TurnControlsWithActionsProps {
  // Game state data - currentPlayer is guaranteed to exist by higher-level architecture
  currentPlayer: Player;
  gamePhase: GamePhase;
  isProcessingTurn: boolean;
  hasPlayerMovedThisTurn: boolean;
  hasPlayerRolledDice: boolean;
  hasCompletedManualActions: boolean;
  awaitingChoice: boolean;
  actionCounts: { required: number; completed: number };
  completedActions: {
    diceRoll?: string;
    manualActions: { [effectType: string]: string };
  };
  feedbackMessage: string;
  buttonFeedback: { [actionType: string]: string };
  
  // Action handlers
  onRollDice: () => Promise<void>;
  onEndTurn: () => Promise<void>;
  onManualEffect: (effectType: string) => Promise<void>;
  onNegotiate: () => Promise<void>;
  onAutomaticFunding?: () => Promise<void>;
  
  // Legacy props (can be removed in future cleanup)
  onOpenNegotiationModal: () => void;
  playerId: string;
  playerName: string;
}

/**
 * Merged Turn Controls and Action Log - buttons are replaced by action entries when completed
 */
export function TurnControlsWithActions({ 
  // Game state data
  currentPlayer,
  gamePhase,
  isProcessingTurn,
  hasPlayerMovedThisTurn,
  hasPlayerRolledDice,
  hasCompletedManualActions,
  awaitingChoice,
  actionCounts,
  completedActions,
  feedbackMessage,
  buttonFeedback,
  // Action handlers
  onRollDice,
  onEndTurn,
  onManualEffect,
  onNegotiate,
  onAutomaticFunding,
  // Legacy props
  onOpenNegotiationModal,
  playerId,
  playerName 
}: TurnControlsWithActionsProps): JSX.Element {
  const { dataService, stateService, choiceService, notificationService } = useGameContext();

  // Movement choice state
  const [currentChoice, setCurrentChoice] = useState<Choice | null>(null);

  // Subscribe to state changes for movement choices
  useEffect(() => {
    console.log('🔥 TurnControlsWithActions: Setting up movement choice subscription');
    const unsubscribe = stateService.subscribe((gameState) => {
      console.log('🔥 TurnControlsWithActions: Received state update', {
        awaitingChoice: gameState.awaitingChoice?.type || null,
        currentPlayer: gameState.currentPlayerId
      });

      // Update movement choice state
      setCurrentChoice(gameState.awaitingChoice);

      if (gameState.awaitingChoice?.type === 'MOVEMENT') {
        console.log('🔥 TurnControlsWithActions: Movement choice detected!', {
          choice: gameState.awaitingChoice,
          options: gameState.awaitingChoice.options
        });
      }
    });

    // Initialize with current state
    const gameState = stateService.getGameState();
    setCurrentChoice(gameState.awaitingChoice);

    return unsubscribe;
  }, [stateService]);

  // Handle movement choice selection
  const handleMovementChoice = async (choiceId: string) => {
    if (!currentChoice || currentChoice.type !== 'MOVEMENT') {
      console.error('🔥 TurnControlsWithActions: No valid movement choice available');
      return;
    }

    try {
      console.log('🔥 TurnControlsWithActions: Resolving movement choice:', choiceId);

      // Add notification feedback before resolving choice
      notificationService.notify(
        NotificationUtils.createSuccessNotification('Path Chosen', `Selected destination: ${choiceId}`, currentPlayer.name),
        {
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          actionType: `move_${choiceId}`
        }
      );

      await choiceService.resolveChoice(currentChoice.id, choiceId);
      console.log('🔥 TurnControlsWithActions: Movement choice resolved successfully');
    } catch (error) {
      console.error('🔥 TurnControlsWithActions: Error resolving movement choice:', error);
    }
  };





  // Helper function to evaluate effect conditions
  const evaluateEffectCondition = (condition: string | undefined): boolean => {
    if (!condition || condition === 'always') return true;

    const conditionLower = condition.toLowerCase();
    
    // Project scope conditions
    const projectScope = currentPlayer.projectScope || 0;
    if (conditionLower === 'scope_le_4m') {
      return projectScope <= 4000000;
    }
    if (conditionLower === 'scope_gt_4m') {
      return projectScope > 4000000;
    }
    
    // Add other conditions as needed
    // For now, default to true for unknown conditions
    return true;
  };

  // Check for available manual effects with condition evaluation
  // Filter out 'turn' effects since they duplicate the regular End Turn button
  const manualEffects = dataService.getSpaceEffects(currentPlayer.currentSpace, currentPlayer.visitType)
    .filter(effect => effect.trigger_type === 'manual')
    .filter(effect => effect.effect_type !== 'turn') // Exclude turn effects to avoid duplicate end turn buttons
    .filter(effect => evaluateEffectCondition(effect.condition));

  // Check if negotiation is available on current space
  const canNegotiate = dataService.getSpaceContent(currentPlayer.currentSpace, currentPlayer.visitType)?.can_negotiate === true;

  // Calculate space time cost that will be spent when rolling dice/taking actions
  const getSpaceTimeCost = (): number => {
    const spaceEffects = dataService.getSpaceEffects(currentPlayer.currentSpace, currentPlayer.visitType);
    return spaceEffects
      .filter(effect => effect.effect_type === 'time' && effect.effect_action === 'add' && evaluateEffectCondition(effect.condition))
      .reduce((total, effect) => total + Number(effect.effect_value || 0), 0);
  };

  const spaceTimeCost = getSpaceTimeCost();

  // All players can take actions when it's their turn - currentPlayer is guaranteed to exist
  const isCurrentPlayersTurn = true;
  const canRollDice = gamePhase === 'PLAY' && isCurrentPlayersTurn &&
                     !isProcessingTurn && !hasPlayerRolledDice && !hasPlayerMovedThisTurn && !awaitingChoice &&
                     currentPlayer.currentSpace !== 'OWNER-FUND-INITIATION'; // Hide dice roll for funding space
  const canEndTurn = gamePhase === 'PLAY' && isCurrentPlayersTurn &&
                    !isProcessingTurn && hasPlayerRolledDice && actionCounts.completed >= actionCounts.required &&
                    !(currentChoice && currentChoice.type === 'MOVEMENT'); // Disable end turn if movement choice pending


  // Get contextual dice roll button text using centralized utility
  const getDiceRollButtonText = (): string => {
    const diceEffects = dataService.getDiceEffects(currentPlayer.currentSpace, currentPlayer.visitType);
    const spaceEffects = dataService.getSpaceEffects(currentPlayer.currentSpace, currentPlayer.visitType);
    const diceOutcome = dataService.getDiceOutcome(currentPlayer.currentSpace, currentPlayer.visitType);

    return formatDiceRollButton(
      currentPlayer.currentSpace,
      currentPlayer.visitType,
      diceEffects,
      spaceEffects,
      diceOutcome
    );
  };

  // Format action description now handled by shared utility

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px', backgroundColor: colors.white, borderRadius: '6px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.text.primary }}>
          🎮 Turn Controls & Actions
        </div>
      </div>


      {/* Feedback Message Display */}
      {feedbackMessage && (
        <div style={{ padding: '6px 12px', backgroundColor: colors.info.light, border: `2px solid ${colors.info.main}`, borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: colors.info.dark, textAlign: 'center' }}>
          💡 {feedbackMessage}
        </div>
      )}

      {/* Movement Choice Buttons */}
      {currentChoice && currentChoice.type === 'MOVEMENT' && (
        <div style={{
          padding: '8px',
          backgroundColor: colors.primary.bg,
          border: `2px solid ${colors.primary.main}`,
          borderRadius: '8px'
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: colors.primary.main,
            textAlign: 'center',
            marginBottom: '6px'
          }}>
            🚶 Choose Your Destination
          </div>
          {currentChoice.options.map((option, index) => {
            const feedbackKey = `move_${option.id}`;
            const feedback = buttonFeedback[feedbackKey];

            // If feedback exists, show completion message instead of button
            if (feedback) {
              return (
                <div
                  key={index}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    margin: '2px 0',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    backgroundColor: colors.success.light,
                    color: colors.success.text,
                    border: `1px solid ${colors.success.main}`,
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}
                >
                  ✅ {feedback}
                </div>
              );
            }

            // Otherwise show the button as normal
            return (
              <button
                key={index}
                onClick={() => handleMovementChoice(option.id)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  margin: '2px 0',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  backgroundColor: colors.primary.main,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary.dark;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary.main;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🎯 {option.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Combined Controls and Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px', backgroundColor: colors.secondary.bg, borderRadius: '6px', border: `1px solid ${colors.secondary.border}` }}>
        
        {/* Roll Dice - show button if can roll, otherwise show completed action */}
        {canRollDice ? (
          <button
            onClick={onRollDice}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: colors.white,
              backgroundColor: colors.success.main,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
          >
            <span>🎲</span>
            <span>{getDiceRollButtonText()}</span>
          </button>
        ) : hasPlayerRolledDice && completedActions.diceRoll ? (
          // Show local completion message with immediate feedback
          <div style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: colors.secondary.light, borderRadius: '4px', color: colors.secondary.main }}>
            ✅ {completedActions.diceRoll}
          </div>
        ) : hasPlayerRolledDice && !completedActions.manualActions.funding ? (
          // Fallback if no local message available and no funding message
          <div style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: colors.secondary.light, borderRadius: '4px', color: colors.secondary.main }}>
            ✅ Dice rolled - check game log
          </div>
        ) : null}

        {/* Automatic Funding for OWNER-FUND-INITIATION space */}
        {currentPlayer.currentSpace === 'OWNER-FUND-INITIATION' && isCurrentPlayersTurn && !hasPlayerRolledDice && !isProcessingTurn && (
          <button
            onClick={() => onAutomaticFunding && onAutomaticFunding()}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: colors.white,
              backgroundColor: colors.info.main,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
          >
            <span>💰</span>
            <span>Get Funding</span>
          </button>
        )}

        {/* Manual Effect Buttons - show if available, replace with actions when completed */}
        {isCurrentPlayersTurn && manualEffects.map((effect, index) => {
          // Use centralized button formatting
          const { text: buttonText, icon: buttonIcon } = formatManualEffectButton(effect);

          // Check if THIS specific effect type has been completed (not global flag)
          const isThisEffectCompleted = completedActions.manualActions[effect.effect_type] !== undefined;
          const isButtonDisabled = isProcessingTurn || isThisEffectCompleted;
          
          if (!isButtonDisabled) {
            // Show active button
            return (
              <button
                key={index}
                onClick={() => onManualEffect(effect.effect_type)}
                style={getManualEffectButtonStyle(isButtonDisabled, colors)}
              >
                <span>{buttonIcon}</span>
                <span>{buttonText}</span>
              </button>
            );
          } else {
            // Check if we have a local completion message for this effect type
            const completionMessage = completedActions.manualActions[effect.effect_type];
            if (completionMessage) {
              return (
                <div key={`completed-${index}`} style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: colors.secondary.light, borderRadius: '4px', color: colors.secondary.main }}>
                  ✅ {completionMessage.replace('Manual Action: ', '')}
                </div>
              );
            } else {
              // Fallback if no local message available
              return (
                <div key={`completed-${index}`} style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: colors.secondary.light, borderRadius: '4px', color: colors.secondary.main }}>
                  ✅ Manual action completed - check game log
                </div>
              );
            }
          }
          return null;
        })}

        {/* Automatic Funding Results - show funding completion message */}
        {isCurrentPlayersTurn && completedActions.manualActions.funding && (
          <div style={{
            padding: '4px 8px',
            fontSize: '10px',
            backgroundColor: colors.success.light,
            borderRadius: '4px',
            color: colors.success.text,
            fontWeight: 'bold'
          }}>
            ✅ {completedActions.manualActions.funding}
          </div>
        )}

        {/* Space and Time Effects are now shown in the GameLog component */}

        {/* Try Again Button - show if re-roll is available on current space */}
        {isCurrentPlayersTurn && canNegotiate && (
          <button
            onClick={onNegotiate}
            disabled={isProcessingTurn}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: !isProcessingTurn ? colors.white : colors.secondary.main,
              backgroundColor: !isProcessingTurn ? colors.warning.main : colors.secondary.light,
              border: 'none',
              borderRadius: '4px',
              cursor: !isProcessingTurn ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              transition: 'all 0.2s ease',
              transform: isProcessingTurn ? 'scale(0.95)' : 'scale(1)',
              opacity: isProcessingTurn ? 0.7 : 1,
            }}
          >
            <span>🔄</span>
            <span>Try Again</span>
          </button>
        )}

        {/* End Turn - always show for current player, but disable when actions incomplete */}
        {isCurrentPlayersTurn && (
          <button
            onClick={canEndTurn ? onEndTurn : undefined}
            disabled={!canEndTurn}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: canEndTurn ? colors.white : colors.secondary.main,
              backgroundColor: canEndTurn ? colors.success.main : colors.secondary.light,
              border: 'none',
              borderRadius: '4px',
              cursor: canEndTurn ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              opacity: canEndTurn ? 1 : 0.7
            }}
          >
            <span>⏹️</span>
            <span>End Turn ({actionCounts.completed}/{actionCounts.required})</span>
          </button>
        )}
      </div>

      {/* Modals removed - using persistent GameLog instead */}
    </div>
  );
}