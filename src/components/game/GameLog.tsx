import React, { useState, useEffect } from 'react';
import { colors } from '../../styles/theme';
import { useGameContext } from '../../context/GameContext';
import { ActionLogEntry } from '../../types/StateTypes';
import { formatActionDescription } from '../../utils/actionLogFormatting';

export function GameLog(): JSX.Element {
  const { stateService } = useGameContext();
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);

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

  // Group actions by player for better readability
  const getPlayerColor = (playerId: string): string => {
    const playerColors = {
      player_1: colors.primary.main,  // Blue
      player_2: colors.success.main,  // Green
      player_3: colors.danger.main,  // Red
      player_4: colors.game.player8,  // Orange
    };
    // Fallback colors based on player ID hash
    const hash = playerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const colorArray = [colors.purple.main, colors.game.pink, colors.game.teal, colors.warning.main];
    return playerColors[playerId as keyof typeof playerColors] || colorArray[hash % colorArray.length];
  };

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
        📜 Game Log ({actionLog.length} entries)
      </div>

      {/* Scrollable content */}
      <div style={{
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
            {actionLog.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: '8px 10px',
                  backgroundColor: colors.white,
                  border: `1px solid ${getPlayerColor(entry.playerId)}20`,
                  borderLeft: `4px solid ${getPlayerColor(entry.playerId)}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  lineHeight: '1.3'
                }}
              >
                {/* Player name and timestamp */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontWeight: 'bold',
                    color: getPlayerColor(entry.playerId),
                    fontSize: '10px'
                  }}>
                    {entry.playerName}
                  </span>
                  <span style={{
                    color: colors.secondary.main,
                    fontSize: '9px'
                  }}>
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>

                {/* Action description */}
                <div style={{
                  color: colors.text.secondary
                }}>
                  {formatActionDescription(entry)}
                </div>

                {/* Additional details if available */}
                {entry.details?.space && (
                  <div style={{
                    color: colors.secondary.main,
                    fontSize: '9px',
                    marginTop: '2px'
                  }}>
                    📍 {entry.details.space}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}