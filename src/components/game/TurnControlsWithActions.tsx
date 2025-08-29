// src/components/game/TurnControlsWithActions.tsx

import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../context/GameContext';
// Modal imports removed - using persistent GameLog instead
import { Player } from '../../types/DataTypes';
import { GamePhase, ActionLogEntry } from '../../types/StateTypes';
import { formatActionDescription } from '../../utils/actionLogFormatting';

interface TurnControlsWithActionsProps {
  onOpenNegotiationModal: () => void;
  playerId: string;
  playerName: string;
}

/**
 * Merged Turn Controls and Action Log - buttons are replaced by action entries when completed
 */
export function TurnControlsWithActions({ onOpenNegotiationModal, playerId, playerName }: TurnControlsWithActionsProps): JSX.Element {
  const { stateService, turnService, playerActionService, dataService } = useGameContext();
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('SETUP');
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  // Removed humanPlayerId - all players can now take actions when it's their turn
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [hasPlayerMovedThisTurn, setHasPlayerMovedThisTurn] = useState(false);
  const [hasPlayerRolledDice, setHasPlayerRolledDice] = useState(false);
  const [hasCompletedManualActions, setHasCompletedManualActions] = useState(false);
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  const [actionCounts, setActionCounts] = useState({ required: 0, completed: 0 });
  // Local completion messages for current turn only (resets each turn)
  const [completedActions, setCompletedActions] = useState<{
    diceRoll?: string;
    manualActions: { [effectType: string]: string };
  }>({
    manualActions: {}
  });

  // TODO: Remove these when space effects logging is moved to services
  const [lastTurnPlayerId, setLastTurnPlayerId] = useState<string | null>(null);
  const [lastPlayerSpace, setLastPlayerSpace] = useState<string | null>(null);
  const [spaceEffectsLogged, setSpaceEffectsLogged] = useState<Set<string>>(new Set());

  // Subscribe to state changes for live updates
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setGamePhase(gameState.gamePhase);
      setHasPlayerMovedThisTurn(gameState.hasPlayerMovedThisTurn || false);
      setHasPlayerRolledDice(gameState.hasPlayerRolledDice || false);
      setHasCompletedManualActions(gameState.hasCompletedManualActions || false);
      setAwaitingChoice(gameState.awaitingChoice !== null);
      
      // Update action counts from game state
      setActionCounts({
        required: gameState.requiredActions || 1,
        completed: gameState.completedActions || 0
      });
      
      // All players are human players - no AI restrictions
      // Remove the single "human player" concept to enable controls for all players
      
      if (gameState.currentPlayerId) {
        const player = gameState.players.find(p => p.id === gameState.currentPlayerId);
        setCurrentPlayer(player || null);
        
        // Reset completed actions when turn changes to different player
        if (gameState.currentPlayerId !== lastTurnPlayerId && gameState.currentPlayerId) {
          // Only reset if it's actually a different player (not null → player transition)
          if (lastTurnPlayerId !== null && gameState.currentPlayerId !== lastTurnPlayerId) {
            setCompletedActions({ manualActions: {} });
          }
          setLastTurnPlayerId(gameState.currentPlayerId);
        }
      } else {
        setCurrentPlayer(null);
      }
    });
    
    // Initialize with current state
    const gameState = stateService.getGameState();
    setGamePhase(gameState.gamePhase);
    setHasPlayerMovedThisTurn(gameState.hasPlayerMovedThisTurn || false);
    setHasPlayerRolledDice(gameState.hasPlayerRolledDice || false);
    setAwaitingChoice(gameState.awaitingChoice !== null);
    
    // Initialize action counts
    setActionCounts({
      required: gameState.requiredActions || 1,
      completed: gameState.completedActions || 0
    });

    // Initialize turn tracking
    setLastTurnPlayerId(gameState.currentPlayerId);
    
    // All players are human players - no single player restriction
    
    if (gameState.currentPlayerId) {
      const player = gameState.players.find(p => p.id === gameState.currentPlayerId);
      setCurrentPlayer(player || null);
    }
    
    return unsubscribe;
  }, [stateService]);

  // Clear log when turn changes (copied from TurnActionLog)
  useEffect(() => {
    const gameState = stateService.getGameState();
    const currentPlayerId = gameState.players[gameState.currentPlayerIndex]?.id;
    
    if (currentPlayerId && currentPlayerId !== lastTurnPlayerId) {
      setActionLog([]);
      setLastTurnPlayerId(currentPlayerId);
      setSpaceEffectsLogged(new Set());
      setLastPlayerSpace(null);
    }
  }, [stateService, lastTurnPlayerId]);

  // All action logging now goes through the global StateService

  // Load space effects immediately when player enters a space
  useEffect(() => {
    // Helper function to log space effects for a player
    const logSpaceEffectsForPlayer = (player: any) => {
      if (!player) return;

      const spaceKey = `${player.currentSpace}_${player.visitType}`;
      
      // Only log if we haven't already logged effects for this space+visitType combo
      if (!spaceEffectsLogged.has(spaceKey)) {
        const spaceEffects = dataService.getSpaceEffects(player.currentSpace, player.visitType);
        
        spaceEffects.forEach(effect => {
          if (effect.trigger_type === 'auto' || !effect.trigger_type) {
            const description = effect.description || `${effect.effect_action} ${effect.effect_value}`;
            // Use specific type for time effects to distinguish them from other space effects
            const actionType = effect.effect_type === 'time' ? 'time_effect' : 'space_effect';
            // Space effect logging now handled by game services
            // TODO: Remove this entire useEffect - space effects should be logged by services, not UI
          }
        });
        
        // Mark this space as having logged effects
        setSpaceEffectsLogged(prev => new Set([...prev, spaceKey]));
        setLastPlayerSpace(player.currentSpace);
      }
    };

    // Log space effects for current position immediately on component mount/update
    const gameState = stateService.getGameState();
    const currentPlayerOnMount = gameState.players.find(p => p.id === playerId);
    if (currentPlayerOnMount) {
      logSpaceEffectsForPlayer(currentPlayerOnMount);
    }

    // Subscribe to state changes for future space changes
    const unsubscribe = stateService.subscribe((gameState) => {
      const currentPlayer = gameState.players.find(p => p.id === playerId);
      if (!currentPlayer) return;

      // Only log space effects if player has moved to a new space
      if (currentPlayer.currentSpace !== lastPlayerSpace) {
        logSpaceEffectsForPlayer(currentPlayer);
      }
    });

    return unsubscribe;
  }, [stateService, dataService, playerId, lastPlayerSpace, spaceEffectsLogged]);

  // TurnControls handlers (copied from TurnControls)
  const handleRollDice = async () => {
    if (!currentPlayer || isProcessingTurn) return;

    try {
      setIsProcessingTurn(true);
      console.log(`Rolling dice for player: ${currentPlayer.name}`);
      
      // Use rollDiceWithFeedback and log to global action history
      const result = await turnService.rollDiceWithFeedback(currentPlayer.id);
      setLastRoll(result.diceValue);
      
      console.log(`Dice rolled! ${currentPlayer.name} rolled a ${result.diceValue}`);
      console.log('Effects:', result.effects);
      
      // Create unified log entry directly (no modal needed)
      let unifiedDescription = `Rolled ${result.diceValue}`;
      const outcomes: string[] = [];
      
      result.effects?.forEach(effect => {
        switch (effect.type) {
          case 'cards':
            const cardOutcome = `Drew ${effect.cardCount} ${effect.cardType} card${effect.cardCount !== 1 ? 's' : ''}`;
            outcomes.push(cardOutcome);
            break;
            
          case 'money':
            const moneyOutcome = effect.value > 0 
              ? `Gained $${Math.abs(effect.value)}`
              : `Spent $${Math.abs(effect.value)}`;
            outcomes.push(moneyOutcome);
            break;
            
          case 'time':
            const timeOutcome = effect.value > 0 
              ? `Time Penalty: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`
              : `Time Saved: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`;
            outcomes.push(timeOutcome);
            break;
        }
      });
      
      if (outcomes.length > 0) {
        unifiedDescription += ` → ${outcomes.join(', ')}`;
      }
      
      // Log directly to global action history
      stateService.logToActionHistory({
        type: 'dice_roll',
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        description: unifiedDescription,
        details: {
          diceValue: result.diceValue,
          diceResult: outcomes.join(', '),
          space: currentPlayer.currentSpace,
          effects: result.effects
        }
      });

      // Store completion message locally for immediate UI feedback
      setCompletedActions(prev => ({
        ...prev,
        diceRoll: unifiedDescription
      }));
    } catch (error) {
      console.error('Error rolling dice:', error);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleCloseDiceResultModal = () => {
    setShowDiceResultModal(false);
    setDiceResult(null);
  };

  const handleCloseManualActionModal = () => {
    setShowManualActionModal(false);
    setManualActionResult(null);
  };

  const handleDiceResultConfirm = () => {
    // Create a single, unified log entry for the dice roll and all its outcomes
    if (diceResult && currentPlayer) {
      // Start with the dice roll
      let unifiedDescription = `Rolled ${diceResult.diceValue}`;
      
      // Collect all outcomes into a single description
      const outcomes: string[] = [];
      
      diceResult.effects?.forEach(effect => {
        switch (effect.type) {
          case 'cards':
            const cardOutcome = `Drew ${effect.cardCount} ${effect.cardType} card${effect.cardCount !== 1 ? 's' : ''}`;
            outcomes.push(cardOutcome);
            break;
            
          case 'money':
            const moneyOutcome = effect.value > 0 
              ? `Gained $${Math.abs(effect.value)}`
              : `Spent $${Math.abs(effect.value)}`;
            outcomes.push(moneyOutcome);
            break;
            
          case 'time':
            const timeOutcome = effect.value > 0 
              ? `Time Penalty: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`
              : `Time Saved: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`;
            outcomes.push(timeOutcome);
            break;
            
          default:
            if (effect.description) {
              outcomes.push(effect.description);
            }
            break;
        }
      });
      
      // Combine dice roll with outcomes
      if (outcomes.length > 0) {
        unifiedDescription += ` → ${outcomes.join(', ')}`;
      }
      
      // Add single unified log entry to global log
      stateService.logToActionHistory({
        type: 'dice_roll',
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        description: unifiedDescription,
        details: {
          diceValue: diceResult.diceValue,
          diceResult: outcomes.join(', '),
          space: currentPlayer.currentSpace,
          effects: diceResult.effects
        }
      });
    }
    
    handleCloseDiceResultModal();
    // Additional logic if needed for choices would go here
  };

  const handleManualActionConfirm = () => {
    // Create a log entry for the manual action with the correct type
    if (manualActionResult && currentPlayer) {
      // Collect all outcomes into a single description
      const outcomes: string[] = [];
      
      manualActionResult.effects?.forEach(effect => {
        switch (effect.type) {
          case 'cards':
            const cardOutcome = `Drew ${effect.cardCount} ${effect.cardType} card${effect.cardCount !== 1 ? 's' : ''}`;
            outcomes.push(cardOutcome);
            break;
            
          case 'money':
            const moneyOutcome = effect.value > 0 
              ? `Gained $${Math.abs(effect.value)}`
              : `Spent $${Math.abs(effect.value)}`;
            outcomes.push(moneyOutcome);
            break;
            
          case 'time':
            const timeOutcome = effect.value > 0 
              ? `Time Penalty: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`
              : `Time Saved: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`;
            outcomes.push(timeOutcome);
            break;
        }
      });
      
      // Create description based on the primary effect type
      let actionDescription = '';
      let logType: ActionLogEntry['type'] = 'manual_action';
      
      if (manualActionResult.effects?.some(effect => effect.type === 'cards')) {
        actionDescription = `Manual Action: ${outcomes.join(', ')}`;
        logType = 'card_draw';
      } else if (manualActionResult.effects?.some(effect => effect.type === 'money')) {
        actionDescription = `Manual Action: ${outcomes.join(', ')}`;
        logType = 'resource_change';
      } else if (manualActionResult.effects?.some(effect => effect.type === 'time')) {
        actionDescription = `Manual Action: ${outcomes.join(', ')}`;
        logType = 'time_effect';
      } else {
        actionDescription = `Manual Action: ${outcomes.join(', ') || 'Action completed'}`;
      }

      stateService.logToActionHistory({
        type: logType,
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        description: actionDescription,
        details: {
          space: currentPlayer.currentSpace,
          effects: manualActionResult.effects
        }
      });
    }
    
    handleCloseManualActionModal();
  };

  const handleEndTurn = async () => {
    if (!currentPlayer || isProcessingTurn) return;

    try {
      setIsProcessingTurn(true);
      console.log(`Ending turn for player: ${currentPlayer.name}`);
      
      // Use endTurnWithMovement to handle movement and advance to next player
      await turnService.endTurnWithMovement();
      console.log(`Turn ended for ${currentPlayer.name}`);
    } catch (error) {
      console.error('Error ending turn:', error);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleNegotiate = async () => {
    if (!currentPlayer || isProcessingTurn) return;
    
    // Get space content to check if negotiation is allowed on this space
    const spaceContent = dataService.getSpaceContent(currentPlayer.currentSpace, currentPlayer.visitType);
    console.log('🤝 Negotiate Debug:', { 
      currentSpace: currentPlayer.currentSpace, 
      visitType: currentPlayer.visitType, 
      spaceContent,
      canNegotiate: spaceContent?.can_negotiate 
    });
    
    if (spaceContent && spaceContent.can_negotiate === true) {
      // Space-specific negotiation using TurnService method
      console.log(`Negotiation available on ${currentPlayer.currentSpace}`);
      
      try {
        setIsProcessingTurn(true);
        const result = await turnService.performNegotiation(currentPlayer.id);
        
        // Show result to user
        alert(result.message);
        
        if (result.success) {
          setFeedbackMessage('Negotiation successful! State restored.');
        } else {
          setFeedbackMessage('Negotiation failed. Time penalty applied.');
        }
        
        // Clear feedback after 4 seconds
        setTimeout(() => {
          setFeedbackMessage('');
        }, 4000);
        
      } catch (error) {
        console.error('Error during negotiation:', error);
        alert(`Negotiation failed: ${error.message}`);
      } finally {
        setIsProcessingTurn(false);
      }
    } else {
      console.log('Negotiation not available on this space');
      alert('Negotiation not available on this space.');
    }
  };

  const handleManualEffect = async (effectType: string) => {
    if (!currentPlayer || isProcessingTurn) return;

    try {
      setIsProcessingTurn(true);
      console.log(`Triggering manual ${effectType} effect for player: ${currentPlayer.name}`);
      
      // Use triggerManualEffectWithFeedback and log directly
      const result = await turnService.triggerManualEffectWithFeedback(currentPlayer.id, effectType);
      console.log(`Manual ${effectType} effect completed! Effects:`, result.effects);
      
      // Create log entry directly (no modal needed)
      const outcomes: string[] = [];
      
      result.effects?.forEach(effect => {
        switch (effect.type) {
          case 'cards':
            const cardOutcome = `Drew ${effect.cardCount} ${effect.cardType} card${effect.cardCount !== 1 ? 's' : ''}`;
            outcomes.push(cardOutcome);
            break;
            
          case 'money':
            const moneyOutcome = effect.value > 0 
              ? `Gained $${Math.abs(effect.value)}`
              : `Spent $${Math.abs(effect.value)}`;
            outcomes.push(moneyOutcome);
            break;
            
          case 'time':
            const timeOutcome = effect.value > 0 
              ? `Time Penalty: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`
              : `Time Saved: ${Math.abs(effect.value)} day${Math.abs(effect.value) !== 1 ? 's' : ''}`;
            outcomes.push(timeOutcome);
            break;
        }
      });
      
      // Create description based on the primary effect type
      let actionDescription = '';
      let logType: ActionLogEntry['type'] = 'manual_action';
      
      if (result.effects?.some(effect => effect.type === 'cards')) {
        actionDescription = `Manual Action: ${outcomes.join(', ')}`;
        logType = 'card_draw';
      } else if (result.effects?.some(effect => effect.type === 'money')) {
        actionDescription = `Manual Action: ${outcomes.join(', ')}`;
        logType = 'resource_change';
      } else if (result.effects?.some(effect => effect.type === 'time')) {
        actionDescription = `Manual Action: ${outcomes.join(', ')}`;
        logType = 'time_effect';
      } else {
        actionDescription = `Manual Action: ${outcomes.join(', ') || 'Action completed'}`;
      }

      // Log directly to global action history
      stateService.logToActionHistory({
        type: logType,
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        description: actionDescription,
        details: {
          space: currentPlayer.currentSpace,
          effects: result.effects
        }
      });

      // Store completion message locally for immediate UI feedback
      setCompletedActions(prev => ({
        ...prev,
        manualActions: {
          ...prev.manualActions,
          [effectType]: actionDescription
        }
      }));
      
    } catch (error) {
      console.error(`Error triggering manual ${effectType} effect:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  // Helper function to evaluate effect conditions
  const evaluateEffectCondition = (condition: string | undefined): boolean => {
    if (!condition || condition === 'always') return true;
    if (!currentPlayer) return false;

    const conditionLower = condition.toLowerCase();
    
    // Project scope conditions
    const projectScope = currentPlayer.projectScope || 0;
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

  // Check for available manual effects with condition evaluation
  const manualEffects = currentPlayer ? 
    dataService.getSpaceEffects(currentPlayer.currentSpace, currentPlayer.visitType)
      .filter(effect => effect.trigger_type === 'manual')
      .filter(effect => evaluateEffectCondition(effect.condition)) : [];

  // Check if negotiation is available on current space
  const canNegotiate = currentPlayer ? 
    dataService.getSpaceContent(currentPlayer.currentSpace, currentPlayer.visitType)?.can_negotiate === true : false;

  // All players can take actions when it's their turn
  const isCurrentPlayersTurn = currentPlayer != null;
  const canRollDice = gamePhase === 'PLAY' && isCurrentPlayersTurn && 
                     !isProcessingTurn && !hasPlayerRolledDice && !hasPlayerMovedThisTurn && !awaitingChoice;
  const canEndTurn = gamePhase === 'PLAY' && isCurrentPlayersTurn && 
                    !isProcessingTurn && hasPlayerRolledDice && actionCounts.completed >= actionCounts.required;

  // Get contextual dice roll button text based on current space
  const getDiceRollButtonText = (): string => {
    if (!currentPlayer) return "Roll Dice";

    // Get dice effects for current space to determine roll context
    const diceEffects = dataService.getDiceEffects(currentPlayer.currentSpace, currentPlayer.visitType);
    
    if (diceEffects.length === 0) return "Roll Dice";

    const firstEffect = diceEffects[0];
    
    switch (firstEffect.effect_type) {
      case 'cards':
        const cardType = firstEffect.card_type?.toUpperCase() || 'Cards';
        return `Roll for ${cardType} Cards`;
        
      case 'money':
        return firstEffect.card_type === 'fee' ? "Roll for Fee Amount" : "Roll for Money";
        
      case 'time':
        return "Roll for Time Penalty";
        
      case 'quality':
        return "Roll for Quality";
        
      default:
        // If diceEffects exist but don't match known types, default to generic text
        return "Roll Dice";
    }
  };

  // Format action description now handled by shared utility

  if (gamePhase !== 'PLAY') {
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

    return (
      <div style={{ padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px' }}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          🎯 Game setup... (Phase: {gamePhase})
        </div>
        <button onClick={handleStartGame} style={{ padding: '4px 8px', fontSize: '8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px', backgroundColor: '#fff', borderRadius: '6px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
          🎮 Turn Controls & Actions
        </div>
      </div>

      {/* Feedback Message Display */}
      {feedbackMessage && (
        <div style={{ padding: '6px 12px', backgroundColor: '#d1ecf1', border: '2px solid #17a2b8', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: '#0c5460', textAlign: 'center' }}>
          💡 {feedbackMessage}
        </div>
      )}

      {/* Combined Controls and Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #dee2e6' }}>
        
        {/* Roll Dice - show button if can roll, otherwise show completed action */}
        {canRollDice ? (
          <button
            onClick={handleRollDice}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor: '#28a745',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
          >
            <span>🎲</span>
            <span>{getDiceRollButtonText()}</span>
          </button>
        ) : hasPlayerRolledDice && completedActions.diceRoll ? (
          // Show local completion message with immediate feedback
          <div style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: '#e9ecef', borderRadius: '4px', color: '#6c757d' }}>
            ✅ {completedActions.diceRoll}
          </div>
        ) : hasPlayerRolledDice ? (
          // Fallback if no local message available
          <div style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: '#e9ecef', borderRadius: '4px', color: '#6c757d' }}>
            ✅ Dice rolled - check game log
          </div>
        ) : null}

        {/* Manual Effect Buttons - show if available, replace with actions when completed */}
        {isCurrentPlayersTurn && manualEffects.map((effect, index) => {
          const isCardEffect = effect.effect_type === 'cards';
          const cardType = isCardEffect ? effect.effect_action.replace('draw_', '').toUpperCase() : '';
          const count = effect.effect_value;
          const buttonText = isCardEffect ? `Pick up ${count} ${cardType} card${count !== 1 ? 's' : ''}` : 
                            `${effect.effect_type}: ${effect.effect_action} ${count}`;
          
          const isButtonDisabled = isProcessingTurn || hasCompletedManualActions;
          
          if (!isButtonDisabled) {
            // Show active button
            return (
              <button
                key={index}
                onClick={() => handleManualEffect(effect.effect_type)}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: '#17a2b8',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px'
                }}
              >
                <span>{isCardEffect ? '🃏' : '⚡'}</span>
                <span>{buttonText}</span>
              </button>
            );
          } else {
            // Check if we have a local completion message for this effect type
            const completionMessage = completedActions.manualActions[effect.effect_type];
            if (completionMessage) {
              return (
                <div key={`completed-${index}`} style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: '#e9ecef', borderRadius: '4px', color: '#6c757d' }}>
                  ✅ {completionMessage.replace('Manual Action: ', '')}
                </div>
              );
            } else {
              // Fallback if no local message available
              return (
                <div key={`completed-${index}`} style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: '#e9ecef', borderRadius: '4px', color: '#6c757d' }}>
                  ✅ Manual action completed - check game log
                </div>
              );
            }
          }
          return null;
        })}

        {/* Space and Time Effects are now shown in the GameLog component */}

        {/* Negotiate Button - show if negotiation is available on current space */}
        {isCurrentPlayersTurn && canNegotiate && (
          <button
            onClick={handleNegotiate}
            disabled={isProcessingTurn}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: !isProcessingTurn ? '#fff' : '#6c757d',
              backgroundColor: !isProcessingTurn ? '#ffc107' : '#e9ecef',
              border: 'none',
              borderRadius: '4px',
              cursor: !isProcessingTurn ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              transition: 'all 0.2s ease',
              transform: isProcessingTurn ? 'scale(0.95)' : 'scale(1)',
              opacity: isProcessingTurn ? 0.7 : 1,
            }}
          >
            <span>🤝</span>
            <span>Negotiate</span>
          </button>
        )}

        {/* End Turn - show button if can end turn, otherwise show message */}
        {canEndTurn ? (
          <button
            onClick={handleEndTurn}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor: '#28a745',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
          >
            <span>⏹️</span>
            <span>End Turn ({actionCounts.completed}/{actionCounts.required})</span>
          </button>
        ) : actionCounts.completed < actionCounts.required && isCurrentPlayersTurn ? (
          <div style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', color: '#856404', textAlign: 'center' }}>
            📋 Complete {actionCounts.required - actionCounts.completed} more action(s)
          </div>
        ) : null}
      </div>

      {/* Modals removed - using persistent GameLog instead */}
    </div>
  );
}