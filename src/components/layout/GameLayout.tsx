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
import { MovementPathVisualization } from '../game/MovementPathVisualization';
import { SpaceExplorerPanel } from '../game/SpaceExplorerPanel';
import { GameLog } from '../game/GameLog';
import { useGameContext } from '../../context/GameContext';
import { GamePhase, Player } from '../../types/StateTypes';
import { Card } from '../../types/DataTypes';

/**
 * GameLayout component replicates the high-level structure of the legacy FixedApp.js
 * This provides the main grid-based layout for the game application.
 */
export function GameLayout(): JSX.Element {
  const { stateService, dataService, cardService, turnService } = useGameContext();
  const [gamePhase, setGamePhase] = useState<GamePhase>('SETUP');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isCardDetailsModalOpen, setIsCardDetailsModalOpen] = useState<boolean>(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isMovementPathVisible, setIsMovementPathVisible] = useState<boolean>(false);
  const [isSpaceExplorerVisible, setIsSpaceExplorerVisible] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // State tracking for TurnControlsWithActions component
  const [isProcessingTurn, setIsProcessingTurn] = useState<boolean>(false);
  const [hasPlayerMovedThisTurn, setHasPlayerMovedThisTurn] = useState<boolean>(false);
  const [hasPlayerRolledDice, setHasPlayerRolledDice] = useState<boolean>(false);
  const [hasCompletedManualActions, setHasCompletedManualActions] = useState<boolean>(false);
  const [awaitingChoice, setAwaitingChoice] = useState<boolean>(false);
  const [actionCounts, setActionCounts] = useState<{ required: number; completed: number }>({ required: 0, completed: 0 });
  const [completedActions, setCompletedActions] = useState<{
    diceRoll?: string;
    manualActions: { [effectType: string]: string };
  }>({ manualActions: {} });
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

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

  // Subscribe to game state changes to track phase transitions and turn controls state
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setGamePhase(gameState.gamePhase);
      setPlayers(gameState.players);
      setCurrentPlayerId(gameState.currentPlayerId);
      // Track active modal state
      setActiveModal(gameState.activeModal?.type || null);
      
      // Track turn control state for TurnControlsWithActions
      setHasPlayerMovedThisTurn(gameState.hasPlayerMovedThisTurn || false);
      setHasPlayerRolledDice(gameState.hasPlayerRolledDice || false);
      setHasCompletedManualActions(gameState.hasCompletedManualActions || false);
      setAwaitingChoice(gameState.awaitingChoice !== null);
      
      // Update action counts from game state
      setActionCounts({
        required: gameState.requiredActions || 1,
        completed: gameState.completedActions || 0
      });
    });
    
    // Initialize with current state
    const currentState = stateService.getGameState();
    setGamePhase(currentState.gamePhase);
    setPlayers(currentState.players);
    setCurrentPlayerId(currentState.currentPlayerId);
    setActiveModal(currentState.activeModal?.type || null);
    
    // Initialize turn control state
    setHasPlayerMovedThisTurn(currentState.hasPlayerMovedThisTurn || false);
    setHasPlayerRolledDice(currentState.hasPlayerRolledDice || false);
    setHasCompletedManualActions(currentState.hasCompletedManualActions || false);
    setAwaitingChoice(currentState.awaitingChoice !== null);
    setActionCounts({
      required: currentState.requiredActions || 1,
      completed: currentState.completedActions || 0
    });
    
    return unsubscribe;
  }, [stateService]);

  // Handlers for negotiation modal
  const handleOpenNegotiationModal = () => {
    // Close any open side panels when modal opens
    setIsMovementPathVisible(false);
    setIsSpaceExplorerVisible(false);
    setIsNegotiationModalOpen(true);
  };

  const handleCloseNegotiationModal = () => {
    setIsNegotiationModalOpen(false);
  };

  // Handlers for rules modal
  const handleOpenRulesModal = () => {
    // Close any open side panels when modal opens
    setIsMovementPathVisible(false);
    setIsSpaceExplorerVisible(false);
    setIsRulesModalOpen(true);
  };

  const handleCloseRulesModal = () => {
    setIsRulesModalOpen(false);
  };

  // Handlers for card details modal
  const handleOpenCardDetailsModal = (cardId: string) => {
    // Close any open side panels when modal opens
    setIsMovementPathVisible(false);
    setIsSpaceExplorerVisible(false);
    
    // Fetch card data before opening modal
    const card = dataService.getCardById(cardId);
    setSelectedCard(card || null);
    setIsCardDetailsModalOpen(true);
  };

  const handleCloseCardDetailsModal = () => {
    setIsCardDetailsModalOpen(false);
    setSelectedCard(null);
  };

  // Handlers for movement path visualization
  const handleToggleMovementPath = () => {
    setIsMovementPathVisible(!isMovementPathVisible);
  };

  // Handlers for space explorer panel
  const handleToggleSpaceExplorer = () => {
    setIsSpaceExplorerVisible(!isSpaceExplorerVisible);
  };

  // Action handlers for TurnControlsWithActions component
  const handleRollDice = async () => {
    if (!currentPlayerId) return;
    setIsProcessingTurn(true);
    try {
      const result = await turnService.rollDiceWithFeedback(currentPlayerId);
      // Create completion message for immediate UI feedback
      let unifiedDescription = `Rolled ${result.diceValue}`;
      const outcomes: string[] = [];
      
      result.effects?.forEach(effect => {
        switch (effect.type) {
          case 'cards':
            outcomes.push(`Drew ${effect.cardCount} ${effect.cardType} card${effect.cardCount !== 1 ? 's' : ''}`);
            break;
          case 'money':
            if (effect.value !== undefined) {
              const moneyOutcome = effect.value > 0 
                ? `Gained $${Math.abs(effect.value)}`
                : `Spent $${Math.abs(effect.value)}`;
              outcomes.push(moneyOutcome);
            }
            break;
          case 'time':
            if (effect.value !== undefined) {
              const timeOutcome = effect.value > 0 
                ? `Time Penalty: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`
                : `Time Saved: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`;
              outcomes.push(timeOutcome);
            }
            break;
        }
      });
      
      if (outcomes.length > 0) {
        unifiedDescription += ` → ${outcomes.join(', ')}`;
      }
      
      // Store completion message for immediate UI feedback
      setCompletedActions(prev => ({
        ...prev,
        diceRoll: unifiedDescription
      }));
    } catch (error) {
      console.error("Error rolling dice:", error);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleEndTurn = async () => {
    if (!currentPlayerId) return;
    setIsProcessingTurn(true);
    try {
      await turnService.endTurnWithMovement();
      // Reset completed actions for next turn
      setCompletedActions({ manualActions: {} });
    } catch (error) {
      console.error("Error ending turn:", error);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleManualEffect = async (effectType: string) => {
    if (!currentPlayerId) return;
    setIsProcessingTurn(true);
    try {
      const result = await turnService.triggerManualEffectWithFeedback(currentPlayerId, effectType);
      // Create completion message for immediate UI feedback
      const outcomes: string[] = [];
      
      result.effects?.forEach(effect => {
        switch (effect.type) {
          case 'cards':
            outcomes.push(`Drew ${effect.cardCount} ${effect.cardType} card${effect.cardCount !== 1 ? 's' : ''}`);
            break;
          case 'money':
            if (effect.value !== undefined) {
              const moneyOutcome = effect.value > 0 
                ? `Gained $${Math.abs(effect.value)}`
                : `Spent $${Math.abs(effect.value)}`;
              outcomes.push(moneyOutcome);
            }
            break;
          case 'time':
            if (effect.value !== undefined) {
              const timeOutcome = effect.value > 0 
                ? `Time Penalty: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`
                : `Time Saved: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`;
              outcomes.push(timeOutcome);
            }
            break;
        }
      });
      
      const actionDescription = `Manual Action: ${outcomes.join(', ') || 'Action completed'}`;
      
      // Store completion message for immediate UI feedback
      setCompletedActions(prev => ({
        ...prev,
        manualActions: {
          ...prev.manualActions,
          [effectType]: actionDescription
        }
      }));
    } catch (error) {
      console.error("Error triggering manual effect:", error);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleNegotiate = async () => {
    if (!currentPlayerId) return;
    setIsProcessingTurn(true);
    try {
      const result = await turnService.performNegotiation(currentPlayerId);
      setFeedbackMessage(result.message);
      // Clear feedback after 4 seconds
      setTimeout(() => {
        setFeedbackMessage('');
      }, 4000);
    } catch (error) {
      console.error("Error during negotiation:", error);
      setFeedbackMessage(`Negotiation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => {
        setFeedbackMessage('');
      }, 4000);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleStartGame = () => {
    try {
      const gameState = stateService.getGameState();
      if (gameState.players.length === 0) {
        stateService.addPlayer('Test Player');
      }
      stateService.startGame();
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  // Helper function to check if any modal is open
  const isAnyModalOpen = () => {
    return isRulesModalOpen || 
           isNegotiationModalOpen || 
           isCardDetailsModalOpen || 
           activeModal !== null;
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
          <ProjectProgress 
            players={players} 
            currentPlayerId={currentPlayerId}
            dataService={dataService}
          />
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
            onToggleSpaceExplorer={handleToggleSpaceExplorer}
            onToggleMovementPath={handleToggleMovementPath}
            isSpaceExplorerVisible={isSpaceExplorerVisible}
            isMovementPathVisible={isMovementPathVisible}
            // Player data
            players={players}
            currentPlayerId={currentPlayerId}
            // TurnControlsWithActions props
            currentPlayer={players.find(p => p.id === currentPlayerId) || null}
            gamePhase={gamePhase}
            isProcessingTurn={isProcessingTurn}
            hasPlayerMovedThisTurn={hasPlayerMovedThisTurn}
            hasPlayerRolledDice={hasPlayerRolledDice}
            hasCompletedManualActions={hasCompletedManualActions}
            awaitingChoice={awaitingChoice}
            actionCounts={actionCounts}
            completedActions={completedActions}
            feedbackMessage={feedbackMessage}
            onRollDice={handleRollDice}
            onEndTurn={handleEndTurn}
            onManualEffect={handleManualEffect}
            onNegotiate={handleNegotiate}
            onStartGame={handleStartGame}
            // Legacy props for compatibility
            playerId={currentPlayerId || ''}
            playerName={players.find(p => p.id === currentPlayerId)?.name || ''}
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
        <GameLog />
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
        card={selectedCard}
        currentPlayer={players.find(p => p.id === currentPlayerId) || null}
        otherPlayers={players.filter(p => p.id !== currentPlayerId)}
        cardService={cardService}
      />
      
      {/* MovementPathVisualization - only during PLAY phase and no modals open */}
      {gamePhase === 'PLAY' && !isAnyModalOpen() && (
        <MovementPathVisualization 
          isVisible={isMovementPathVisible}
          onToggle={handleToggleMovementPath}
        />
      )}
      
      {/* SpaceExplorerPanel - only during PLAY phase and no modals open */}
      {gamePhase === 'PLAY' && !isAnyModalOpen() && (
        <SpaceExplorerPanel 
          isVisible={isSpaceExplorerVisible}
          onToggle={handleToggleSpaceExplorer}
        />
      )}
    </div>
  );
}