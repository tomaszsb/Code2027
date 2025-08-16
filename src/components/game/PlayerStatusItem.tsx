// src/components/game/PlayerStatusItem.tsx

import React from 'react';
import { Player } from '../../types/StateTypes';

interface PlayerStatusItemProps {
  player: Player;
  isCurrentPlayer: boolean;
  actions?: React.ReactNode;
}

/**
 * PlayerStatusItem displays the status information for a single player
 * Shows avatar, name, money, and time with visual indicator for current player
 */
export function PlayerStatusItem({ player, isCurrentPlayer, actions }: PlayerStatusItemProps): JSX.Element {
  const baseStyle = {
    background: isCurrentPlayer ? 'linear-gradient(135deg, #e3f2fd, #f0f9ff)' : '#ffffff',
    border: isCurrentPlayer ? '3px solid #2196f3' : '2px solid #e0e0e0',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    boxShadow: isCurrentPlayer 
      ? '0 6px 24px rgba(33, 150, 243, 0.3)' 
      : '0 3px 12px rgba(0, 0, 0, 0.1)',
    // Phone-sized rectangle dimensions
    width: '100%',
    minHeight: actions ? '420px' : '280px',
    maxWidth: '320px',
    margin: '0 auto 16px auto',
    display: 'flex',
    flexDirection: 'column' as const
  };

  const avatarStyle = {
    fontSize: '2rem',
    marginBottom: '8px',
    display: 'block',
    textAlign: 'center' as const
  };

  const nameStyle = {
    fontSize: '1.1rem',
    fontWeight: 'bold' as const,
    color: isCurrentPlayer ? '#1976d2' : '#2c5530',
    marginBottom: '8px',
    textAlign: 'center' as const
  };

  const statsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '12px'
  };

  const statItemStyle = {
    background: '#f8f9fa',
    borderRadius: '6px',
    padding: '8px',
    textAlign: 'center' as const,
    fontSize: '0.9rem'
  };

  const statLabelStyle = {
    fontSize: '0.75rem',
    color: '#6c757d',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '2px'
  };

  const statValueStyle = {
    fontSize: '1.1rem',
    fontWeight: 'bold' as const,
    color: '#495057'
  };

  return (
    <div style={baseStyle}>
      {/* Current player indicator */}
      {isCurrentPlayer && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 2px 8px rgba(76, 175, 80, 0.4)'
        }}>
          ▶
        </div>
      )}

      {/* Player avatar */}
      <div style={avatarStyle}>
        {player.avatar}
      </div>

      {/* Player name */}
      <div style={nameStyle}>
        {player.name}
      </div>

      {/* Player stats */}
      <div style={statsContainerStyle}>
        {/* Money */}
        <div style={statItemStyle}>
          <div style={statLabelStyle}>Money</div>
          <div style={statValueStyle}>
            💰 ${player.money}
          </div>
        </div>

        {/* Time */}
        <div style={statItemStyle}>
          <div style={statLabelStyle}>Time</div>
          <div style={statValueStyle}>
            ⏱️ {player.time}m
          </div>
        </div>
      </div>

      {/* Current space indicator */}
      <div style={{
        marginTop: '12px',
        padding: '8px',
        background: isCurrentPlayer ? 'rgba(33, 150, 243, 0.1)' : '#f1f3f4',
        borderRadius: '6px',
        fontSize: '0.85rem',
        textAlign: 'center',
        border: `1px solid ${isCurrentPlayer ? '#2196f3' : '#e0e0e0'}`
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: '#6c757d',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          marginBottom: '2px'
        }}>
          Current Space
        </div>
        <div style={{
          fontWeight: 'bold',
          color: isCurrentPlayer ? '#1976d2' : '#495057'
        }}>
          📍 {player.currentSpace}
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: '#6c757d',
          marginTop: '2px'
        }}>
          ({player.visitType} Visit)
        </div>
      </div>

      {/* Actions section - only shown for current player */}
      {actions && isCurrentPlayer && (
        <div style={{
          marginTop: 'auto',
          paddingTop: '16px',
          borderTop: '2px solid rgba(33, 150, 243, 0.2)',
          background: 'rgba(33, 150, 243, 0.05)',
          borderRadius: '8px',
          padding: '16px',
          marginLeft: '-4px',
          marginRight: '-4px',
          marginBottom: '-4px'
        }}>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: '#1976d2',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            🎮 Player Actions
          </div>
          {actions}
        </div>
      )}
    </div>
  );
}