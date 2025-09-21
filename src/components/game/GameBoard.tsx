import React, { useState, useEffect } from 'react';
import { colors } from '../../styles/theme';
import { GameSpace } from './GameSpace';
import { useGameContext } from '../../context/GameContext';
import { Space, Player } from '../../types/DataTypes';

export function GameBoard(): JSX.Element {
  const { dataService, stateService, movementService } = useGameContext();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [highlightedMoves, setHighlightedMoves] = useState<string[]>([]);
  const [gamePhase, setGamePhase] = useState<string>('SETUP');

  // Subscribe to state changes for live updates
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setPlayers(gameState.players);
      setCurrentPlayerId(gameState.currentPlayerId);
      setGamePhase(gameState.gamePhase);

      // REFINED GUARD: Only block this specific state update during a move
      if (!gameState.isMoving) {
        if (gameState.gamePhase === 'PLAY' && gameState.currentPlayerId && !gameState.hasPlayerMovedThisTurn) {
          try {
            const moves = movementService.getValidMoves(gameState.currentPlayerId);
            setValidMoves(moves);
            console.log(`🎯 BOARD: Player ${gameState.currentPlayerId} has ${moves.length} valid moves:`, moves);
          } catch (error) {
            console.log(`🎯 BOARD: No valid moves for player ${gameState.currentPlayerId}:`, error);
            setValidMoves([]);
          }
        } else {
          setValidMoves([]);
        }
      }

      // Cache movement choices to prevent them from disappearing during animation
      if (gameState.awaitingChoice?.type === 'MOVEMENT' && !gameState.isMoving && gameState.currentPlayerId) {
        const moves = movementService.getValidMoves(gameState.currentPlayerId);
        setHighlightedMoves(moves);
      } else if (!gameState.awaitingChoice && !gameState.isMoving) {
        setHighlightedMoves([]);
      }
    });
    
    // Initialize with current state
    const gameState = stateService.getGameState();
    setPlayers(gameState.players);
    setCurrentPlayerId(gameState.currentPlayerId);
    setGamePhase(gameState.gamePhase);
    
    if (gameState.gamePhase === 'PLAY' && gameState.currentPlayerId && !gameState.hasPlayerMovedThisTurn) {
      try {
        const moves = movementService.getValidMoves(gameState.currentPlayerId);
        setValidMoves(moves);
      } catch (error) {
        setValidMoves([]);
      }
    }
    
    return unsubscribe;
  }, [stateService, movementService]);

  // Load all spaces on mount (excluding tutorial spaces)
  useEffect(() => {
    const allSpaces = dataService.getAllSpaces();
    // Filter out tutorial spaces that shouldn't appear on the game board
    const gameSpaces = allSpaces.filter(space => {
      const config = dataService.getGameConfigBySpace(space.name);
      return config?.path_type !== 'Tutorial';
    });
    setSpaces(gameSpaces);
  }, [dataService]);

  // Helper function to get players on a specific space
  const getPlayersOnSpace = (spaceName: string): Player[] => {
    return players.filter(player => player.currentSpace === spaceName);
  };

  // Helper function to check if a space is a valid move destination
  const isValidMoveDestination = (spaceName: string): boolean => {
    return highlightedMoves.includes(spaceName);
  };

  // Helper function to check if current player is on this space
  const isCurrentPlayerSpace = (spaceName: string): boolean => {
    if (!currentPlayerId) return false;
    const currentPlayer = players.find(p => p.id === currentPlayerId);
    return currentPlayer?.currentSpace === spaceName;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: '20px'
      }}
    >
      <h2 style={{ color: colors.game.boardTitle, marginBottom: '20px', textAlign: 'center' }}>
        🎯 Game Board
      </h2>
      
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          width: '100%'
        }}
      >
        {spaces.map((space) => {
          const playersOnSpace = getPlayersOnSpace(space.name);
          const isValidMove = isValidMoveDestination(space.name);
          const isCurrentPlayer = isCurrentPlayerSpace(space.name);
          
          return (
            <GameSpace
              key={space.name}
              space={space}
              playersOnSpace={playersOnSpace}
              isValidMoveDestination={isValidMove}
              isCurrentPlayerSpace={isCurrentPlayer}
              showMovementIndicators={highlightedMoves.length > 0}
            />
          );
        })}
      </div>
      
      {spaces.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            color: colors.text.secondary,
            fontSize: '16px',
            marginTop: '40px'
          }}
        >
          Loading game spaces...
        </div>
      )}
    </div>
  );
}