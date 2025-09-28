import React, { useState, useEffect, useRef, useMemo } from 'react';
import { colors } from '../../styles/theme';
import { useGameContext } from '../../context/GameContext';
import { ActionLogEntry } from '../../types/StateTypes';
import { formatActionDescription } from '../../utils/actionLogFormatting';

interface TurnGroup {
  parent: ActionLogEntry;
  children: ActionLogEntry[];
}

interface PlayerGroup {
  playerId: string;
  playerName: string;
  playerColor: string;
  turnGroups: TurnGroup[];
}

export function GameLog(): JSX.Element {
  const { stateService } = useGameContext();
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [expandedPlayers, setExpandedPlayers] = useState<{ [playerId: string]: boolean }>({});
  const [expandedTurns, setExpandedTurns] = useState<{ [turnId: string]: boolean }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to state changes to get the global action log
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setActionLog(gameState.globalActionLog);
    });

    // Initialize with current state
    const gameState = stateService.getGameState();
    setActionLog(gameState.globalActionLog);

    return unsubscribe;
  }, [stateService]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: Date): string => {
    if (timestamp instanceof Date) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    // Handle string timestamps that might come from serialization
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Get color for entry based on type and player (using dynamic stateService lookup)
  const getEntryColor = (entry: ActionLogEntry): string => {
    if (entry.type === 'error_event') {
      return colors.danger.main; // Red for errors
    }
    if (entry.type === 'system_log' || entry.type === 'game_start' || entry.type === 'game_end') {
      return colors.secondary.main; // Grey for system events
    }

    // Use dynamic player lookup from stateService
    const player = stateService.getPlayer(entry.playerId);
    if (player && player.color) {
      return player.color;
    }

    // Fallback colors based on player ID hash if player not found or no color
    const hash = entry.playerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const colorArray = [colors.purple.main, colors.game.pink, colors.game.teal, colors.warning.main];
    return colorArray[hash % colorArray.length];
  };

  // Group log entries by player first, then by turn/action type
  const groupLogEntries = (entries: ActionLogEntry[]): PlayerGroup[] => {
    // First, separate system/game-wide entries from player-specific entries
    const systemEntries = entries.filter(entry =>
      entry.playerId === 'SYSTEM' ||
      entry.type === 'game_start' ||
      entry.type === 'game_end'
    );

    const playerEntries = entries.filter(entry =>
      entry.playerId !== 'SYSTEM' &&
      entry.type !== 'game_start' &&
      entry.type !== 'game_end'
    );

    // Group player entries by playerId
    const playerMap = new Map<string, ActionLogEntry[]>();

    playerEntries.forEach(entry => {
      if (!playerMap.has(entry.playerId)) {
        playerMap.set(entry.playerId, []);
      }
      playerMap.get(entry.playerId)!.push(entry);
    });

    // Create player groups
    const playerGroups: PlayerGroup[] = [];

    // Add system entries as a special player group if they exist
    if (systemEntries.length > 0) {
      const systemTurnGroups = groupEntriesIntoTurns(systemEntries);
      playerGroups.push({
        playerId: 'SYSTEM',
        playerName: 'System',
        playerColor: colors.secondary.main,
        turnGroups: systemTurnGroups
      });
    }

    // Process each player's entries
    playerMap.forEach((entries, playerId) => {
      // Sort entries by timestamp to ensure proper chronological order
      entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Group this player's entries into turns
      const turnGroups = groupEntriesIntoTurns(entries);

      // Get player info
      const firstEntry = entries[0];
      const playerColor = getEntryColor(firstEntry);

      playerGroups.push({
        playerId,
        playerName: firstEntry.playerName,
        playerColor,
        turnGroups
      });
    });

    // Sort player groups by first action timestamp (except system which goes first)
    playerGroups.sort((a, b) => {
      if (a.playerId === 'SYSTEM') return -1;
      if (b.playerId === 'SYSTEM') return 1;

      const aFirstTimestamp = a.turnGroups[0]?.parent?.timestamp || new Date(0);
      const bFirstTimestamp = b.turnGroups[0]?.parent?.timestamp || new Date(0);

      return new Date(aFirstTimestamp).getTime() - new Date(bFirstTimestamp).getTime();
    });

    return playerGroups;
  };

  // Helper function to group entries into turn-based groups for a single player
  const groupEntriesIntoTurns = (entries: ActionLogEntry[]): TurnGroup[] => {
    const groups: TurnGroup[] = [];
    let currentGroup: TurnGroup | null = null;

    entries.forEach(entry => {
      // Parent entries: space_entry, turn_start, system_log, game_start, game_end
      if (entry.type === 'space_entry' || entry.type === 'turn_start' ||
          entry.type === 'system_log' || entry.type === 'game_start' || entry.type === 'game_end') {
        // Finish current group if exists
        if (currentGroup) {
          groups.push(currentGroup);
        }
        // Start new group
        currentGroup = {
          parent: entry,
          children: []
        };
      } else {
        // Child entries: all other types
        if (currentGroup) {
          currentGroup.children.push(entry);
        } else {
          // If no parent group exists yet, create one with the current entry as parent
          currentGroup = {
            parent: entry,
            children: []
          };
        }
      }
    });

    // Add the last group
    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  };

  // Toggle player expansion
  const togglePlayer = (playerId: string) => {
    setExpandedPlayers(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };

  // Toggle turn expansion
  const toggleTurn = (turnId: string) => {
    setExpandedTurns(prev => ({
      ...prev,
      [turnId]: !prev[turnId]
    }));
  };

  // Memoize player groups calculation for performance
  const playerGroups = useMemo(() => groupLogEntries(actionLog), [actionLog]);

  // Auto-scroll to bottom when new log entries are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [playerGroups]);

  return (
    <div style={{
      height: '300px',
      backgroundColor: colors.secondary.bg,
      border: `1px solid ${colors.secondary.border}`,
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        backgroundColor: colors.secondary.light,
        borderBottom: `1px solid ${colors.secondary.border}`,
        fontWeight: 'bold',
        fontSize: '14px',
        color: colors.text.secondary
      }}>
        📜 Game Log ({actionLog.length} entries, {playerGroups.length} players)
      </div>

      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>
        {actionLog.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: colors.secondary.main,
            fontStyle: 'italic',
            padding: '20px'
          }}>
            No actions yet. Start playing to see the game log!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {playerGroups.map((playerGroup, playerIndex) => {
              const isPlayerExpanded = expandedPlayers[playerGroup.playerId] !== false; // Default to expanded
              const totalTurns = playerGroup.turnGroups.length;
              const totalActions = playerGroup.turnGroups.reduce((sum, turn) => sum + 1 + turn.children.length, 0);

              return (
                <div key={`player-${playerIndex}`}>
                  {/* Player Header - Always Visible */}
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: colors.white,
                      border: `2px solid ${playerGroup.playerColor}30`,
                      borderLeft: `5px solid ${playerGroup.playerColor}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      lineHeight: '1.3',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => togglePlayer(playerGroup.playerId)}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          color: colors.secondary.main,
                          userSelect: 'none'
                        }}>
                          {isPlayerExpanded ? '▼' : '▶'}
                        </span>
                        <span style={{
                          color: playerGroup.playerColor,
                          fontSize: '13px'
                        }}>
                          👤 {playerGroup.playerName}
                        </span>
                      </div>
                      <span style={{
                        color: colors.secondary.main,
                        fontSize: '10px',
                        fontWeight: 'normal'
                      }}>
                        {totalTurns} turns, {totalActions} actions
                      </span>
                    </div>
                  </div>

                  {/* Player's Turn Groups - Only Visible When Player is Expanded */}
                  {isPlayerExpanded && (
                    <div style={{ marginLeft: '16px', marginTop: '4px' }}>
                      {playerGroup.turnGroups.map((turnGroup, turnIndex) => {
                        const turnId = `${playerGroup.playerId}-turn-${turnIndex}`;
                        const isTurnExpanded = expandedTurns[turnId] || false;
                        const hasChildren = turnGroup.children.length > 0;

                        return (
                          <div key={turnId} style={{ marginBottom: '3px' }}>
                            {/* Turn Header */}
                            <div
                              style={{
                                padding: '8px 10px',
                                backgroundColor: colors.secondary.light,
                                border: `1px solid ${playerGroup.playerColor}20`,
                                borderLeft: `4px solid ${playerGroup.playerColor}`,
                                borderRadius: '4px',
                                fontSize: '11px',
                                lineHeight: '1.3',
                                cursor: hasChildren ? 'pointer' : 'default'
                              }}
                              onClick={hasChildren ? () => toggleTurn(turnId) : undefined}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '4px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {hasChildren && (
                                    <span style={{
                                      fontSize: '9px',
                                      color: colors.secondary.main,
                                      userSelect: 'none'
                                    }}>
                                      {isTurnExpanded ? '▼' : '▶'}
                                    </span>
                                  )}
                                  <span style={{
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    color: colors.secondary.dark
                                  }}>
                                    Turn {turnIndex + 1}
                                  </span>
                                </div>
                                <span style={{
                                  color: colors.secondary.main,
                                  fontSize: '9px'
                                }}>
                                  {formatTimestamp(turnGroup.parent.timestamp)}
                                  {hasChildren && (
                                    <span style={{ marginLeft: '4px' }}>({turnGroup.children.length})</span>
                                  )}
                                </span>
                              </div>

                              {/* Turn action description */}
                              <div style={{
                                color: colors.text.secondary
                              }}>
                                {formatActionDescription(turnGroup.parent)}
                              </div>

                              {/* Additional details if available */}
                              {turnGroup.parent.details?.space && (
                                <div style={{
                                  color: colors.secondary.main,
                                  fontSize: '9px',
                                  marginTop: '2px'
                                }}>
                                  📍 {turnGroup.parent.details.space}
                                </div>
                              )}
                            </div>

                            {/* Turn's Child Actions - Only Visible When Turn is Expanded */}
                            {isTurnExpanded && turnGroup.children.map((child, childIndex) => (
                              <div
                                key={`${turnId}-child-${childIndex}`}
                                style={{
                                  marginLeft: '20px',
                                  padding: '6px 8px',
                                  backgroundColor: colors.white,
                                  border: `1px solid ${playerGroup.playerColor}15`,
                                  borderLeft: `3px solid ${playerGroup.playerColor}`,
                                  borderRadius: '3px',
                                  fontSize: '10px',
                                  lineHeight: '1.3',
                                  marginTop: '2px'
                                }}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '3px'
                                }}>
                                  <span style={{
                                    fontWeight: 'bold',
                                    color: colors.secondary.dark,
                                    fontSize: '9px'
                                  }}>
                                    Action {childIndex + 1}
                                  </span>
                                  <span style={{
                                    color: colors.secondary.main,
                                    fontSize: '8px'
                                  }}>
                                    {formatTimestamp(child.timestamp)}
                                  </span>
                                </div>

                                <div style={{
                                  color: colors.text.secondary
                                }}>
                                  {formatActionDescription(child)}
                                </div>

                                {child.details?.space && (
                                  <div style={{
                                    color: colors.secondary.main,
                                    fontSize: '8px',
                                    marginTop: '2px'
                                  }}>
                                    📍 {child.details.space}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}