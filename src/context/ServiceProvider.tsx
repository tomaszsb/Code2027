// src/context/ServiceProvider.tsx

import React, { ReactNode } from 'react';
import { GameContext } from './GameContext';
import { IServiceContainer } from '../types/ServiceContracts';

// --- Service Imports ---
import { DataService } from '../services/DataService';
import { StateService } from '../services/StateService';
import { TurnService } from '../services/TurnService';
import { CardService } from '../services/CardService';
import { PlayerActionService } from '../services/PlayerActionService';
import { MovementService } from '../services/MovementService';
import { GameRulesService } from '../services/GameRulesService';
import { ResourceService } from '../services/ResourceService';
import { ChoiceService } from '../services/ChoiceService';
import { EffectEngineService } from '../services/EffectEngineService';
import { NegotiationService } from '../services/NegotiationService';

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
  const resourceService = new ResourceService(stateService);
  const choiceService = new ChoiceService(stateService);
  const gameRulesService = new GameRulesService(dataService, stateService);
  const cardService = new CardService(dataService, stateService, resourceService);
  const movementService = new MovementService(dataService, stateService, choiceService);
  
  // Create temporary services for circular dependency resolution
  const tempEffectEngine = new EffectEngineService(resourceService, cardService, choiceService, stateService, movementService);
  const negotiationService = new NegotiationService(stateService, tempEffectEngine);
  
  // Create TurnService with NegotiationService dependency
  const turnService = new TurnService(dataService, stateService, gameRulesService, cardService, resourceService, movementService, negotiationService);
  
  // Create final EffectEngineService with TurnService dependency
  const effectEngineService = new EffectEngineService(resourceService, cardService, choiceService, stateService, movementService, turnService, gameRulesService);
  
  // Set final EffectEngineService on TurnService to complete the circular dependency
  turnService.setEffectEngineService(effectEngineService);
  
  const playerActionService = new PlayerActionService(dataService, stateService, gameRulesService, movementService, turnService, effectEngineService);
  
  const services: IServiceContainer = {
    dataService,
    stateService,
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
