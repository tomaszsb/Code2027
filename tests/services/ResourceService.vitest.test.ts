// tests/services/ResourceService.vitest.test.ts
// Optimized ResourceService tests for Vitest

import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceService } from '../../src/services/ResourceService';
import { 
  createVitestMockServices,
  createLightweightResourceService,
  createLightweightStateService
} from '../utils/vitestMocks';

import { TEST_PLAYERS } from '../fixtures/testData';

describe('ResourceService - Performance Optimized (Vitest)', () => {
  let resourceService: ResourceService;
  let mockStateService: any;
  let mockDataService: any;

  beforeEach(() => {
    const mocks = createVitestMockServices();
    mockStateService = mocks.stateService;
    mockDataService = mocks.dataService;
    
    resourceService = new ResourceService(mockDataService, mockStateService);
  });

  describe('Money Operations - Fast Tests', () => {
    it('should add money successfully', async () => {
      const testPlayer = TEST_PLAYERS[0];
      mockStateService.getPlayer.mockReturnValue(testPlayer);
      
      await resourceService.addMoney('player1', 1000, 'test');
      
      expect(mockStateService.getPlayer).toHaveBeenCalledWith('player1');
      expect(mockStateService.updatePlayer).toHaveBeenCalled();
    });

    it('should spend money successfully when player has enough', async () => {
      const testPlayer = { ...TEST_PLAYERS[0], money: 5000 };
      mockStateService.getPlayer.mockReturnValue(testPlayer);
      
      await resourceService.spendMoney('player1', 1000, 'test');
      
      expect(mockStateService.getPlayer).toHaveBeenCalledWith('player1');
      expect(mockStateService.updatePlayer).toHaveBeenCalled();
    });

    it('should validate affordability correctly', () => {
      const testPlayer = { ...TEST_PLAYERS[0], money: 2000 };
      mockStateService.getPlayer.mockReturnValue(testPlayer);
      
      const canAfford1000 = resourceService.canAfford('player1', 1000);
      const canAfford3000 = resourceService.canAfford('player1', 3000);
      
      expect(canAfford1000).toBe(true);
      expect(canAfford3000).toBe(false);
    });
  });

  describe('Time Operations - Fast Tests', () => {
    it('should add time successfully', async () => {
      const testPlayer = TEST_PLAYERS[0];
      mockStateService.getPlayer.mockReturnValue(testPlayer);
      
      await resourceService.addTime('player1', 5, 'test');
      
      expect(mockStateService.getPlayer).toHaveBeenCalledWith('player1');
      expect(mockStateService.updatePlayer).toHaveBeenCalled();
    });

    it('should spend time successfully', async () => {
      const testPlayer = { ...TEST_PLAYERS[0], timeSpent: 2 };
      mockStateService.getPlayer.mockReturnValue(testPlayer);
      
      await resourceService.spendTime('player1', 3, 'test');
      
      expect(mockStateService.getPlayer).toHaveBeenCalledWith('player1');
      expect(mockStateService.updatePlayer).toHaveBeenCalled();
    });
  });

  describe('Combined Operations - Fast Tests', () => {
    it('should update both resources simultaneously', async () => {
      const testPlayer = TEST_PLAYERS[0];
      mockStateService.getPlayer.mockReturnValue(testPlayer);
      
      await resourceService.updateResources('player1', 500, -2, 'test');
      
      expect(mockStateService.getPlayer).toHaveBeenCalledWith('player1');
      expect(mockStateService.updatePlayer).toHaveBeenCalled();
    });
  });

  describe('Validation - Fast Tests', () => {
    it('should validate resource changes correctly', () => {
      const testPlayer = { ...TEST_PLAYERS[0], money: 1000, timeSpent: 5 };
      mockStateService.getPlayer.mockReturnValue(testPlayer);
      
      const result = resourceService.validateResourceChange('player1', -500, 2);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid money changes', () => {
      const testPlayer = { ...TEST_PLAYERS[0], money: 1000 };
      mockStateService.getPlayer.mockReturnValue(testPlayer);
      
      const result = resourceService.validateResourceChange('player1', -2000, 0);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid time changes', () => {
      const testPlayer = { ...TEST_PLAYERS[0], timeSpent: 18 };
      mockStateService.getPlayer.mockReturnValue(testPlayer);
      
      const result = resourceService.validateResourceChange('player1', 0, 5);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});