import React from 'react';
import { colors, theme } from '../../styles/theme';
import { Space, Player } from '../../types/DataTypes';

interface GameSpaceProps {
  space: Space;
  playersOnSpace: Player[];
}

export function GameSpace({ space, playersOnSpace }: GameSpaceProps): JSX.Element {
  // Add CSS animation styles to document head if not already present
  React.useEffect(() => {
    const styleId = 'player-token-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes playerTokenAppear {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 0.8;
          }
          100% {
            transform: scale(1) rotate(360deg);
            opacity: 1;
          }
        }
        
        @keyframes playerTokenPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div
      style={{
        border: playersOnSpace.length > 0 ? `3px solid ${colors.success.main}` : `2px solid ${colors.secondary.border}`,
        borderRadius: '8px',
        padding: '12px',
        margin: '4px',
        background: playersOnSpace.length > 0 ? colors.success.light : colors.white,
        minHeight: '100px',
        minWidth: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: playersOnSpace.length > 0 
          ? `0 4px 12px ${colors.success.main}30` 
          : theme.shadows.sm,
        position: 'relative',
        transition: 'all 0.3s ease-in-out',
        animation: playersOnSpace.length > 0 ? 'none' : undefined
      }}
    >
      {/* Space name */}
      <div
        style={{
          fontWeight: 'bold',
          fontSize: '14px',
          color: colors.text.primary,
          textAlign: 'center',
          marginBottom: '8px',
          lineHeight: '1.2'
        }}
      >
        {space.name}
      </div>

      {/* Players on this space */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '40px'
        }}
      >
        {playersOnSpace.map((player) => (
          <div
            key={player.id}
            title={player.name}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: player.color || colors.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.white,
              fontSize: '16px',
              fontWeight: 'bold',
              border: `2px solid ${colors.white}`,
              boxShadow: theme.shadows.sm,
              // Animation properties
              animation: 'playerTokenAppear 0.5s ease-out',
              transition: 'all 0.3s ease-in-out',
              transform: 'scale(1)',
              zIndex: 1
            }}
            // Add hover effect for interactivity
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.zIndex = '10';
              e.currentTarget.style.boxShadow = theme.shadows.md;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.zIndex = '1';
              e.currentTarget.style.boxShadow = theme.shadows.sm;
            }}
          >
            {player.avatar || player.name.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}