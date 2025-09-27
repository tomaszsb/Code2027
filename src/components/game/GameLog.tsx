import React, { useState, useEffect, useRef, useMemo } from 'react';
import { colors } from '../../styles/theme';
import { useGameContext } from '../../context/GameContext';
import { ActionLogEntry } from '../../types/StateTypes';
import { formatActionDescription } from '../../utils/actionLogFormatting';

interface LogGroup {
  parent: ActionLogEntry;
  children: ActionLogEntry[];
}

export function GameLog(): JSX.Element {
  const { stateService } = useGameContext();
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<{ [parentId: string]: boolean }>({});
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

  // Group log entries into collapsible sections
  const groupLogEntries = (entries: ActionLogEntry[]): LogGroup[] => {
    const groups: LogGroup[] = [];
    let currentGroup: LogGroup | null = null;

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
          // If no parent group exists yet, create one with a dummy system parent
          currentGroup = {
            parent: {
              ...entry,
              type: 'system_log',
              description: 'Game Actions'
            } as ActionLogEntry,
            children: [entry]
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

  // Toggle group expansion
  const toggleGroup = (parentId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [parentId]: !prev[parentId]
    }));
  };

  // Memoize logGroups calculation for performance
  const logGroups = useMemo(() => groupLogEntries(actionLog), [actionLog]);

  // Auto-scroll to bottom when new log entries are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logGroups]);

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
        📜 Game Log ({actionLog.length} entries, {logGroups.length} groups)
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {logGroups.map((group, groupIndex) => {
              const isExpanded = expandedGroups[group.parent.id] || false;
              const hasChildren = group.children.length > 0;

              return (
                <div key={`group-${groupIndex}`}>
                  {/* Parent Entry - Always Visible */}
                  <div
                    style={{
                      padding: '8px 10px',
                      backgroundColor: colors.white,
                      border: `1px solid ${getEntryColor(group.parent)}20`,
                      borderLeft: `4px solid ${getEntryColor(group.parent)}`,
                      borderRadius: '4px',
                      fontSize: '11px',
                      lineHeight: '1.3',
                      cursor: hasChildren ? 'pointer' : 'default'
                    }}
                    onClick={hasChildren ? () => toggleGroup(group.parent.id) : undefined}
                  >
                    {/* Header with expand/collapse icon */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {hasChildren && (
                          <span style={{
                            fontSize: '10px',
                            color: colors.secondary.main,
                            userSelect: 'none'
                          }}>
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        )}
                        {group.parent.playerId !== 'SYSTEM' && (
                          <span style={{
                            fontWeight: 'bold',
                            color: getEntryColor(group.parent),
                            fontSize: '10px'
                          }}>
                            {group.parent.playerName}
                          </span>
                        )}
                      </div>
                      <span style={{
                        color: colors.secondary.main,
                        fontSize: '9px'
                      }}>
                        {formatTimestamp(group.parent.timestamp)}
                        {hasChildren && (
                          <span style={{ marginLeft: '4px' }}>({group.children.length})</span>
                        )}
                      </span>
                    </div>

                    {/* Parent action description */}
                    <div style={{
                      color: colors.text.secondary
                    }}>
                      {formatActionDescription(group.parent)}
                    </div>

                    {/* Additional details if available */}
                    {group.parent.details?.space && (
                      <div style={{
                        color: colors.secondary.main,
                        fontSize: '9px',
                        marginTop: '2px'
                      }}>
                        📍 {group.parent.details.space}
                      </div>
                    )}
                  </div>

                  {/* Child Entries - Only Visible When Expanded */}
                  {isExpanded && group.children.map((child, childIndex) => (
                    <div
                      key={`child-${groupIndex}-${childIndex}`}
                      style={{
                        marginLeft: '20px', // Visual indentation
                        padding: '6px 8px',
                        backgroundColor: colors.secondary.light,
                        border: `1px solid ${getEntryColor(child)}15`,
                        borderLeft: `3px solid ${getEntryColor(child)}`,
                        borderRadius: '3px',
                        fontSize: '10px',
                        lineHeight: '1.3',
                        marginTop: '2px'
                      }}
                    >
                      {/* Child header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '3px'
                      }}>
                        {child.playerId !== 'SYSTEM' && (
                          <span style={{
                            fontWeight: 'bold',
                            color: getEntryColor(child),
                            fontSize: '9px'
                          }}>
                            {child.playerName}
                          </span>
                        )}
                        <span style={{
                          color: colors.secondary.main,
                          fontSize: '8px'
                        }}>
                          {formatTimestamp(child.timestamp)}
                        </span>
                      </div>

                      {/* Child action description */}
                      <div style={{
                        color: colors.text.secondary
                      }}>
                        {formatActionDescription(child)}
                      </div>

                      {/* Additional details if available */}
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
    </div>
  );
}