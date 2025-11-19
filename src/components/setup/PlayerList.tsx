// src/components/setup/PlayerList.tsx

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { colors } from '../../styles/theme';
import { Player } from '../../types/StateTypes';
import { ColorOption, AVAILABLE_COLORS } from './usePlayerValidation';
import { getServerURL, getNetworkInfo } from '../../utils/NetworkUtils';

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

  // ✅ CORRECT: Hook at component top level (NOT inside renderPlayerCard)
  // Track QR code visibility for each player independently
  const [qrVisibility, setQrVisibility] = useState<Record<string, boolean>>({});

  /**
   * Toggle QR code visibility for a specific player
   */
  const toggleQR = (playerId: string) => {
    setQrVisibility(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };

  /**
   * Handle input focus styling
   */
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>, playerColor: string) => {
    e.target.style.borderColor = playerColor;
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = colors.secondary.light;
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
                border: isSelected ? `3px solid ${colors.success.text}` : `2px solid ${colors.secondary.light}`,
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
    // ✅ CORRECT: Get state from props, NOT useState inside this function
    const showQR = qrVisibility[player.id] || false;
    const playerURL = getServerURL(player.id);
    const networkInfo = getNetworkInfo();

    return (
      <div
        key={player.id}
        style={{
          background: colors.secondary.bg,
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
            color: colors.secondary.main
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
              border: `2px solid ${colors.secondary.light}`,
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

          {/* QR Code toggle button */}
          <button
            onClick={() => toggleQR(player.id)}
            style={{
              padding: '0.5rem 1rem',
              border: `2px solid ${player.color}`,
              borderRadius: '8px',
              backgroundColor: showQR ? player.color : 'transparent',
              color: showQR ? 'white' : player.color,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if (!showQR) {
                e.currentTarget.style.backgroundColor = `${player.color}22`;
              }
            }}
            onMouseLeave={(e) => {
              if (!showQR) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span>{showQR ? '📱' : '📱'}</span>
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </button>

          {/* QR Code display */}
          {showQR && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'white',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              border: `2px solid ${player.color}`
            }}>
              <QRCodeSVG value={playerURL} size={120} />
              <div style={{
                fontSize: '0.75rem',
                color: colors.secondary.main,
                textAlign: 'center',
                wordBreak: 'break-all',
                maxWidth: '120px'
              }}>
                {networkInfo.baseUrl}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: colors.secondary.light,
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                Scan to join as {player.name || 'player'}
              </div>
            </div>
          )}
        </div>

        {/* Remove button */}
        {canRemovePlayer && (
          <button
            onClick={() => onRemovePlayer(player.id)}
            style={{
              background: colors.danger.main,
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
        background: colors.secondary.bg,
        border: `2px dashed ${colors.secondary.border}`,
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
        color: colors.secondary.main,
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