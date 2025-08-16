import React from 'react';
import { Space, Player } from '../../types/DataTypes';

interface GameSpaceProps {
  space: Space;
  playersOnSpace: Player[];
}

export function GameSpace({ space, playersOnSpace }: GameSpaceProps): JSX.Element {
  return (
    <div
      style={{
        border: '2px solid #ccc',
        borderRadius: '8px',
        padding: '12px',
        margin: '4px',
        background: '#fff',
        minHeight: '100px',
        minWidth: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative'
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
              title: player.name
            }}
          >
            {player.avatar || player.name.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}