import React, { useState, useEffect } from 'react';
import { colors } from '../../styles/theme';
import { useGameContext } from '../../context/GameContext';
import { Choice } from '../../types/CommonTypes';

export function ChoiceModal(): JSX.Element {
  const { stateService, choiceService } = useGameContext();
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
      // Use the ChoiceService to resolve the choice
      choiceService.resolveChoice(awaitingChoice.id, selectedOptionId);
    } catch (error) {
      console.error('Error resolving choice:', error);
    }
  };

  // Don't render if no choice is awaiting
  if (!awaitingChoice) {
    return <></>;
  }

  return (
    <>
      {/* Modal Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        {/* Modal Content */}
        <div
          style={{
            backgroundColor: colors.white,
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            border: `3px solid ${colors.primary.main}`
          }}
        >
          {/* Modal Header */}
          <div style={{ marginBottom: '25px', textAlign: 'center' }}>
            <h2 style={{ 
              margin: '0 0 10px 0', 
              color: colors.primary.main,
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {awaitingChoice.type === 'MOVEMENT' ? '🛤️' : '🎯'} {awaitingChoice.type === 'MOVEMENT' ? 'Choose Your Next Path' : 'Make Your Choice'}
            </h2>
            <p style={{ 
              margin: '0',
              color: colors.text.secondary,
              fontSize: '16px'
            }}>
              {currentPlayerName}: {awaitingChoice.prompt}
            </p>
          </div>

          {/* Choice Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {awaitingChoice.options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => handleChoiceClick(option.id)}
                style={{
                  padding: '15px 20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: colors.primary.main,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary.dark;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary.main;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Info Text */}
          <div style={{ 
            marginTop: '20px', 
            padding: '15px',
            backgroundColor: colors.secondary.bg,
            borderRadius: '8px',
            border: `1px solid ${colors.secondary.border}`
          }}>
            <p style={{ 
              margin: '0',
              fontSize: '14px',
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