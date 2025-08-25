// src/components/game/CardPortfolioDashboard.tsx

import React, { useState } from 'react';
import { Player } from '../../types/StateTypes';
import { useGameContext } from '../../context/GameContext';

interface CardPortfolioDashboardProps {
  player: Player;
  isCurrentPlayer: boolean;
  onOpenCardDetailsModal: (cardId: string) => void;
}

/**
 * CardPortfolioDashboard provides detailed card portfolio distribution
 * showing available cards (with play buttons), active cards (with expiration tracking), 
 * and discarded cards.
 */
export function CardPortfolioDashboard({ player, isCurrentPlayer, onOpenCardDetailsModal }: CardPortfolioDashboardProps): JSX.Element {
  const { dataService, cardService, stateService } = useGameContext();
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');


  // Calculate card portfolio distribution
  const calculateCardPortfolio = () => {
    return {
      available: {
        W: player.availableCards?.W?.length || 0,
        B: player.availableCards?.B?.length || 0,
        I: player.availableCards?.I?.length || 0,
        L: player.availableCards?.L?.length || 0,
        E: player.availableCards?.E?.length || 0
      },
      active: player.activeCards?.length || 0,
      discarded: {
        W: player.discardedCards?.W?.length || 0,
        B: player.discardedCards?.B?.length || 0,
        I: player.discardedCards?.I?.length || 0,
        L: player.discardedCards?.L?.length || 0,
        E: player.discardedCards?.E?.length || 0
      }
    };
  };

  const cardPortfolio = calculateCardPortfolio();

  // Handle card play with feedback
  const handlePlayCard = async (cardId: string, cardName: string) => {
    try {
      console.log(`Playing card ${cardId} for player ${player.name}`);
      cardService.playCard(player.id, cardId);
      
      // Show success feedback
      setFeedbackType('success');
      setFeedbackMessage(`Successfully played: ${cardName}`);
      
      // Clear feedback after 4 seconds
      setTimeout(() => {
        setFeedbackMessage('');
        setFeedbackType('');
      }, 4000);
      
    } catch (error: any) {
      console.error('Failed to play card:', error);
      
      // Show error feedback
      setFeedbackType('error');
      setFeedbackMessage(error.message || 'Failed to play card');
      
      // Clear feedback after 5 seconds for errors
      setTimeout(() => {
        setFeedbackMessage('');
        setFeedbackType('');
      }, 5000);
    }
  };

  const containerStyle = {
    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '12px',
    border: '2px solid #dee2e6',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  };

  const sectionStyle = {
    marginBottom: '16px',
    padding: '12px',
    background: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  };

  const sectionTitleStyle = {
    fontSize: '0.85rem',
    fontWeight: 'bold' as const,
    color: '#495057',
    marginBottom: '8px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  };

  const metricLabelStyle = {
    fontSize: '0.8rem',
    color: '#6c757d'
  };


  const cardTypeStyle = {
    display: 'inline-block',
    minWidth: '28px',
    padding: '4px 8px',
    margin: '2px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    color: 'white'
  };

  const cardTypeColors = {
    W: '#dc3545', // Red for Work cards
    B: '#007bff', // Blue for Business cards
    I: '#28a745', // Green for Innovation cards
    L: '#ffc107', // Yellow for Legal cards
    E: '#6f42c1'  // Purple for External cards
  };

  return (
    <div style={containerStyle}>
      {/* Feedback Message */}
      {feedbackMessage && (
        <div style={{
          padding: '8px 12px',
          marginBottom: '12px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          textAlign: 'center',
          border: '2px solid',
          backgroundColor: feedbackType === 'success' ? '#d4edda' : '#f8d7da',
          borderColor: feedbackType === 'success' ? '#28a745' : '#dc3545',
          color: feedbackType === 'success' ? '#155724' : '#721c24',
          animation: 'fadeIn 0.3s ease-in'
        }}>
          {feedbackType === 'success' ? '✅' : '❌'} {feedbackMessage}
        </div>
      )}
      
      {/* Card Portfolio Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          🎯 Card Portfolio
        </div>
        
        {/* Available Cards */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 'bold' as const,
            color: '#495057',
            marginBottom: '6px',
            textTransform: 'uppercase' as const
          }}>
            Available Cards
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '6px'
          }}>
            {Object.entries(player.availableCards || {}).map(([cardType, cardIds]) => 
              cardIds && cardIds.length > 0 ? (
                <div key={`available-${cardType}`} style={{ marginBottom: '8px' }}>
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    color: cardTypeColors[cardType as keyof typeof cardTypeColors],
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                  }}>
                    {cardType} Cards ({cardIds.length})
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap' as const,
                    gap: '4px'
                  }}>
                    {cardIds.map((cardId, index) => {
                      // Get card data for better display
                      const cardData = dataService.getCardById(cardId);
                      const cardDisplayName = cardData?.card_name || `${cardType} Card ${index + 1}`;
                      const isTransferable = cardType === 'E' || cardType === 'L';
                      
                      return (
                        <div
                          key={cardId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '0.7rem'
                          }}
                        >
                          <span 
                            style={{
                              ...cardTypeStyle,
                              backgroundColor: cardTypeColors[cardType as keyof typeof cardTypeColors],
                              minWidth: 'auto',
                              padding: '2px 6px',
                              margin: 0,
                              fontSize: '0.65rem',
                              cursor: 'pointer',
                              position: 'relative'
                            }}
                            onClick={() => onOpenCardDetailsModal(cardId)}
                            title={`View details: ${cardDisplayName}${isTransferable ? ' • Transferable' : ''}`}
                          >
                            {cardType}{index + 1}
                            {isTransferable && (
                              <span style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                borderRadius: '50%',
                                width: '12px',
                                height: '12px',
                                fontSize: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                              }}>
                                🔄
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => handlePlayCard(cardId, cardDisplayName)}
                            disabled={!isCurrentPlayer}
                            style={{
                              padding: '2px 6px',
                              fontSize: '0.65rem',
                              fontWeight: 'bold',
                              color: isCurrentPlayer ? '#fff' : '#6c757d',
                              backgroundColor: isCurrentPlayer ? '#28a745' : '#e9ecef',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: isCurrentPlayer ? 'pointer' : 'not-allowed',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (isCurrentPlayer) {
                                e.currentTarget.style.backgroundColor = '#218838';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isCurrentPlayer) {
                                e.currentTarget.style.backgroundColor = '#28a745';
                              }
                            }}
                            title={isCurrentPlayer ? `Play: ${cardDisplayName}` : 'Wait for your turn'}
                          >
                            Play
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
            {/* Show message if no cards available */}
            {Object.values(player.availableCards || {}).every(cards => !cards || cards.length === 0) && (
              <div style={{
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '0.75rem',
                fontStyle: 'italic',
                padding: '12px'
              }}>
                No cards available to play
              </div>
            )}
          </div>
        </div>

        {/* Active Cards */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 'bold' as const,
            color: '#495057',
            marginBottom: '6px',
            textTransform: 'uppercase' as const
          }}>
            Active Cards ({player.activeCards?.length || 0})
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '6px'
          }}>
            {player.activeCards && player.activeCards.length > 0 ? (
              player.activeCards.map((activeCard, index) => {
                // Get card data for better display
                const cardData = dataService.getCardById(activeCard.cardId);
                const cardDisplayName = cardData?.card_name || `Card ${index + 1}`;
                const cardType = cardService.getCardType(activeCard.cardId);
                
                // Calculate remaining duration
                const gameState = stateService.getGameState();
                const remainingTurns = Math.max(0, activeCard.expirationTurn - gameState.turn);
                
                return (
                  <div
                    key={activeCard.cardId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8f9fa',
                      border: '2px solid #ffc107',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '0.7rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        style={{
                          ...cardTypeStyle,
                          backgroundColor: cardType ? cardTypeColors[cardType] : '#6c757d',
                          minWidth: 'auto',
                          padding: '2px 6px',
                          margin: 0,
                          fontSize: '0.65rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => onOpenCardDetailsModal(activeCard.cardId)}
                        title={`View details: ${cardDisplayName}`}
                      >
                        {cardType || '?'}
                      </span>
                      <span 
                        style={{
                          fontWeight: 'bold',
                          color: '#495057',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer'
                        }} 
                        title={`View details: ${cardDisplayName}`}
                        onClick={() => onOpenCardDetailsModal(activeCard.cardId)}
                      >
                        {cardDisplayName}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span style={{
                        fontSize: '0.65rem',
                        color: remainingTurns > 1 ? '#28a745' : remainingTurns === 1 ? '#ffc107' : '#dc3545',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: remainingTurns > 1 ? '#d4edda' : remainingTurns === 1 ? '#fff3cd' : '#f8d7da'
                      }}>
                        ⏳ {remainingTurns} turn{remainingTurns !== 1 ? 's' : ''} left
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '0.75rem',
                fontStyle: 'italic',
                padding: '12px'
              }}>
                No active cards
              </div>
            )}
          </div>
        </div>

        {/* Discarded Cards */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 'bold' as const,
            color: '#495057',
            marginBottom: '6px',
            textTransform: 'uppercase' as const
          }}>
            Discarded Cards
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '4px',
            alignItems: 'center'
          }}>
            {Object.entries(cardPortfolio.discarded).map(([cardType, count]) => (
              <div
                key={`discarded-${cardType}`}
                style={{
                  ...cardTypeStyle,
                  backgroundColor: cardTypeColors[cardType as keyof typeof cardTypeColors],
                  cursor: count > 0 ? 'pointer' : 'default',
                  opacity: count > 0 ? 0.7 : 0.2,
                  textDecoration: count > 0 ? 'line-through' : 'none'
                }}
                onClick={() => {
                  if (count > 0) {
                    console.log(`Showing discarded ${cardType} cards for player ${player.name}`);
                  }
                }}
              >
                {cardType}: {count}
              </div>
            ))}
          </div>
        </div>

        {/* Total Summary */}
        <div style={{
          ...metricLabelStyle,
          textAlign: 'center' as const,
          borderTop: '1px solid #dee2e6',
          paddingTop: '8px',
          marginTop: '8px'
        }}>
          Total: {
            Object.values(cardPortfolio.available).reduce((sum, count) => sum + count, 0) +
            cardPortfolio.active +
            Object.values(cardPortfolio.discarded).reduce((sum, count) => sum + count, 0)
          } cards
        </div>
      </div>
    </div>
  );
}