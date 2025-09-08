import React, { useState, useEffect } from 'react';
import { colors } from '../../styles/theme';
import { GameSpace } from './GameSpace';
import { useGameContext } from '../../context/GameContext';
import { Space, Player } from '../../types/DataTypes';

export function GameBoard(): JSX.Element {
  const { dataService, stateService } = useGameContext();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // Subscribe to state changes for live updates
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setPlayers(gameState.players);
    });
    
    // Initialize with current state
    setPlayers(stateService.getGameState().players);
    
    return unsubscribe;
  }, [stateService]);

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
          
          return (
            <GameSpace
              key={space.name}
              space={space}
              playersOnSpace={playersOnSpace}
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