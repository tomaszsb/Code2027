/**
 * FinancesSection.test.tsx
 * 
 * Test suite for FinancesSection component
 */

import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinancesSection } from '../../../src/components/player/sections/FinancesSection';
import { createAllMockServices } from '../../mocks/mockServices';
import { Player, GameState } from '../../../types/StateTypes';

describe('FinancesSection', () => {
  const mockServices = createAllMockServices();
  
  const mockPlayer: Player = {
    id: 'player1',
    name: 'Test Player',
    currentSpace: 'START-SPACE',
    visitType: 'First',
    money: 500,
    timeSpent: 0,
    projectScope: 0,
    score: 0,
    color: '#007bff',
    avatar: '👤',
    hand: [],
    activeCards: [],
    turnModifiers: { skipTurns: 0 },
    activeEffects: [],
    loans: []
  };

  const mockGameState: GameState = {
    players: [mockPlayer],
    currentPlayerId: 'player1',
    gamePhase: 'PLAY',
    turn: 1,
    gameRound: 1,
    turnWithinRound: 1,
    globalTurnCount: 1,
    playerTurnCounts: { 'player1': 1 },
    activeModal: null,
    awaitingChoice: null,
    hasPlayerMovedThisTurn: false,
    hasPlayerRolledDice: false,
    isGameOver: false,
    isMoving: false,
    isProcessingArrival: false,
    isInitialized: true,
    currentExplorationSessionId: null,
    requiredActions: 0,
    completedActionCount: 0,
    availableActionTypes: [],
    completedActions: {
      diceRoll: undefined,
      manualActions: {}
    },
    activeNegotiation: null,
    selectedDestination: null,
    globalActionLog: [],
    playerSnapshots: {},
    decks: { W: [], B: [], E: [], L: [], I: [] },
    discardPiles: { W: [], B: [], E: [], L: [], I: [] }
  };

  const defaultProps = {
    gameServices: mockServices,
    playerId: 'player1',
    isExpanded: true,
    onToggle: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();

    // Setup default mock returns
    mockServices.stateService.getPlayer.mockReturnValue(mockPlayer);
    mockServices.stateService.getGameState.mockReturnValue(mockGameState);
    mockServices.dataService.getSpaceEffects.mockReturnValue([]); // Fix: Return empty array by default
  });

  describe('Basic Rendering', () => {
    it('should render the component without crashing', () => {
      render(<FinancesSection {...defaultProps} />);
      expect(screen.getByText('FINANCES')).toBeInTheDocument();
    });

    it('should render the finances icon', () => {
      render(<FinancesSection {...defaultProps} />);
      expect(screen.getByTestId('section-icon')).toBeInTheDocument();
    });

    it('should display current balance', () => {
      render(<FinancesSection {...defaultProps} />);
      expect(screen.getByText('$500')).toBeInTheDocument();
    });

    it('should return null if player not found', () => {
      mockServices.stateService.getPlayer.mockReturnValue(undefined);
      const { container } = render(<FinancesSection {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Action Detection', () => {
    it('should show action indicator when money manual effect available', () => {
      const moneyEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        trigger_type: 'manual',
        effect_type: 'money',
        value: 100,
        description: 'Roll for Money'
      };
      mockServices.dataService.getSpaceEffects.mockReturnValue([moneyEffect]);

      render(<FinancesSection {...defaultProps} />);
      const indicator = screen.getByRole('status', { name: /action available/i });
      expect(indicator).toBeInTheDocument();
    });

    it('should not show action indicator when no actions available', () => {
      render(<FinancesSection {...defaultProps} />);
      const indicator = screen.queryByRole('status', { name: /action available/i });
      expect(indicator).not.toBeInTheDocument();
    });

    it('should show Roll for Money button when action available', () => {
      const moneyEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        trigger_type: 'manual',
        effect_type: 'money',
        value: 100,
        description: 'Roll for Money'
      };
      mockServices.dataService.getSpaceEffects.mockReturnValue([moneyEffect]);

      render(<FinancesSection {...defaultProps} />);
      expect(screen.getByText('Roll for Money')).toBeInTheDocument();
    });

    it('should not show Roll for Money button when action unavailable', () => {
      render(<FinancesSection {...defaultProps} />);
      expect(screen.queryByText('Roll for Money')).not.toBeInTheDocument();
    });
  });

  describe('Roll for Money Action', () => {
    it('should call triggerManualEffectWithFeedback when button clicked', async () => {
      const moneyEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        trigger_type: 'manual',
        effect_type: 'money',
        value: 100,
        description: 'Roll for Money'
      };
      mockServices.dataService.getSpaceEffects.mockReturnValue([moneyEffect]);
      mockServices.turnService.triggerManualEffectWithFeedback.mockResolvedValue({});

      render(<FinancesSection {...defaultProps} />);

      const rollButton = screen.getByText('Roll for Money');
      fireEvent.click(rollButton);

      expect(mockServices.turnService.triggerManualEffectWithFeedback).toHaveBeenCalledWith(
        'player1',
        'money'
      );
    });

    it('should show loading state during roll', async () => {
      const moneyEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        trigger_type: 'manual',
        effect_type: 'money',
        value: 100,
        description: 'Roll for Money'
      };
      mockServices.dataService.getSpaceEffects.mockReturnValue([moneyEffect]);

      let resolveRoll: any;
      mockServices.turnService.triggerManualEffectWithFeedback.mockReturnValue(
        new Promise(resolve => { resolveRoll = resolve; })
      );

      const { container } = render(<FinancesSection {...defaultProps} />);

      const rollButton = screen.getByText('Roll for Money');
      fireEvent.click(rollButton);

      // Should show skeleton loader during loading
      await waitFor(() => {
        expect(container.querySelector('.expandable-section__content--loading')).toBeInTheDocument();
      });

      // Resolve the promise
      resolveRoll({});
    });

    it('should handle roll errors', async () => {
      const moneyEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        trigger_type: 'manual',
        effect_type: 'money',
        value: 100,
        description: 'Roll for Money'
      };
      mockServices.dataService.getSpaceEffects.mockReturnValue([moneyEffect]);
      mockServices.turnService.triggerManualEffectWithFeedback.mockRejectedValue(
        new Error('Roll failed')
      );

      render(<FinancesSection {...defaultProps} />);

      const rollButton = screen.getByText('Roll for Money');
      fireEvent.click(rollButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to perform money action. Please try again.')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      const moneyEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        trigger_type: 'manual',
        effect_type: 'money',
        value: 100,
        description: 'Roll for Money'
      };
      mockServices.dataService.getSpaceEffects.mockReturnValue([moneyEffect]);
      mockServices.turnService.triggerManualEffectWithFeedback.mockRejectedValue(
        new Error('Roll failed')
      );

      render(<FinancesSection {...defaultProps} />);

      const rollButton = screen.getByText('Roll for Money');
      fireEvent.click(rollButton);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('should clear error when retry clicked', async () => {
      const moneyEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        trigger_type: 'manual',
        effect_type: 'money',
        value: 100,
        description: 'Roll for Money'
      };
      mockServices.dataService.getSpaceEffects.mockReturnValue([moneyEffect]);

      // First call fails
      mockServices.turnService.triggerManualEffectWithFeedback.mockRejectedValueOnce(
        new Error('Roll failed')
      );

      render(<FinancesSection {...defaultProps} />);

      const rollButton = screen.getByText('Roll for Money');
      fireEvent.click(rollButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to perform money action. Please try again.')).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      // Error message should be cleared
      expect(screen.queryByText('Failed to perform money action. Please try again.')).not.toBeInTheDocument();
    });
  });

  describe('Expansion State', () => {
    it('should respect isExpanded prop', () => {
      render(<FinancesSection {...defaultProps} isExpanded={false} />);
      const content = screen.getByText(/\$500/i).closest('[role="region"]');
      expect(content).toHaveAttribute('hidden');
    });

    it('should call onToggle when section header clicked', () => {
      const onToggle = vi.fn();
      render(<FinancesSection {...defaultProps} onToggle={onToggle} />);
      
      const header = screen.getByRole('button', { name: /FINANCES/i });
      fireEvent.click(header);
      
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });
});