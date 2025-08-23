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
  const gameRulesService = new GameRulesService(dataService, stateService);
  const turnService = new TurnService(dataService, stateService, gameRulesService);
  const cardService = new CardService(dataService, stateService);
  const movementService = new MovementService(dataService, stateService);
  const playerActionService = new PlayerActionService(dataService, stateService, gameRulesService, movementService, turnService);
  const negotiationService = new NegotiationService(stateService);
  
  const services: IServiceContainer = {
    dataService,
    stateService,
    turnService,
    cardService,
    playerActionService,
    movementService,
    gameRulesService,
    negotiationService,
  };

  return (
    <GameContext.Provider value={services}>
      {children}
    </GameContext.Provider>
  );
};
