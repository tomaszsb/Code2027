// src/services/NegotiationService.ts

import { IStateService, IEffectEngineService } from '../types/ServiceContracts';
import { NegotiationResult, NegotiationState } from '../types/StateTypes';

/**
 * Negotiation Service
 * 
 * This service manages the state and logic of negotiation events between players.
 * It handles the creation, progression, and resolution of negotiations, including
 * offers, counter-offers, and final agreements.
 * 
 * The service is designed to be self-contained and can be triggered from space actions,
 * card effects, or other game events that require player-to-player negotiations.
 */
export class NegotiationService {
  private stateService: IStateService;
  private effectEngineService: IEffectEngineService;

  constructor(
    stateService: IStateService,
    effectEngineService: IEffectEngineService
  ) {
    this.stateService = stateService;
    this.effectEngineService = effectEngineService;
  }

  /**
   * Start a new negotiation between players
   * 
   * @param playerId - The ID of the player initiating the negotiation
   * @param context - Context data about the negotiation (what's at stake, rules, etc.)
   * @returns Promise resolving to the negotiation result
   */
  public async startNegotiation(playerId: string, context: any): Promise<NegotiationResult> {
    console.log(`🤝 NegotiationService.startNegotiation - Player ${playerId} starting negotiation`);
    console.log(`   Context:`, context);
    
    try {
      // Get current game state
      const gameState = this.stateService.getGameState();
      
      // Validate player exists
      const player = this.stateService.getPlayer(playerId);
      if (!player) {
        throw new Error(`Player ${playerId} not found`);
      }
      
      // Check if there's already an active negotiation
      if (gameState.activeNegotiation) {
        console.warn(`   Active negotiation already exists: ${gameState.activeNegotiation.negotiationId}`);
        return {
          success: false,
          message: 'Another negotiation is already in progress',
          effects: []
        };
      }
      
      // Generate unique negotiation ID
      const negotiationId = `negotiation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create negotiation state
      const negotiationState: NegotiationState = {
        negotiationId: negotiationId,
        initiatorId: playerId,
        status: 'pending',
        context: context,
        offers: [],
        createdAt: new Date(),
        lastUpdatedAt: new Date()
      };
      
      // TODO: Update game state with active negotiation
      // For now, just log the negotiation creation
      console.log(`✅ Negotiation created: ${negotiationId}`);
      console.log(`   Status: ${negotiationState.status}`);
      console.log(`   Initiator: ${player.name || playerId}`);
      
      // Return placeholder result - will be enhanced in future iterations
      return {
        success: true,
        message: `Negotiation ${negotiationId} started successfully`,
        negotiationId: negotiationId,
        effects: [
          // Placeholder LOG effect to track negotiation start
          {
            effectType: 'LOG',
            payload: {
              message: `Negotiation started by ${player.name || playerId}: ${negotiationId}`,
              level: 'INFO',
              source: `negotiation:${negotiationId}`
            }
          }
        ]
      };
      
    } catch (error) {
      console.error(`❌ Error starting negotiation:`, error);
      return {
        success: false,
        message: `Failed to start negotiation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        effects: []
      };
    }
  }

  /**
   * Make an offer in an active negotiation
   * 
   * @param playerId - The ID of the player making the offer
   * @param offer - The offer details (terms, conditions, etc.)
   * @returns Promise resolving to the negotiation result
   */
  public async makeOffer(playerId: string, offer: any): Promise<NegotiationResult> {
    console.log(`🤝 NegotiationService.makeOffer - Player ${playerId} making offer`);
    console.log(`   Offer:`, offer);
    
    try {
      // Get current game state
      const gameState = this.stateService.getGameState();
      
      // Validate player exists
      const player = this.stateService.getPlayer(playerId);
      if (!player) {
        throw new Error(`Player ${playerId} not found`);
      }
      
      // Check if there's an active negotiation
      if (!gameState.activeNegotiation) {
        return {
          success: false,
          message: 'No active negotiation to make offer in',
          effects: []
        };
      }
      
      const negotiation = gameState.activeNegotiation;
      
      // Validate player can participate in this negotiation
      if (negotiation.status !== 'pending' && negotiation.status !== 'in_progress') {
        return {
          success: false,
          message: `Cannot make offer - negotiation status is ${negotiation.status}`,
          effects: []
        };
      }
      
      console.log(`✅ Offer accepted for negotiation: ${negotiation.negotiationId}`);
      console.log(`   Player: ${player.name || playerId}`);
      console.log(`   Negotiation status: ${negotiation.status}`);
      
      // Return placeholder result - will be enhanced in future iterations
      return {
        success: true,
        message: `Offer made successfully in negotiation ${negotiation.negotiationId}`,
        negotiationId: negotiation.negotiationId,
        effects: [
          // Placeholder LOG effect to track offer
          {
            effectType: 'LOG',
            payload: {
              message: `Offer made by ${player.name || playerId} in negotiation ${negotiation.negotiationId}`,
              level: 'INFO',
              source: `negotiation:${negotiation.negotiationId}`
            }
          }
        ]
      };
      
    } catch (error) {
      console.error(`❌ Error making offer:`, error);
      return {
        success: false,
        message: `Failed to make offer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        effects: []
      };
    }
  }

  /**
   * Get the current active negotiation (if any)
   * 
   * @returns The active negotiation state or null
   */
  public getActiveNegotiation(): NegotiationState | null {
    const gameState = this.stateService.getGameState();
    return gameState.activeNegotiation || null;
  }

  /**
   * Check if there is an active negotiation
   * 
   * @returns True if there is an active negotiation
   */
  public hasActiveNegotiation(): boolean {
    return this.getActiveNegotiation() !== null;
  }
}