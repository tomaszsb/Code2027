// src/components/setup/PlayerList.tsx

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { colors } from '../../styles/theme';
import { Player } from '../../types/StateTypes';
import { ColorOption, AVAILABLE_COLORS } from './usePlayerValidation';
import { getServerURL, copyToClipboard } from '../../utils/networkDetection';

interface PlayerListProps {
  players: Player[];
  onUpdatePlayer: (playerId: string, property: string, value: string) => void;
  onRemovePlayer: (playerId: string) => void;
  onCycleAvatar: (playerId: string) => void;
  canRemovePlayer: boolean;
  showQRCodes?: boolean;
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
  canRemovePlayer,
  showQRCodes = true
}: PlayerListProps): JSX.Element {

  // State for QR code expansion per player
  const [expandedQR, setExpandedQR] = useState<Set<string>>(new Set());
  const [copiedURL, setCopiedURL] = useState<string | null>(null);

  /**
   * Toggle QR code visibility for a specific player
   */
  const toggleQR = (playerId: string) => {
    setExpandedQR(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  /**
   * Copy URL to clipboard
   */
  const handleCopyURL = async (playerId: string) => {
    const url = getServerURL(playerId);
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedURL(playerId);
      setTimeout(() => setCopiedURL(null), 2000);
    }
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
    const playerURL = getServerURL(player.id);
    const isQRExpanded = expandedQR.has(player.id);
    const isCopied = copiedURL === player.id;

    return (
      <div
        key={player.id}
        style={{
          background: colors.secondary.bg,
          border: `3px solid ${player.color}`,
          borderRadius: '12px',
          padding: '1.5rem',
          transition: 'all 0.3s ease',
          animation: 'slideInFromLeft 0.5s ease-out'
        }}
      >
        {/* Main player info section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr auto',
          gap: '1rem',
          alignItems: 'center',
          marginBottom: showQRCodes ? '1rem' : '0'
        }}>
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

        {/* QR Code Section */}
        {showQRCodes && (
          <div style={{
            borderTop: `2px solid ${colors.secondary.light}`,
            paddingTop: '1rem'
          }}>
            <button
              onClick={() => toggleQR(player.id)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: isQRExpanded ? colors.primary.main : colors.secondary.light,
                color: isQRExpanded ? 'white' : colors.secondary.dark,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              📱 {isQRExpanded ? 'Hide QR Code' : 'Show QR Code'}
            </button>

            {isQRExpanded && (
              <div style={{
                background: 'white',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '0.75rem',
                textAlign: 'center'
              }}>
                {/* QR Code */}
                <div style={{
                  display: 'inline-block',
                  padding: '0.5rem',
                  background: 'white',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <QRCodeSVG
                    value={playerURL}
                    size={150}
                    level="M"
                    includeMargin={true}
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxWidth: '150px'
                    }}
                  />
                </div>

                {/* URL */}
                <p style={{
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  color: colors.secondary.main,
                  wordBreak: 'break-all',
                  margin: '0 0 0.75rem 0',
                  padding: '0.5rem',
                  background: colors.secondary.bg,
                  borderRadius: '4px'
                }}>
                  {playerURL}
                </p>

                {/* Copy Button */}
                <button
                  onClick={() => handleCopyURL(player.id)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: isCopied ? colors.success.main : colors.primary.main,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isCopied ? '✅ Copied!' : '📋 Copy URL'}
                </button>
              </div>
            )}
          </div>
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