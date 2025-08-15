import { IStateService, IDataService } from '../types/ServiceContracts';
import { 
  GameState, 
  Player, 
  GamePhase, 
  PlayerUpdateData,
  PlayerCards 
} from '../types/StateTypes';

export class StateService implements IStateService {
  private currentState: GameState;
  private readonly dataService: IDataService;

  constructor(dataService: IDataService) {
    this.dataService = dataService;
    this.currentState = this.createInitialState();
  }

  // State access methods
  getGameState(): GameState {
    return {
      ...this.currentState,
      players: this.currentState.players.map(player => ({ ...player, cards: { ...player.cards } }))
    };
  }

  isStateLoaded(): boolean {
    return this.currentState !== undefined;
  }

  // Player management methods
  addPlayer(name: string): GameState {
    if (this.currentState.gamePhase !== 'SETUP') {
      throw new Error('Cannot add players outside of setup phase');
    }

    if (this.currentState.players.some(p => p.name === name)) {
      throw new Error(`Player with name "${name}" already exists`);
    }

    const newPlayer: Player = this.createNewPlayer(name);
    
    const newState: GameState = {
      ...this.currentState,
      players: [...this.currentState.players, newPlayer]
    };

    this.currentState = newState;
    return { ...newState };
  }

  updatePlayer(playerData: PlayerUpdateData): GameState {
    if (!playerData.id) {
      throw new Error('Player ID is required for updates');
    }

    const playerIndex = this.currentState.players.findIndex(p => p.id === playerData.id);
    if (playerIndex === -1) {
      throw new Error(`Player with ID "${playerData.id}" not found`);
    }

    const currentPlayer = this.currentState.players[playerIndex];
    const updatedPlayer: Player = {
      ...currentPlayer,
      ...playerData,
      cards: playerData.cards ? {
        ...currentPlayer.cards,
        ...playerData.cards
      } : currentPlayer.cards
    };

    const newPlayers = [...this.currentState.players];
    newPlayers[playerIndex] = updatedPlayer;

    const newState: GameState = {
      ...this.currentState,
      players: newPlayers
    };

    this.currentState = newState;
    return { ...newState };
  }

  removePlayer(playerId: string): GameState {
    if (this.currentState.gamePhase !== 'SETUP') {
      throw new Error('Cannot remove players outside of setup phase');
    }

    const playerExists = this.currentState.players.some(p => p.id === playerId);
    if (!playerExists) {
      throw new Error(`Player with ID "${playerId}" not found`);
    }

    const newPlayers = this.currentState.players.filter(p => p.id !== playerId);
    let newCurrentPlayerId = this.currentState.currentPlayerId;

    if (this.currentState.currentPlayerId === playerId) {
      newCurrentPlayerId = newPlayers.length > 0 ? newPlayers[0].id : null;
    }

    const newState: GameState = {
      ...this.currentState,
      players: newPlayers,
      currentPlayerId: newCurrentPlayerId
    };

    this.currentState = newState;
    return { ...newState };
  }

  getPlayer(playerId: string): Player | undefined {
    const player = this.currentState.players.find(p => p.id === playerId);
    return player ? { ...player, cards: { ...player.cards } } : undefined;
  }

  getAllPlayers(): Player[] {
    return this.currentState.players.map(player => ({ ...player, cards: { ...player.cards } }));
  }

  // Game flow methods
  setCurrentPlayer(playerId: string): GameState {
    const playerExists = this.currentState.players.some(p => p.id === playerId);
    if (!playerExists) {
      throw new Error(`Player with ID "${playerId}" not found`);
    }

    const newState: GameState = {
      ...this.currentState,
      currentPlayerId: playerId
    };

    this.currentState = newState;
    return { ...newState };
  }

  setGamePhase(phase: GamePhase): GameState {
    const newState: GameState = {
      ...this.currentState,
      gamePhase: phase
    };

    if (phase === 'PLAY' && !this.currentState.gameStartTime) {
      newState.gameStartTime = new Date();
    }

    if (phase === 'END' && !this.currentState.gameEndTime) {
      newState.gameEndTime = new Date();
    }

    this.currentState = newState;
    return { ...newState };
  }

