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
    borderRadius: '20px',
    padding: '20px',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    boxShadow: isCurrentPlayer 
      ? '0 8px 32px rgba(33, 150, 243, 0.4)' 
      : '0 4px 16px rgba(0, 0, 0, 0.12)',
    // Horizontal phone layout (16:9 aspect ratio, landscape orientation)
    width: '100%',
    height: actions ? '200px' : '140px', // Fixed height for horizontal layout
    maxWidth: '100%',
    margin: '0 0 20px 0',
    display: 'flex',
    flexDirection: 'row' as const, // Horizontal layout
    alignItems: 'stretch',
    overflow: 'hidden'
  };

  // Left section styles (Avatar and name)
  const leftSectionStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '120px',
    borderRight: '2px solid rgba(0, 0, 0, 0.1)',
    paddingRight: '16px',
    marginRight: '16px'
  };

  const avatarStyle = {
    fontSize: '2.5rem',
    marginBottom: '8px',
    display: 'block'
  };

  const nameStyle = {
    fontSize: '1rem',
    fontWeight: 'bold' as const,
    color: isCurrentPlayer ? '#1976d2' : '#2c5530',
    textAlign: 'center' as const,
    lineHeight: '1.2'
  };

  // Middle section styles (Stats and space info)
  const middleSectionStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    minWidth: 0 // Allow flex shrinking
  };

  const statsRowStyle = {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px'
  };

  const statItemStyle = {
    background: 'rgba(248, 249, 250, 0.8)',
    borderRadius: '8px',
    padding: '6px 10px',
    minWidth: '80px',
    textAlign: 'center' as const
  };

  const statLabelStyle = {
    fontSize: '0.7rem',
    color: '#6c757d',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    marginBottom: '2px'
  };

  const statValueStyle = {
    fontSize: '0.95rem',
    fontWeight: 'bold' as const,
    color: '#495057'
  };

  // Right section styles (Actions)
  const rightSectionStyle = {
    minWidth: actions ? '160px' : '0px',
    maxWidth: actions ? '200px' : '0px',
    borderLeft: actions ? '2px solid rgba(33, 150, 243, 0.2)' : 'none',
    paddingLeft: actions ? '16px' : '0',
    marginLeft: actions ? '16px' : '0',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center'
  };

  return (
    <div style={baseStyle}>
      {/* Current player indicator */}
      {isCurrentPlayer && (
        <div style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
          color: 'white',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 3px 12px rgba(76, 175, 80, 0.5)',
          zIndex: 10
        }}>
          ▶
        </div>
      )}

      {/* Left Section: Avatar and Name */}
      <div style={leftSectionStyle}>
        <div style={avatarStyle}>
          {player.avatar}
        </div>
        <div style={nameStyle}>
          {player.name}
        </div>
      </div>

      {/* Middle Section: Stats and Space Info */}
      <div style={middleSectionStyle}>
        {/* Top row: Money and Time stats */}
        <div style={statsRowStyle}>
          <div style={statItemStyle}>
            <div style={statLabelStyle}>Money</div>
            <div style={statValueStyle}>💰 ${player.money}</div>
          </div>
          <div style={statItemStyle}>
            <div style={statLabelStyle}>Time</div>
            <div style={statValueStyle}>⏱️ {player.time}m</div>
          </div>
        </div>

        {/* Bottom section: Current space */}
        <div style={{
          padding: '8px 12px',
          background: isCurrentPlayer ? 'rgba(33, 150, 243, 0.1)' : 'rgba(248, 249, 250, 0.8)',
          borderRadius: '8px',
          border: `1px solid ${isCurrentPlayer ? '#2196f3' : '#e0e0e0'}`
        }}>
          <div style={{
            fontSize: '0.7rem',
            color: '#6c757d',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            marginBottom: '2px'
          }}>
            📍 Current Space
          </div>
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 'bold',
            color: isCurrentPlayer ? '#1976d2' : '#495057',
            lineHeight: '1.2'
          }}>
            {player.currentSpace}
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: '#6c757d',
            marginTop: '1px'
          }}>
            ({player.visitType} Visit)
          </div>
        </div>
      </div>

      {/* Right Section: Actions (only for current player) */}
      {actions && isCurrentPlayer && (
        <div style={rightSectionStyle}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 'bold',
            color: '#1976d2',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            🎮 Actions
          </div>
          <div style={{
            fontSize: '0.85rem'
          }}>
            {actions}
          </div>
        </div>
      )}
    </div>
  );
}