// src/components/setup/usePlayerValidation.ts

import { useMemo } from 'react';
import { Player } from '../../types/StateTypes';
import { IStateService, IGameRulesService } from '../../types/ServiceContracts';

/**
 * Color option interface
 */
export interface ColorOption {
  color: string;
  name: string;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Available colors for players (from legacy component)
 */
export const AVAILABLE_COLORS: ColorOption[] = [
  { color: '#007bff', name: 'Blue' },
  { color: '#28a745', name: 'Green' },
  { color: '#dc3545', name: 'Red' },
  { color: '#fd7e14', name: 'Orange' },
  { color: '#6f42c1', name: 'Purple' },
  { color: '#e83e8c', name: 'Pink' },
  { color: '#20c997', name: 'Teal' },
  { color: '#ffc107', name: 'Yellow' }
];

/**
 * Available avatars for players (from legacy component)
 */
export const AVAILABLE_AVATARS: string[] = [
  '👤', '👨‍💼', '👩‍💼', '👨‍🔧', '👩‍🔧', 
  '👨‍💻', '👩‍💻', '🧑‍🎨', '👨‍🏫', '👩‍🏫'
];

/**
 * Game settings interface
 */
export interface GameSettings {
  maxPlayers: number;
  winCondition: string;
  difficulty: string;
}

/**
 * Custom hook for player validation logic
 * Encapsulates all validation rules from the legacy component
 * Now uses services for validation instead of local logic
 */
export function usePlayerValidation(
  players: Player[], 
  gameSettings: GameSettings,
  stateService: IStateService,
  gameRulesService: IGameRulesService
) {
  
  /**
   * Check if we can add more players
   */
  const canAddPlayer = useMemo(() => {
    // Remove the stateService call that was causing infinite re-renders
    // The gamePhase check should be handled at the component level, not in validation
    return players.length < gameSettings.maxPlayers;
  }, [players.length, gameSettings.maxPlayers]);

  /**
   * Get available colors (not used by existing players)
   */
  const availableColors = useMemo(() => {
    const usedColors = players.map(p => p.color);
    return AVAILABLE_COLORS.filter(c => !usedColors.includes(c.color));
  }, [players]);

  /**
   * Get available avatars (not used by existing players)
   */
  const availableAvatars = useMemo(() => {
    const usedAvatars = players.map(p => p.avatar);
    return AVAILABLE_AVATARS.filter(a => !usedAvatars.includes(a));
  }, [players]);

  /**
   * Check if we can remove players (must have at least 1)
   */
  const canRemovePlayer = useMemo(() => {
    return players.length > 1;
  }, [players.length]);

  /**
   * Validate if a color can be used by a specific player
   */
  const validateColorChoice = (playerId: string, color: string): ValidationResult => {
    const isUsedByOtherPlayer = players.some(p => p.id !== playerId && p.color === color);
    
    if (isUsedByOtherPlayer) {
      const colorOption = AVAILABLE_COLORS.find(c => c.color === color);
      const colorName = colorOption ? colorOption.name : color;
      return {
        isValid: false,
        errorMessage: `The ${colorName} color is already taken by another player. Please choose a different color.`
      };
    }

    return { isValid: true };
  };

  /**
   * Validate if an avatar can be used by a specific player
   */
  const validateAvatarChoice = (playerId: string, avatar: string): ValidationResult => {
    const isUsedByOtherPlayer = players.some(p => p.id !== playerId && p.avatar === avatar);
    
    if (isUsedByOtherPlayer) {
      return {
        isValid: false,
        errorMessage: `This avatar (${avatar}) is already taken by another player. Please choose a different avatar.`
      };
    }

    return { isValid: true };
  };

  /**
   * Validate if we can add a new player
   */
  const validateAddPlayer = (): ValidationResult => {
    if (!canAddPlayer) {
      return {
        isValid: false,
        errorMessage: `Cannot add more players. Maximum of ${gameSettings.maxPlayers} players allowed.`
      };
    }

    // Remove the strict avatar/color validation since StateService handles assignment gracefully
    // The StateService will automatically assign available colors/avatars or reuse them if needed
    
    return { isValid: true };
  };

  /**
   * Cache StateService validation to avoid calling it on every render
   */
  const canStartGame = useMemo(() => {
    return stateService.canStartGame();
  }, [players.length, stateService]);

  /**
   * Validate if players can start the game
   */
  const validateGameStart = (): ValidationResult => {
    const validPlayers = players.filter(p => p.name.trim());
    
    if (validPlayers.length === 0) {
      return {
        isValid: false,
        errorMessage: 'Please add at least one player with a valid name.'
      };
    }

    // Use cached StateService validation
    if (!canStartGame) {
      return {
        isValid: false,
        errorMessage: 'Game cannot be started. Check player requirements.'
      };
    }

    return { isValid: true };
  };

  /**
   * Get the next available color for a new player
   */
  const getNextAvailableColor = (): string | null => {
    return availableColors.length > 0 ? availableColors[0].color : null;
  };

  /**
   * Get the next available avatar for a new player
   */
  const getNextAvailableAvatar = (): string | null => {
    return availableAvatars.length > 0 ? availableAvatars[0] : null;
  };

  /**
   * Get the next avatar in sequence for cycling
   */
  const getNextAvatar = (currentAvatar: string): string => {
    const currentIndex = AVAILABLE_AVATARS.indexOf(currentAvatar);
    const nextIndex = (currentIndex + 1) % AVAILABLE_AVATARS.length;
    return AVAILABLE_AVATARS[nextIndex];
  };

  /**
   * Get player count summary text
   */
  const getPlayerCountSummary = (): string => {
    const remaining = gameSettings.maxPlayers - players.length;
    return `${players.length}/${gameSettings.maxPlayers} players added${
      remaining > 0 
        ? ` • You can add ${remaining} more player${remaining === 1 ? '' : 's'}` 
        : ' • Maximum reached'
    }`;
  };

  return {
    // Validation functions
    validateColorChoice,
    validateAvatarChoice,
    validateAddPlayer,
    validateGameStart,
    
    // State queries
    canAddPlayer,
    canRemovePlayer,
    availableColors,
    availableAvatars,
    
    // Helper functions
    getNextAvailableColor,
    getNextAvailableAvatar,
    getNextAvatar,
    getPlayerCountSummary,
    
    // Constants
    AVAILABLE_COLORS,
    AVAILABLE_AVATARS
  };
}