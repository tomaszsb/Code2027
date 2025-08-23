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
  const { stateService, dataService } = useGameContext();

  // Utility function to extract static card ID from dynamic instance ID
  const extractStaticCardId = (dynamicCardId: string): string => {
    // Extract the static ID portion (e.g., "W001" from "W001_1234567890_abcdefg")
    const parts = dynamicCardId.split('_');
    return parts[0] || dynamicCardId;
  };

  // Get card type colors for visual enhancement
  const getCardTypeColor = (cardType: string) => {
    switch (cardType) {
      case 'W': return { bg: '#28a745', shadow: 'rgba(40, 167, 69, 0.3)' }; // Green
      case 'B': return { bg: '#007bff', shadow: 'rgba(0, 123, 255, 0.3)' }; // Blue  
      case 'E': return { bg: '#dc3545', shadow: 'rgba(220, 53, 69, 0.3)' }; // Red
      case 'L': return { bg: '#ffc107', shadow: 'rgba(255, 193, 7, 0.3)' }; // Yellow
      case 'I': return { bg: '#6f42c1', shadow: 'rgba(111, 66, 193, 0.3)' }; // Purple
      default: return { bg: '#6c757d', shadow: 'rgba(108, 117, 125, 0.3)' }; // Gray
    }
  };

  // PlayerHand component for displaying player's cards
  const PlayerHand = ({ player }: { player: Player }) => {
    // Debug logging to see what cards are in each type
    console.log('🃏 Player cards debug:', {
      W: player.cards.W,
      B: player.cards.B,
      E: player.cards.E,
      L: player.cards.L,
      I: player.cards.I
    });

    // Organize cards by type for better display
    const cardsByType = [
      { type: 'W', cards: player.cards.W },
      { type: 'B', cards: player.cards.B },
      { type: 'E', cards: player.cards.E },
      { type: 'L', cards: player.cards.L },
      { type: 'I', cards: player.cards.I }
    ].filter(cardGroup => cardGroup.cards.length > 0);

    if (cardsByType.length === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px',
          color: '#666',
          fontSize: '14px',
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          🃏 No cards in hand
        </div>
      );
    }

    const totalCards = cardsByType.reduce((sum, group) => sum + group.cards.length, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ 
          fontSize: '12px', 
          fontWeight: 'bold', 
          color: '#495057', 
          marginBottom: '4px' 
        }}>
          🃏 Cards in Hand ({totalCards})
        </div>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '6px', 
          maxHeight: '120px', 
          overflowY: 'auto' 
        }}>
          {cardsByType.map(({ type, cards }) => 
            cards.map((dynamicCardId, index) => {
              const staticCardId = extractStaticCardId(dynamicCardId);
              const colors = getCardTypeColor(type);
              
              // Get card data to show meaningful name instead of just type
              const cardData = dataService.getCardById(staticCardId);
              const displayName = cardData ? cardData.card_name : `${type} Card`;
              
              // For W cards, show a shortened version of the work scope
              const shortName = type === 'W' && cardData ? 
                cardData.card_name.length > 30 ? 
                  cardData.card_name.substring(0, 27) + '...' : 
                  cardData.card_name
                : displayName;
              
              return (
                <button
                  key={`${dynamicCardId}-${index}`}
                  onClick={() => stateService.showCardModal(staticCardId)}
                  style={{
                    background: `linear-gradient(45deg, ${colors.bg}, ${colors.bg}dd)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: `0 2px 4px ${colors.shadow}`,
                    minWidth: '120px',
                    maxWidth: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = `0 3px 6px ${colors.shadow}`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `0 2px 4px ${colors.shadow}`;
                  }}
                  title={cardData ? `${cardData.card_name} - ${cardData.description}` : displayName}
                >
                  <span style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    color: colors.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '8px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {type}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {shortName}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  };
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
              actions={player.id === currentPlayerId ? <PlayerHand player={player} /> : undefined}
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