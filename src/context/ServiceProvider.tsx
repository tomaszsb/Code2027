// src/context/ServiceProvider.tsx

import React, { ReactNode } from 'react';
import { GameContext } from './GameContext';
import { IServiceContainer } from '../types/ServiceContracts';

// --- Service Imports ---
import { DataService } from '../services/DataService';
import { StateService } from '../services/StateService';
import { LoggingService } from '../services/LoggingService';
import { TurnService } from '../services/TurnService';
import { CardService } from '../services/CardService';
import { PlayerActionService } from '../services/PlayerActionService';
import { MovementService } from '../services/MovementService';
import { GameRulesService } from '../services/GameRulesService';
import { ResourceService } from '../services/ResourceService';
import { ChoiceService } from '../services/ChoiceService';
import { EffectEngineService } from '../services/EffectEngineService';
import { NegotiationService } from '../services/NegotiationService';
import { TargetingService } from '../services/TargetingService';

interface ServiceProviderProps {
  children: ReactNode;
}

/**
 * The ServiceProvider component is the dependency injection container for the entire application.
 *
 * It instantiates all the services and provides them to the component tree via the GameContext.
 * This is the *only* place where services should be directly instantiated.
 *
 * @param {ServiceProviderProps} props The component props.
 * @returns {JSX.Element} The provider component.
 */
export const ServiceProvider = ({ children }: ServiceProviderProps): JSX.Element => {
  // Instantiate services - Phase 1 & 2: Core services implemented
  const dataService = new DataService();
  const stateService = new StateService(dataService);
  const loggingService = new LoggingService(stateService);
  const resourceService = new ResourceService(stateService);
  const choiceService = new ChoiceService(stateService);
  const gameRulesService = new GameRulesService(dataService, stateService);
  const cardService = new CardService(dataService, stateService, resourceService, loggingService);
  const movementService = new MovementService(dataService, stateService, choiceService, loggingService);
  const targetingService = new TargetingService(stateService, choiceService);
  
  // Create temporary services for circular dependency resolution
  const tempEffectEngine = new EffectEngineService(resourceService, cardService, choiceService, stateService, movementService, undefined as any, undefined as any, targetingService);
  const negotiationService = new NegotiationService(stateService, tempEffectEngine);
  
  // Create TurnService with NegotiationService dependency
  const turnService = new TurnService(dataService, stateService, gameRulesService, cardService, resourceService, movementService, negotiationService, loggingService);
  
  // Create final EffectEngineService with TurnService dependency
  const effectEngineService = new EffectEngineService(resourceService, cardService, choiceService, stateService, movementService, turnService, gameRulesService, targetingService);
  
  // Set final EffectEngineService on TurnService to complete the circular dependency
  turnService.setEffectEngineService(effectEngineService);
  
  const playerActionService = new PlayerActionService(dataService, stateService, gameRulesService, movementService, turnService, effectEngineService, loggingService);
  
  const services: IServiceContainer = {
    dataService,
    stateService,
    loggingService,
    turnService,
    cardService,
    playerActionService,
    movementService,
    gameRulesService,
    resourceService,
    choiceService,
    effectEngineService,
    negotiationService,
  };

  return (
    <GameContext.Provider value={services}>
      {children}
    </GameContext.Provider>
  );
};
