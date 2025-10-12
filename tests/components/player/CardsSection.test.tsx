/**
 * CardsSection.test.tsx
 * 
 * Test suite for CardsSection component
 */

import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CardsSection } from '../../../src/components/player/sections/CardsSection';
import { createAllMockServices } from '../../mocks/mockServices';
import { Player, GameState } from '../../../types/StateTypes';

describe('CardsSection', () => {
  const mockServices = createAllMockServices();
  
  const mockPlayer: Player = {
    id: 'player1',
    name: 'Test Player',
    currentSpace: 'START-SPACE',
    visitType: 'First',
    money: 500,
    timeSpent: 10,
    projectScope: 0,
    score: 0,
    color: '#007bff',
    avatar: '👤',
    hand: ['E001', 'E002', 'W001'],
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
    mockServices.dataService.getDiceEffects.mockReturnValue([]); // Fix: Return empty array by default

    // Mock card type detection
    mockServices.cardService.getCardType.mockImplementation((cardId: string) => {
      if (cardId.startsWith('W')) return 'W';
      if (cardId.startsWith('E')) return 'E';
      if (cardId.startsWith('B')) return 'B';
      if (cardId.startsWith('L')) return 'L';
      if (cardId.startsWith('I')) return 'I';
      return null;
    });
  });

  describe('Basic Rendering', () => {
    it('should render the component without crashing', () => {
      render(<CardsSection {...defaultProps} />);
      expect(screen.getByText('CARDS')).toBeInTheDocument();
    });

    it('should display total cards in hand', () => {
      render(<CardsSection {...defaultProps} />);
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 cards total
    });

    it('should display card type counts', () => {
      render(<CardsSection {...defaultProps} />);
      expect(screen.getByText('E:')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 E cards
      expect(screen.getByText('W:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 W card
    });

    it('should return null if player not found', () => {
      mockServices.stateService.getPlayer.mockReturnValue(undefined);
      const { container } = render(<CardsSection {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Action Detection', () => {
    it('should show action indicator when B cards dice effect available', () => {
      const bCardDiceEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'B',
        dice_value: 1,
        value: 1
      };
      mockServices.dataService.getDiceEffects.mockReturnValue([bCardDiceEffect]);

      render(<CardsSection {...defaultProps} onRollDice={vi.fn()} />);
      const indicator = screen.getByRole('status', { name: /action available/i });
      expect(indicator).toBeInTheDocument();
    });

    it('should show action indicator when E cards dice effect available', () => {
      const eCardDiceEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'E',
        dice_value: 1,
        value: 1
      };
      mockServices.dataService.getDiceEffects.mockReturnValue([eCardDiceEffect]);

      render(<CardsSection {...defaultProps} onRollDice={vi.fn()} />);
      const indicator = screen.getByRole('status', { name: /action available/i });
      expect(indicator).toBeInTheDocument();
    });

    it('should show Roll for B Cards button when dice effect available', () => {
      const bCardDiceEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'B',
        dice_value: 1,
        value: 1
      };
      mockServices.dataService.getDiceEffects.mockReturnValue([bCardDiceEffect]);

      render(<CardsSection {...defaultProps} onRollDice={vi.fn()} />);
      expect(screen.getByText('🎲 Roll for B Cards')).toBeInTheDocument();
    });

    it('should show Roll for E Cards button when dice effect available', () => {
      const eCardDiceEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'E',
        dice_value: 1,
        value: 1
      };
      mockServices.dataService.getDiceEffects.mockReturnValue([eCardDiceEffect]);

      render(<CardsSection {...defaultProps} onRollDice={vi.fn()} />);
      expect(screen.getByText('🎲 Roll for E Cards')).toBeInTheDocument();
    });

    it('should show both card buttons when both dice effects available', () => {
      const bCardDiceEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'B',
        dice_value: 1,
        value: 1
      };
      const eCardDiceEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'E',
        dice_value: 1,
        value: 1
      };
      mockServices.dataService.getDiceEffects.mockReturnValue([bCardDiceEffect, eCardDiceEffect]);

      render(<CardsSection {...defaultProps} onRollDice={vi.fn()} />);
      expect(screen.getByText('🎲 Roll for B Cards')).toBeInTheDocument();
      expect(screen.getByText('🎲 Roll for E Cards')).toBeInTheDocument();
    });
  });

  describe('Roll for Cards Actions', () => {
    it('should call onRollDice callback for B cards', async () => {
      const bCardDiceEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'B',
        dice_value: 1,
        value: 1
      };
      mockServices.dataService.getDiceEffects.mockReturnValue([bCardDiceEffect]);
      const onRollDice = vi.fn().mockResolvedValue(undefined);

      render(<CardsSection {...defaultProps} onRollDice={onRollDice} />);

      const rollButton = screen.getByText('🎲 Roll for B Cards');
      fireEvent.click(rollButton);

      expect(onRollDice).toHaveBeenCalled();
    });

    it('should call onRollDice callback for E cards', async () => {
      const eCardDiceEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'E',
        dice_value: 1,
        value: 1
      };
      mockServices.dataService.getDiceEffects.mockReturnValue([eCardDiceEffect]);
      const onRollDice = vi.fn().mockResolvedValue(undefined);

      render(<CardsSection {...defaultProps} onRollDice={onRollDice} />);

      const rollButton = screen.getByText('🎲 Roll for E Cards');
      fireEvent.click(rollButton);

      expect(onRollDice).toHaveBeenCalled();
    });

    it('should handle roll errors', async () => {
      const bCardDiceEffect = {
        space_name: 'START-SPACE',
        visit_type: 'First',
        effect_type: 'cards',
        card_type: 'B',
        dice_value: 1,
        value: 1
      };
      mockServices.dataService.getDiceEffects.mockReturnValue([bCardDiceEffect]);
      const onRollDice = vi.fn().mockRejectedValue(new Error('Roll failed'));

      render(<CardsSection {...defaultProps} onRollDice={onRollDice} />);

      const rollButton = screen.getByText('🎲 Roll for B Cards');
      fireEvent.click(rollButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to roll dice. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('View Discarded Button', () => {
    it('should always show View Discarded button', () => {
      render(<CardsSection {...defaultProps} />);
      expect(screen.getByText('View Discarded')).toBeInTheDocument();
    });

    it('should log when View Discarded clicked (placeholder)', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      render(<CardsSection {...defaultProps} />);
      
      const viewDiscardedButton = screen.getByText('View Discarded');
      fireEvent.click(viewDiscardedButton);

      expect(consoleSpy).toHaveBeenCalledWith('View discarded cards - to be implemented');
    });
  });
});
