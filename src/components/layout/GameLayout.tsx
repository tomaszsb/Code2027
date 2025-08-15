// src/components/layout/GameLayout.tsx

import React, { useState, useEffect } from 'react';
import { CardModal } from '../modals/CardModal';
import { PlayerSetup } from '../setup/PlayerSetup';
import { useGameContext } from '../../context/GameContext';
import { GamePhase } from '../../types/StateTypes';

/**
 * GameLayout component replicates the high-level structure of the legacy FixedApp.js
 * This provides the main grid-based layout for the game application.
 */
export function GameLayout(): JSX.Element {
  const { stateService } = useGameContext();
  const [gamePhase, setGamePhase] = useState<GamePhase>('SETUP');

  // Subscribe to game state changes to track phase transitions
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setGamePhase(gameState.gamePhase);
    });
    
    // Initialize with current phase
    setGamePhase(stateService.getGameState().gamePhase);
    
    return unsubscribe;
  }, [stateService]);

  return (
    <div 
      className="game-interface"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr 1fr',
        gridTemplateRows: '1fr auto',
        columnGap: '20px',
        rowGap: '20px',
        height: '100vh',
        padding: '20px',
        minWidth: '1400px'
      }}
    >
      {/* Left Panel - Player Status */}
      <div 
        style={{
          gridColumn: '1',
          gridRow: '1',
          background: '#f5f5f5',
          border: '2px solid #ddd',
          borderRadius: '8px',
          padding: '15px'
        }}
      >
        <h3>👤 Player Status</h3>
        <div style={{ color: '#666' }}>
          Player information will be displayed here
        </div>
      </div>

      {/* Center Panel - Game Board */}
      <div 
        style={{
          gridColumn: '2',
          gridRow: '1',
          background: '#fff',
          border: '3px solid #4285f4',
          borderRadius: '8px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <h2 style={{ color: '#4285f4' }}>🎯 Game Board</h2>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div 
            style={{
              background: '#e3f2fd',
              border: '3px solid #2196f3',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
              Current Space
            </h3>
            <p style={{ margin: '0', color: '#666' }}>
              Game board will be displayed here
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Game Actions */}
      <div 
        style={{
          gridColumn: '3',
          gridRow: '1',
          background: '#fff4e6',
          border: '2px solid #ff9800',
          borderRadius: '8px',
          padding: '15px'
        }}
      >
        <h3>🎮 Game Actions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ color: '#666' }}>
            Game actions will be displayed here
          </div>
        </div>
      </div>

      {/* Bottom Panel - Turn Controls */}
      <div 
        style={{
          gridColumn: '1 / -1',
          gridRow: '2',
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '15px',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <h3 style={{ margin: 0, color: '#666' }}>🎲 Turn Controls</h3>
        <div style={{ marginLeft: '20px', color: '#666' }}>
          Turn controls will be displayed here
        </div>
      </div>

      {/* Conditional rendering based on game phase */}
      {gamePhase === 'SETUP' && (
        <PlayerSetup
          onStartGame={(players, settings) => {
            console.log('Starting game with players:', players);
            console.log('Game settings:', settings);
          }}
        />
      )}
      
      {gamePhase === 'PLAY' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          color: '#2c5530',
          fontWeight: 'bold',
          zIndex: 1000
        }}>
          🎮 Game in Progress
        </div>
      )}
    </div>
  );
}