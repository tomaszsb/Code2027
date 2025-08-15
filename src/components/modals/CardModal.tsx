// src/components/modals/CardModal.tsx

import React, { useState } from 'react';
import { CardContent } from './CardContent';
import { CardActions } from './CardActions';

/**
 * Card data interface - simplified from the full legacy interface
 */
interface CardData {
  card_name?: string;
  description?: string;
  phase_restriction?: string;
  time_effect?: string;
  money_cost?: string;
  draw_cards?: string;
  immediate_effect?: string;
  [key: string]: any; // Allow for additional properties
}

interface CardModalProps {
  card?: CardData;
  isVisible?: boolean;
  onPlay?: () => void;
  onClose?: () => void;
  canPlay?: boolean;
  title?: string;
}

/**
 * CardModal is the main container component that composes CardContent and CardActions
 * This replaces the legacy CardModalContent with a clean, composable structure
 */
export function CardModal({
  card,
  isVisible = true,
  onPlay = () => console.log('Card played'),
  onClose = () => console.log('Modal closed'),
  canPlay = true,
  title = "Card Details"
}: CardModalProps): JSX.Element | null {
  const [isFlipped, setIsFlipped] = useState(false);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  /**
   * Handle card flip action
   */
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  /**
   * Handle play card action
   */
  const handlePlay = () => {
    if (canPlay) {
      onPlay();
      // Optionally close modal after playing
      // onClose();
    }
  };

  /**
   * Handle close modal action
   */
  const handleClose = () => {
    // Reset flip state when closing
    setIsFlipped(false);
    onClose();
  };

  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  /**
   * Handle escape key to close modal
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #dee2e6',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px 12px 0 0'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#495057'
            }}>
              {isFlipped ? "Card Back" : title}
            </h3>
            
            {/* Close button in header */}
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                color: '#6c757d',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                lineHeight: 1
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e9ecef';
                e.currentTarget.style.color = '#495057';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6c757d';
              }}
              title="Close modal"
            >
              ×
            </button>
          </div>

          {/* Card name subtitle when available */}
          {card?.card_name && !isFlipped && (
            <p style={{
              margin: '8px 0 0',
              fontSize: '14px',
              color: '#6c757d',
              fontStyle: 'italic'
            }}>
              {card.card_name}
            </p>
          )}
        </div>

        {/* Modal Body - CardContent */}
        <div style={{
          flex: 1,
          overflow: 'auto'
        }}>
          <CardContent 
            card={card} 
            isFlipped={isFlipped}
          />
        </div>

        {/* Modal Footer - CardActions */}
        <CardActions
          onPlay={handlePlay}
          onClose={handleClose}
          onFlip={handleFlip}
          canPlay={canPlay && !isFlipped}
          isFlipped={isFlipped}
          playButtonText={card?.immediate_effect ? "Activate Effect" : "Play Card"}
        />
      </div>
    </div>
  );
}