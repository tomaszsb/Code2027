import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DiceResultModal, DiceRollResult } from '../../../src/components/modals/DiceResultModal';

describe('DiceResultModal', () => {
  const mockResult: DiceRollResult = {
    diceValue: 4,
    spaceName: 'TEST-SPACE',
    effects: [
      {
        type: 'money',
        description: 'Project funding received',
        value: 50000
      },
      {
        type: 'cards',
        description: 'Draw bank loan cards',
        cardType: 'B',
        cardCount: 2
      }
    ],
    summary: 'Good roll! You received funding and business opportunities.',
    hasChoices: false
  };

  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
  });

  it('should render when open with valid result', () => {
    render(
      <DiceResultModal 
        isOpen={true}
        result={mockResult}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Dice Roll: 4')).toBeInTheDocument();
    expect(screen.getByText('On TEST-SPACE')).toBeInTheDocument();
    expect(screen.getByText('Effects Applied:')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <DiceResultModal 
        isOpen={false}
        result={mockResult}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Dice Roll: 4')).not.toBeInTheDocument();
  });

  it('should not render when result is null', () => {
    render(
      <DiceResultModal 
        isOpen={true}
        result={null}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Dice Roll:')).not.toBeInTheDocument();
  });

  it('should display money effects with proper formatting', () => {
    render(
      <DiceResultModal 
        isOpen={true}
        result={mockResult}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('+$50K')).toBeInTheDocument();
    expect(screen.getByText('Project funding received')).toBeInTheDocument();
  });

  it('should display card effects correctly', () => {
    render(
      <DiceResultModal 
        isOpen={true}
        result={mockResult}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('+2 B cards')).toBeInTheDocument();
    expect(screen.getByText('Draw bank loan cards')).toBeInTheDocument();
  });

  it('should display summary when provided', () => {
    render(
      <DiceResultModal 
        isOpen={true}
        result={mockResult}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Summary:')).toBeInTheDocument();
    expect(screen.getByText('Good roll! You received funding and business opportunities.')).toBeInTheDocument();
  });

  it('should call onClose when Continue button is clicked', () => {
    render(
      <DiceResultModal 
        isOpen={true}
        result={mockResult}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Continue'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    render(
      <DiceResultModal 
        isOpen={true}
        result={mockResult}
        onClose={mockOnClose}
      />
    );

    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle results with choices', () => {
    const choiceResult: DiceRollResult = {
      ...mockResult,
      hasChoices: true,
      summary: 'You must choose your next move!'
    };

    render(
      <DiceResultModal 
        isOpen={true}
        result={choiceResult}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Make Choice')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Make Choice'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should display message when no effects', () => {
    const noEffectsResult: DiceRollResult = {
      diceValue: 3,
      spaceName: 'BORING-SPACE',
      effects: [],
      summary: '',
      hasChoices: false
    };

    render(
      <DiceResultModal 
        isOpen={true}
        result={noEffectsResult}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('No special effects this turn')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    render(
      <DiceResultModal 
        isOpen={true}
        result={mockResult}
        onClose={mockOnClose}
      />
    );

    const dialog = screen.getByRole('dialog');
    
    // Test Escape key
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display time effects with proper formatting', () => {
    const timeResult: DiceRollResult = {
      diceValue: 2,
      spaceName: 'TIME-SPACE',
      effects: [
        {
          type: 'time',
          description: 'Project delayed',
          value: -3
        }
      ],
      summary: '',
      hasChoices: false
    };

    render(
      <DiceResultModal 
        isOpen={true}
        result={timeResult}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('-3 days')).toBeInTheDocument();
    expect(screen.getByText('Project delayed')).toBeInTheDocument();
  });
});