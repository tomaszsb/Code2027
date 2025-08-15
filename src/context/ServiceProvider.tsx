// src/context/ServiceProvider.tsx

import React, { ReactNode } from 'react';
import { GameContext } from './GameContext';
import { IServiceContainer } from '../types/ServiceContracts';

// --- Service Imports (will be implemented in Week 2-3) ---
// import { DataService } from '../services/DataService';
// import { StateService } from '../services/StateService';
// import { TurnService } from '../services/TurnService';
// ... etc.

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
  // In Week 2-3, we will instantiate the actual services here.
  // For now, we use placeholder objects that match the service contracts.
  const services: IServiceContainer = {
    // Example: dataService: new DataService(),
    // Example: stateService: new StateService(),
    // ...
    dataService: {} as any, // Placeholder
    stateService: {} as any, // Placeholder
    turnService: {} as any, // Placeholder
    cardService: {} as any, // Placeholder
    playerActionService: {} as any, // Placeholder
    movementService: {} as any, // Placeholder
    gameRulesService: {} as any, // Placeholder
  };

  return (
    <GameContext.Provider value={services}>
      {children}
    </GameContext.Provider>
  );
};
