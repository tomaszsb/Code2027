import React, { useState } from 'react';
import { Player, CardType } from '../../types/DataTypes';
import { Card } from '../../types/DataTypes';
import { useGameContext } from '../../context/GameContext';
import { FormatUtils } from '../../utils/FormatUtils';

interface CardReplacementModalProps {
  isOpen: boolean;
  player: Player | null;
  cardType: CardType;
  maxReplacements: number;
  onReplace: (selectedCardIds: string[], newCardType: CardType) => void;
  onCancel: () => void;
}

/**
 * CardReplacementModal allows players to select which cards to replace
 * Matches the functionality from code2026's CardReplacementModal
 */
export function CardReplacementModal({
  isOpen,
  player,
  cardType,
  maxReplacements,
  onReplace,
  onCancel
}: CardReplacementModalProps): JSX.Element | null {
  const { dataService } = useGameContext();
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [replacementCardType, setReplacementCardType] = useState<CardType>('W');

  if (!isOpen || !player) {
    return null;
  }

  const availableCards = player.availableCards[cardType] || [];
  const canReplace = selectedCardIds.length > 0 && selectedCardIds.length <= maxReplacements;

  const handleCardToggle = (cardId: string) => {
    setSelectedCardIds(prev => {
      const isSelected = prev.includes(cardId);
      if (isSelected) {
        return prev.filter(id => id !== cardId);
      } else if (prev.length < maxReplacements) {
        return [...prev, cardId];
      }
      return prev;
    });
  };

  const handleConfirm = () => {
    if (canReplace) {
      onReplace(selectedCardIds, replacementCardType);
      setSelectedCardIds([]);
      setReplacementCardType('W');
    }
  };

  const handleCancel = () => {
    setSelectedCardIds([]);
    setReplacementCardType('W');
    onCancel();
  };

  const getCardDetails = (cardId: string): Card | null => {
    return dataService.getCardById(cardId);
  };

  const getCardTypeName = (type: CardType): string => {
    switch (type) {
      case 'W': return 'Work';
      case 'B': return 'Bank Loan';
      case 'E': return 'Expeditor';
      case 'L': return 'Life Events';
      case 'I': return 'Investor Loan';
      default: return type;
    }
  };

  const getCardTypeIcon = (type: CardType): string => {
    switch (type) {
      case 'W': return '🏗️';
      case 'B': return '💼';
      case 'E': return '🔧';
      case 'L': return '⚖️';
      case 'I': return '💰';
      default: return '🃏';
    }
  };

  const getCardTypeColor = (type: CardType): string => {
    switch (type) {
      case 'W': return '#8b5cf6';
      case 'B': return '#10b981';
      case 'E': return '#f59e0b';
      case 'L': return '#ef4444';
      case 'I': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 75px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    padding: '24px 24px 16px',
    borderBottom: '2px solid #f1f5f9',
    backgroundColor: '#f8fafc'
  };

  const bodyStyle: React.CSSProperties = {
    padding: '20px 24px',
    flex: 1,
    overflowY: 'auto'
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px 24px 24px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const cardGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
    marginBottom: '20px'
  };

  const cardItemStyle: React.CSSProperties = {
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#fff'
  };

  const selectedCardStyle: React.CSSProperties = {
    ...cardItemStyle,
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '100px'
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: 'white'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#6b7280',
    color: 'white'
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#d1d5db',
    color: '#9ca3af',
    cursor: 'not-allowed'
  };

  return (
    <div style={modalStyle} onClick={handleCancel}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1e293b',
            margin: 0,
            marginBottom: '8px'
          }}>
            Replace {getCardTypeName(cardType)} Cards
          </h2>
          <p style={{
            color: '#64748b',
            margin: 0,
            fontSize: '16px'
          }}>
            Select up to {maxReplacements} card{maxReplacements > 1 ? 's' : ''} to replace with new {getCardTypeName(replacementCardType)} cards
          </p>
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {availableCards.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#64748b'
            }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🃏</span>
              <p style={{ fontSize: '18px', margin: 0 }}>
                No {getCardTypeName(cardType)} cards available to replace
              </p>
            </div>
          ) : (
            <>
              <div style={cardGridStyle}>
                {availableCards.map(cardId => {
                  const card = getCardDetails(cardId);
                  const isSelected = selectedCardIds.includes(cardId);
                  
                  return (
                    <div
                      key={cardId}
                      style={isSelected ? selectedCardStyle : cardItemStyle}
                      onClick={() => handleCardToggle(cardId)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.backgroundColor = '#fff';
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        marginBottom: '12px'
                      }}>
                        <span style={{
                          fontSize: '24px',
                          color: getCardTypeColor(cardType)
                        }}>
                          {getCardTypeIcon(cardType)}
                        </span>
                        <div style={{ flex: 1 }}>
                          <h4 style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#1e293b',
                            margin: 0,
                            marginBottom: '4px'
                          }}>
                            {card?.card_name || 'Unknown Card'}
                          </h4>
                          <div style={{
                            fontSize: '12px',
                            color: '#64748b',
                            marginBottom: '8px'
                          }}>
                            Cost: {card ? FormatUtils.formatCardCost(card.cost) : 'Unknown'}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                      
                      {card?.description && (
                        <p style={{
                          fontSize: '14px',
                          color: '#475569',
                          margin: 0,
                          lineHeight: '1.4'
                        }}>
                          {card.description.length > 80 
                            ? `${card.description.substring(0, 80)}...` 
                            : card.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Replacement Card Type Selection */}
              <div style={{
                marginTop: '24px',
                padding: '20px',
                backgroundColor: '#f1f5f9',
                borderRadius: '12px',
                border: '2px solid #e2e8f0'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  margin: 0,
                  marginBottom: '12px'
                }}>
                  Replace with:
                </h4>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  {(['W', 'B', 'E', 'L', 'I'] as CardType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setReplacementCardType(type)}
                      style={{
                        ...buttonStyle,
                        backgroundColor: replacementCardType === type ? getCardTypeColor(type) : '#fff',
                        color: replacementCardType === type ? '#fff' : '#374151',
                        border: `2px solid ${getCardTypeColor(type)}`,
                        minWidth: '80px'
                      }}
                      onMouseEnter={(e) => {
                        if (replacementCardType !== type) {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (replacementCardType !== type) {
                          e.currentTarget.style.backgroundColor = '#fff';
                        }
                      }}
                    >
                      {getCardTypeIcon(type)} {getCardTypeName(type)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            {selectedCardIds.length} of {maxReplacements} cards selected
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              style={secondaryButtonStyle}
              onClick={handleCancel}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Cancel
            </button>
            
            <button
              style={canReplace ? primaryButtonStyle : disabledButtonStyle}
              onClick={handleConfirm}
              disabled={!canReplace}
              onMouseEnter={(e) => {
                if (canReplace) e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                if (canReplace) e.currentTarget.style.opacity = '1';
              }}
            >
              Replace {selectedCardIds.length} Card{selectedCardIds.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}