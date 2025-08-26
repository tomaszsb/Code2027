import { IStateService, IDataService } from '../types/ServiceContracts';
import { 
  GameState, 
  Player, 
  GamePhase, 
  PlayerUpdateData,
  PlayerCards,
  ActiveModal,
  Choice
} from '../types/StateTypes';

export class StateService implements IStateService {
  private currentState: GameState;
  private readonly dataService: IDataService;
  private listeners: Array<(state: GameState) => void> = [];

  constructor(dataService: IDataService) {
    this.dataService = dataService;
    this.currentState = this.createInitialState();
  }

  // Subscription methods
  subscribe(callback: (state: GameState) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const currentStateSnapshot = this.getGameState();
    this.listeners.forEach(callback => {
      try {
        callback(currentStateSnapshot);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }

  // State access methods
  getGameState(): GameState {
    // Return copies to prevent external mutations
    return {
      ...this.currentState,
      players: [...this.currentState.players] // Return shallow copy of array
    };
  }

  // Method for when deep cloning is actually needed
  getGameStateDeepCopy(): GameState {
    return {
      ...this.currentState,
      players: this.currentState.players.map(player => ({ ...player, availableCards: { ...player.availableCards }, discardedCards: { ...player.discardedCards } }))
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

    // Ensure data is loaded before creating player with correct starting space
    if (this.dataService && !this.dataService.isLoaded()) {
      console.warn('DataService not loaded yet, using fallback starting space. Consider ensuring data is loaded before adding players.');
    }

    const newPlayer: Player = this.createNewPlayer(name);
    
    const newState: GameState = {
      ...this.currentState,
      players: [...this.currentState.players, newPlayer]
    };

    this.currentState = newState;
    this.notifyListeners();
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
      timeSpent: playerData.time !== undefined ? playerData.time : currentPlayer.timeSpent,
      availableCards: playerData.availableCards ? {
        ...currentPlayer.availableCards,
        ...playerData.availableCards
      } : (playerData.cards ? {
        ...currentPlayer.availableCards,
        ...playerData.cards
      } : currentPlayer.availableCards),
      discardedCards: playerData.discardedCards ? {
        ...currentPlayer.discardedCards,
        ...playerData.discardedCards
      } : currentPlayer.discardedCards
    };

    let newPlayers = [...this.currentState.players];
    newPlayers[playerIndex] = updatedPlayer;

    // Handle avatar/color conflicts intelligently
    newPlayers = this.resolveConflicts(newPlayers);

    const newState: GameState = {
      ...this.currentState,
      players: newPlayers
    };

    this.currentState = newState;
    this.notifyListeners();
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
    this.notifyListeners();
    return { ...newState };
  }

  getPlayer(playerId: string): Player | undefined {
    const player = this.currentState.players.find(p => p.id === playerId);
    return player ? { ...player, availableCards: { ...player.availableCards }, discardedCards: { ...player.discardedCards } } : undefined;
  }

  getAllPlayers(): Player[] {
    return this.currentState.players.map(player => ({ ...player, availableCards: { ...player.availableCards }, discardedCards: { ...player.discardedCards } }));
  }

  // Game flow methods
  setCurrentPlayer(playerId: string): GameState {
    const playerExists = this.currentState.players.some(p => p.id === playerId);
    if (!playerExists) {
      throw new Error(`Player with ID "${playerId}" not found`);
    }

    const player = this.currentState.players.find(p => p.id === playerId);
    console.log(`🎯 StateService.setCurrentPlayer - Setting current player to ${player?.name} (${playerId})`);

    const newState: GameState = {
      ...this.currentState,
      currentPlayerId: playerId
    };

    this.currentState = newState;
    this.notifyListeners();
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
    this.notifyListeners();
    return { ...newState };
  }

  advanceTurn(): GameState {
    const newState: GameState = {
      ...this.currentState,
      turn: this.currentState.turn + 1
    };

    this.currentState = newState;
    this.notifyListeners();
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
      currentPlayerId: nextPlayerId,
      hasPlayerMovedThisTurn: false,
      hasPlayerRolledDice: false
    };

    this.currentState = newState;
    
    // Update action counts for the new current player
    this.updateActionCounts();
    
    return { ...this.currentState };
  }

  // Game lifecycle methods
  initializeGame(): GameState {
    this.currentState = this.createInitialState();
    this.notifyListeners();
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
    
    // Initialize action counts for the first player
    this.updateActionCounts();
    
    return { ...this.currentState };
  }

  endGame(winnerId?: string): GameState {
    const newState: GameState = {
      ...this.currentState,
      gamePhase: 'END',
      gameEndTime: new Date(),
      isGameOver: true,
      winner: winnerId
    };

    this.currentState = newState;
    this.notifyListeners();
    return { ...newState };
  }

  resetGame(): GameState {
    this.currentState = this.createInitialState();
    this.notifyListeners();
    return { ...this.currentState };
  }

  // Utility method to fix players with incorrect starting spaces
  // This can be called after data is loaded to correct any players with wrong starting spaces
  fixPlayerStartingSpaces(): GameState {
    if (!this.dataService || !this.dataService.isLoaded()) {
      console.warn('Cannot fix starting spaces: DataService not loaded');
      return { ...this.currentState };
    }

    const correctStartingSpace = this.getStartingSpace();
    console.log('🔧 Fixing starting spaces. Correct starting space should be:', correctStartingSpace);
    console.log('🔍 Current players before fix:', this.currentState.players.map(p => ({ name: p.name, currentSpace: p.currentSpace })));
    
    const updatedPlayers = this.currentState.players.map(player => {
      // Only fix players who are still on the old incorrect starting space
      if (player.currentSpace === 'START-QUICK-PLAY-GUIDE') {
        console.log(`🔄 Fixing player ${player.name} from ${player.currentSpace} to ${correctStartingSpace}`);
        return {
          ...player,
          currentSpace: correctStartingSpace
        };
      }
      return player;
    });

    const newState: GameState = {
      ...this.currentState,
      players: updatedPlayers
    };

    this.currentState = newState;
    this.notifyListeners();
    
    console.log('✅ Players after fix:', newState.players.map(p => ({ name: p.name, currentSpace: p.currentSpace })));
    return { ...newState };
  }

  // Aggressive method to force reset ALL players to correct starting space
  // This ignores current space and resets everyone
  forceResetAllPlayersToCorrectStartingSpace(): GameState {
    if (!this.dataService || !this.dataService.isLoaded()) {
      console.warn('Cannot force reset starting spaces: DataService not loaded');
      return { ...this.currentState };
    }

    const correctStartingSpace = this.getStartingSpace();
    console.log('🚨 FORCE RESET: Moving all players to:', correctStartingSpace);
    
    const updatedPlayers = this.currentState.players.map(player => {
      console.log(`🔄 FORCE RESET: ${player.name} from ${player.currentSpace} to ${correctStartingSpace}`);
      return {
        ...player,
        currentSpace: correctStartingSpace,
        visitType: 'First' as const // Reset visit type too
      };
    });

    const newState: GameState = {
      ...this.currentState,
      players: updatedPlayers
    };

    this.currentState = newState;
    this.notifyListeners();
    
    console.log('🎯 FORCE RESET COMPLETE. All players now at:', correctStartingSpace);
    return { ...newState };
  }

  setAwaitingChoice(choice: Choice): GameState {
    console.log(`🎯 Setting awaiting choice for player ${choice.playerId}: ${choice.type} - "${choice.prompt}"`);
    
    this.currentState = {
      ...this.currentState,
      awaitingChoice: choice
    };

    this.notifyListeners();
    return this.currentState;
  }

  clearAwaitingChoice(): GameState {
    if (this.currentState.awaitingChoice) {
      console.log(`🎯 Clearing awaiting choice: ${this.currentState.awaitingChoice.id}`);
    }
    
    this.currentState = {
      ...this.currentState,
      awaitingChoice: null
    };

    this.notifyListeners();
    return this.currentState;
  }

  setPlayerHasMoved(): GameState {
    const newState: GameState = {
      ...this.currentState,
      hasPlayerMovedThisTurn: true
    };

    this.currentState = newState;
    
    // Update action counts when player completes actions
    this.updateActionCounts();
    
    return { ...this.currentState };
  }

  setPlayerCompletedManualAction(): GameState {
    console.log(`🎯 Setting hasCompletedManualActions to true for current player`);
    const newState: GameState = {
      ...this.currentState,
      hasCompletedManualActions: true
    };

    this.currentState = newState;
    
    // Update action counts when player completes manual actions
    this.updateActionCounts();
    
    return { ...this.currentState };
  }

  setPlayerHasRolledDice(): GameState {
    const newState: GameState = {
      ...this.currentState,
      hasPlayerRolledDice: true
    };

    this.currentState = newState;
    
    // Update action counts when player completes dice roll
    this.updateActionCounts();
    
    return { ...this.currentState };
  }

  clearPlayerHasMoved(): GameState {
    console.log(`🎯 StateService.clearPlayerHasMoved - Clearing hasPlayerMovedThisTurn flag`);
    const newState: GameState = {
      ...this.currentState,
      hasPlayerMovedThisTurn: false
    };

    this.currentState = newState;
    this.notifyListeners();
    return { ...newState };
  }

  clearPlayerCompletedManualActions(): GameState {
    const newState: GameState = {
      ...this.currentState,
      hasCompletedManualActions: false
    };

    this.currentState = newState;
    this.notifyListeners();
    return { ...newState };
  }

  clearPlayerHasRolledDice(): GameState {
    const newState: GameState = {
      ...this.currentState,
      hasPlayerRolledDice: false
    };

    this.currentState = newState;
    this.notifyListeners();
    return { ...newState };
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

  // Modal management methods
  showCardModal(cardId: string): GameState {
    const newState: GameState = {
      ...this.currentState,
      activeModal: {
        type: 'CARD',
        cardId
      }
    };

    this.currentState = newState;
    this.notifyListeners();
    return { ...newState };
  }

  dismissModal(): GameState {
    const newState: GameState = {
      ...this.currentState,
      activeModal: null
    };

    this.currentState = newState;
    this.notifyListeners();
    return { ...newState };
  }

  // Action tracking methods
  updateActionCounts(): void {
    if (!this.currentState.currentPlayerId) return;
    
    const currentPlayer = this.currentState.players.find(p => p.id === this.currentState.currentPlayerId);
    if (!currentPlayer || !this.dataService.isLoaded()) return;
    
    const actionCounts = this.calculateRequiredActions(currentPlayer);
    console.log(`🎯 Action Counts for ${currentPlayer.name}: Required=${actionCounts.required}, Completed=${actionCounts.completed}, Types=[${actionCounts.availableTypes.join(', ')}]`);
    console.log(`🎯 State: hasPlayerMovedThisTurn=${this.currentState.hasPlayerMovedThisTurn}, hasCompletedManualActions=${this.currentState.hasCompletedManualActions}`);
    
    this.currentState = {
      ...this.currentState,
      requiredActions: actionCounts.required,
      completedActions: actionCounts.completed,
      availableActionTypes: actionCounts.availableTypes
    };
    
    this.notifyListeners();
  }
  
  private calculateRequiredActions(player: Player): { required: number, completed: number, availableTypes: string[] } {
    const availableTypes: string[] = [];
    let required = 0;
    let completed = 0;
    
    try {
      // Check if dice roll is required for this space
      const spaceConfig = this.dataService.getGameConfigBySpace(player.currentSpace);
      if (spaceConfig && spaceConfig.dice === 'true') {
        availableTypes.push('dice');
        required++;
        // Check if dice has been rolled
        if (this.currentState.hasPlayerRolledDice) {
          completed++;
        }
      }
      
      // Check for space effects on this space
      const spaceEffects = this.dataService.getSpaceEffects(player.currentSpace, player.visitType);
      const manualEffects = spaceEffects.filter(effect => effect.trigger_type === 'manual');
      const automaticEffects = spaceEffects.filter(effect => effect.trigger_type !== 'manual');
      
      console.log(`🔍 Found ${spaceEffects.length} space effects for ${player.currentSpace}: Manual=${manualEffects.length}, Automatic=${automaticEffects.length} (automatic effects don't count as separate actions)`);
      spaceEffects.forEach((effect, i) => {
        console.log(`  Effect ${i}: type=${effect.effect_type}, trigger=${effect.trigger_type}, action=${effect.effect_action}`);
      });
      
      // Log automatic effects for debugging, but don't count them as separate actions
      // Automatic effects are triggered by the dice roll and don't require separate player actions
      automaticEffects.forEach((effect, index) => {
        console.log(`  📝 Automatic effect ${index}: ${effect.effect_type} ${effect.effect_action} ${effect.effect_value} (triggered by dice roll)`);
      });

      // Count manual effects (require separate player action)
      manualEffects.forEach(effect => {
        if (effect.effect_type === 'cards') {
          availableTypes.push('cards_manual');
          required++;
          // Manual effects are counted as completed when hasCompletedManualActions is true
          if (this.currentState.hasCompletedManualActions) {
            completed++;
          }
        } else if (effect.effect_type === 'money') {
          availableTypes.push('money_manual');
          required++;
          if (this.currentState.hasCompletedManualActions) {
            completed++;
          }
        } else if (effect.effect_type === 'time') {
          availableTypes.push('time_manual');
          required++;
          if (this.currentState.hasCompletedManualActions) {
            completed++;
          }
        }
      });
      
      // Always require dice roll as a basic action (if not already counted from space config)
      if (!availableTypes.includes('dice')) {
        availableTypes.push('dice_roll');
        required++;
        if (this.currentState.hasPlayerRolledDice) {
          completed++;
        }
      }
      
      // Note: We always have at least the dice roll action, so required should never be 0
      
    } catch (error) {
      console.error('Error calculating required actions:', error);
      // Fallback to basic turn requirements
      return { required: 1, completed: this.currentState.hasPlayerMovedThisTurn ? 1 : 0, availableTypes: ['movement'] };
    }
    
    return { required, completed, availableTypes };
  }

  // Player snapshot methods for negotiation
  createPlayerSnapshot(playerId: string): GameState {
    const player = this.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const snapshot = {
      space: player.currentSpace,
      visitType: player.visitType,
      money: player.money,
      timeSpent: player.timeSpent,
      availableCards: {
        W: [...player.availableCards.W],
        B: [...player.availableCards.B],
        E: [...player.availableCards.E],
        L: [...player.availableCards.L],
        I: [...player.availableCards.I],
      },
      discardedCards: {
        W: [...player.discardedCards.W],
        B: [...player.discardedCards.B],
        E: [...player.discardedCards.E],
        L: [...player.discardedCards.L],
        I: [...player.discardedCards.I],
      }
    };

    console.log(`📸 Creating snapshot for player ${player.name} at ${player.currentSpace}`, snapshot);

    return this.updatePlayer({
      id: playerId,
      spaceEntrySnapshot: snapshot
    });
  }

  restorePlayerSnapshot(playerId: string): GameState {
    const player = this.getPlayer(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    if (!player.spaceEntrySnapshot) {
      throw new Error(`No snapshot exists for player ${playerId}`);
    }

    const snapshot = player.spaceEntrySnapshot;
    console.log(`🔄 Restoring snapshot for player ${player.name}`, snapshot);

    // Restore player state from snapshot
    const restoredState = this.updatePlayer({
      id: playerId,
      currentSpace: snapshot.space,
      visitType: snapshot.visitType,
      money: snapshot.money,
      timeSpent: snapshot.timeSpent,
      availableCards: {
        W: [...snapshot.availableCards.W],
        B: [...snapshot.availableCards.B],
        E: [...snapshot.availableCards.E],
        L: [...snapshot.availableCards.L],
        I: [...snapshot.availableCards.I],
      },
      discardedCards: {
        W: [...snapshot.discardedCards.W],
        B: [...snapshot.discardedCards.B],
        E: [...snapshot.discardedCards.E],
        L: [...snapshot.discardedCards.L],
        I: [...snapshot.discardedCards.I],
      },
      spaceEntrySnapshot: undefined // Clear snapshot after restoring
    });

    return restoredState;
  }

  // Private helper methods
  private createInitialState(): GameState {
    const startingSpace = this.getStartingSpace();
    
    return {
      players: [],
      currentPlayerId: null,
      gamePhase: 'SETUP',
      turn: 0,
      activeModal: null,
      awaitingChoice: null,
      hasPlayerMovedThisTurn: false,
      hasPlayerRolledDice: false,
      isGameOver: false,
      // Initialize action tracking
      requiredActions: 1,
      completedActions: 0,
      availableActionTypes: [],
      hasCompletedManualActions: false
    };
  }

  private createNewPlayer(name: string): Player {
    const startingSpace = this.getStartingSpace();
    const defaultColor = this.getNextAvailableColor();
    const defaultAvatar = this.getNextAvailableAvatar();
    
    return {
      id: this.generatePlayerId(),
      name,
      currentSpace: startingSpace,
      visitType: 'First',
      money: 0, // Players start with no money, get funding from owner and loans later
      timeSpent: 0,
      color: defaultColor,
      avatar: defaultAvatar,
      availableCards: {
        W: [],
        B: [],
        E: [],
        L: [],
        I: []
      },
      activeCards: [],
      discardedCards: {
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
    console.log('🎯 getStartingSpace called');
    console.log('📊 DataService loaded?', this.dataService?.isLoaded());
    
    if (this.dataService && this.dataService.isLoaded()) {
      const gameConfigs = this.dataService.getGameConfig();
      console.log('📋 Game configs loaded:', gameConfigs.length);
      const startingSpace = gameConfigs.find(config => config.is_starting_space);
      console.log('🏁 Found starting space config:', startingSpace);
      if (startingSpace) {
        console.log('✅ Using CSV starting space:', startingSpace.space_name);
        return startingSpace.space_name;
      }
    }
    
    // Updated fallback to use the correct starting space
    console.log('⚠️ Using fallback starting space: OWNER-SCOPE-INITIATION');
    return 'OWNER-SCOPE-INITIATION';
  }

  private getNextAvailableColor(): string {
    const availableColors = [
      '#007bff', '#28a745', '#dc3545', '#fd7e14', 
      '#6f42c1', '#e83e8c', '#20c997', '#ffc107'
    ];
    const usedColors = this.currentState.players.map(p => p.color).filter(Boolean);
    const available = availableColors.filter(color => !usedColors.includes(color));
    return available.length > 0 ? available[0] : availableColors[0];
  }

  private getNextAvailableAvatar(): string {
    const availableAvatars = [
      '👤', '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🔧', 
      '👨‍💻', '👩‍💻', '🧑‍🎨', '👨‍🏫', '👩‍🏫'
    ];
    const usedAvatars = this.currentState.players.map(p => p.avatar).filter(Boolean);
    const available = availableAvatars.filter(avatar => !usedAvatars.includes(avatar));
    return available.length > 0 ? available[0] : availableAvatars[0];
  }

  private resolveConflicts(players: Player[]): Player[] {
    const availableColors = [
      '#007bff', '#28a745', '#dc3545', '#fd7e14', 
      '#6f42c1', '#e83e8c', '#20c997', '#ffc107'
    ];
    const availableAvatars = [
      '👤', '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🔧', 
      '👨‍💻', '👩‍💻', '🧑‍🎨', '👨‍🏫', '👩‍🏫'
    ];

    const result = [...players];
    const usedColors = new Set<string>();
    const usedAvatars = new Set<string>();

    // First pass: collect unique colors and avatars, resolve conflicts
    for (let i = 0; i < result.length; i++) {
      const player = result[i];
      
      // Handle color conflicts
      if (player.color && usedColors.has(player.color)) {
        // Find next available color
        const availableColor = availableColors.find(color => !usedColors.has(color));
        result[i] = { ...player, color: availableColor || availableColors[i % availableColors.length] };
      } else if (player.color) {
        usedColors.add(player.color);
      }

      // Handle avatar conflicts
      if (player.avatar && usedAvatars.has(player.avatar)) {
        // Find next available avatar
        const availableAvatar = availableAvatars.find(avatar => !usedAvatars.has(avatar));
        result[i] = { ...result[i], avatar: availableAvatar || availableAvatars[i % availableAvatars.length] };
      } else if (player.avatar) {
        usedAvatars.add(player.avatar);
      }
    }

    return result;
  }
}