// src/components/game/PlayerStatusItem.tsx

import React, { useState, useEffect } from 'react';
import { Player } from '../../types/StateTypes';
import { FinancialStatusDisplay } from './FinancialStatusDisplay';
import { CardPortfolioDashboard } from './CardPortfolioDashboard';
import { TurnControls } from './TurnControls';
import { useGameContext } from '../../context/GameContext';
import { FormatUtils } from '../../utils/FormatUtils';

interface PlayerStatusItemProps {
  player: Player;
  isCurrentPlayer: boolean;
  onOpenNegotiationModal: () => void;
  onOpenRulesModal: () => void;
  onOpenCardDetailsModal: (cardId: string) => void;
  onToggleSpaceExplorer: () => void;
  onToggleMovementPath: () => void;
  isSpaceExplorerVisible: boolean;
  isMovementPathVisible: boolean;
}

/**
 * PlayerStatusItem displays the status information for a single player
 * Shows avatar, name, money, and time with visual indicator for current player
 */
export function PlayerStatusItem({ player, isCurrentPlayer, onOpenNegotiationModal, onOpenRulesModal, onOpenCardDetailsModal, onToggleSpaceExplorer, onToggleMovementPath, isSpaceExplorerVisible, isMovementPathVisible }: PlayerStatusItemProps): JSX.Element {
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
    // Size to content instead of fixed dimensions
    height: (showFinancialStatus || showCardPortfolio) ? 'auto' : 'auto',
    minHeight: isCurrentPlayer ? '200px' : '120px',
    margin: '0 0 12px 0',
    display: 'inline-flex',
    flexDirection: (showFinancialStatus || showCardPortfolio) ? 'column' as const : 'row' as const,
    alignItems: (showFinancialStatus || showCardPortfolio) ? 'stretch' : 'stretch',
    overflow: 'visible'
  };

  // Left section styles (Avatar and name) - NO WIDTH CONTROLS
  const leftSectionStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Middle section styles (Stats and space info) - SIZE TO CONTENT
  const middleSectionStyle = {
    flex: '0 1 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
    overflow: 'visible'
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

  // Right section styles (Actions) - NO WIDTH CONTROLS
  const rightSectionStyle = {
    flex: '0 0 auto',
    borderLeft: isCurrentPlayer ? '2px solid rgba(33, 150, 243, 0.5)' : 'none',
    paddingLeft: isCurrentPlayer ? '4px' : '0',
    marginLeft: isCurrentPlayer ? '4px' : '0',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    overflow: 'visible'
  };

  // Main content container style adjustments when expanded
  const mainContentStyle = {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'stretch',
    flex: 1,
    minHeight: isCurrentPlayer ? '180px' : '100px'
  };


  return (
    <div style={baseStyle}>


      {/* Main Content Container */}
      <div style={mainContentStyle}>
        {/* Left Section: Current Space, Avatar and Name */}
        <div style={leftSectionStyle}>
          {/* Current Space moved above avatar */}
          <div style={{
            padding: '4px 8px',
            background: isCurrentPlayer ? 'rgba(33, 150, 243, 0.1)' : 'rgba(248, 249, 250, 0.8)',
            borderRadius: '6px',
            border: `1px solid ${isCurrentPlayer ? '#2196f3' : '#e0e0e0'}`,
            transition: 'all 0.4s ease-in-out',
            animation: isCurrentPlayer ? 'positionUpdate 0.6s ease-out' : undefined,
            overflow: 'hidden',
            wordWrap: 'break-word',
            marginBottom: '8px'
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: isCurrentPlayer ? '#1976d2' : '#495057',
              lineHeight: '1.2',
              wordWrap: 'break-word',
              hyphens: 'auto',
              textAlign: 'center'
            }}>
              {player.currentSpace}
            </div>
            <div style={{
              fontSize: '0.6rem',
              color: '#6c757d',
              marginTop: '1px',
              textAlign: 'center'
            }}>
              ({player.visitType} Visit)
            </div>
          </div>
          
          <div style={avatarStyle}>
            {player.avatar}
          </div>
          <div style={nameStyle}>
            {player.name}
          </div>
          
          {/* Action Buttons Row - only show for current player */}
          {isCurrentPlayer && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              marginTop: '8px',
              width: '100%'
            }}>
              {/* View Rules Button */}
              <button
                onClick={onOpenRulesModal}
                style={{
                  padding: '4px 8px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: '#6f42c1',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  transition: 'all 0.2s ease',
                  minWidth: '70px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#5a359a';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6f42c1';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="View game rules"
              >
                <span>📋</span>
                <span>Rules</span>
              </button>

              {/* Space Explorer Button */}
              <button
                onClick={onToggleSpaceExplorer}
                style={{
                  padding: '4px 8px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: isSpaceExplorerVisible ? '#28a745' : '#6c757d',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  transition: 'all 0.2s ease',
                  minWidth: '70px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isSpaceExplorerVisible ? '#218838' : '#5a6268';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSpaceExplorerVisible ? '#28a745' : '#6c757d';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Toggle space explorer panel"
              >
                <span>🔍</span>
                <span>Explorer</span>
              </button>

              {/* Available Paths Button */}
              <button
                onClick={onToggleMovementPath}
                style={{
                  padding: '4px 8px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: isMovementPathVisible ? '#007bff' : '#6c757d',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  transition: 'all 0.2s ease',
                  minWidth: '70px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isMovementPathVisible ? '#0056b3' : '#5a6268';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isMovementPathVisible ? '#007bff' : '#6c757d';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Toggle available movement paths"
              >
                <span>🧭</span>
                <span>Available Paths</span>
              </button>
            </div>
          )}
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
              <div style={statValueStyle}>💰 {FormatUtils.formatMoney(player.money)}</div>
            </button>

            <div style={statItemStyle}>
              <div style={statLabelStyle}>Time</div>
              <div style={statValueStyle}>⏱️ {FormatUtils.formatTime(player.timeSpent || 0)}</div>
            </div>

            {/* Card Portfolio Toggle Button */}
            <button
              style={{
                ...statItemStyle,
                cursor: 'pointer',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                background: showCardPortfolio ? 'rgba(33, 150, 243, 0.1)' : 'rgba(248, 249, 250, 0.8)',
                transition: 'all 0.2s ease'
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

        </div>

        {/* Right Section: Turn Controls */}
        <div style={rightSectionStyle}>
          {isCurrentPlayer ? (
            <div style={{
              background: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              padding: '4px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              minHeight: '120px',
              fontSize: '10px',
              overflow: 'visible'
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
              fontSize: '10px'
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
            onOpenCardDetailsModal={onOpenCardDetailsModal}
          />
        </div>
      )}
    </div>
  );
}