// src/components/game/ProjectProgress.tsx

import React from 'react';
import { Player } from '../../types/StateTypes';
import { useGameContext } from '../../context/GameContext';

interface ProjectProgressProps {
  players: Player[];
}

/**
 * ProjectProgress component displays global project progress for all players.
 * Shows current phase, overall progress, and player positions in the project lifecycle.
 */
export function ProjectProgress({ players }: ProjectProgressProps): JSX.Element {
  const { dataService, stateService } = useGameContext();
  const gameState = stateService.getGameState();
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

  // Calculate project progress for a single player
  const calculatePlayerProgress = (player: Player) => {
    const phases = ['INITIATION', 'PLANNING', 'DESIGN', 'BUILD', 'TEST', 'DEPLOY'];
    const spaceConfig = dataService.getGameConfigBySpace(player.currentSpace);
    
    if (!spaceConfig) {
      return { phase: 'UNKNOWN', progress: 0, phaseIndex: -1 };
    }

    const currentPhaseIndex = phases.findIndex(phase => 
      spaceConfig.phase.toUpperCase().includes(phase)
    );
    
    if (currentPhaseIndex === -1) {
      return { phase: spaceConfig.phase, progress: 0, phaseIndex: -1 };
    }

    const progress = ((currentPhaseIndex + 1) / phases.length) * 100;
    return { 
      phase: phases[currentPhaseIndex], 
      progress, 
      phaseIndex: currentPhaseIndex 
    };
  };

  // Calculate overall project progress
  const calculateOverallProgress = () => {
    if (players.length === 0) return { averageProgress: 0, leadingPhase: 'INITIATION' };

    const playerProgresses = players.map(player => calculatePlayerProgress(player));
    const averageProgress = playerProgresses.reduce((sum, p) => sum + p.progress, 0) / players.length;
    
    // Find the most advanced phase
    const maxPhaseIndex = Math.max(...playerProgresses.map(p => p.phaseIndex));
    const phases = ['INITIATION', 'PLANNING', 'DESIGN', 'BUILD', 'TEST', 'DEPLOY'];
    const leadingPhase = maxPhaseIndex >= 0 ? phases[maxPhaseIndex] : 'INITIATION';

    return { averageProgress, leadingPhase };
  };

  const overallProgress = calculateOverallProgress();
  const phases = ['INITIATION', 'PLANNING', 'DESIGN', 'BUILD', 'TEST', 'DEPLOY'];

  const containerStyle = {
    background: 'linear-gradient(135deg, #f8f9fa, #e3f2fd)',
    borderRadius: '12px',
    padding: '16px',
    margin: '16px 0',
    border: '2px solid #2196f3',
    boxShadow: '0 4px 16px rgba(33, 150, 243, 0.2)'
  };

  const titleStyle = {
    fontSize: '1rem',
    fontWeight: 'bold' as const,
    color: '#1976d2',
    marginBottom: '12px',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px'
  };

  const progressBarContainerStyle = {
    background: '#e9ecef',
    borderRadius: '8px',
    height: '12px',
    marginBottom: '12px',
    overflow: 'hidden',
    position: 'relative' as const
  };

  const progressBarFillStyle = {
    background: 'linear-gradient(90deg, #28a745, #20c997, #17a2b8)',
    height: '100%',
    width: `${overallProgress.averageProgress}%`,
    transition: 'width 0.3s ease',
    borderRadius: '8px'
  };

  const phaseIndicatorsStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px',
    padding: '0 8px'
  };

  const phaseIndicatorStyle = (phase: string, index: number) => ({
    fontSize: '0.7rem',
    fontWeight: 'bold' as const,
    color: overallProgress.averageProgress >= ((index + 1) / phases.length) * 100 ? '#28a745' : '#6c757d',
    textAlign: 'center' as const,
    minWidth: '60px'
  });

  const playersGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px',
    marginTop: '8px'
  };

  const playerItemStyle = {
    background: '#ffffff',
    borderRadius: '8px',
    padding: '8px 12px',
    border: '1px solid #dee2e6',
    fontSize: '0.8rem'
  };

  const playerNameStyle = {
    fontWeight: 'bold' as const,
    color: '#495057',
    marginBottom: '4px'
  };

  const playerPhaseStyle = {
    color: '#6c757d',
    fontSize: '0.75rem'
  };

  const playerProgressBarStyle = {
    background: '#e9ecef',
    borderRadius: '4px',
    height: '4px',
    marginTop: '4px',
    overflow: 'hidden'
  };

  const getPlayerProgressBarFill = (progress: number) => ({
    background: 'linear-gradient(90deg, #28a745, #20c997)',
    height: '100%',
    width: `${progress}%`,
    transition: 'width 0.3s ease'
  });

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>
        🚀 Project Progress Overview
      </div>

      {/* Overall Progress Bar */}
      <div style={progressBarContainerStyle}>
        <div style={progressBarFillStyle}></div>
      </div>

      {/* Phase Indicators */}
      <div style={phaseIndicatorsStyle}>
        {phases.map((phase, index) => (
          <div key={phase} style={phaseIndicatorStyle(phase, index)}>
            {phase}
          </div>
        ))}
      </div>

      {/* Overall Progress Info */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        marginBottom: '16px',
        fontSize: '0.85rem',
        color: '#495057'
      }}>
        <span>
          <strong>Overall Progress:</strong> {Math.round(overallProgress.averageProgress)}% | 
          <strong> Leading Phase:</strong> {overallProgress.leadingPhase}
        </span>
        <div style={{
          background: '#e3f2fd',
          color: '#1976d2',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 'bold'
        }}>
          {players.length} {players.length === 1 ? 'Player' : 'Players'}
        </div>
        {currentPlayer && (
          <div style={{
            background: '#e8f5e8',
            color: '#2e7d32',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            Current Turn: {currentPlayer.name}
          </div>
        )}
      </div>

      {/* Individual Player Progress */}
      {players.length > 0 && (
        <div style={playersGridStyle}>
          {players.map((player) => {
            const playerProgress = calculatePlayerProgress(player);
            return (
              <div key={player.id} style={playerItemStyle}>
                <div style={playerNameStyle}>
                  {player.avatar} {player.name}
                </div>
                <div style={playerPhaseStyle}>
                  Phase: {playerProgress.phase}
                </div>
                <div style={playerProgressBarStyle}>
                  <div style={getPlayerProgressBarFill(playerProgress.progress)}></div>
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#6c757d',
                  marginTop: '2px'
                }}>
                  {Math.round(playerProgress.progress)}% complete
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}