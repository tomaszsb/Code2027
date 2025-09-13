import { describe, it, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoggingService, LogLevel } from '../../src/services/LoggingService';
import { IStateService } from '../../src/types/ServiceContracts';
import { createMockStateService } from '../mocks/mockServices';

describe('LoggingService', () => {
  let loggingService: LoggingService;
  let mockStateService: vi.Mocked<IStateService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStateService = createMockStateService();
    loggingService = new LoggingService(mockStateService);
    
    // Mock console methods to avoid spam during tests
    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'warn').mockImplementation();
    vi.spyOn(console, 'error').mockImplementation();
    vi.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Logging Methods', () => {
    it('should log info messages correctly', () => {
      loggingService.info('Test info message', { key: 'value' });

      expect(mockStateService.logToActionHistory).toHaveBeenCalledWith({
        type: 'system_log',
        playerId: 'system',
        playerName: 'System',
        description: 'Test info message',
        details: {
          level: LogLevel.INFO,
          key: 'value'
        }
      });

      expect(console.log).toHaveBeenCalledWith('[INFO] Test info message', { key: 'value' });
    });

    it('should log warning messages correctly', () => {
      loggingService.warn('Test warning message');

      expect(mockStateService.logToActionHistory).toHaveBeenCalledWith({
        type: 'system_log',
        playerId: 'system',
        playerName: 'System',
        description: 'Test warning message',
        details: {
          level: LogLevel.WARN
        }
      });

      expect(console.warn).toHaveBeenCalledWith('[WARN] Test warning message', {});
    });

    it('should log error messages correctly with error details', () => {
      const testError = new Error('Test error');
      testError.stack = 'Test stack trace';

      loggingService.error('Test error message', testError, { context: 'test' });

      expect(mockStateService.logToActionHistory).toHaveBeenCalledWith({
        type: 'error_event',
        playerId: 'system',
        playerName: 'System',
        description: 'Test error message',
        details: {
          level: LogLevel.ERROR,
          context: 'test',
          errorMessage: 'Test error',
          errorStack: 'Test stack trace'
        }
      });

      expect(console.error).toHaveBeenCalled();
    });

    it('should log debug messages correctly', () => {
      loggingService.debug('Test debug message');

      expect(mockStateService.logToActionHistory).toHaveBeenCalledWith({
        type: 'system_log',
        playerId: 'system',
        playerName: 'System',
        description: 'Test debug message',
        details: {
          level: LogLevel.DEBUG
        }
      });

      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe('Performance Timing', () => {
    beforeEach(() => {
      // Mock performance.now()
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000) // startPerformanceTimer
        .mockReturnValueOnce(1250); // endPerformanceTimer
    });

    it('should measure performance timing correctly', () => {
      loggingService.startPerformanceTimer('test-operation');
      loggingService.endPerformanceTimer('test-operation', 'Test operation completed');

      expect(mockStateService.logToActionHistory).toHaveBeenCalledWith({
        type: 'system_log',
        playerId: 'system',
        playerName: 'System',
        description: 'Test operation completed',
        details: {
          level: LogLevel.INFO,
          performanceKey: 'test-operation',
          duration: '250.00ms',
          durationMs: 250
        }
      });
    });

    it('should handle missing performance timer gracefully', () => {
      loggingService.endPerformanceTimer('nonexistent-timer');

      expect(mockStateService.logToActionHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'system_log',
          description: "Performance timer 'nonexistent-timer' was not started"
        })
      );
    });
  });

  describe('Log Level Mapping', () => {
    it('should map ERROR level to error_event type', () => {
      const testError = new Error('Test');
      loggingService.error('Error message', testError);

      expect(mockStateService.logToActionHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error_event'
        })
      );
    });

    it('should map non-ERROR levels to system_log type', () => {
      loggingService.info('Info message');
      loggingService.warn('Warn message');
      loggingService.debug('Debug message');

      expect(mockStateService.logToActionHistory).toHaveBeenCalledTimes(3);
      
      const calls = mockStateService.logToActionHistory.mock.calls;
      calls.forEach(call => {
        expect(call[0]).toEqual(expect.objectContaining({
          type: 'system_log'
        }));
      });
    });
  });
});