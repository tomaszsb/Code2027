// src/components/game/TurnControlsWithActions.tsx

import React, { useState, useEffect } from 'react';
import { colors } from '../../styles/theme';
import { useGameContext } from '../../context/GameContext';
// Modal imports removed - using persistent GameLog instead
import { Player } from '../../types/DataTypes';
import { GamePhase, ActionLogEntry } from '../../types/StateTypes';
import { formatActionDescription } from '../../utils/actionLogFormatting';

interface TurnControlsWithActionsProps {
  // Game state data
  currentPlayer: Player | null;
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
  
  // Action handlers
  onRollDice: () => Promise<void>;
  onEndTurn: () => Promise<void>;
  onManualEffect: (effectType: string) => Promise<void>;
  onNegotiate: () => Promise<void>;
  onAutomaticFunding?: () => Promise<void>;
  onStartGame: () => void;
  
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
  // Action handlers
  onRollDice,
  onEndTurn,
  onManualEffect,
  onNegotiate,
  onAutomaticFunding,
  onStartGame,
  // Legacy props
  onOpenNegotiationModal,
  playerId,
  playerName 
}: TurnControlsWithActionsProps): JSX.Element {
  const { dataService } = useGameContext();





  // Helper function to evaluate effect conditions
  const evaluateEffectCondition = (condition: string | undefined): boolean => {
    if (!condition || condition === 'always') return true;
    if (!currentPlayer) return false;

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
  const manualEffects = currentPlayer ? 
    dataService.getSpaceEffects(currentPlayer.currentSpace, currentPlayer.visitType)
      .filter(effect => effect.trigger_type === 'manual')
      .filter(effect => evaluateEffectCondition(effect.condition)) : [];

  // Check if negotiation is available on current space
  const canNegotiate = currentPlayer ? 
    dataService.getSpaceContent(currentPlayer.currentSpace, currentPlayer.visitType)?.can_negotiate === true : false;

  // All players can take actions when it's their turn
  const isCurrentPlayersTurn = currentPlayer != null;
  const canRollDice = gamePhase === 'PLAY' && isCurrentPlayersTurn && 
                     !isProcessingTurn && !hasPlayerRolledDice && !hasPlayerMovedThisTurn && !awaitingChoice &&
                     currentPlayer?.currentSpace !== 'OWNER-FUND-INITIATION'; // Hide dice roll for funding space
  const canEndTurn = gamePhase === 'PLAY' && isCurrentPlayersTurn && 
                    !isProcessingTurn && hasPlayerRolledDice && actionCounts.completed >= actionCounts.required;

  // Get contextual dice roll button text based on current space
  const getDiceRollButtonText = (): string => {
    if (!currentPlayer) return "Roll Dice";

    // Get dice effects for current space to determine roll context
    const diceEffects = dataService.getDiceEffects(currentPlayer.currentSpace, currentPlayer.visitType);
    
    if (diceEffects.length === 0) return "Roll Dice";

    const firstEffect = diceEffects[0];
    
    switch (firstEffect.effect_type) {
      case 'cards':
        const cardType = firstEffect.card_type?.toUpperCase() || 'Cards';
        return `Roll for ${cardType} Cards`;
        
      case 'money':
        return firstEffect.card_type === 'fee' ? "Roll for Fee Amount" : "Roll for Money";
        
      case 'time':
        return "Roll for Time Penalty";
        
      case 'quality':
        return "Roll for Quality";
        
      default:
        // If diceEffects exist but don't match known types, default to generic text
        return "Roll Dice";
    }
  };

  // Format action description now handled by shared utility

  if (gamePhase !== 'PLAY') {
    return (
      <div style={{ padding: '10px', backgroundColor: colors.secondary.bg, border: `1px solid ${colors.secondary.border}`, borderRadius: '6px' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          🎯 Game setup... (Phase: {gamePhase})
        </div>
        <button onClick={onStartGame} style={{ padding: '4px 8px', fontSize: '8px', backgroundColor: colors.success.main, color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
          Start Game
        </button>
      </div>
    );
  }

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
        ) : hasPlayerRolledDice ? (
          // Fallback if no local message available
          <div style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: colors.secondary.light, borderRadius: '4px', color: colors.secondary.main }}>
            ✅ Dice rolled - check game log
          </div>
        ) : null}

        {/* Automatic Funding for OWNER-FUND-INITIATION space */}
        {currentPlayer?.currentSpace === 'OWNER-FUND-INITIATION' && isCurrentPlayersTurn && !hasPlayerRolledDice && !isProcessingTurn && (
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
          const isCardEffect = effect.effect_type === 'cards';
          const cardType = isCardEffect ? effect.effect_action.replace('draw_', '').toUpperCase() : '';
          const count = effect.effect_value;
          const buttonText = isCardEffect ? `Pick up ${count} ${cardType} card${count !== 1 ? 's' : ''}` : 
                            `${effect.effect_type}: ${effect.effect_action} ${count}`;
          
          const isButtonDisabled = isProcessingTurn || hasCompletedManualActions;
          
          if (!isButtonDisabled) {
            // Show active button
            return (
              <button
                key={index}
                onClick={() => onManualEffect(effect.effect_type)}
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
                <span>{isCardEffect ? '🃏' : '⚡'}</span>
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

        {/* End Turn - show button if can end turn, otherwise show message */}
        {canEndTurn ? (
          <button
            onClick={onEndTurn}
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
            <span>⏹️</span>
            <span>End Turn ({actionCounts.completed}/{actionCounts.required})</span>
          </button>
        ) : actionCounts.completed < actionCounts.required && isCurrentPlayersTurn ? (
          <div style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: colors.warning.bg, borderRadius: '4px', color: colors.warning.text, textAlign: 'center' }}>
            📋 Complete {actionCounts.required - actionCounts.completed} more action(s)
          </div>
        ) : null}
      </div>

      {/* Modals removed - using persistent GameLog instead */}
    </div>
  );
}