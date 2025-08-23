import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../context/GameContext';
import { Player } from '../../types/DataTypes';
import { GamePhase } from '../../types/StateTypes';

interface TurnControlsProps {
  onOpenNegotiationModal: () => void;
}

export function TurnControls({ onOpenNegotiationModal }: TurnControlsProps): JSX.Element {
  const { stateService, turnService, playerActionService, negotiationService } = useGameContext();
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('SETUP');
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [humanPlayerId, setHumanPlayerId] = useState<string | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Subscribe to state changes for live updates
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setGamePhase(gameState.gamePhase);
      
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
      const aiTurnTimer = setTimeout(() => {
        try {
          setIsProcessingTurn(true);
          const result = turnService.takeTurn(currentPlayer.id);
          setLastRoll(result.diceRoll);
          console.log(`AI player ${currentPlayer.name} rolled a ${result.diceRoll}`);
          
          // Clear the dice roll display after 2 seconds for AI players
          setTimeout(() => {
            setLastRoll(null);
          }, 2000);
        } catch (error) {
          console.error('Error during AI turn:', error);
        } finally {
          setIsProcessingTurn(false);
        }
      }, 1500); // 1.5 second delay for AI turns
      
      return () => clearTimeout(aiTurnTimer);
    }
  }, [currentPlayer, gamePhase, humanPlayerId, isProcessingTurn, turnService]);

  const handleRollDice = async () => {
    if (!currentPlayer || isProcessingTurn) return;

    try {
      setIsProcessingTurn(true);
      console.log(`Rolling dice for player: ${currentPlayer.name}`);
      
      // Use playerActionService.rollDice instead of turnService.takeTurn
      const result = await playerActionService.rollDice(currentPlayer.id);
      setLastRoll(result.total);
      console.log(`Dice rolled! ${currentPlayer.name} rolled a ${result.total}`);
      
      // Get updated player state to check current space and set feedback message
      const updatedGameState = stateService.getGameState();
      const updatedPlayer = updatedGameState.players.find(p => p.id === currentPlayer.id);
      
      if (updatedPlayer) {
        if (updatedPlayer.currentSpace === 'OWNER-SCOPE-INITIATION') {
          setFeedbackMessage(`You rolled a ${result.total} and will receive that many cards.`);
        } else {
          setFeedbackMessage(`You rolled a ${result.total} and moved to ${updatedPlayer.currentSpace}.`);
        }
      }
      
      // Clear the dice roll display and feedback message after 4 seconds
      setTimeout(() => {
        setLastRoll(null);
        setFeedbackMessage('');
      }, 4000);
    } catch (error) {
      console.error('Error rolling dice:', error);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleEndTurn = async () => {
    if (!currentPlayer || isProcessingTurn) return;

    try {
      setIsProcessingTurn(true);
      console.log(`Ending turn for player: ${currentPlayer.name}`);
      
      await playerActionService.endTurn();
      console.log(`Turn ended for ${currentPlayer.name}`);
    } catch (error) {
      console.error('Error ending turn:', error);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleNegotiate = () => {
    if (!currentPlayer || isProcessingTurn) return;
    
    // Check if there are other players available for negotiation
    const gameState = stateService.getGameState();
    const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id);
    
    if (otherPlayers.length > 0) {
      // Open the negotiation modal via parent component
      onOpenNegotiationModal();
    } else {
      console.log('No other players available for negotiation');
      alert('No other players available for negotiation!');
    }
  };


  const isHumanPlayerTurn = currentPlayer?.id === humanPlayerId;
  const canRollDice = gamePhase === 'PLAY' && isHumanPlayerTurn && !isProcessingTurn;

  if (gamePhase !== 'PLAY') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          color: '#6c757d'
        }}
      >
        <div style={{ fontSize: '18px' }}>
          🎯 Game setup in progress...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px',
        backgroundColor: '#fff',
        border: '2px solid #007bff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      {/* Current Turn Display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
          🎲 Turn Controls
        </div>
        
        {currentPlayer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', color: '#666' }}>
              Current Turn:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: currentPlayer.color || '#007bff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                {currentPlayer.avatar || currentPlayer.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                {currentPlayer.name}
              </span>
              {!isHumanPlayerTurn && (
                <span style={{ fontSize: '14px', color: '#ffc107', fontStyle: 'italic' }}>
                  (AI Player)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Roll Dice Button and Result */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {isHumanPlayerTurn && (
          <div style={{ fontSize: '14px', color: '#28a745', fontWeight: 'bold' }}>
            Your Turn!
          </div>
        )}
        
        {/* Dice Roll Result Display */}
        {lastRoll !== null && (
          <div 
            style={{
              padding: '8px 16px',
              backgroundColor: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#856404',
              animation: 'fadeIn 0.3s ease-in'
            }}
          >
            {isHumanPlayerTurn ? (
              <>🎲 You rolled a {lastRoll}!</>
            ) : (
              <>🎲 {currentPlayer?.name} rolled a {lastRoll}!</>
            )}
          </div>
        )}
        
        {/* Feedback Message Display */}
        {feedbackMessage && (
          <div 
            style={{
              padding: '8px 16px',
              backgroundColor: '#d1ecf1',
              border: '2px solid #17a2b8',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#0c5460',
              animation: 'fadeIn 0.3s ease-in',
              maxWidth: '300px'
            }}
          >
            💡 {feedbackMessage}
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleRollDice}
            disabled={!canRollDice}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: canRollDice ? '#fff' : '#6c757d',
              backgroundColor: canRollDice ? '#28a745' : '#e9ecef',
              border: 'none',
              borderRadius: '6px',
              cursor: canRollDice ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              transform: isProcessingTurn ? 'scale(0.95)' : 'scale(1)',
              opacity: isProcessingTurn ? 0.7 : 1
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

          {/* End Turn Button */}
          {isHumanPlayerTurn && (
            <button
              onClick={handleEndTurn}
              disabled={isProcessingTurn}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: !isProcessingTurn ? '#fff' : '#6c757d',
                backgroundColor: !isProcessingTurn ? '#dc3545' : '#e9ecef',
                border: 'none',
                borderRadius: '6px',
                cursor: !isProcessingTurn ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                transform: isProcessingTurn ? 'scale(0.95)' : 'scale(1)',
                opacity: isProcessingTurn ? 0.7 : 1
              }}
            >
              <span>⏹️</span>
              <span>End Turn</span>
            </button>
          )}

          {/* Negotiate Button */}
          {isHumanPlayerTurn && (
            <button
              onClick={handleNegotiate}
              disabled={isProcessingTurn}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: !isProcessingTurn ? '#fff' : '#6c757d',
                backgroundColor: !isProcessingTurn ? '#ffc107' : '#e9ecef',
                border: 'none',
                borderRadius: '6px',
                cursor: !isProcessingTurn ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                transform: isProcessingTurn ? 'scale(0.95)' : 'scale(1)',
                opacity: isProcessingTurn ? 0.7 : 1
              }}
            >
              <span>🤝</span>
              <span>Negotiate</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
}