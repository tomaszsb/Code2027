// src/components/game/PlayerStatusPanel.tsx

import React from 'react';
import { PlayerStatusItem } from './PlayerStatusItem';
import { Player } from '../../types/StateTypes';

interface PlayerStatusPanelProps {
  onOpenNegotiationModal: () => void;
  onOpenRulesModal: () => void;
  onOpenCardDetailsModal: (cardId: string) => void;
  onToggleSpaceExplorer: () => void;
  onToggleMovementPath: () => void;
  isSpaceExplorerVisible: boolean;
  isMovementPathVisible: boolean;
  // Player data (passed from GameLayout)
  players: Player[];
  currentPlayerId: string | null;
  // TurnControlsWithActions props (passed from GameLayout)
  currentPlayer: Player | null;
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
  onStartGame: () => void;
  playerId: string;
  playerName: string;
}

/**
 * PlayerStatusPanel displays the list of all player statuses
 * Now acts as a "dumb" component, receiving all data via props from GameLayout
 */
export function PlayerStatusPanel({ 
  onOpenNegotiationModal, 
  onOpenRulesModal, 
  onOpenCardDetailsModal, 
  onToggleSpaceExplorer, 
  onToggleMovementPath, 
  isSpaceExplorerVisible, 
  isMovementPathVisible,
  // Player data from GameLayout
  players,
  currentPlayerId,
  // TurnControlsWithActions props from GameLayout
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
  onStartGame,
  playerId,
  playerName
}: PlayerStatusPanelProps): JSX.Element {
  // No service dependencies - all data comes from props

  const containerStyle = {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '8px',
    height: '100%',
    overflow: 'visible' as const, // Changed from 'auto' to 'visible'
    boxSizing: 'border-box' as const
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #e9ecef'
  };

  const titleStyle = {
    fontSize: '1.4rem',
    fontWeight: 'bold' as const,
    color: '#2c5530',
    margin: 0
  };

  const playerCountStyle = {
    background: '#e3f2fd',
    color: '#1976d2',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 'bold' as const
  };

  const emptyStateStyle = {
    textAlign: 'center' as const,
    color: '#6c757d',
    fontSize: '1rem',
    padding: '40px 20px'
  };

  return (
    <div style={containerStyle}>

      {/* Player list */}
      {players.length === 0 ? (
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '2rem', marginBottom: '12px', opacity: 0.5 }}>
            🎮
          </div>
          <div>
            No players in the game yet.
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {players.map((player) => (
            <PlayerStatusItem
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayerId}
              onOpenNegotiationModal={onOpenNegotiationModal}
              onOpenRulesModal={onOpenRulesModal}
              onOpenCardDetailsModal={onOpenCardDetailsModal}
              onToggleSpaceExplorer={onToggleSpaceExplorer}
              onToggleMovementPath={onToggleMovementPath}
              isSpaceExplorerVisible={isSpaceExplorerVisible}
              isMovementPathVisible={isMovementPathVisible}
              // TurnControlsWithActions props (pass-through from GameLayout)
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
              onStartGame={onStartGame}
              playerId={playerId}
              playerName={playerName}
            />
          ))}
        </div>
      )}

    </div>
  );
}