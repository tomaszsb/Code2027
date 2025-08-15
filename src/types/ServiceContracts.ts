// src/types/ServiceContracts.ts

/**
 * @file This file defines the contracts (interfaces) for all services in the application.
 * Adhering to these contracts is crucial for ensuring a decoupled and testable architecture.
 */

// Phase 1 Services
export interface IDataService {
  // Methods for accessing game data from CSVs
}

export interface IStateService {
  // Methods for managing and accessing the game's state
}

export interface ITurnService {
  // Methods for managing turn progression
}

export interface ICardService {
  // Methods for card operations and deck management
}

export interface IPlayerActionService {
  // Methods for handling player commands and orchestrating actions
}

export interface IMovementService {
  // Methods for handling player movement logic
}

export interface IGameRulesService {
  // Methods for validating game rules
}


/**
 * Represents the complete container of all game services.
 * This will be provided via context to the rest of the application.
 */
export interface IServiceContainer {
  dataService: IDataService;
  stateService: IStateService;
  turnService: ITurnService;
  cardService: ICardService;
  playerActionService: IPlayerActionService;
  movementService: IMovementService;
  gameRulesService: IGameRulesService;
}
