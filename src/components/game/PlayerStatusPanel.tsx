// src/components/game/PlayerStatusPanel.tsx

import React, { useState, useEffect } from 'react';
import { PlayerStatusItem } from './PlayerStatusItem';
import { useGameContext } from '../../context/GameContext';
import { Player } from '../../types/StateTypes';

interface PlayerStatusPanelProps {
  onOpenNegotiationModal: () => void;
  onOpenRulesModal: () => void;
  onOpenCardDetailsModal: (cardId: string) => void;
}

/**
 * PlayerStatusPanel manages and displays the list of all player statuses
 * Subscribes to game state changes and renders PlayerStatusItem for each player
 */
export function PlayerStatusPanel({ onOpenNegotiationModal, onOpenRulesModal, onOpenCardDetailsModal }: PlayerStatusPanelProps): JSX.Element {
  const { stateService } = useGameContext();


  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  // Subscribe to game state changes
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setPlayers(gameState.players);
      setCurrentPlayerId(gameState.currentPlayerId);
    });

    // Initialize with current state
    const currentState = stateService.getGameState();
    setPlayers(currentState.players);
    setCurrentPlayerId(currentState.currentPlayerId);

    return unsubscribe;
  }, [stateService]);

  const containerStyle = {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '8px',
    height: '100%',
    overflow: 'visible' as const, // Changed from 'auto' to 'visible'
    boxSizing: 'border-box' as const
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #e9ecef'
  };

  const titleStyle = {
    fontSize: '1.4rem',
    fontWeight: 'bold' as const,
    color: '#2c5530',
    margin: 0
  };

  const playerCountStyle = {
    background: '#e3f2fd',
    color: '#1976d2',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 'bold' as const
  };

  const emptyStateStyle = {
    textAlign: 'center' as const,
    color: '#6c757d',
    fontSize: '1rem',
    padding: '40px 20px'
  };

  return (
    <div style={containerStyle}>

      {/* Player list */}
      {players.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.5 }}>
            🎮
          </div>
          <div>
            No players in the game yet.
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {players.map((player) => (
            <PlayerStatusItem
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayerId}
              onOpenNegotiationModal={onOpenNegotiationModal}
              onOpenRulesModal={onOpenRulesModal}
              onOpenCardDetailsModal={onOpenCardDetailsModal}
            />
          ))}
        </div>
      )}

    </div>
  );
}