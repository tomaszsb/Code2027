// src/components/layout/GameLayout.tsx

import React, { useState, useEffect } from 'react';
import { CardModal } from '../modals/CardModal';
import { ChoiceModal } from '../modals/ChoiceModal';
import { PlayerSetup } from '../setup/PlayerSetup';
import { PlayerStatusPanel } from '../game/PlayerStatusPanel';
import { GameBoard } from '../game/GameBoard';
import { TurnControls } from '../game/TurnControls';
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
          padding: gamePhase === 'PLAY' ? '0' : '15px'
        }}
      >
        {gamePhase === 'PLAY' ? (
          <PlayerStatusPanel />
        ) : (
          <>
            <h3>👤 Player Status</h3>
            <div style={{ color: '#666' }}>
              Player information will be displayed here
            </div>
          </>
        )}
      </div>

      {/* Center Panel - Game Board */}
      <div 
        style={{
          gridColumn: '2',
          gridRow: '1',
          background: '#fff',
          border: '3px solid #4285f4',
          borderRadius: '8px',
          padding: '0',
          overflow: 'hidden'
        }}
      >
        {gamePhase === 'PLAY' ? (
          <GameBoard />
        ) : (
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '20px'
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
        )}
      </div>

      {/* Right Panel - Empty (Actions moved to current player) */}
      <div 
        style={{
          gridColumn: '3',
          gridRow: '1',
          background: '#f8f9fa',
          border: '2px solid #e9ecef',
          borderRadius: '8px',
          padding: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6c757d'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }}>
            📋
          </div>
          <div style={{ fontSize: '1rem' }}>
            Additional UI elements will be placed here
          </div>
        </div>
      </div>

      {/* Bottom Panel - Turn Controls */}
      <div 
        style={{
          gridColumn: '1 / -1',
          gridRow: '2',
          padding: '0',
          minHeight: '80px'
        }}
      >
        <TurnControls />
      </div>

      {/* Conditional rendering based on game phase */}
      {gamePhase === 'SETUP' && (
        <PlayerSetup
          onStartGame={(players, settings) => {
            console.log('Starting game with players:', players);
            console.log('Game settings:', settings);
            // Actually start the game through StateService
            stateService.startGame();
          }}
        />
      )}
      

      {/* CardModal - always rendered, visibility controlled by state */}
      <CardModal />
      
      {/* ChoiceModal - always rendered, visibility controlled by state */}
      <ChoiceModal />
    </div>
  );
}