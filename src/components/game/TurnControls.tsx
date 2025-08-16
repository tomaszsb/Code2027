import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../context/GameContext';
import { Player } from '../../types/DataTypes';
import { GamePhase } from '../../types/StateTypes';

export function TurnControls(): JSX.Element {
  const { stateService, turnService } = useGameContext();
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('SETUP');
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [humanPlayerId, setHumanPlayerId] = useState<string | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);

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
      
      const result = turnService.takeTurn(currentPlayer.id);
      setLastRoll(result.diceRoll);
      console.log(`Turn completed! ${currentPlayer.name} rolled a ${result.diceRoll}`);
      
      // Clear the dice roll display after 3 seconds
      setTimeout(() => {
        setLastRoll(null);
      }, 3000);
    } catch (error) {
      console.error('Error taking turn:', error);
    } finally {
      setIsProcessingTurn(false);
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
      </div>
    </div>
  );
}