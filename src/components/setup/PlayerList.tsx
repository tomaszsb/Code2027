// src/components/setup/PlayerList.tsx

import React from 'react';
import { Player } from '../../types/StateTypes';
import { ColorOption, AVAILABLE_COLORS } from './usePlayerValidation';

interface PlayerListProps {
  players: Player[];
  onUpdatePlayer: (playerId: string, property: string, value: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onCycleAvatar: (playerId: string) => void;
  canRemovePlayer: boolean;
}

/**
 * PlayerList component displays and manages the list of players
 * Extracted from the legacy component's player rendering and management
 */
export function PlayerList({
  players,
  onUpdatePlayer,
  onRemovePlayer,
  onCycleAvatar,
  canRemovePlayer
}: PlayerListProps): JSX.Element {

  /**
   * Handle input focus styling
   */
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>, playerColor: string) => {
    e.target.style.borderColor = playerColor;
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#e9ecef';
  };

  /**
   * Handle remove button hover effects
   */
  const handleRemoveMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1.1)';
  };

  const handleRemoveMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  };

  /**
   * Render color picker for a player
   */
  const renderColorPicker = (player: Player) => {
    return (
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {AVAILABLE_COLORS.map((colorOption: ColorOption) => {
          const isSelected = player.color === colorOption.color;
          return (
            <button
              key={colorOption.color}
              onClick={() => onUpdatePlayer(player.id, 'color', colorOption.color)}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: colorOption.color,
                border: isSelected ? '3px solid #2c5530' : '2px solid #e9ecef',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: isSelected ? 'scale(1.2)' : 'scale(1)'
              }}
              title={colorOption.name}
              aria-label={`Select ${colorOption.name} color`}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = isSelected ? 'scale(1.2)' : 'scale(1)';
              }}
            />
          );
        })}
      </div>
    );
  };

  /**
   * Render individual player card
   */
  const renderPlayerCard = (player: Player) => {
    return (
      <div
        key={player.id}
        style={{
          background: '#f8f9fa',
          border: `3px solid ${player.color}`,
          borderRadius: '12px',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: '60px 1fr auto',
          gap: '1rem',
          alignItems: 'center',
          transition: 'all 0.3s ease',
          animation: 'slideInFromLeft 0.5s ease-out'
        }}
      >
        {/* Avatar section */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '2.5rem',
              marginBottom: '0.5rem',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            onClick={() => onCycleAvatar(player.id)}
            title="Click to change avatar"
          >
            {player.avatar}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#6c757d'
          }}>
            Click to change
          </div>
        </div>

        {/* Name and color inputs */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Name input */}
          <input
            type="text"
            placeholder="Enter player name"
            value={player.name}
            onChange={(e) => onUpdatePlayer(player.id, 'name', e.target.value)}
            maxLength={20}
            style={{
              padding: '0.75rem',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 'bold',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => handleInputFocus(e, player.color || '')}
            onBlur={handleInputBlur}
          />

          {/* Color picker */}
          {renderColorPicker(player)}
        </div>

        {/* Remove button */}
        {canRemovePlayer && (
          <button
            onClick={() => onRemovePlayer(player.id)}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '1.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={handleRemoveMouseEnter}
            onMouseLeave={handleRemoveMouseLeave}
            title="Remove player"
            aria-label={`Remove ${player.name}`}
          >
            ×
          </button>
        )}
      </div>
    );
  };

  if (players.length === 0) {
    return (
      <div style={{
        background: '#f8f9fa',
        border: '2px dashed #dee2e6',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        color: '#6c757d',
        fontStyle: 'italic'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
        <p style={{ margin: 0, fontSize: '1.1rem' }}>
          No players added yet. Click "Add Player" to get started!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gap: '1rem'
    }}>
      {players.map(player => renderPlayerCard(player))}
    </div>
  );
}