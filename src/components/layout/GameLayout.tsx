// src/components/layout/GameLayout.tsx

import React from 'react';
import { CardModal } from '../modals/CardModal';

/**
 * GameLayout component replicates the high-level structure of the legacy FixedApp.js
 * This provides the main grid-based layout for the game application.
 */
export function GameLayout(): JSX.Element {
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

      {/* Card Modal - positioned over the layout for visual verification */}
      <CardModal
        isVisible={true}
        title="Sample Card Modal"
        canPlay={true}
        onPlay={() => console.log('Sample card played')}
        onClose={() => console.log('Sample modal closed')}
      />
    </div>
  );
}