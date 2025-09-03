import React from 'react';
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
        border: playersOnSpace.length > 0 ? '3px solid #4caf50' : '2px solid #ccc',
        borderRadius: '8px',
        padding: '12px',
        margin: '4px',
        background: playersOnSpace.length > 0 ? '#f1f8e9' : '#fff',
        minHeight: '100px',
        minWidth: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: playersOnSpace.length > 0 
          ? '0 4px 12px rgba(76, 175, 80, 0.3)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
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
          color: '#333',
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
              background: player.color || '#007bff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              border: '2px solid #fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
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
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.zIndex = '1';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
            }}
          >
            {player.avatar || player.name.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}