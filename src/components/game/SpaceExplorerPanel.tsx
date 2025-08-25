import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../context/GameContext';
import { Space, SpaceContent, SpaceEffect, DiceEffect, Player } from '../../types/DataTypes';
import { FormatUtils } from '../../utils/FormatUtils';

interface SpaceDetails {
  space: Space;
  content: SpaceContent | null;
  effects: SpaceEffect[];
  diceEffects: DiceEffect[];
  playersOnSpace: Player[];
  connections: string[];
}

interface SpaceExplorerPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

/**
 * SpaceExplorerPanel provides detailed information about spaces on the game board
 * Shows space content, effects, connections, and players
 */
export function SpaceExplorerPanel({ 
  isVisible, 
  onToggle 
}: SpaceExplorerPanelProps): JSX.Element {
  const { dataService, stateService, movementService } = useGameContext();
  const [allSpaces, setAllSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [spaceDetails, setSpaceDetails] = useState<SpaceDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'starting' | 'ending' | 'tutorial'>('all');
  const [players, setPlayers] = useState<Player[]>([]);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setPlayers(gameState.players);
    });
    
    // Initialize with current state
    setPlayers(stateService.getGameState().players);
    
    return unsubscribe;
  }, [stateService]);

  // Load spaces on mount
  useEffect(() => {
    const spaces = dataService.getAllSpaces();
    setAllSpaces(spaces);
    
    // Select current player's space by default if available
    const currentPlayer = stateService.getGameState().currentPlayer;
    if (currentPlayer && !selectedSpace) {
      setSelectedSpace(currentPlayer.currentSpace);
    }
  }, [dataService, stateService, selectedSpace]);

  // Update space details when selection changes
  useEffect(() => {
    if (selectedSpace) {
      loadSpaceDetails(selectedSpace);
    } else {
      setSpaceDetails(null);
    }
  }, [selectedSpace, players]);

  const loadSpaceDetails = (spaceName: string) => {
    const space = allSpaces.find(s => s.name === spaceName);
    if (!space) return;

    const content = dataService.getSpaceContentBySpace(spaceName);
    const effects = dataService.getSpaceEffectsBySpace(spaceName);
    const diceEffects = dataService.getDiceEffectsBySpace(spaceName);
    const playersOnSpace = players.filter(p => p.currentSpace === spaceName);

    // Get connections from movement data
    const connections: string[] = [];
    try {
      // Check what spaces can reach this space
      allSpaces.forEach(otherSpace => {
        const movement = dataService.getMovement(otherSpace.name, 'First');
        if (movement) {
          const destinations = [
            movement.destination_1,
            movement.destination_2,
            movement.destination_3,
            movement.destination_4,
            movement.destination_5
          ].filter(dest => dest && dest === spaceName);
          
          if (destinations.length > 0 && !connections.includes(otherSpace.name)) {
            connections.push(otherSpace.name);
          }
        }
      });
    } catch (error) {
      console.warn('Error loading space connections:', error);
    }

    setSpaceDetails({
      space,
      content,
      effects,
      diceEffects,
      playersOnSpace,
      connections
    });
  };

  const getFilteredSpaces = (): Space[] => {
    let filtered = allSpaces;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(space => {
        const config = dataService.getGameConfigBySpace(space.name);
        switch (filterType) {
          case 'starting': return config?.is_starting_space === true;
          case 'ending': return config?.is_ending_space === true;
          case 'tutorial': return config?.path_type === 'Tutorial';
          default: return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(space =>
        space.name.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  };

  const getSpaceTypeIcon = (spaceName: string): string => {
    const config = dataService.getGameConfigBySpace(spaceName);
    if (config?.is_starting_space) return '🏁';
    if (config?.is_ending_space) return '🎯';
    if (config?.path_type === 'Tutorial') return '📚';
    return '📍';
  };

  const getSpaceTypeLabel = (spaceName: string): string => {
    const config = dataService.getGameConfigBySpace(spaceName);
    if (config?.is_starting_space) return 'Starting Space';
    if (config?.is_ending_space) return 'Ending Space';
    if (config?.path_type === 'Tutorial') return 'Tutorial Space';
    return 'Game Space';
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    left: '20px',
    width: '400px',
    maxHeight: '80vh',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    zIndex: 900,
    transform: isVisible ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease-in-out',
    overflow: 'hidden',
    border: '2px solid #e1e5e9',
    display: 'flex',
    flexDirection: 'column'
  };


  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #e1e5e9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const searchStyle: React.CSSProperties = {
    padding: '12px 20px',
    borderBottom: '1px solid #e1e5e9',
    backgroundColor: '#fff'
  };

  const spaceListStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '8px'
  };

  const spaceItemStyle = (spaceName: string): React.CSSProperties => ({
    padding: '8px 12px',
    margin: '4px 0',
    borderRadius: '6px',
    border: `2px solid ${selectedSpace === spaceName ? '#28a745' : '#dee2e6'}`,
    backgroundColor: selectedSpace === spaceName ? '#d4edda' : '#f8f9fa',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: '14px'
  });

  const detailsStyle: React.CSSProperties = {
    maxHeight: '40vh',
    overflowY: 'auto',
    padding: '16px 20px',
    borderTop: '2px solid #e1e5e9',
    backgroundColor: '#fafafa'
  };

  return (
    <>
      {/* Space Explorer Panel */}
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#2c3e50'
          }}>
            Space Explorer
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

        {/* Search and Filter */}
        <div style={searchStyle}>
          <input
            type="text"
            placeholder="Search spaces..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '2px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
              marginBottom: '8px'
            }}
          />
          
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['all', 'starting', 'ending', 'tutorial'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: filterType === type ? '#28a745' : '#e9ecef',
                  color: filterType === type ? 'white' : '#6c757d'
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Space List */}
        <div style={spaceListStyle}>
          {getFilteredSpaces().map(space => (
            <div
              key={space.name}
              style={spaceItemStyle(space.name)}
              onClick={() => setSelectedSpace(space.name)}
              onMouseEnter={(e) => {
                if (selectedSpace !== space.name) {
                  e.currentTarget.style.backgroundColor = '#e3f2fd';
                  e.currentTarget.style.borderColor = '#2196f3';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedSpace !== space.name) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#dee2e6';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>
                  {getSpaceTypeIcon(space.name)}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    {space.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {getSpaceTypeLabel(space.name)}
                  </div>
                </div>
                {players.filter(p => p.currentSpace === space.name).length > 0 && (
                  <span style={{ 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {players.filter(p => p.currentSpace === space.name).length}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {getFilteredSpaces().length === 0 && (
            <div style={{
              textAlign: 'center',
              color: '#6c757d',
              padding: '20px',
              fontStyle: 'italic'
            }}>
              No spaces found matching your criteria
            </div>
          )}
        </div>

        {/* Space Details */}
        {spaceDetails && (
          <div style={detailsStyle}>
            <h4 style={{ 
              margin: 0, 
              marginBottom: '12px',
              color: '#2c3e50',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {spaceDetails.space.name} Details
            </h4>

            {/* Space Type and Basic Info */}
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#e3f2fd',
              borderRadius: '6px',
              marginBottom: '12px',
              border: '2px solid #2196f3'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '4px' 
              }}>
                <span style={{ fontSize: '18px' }}>
                  {getSpaceTypeIcon(spaceDetails.space.name)}
                </span>
                <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {getSpaceTypeLabel(spaceDetails.space.name)}
                </span>
              </div>
            </div>

            {/* Players on Space */}
            {spaceDetails.playersOnSpace.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h5 style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  margin: '0 0 8px 0'
                }}>
                  Players Here:
                </h5>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {spaceDetails.playersOnSpace.map(player => (
                    <div
                      key={player.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        backgroundColor: player.color || '#007bff',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      <span>{player.avatar || player.name.charAt(0).toUpperCase()}</span>
                      <span>{player.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Space Content */}
            {spaceDetails.content && (
              <div style={{ marginBottom: '12px' }}>
                <h5 style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  margin: '0 0 8px 0'
                }}>
                  Space Content:
                </h5>
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '6px',
                  border: '1px solid #ffeaa7',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}>
                  {spaceDetails.content.content_text || 'No content description available'}
                  
                  {spaceDetails.content.can_negotiate && (
                    <div style={{
                      marginTop: '8px',
                      color: '#28a745',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}>
                      💬 Negotiation Available
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Space Effects */}
            {spaceDetails.effects.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h5 style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  margin: '0 0 8px 0'
                }}>
                  Space Effects:
                </h5>
                {spaceDetails.effects.map((effect, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#f8d7da',
                      borderRadius: '4px',
                      border: '1px solid #f5c6cb',
                      marginBottom: '4px',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#721c24' }}>
                      {effect.effect_type}: {effect.effect_value}
                    </div>
                    {effect.effect_description && (
                      <div style={{ color: '#721c24', marginTop: '2px' }}>
                        {effect.effect_description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Connections */}
            {spaceDetails.connections.length > 0 && (
              <div>
                <h5 style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  margin: '0 0 8px 0'
                }}>
                  Connected From:
                </h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {spaceDetails.connections.slice(0, 5).map(connection => (
                    <button
                      key={connection}
                      onClick={() => setSelectedSpace(connection)}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      {connection}
                    </button>
                  ))}
                  {spaceDetails.connections.length > 5 && (
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#6c757d',
                      padding: '2px 6px'
                    }}>
                      +{spaceDetails.connections.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}