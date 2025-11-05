import React, { useState, useEffect } from 'react';
import { colors, theme } from '../../styles/theme';
import { useGameContext } from '../../context/GameContext';
import { Choice } from '../../types/CommonTypes';
import { NotificationUtils } from '../../utils/NotificationUtils';
import { CardReplacementModal } from './CardReplacementModal';
import { CardType } from '../../types/DataTypes';

export function ChoiceModal(): JSX.Element {
  const { stateService, choiceService, notificationService } = useGameContext();
  const [awaitingChoice, setAwaitingChoice] = useState<Choice | null>(null);
  const [currentPlayerName, setCurrentPlayerName] = useState<string>('');

  // Subscribe to state changes to show/hide modal
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setAwaitingChoice(gameState.awaitingChoice);
      
      if (gameState.awaitingChoice) {
        // Get the current player's name for display
        const player = gameState.players.find(p => p.id === gameState.awaitingChoice?.playerId);
        setCurrentPlayerName(player?.name || 'Unknown Player');
      }
    });
    
    // Initialize with current state
    const gameState = stateService.getGameState();
    setAwaitingChoice(gameState.awaitingChoice);
    if (gameState.awaitingChoice) {
      const player = gameState.players.find(p => p.id === gameState.awaitingChoice?.playerId);
      setCurrentPlayerName(player?.name || 'Unknown Player');
    }
    
    return unsubscribe;
  }, [stateService]);

  const handleChoiceClick = (selectedOptionId: string) => {
    if (!awaitingChoice) return;

    try {
      // Get the selected option for feedback
      const selectedOption = awaitingChoice.options.find(opt => opt.id === selectedOptionId);
      const optionLabel = selectedOption?.label || selectedOptionId;

      // Provide immediate feedback via NotificationService
      notificationService.notify(
        NotificationUtils.createSuccessNotification(
          'Choice Made',
          `Selected: ${optionLabel}`,
          currentPlayerName
        ),
        {
          playerId: awaitingChoice.playerId,
          playerName: currentPlayerName,
          actionType: `choice_${awaitingChoice.id}`
        }
      );

      // Use the ChoiceService to resolve the choice
      choiceService.resolveChoice(awaitingChoice.id, selectedOptionId);
    } catch (error) {
      console.error('Error resolving choice:', error);
    }
  };

  // Don't render if no choice is awaiting or if it's a MOVEMENT choice (handled by TurnControls)
  if (!awaitingChoice || awaitingChoice.type === 'MOVEMENT') {
    return <></>;
  }

  // Handle CARD_REPLACEMENT choice with dedicated modal
  if (awaitingChoice.type === 'CARD_REPLACEMENT') {
    const gameState = stateService.getGameState();
    const player = gameState.players.find(p => p.id === awaitingChoice.playerId);

    // Extract card type from first option ID (e.g., "E001" -> "E")
    const cardType = awaitingChoice.options[0]?.id?.charAt(0) as CardType || 'E';
    const maxReplacements = awaitingChoice.options.length;
    const newCardType = awaitingChoice.metadata?.newCardType as CardType | undefined;

    return (
      <CardReplacementModal
        isOpen={true}
        player={player || null}
        cardType={cardType}
        maxReplacements={maxReplacements}
        newCardType={newCardType}
        onReplace={(selectedCardIds, replacementType) => {
          // Handle single card selection (current system supports one at a time)
          if (selectedCardIds.length > 0) {
            handleChoiceClick(selectedCardIds[0]);
          }
        }}
        onCancel={() => {
          // For now, we require a selection - can't cancel
          console.log('Card replacement cancelled (not supported yet)');
        }}
      />
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: scale(0.9) translateY(-20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
          }
        `}
      </style>

      {/* Modal Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.modal.overlay.backgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: theme.modal.overlay.zIndex,
          animation: `fadeIn ${theme.transitions.normal}`
        }}
      >
        {/* Modal Content */}
        <div
          style={{
            backgroundColor: colors.white,
            padding: theme.modal.body.padding,
            borderRadius: theme.modal.container.borderRadius,
            maxWidth: theme.modal.container.maxWidth,
            width: '90%',
            maxHeight: theme.modal.container.maxHeight,
            overflow: 'auto',
            boxShadow: theme.shadows.xl,
            border: `3px solid ${colors.primary.main}`,
            animation: `slideIn ${theme.transitions.modal}`
          }}
        >
          {/* Modal Header */}
          <div style={{ marginBottom: theme.spacing.xxl, textAlign: 'center' }}>
            <h2 style={{
              margin: `0 0 ${theme.spacing.md} 0`,
              color: colors.primary.main,
              fontSize: theme.typography.heading.h2.fontSize,
              fontWeight: theme.typography.heading.h2.fontWeight
            }}>
              🎯 Make Your Choice
            </h2>
            <p style={{
              margin: '0',
              color: colors.text.secondary,
              fontSize: theme.typography.body.large
            }}>
              {currentPlayerName}: {awaitingChoice.prompt}
            </p>
          </div>

          {/* Choice Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {awaitingChoice.options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleChoiceClick(option.id)}
                style={{
                  padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                  fontSize: theme.button.fontSize.lg,
                  fontWeight: 'bold',
                  backgroundColor: colors.primary.main,
                  color: colors.white,
                  border: 'none',
                  borderRadius: theme.button.borderRadius,
                  cursor: 'pointer',
                  transition: theme.transitions.normal,
                  boxShadow: theme.shadows.sm
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary.dark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = theme.shadows.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary.main;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = theme.shadows.sm;
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Info Text */}
          <div style={{
            marginTop: theme.spacing.xl,
            padding: theme.spacing.md,
            backgroundColor: colors.secondary.bg,
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${colors.secondary.border}`
          }}>
            <p style={{
              margin: '0',
              fontSize: theme.typography.body.small,
              color: colors.secondary.main,
              textAlign: 'center'
            }}>
              Choose carefully! This decision will determine your next destination.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}