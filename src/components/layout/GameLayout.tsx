// src/components/layout/GameLayout.tsx

import React, { useState, useEffect } from 'react';
import { CardModal } from '../modals/CardModal';
import { CardDetailsModal } from '../modals/CardDetailsModal';
import { ChoiceModal } from '../modals/ChoiceModal';
import { EndGameModal } from '../modals/EndGameModal';
import { NegotiationModal } from '../modals/NegotiationModal';
import { RulesModal } from '../modals/RulesModal';
import { PlayerSetup } from '../setup/PlayerSetup';
import { PlayerStatusPanel } from '../game/PlayerStatusPanel';
import { GameBoard } from '../game/GameBoard';
import { ProjectProgress } from '../game/ProjectProgress';
import { useGameContext } from '../../context/GameContext';
import { GamePhase, Player } from '../../types/StateTypes';

/**
 * GameLayout component replicates the high-level structure of the legacy FixedApp.js
 * This provides the main grid-based layout for the game application.
 */
export function GameLayout(): JSX.Element {
  const { stateService } = useGameContext();
  const [gamePhase, setGamePhase] = useState<GamePhase>('SETUP');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isCardDetailsModalOpen, setIsCardDetailsModalOpen] = useState<boolean>(false);
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  // Add responsive CSS styles to document head
  React.useEffect(() => {
    const styleId = 'game-layout-responsive';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .game-interface-responsive {
          display: grid;
          grid-template-columns: max-content 1fr;
          column-gap: 8px;
          row-gap: 4px;
          height: 100vh;
          width: 100vw;
          padding: 4px;
          box-sizing: border-box;
          overflow: hidden;
        }
        
        @media (max-width: 1400px) {
          .game-interface-responsive {
            grid-template-columns: max-content 1fr;
            column-gap: 6px;
            padding: 4px;
          }
        }
        
        @media (max-width: 1200px) {
          .game-interface-responsive {
            grid-template-columns: max-content 1fr;
            column-gap: 4px;
            padding: 2px;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Subscribe to game state changes to track phase transitions
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setGamePhase(gameState.gamePhase);
      setPlayers(gameState.players);
    });
    
    // Initialize with current state
    const currentState = stateService.getGameState();
    setGamePhase(currentState.gamePhase);
    setPlayers(currentState.players);
    
    return unsubscribe;
  }, [stateService]);

  // Handlers for negotiation modal
  const handleOpenNegotiationModal = () => {
    setIsNegotiationModalOpen(true);
  };

  const handleCloseNegotiationModal = () => {
    setIsNegotiationModalOpen(false);
  };

  // Handlers for rules modal
  const handleOpenRulesModal = () => {
    setIsRulesModalOpen(true);
  };

  const handleCloseRulesModal = () => {
    setIsRulesModalOpen(false);
  };

  // Handlers for card details modal
  const handleOpenCardDetailsModal = (cardId: string) => {
    setSelectedCardId(cardId);
    setIsCardDetailsModalOpen(true);
  };

  const handleCloseCardDetailsModal = () => {
    setIsCardDetailsModalOpen(false);
    setSelectedCardId('');
  };

  return (
    <div 
      className="game-interface-responsive"
      style={{
        gridTemplateRows: gamePhase === 'PLAY' ? 'auto 1fr auto' : '1fr auto'
      }}
    >
      {/* Top Panel - Project Progress (only in PLAY phase) */}
      {gamePhase === 'PLAY' && (
        <div style={{
          gridColumn: '1 / -1',
          gridRow: '1'
        }}>
          <ProjectProgress players={players} />
        </div>
      )}
      {/* Left Panel - Player Status */}
      <div 
        style={{
          gridColumn: '1',
          gridRow: gamePhase === 'PLAY' ? '2' : '1',
          background: '#f5f5f5',
          border: '2px solid #ddd',
          borderRadius: '8px',
          padding: gamePhase === 'PLAY' ? '0' : '15px',
          overflow: 'visible'
        }}
      >
        {gamePhase === 'PLAY' ? (
          <PlayerStatusPanel 
            onOpenNegotiationModal={handleOpenNegotiationModal}
            onOpenRulesModal={handleOpenRulesModal}
            onOpenCardDetailsModal={handleOpenCardDetailsModal}
          />
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
          gridRow: gamePhase === 'PLAY' ? '2' : '1',
          background: '#fff',
          border: '3px solid #4285f4',
          borderRadius: '8px',
          padding: '0',
          overflow: 'hidden',
          maxWidth: '100%',
          boxSizing: 'border-box'
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

      {/* Bottom Panel - Additional UI Elements */}
      <div 
        style={{
          gridColumn: '1 / -1',
          gridRow: gamePhase === 'PLAY' ? '3' : '2',
          background: '#f8f9fa',
          border: '2px solid #e9ecef',
          borderRadius: '8px',
          padding: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6c757d',
          minHeight: '80px'
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
      
      {/* EndGameModal - always rendered, visibility controlled by state */}
      <EndGameModal />
      
      {/* NegotiationModal - always rendered, visibility controlled by state */}
      <NegotiationModal 
        isOpen={isNegotiationModalOpen} 
        onClose={handleCloseNegotiationModal} 
      />
      
      {/* RulesModal - always rendered, visibility controlled by state */}
      <RulesModal 
        isOpen={isRulesModalOpen} 
        onClose={handleCloseRulesModal} 
      />
      
      {/* CardDetailsModal - always rendered, visibility controlled by state */}
      <CardDetailsModal 
        isOpen={isCardDetailsModalOpen}
        onClose={handleCloseCardDetailsModal}
        cardId={selectedCardId}
      />
    </div>
  );
}