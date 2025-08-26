// src/components/modals/CardDetailsModal.tsx

import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../context/GameContext';
import { Card } from '../../types/DataTypes';

interface CardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
}

/**
 * CardDetailsModal displays comprehensive information about a specific card
 * including name, description, effects, cost, and other properties.
 */
export function CardDetailsModal({ isOpen, onClose, cardId }: CardDetailsModalProps): JSX.Element | null {
  const { dataService, cardService, stateService } = useGameContext();
  const [cardData, setCardData] = useState<Card | null>(null);
  const [showTransferUI, setShowTransferUI] = useState(false);
  const [selectedTargetPlayer, setSelectedTargetPlayer] = useState<string>('');

  // Fetch card data when modal opens or cardId changes
  useEffect(() => {
    if (isOpen && cardId) {
      if (dataService.isLoaded()) {
        const card = dataService.getCardById(cardId);
        setCardData(card || null);
      }
    }
  }, [isOpen, cardId, dataService]);

  // Handle escape key to close modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get current game state for player information
  const gameState = stateService.getGameState();
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const otherPlayers = gameState.players.filter(p => p.id !== gameState.currentPlayerId);

  // Check if card is transferable
  const isCardTransferable = (cardType: string): boolean => {
    return cardType === 'E' || cardType === 'L';
  };

  // Check if current player owns this card in available cards
  const canTransferCard = (): boolean => {
    if (!currentPlayer || !cardData) return false;
    const cardType = cardService.getCardType(cardId);
    if (!cardType || !isCardTransferable(cardType)) return false;
    
    const availableCards = currentPlayer.availableCards[cardType] || [];
    return availableCards.includes(cardId);
  };

  // Handle transfer card
  const handleTransferCard = async () => {
    if (!currentPlayer || !selectedTargetPlayer) return;
    
    try {
      cardService.transferCard(currentPlayer.id, selectedTargetPlayer, cardId);
      
      // Close modal and transfer UI on success
      setShowTransferUI(false);
      setSelectedTargetPlayer('');
      onClose();
      
    } catch (error: any) {
      alert(`Transfer failed: ${error.message}`);
    }
  };

  // Don't render if modal is not open
  if (!isOpen) {
    return null;
  }

  // Show loading state if card data is not available
  if (!cardData) {
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
            padding: '40px',
            textAlign: 'center'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '1.1rem', color: '#6c757d' }}>
            Loading card details...
          </div>
        </div>
      </div>
    );
  }

  // Get card type for color coding
  const cardType = cardService.getCardType(cardId);
  
  // Card type colors
  const cardTypeColors = {
    W: '#dc3545', // Red for Work cards
    B: '#007bff', // Blue for Bank Loan cards
    I: '#28a745', // Green for Investor Loan cards
    L: '#ffc107', // Yellow for Life Events cards
    E: '#6f42c1'  // Purple for Expeditor cards
  };

  const cardTypeColor = cardType ? cardTypeColors[cardType] : '#6c757d';

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
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '8px'
            }}>
              {/* Card Type Badge */}
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                color: 'white',
                backgroundColor: cardTypeColor
              }}>
                {cardType} Card
              </span>
              
              {/* Card ID */}
              <span style={{
                fontSize: '0.75rem',
                color: '#6c757d',
                fontFamily: 'monospace'
              }}>
                {cardData.card_id}
              </span>
            </div>
            
            <h2 style={{
              margin: 0,
              fontSize: '1.4rem',
              fontWeight: 'bold',
              color: '#212529',
              lineHeight: '1.3'
            }}>
              {cardData.card_name}
            </h2>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
              color: '#6c757d',
              borderRadius: '4px',
              marginLeft: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e9ecef';
              e.currentTarget.style.color = '#495057';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6c757d';
            }}
            title="Close"
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
        <div style={{
          padding: '24px',
          flex: 1,
          overflowY: 'auto'
        }}>
          {/* Card Description */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#495057',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Description
            </h3>
            <p style={{
              fontSize: '0.95rem',
              color: '#212529',
              lineHeight: '1.5',
              margin: 0
            }}>
              {cardData.description || 'No description available.'}
            </p>
          </div>

          {/* Card Effects */}
          {cardData.effects_on_play && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#495057',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Effects When Played
              </h3>
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.9rem',
                color: '#495057',
                fontStyle: 'italic'
              }}>
                {cardData.effects_on_play}
              </div>
            </div>
          )}

          {/* Card Properties */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {/* Cost */}
            {cardData.cost !== undefined && (
              <div>
                <h4 style={{
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  color: '#6c757d',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Cost
                </h4>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: cardData.cost === 0 ? '#28a745' : '#dc3545'
                }}>
                  ${cardData.cost}
                </div>
              </div>
            )}

            {/* Duration */}
            {cardData.duration !== undefined && (
              <div>
                <h4 style={{
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  color: '#6c757d',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Duration
                </h4>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#495057'
                }}>
                  {cardData.duration} turn{cardData.duration !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Phase Restriction */}
            {cardData.phase_restriction && cardData.phase_restriction !== 'Any' && (
              <div>
                <h4 style={{
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  color: '#6c757d',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Phase Restriction
                </h4>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  color: '#6f42c1',
                  background: '#f3f0ff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {cardData.phase_restriction}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transfer UI */}
        {showTransferUI && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #dee2e6',
            backgroundColor: '#fff3cd'
          }}>
            <h4 style={{
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color: '#856404',
              marginBottom: '12px',
              margin: 0
            }}>
              Select player to transfer card to:
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '12px'
            }}>
              {otherPlayers.map((player) => (
                <label
                  key={player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: selectedTargetPlayer === player.id ? '#e3f2fd' : 'transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="targetPlayer"
                    value={player.id}
                    checked={selectedTargetPlayer === player.id}
                    onChange={(e) => setSelectedTargetPlayer(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span style={{
                    fontSize: '1rem',
                    marginRight: '8px'
                  }}>
                    {player.avatar}
                  </span>
                  <span style={{
                    fontWeight: 'bold',
                    color: '#495057'
                  }}>
                    {player.name}
                  </span>
                </label>
              ))}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '16px'
            }}>
              <button
                onClick={() => {
                  setShowTransferUI(false);
                  setSelectedTargetPlayer('');
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#6c757d',
                  backgroundColor: '#e9ecef',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleTransferCard}
                disabled={!selectedTargetPlayer}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: selectedTargetPlayer ? '#fff' : '#6c757d',
                  backgroundColor: selectedTargetPlayer ? '#dc3545' : '#e9ecef',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: selectedTargetPlayer ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease'
                }}
              >
                Transfer Card
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #dee2e6',
          backgroundColor: '#f8f9fa',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {canTransferCard() && !showTransferUI && (
              <button
                onClick={() => setShowTransferUI(true)}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  backgroundColor: '#28a745',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#218838';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#28a745';
                }}
              >
                🔄 Transfer Card
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              color: '#6c757d',
              backgroundColor: '#e9ecef',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dee2e6';
              e.currentTarget.style.color = '#495057';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#e9ecef';
              e.currentTarget.style.color = '#6c757d';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}