import React, { useState, useEffect, useRef, useMemo } from 'react';
import { colors } from '../../styles/theme';
import { useGameContext } from '../../context/GameContext';
import { ActionLogEntry } from '../../types/StateTypes';
import { formatActionDescription } from '../../utils/actionLogFormatting';

interface PlayerTurnGroup {
  playerId: string;
  playerName: string;
  playerColor: string;
  globalTurnNumber: number;
  playerTurnNumber: number;
  actions: ActionLogEntry[];
}

export function GameLog(): JSX.Element {
  const { stateService } = useGameContext();
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [expandedPlayerTurns, setExpandedPlayerTurns] = useState<{ [turnKey: string]: boolean }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to state changes to get the global action log (filtered for player visibility)
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      // Filter for only player-visible logs
      const playerVisibleLogs = gameState.globalActionLog.filter(entry =>
        entry.visibility === 'player'
      );
      setActionLog(playerVisibleLogs);
    });

    // Initialize with current state
    const gameState = stateService.getGameState();
    const playerVisibleLogs = gameState.globalActionLog.filter(entry =>
      entry.visibility === 'player'
    );
    setActionLog(playerVisibleLogs);

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
    if (entry.type === 'system_log' || entry.type === 'game_end') {
      return colors.secondary.main; // Grey for system events
    }

    // game_start entries for actual players should use player colors
    // Only system game_start entries should be grey
    if (entry.type === 'game_start' && entry.playerId === 'system') {
      return colors.secondary.main; // Grey for system game start
    }

    // Use dynamic player lookup from stateService for all player entries (including game_start)
    const player = stateService.getPlayer(entry.playerId);
    if (player && player.color) {
      return player.color;
    }

    // Fallback colors based on player ID hash if player not found or no color
    const hash = entry.playerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const colorArray = [colors.purple.main, colors.game.pink, colors.game.teal, colors.warning.main];
    return colorArray[hash % colorArray.length];
  };

  // Group log entries by player turn in chronological order (no rounds)
  const groupLogEntries = (entries: ActionLogEntry[]): PlayerTurnGroup[] => {
    // Sort entries by timestamp to ensure proper chronological order
    const sortedEntries = [...entries].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Group entries by player and global turn number
    const playerTurnMap = new Map<string, ActionLogEntry[]>();

    sortedEntries.forEach(entry => {
      const turnKey = `${entry.playerId}-${entry.globalTurnNumber}`;
      if (!playerTurnMap.has(turnKey)) {
        playerTurnMap.set(turnKey, []);
      }
      playerTurnMap.get(turnKey)!.push(entry);
    });

    // Create player turn groups
    const playerTurns: PlayerTurnGroup[] = [];
    playerTurnMap.forEach((turnEntries, turnKey) => {
      if (turnEntries.length === 0) return;

      const firstEntry = turnEntries[0];
      const playerColor = getEntryColor(firstEntry);

      playerTurns.push({
        playerId: firstEntry.playerId,
        playerName: firstEntry.playerName,
        playerColor,
        globalTurnNumber: firstEntry.globalTurnNumber,
        playerTurnNumber: firstEntry.playerTurnNumber,
        actions: turnEntries.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      });
    });

    // Sort player turns by global turn number (chronological order)
    playerTurns.sort((a, b) => a.globalTurnNumber - b.globalTurnNumber);

    return playerTurns;
  };

  // Toggle player turn expansion
  const togglePlayerTurn = (turnKey: string) => {
    setExpandedPlayerTurns(prev => ({
      ...prev,
      [turnKey]: !prev[turnKey]
    }));
  };

  // Memoize player turn groups calculation for performance
  const playerTurnGroups = useMemo(() => groupLogEntries(actionLog), [actionLog]);

  // Auto-scroll to bottom when new log entries are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [playerTurnGroups]);

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
        📜 Game Log ({actionLog.length} entries, {playerTurnGroups.length} turns)
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
            {playerTurnGroups.map((playerTurn, turnIndex) => {
              const turnKey = `${playerTurn.playerId}-${playerTurn.globalTurnNumber}`;
              const isTurnExpanded = expandedPlayerTurns[turnKey] !== undefined
                ? expandedPlayerTurns[turnKey]
                : false; // Player turns start collapsed
              const hasActions = playerTurn.actions.length > 1; // More than just turn start

              return (
                <div key={turnKey} style={{ marginBottom: '4px' }}>
                  {/* Player Turn Header */}
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: colors.white,
                      border: `2px solid ${playerTurn.playerColor}30`,
                      borderLeft: `5px solid ${playerTurn.playerColor}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      lineHeight: '1.3',
                      cursor: hasActions ? 'pointer' : 'default'
                    }}
                    onClick={hasActions ? () => togglePlayerTurn(turnKey) : undefined}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {hasActions && (
                          <span style={{
                            fontSize: '10px',
                            color: colors.secondary.main,
                            userSelect: 'none'
                          }}>
                            {isTurnExpanded ? '▼' : '▶'}
                          </span>
                        )}
                        <span style={{
                          color: playerTurn.playerColor,
                          fontSize: '13px',
                          fontWeight: 'bold'
                        }}>
                          👤 {playerTurn.playerName} (Turn {playerTurn.playerTurnNumber})
                        </span>
                      </div>
                      <span style={{
                        color: colors.secondary.main,
                        fontSize: '10px',
                        fontWeight: 'normal'
                      }}>
                        {playerTurn.actions.length} actions
                        {hasActions && (
                          <span style={{ marginLeft: '4px' }}>({playerTurn.actions.length - 1} game actions)</span>
                        )}
                      </span>
                    </div>

                    {/* First action (usually turn start) - always visible */}
                    <div style={{
                      color: colors.text.secondary,
                      fontSize: '11px'
                    }}>
                      {formatActionDescription(playerTurn.actions[0])}
                    </div>
                  </div>

                  {/* Player's Actions - Only Visible When Turn is Expanded */}
                  {isTurnExpanded && playerTurn.actions.slice(1).map((action, actionIndex) => (
                    <div
                      key={`${turnKey}-action-${actionIndex}`}
                      style={{
                        marginLeft: '20px',
                        padding: '6px 10px',
                        backgroundColor: colors.secondary.light,
                        border: `1px solid ${playerTurn.playerColor}20`,
                        borderLeft: `4px solid ${playerTurn.playerColor}`,
                        borderRadius: '4px',
                        fontSize: '10px',
                        lineHeight: '1.3',
                        marginTop: '3px'
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
                          Action {actionIndex + 1}
                        </span>
                        <span style={{
                          color: colors.secondary.main,
                          fontSize: '8px'
                        }}>
                          {formatTimestamp(action.timestamp)}
                        </span>
                      </div>

                      <div style={{
                        color: colors.text.secondary
                      }}>
                        {formatActionDescription(action)}
                      </div>

                      {action.details?.space && (
                        <div style={{
                          color: colors.secondary.main,
                          fontSize: '8px',
                          marginTop: '2px'
                        }}>
                          📍 {action.details.space}
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