// src/components/game/PlayerStatusPanel.tsx

import React, { useState, useEffect } from 'react';
import { PlayerStatusItem } from './PlayerStatusItem';
import { useGameContext } from '../../context/GameContext';
import { Player } from '../../types/StateTypes';

/**
 * PlayerStatusPanel manages and displays the list of all player statuses
 * Subscribes to game state changes and renders PlayerStatusItem for each player
 */
export function PlayerStatusPanel(): JSX.Element {
  const { stateService } = useGameContext();

  // Create Game Actions component for current player
  const createGameActions = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button
        onClick={() => stateService.showCardModal('W001')}
        style={{
          background: 'linear-gradient(45deg, #007bff, #0056b3)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.3)';
        }}
      >
        🃏 Show Test Card
      </button>
      <div style={{ color: '#666', fontSize: '12px', fontStyle: 'italic' }}>
        Test the card modal functionality
      </div>
    </div>
  );
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
    borderRadius: '12px',
    padding: '16px',
    height: '100%',
    overflow: 'auto' as const
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
      {/* Header */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          👥 Player Status
        </h3>
        <div style={playerCountStyle}>
          {players.length} {players.length === 1 ? 'Player' : 'Players'}
        </div>
      </div>

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
        <div>
          {players.map((player) => (
            <PlayerStatusItem
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayerId}
              actions={player.id === currentPlayerId ? createGameActions() : undefined}
            />
          ))}
        </div>
      )}

      {/* Game info footer */}
      {players.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#e9ecef',
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#495057',
          textAlign: 'center'
        }}>
          {currentPlayerId ? (
            <>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                🎯 Current Turn
              </div>
              <div>
                {players.find(p => p.id === currentPlayerId)?.name || 'Unknown Player'}
              </div>
            </>
          ) : (
            <div style={{ fontStyle: 'italic' }}>
              No current player set
            </div>
          )}
        </div>
      )}
    </div>
  );
}