  advanceTurn(): GameState {
    const newState: GameState = {
      ...this.currentState,
      turn: this.currentState.turn + 1
    };

    this.currentState = newState;
    return { ...newState };
  }

  nextPlayer(): GameState {
    if (this.currentState.players.length === 0) {
      throw new Error('No players available');
    }

    const currentIndex = this.currentState.currentPlayerId 
      ? this.currentState.players.findIndex(p => p.id === this.currentState.currentPlayerId)
      : -1;

    const nextIndex = (currentIndex + 1) % this.currentState.players.length;
    const nextPlayerId = this.currentState.players[nextIndex].id;

    const newState: GameState = {
      ...this.currentState,
      currentPlayerId: nextPlayerId
    };

    this.currentState = newState;
    return { ...newState };
  }

  // Game lifecycle methods
  initializeGame(): GameState {
    this.currentState = this.createInitialState();
    return { ...this.currentState };
  }

  startGame(): GameState {
    if (!this.canStartGame()) {
      throw new Error('Cannot start game: requirements not met');
    }

    const newState: GameState = {
      ...this.currentState,
      gamePhase: 'PLAY',
      gameStartTime: new Date(),
      currentPlayerId: this.currentState.players.length > 0 ? this.currentState.players[0].id : null
    };

    this.currentState = newState;
    return { ...newState };
  }

  endGame(winnerId?: string): GameState {
    const newState: GameState = {
      ...this.currentState,
      gamePhase: 'END',
      gameEndTime: new Date(),
      winner: winnerId
    };

    this.currentState = newState;
    return { ...newState };
  }

  resetGame(): GameState {
    this.currentState = this.createInitialState();
    return { ...this.currentState };
  }

  // Validation methods
  validatePlayerAction(playerId: string, action: string): boolean {
    if (this.currentState.gamePhase !== 'PLAY') {
      return false;
    }

    if (this.currentState.currentPlayerId !== playerId) {
      return false;
    }

    const player = this.getPlayer(playerId);
    if (!player) {
      return false;
    }

    return true;
  }

  canStartGame(): boolean {
    if (this.currentState.gamePhase !== 'SETUP') {
      return false;
    }

    if (this.currentState.players.length < 1) {
      return false;
    }

    if (this.dataService && this.dataService.isLoaded()) {
      const gameConfigs = this.dataService.getGameConfig();
      if (gameConfigs.length > 0) {
        const minPlayers = Math.min(...gameConfigs.map(c => c.min_players));
        const maxPlayers = Math.max(...gameConfigs.map(c => c.max_players));
        
        return this.currentState.players.length >= minPlayers && 
               this.currentState.players.length <= maxPlayers;
      }
    }

    return this.currentState.players.length >= 1 && this.currentState.players.length <= 6;
  }

  // Private helper methods
  private createInitialState(): GameState {
    const startingSpace = this.getStartingSpace();
    
    return {
      players: [],
      currentPlayerId: null,
      gamePhase: 'SETUP',
      turn: 0
    };
  }

  private createNewPlayer(name: string): Player {
    const startingSpace = this.getStartingSpace();
    
    return {
      id: this.generatePlayerId(),
      name,
      currentSpace: startingSpace,
      visitType: 'First',
      money: 0,
      time: 0,
      cards: {
        W: [],
        B: [],
        E: [],
        L: [],
        I: []
      }
    };
  }

  private generatePlayerId(): string {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getStartingSpace(): string {
    if (this.dataService && this.dataService.isLoaded()) {
      const gameConfigs = this.dataService.getGameConfig();
      const startingSpace = gameConfigs.find(config => config.is_starting_space);
      if (startingSpace) {
        return startingSpace.space_name;
      }
    }
    
    return 'START-QUICK-PLAY-GUIDE';
  }
}