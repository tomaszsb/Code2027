import { IStateService, LogLevel, LogPayload, ILoggingService } from '../types/ServiceContracts';
import { ActionLogEntry } from '../types/StateTypes';

export class LoggingService implements ILoggingService {
  private stateService: IStateService;
  private performanceTimers: Map<string, number> = new Map();

  constructor(stateService: IStateService) {
    this.stateService = stateService;
  }

  info(message: string, payload?: LogPayload): void {
    this.log(LogLevel.INFO, message, payload);
  }

  warn(message: string, payload?: LogPayload): void {
    this.log(LogLevel.WARN, message, payload);
  }

  error(message: string, error: Error, payload?: LogPayload): void {
    const errorPayload = {
      ...payload,
      errorMessage: error.message,
      errorStack: error.stack
    };
    this.log(LogLevel.ERROR, message, errorPayload);
  }

  debug(message: string, payload?: LogPayload): void {
    this.log(LogLevel.DEBUG, message, payload);
  }

  log(level: LogLevel, message: string, payload: LogPayload = {}): void {
    // Auto-resolve player name if playerId provided but playerName is not
    let playerName = payload.playerName;
    if (!playerName && payload.playerId && payload.playerId !== 'system') {
      const player = this.stateService.getPlayer(payload.playerId);
      playerName = player?.name || payload.playerId;
    }

    // Create log entry for action history
    const logEntry: Omit<ActionLogEntry, 'id' | 'timestamp'> = {
      type: this.determineActionType(level, payload, message),
      playerId: payload.playerId || 'system',
      playerName: playerName || 'System',
      description: message,
      details: {
        level: level,
        ...payload
      }
    };

    // Persist to action history
    this.stateService.logToActionHistory(logEntry);

    // Log to browser console based on level
    switch (level) {
      case LogLevel.ERROR:
        console.error(`[ERROR] ${message}`, payload);
        break;
      case LogLevel.WARN:
        console.warn(`[WARN] ${message}`, payload);
        break;
      case LogLevel.DEBUG:
        console.debug(`[DEBUG] ${message}`, payload);
        break;
      case LogLevel.INFO:
      default:
        console.log(`[INFO] ${message}`, payload);
        break;
    }
  }

  startPerformanceTimer(key: string): void {
    this.performanceTimers.set(key, performance.now());
  }

  endPerformanceTimer(key: string, message?: string): void {
    const startTime = this.performanceTimers.get(key);
    if (startTime === undefined) {
      this.warn(`Performance timer '${key}' was not started`);
      return;
    }

    const duration = performance.now() - startTime;
    this.performanceTimers.delete(key);

    const logMessage = message || `Performance timer '${key}' completed`;
    this.info(logMessage, {
      performanceKey: key,
      duration: `${duration.toFixed(2)}ms`,
      durationMs: duration
    });
  }

  private determineActionType(level: LogLevel, payload: LogPayload, message: string): ActionLogEntry['type'] {
    // Priority 1: Explicit 'action' from the payload is always trusted first.
    if (payload.action) {
      const validTypes: string[] = ['space_entry', 'space_effect', 'time_effect', 'dice_roll', 'card_draw', 'resource_change', 'manual_action', 'turn_start', 'turn_end', 'card_play', 'card_transfer', 'card_discard', 'player_movement', 'card_activate', 'card_expire', 'deck_reshuffle', 'game_start', 'game_end', 'error_event', 'choice_made', 'negotiation_resolved', 'system_log'];
      if (validTypes.includes(payload.action)) {
        return payload.action as ActionLogEntry['type'];
      }
    }

    // Priority 2: If no explicit action, infer the type from the log message string.
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.startsWith('landed on')) return 'space_entry';
    if (lowerMessage.startsWith('turn') && lowerMessage.endsWith('started')) return 'turn_start';
    if (lowerMessage.startsWith('turn') && lowerMessage.endsWith('ended')) return 'turn_end';
    if (lowerMessage.startsWith('rolled a')) return 'dice_roll';
    if (lowerMessage.startsWith('drew') && lowerMessage.includes('card')) return 'card_draw';
    if (lowerMessage.startsWith('played')) return 'card_play';
    if (lowerMessage.startsWith('discarded')) return 'card_discard';
    if (lowerMessage.startsWith('moved from')) return 'player_movement';

    // Priority 3: Fallback for errors.
    if (level === LogLevel.ERROR) {
      return 'error_event';
    }

    // Default to system_log if no other type can be inferred.
    return 'system_log';
  }
}