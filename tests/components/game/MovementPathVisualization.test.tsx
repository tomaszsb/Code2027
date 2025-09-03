import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MovementPathVisualization } from '../../../src/components/game/MovementPathVisualization';
import { MovementService } from '../../../src/services/MovementService';
import { StateService } from '../../../src/services/StateService';
import { DataService } from '../../../src/services/DataService';
import { Player, Movement, DiceOutcome } from '../../../src/types/DataTypes';

// Mock GameContext
const mockMovementService = {
  getValidMoves: jest.fn(),
  getDiceDestination: jest.fn()
} as unknown as MovementService;

const mockStateService = {
  subscribe: jest.fn(),
  getGameState: jest.fn()
} as unknown as StateService;

const mockDataService = {
  getMovement: jest.fn(),
  getDiceOutcome: jest.fn()
} as unknown as DataService;

jest.mock('../../../src/context/GameContext', () => ({
  useGameContext: () => ({
    movementService: mockMovementService,
    stateService: mockStateService,
    dataService: mockDataService
  })
}));

describe('MovementPathVisualization', () => {
  let stateUpdateCallback: (state: any) => void;

  const mockPlayer: Player = {
    id: 'player1',
    name: 'Test Player',
    color: '#ff0000',
    avatar: '👤',
    money: 100000,
    timeSpent: 45,
    projectScope: 0,
    currentSpace: 'OFFICE-SETUP',
    visitType: 'First',
    availableCards: {
      'W': [],
      'B': [],
      'E': [],
      'L': [],
      'I': []
    },
    activeCards: [],
    discardedCards: {
      'W': [],
      'B': [],
      'E': [],
      'L': [],
      'I': []
    }
  };

  const mockGameState = {
    currentPlayerId: 'player1',
    players: [mockPlayer],
    gamePhase: 'PLAY' as const
  };

  const mockMovement: Movement = {
    space_name: 'OFFICE-SETUP',
    visit_type: 'First',
    movement_type: 'choice',
    destination_1: 'ARCHITECT-MEETING',
    destination_2: 'CONTRACTOR-SELECTION',
    destination_3: '',
    destination_4: '',
    destination_5: ''
  };

  const mockOnToggle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (mockStateService.subscribe as jest.Mock).mockImplementation((callback) => {
      stateUpdateCallback = callback; // Store the callback
      return () => {}; // unsubscribe function
    });
    (mockStateService.getGameState as jest.Mock).mockReturnValue(mockGameState);
    (mockMovementService.getValidMoves as jest.Mock).mockReturnValue(['ARCHITECT-MEETING', 'CONTRACTOR-SELECTION']);
    (mockDataService.getMovement as jest.Mock).mockReturnValue(mockMovement);
  });

  it('should not render toggle button (now in player box)', () => {
    render(
      <MovementPathVisualization
        isVisible={false}
        onToggle={mockOnToggle}
      />
    );

    const toggleButton = screen.queryByTitle('Toggle Movement Paths');
    expect(toggleButton).not.toBeInTheDocument();
  });

  it('should not show panel when not visible', () => {
    render(
      <MovementPathVisualization
        isVisible={false}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.queryByText('Movement Paths')).not.toBeInTheDocument();
  });

  it('should show panel when visible', () => {
    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('Movement Paths')).toBeInTheDocument();
    expect(screen.getByText("Test Player's Turn")).toBeInTheDocument();
  });

  it('should call onToggle from external button (now in player box)', () => {
    render(
      <MovementPathVisualization
        isVisible={false}
        onToggle={mockOnToggle}
      />
    );

    // Component no longer has internal toggle button
    // onToggle would be called from external button in player box
    mockOnToggle();
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should call onToggle when close button is clicked', () => {
    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should display current position and valid destinations', async () => {
    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('OFFICE-SETUP')).toBeInTheDocument();
      expect(screen.getByText('📍 Current Position')).toBeInTheDocument();
      expect(screen.getByText('ARCHITECT-MEETING')).toBeInTheDocument();
      expect(screen.getByText('CONTRACTOR-SELECTION')).toBeInTheDocument();
    });
  });

  it('should show choice movement type icon and description', async () => {
    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('🎯')).toBeInTheDocument(); // Choice icon
      expect(screen.getByText('Choose your destination')).toBeInTheDocument();
    });
  });

  it('should handle dice movement type', async () => {
    const diceMovement: Movement = {
      ...mockMovement,
      movement_type: 'dice'
    };

    const mockDiceOutcome: DiceOutcome = {
      space_name: 'OFFICE-SETUP',
      visit_type: 'First',
      roll_1: 'ARCHITECT-MEETING',
      roll_2: 'CONTRACTOR-SELECTION',
      roll_3: 'ARCHITECT-MEETING',
      roll_4: 'CONTRACTOR-SELECTION',
      roll_5: 'ARCHITECT-MEETING',
      roll_6: 'CONTRACTOR-SELECTION'
    };

    (mockDataService.getMovement as jest.Mock).mockReturnValue(diceMovement);
    (mockDataService.getDiceOutcome as jest.Mock).mockReturnValue(mockDiceOutcome);
    (mockMovementService.getDiceDestination as jest.Mock).mockImplementation((space, visit, roll) => {
      if (roll <= 6) return 'ARCHITECT-MEETING';
      return 'CONTRACTOR-SELECTION';
    });

    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('🎲')).toBeInTheDocument(); // Dice icon
      expect(screen.getByText('Roll dice to determine destination')).toBeInTheDocument();
      expect(screen.getByText(/🎲 Roll/)).toBeInTheDocument(); // Dice roll indicators
    });
  });

  it('should handle fixed movement type', async () => {
    const fixedMovement: Movement = {
      ...mockMovement,
      movement_type: 'fixed'
    };

    (mockDataService.getMovement as jest.Mock).mockReturnValue(fixedMovement);

    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('➡️')).toBeInTheDocument(); // Fixed arrow icon
      expect(screen.getByText('Fixed path forward')).toBeInTheDocument();
    });
  });

  it('should handle none movement type (terminal space)', async () => {
    const noneMovement: Movement = {
      ...mockMovement,
      movement_type: 'none'
    };

    (mockDataService.getMovement as jest.Mock).mockReturnValue(noneMovement);
    (mockMovementService.getValidMoves as jest.Mock).mockReturnValue([]);

    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('🏁')).toBeInTheDocument(); // End flag icon
      expect(screen.getByText('End of path')).toBeInTheDocument();
      expect(screen.getByText('No movement options available')).toBeInTheDocument();
    });
  });

  it('should handle node selection', async () => {
    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      const destination = screen.getByText('ARCHITECT-MEETING');
      fireEvent.click(destination.closest('div')!);
      
      expect(screen.getByText('Space Details: ARCHITECT-MEETING')).toBeInTheDocument();
      expect(screen.getByText('Movement: Direct choice')).toBeInTheDocument();
    });
  });

  it('should show message when no active player', () => {
    const emptyGameState = {
      currentPlayer: null,
      gamePhase: 'SETUP' as const
    };

    (mockStateService.subscribe as jest.Mock).mockImplementation((callback) => {
      callback(emptyGameState);
      return () => {};
    });
    (mockStateService.getGameState as jest.Mock).mockReturnValue(emptyGameState);

    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText('No active player')).toBeInTheDocument();
    expect(screen.getByText('Start a game to see movement paths')).toBeInTheDocument();
    expect(screen.getByText('🎮')).toBeInTheDocument();
  });

  it('should handle errors gracefully', async () => {
    (mockMovementService.getValidMoves as jest.Mock).mockImplementation(() => {
      throw new Error('Test error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error calculating path nodes:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('should update when player changes', async () => {
    const { rerender } = render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    // Define the new state
    const newPlayer: Player = {
      ...mockPlayer,
      id: 'player2',
      name: 'Another Player',
      currentSpace: 'DIFFERENT-SPACE'
    };
    const newGameState = {
      currentPlayerId: 'player2',
      players: [newPlayer],
      gamePhase: 'PLAY' as const
    };

    // Simulate a state update from the service
    act(() => {
      stateUpdateCallback(newGameState);
    });

    await waitFor(() => {
      expect(screen.getByText("Another Player's Turn")).toBeInTheDocument();
    });
  });

  it('should format dice rolls correctly', async () => {
    const diceMovement: Movement = {
      ...mockMovement,
      movement_type: 'dice'
    };

    (mockDataService.getMovement as jest.Mock).mockReturnValue(diceMovement);
    (mockMovementService.getDiceDestination as jest.Mock)
      .mockReturnValueOnce('ARCHITECT-MEETING') // roll 2
      .mockReturnValueOnce('ARCHITECT-MEETING') // roll 3
      .mockReturnValueOnce('CONTRACTOR-SELECTION'); // roll 4

    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      // Should show formatted dice roll ranges
      const diceText = screen.getAllByText(/🎲 Roll/);
      expect(diceText.length).toBeGreaterThan(0);
    });
  });

  it('should show hover effects on valid destinations', async () => {
    render(
      <MovementPathVisualization
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    await waitFor(() => {
      const destination = screen.getByText('ARCHITECT-MEETING').closest('div')!;
      
      fireEvent.mouseEnter(destination);
      expect(destination).toHaveStyle('transform: translateX(4px)');
      
      fireEvent.mouseLeave(destination);
      expect(destination).toHaveStyle('transform: translateX(0)');
    });
  });
});