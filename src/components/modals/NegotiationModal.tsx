import React, { useState, useEffect } from 'react';
import { useGameContext } from '../../context/GameContext';
import { Player, Card, CardType } from '../../types/DataTypes';

// Types for negotiation state management
interface NegotiationOffer {
  money: number;
  cards: { [key in CardType]: string[] };
}

interface ActiveNegotiation {
  initiatorId: string;
  partnerId: string;
  currentOffer?: NegotiationOffer;
  status: 'selecting_partner' | 'making_offer' | 'awaiting_response' | 'reviewing_offer';
}

// Props interface for the NegotiationModal
interface NegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * NegotiationModal provides a comprehensive interface for player-to-player negotiations.
 * Supports partner selection, offer creation, and offer response handling.
 */
export function NegotiationModal({ isOpen, onClose }: NegotiationModalProps): JSX.Element | null {
  const { stateService, dataService, negotiationService } = useGameContext();
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  
  // Negotiation state
  const [negotiation, setNegotiation] = useState<ActiveNegotiation | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [offer, setOffer] = useState<NegotiationOffer>({
    money: 0,
    cards: { W: [], B: [], E: [], L: [], I: [] }
  });

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = stateService.subscribe((gameState) => {
      setCurrentPlayerId(gameState.currentPlayerId);
      setPlayers(gameState.players);
      
      // For demo purposes, show modal when negotiation button is clicked
      // In future, this would be based on gameState.activeModal or similar
    });
    
    // Initialize with current state
    const gameState = stateService.getGameState();
    setCurrentPlayerId(gameState.currentPlayerId);
    setPlayers(gameState.players);
    
    // Load available cards
    const cards = dataService.getCards();
    setAvailableCards(cards);
    
    return unsubscribe;
  }, [stateService, dataService]);

  // Get current player and available partners
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const availablePartners = players.filter(p => p.id !== currentPlayerId);

  const handleStartNegotiation = () => {
    if (!currentPlayerId) return;
    
    setNegotiation({
      initiatorId: currentPlayerId,
      partnerId: '',
      status: 'selecting_partner'
    });
    // No need to set visibility - controlled by parent props
  };

  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setNegotiation(prev => prev ? {
      ...prev,
      partnerId,
      status: 'making_offer'
    } : null);
    
    // Initialize negotiation with service
    if (currentPlayerId) {
      negotiationService.initiateNegotiation(currentPlayerId, partnerId);
    }
  };

  const handleOfferChange = (type: 'money' | 'cards', value: any, cardType?: CardType, cardId?: string) => {
    setOffer(prev => {
      if (type === 'money') {
        return { ...prev, money: Math.max(0, value) };
      } else if (type === 'cards' && cardType && cardId) {
        const newCards = { ...prev.cards };
        const cardList = [...newCards[cardType]];
        const existingIndex = cardList.indexOf(cardId);
        
        if (existingIndex >= 0) {
          // Remove card if already selected
          cardList.splice(existingIndex, 1);
        } else {
          // Add card if not selected
          cardList.push(cardId);
        }
        
        newCards[cardType] = cardList;
        return { ...prev, cards: newCards };
      }
      return prev;
    });
  };

  const handleMakeOffer = () => {
    if (!negotiation) return;
    
    setNegotiation(prev => prev ? {
      ...prev,
      currentOffer: offer,
      status: 'awaiting_response'
    } : null);
    
    negotiationService.makeOffer(negotiation.initiatorId, offer);
  };

  const handleAcceptOffer = () => {
    if (!negotiation || !currentPlayerId) return;
    
    negotiationService.acceptOffer(currentPlayerId);
    handleCloseModal();
  };

  const handleDeclineOffer = () => {
    if (!negotiation || !currentPlayerId) return;
    
    negotiationService.declineOffer(currentPlayerId);
    setNegotiation(prev => prev ? {
      ...prev,
      currentOffer: undefined,
      status: 'making_offer'
    } : null);
  };

  const handleCloseModal = () => {
    setNegotiation(null);
    setSelectedPartnerId('');
    setOffer({ money: 0, cards: { W: [], B: [], E: [], L: [], I: [] } });
    onClose(); // Call parent's close handler
  };

  const getPlayerCardsByType = (player: Player, cardType: CardType): string[] => {
    return player.availableCards[cardType] || [];
  };

  const getCardName = (cardId: string): string => {
    const card = availableCards.find(c => c.card_id === cardId);
    return card?.card_name || cardId;
  };

  const getTotalOfferValue = (): number => {
    let total = offer.money;
    Object.values(offer.cards).forEach(cardList => {
      cardList.forEach(cardId => {
        const card = availableCards.find(c => c.card_id === cardId);
        total += card?.cost || 0;
      });
    });
    return total;
  };

  // Initialize negotiation when modal opens
  useEffect(() => {
    if (isOpen && !negotiation) {
      handleStartNegotiation();
    }
  }, [isOpen, negotiation]);

  // Don't render if not open or if required data is missing
  if (!isOpen || !currentPlayer) {
    return null;
  }

  // Show loading state if negotiation hasn't been initialized yet
  if (!negotiation) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          fontSize: '18px',
          color: '#333'
        }}>
          🤝 Initializing negotiation...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90%',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '2px solid #e9ecef',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
            🤝 Negotiation
          </h2>
          <button
            onClick={handleCloseModal}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6c757d',
              padding: '0',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Partner Selection */}
          {negotiation.status === 'selecting_partner' && (
            <div>
              <h3 style={{ marginTop: 0, color: '#333' }}>Select a player to negotiate with:</h3>
              <div style={{ display: 'grid', gap: '12px', marginTop: '16px' }}>
                {availablePartners.map(partner => (
                  <div
                    key={partner.id}
                    onClick={() => handleSelectPartner(partner.id)}
                    style={{
                      padding: '16px',
                      border: '2px solid #dee2e6',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s ease',
                      backgroundColor: selectedPartnerId === partner.id ? '#e3f2fd' : '#fff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#007bff';
                      e.currentTarget.style.backgroundColor = '#f8f9ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = selectedPartnerId === partner.id ? '#007bff' : '#dee2e6';
                      e.currentTarget.style.backgroundColor = selectedPartnerId === partner.id ? '#e3f2fd' : '#fff';
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: partner.color || '#007bff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      {partner.avatar || partner.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                        {partner.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        💰 ${partner.money} | ⏰ {partner.timeSpent} minutes
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Making Offer */}
          {negotiation.status === 'making_offer' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>
                  Making offer to: {players.find(p => p.id === negotiation.partnerId)?.name}
                </h3>
              </div>

              {/* Money Offer */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  💰 Money Offer:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>$</span>
                  <input
                    type="number"
                    min="0"
                    max={currentPlayer.money}
                    value={offer.money}
                    onChange={(e) => handleOfferChange('money', parseInt(e.target.value) || 0)}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid #dee2e6',
                      borderRadius: '6px',
                      fontSize: '16px',
                      width: '120px'
                    }}
                  />
                  <span style={{ color: '#666' }}>
                    (Available: ${currentPlayer.money})
                  </span>
                </div>
              </div>

              {/* Card Offer */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  🃏 Card Offer:
                </label>
                {(['W', 'B', 'E', 'L', 'I'] as CardType[]).map(cardType => {
                  const playerCards = getPlayerCardsByType(currentPlayer, cardType);
                  if (playerCards.length === 0) return null;

                  return (
                    <div key={cardType} style={{ marginBottom: '16px' }}>
                      <h4 style={{ marginBottom: '8px', color: '#555' }}>
                        {cardType} Cards ({playerCards.length} available):
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {playerCards.map(cardId => {
                          const isSelected = offer.cards[cardType].includes(cardId);
                          return (
                            <button
                              key={cardId}
                              onClick={() => handleOfferChange('cards', null, cardType, cardId)}
                              style={{
                                padding: '8px 12px',
                                border: `2px solid ${isSelected ? '#28a745' : '#dee2e6'}`,
                                borderRadius: '6px',
                                backgroundColor: isSelected ? '#d4edda' : '#fff',
                                cursor: 'pointer',
                                fontSize: '14px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {getCardName(cardId)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Offer Summary */}
              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <h4 style={{ marginTop: 0, color: '#333' }}>Offer Summary:</h4>
                <div style={{ color: '#666' }}>
                  💰 Money: ${offer.money}
                </div>
                {Object.entries(offer.cards).map(([cardType, cardIds]) => {
                  if (cardIds.length === 0) return null;
                  return (
                    <div key={cardType} style={{ color: '#666' }}>
                      🃏 {cardType} Cards: {cardIds.map(getCardName).join(', ')}
                    </div>
                  );
                })}
                <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#333' }}>
                  Estimated Total Value: ${getTotalOfferValue()}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setNegotiation(prev => prev ? { ...prev, status: 'selecting_partner' } : null)}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #6c757d',
                    backgroundColor: '#fff',
                    color: '#6c757d',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleMakeOffer}
                  disabled={getTotalOfferValue() === 0}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    backgroundColor: getTotalOfferValue() > 0 ? '#28a745' : '#e9ecef',
                    color: getTotalOfferValue() > 0 ? '#fff' : '#6c757d',
                    borderRadius: '6px',
                    cursor: getTotalOfferValue() > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  Make Offer 💫
                </button>
              </div>
            </div>
          )}

          {/* Awaiting Response */}
          {negotiation.status === 'awaiting_response' && negotiation.currentOffer && (
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ color: '#333' }}>
                Offer sent to {players.find(p => p.id === negotiation.partnerId)?.name}
              </h3>
              <div style={{
                padding: '20px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '12px' }}>⏳ Waiting for response...</div>
                <div style={{ color: '#856404' }}>
                  Your offer: ${negotiation.currentOffer.money} + cards worth ~${getTotalOfferValue() - negotiation.currentOffer.money}
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #6c757d',
                  backgroundColor: '#fff',
                  color: '#6c757d',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Close
              </button>
            </div>
          )}

          {/* Reviewing Incoming Offer */}
          {negotiation.status === 'reviewing_offer' && negotiation.currentOffer && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>
                  📨 Incoming offer from: {players.find(p => p.id === negotiation.initiatorId)?.name}
                </h3>
              </div>

              {/* Offer Details */}
              <div style={{
                padding: '20px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '2px solid #2196f3'
              }}>
                <h4 style={{ marginTop: 0, color: '#333', marginBottom: '16px' }}>
                  🎁 They are offering:
                </h4>
                
                {/* Money Offer */}
                {negotiation.currentOffer.money > 0 && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '24px' }}>💰</span>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>
                        ${negotiation.currentOffer.money}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>Cash payment</div>
                    </div>
                  </div>
                )}

                {/* Card Offers */}
                {Object.entries(negotiation.currentOffer.cards).map(([cardType, cardIds]) => {
                  if (cardIds.length === 0) return null;
                  return (
                    <div
                      key={cardType}
                      style={{
                        padding: '12px',
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        marginBottom: '12px'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '24px' }}>🃏</span>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                            {cardType} Cards ({cardIds.length})
                          </div>
                        </div>
                      </div>
                      <div style={{ paddingLeft: '36px' }}>
                        {cardIds.map(cardId => (
                          <div
                            key={cardId}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '4px',
                              marginBottom: '4px',
                              fontSize: '14px',
                              color: '#555'
                            }}
                          >
                            {getCardName(cardId)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Total Value */}
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>
                    Total Estimated Value: ${getTotalOfferValue()}
                  </div>
                </div>
              </div>

              {/* Your Current Resources */}
              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <h4 style={{ marginTop: 0, color: '#333' }}>📊 Your Current Resources:</h4>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ color: '#666' }}>
                    💰 Money: ${currentPlayer.money}
                  </div>
                  <div style={{ color: '#666' }}>
                    ⏰ Time: {currentPlayer.timeSpent} minutes
                  </div>
                  {(['W', 'B', 'E', 'L', 'I'] as CardType[]).map(cardType => {
                    const cardCount = getPlayerCardsByType(currentPlayer, cardType).length;
                    if (cardCount === 0) return null;
                    return (
                      <div key={cardType} style={{ color: '#666' }}>
                        🃏 {cardType}: {cardCount} cards
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Decision Prompt */}
              <div style={{
                padding: '20px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#856404', marginBottom: '8px' }}>
                  🤔 What's your decision?
                </div>
                <div style={{ color: '#856404' }}>
                  This offer will be added to your resources if you accept.
                </div>
              </div>

              {/* Response Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={handleDeclineOffer}
                  style={{
                    padding: '16px 32px',
                    border: '2px solid #dc3545',
                    backgroundColor: '#fff',
                    color: '#dc3545',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.color = '#dc3545';
                  }}
                >
                  ❌ Decline Offer
                </button>
                <button
                  onClick={handleAcceptOffer}
                  style={{
                    padding: '16px 32px',
                    border: '2px solid #28a745',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#218838';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#28a745';
                  }}
                >
                  ✅ Accept Offer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}