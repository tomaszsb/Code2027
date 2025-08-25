import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../context/GameContext';
import { Player } from '../../types/DataTypes';

interface PathNode {
  spaceName: string;
  isCurrentPosition: boolean;
  isValidDestination: boolean;
  isDiceDestination: boolean;
  diceRolls?: number[];
  distance: number;
}

interface MovementPathVisualizationProps {
  isVisible: boolean;
  onToggle: () => void;
}

/**
 * MovementPathVisualization shows possible movement paths for the current player
 * Displays valid destinations, dice outcomes, and path connections
 */
export function MovementPathVisualization({ 
  isVisible, 
  onToggle 
}: MovementPathVisualizationProps): JSX.Element {
  const { movementService, stateService, dataService } = useGameContext();
  const [pathNodes, setPathNodes] = useState<PathNode[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      const player = gameState.currentPlayer;
      setCurrentPlayer(player);
      
      if (player && isVisible) {
        calculatePathNodes(player);
      }
    });
    
    // Initialize with current state
    const gameState = stateService.getGameState();
    const player = gameState.currentPlayer;
    setCurrentPlayer(player);
    
    if (player && isVisible) {
      calculatePathNodes(player);
    }
    
    return unsubscribe;
  }, [stateService, isVisible]);

  const calculatePathNodes = (player: Player) => {
    try {
      const validMoves = movementService.getValidMoves(player.id);
      const movement = dataService.getMovement(player.currentSpace, player.visitType);
      
      const nodes: PathNode[] = [];
      
      // Add current position
      nodes.push({
        spaceName: player.currentSpace,
        isCurrentPosition: true,
        isValidDestination: false,
        isDiceDestination: false,
        distance: 0
      });
      
      // Add valid destinations
      validMoves.forEach(destination => {
        const isDice = movement?.movement_type === 'dice';
        let diceRolls: number[] | undefined;
        
        if (isDice) {
          // Find which dice rolls lead to this destination
          diceRolls = [];
          for (let roll = 2; roll <= 12; roll++) {
            const rollDest = movementService.getDiceDestination(
              player.currentSpace, 
              player.visitType, 
              roll
            );
            if (rollDest === destination) {
              diceRolls.push(roll);
            }
          }
        }
        
        nodes.push({
          spaceName: destination,
          isCurrentPosition: false,
          isValidDestination: true,
          isDiceDestination: isDice,
          diceRolls,
          distance: 1
        });
      });
      
      setPathNodes(nodes);
    } catch (error) {
      console.error('Error calculating path nodes:', error);
      setPathNodes([]);
    }
  };

  const handleNodeClick = (spaceName: string) => {
    setSelectedNode(selectedNode === spaceName ? null : spaceName);
  };

  const getMovementTypeIcon = (): string => {
    if (!currentPlayer) return '🎯';
    
    const movement = dataService.getMovement(currentPlayer.currentSpace, currentPlayer.visitType);
    switch (movement?.movement_type) {
      case 'choice': return '🎯';
      case 'dice': return '🎲';
      case 'fixed': return '➡️';
      case 'none': return '🏁';
      default: return '🤔';
    }
  };

  const getMovementTypeDescription = (): string => {
    if (!currentPlayer) return 'No player selected';
    
    const movement = dataService.getMovement(currentPlayer.currentSpace, currentPlayer.visitType);
    switch (movement?.movement_type) {
      case 'choice': return 'Choose your destination';
      case 'dice': return 'Roll dice to determine destination';
      case 'fixed': return 'Fixed path forward';
      case 'none': return 'End of path';
      default: return 'Unknown movement type';
    }
  };

  const formatDiceRolls = (rolls: number[]): string => {
    if (!rolls || rolls.length === 0) return '';
    if (rolls.length === 1) return `Roll ${rolls[0]}`;
    if (rolls.length === 2) return `Rolls ${rolls[0]}, ${rolls[1]}`;
    return `Rolls ${rolls.slice(0, -1).join(', ')} or ${rolls[rolls.length - 1]}`;
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '350px',
    maxHeight: '70vh',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    zIndex: 900,
    transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease-in-out',
    overflow: 'hidden',
    border: '2px solid #e1e5e9'
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #e1e5e9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const bodyStyle: React.CSSProperties = {
    padding: '16px 20px',
    maxHeight: '50vh',
    overflowY: 'auto'
  };

  const toggleButtonStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: isVisible ? '380px' : '20px',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    cursor: 'pointer',
    fontSize: '20px',
    boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
    transition: 'all 0.3s ease-in-out',
    zIndex: 899
  };

  const nodeStyle = (node: PathNode): React.CSSProperties => ({
    padding: '12px 16px',
    margin: '8px 0',
    borderRadius: '8px',
    border: `2px solid ${node.isCurrentPosition ? '#28a745' : node.isValidDestination ? '#007bff' : '#6c757d'}`,
    backgroundColor: node.isCurrentPosition ? '#d4edda' : 
                    selectedNode === node.spaceName ? '#e3f2fd' : 
                    node.isValidDestination ? '#f8f9fa' : '#f5f5f5',
    cursor: node.isValidDestination ? 'pointer' : 'default',
    transition: 'all 0.2s ease'
  });

  return (
    <>
      {/* Toggle Button */}
      <button
        style={toggleButtonStyle}
        onClick={onToggle}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        title="Toggle Movement Paths"
      >
        🧭
      </button>

      {/* Path Visualization Panel */}
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#2c3e50'
          }}>
            Movement Paths
          </h3>
          <button
            onClick={onToggle}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6c757d'
            }}
          >
            ✕
          </button>
        </div>

        <div style={bodyStyle}>
          {currentPlayer ? (
            <>
              {/* Movement Type Info */}
              <div style={{
                padding: '12px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '2px solid #2196f3'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '8px' 
                }}>
                  <span style={{ fontSize: '24px', marginRight: '8px' }}>
                    {getMovementTypeIcon()}
                  </span>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: '#1976d2' 
                  }}>
                    {currentPlayer.name}'s Turn
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#1976d2'
                }}>
                  {getMovementTypeDescription()}
                </p>
              </div>

              {/* Path Nodes */}
              <div>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  marginBottom: '12px' 
                }}>
                  Available Paths:
                </h4>
                
                {pathNodes.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#6c757d',
                    padding: '20px',
                    fontStyle: 'italic'
                  }}>
                    No movement options available
                  </div>
                ) : (
                  pathNodes.map(node => (
                    <div
                      key={node.spaceName}
                      style={nodeStyle(node)}
                      onClick={() => node.isValidDestination && handleNodeClick(node.spaceName)}
                      onMouseEnter={(e) => {
                        if (node.isValidDestination) {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (node.isValidDestination) {
                          e.currentTarget.style.transform = 'translateX(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 'bold',
                            color: node.isCurrentPosition ? '#28a745' : 
                                  node.isValidDestination ? '#007bff' : '#6c757d',
                            marginBottom: '4px'
                          }}>
                            {node.spaceName}
                          </div>
                          
                          {node.isCurrentPosition && (
                            <div style={{
                              fontSize: '12px',
                              color: '#28a745',
                              fontWeight: 'bold'
                            }}>
                              📍 Current Position
                            </div>
                          )}
                          
                          {node.isDiceDestination && node.diceRolls && (
                            <div style={{
                              fontSize: '12px',
                              color: '#fd7e14',
                              fontStyle: 'italic'
                            }}>
                              🎲 {formatDiceRolls(node.diceRolls)}
                            </div>
                          )}
                        </div>

                        {node.isValidDestination && (
                          <div style={{
                            fontSize: '18px',
                            color: '#28a745'
                          }}>
                            ➡️
                          </div>
                        )}
                      </div>

                      {selectedNode === node.spaceName && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: 'white',
                          borderRadius: '4px',
                          border: '1px solid #dee2e6',
                          fontSize: '12px',
                          color: '#6c757d'
                        }}>
                          Space Details: {node.spaceName}
                          {node.isDiceDestination && (
                            <div>Movement: Dice-based destination</div>
                          )}
                          {!node.isDiceDestination && node.isValidDestination && (
                            <div>Movement: Direct choice</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#6c757d',
              padding: '40px 20px'
            }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>
                🎮
              </span>
              <p>No active player</p>
              <p style={{ fontSize: '14px', margin: 0 }}>
                Start a game to see movement paths
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}