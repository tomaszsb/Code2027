// src/components/game/PlayerStatusItem.tsx

import React, { useState, useEffect } from 'react';
import { Player } from '../../types/StateTypes';
import { FinancialStatusDisplay } from './FinancialStatusDisplay';
import { CardPortfolioDashboard } from './CardPortfolioDashboard';
import { TurnControls } from './TurnControls';
import { useGameContext } from '../../context/GameContext';

interface PlayerStatusItemProps {
  player: Player;
  isCurrentPlayer: boolean;
  onOpenNegotiationModal: () => void;
}

/**
 * PlayerStatusItem displays the status information for a single player
 * Shows avatar, name, money, and time with visual indicator for current player
 */
export function PlayerStatusItem({ player, isCurrentPlayer, onOpenNegotiationModal }: PlayerStatusItemProps): JSX.Element {
  const { stateService } = useGameContext();
  const [showFinancialStatus, setShowFinancialStatus] = useState(false);
  const [showCardPortfolio, setShowCardPortfolio] = useState(false);
  // Add CSS animation styles to document head if not already present
  React.useEffect(() => {
    const styleId = 'player-status-animations';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes positionUpdate {
          0% {
            transform: translateX(0) scale(1);
            background-color: rgba(33, 150, 243, 0.1);
          }
          25% {
            transform: translateX(3px) scale(1.02);
            background-color: rgba(76, 175, 80, 0.2);
          }
          50% {
            transform: translateX(-3px) scale(1.02);
            background-color: rgba(255, 193, 7, 0.2);
          }
          75% {
            transform: translateX(1px) scale(1.01);
            background-color: rgba(76, 175, 80, 0.2);
          }
          100% {
            transform: translateX(0) scale(1);
            background-color: rgba(33, 150, 243, 0.1);
          }
        }
        
        @keyframes currentPlayerPulse {
          0%, 100% {
            box-shadow: 0 8px 32px rgba(33, 150, 243, 0.4);
          }
          50% {
            box-shadow: 0 8px 32px rgba(33, 150, 243, 0.6);
          }
        }
        
        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const baseStyle = {
    background: isCurrentPlayer ? 'linear-gradient(135deg, #e3f2fd, #f0f9ff)' : '#ffffff',
    border: isCurrentPlayer ? '3px solid #2196f3' : '2px solid #e0e0e0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    boxShadow: isCurrentPlayer 
      ? '0 8px 24px rgba(33, 150, 243, 0.4)' 
      : '0 4px 12px rgba(0, 0, 0, 0.12)',
    // Enhanced layout with better visibility
    width: '100%',
    height: (showFinancialStatus || showCardPortfolio) ? 'auto' : (isCurrentPlayer ? '200px' : '120px'),
    minHeight: isCurrentPlayer ? '200px' : '120px',
    margin: '0 0 12px 0',
    display: 'flex',
    flexDirection: (showFinancialStatus || showCardPortfolio) ? 'column' as const : 'row' as const,
    alignItems: (showFinancialStatus || showCardPortfolio) ? 'stretch' : 'stretch',
    overflow: 'visible'
  };

  // Left section styles (Avatar and name)
  const leftSectionStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80px',
    maxWidth: '80px',
    borderRight: '1px solid rgba(0, 0, 0, 0.1)',
    paddingRight: '8px',
    marginRight: '8px'
  };

  const avatarStyle = {
    fontSize: '1.8rem',
    marginBottom: '4px',
    display: 'block'
  };

  const nameStyle = {
    fontSize: '0.8rem',
    fontWeight: 'bold' as const,
    color: isCurrentPlayer ? '#1976d2' : '#2c5530',
    textAlign: 'center' as const,
    lineHeight: '1.1'
  };

  // Middle section styles (Stats and space info)
  const middleSectionStyle = {
    flex: '1 1 0',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    minWidth: 0, // Allow flex shrinking
    maxWidth: '300px', // Constrain middle section width
    overflow: 'hidden'
  };

  const statsRowStyle = {
    display: 'flex',
    gap: '6px',
    marginBottom: '6px'
  };

  const statItemStyle = {
    background: 'rgba(248, 249, 250, 0.9)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    minWidth: '80px',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  const statLabelStyle = {
    fontSize: '0.7rem',
    color: '#6c757d',
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    marginBottom: '2px',
    letterSpacing: '0.5px'
  };

  const statValueStyle = {
    fontSize: '0.9rem',
    fontWeight: 'bold' as const,
    color: '#2c3e50'
  };

  // Right section styles (Actions)
  const rightSectionStyle = {
    flex: '0 0 150px',
    width: '150px',
    maxWidth: '150px',
    borderLeft: isCurrentPlayer ? '2px solid rgba(33, 150, 243, 0.5)' : 'none', // More visible border
    paddingLeft: isCurrentPlayer ? '4px' : '0',
    marginLeft: isCurrentPlayer ? '4px' : '0',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    overflow: 'hidden'
  };

  // Main content container style adjustments when expanded
  const mainContentStyle = {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'stretch',
    flex: 1,
    minHeight: isCurrentPlayer ? '180px' : '100px' // Reduced heights
  };


  return (
    <div style={baseStyle}>
      {/* Current player indicator */}
      {isCurrentPlayer && (
        <div style={{
          position: 'absolute',
          top: '-12px',
          right: '-12px',
          background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
          color: 'white',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 4px 16px rgba(76, 175, 80, 0.6)',
          zIndex: 10,
          border: '2px solid white',
          animation: 'currentPlayerPulse 2s ease-in-out infinite'
        }}>
          ▶
        </div>
      )}


      {/* Main Content Container */}
      <div style={mainContentStyle}>
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
            {/* Clickable Money Display */}
            <button
              style={{
                ...statItemStyle,
                cursor: 'pointer',
                border: '1px solid rgba(40, 167, 69, 0.3)',
                background: showFinancialStatus ? 'rgba(40, 167, 69, 0.1)' : 'rgba(248, 249, 250, 0.8)',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setShowFinancialStatus(!showFinancialStatus)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(40, 167, 69, 0.2)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = showFinancialStatus ? 'rgba(40, 167, 69, 0.1)' : 'rgba(248, 249, 250, 0.8)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`${showFinancialStatus ? 'Hide' : 'Show'} financial status`}
            >
              <div style={statLabelStyle}>Money {showFinancialStatus ? '▲' : '▼'}</div>
              <div style={statValueStyle}>💰 ${player.money}</div>
            </button>

            <div style={statItemStyle}>
              <div style={statLabelStyle}>Time</div>
              <div style={statValueStyle}>⏱️ {player.timeSpent || 0} days</div>
            </div>

            {/* Card Portfolio Toggle Button */}
            <button
              style={{
                ...statItemStyle,
                cursor: 'pointer',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                background: showCardPortfolio ? 'rgba(33, 150, 243, 0.1)' : 'rgba(248, 249, 250, 0.8)',
                transition: 'all 0.2s ease',
                minWidth: '90px'
              }}
              onClick={() => setShowCardPortfolio(!showCardPortfolio)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(33, 150, 243, 0.2)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = showCardPortfolio ? 'rgba(33, 150, 243, 0.1)' : 'rgba(248, 249, 250, 0.8)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`${showCardPortfolio ? 'Hide' : 'Show'} card portfolio`}
            >
              <div style={statLabelStyle}>Cards {showCardPortfolio ? '▲' : '▼'}</div>
              <div style={statValueStyle}>🃏 Portfolio</div>
            </button>
          </div>

          {/* Bottom section: Current space */}
          <div style={{
            padding: '8px 12px',
            background: isCurrentPlayer ? 'rgba(33, 150, 243, 0.1)' : 'rgba(248, 249, 250, 0.8)',
            borderRadius: '8px',
            border: `1px solid ${isCurrentPlayer ? '#2196f3' : '#e0e0e0'}`,
            transition: 'all 0.4s ease-in-out',
            animation: isCurrentPlayer ? 'positionUpdate 0.6s ease-out' : undefined,
            width: '100%',
            maxWidth: '300px',
            overflow: 'hidden',
            wordWrap: 'break-word'
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
              lineHeight: '1.2',
              wordWrap: 'break-word',
              hyphens: 'auto'
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

        {/* Right Section: Turn Controls (always show for debugging, but styled for current player) */}
        <div style={rightSectionStyle}>
          {isCurrentPlayer ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              padding: '4px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              width: '150px',
              maxWidth: '150px',
              minHeight: '120px',
              fontSize: '10px',
              overflow: 'hidden'
            }}>
              <TurnControls onOpenNegotiationModal={onOpenNegotiationModal} />
            </div>
          ) : (
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              padding: '6px',
              textAlign: 'center',
              color: '#6c757d',
              fontSize: '10px',
              width: 'fit-content',
              maxWidth: '100px'
            }}>
              Not your turn
            </div>
          )}
        </div>
      </div>

      {/* Financial Status Display */}
      {showFinancialStatus && (
        <div style={{
          animation: 'fadeIn 0.3s ease-in-out',
          transform: 'translateY(0)',
          transition: 'all 0.3s ease-in-out'
        }}>
          <FinancialStatusDisplay player={player} />
        </div>
      )}

      {/* Card Portfolio Dashboard */}
      {showCardPortfolio && (
        <div style={{
          animation: 'fadeIn 0.3s ease-in-out',
          transform: 'translateY(0)',
          transition: 'all 0.3s ease-in-out'
        }}>
          <CardPortfolioDashboard 
            player={player} 
            isCurrentPlayer={isCurrentPlayer}
            onOpenCardDetailsModal={(cardId) => console.log('Open card details for:', cardId)}
          />
        </div>
      )}
    </div>
  );
}