// Unit test specifically for the updated performNegotiation method
// This test verifies that TurnService correctly delegates to NegotiationService

import { TurnService } from '../../src/services/TurnService';
import { DataService } from '../../src/services/DataService';
import { StateService } from '../../src/services/StateService';
import { NegotiationService } from '../../src/services/NegotiationService';
import { GameRulesService } from '../../src/services/GameRulesService';
import { CardService } from '../../src/services/CardService';
import { ResourceService } from '../../src/services/ResourceService';
import { MovementService } from '../../src/services/MovementService';
import { ChoiceService } from '../../src/services/ChoiceService';
import { EffectEngineService } from '../../src/services/EffectEngineService';

describe('TurnService.performNegotiation', () => {
  let turnService: TurnService;
  let mockNegotiationService: jest.Mocked<NegotiationService>;
  let stateService: StateService;
  let dataService: DataService;

  beforeEach(() => {
    // Create real services for dependencies
    dataService = new DataService();
    stateService = new StateService(dataService);
    const resourceService = new ResourceService(stateService);
    const gameRulesService = new GameRulesService(dataService, stateService);
    const cardService = new CardService(dataService, stateService, resourceService);
    const choiceService = new ChoiceService(stateService);
    const movementService = new MovementService(dataService, stateService, choiceService);
    
    // Create mock NegotiationService
    mockNegotiationService = {
      initiateNegotiation: jest.fn(),
      makeOffer: jest.fn(),
      cancelNegotiation: jest.fn(),
      completeNegotiation: jest.fn(),
      getActiveNegotiation: jest.fn(),
      hasActiveNegotiation: jest.fn()
    } as any;

    // Create TurnService with mocked NegotiationService
    turnService = new TurnService(
      dataService,
      stateService,
      gameRulesService,
      cardService,
      resourceService,
      movementService,
      mockNegotiationService
    );

    // Set up basic game state
    stateService.addPlayer('Test Player');
    stateService.startGame();
  });

  it('should delegate to NegotiationService.initiateNegotiation', async () => {
    const playerId = stateService.getGameState().players[0].id;
    
    // Mock successful negotiation initiation
    mockNegotiationService.initiateNegotiation.mockResolvedValue({
      success: true,
      message: 'Negotiation started successfully',
      negotiationId: 'test-negotiation-id',
      effects: []
    });

    // Call performNegotiation
    const result = await turnService.performNegotiation(playerId);

    // Verify delegation occurred
    expect(mockNegotiationService.initiateNegotiation).toHaveBeenCalledWith(playerId, {
      type: 'space_negotiation',
      space: expect.any(String),
      initiatedBy: playerId
    });

    // Verify result is passed through
    expect(result.success).toBe(true);
    expect(result.message).toBe('Negotiation started successfully');
  });

  it('should handle negotiation service errors gracefully', async () => {
    const playerId = stateService.getGameState().players[0].id;
    
    // Mock negotiation service error
    mockNegotiationService.initiateNegotiation.mockRejectedValue(new Error('Negotiation failed'));

    // Call performNegotiation
    const result = await turnService.performNegotiation(playerId);

    // Verify error handling
    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to start negotiation');
  });

  it('should return error for invalid player', async () => {
    const invalidPlayerId = 'invalid-player-id';

    // Call performNegotiation with invalid player ID
    await expect(turnService.performNegotiation(invalidPlayerId)).rejects.toThrow('Player invalid-player-id not found');
  });

  it('should pass correct context to negotiation service', async () => {
    const player = stateService.getGameState().players[0];
    const playerId = player.id;

    // Update player to specific space
    stateService.updatePlayer({ id: playerId, currentSpace: 'OWNER-SCOPE-INITIATION' });

    // Mock successful negotiation initiation
    mockNegotiationService.initiateNegotiation.mockResolvedValue({
      success: true,
      message: 'Negotiation started',
      effects: []
    });

    // Call performNegotiation
    await turnService.performNegotiation(playerId);

    // Verify correct context was passed
    expect(mockNegotiationService.initiateNegotiation).toHaveBeenCalledWith(playerId, {
      type: 'space_negotiation',
      space: 'OWNER-SCOPE-INITIATION',
      initiatedBy: playerId
    });
  });
});