// src/components/game/PlayerStatusItem.tsx

import React, { useState, useEffect } from 'react';
import { colors } from '../../styles/theme';
import { Player } from '../../types/StateTypes';
import { FinancialStatusDisplay } from './FinancialStatusDisplay';
import { CardPortfolioDashboard } from './CardPortfolioDashboard';
import { TurnControlsWithActions } from './TurnControlsWithActions';
import { useGameContext } from '../../context/GameContext';
import { FormatUtils } from '../../utils/FormatUtils';
import { DiscardedCardsModal } from '../modals/DiscardedCardsModal';

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
  // TurnControlsWithActions props (passed from GameLayout via PlayerStatusPanel)
  currentPlayer: Player;
  gamePhase: import('../../types/StateTypes').GamePhase;
  isProcessingTurn: boolean;
  hasPlayerMovedThisTurn: boolean;
  hasPlayerRolledDice: boolean;
  hasCompletedManualActions: boolean;
  awaitingChoice: boolean;
  actionCounts: { required: number; completed: number };
  completedActions: {
    diceRoll?: string;
    manualActions: { [effectType: string]: string };
  };
  feedbackMessage: string;
  onRollDice: () => Promise<void>;
  onEndTurn: () => Promise<void>;
  onManualEffect: (effectType: string) => Promise<void>;
  onNegotiate: () => Promise<void>;
  onAutomaticFunding?: () => Promise<void>;
  playerId: string;
  playerName: string;
}

/**
 * PlayerStatusItem displays the status information for a single player
 * Shows avatar, name, money, and time with visual indicator for current player
 */
