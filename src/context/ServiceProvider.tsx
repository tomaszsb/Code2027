// src/context/ServiceProvider.tsx

import React, { ReactNode } from 'react';
import { GameContext } from './GameContext';
import { IServiceContainer } from '../types/ServiceContracts';

// --- Service Imports ---
import { DataService } from '../services/DataService';
import { StateService } from '../services/StateService';
import { TurnService } from '../services/TurnService';
import { CardService } from '../services/CardService';
import { MovementService } from '../services/MovementService';
import { GameRulesService } from '../services/GameRulesService';
// ... etc. (other services will be implemented in future phases)

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
  // Instantiate services - Phase 1: Core services implemented
  const dataService = new DataService();
  const stateService = new StateService(dataService);
  const turnService = new TurnService(dataService, stateService);
  const cardService = new CardService(dataService, stateService);
  const movementService = new MovementService(dataService, stateService);
  const gameRulesService = new GameRulesService(dataService, stateService);
  
  const services: IServiceContainer = {
    dataService,
    stateService,
    turnService,
    cardService,
    movementService,
    gameRulesService,
    playerActionService: {} as any, // Placeholder - to be implemented in future phases
  };

  return (
    <GameContext.Provider value={services}>
      {children}
    </GameContext.Provider>
  );
};
