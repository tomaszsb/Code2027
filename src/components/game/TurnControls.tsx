import React, { useState, useEffect } from 'react';
import { colors } from '../../styles/theme';
import { useGameContext } from '../../context/GameContext';
import { DiceResultModal, DiceRollResult } from '../modals/DiceResultModal';
import { Player } from '../../types/DataTypes';
import { GamePhase } from '../../types/StateTypes';

interface TurnControlsProps {
  onOpenNegotiationModal: () => void;
}

export function TurnControls({ onOpenNegotiationModal }: TurnControlsProps): JSX.Element {
  const { stateService, turnService, playerActionService, dataService } = useGameContext();
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('SETUP');
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [humanPlayerId, setHumanPlayerId] = useState<string | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [hasPlayerMovedThisTurn, setHasPlayerMovedThisTurn] = useState(false);
  const [hasPlayerRolledDice, setHasPlayerRolledDice] = useState(false);
  const [hasCompletedManualActions, setHasCompletedManualActions] = useState(false);
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  const [actionCounts, setActionCounts] = useState({ required: 0, completed: 0 });
  const [diceResult, setDiceResult] = useState<DiceRollResult | null>(null);
  const [showDiceResultModal, setShowDiceResultModal] = useState(false);

  // Subscribe to state changes for live updates
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setGamePhase(gameState.gamePhase);
      setHasPlayerMovedThisTurn(gameState.hasPlayerMovedThisTurn || false);
      setHasPlayerRolledDice(gameState.hasPlayerRolledDice || false);
      setHasCompletedManualActions(gameState.hasCompletedManualActions || false);
      setAwaitingChoice(gameState.awaitingChoice !== null);
      
      // Update action counts from game state
      console.log(`🎯 TurnControls - Action Counts Update: Required=${gameState.requiredActions}, Completed=${gameState.completedActions}`);
      setActionCounts({
        required: gameState.requiredActions || 1,
        completed: gameState.completedActions || 0
      });
      
      // Set the first player as the human player (for demo purposes)
      if (gameState.players.length > 0 && !humanPlayerId) {
        setHumanPlayerId(gameState.players[0].id);
      }
      
      if (gameState.currentPlayerId) {
        const player = gameState.players.find(p => p.id === gameState.currentPlayerId);
        setCurrentPlayer(player || null);
      } else {
        setCurrentPlayer(null);
      }
    });
    
    // Initialize with current state
    const gameState = stateService.getGameState();
    setGamePhase(gameState.gamePhase);
    setHasPlayerMovedThisTurn(gameState.hasPlayerMovedThisTurn || false);
    setHasPlayerRolledDice(gameState.hasPlayerRolledDice || false);
    setAwaitingChoice(gameState.awaitingChoice !== null);
    
    // Initialize action counts
    setActionCounts({
      required: gameState.requiredActions || 1,
      completed: gameState.completedActions || 0
    });
    
    // Set the first player as the human player
    if (gameState.players.length > 0 && !humanPlayerId) {
      setHumanPlayerId(gameState.players[0].id);
    }
    
    if (gameState.currentPlayerId) {
      const player = gameState.players.find(p => p.id === gameState.currentPlayerId);
      setCurrentPlayer(player || null);
    }
    
    return unsubscribe;
  }, [stateService, humanPlayerId]);

  // Handle automatic AI turns
  useEffect(() => {
    if (gamePhase === 'PLAY' && currentPlayer && currentPlayer.id !== humanPlayerId && !isProcessingTurn) {
      console.log(`AI player ${currentPlayer.name} taking turn...`);
      
      // Add delay to make AI turns feel natural
      const aiTurnTimer = setTimeout(async () => {
        try {
          setIsProcessingTurn(true);
          const result = await turnService.takeTurn(currentPlayer.id);
          setLastRoll(result.diceRoll);
          console.log(`AI player ${currentPlayer.name} rolled a ${result.diceRoll}`);
          
          // End the AI player's turn and advance to next player
          setTimeout(async () => {
            try {
              await turnService.endTurn();
              console.log(`AI player ${currentPlayer.name} turn ended`);
            } catch (error) {
              console.error('Error ending AI turn:', error);
            } finally {
              setLastRoll(null);
              setIsProcessingTurn(false);
            }
          }, 2000);
        } catch (error: any) {
          console.error('Error during AI turn:', error);
          setIsProcessingTurn(false);
        }
      }, 1500); // 1.5 second delay for AI turns
      
      return () => clearTimeout(aiTurnTimer);
    }
  }, [currentPlayer?.id, gamePhase, humanPlayerId, isProcessingTurn, turnService]);

  const handleRollDice = async () => {
    if (!currentPlayer || isProcessingTurn) return;

    try {
      setIsProcessingTurn(true);
      console.log(`Rolling dice for player: ${currentPlayer.name}`);
      
      // Use rollDiceWithFeedback for dice roll + effects + feedback modal
      const result = await turnService.rollDiceWithFeedback(currentPlayer.id);
      setLastRoll(result.diceValue);
      setDiceResult(result);
      setShowDiceResultModal(true);
      
      console.log(`Dice rolled! ${currentPlayer.name} rolled a ${result.diceValue}`);
      console.log('Effects:', result.effects);
      
      // Modal handles all dice feedback now - no duplicate notifications needed
    } catch (error) {
      console.error('Error rolling dice:', error);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleCloseDiceResultModal = () => {
    setShowDiceResultModal(false);
    setDiceResult(null);
  };

  const handleDiceResultConfirm = () => {
    handleCloseDiceResultModal();
    // Additional logic if needed for choices would go here
  };

  const handleEndTurn = async () => {
    if (!currentPlayer || isProcessingTurn) return;

    try {
      setIsProcessingTurn(true);
      console.log(`Ending turn for player: ${currentPlayer.name}`);
      
      // Use endTurnWithMovement to handle movement and advance to next player
      await turnService.endTurnWithMovement();
      console.log(`Turn ended for ${currentPlayer.name}`);
    } catch (error) {
      console.error('Error ending turn:', error);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleNegotiate = async () => {
    if (!currentPlayer || isProcessingTurn) return;
    
    // Get space content to check if negotiation is allowed on this space
    const spaceContent = dataService.getSpaceContent(currentPlayer.currentSpace, currentPlayer.visitType);
    console.log('🤝 Negotiate Debug:', { 
      currentSpace: currentPlayer.currentSpace, 
      visitType: currentPlayer.visitType, 
      spaceContent,
      canNegotiate: spaceContent?.can_negotiate 
    });
    
    if (spaceContent && spaceContent.can_negotiate === true) {
      // Space-specific negotiation using TurnService method
      console.log(`Negotiation available on ${currentPlayer.currentSpace}`);
      
      try {
        setIsProcessingTurn(true);
        const result = await turnService.performNegotiation(currentPlayer.id);
        
        // Show result to user
        alert(result.message);
        
        if (result.success) {
          setFeedbackMessage('Negotiation successful! State restored.');
        } else {
          setFeedbackMessage('Negotiation failed. Time penalty applied.');
        }
        
        // Clear feedback after 4 seconds
        setTimeout(() => {
          setFeedbackMessage('');
        }, 4000);
        
      } catch (error: any) {
        console.error('Error during negotiation:', error);
        alert(`Negotiation failed: ${error.message}`);
      } finally {
        setIsProcessingTurn(false);
      }
    } else {
      console.log('Negotiation not available on this space');
      alert('Negotiation not available on this space.');
    }
  };

  const handleManualEffect = async (effectType: string) => {
    if (!currentPlayer || isProcessingTurn) return;

    try {
      setIsProcessingTurn(true);
      console.log(`Triggering manual ${effectType} effect for player: ${currentPlayer.name}`);
      
      // Use triggerManualEffectWithFeedback for modal support
      const result = await turnService.triggerManualEffectWithFeedback(currentPlayer.id, effectType);
      console.log(`Manual ${effectType} effect completed! Effects:`, result.effects);
      
      // Set modal result and show modal
      setDiceResult(result);
      setShowDiceResultModal(true);
      
    } catch (error: any) {
      console.error(`Error triggering manual ${effectType} effect:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessingTurn(false);
    }
  };


  // Check for available manual effects
  const manualEffects = currentPlayer ? 
    dataService.getSpaceEffects(currentPlayer.currentSpace, currentPlayer.visitType)
      .filter(effect => effect.trigger_type === 'manual') : [];

  const isHumanPlayerTurn = currentPlayer?.id === humanPlayerId;
  // Hide dice roll button on OWNER-FUND-INITIATION space (funding is automatic)
  const isOnFundingSpace = currentPlayer?.currentSpace === 'OWNER-FUND-INITIATION';
  const canRollDice = gamePhase === 'PLAY' && isHumanPlayerTurn && 
                     !isProcessingTurn && !hasPlayerRolledDice && !hasPlayerMovedThisTurn && !awaitingChoice &&
                     !isOnFundingSpace;
  // On OWNER-FUND-INITIATION space, allow ending turn without dice roll (funding is automatic)
  const canEndTurn = gamePhase === 'PLAY' && isHumanPlayerTurn && 
                    !isProcessingTurn && 
                    (hasPlayerRolledDice || isOnFundingSpace) && 
                    actionCounts.completed >= actionCounts.required;
  
  // Debug End Turn button state
  if (currentPlayer && actionCounts.completed >= actionCounts.required) {
    console.log(`🏁 End Turn Debug for ${currentPlayer.name}:`);
    console.log(`  gamePhase === 'PLAY': ${gamePhase === 'PLAY'}`);
    console.log(`  isHumanPlayerTurn: ${isHumanPlayerTurn}`);
    console.log(`  !isProcessingTurn: ${!isProcessingTurn}`);
    console.log(`  hasPlayerRolledDice: ${hasPlayerRolledDice}`);
    console.log(`  actionCounts: ${actionCounts.completed}/${actionCounts.required}`);
    console.log(`  canEndTurn: ${canEndTurn}`);
  }

  if (gamePhase !== 'PLAY') {
    const handleStartGame = () => {
      try {
        // Add a test player if no players exist
        const gameState = stateService.getGameState();
        if (gameState.players.length === 0) {
          stateService.addPlayer('Test Player');
        }
        // Start the game
        stateService.startGame();
      } catch (error) {
        console.error('Error starting game:', error);
      }
    };

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px',
          backgroundColor: colors.secondary.bg,
          border: `1px solid ${colors.secondary.border}`,
          borderRadius: '4px',
          color: colors.secondary.main,
          fontSize: '8px',
          gap: '6px'
        }}
      >
        <div>
          🎯 Game setup... (Phase: {gamePhase})
        </div>
        <button
          onClick={handleStartGame}
          style={{
            padding: '4px 8px',
            fontSize: '8px',
            backgroundColor: colors.success.main,
            color: colors.white,
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '6px',
        backgroundColor: colors.white,
        borderRadius: '6px'
      }}
    >
      {/* Turn Controls Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: colors.text.primary }}>
          🎮 Turn Controls
        </div>
      </div>


      {/* Status Messages */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        
        {/* Dice Roll Result Display - Removed to avoid duplication with modal */}
        
        {/* Feedback Message Display */}
        {feedbackMessage && (
          <div 
            style={{
              padding: '6px 12px',
              backgroundColor: colors.info.light,
              border: `2px solid ${colors.info.main}`,
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 'bold',
              color: colors.info.dark,
              animation: 'fadeIn 0.3s ease-in',
              textAlign: 'center'
            }}
          >
            💡 {feedbackMessage}
          </div>
        )}
      </div>
        
      {/* Action Buttons Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '6px',
        backgroundColor: colors.secondary.bg,
        borderRadius: '6px',
        border: `1px solid ${colors.secondary.border}`
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 'bold',
          color: colors.secondary.main,
          textAlign: 'center',
          marginBottom: '2px'
        }}>
          🎯 ACTIONS
        </div>
        
        {/* Show funding message on OWNER-FUND-INITIATION space instead of dice button */}
        {isOnFundingSpace ? (
          <div
            style={{
              padding: '6px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: colors.warning.dark,
              backgroundColor: colors.warning.light,
              border: `1px solid ${colors.warning.border}`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              textAlign: 'center',
              lineHeight: '1.2'
            }}
          >
            <span>💰</span>
            <span>Reviewing project scope for funding level...</span>
          </div>
        ) : (
          <button
            onClick={handleRollDice}
            disabled={!canRollDice}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: canRollDice ? colors.white : colors.secondary.main,
              backgroundColor: canRollDice ? colors.success.main : colors.secondary.bg,
              border: 'none',
              borderRadius: '4px',
              cursor: canRollDice ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              transition: 'all 0.2s ease',
              transform: isProcessingTurn ? 'scale(0.95)' : 'scale(1)',
              opacity: isProcessingTurn ? 0.7 : 1,
            }}
          >
            {isProcessingTurn ? (
              <>
                <span>🎲</span>
                <span>Rolling...</span>
              </>
            ) : (
              <>
                <span>🎲</span>
                <span>Roll Dice</span>
              </>
            )}
          </button>
        )}


        {/* Manual Space Effect Buttons */}
        {isHumanPlayerTurn && manualEffects.length > 0 && manualEffects.map((effect, index) => {
          const isCardEffect = effect.effect_type === 'cards';
          const cardType = isCardEffect ? effect.effect_action.replace('draw_', '').toUpperCase() : '';
          const count = effect.effect_value;
          const buttonText = isCardEffect ? `Pick up ${count} ${cardType} card${count !== 1 ? 's' : ''}` : 
                            `${effect.effect_type}: ${effect.effect_action} ${count}`;
          
          const isButtonDisabled = isProcessingTurn || hasCompletedManualActions;
          
          return (
            <button
              key={index}
              onClick={() => handleManualEffect(effect.effect_type)}
              disabled={isButtonDisabled}
              title={hasCompletedManualActions ? 'Manual actions already completed' : ''}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 'bold',
                color: !isButtonDisabled ? colors.white : colors.secondary.main,
                backgroundColor: !isButtonDisabled ? colors.info.main : colors.secondary.bg,
                border: 'none',
                borderRadius: '4px',
                cursor: !isButtonDisabled ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                transition: 'all 0.2s ease',
                transform: isButtonDisabled ? 'scale(0.95)' : 'scale(1)',
                opacity: isButtonDisabled ? 0.7 : 1,
              }}
            >
              <span>{isCardEffect ? '🃏' : '⚡'}</span>
              <span>{buttonText}</span>
            </button>
          );
        })}
      </div>
      
      {/* Turn-Ending Buttons Container */}
      {isHumanPlayerTurn && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          padding: '6px',
          backgroundColor: colors.danger.light,
          borderRadius: '6px',
          border: `2px solid ${colors.danger.main}`,
          marginTop: '8px'
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: colors.danger.main,
            textAlign: 'center',
            marginBottom: '2px'
          }}>
            🏁 END TURN
          </div>
          
          {/* End Turn Button */}
          <button
            onClick={handleEndTurn}
            disabled={!canEndTurn}
            title={canEndTurn ? 'End your turn' : `Complete ${actionCounts.required - actionCounts.completed} more action(s) to end turn`}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: canEndTurn ? colors.white : colors.secondary.main,
              backgroundColor: canEndTurn ? colors.success.main : colors.secondary.bg,
              border: 'none',
              borderRadius: '4px',
              cursor: canEndTurn ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              transition: 'all 0.2s ease',
              transform: !canEndTurn ? 'scale(0.95)' : 'scale(1)',
              opacity: !canEndTurn ? 0.7 : 1,
              }}
          >
            <span>⏹️</span>
            <span>End Turn ({actionCounts.completed}/{actionCounts.required})</span>
          </button>

          {/* Negotiate Button */}
          <button
            onClick={handleNegotiate}
            disabled={isProcessingTurn}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: !isProcessingTurn ? colors.white : colors.secondary.main,
              backgroundColor: !isProcessingTurn ? colors.warning.main : colors.secondary.bg,
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
            <span>🤝</span>
            <span>Negotiate</span>
          </button>
        </div>
      )}

      {/* Dice Result Modal */}
      <DiceResultModal
        isOpen={showDiceResultModal}
        result={diceResult}
        onClose={handleCloseDiceResultModal}
        onConfirm={diceResult?.hasChoices ? handleDiceResultConfirm : undefined}
      />
    </div>
  );
}