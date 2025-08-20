import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EndGameModal } from '../../../src/components/modals/EndGameModal';
import { IStateService } from '../../../src/types/ServiceContracts';
import { GameState, Player } from '../../../src/types/StateTypes';

// Create mock outside of describe block
const mockStateService: jest.Mocked<IStateService> = {
  getGameState: jest.fn(),
  subscribe: jest.fn(),
  isStateLoaded: jest.fn(),
  addPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  removePlayer: jest.fn(),
  getPlayer: jest.fn(),
  getAllPlayers: jest.fn(),
  setCurrentPlayer: jest.fn(),
  setGamePhase: jest.fn(),
  advanceTurn: jest.fn(),
  nextPlayer: jest.fn(),
  initializeGame: jest.fn(),
  startGame: jest.fn(),
  endGame: jest.fn(),
  resetGame: jest.fn(),
  setAwaitingChoice: jest.fn(),
  clearAwaitingChoice: jest.fn(),
  setPlayerHasMoved: jest.fn(),
  clearPlayerHasMoved: jest.fn(),
  showCardModal: jest.fn(),
  dismissModal: jest.fn(),
  validatePlayerAction: jest.fn(),
  canStartGame: jest.fn(),
};

// Mock the useGameContext hook
jest.mock('../../../src/context/GameContext', () => ({
  useGameContext: () => ({
    stateService: mockStateService,
  }),
}));