export function PlayerStatusItem({ 
  player, 
  isCurrentPlayer, 
  onOpenNegotiationModal, 
  onOpenRulesModal, 
  onOpenCardDetailsModal, 
  onToggleSpaceExplorer, 
  onToggleMovementPath, 
  isSpaceExplorerVisible, 
  isMovementPathVisible,
  // TurnControlsWithActions props
  currentPlayer,
  gamePhase,
  isProcessingTurn,
  hasPlayerMovedThisTurn,
  hasPlayerRolledDice,
  hasCompletedManualActions,
  awaitingChoice,
  actionCounts,
  completedActions,
  feedbackMessage,
  onRollDice,
  onEndTurn,
  onManualEffect,
  onNegotiate,
  onAutomaticFunding,
  playerId,
  playerName
}: PlayerStatusItemProps): JSX.Element {
  const { stateService, dataService, cardService } = useGameContext();
  const [showFinancialStatus, setShowFinancialStatus] = useState(false);
  const [showCardPortfolio, setShowCardPortfolio] = useState(false);
  const [showDiscardedCards, setShowDiscardedCards] = useState(false);

  // Calculate financial status for display
  const calculateFinancialStatus = () => {
    const hand = player.hand || [];
    const wCards = hand.filter(cardId => cardService.getCardType(cardId) === 'W');
    const totalScopeCost = player.projectScope || 0;
    const surplus = player.money - totalScopeCost;
    
    return {
      playerMoney: player.money,
      totalScopeCost,
      surplus,
      isDeficit: surplus < 0
    };
  };

  const financialStatus = calculateFinancialStatus();

  // Helper function to evaluate effect conditions
  const evaluateEffectCondition = (condition: string | undefined): boolean => {
    if (!condition || condition === 'always') return true;

    const conditionLower = condition.toLowerCase();

    // Project scope conditions
    const projectScope = player.projectScope || 0;
    if (conditionLower === 'scope_le_4m') {
      return projectScope <= 4000000;
    }
    if (conditionLower === 'scope_gt_4m') {
      return projectScope > 4000000;
    }

    // Add other conditions as needed
    // For now, default to true for unknown conditions
    return true;
  };

  // Calculate space time cost that will be spent when taking actions
  const getSpaceTimeCost = (): number => {
    const spaceEffects = dataService.getSpaceEffects(player.currentSpace, player.visitType);
    return spaceEffects
      .filter(effect => effect.effect_type === 'time' && effect.effect_action === 'add' && evaluateEffectCondition(effect.condition))
      .reduce((total, effect) => total + Number(effect.effect_value || 0), 0);
  };

  const spaceTimeCost = getSpaceTimeCost();


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
    background: isCurrentPlayer ? `linear-gradient(135deg, ${colors.primary.light}, ${colors.primary.lighter})` : colors.white,
    border: isCurrentPlayer ? `3px solid ${colors.primary.main}` : `2px solid ${colors.secondary.border}`,
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
    color: isCurrentPlayer ? colors.primary.text : colors.success.text,
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
    color: colors.secondary.main,
    fontWeight: 'bold' as const,
    textTransform: 'uppercase' as const,
    marginBottom: '2px',
    letterSpacing: '0.5px'
  };

  const statValueStyle = {
    fontSize: '0.9rem',
    fontWeight: 'bold' as const,
    color: colors.text.primary
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
    alignItems: 'center',
    overflow: 'visible',
    minHeight: '100%'
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
        {/* Left Section: Avatar and Name */}
        <div style={leftSectionStyle}>
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
                  color: colors.white,
                  backgroundColor: colors.purple.main,
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
                  e.currentTarget.style.backgroundColor = colors.purple.dark;
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.purple.main;
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
                  color: colors.white,
                  backgroundColor: isSpaceExplorerVisible ? colors.success.main : colors.secondary.main,
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
                  e.currentTarget.style.backgroundColor = isSpaceExplorerVisible ? colors.success.dark : colors.secondary.darker;
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isSpaceExplorerVisible ? colors.success.main : colors.secondary.main;
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
                  color: colors.white,
                  backgroundColor: isMovementPathVisible ? colors.primary.main : colors.secondary.main,
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
                  e.currentTarget.style.backgroundColor = isMovementPathVisible ? colors.primary.dark : colors.secondary.darker;
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isMovementPathVisible ? colors.primary.main : colors.secondary.main;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Toggle available movement paths"
              >
                <span>🧭</span>
                <span>Available Paths</span>
              </button>

              {/* Discarded Cards Button */}
              <button
                onClick={() => setShowDiscardedCards(true)}
                style={{
                  padding: '4px 8px',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  color: colors.white,
                  backgroundColor: colors.warning.main,
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
                  e.currentTarget.style.backgroundColor = colors.warning.dark;
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.warning.main;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="View discarded cards"
              >
                <span>🗂️</span>
                <span>Discarded</span>
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
                border: `1px solid ${financialStatus.isDeficit ? 'rgba(220, 53, 69, 0.3)' : 'rgba(40, 167, 69, 0.3)'}`,
                background: showFinancialStatus 
                  ? (financialStatus.isDeficit ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)') 
                  : 'rgba(248, 249, 250, 0.8)',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setShowFinancialStatus(!showFinancialStatus)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = financialStatus.isDeficit ? 'rgba(220, 53, 69, 0.2)' : 'rgba(40, 167, 69, 0.2)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = showFinancialStatus 
                  ? (financialStatus.isDeficit ? 'rgba(220, 53, 69, 0.1)' : 'rgba(40, 167, 69, 0.1)') 
                  : 'rgba(248, 249, 250, 0.8)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`${showFinancialStatus ? 'Hide' : 'Show'} consolidated financial report - ${financialStatus.isDeficit ? 'Funding Shortage' : 'Fully Funded'}: ${FormatUtils.formatMoney(Math.abs(financialStatus.surplus))}`}
            >
              <div style={statLabelStyle}>
                Finances {showFinancialStatus ? '▲' : '▼'} 
                {financialStatus.isDeficit ? ' ⚠️' : ' ✅'}
              </div>
              <div style={{
                ...statValueStyle,
                color: financialStatus.isDeficit ? colors.danger.main : colors.success.main
              }}>
                📊 {FormatUtils.formatMoney(player.money)}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: financialStatus.isDeficit ? colors.danger.main : colors.success.main,
                fontWeight: 'bold',
                marginTop: '2px'
              }}>
                {financialStatus.isDeficit ? 'Shortage' : 'Surplus'}: {FormatUtils.formatMoney(Math.abs(financialStatus.surplus))}
              </div>
            </button>

            <div style={statItemStyle}>
              <div style={statLabelStyle}>Time</div>

              {/* Time Cost Warning - appears above current time when current player has time cost */}
              {isCurrentPlayer && spaceTimeCost > 0 && (
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  color: colors.warning.dark,
                  backgroundColor: colors.warning.light,
                  border: `1px solid ${colors.warning.main}`,
                  borderRadius: '4px',
                  padding: '4px 6px',
                  marginBottom: '4px',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px'
                }}>
                  <span style={{ fontSize: '0.8rem' }}>⚠️</span>
                  <span>Cost: {spaceTimeCost}d</span>
                </div>
              )}

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

          {/* Location Story Section */}
          {(() => {
            const spaceContent = dataService.getSpaceContent(player.currentSpace, 'First');
            const storyText = spaceContent?.story || 'No story available for this space.';
            
            return (
              <div style={{
                background: `linear-gradient(135deg, ${colors.warning.bg}, ${colors.warning.light})`,
                border: `2px solid ${colors.warning.main}`,
                borderRadius: '8px',
                padding: '12px',
                marginTop: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: colors.brown.main,
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  📍 Location Story
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  color: colors.brown.dark,
                  lineHeight: '1.4',
                  fontStyle: storyText === 'No story available for this space.' ? 'italic' : 'normal'
                }}>
                  {storyText}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: colors.brown.text,
                  marginTop: '6px',
                  fontStyle: 'italic'
                }}>
                  Current location: {player.currentSpace}
                </div>
              </div>
            );
          })()}


        </div>

        {/* Right Section: Turn Controls */}
        <div style={rightSectionStyle}>
          {isCurrentPlayer ? (
            <div style={{
              background: colors.white,
              border: `1px solid ${colors.secondary.border}`,
              borderRadius: '4px',
              padding: '4px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              minHeight: '120px',
              fontSize: '10px',
              overflow: 'visible'
            }}>
              <TurnControlsWithActions 
                // Legacy props
                onOpenNegotiationModal={onOpenNegotiationModal}
                playerId={player.id}
                playerName={player.name}
                // All the new props from GameLayout
                currentPlayer={currentPlayer}
                gamePhase={gamePhase}
                isProcessingTurn={isProcessingTurn}
                hasPlayerMovedThisTurn={hasPlayerMovedThisTurn}
                hasPlayerRolledDice={hasPlayerRolledDice}
                hasCompletedManualActions={hasCompletedManualActions}
                awaitingChoice={awaitingChoice}
                actionCounts={actionCounts}
                completedActions={completedActions}
                feedbackMessage={feedbackMessage}
                onRollDice={onRollDice}
                onEndTurn={onEndTurn}
                onManualEffect={onManualEffect}
                onNegotiate={onNegotiate}
                onAutomaticFunding={onAutomaticFunding}
              />
            </div>
          ) : (
            <div style={{
              background: colors.danger.light,
              border: `1px solid ${colors.danger.border}`,
              borderRadius: '6px',
              padding: '6px',
              textAlign: 'center',
              color: colors.danger.text,
              fontSize: '10px',
              minHeight: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
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


      {/* Discarded Cards Modal */}
      <DiscardedCardsModal
        player={player}
        isVisible={showDiscardedCards}
        onClose={() => setShowDiscardedCards(false)}
        onOpenCardDetailsModal={onOpenCardDetailsModal}
      />
    </div>
  );
}