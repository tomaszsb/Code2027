// src/components/modals/CardModal.tsx

import React, { useState, useEffect } from 'react';
import { CardContent } from './CardContent';
import { CardActions } from './CardActions';
import { useGameContext } from '../../context/GameContext';
import { ActiveModal } from '../../types/StateTypes';
import { Card } from '../../types/DataTypes';

/**
 * CardModal is the main container component that composes CardContent and CardActions
 * Now connected to services for real data and state management
 */
export function CardModal(): JSX.Element | null {
  const { stateService, dataService, cardService, gameRulesService } = useGameContext();
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [cardData, setCardData] = useState<Card | null>(null);
  const [canPlay, setCanPlay] = useState(false);
  
  // Subscribe to state changes for modal visibility
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setActiveModal(gameState.activeModal);
      
      // Fetch card data when modal becomes active
      if (gameState.activeModal?.type === 'CARD') {
        const requestedCardId = gameState.activeModal.cardId;
        console.log('🃏 CardModal Debug - Requested card ID:', requestedCardId);
        
        // Ensure DataService is loaded before trying to get cards
        if (!dataService.isLoaded()) {
          console.log('🃏 CardModal Debug - DataService not loaded yet');
          setCardData(null);
          return;
        }

        const cards = dataService.getCards();
        console.log('🃏 CardModal Debug - Available cards:', cards.length);
        console.log('🃏 CardModal Debug - First few card IDs:', cards.slice(0, 5).map(c => c.card_id));
        
        const card = cards.find(c => c.card_id === requestedCardId);
        console.log('🃏 CardModal Debug - Found card:', card);
        setCardData(card || null);
        
        // Check if card can be played
        const currentPlayer = gameState.currentPlayerId;
        if (currentPlayer && card) {
          setCanPlay(gameRulesService.canPlayCard(currentPlayer, card.card_id));
        } else {
          setCanPlay(false);
        }
      } else {
        setCardData(null);
        setCanPlay(false);
      }
    });
    
    // Initialize with current state
    const currentState = stateService.getGameState();
    setActiveModal(currentState.activeModal);
    
    // Also handle initial card data if modal is already active
    if (currentState.activeModal?.type === 'CARD') {
      if (dataService.isLoaded() && currentState.activeModal) {
        const cards = dataService.getCards();
        const card = cards.find(c => c.card_id === currentState.activeModal!.cardId);
        setCardData(card || null);
      }
    }
    
    return unsubscribe;
  }, [stateService, dataService, gameRulesService]);

  // Don't render if modal is not active
  if (!activeModal || activeModal.type !== 'CARD') {
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
    if (canPlay && cardData) {
      const currentPlayer = stateService.getGameState().currentPlayerId;
      if (currentPlayer) {
        try {
          cardService.playCard(currentPlayer, cardData.card_id);
          
          // Mark card play as an action taken (increment action counter)
          console.log('🃏 CardModal.handlePlay - Marking card play action taken');
          stateService.setPlayerHasMoved();
          
          // Close modal after successful play
          handleClose();
        } catch (error: any) {
          console.error('Failed to play card:', error);
          alert(`Cannot play card: ${error.message}`);
        }
      }
    }
  };

  /**
   * Handle close modal action
   */
  const handleClose = () => {
    // Reset flip state when closing
    setIsFlipped(false);
    stateService.dismissModal();
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
              {isFlipped ? "Card Back" : (cardData?.card_name || "Card Details")}
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

          {/* Card type subtitle when available */}
          {cardData?.card_type && !isFlipped && (
            <p style={{
              margin: '8px 0 0',
              fontSize: '14px',
              color: '#6c757d',
              fontStyle: 'italic'
            }}>
              {cardData.card_type} Card
            </p>
          )}
        </div>

        {/* Modal Body - CardContent */}
        <div style={{
          flex: 1,
          overflow: 'auto'
        }}>
          <CardContent 
            card={cardData} 
            isFlipped={isFlipped}
          />
        </div>

        {/* Modal Footer - CardActions */}
        <CardActions
          playerId={stateService.getGameState().currentPlayerId || undefined}
          cardId={cardData?.card_id}
          onPlay={handlePlay}
          onClose={handleClose}
          onFlip={handleFlip}
          canPlay={canPlay && !isFlipped}
          isFlipped={isFlipped}
          playButtonText={cardData?.effects_on_play ? "Activate Effect" : "Play Card"}
        />
      </div>
    </div>
  );
}