describe('EndGameModal', () => {
  let mockPlayer: Player;
  let mockGameState: GameState;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPlayer = {
      id: 'player1',
      name: 'Test Winner',
      currentSpace: 'END-SPACE',
      visitType: 'First',
      money: 1000,
      time: 100,
      cards: {
        W: ['W_001', 'W_002'],
        B: ['B_001'],
        E: [],
        L: ['L_001'],
        I: []
      }
    };

    // Default state - game not over
    mockGameState = {
      players: [mockPlayer],
      currentPlayerId: 'player1',
      gamePhase: 'PLAY',
      turn: 5,
      activeModal: null,
      awaitingChoice: null,
      hasPlayerMovedThisTurn: false,
      isGameOver: false,
      gameEndTime: undefined,
      winner: undefined
    };

    mockStateService.getGameState.mockReturnValue(mockGameState);
    mockStateService.subscribe.mockImplementation((callback) => {
      // Return unsubscribe function
      return jest.fn();
    });
  });

  describe('Modal Visibility', () => {
    it('should not render when game is not over', () => {
      render(<EndGameModal />);
      
      // Modal should not be visible
      expect(screen.queryByText('Game Complete!')).not.toBeInTheDocument();
      expect(screen.queryByText('🏆 Congratulations Test Winner!')).not.toBeInTheDocument();
    });

    it('should render when game is over with a winner', () => {
      // Set up game over state
      const gameOverState = {
        ...mockGameState,
        isGameOver: true,
        winner: 'player1',
        gamePhase: 'END' as const,
        gameEndTime: new Date('2024-12-20T10:30:00Z')
      };

      mockStateService.getGameState.mockReturnValue(gameOverState);

      render(<EndGameModal />);
      
      // Modal should be visible with correct content
      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
      expect(screen.getByText('🏆 Congratulations Test Winner!')).toBeInTheDocument();
      expect(screen.getByText('You have successfully reached an ending space and won the game!')).toBeInTheDocument();
    });

    it('should display unknown player when winner player is not found', () => {
      const gameOverState = {
        ...mockGameState,
        isGameOver: true,
        winner: 'nonexistent-player',
        gamePhase: 'END' as const,
        gameEndTime: new Date('2024-12-20T10:30:00Z')
      };

      mockStateService.getGameState.mockReturnValue(gameOverState);

      render(<EndGameModal />);
      
      expect(screen.getByText('🏆 Congratulations Unknown Player!')).toBeInTheDocument();
    });
  });

  describe('State Subscription', () => {
    it('should subscribe to state changes on mount', () => {
      render(<EndGameModal />);
      
      expect(mockStateService.subscribe).toHaveBeenCalledTimes(1);
      expect(mockStateService.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should initialize with current game state', () => {
      render(<EndGameModal />);
      
      expect(mockStateService.getGameState).toHaveBeenCalledTimes(1);
    });

    it('should update display when state changes to game over', async () => {
      let stateChangeCallback: (state: GameState) => void = jest.fn();
      
      mockStateService.subscribe.mockImplementation((callback) => {
        stateChangeCallback = callback;
        return jest.fn();
      });

      render(<EndGameModal />);
      
      // Initially not visible
      expect(screen.queryByText('Game Complete!')).not.toBeInTheDocument();

      // Trigger state change to game over
      const gameOverState = {
        ...mockGameState,
        isGameOver: true,
        winner: 'player1',
        gamePhase: 'END' as const,
        gameEndTime: new Date('2024-12-20T10:30:00Z')
      };

      stateChangeCallback(gameOverState);

      await waitFor(() => {
        expect(screen.getByText('Game Complete!')).toBeInTheDocument();
        expect(screen.getByText('🏆 Congratulations Test Winner!')).toBeInTheDocument();
      });
    });

    it('should return unsubscribe function when component unmounts', () => {
      const mockUnsubscribe = jest.fn();
      mockStateService.subscribe.mockReturnValue(mockUnsubscribe);

      const { unmount } = render(<EndGameModal />);
      
      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('Game Statistics Display', () => {
    it('should display game end time when available', () => {
      const testDate = new Date('2024-12-20T15:45:30Z');
      const gameOverState = {
        ...mockGameState,
        isGameOver: true,
        winner: 'player1',
        gamePhase: 'END' as const,
        gameEndTime: testDate
      };

      mockStateService.getGameState.mockReturnValue(gameOverState);

      render(<EndGameModal />);
      
      expect(screen.getByText('📊 Game Statistics')).toBeInTheDocument();
      expect(screen.getByText(`Game completed at: ${testDate.toLocaleString()}`)).toBeInTheDocument();
    });

    it('should not display game statistics when game end time is not available', () => {
      const gameOverState = {
        ...mockGameState,
        isGameOver: true,
        winner: 'player1',
        gamePhase: 'END' as const,
        gameEndTime: undefined
      };

      mockStateService.getGameState.mockReturnValue(gameOverState);

      render(<EndGameModal />);
      
      expect(screen.queryByText('📊 Game Statistics')).not.toBeInTheDocument();
    });
  });

  describe('Play Again Functionality', () => {
    it('should call stateService.resetGame when Play Again button is clicked', () => {
      const gameOverState = {
        ...mockGameState,
        isGameOver: true,
        winner: 'player1',
        gamePhase: 'END' as const,
        gameEndTime: new Date()
      };

      mockStateService.getGameState.mockReturnValue(gameOverState);

      render(<EndGameModal />);
      
      const playAgainButton = screen.getByRole('button', { name: /play again/i });
      fireEvent.click(playAgainButton);

      expect(mockStateService.resetGame).toHaveBeenCalledTimes(1);
    });

    it('should handle resetGame errors gracefully', () => {
      const gameOverState = {
        ...mockGameState,
        isGameOver: true,
        winner: 'player1',
        gamePhase: 'END' as const,
        gameEndTime: new Date()
      };

      mockStateService.getGameState.mockReturnValue(gameOverState);
      mockStateService.resetGame.mockImplementation(() => {
        throw new Error('Reset failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<EndGameModal />);
      
      const playAgainButton = screen.getByRole('button', { name: /play again/i });
      fireEvent.click(playAgainButton);

      expect(mockStateService.resetGame).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Error resetting game:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Modal Styling and Interaction', () => {
    it('should render modal with proper overlay and content structure', () => {
      const gameOverState = {
        ...mockGameState,
        isGameOver: true,
        winner: 'player1',
        gamePhase: 'END' as const,
        gameEndTime: new Date()
      };

      mockStateService.getGameState.mockReturnValue(gameOverState);

      render(<EndGameModal />);
      
      // Check for key elements
      expect(screen.getByText('🎉')).toBeInTheDocument(); // Celebration icon
      expect(screen.getByText('Game Complete!')).toBeInTheDocument();
      expect(screen.getByText('🎮 Play Again')).toBeInTheDocument();
      expect(screen.getByText(/Well played! You've mastered the game/)).toBeInTheDocument();
    });

    it('should have proper button hover styling', () => {
      const gameOverState = {
        ...mockGameState,
        isGameOver: true,
        winner: 'player1',
        gamePhase: 'END' as const,
        gameEndTime: new Date()
      };

      mockStateService.getGameState.mockReturnValue(gameOverState);

      render(<EndGameModal />);
      
      const playAgainButton = screen.getByRole('button', { name: /play again/i });
      
      // Test hover effects (mouse enter and leave are handled by React)
      fireEvent.mouseEnter(playAgainButton);
      fireEvent.mouseLeave(playAgainButton);
      
      // Button should still be present and functional
      expect(playAgainButton).toBeInTheDocument();
      fireEvent.click(playAgainButton);
      expect(mockStateService.resetGame).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing winner in game over state', () => {
      const gameOverState = {
        ...mockGameState,
        isGameOver: true,
        winner: undefined,
        gamePhase: 'END' as const,
        gameEndTime: new Date()
      };

      mockStateService.getGameState.mockReturnValue(gameOverState);

      render(<EndGameModal />);
      
      // Modal should not be visible without a winner
      expect(screen.queryByText('Game Complete!')).not.toBeInTheDocument();
    });

    it('should handle empty players array', () => {
      const gameOverState = {
        ...mockGameState,
        players: [],
        isGameOver: true,
        winner: 'player1',
        gamePhase: 'END' as const,
        gameEndTime: new Date()
      };

      mockStateService.getGameState.mockReturnValue(gameOverState);

      render(<EndGameModal />);
      
      expect(screen.getByText('🏆 Congratulations Unknown Player!')).toBeInTheDocument();
    });

    it('should handle multiple players with correct winner identification', () => {
      const player2: Player = {
        ...mockPlayer,
        id: 'player2',
        name: 'Second Player'
      };

      const gameOverState = {
        ...mockGameState,
        players: [mockPlayer, player2],
        isGameOver: true,
        winner: 'player2',
        gamePhase: 'END' as const,
        gameEndTime: new Date()
      };

      mockStateService.getGameState.mockReturnValue(gameOverState);

      render(<EndGameModal />);
      
      expect(screen.getByText('🏆 Congratulations Second Player!')).toBeInTheDocument();
    });
  });
});