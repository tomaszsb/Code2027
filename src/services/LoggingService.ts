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
      type: this.mapLogLevelToActionType(level),
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

  private mapLogLevelToActionType(level: LogLevel): ActionLogEntry['type'] {
    switch (level) {
      case LogLevel.ERROR:
        return 'error_event';
      default:
        return 'system_log';
    }
  }
}