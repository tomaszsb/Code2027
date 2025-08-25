import React from 'react';
import { FormatUtils } from '../../utils/FormatUtils';
import { DiceResultEffect, TurnEffectResult } from '../../types/StateTypes';

// Re-export for convenience
export type DiceRollResult = TurnEffectResult;

interface DiceResultModalProps {
  isOpen: boolean;
  result: DiceRollResult | null;
  onClose: () => void;
  onConfirm?: () => void;
}

/**
 * DiceResultModal displays detailed feedback about dice roll effects
 * Shows the dice value, applied effects, and summarizes the outcome
 * Matches the comprehensive feedback system from code2026
 */
export function DiceResultModal({ isOpen, result, onClose, onConfirm }: DiceResultModalProps): JSX.Element | null {
  if (!isOpen || !result) {
    return null;
  }

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleConfirm();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  const getDiceIcon = (value: number): string => {
    const diceIcons = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return diceIcons[value - 1] || '🎲';
  };

  const getEffectIcon = (effectType: string): string => {
    switch (effectType) {
      case 'money': return '💰';
      case 'time': return '⏱️';
      case 'cards': return '🃏';
      case 'movement': return '🏃';
      case 'choice': return '🤔';
      default: return '✨';
    }
  };

  const getEffectColor = (effectType: string): string => {
    switch (effectType) {
      case 'money': return '#28a745'; // Green for money gains
      case 'time': return '#fd7e14'; // Orange for time  
      case 'cards': return '#6f42c1'; // Purple for cards
      case 'movement': return '#007bff'; // Blue for movement
      case 'choice': return '#ffc107'; // Yellow for choices
      default: return '#6c757d'; // Gray for other
    }
  };

  const renderEffect = (effect: DiceResultEffect, index: number) => {
    const icon = getEffectIcon(effect.type);
    const color = getEffectColor(effect.type);
    
    let formattedValue = '';
    if (effect.type === 'money' && effect.value !== undefined) {
      const formatted = FormatUtils.formatResourceChange(effect.value, 'money');
      formattedValue = formatted.text;
    } else if (effect.type === 'time' && effect.value !== undefined) {
      const formatted = FormatUtils.formatResourceChange(effect.value, 'time');  
      formattedValue = formatted.text;
    } else if (effect.type === 'cards' && effect.cardCount && effect.cardType) {
      formattedValue = `+${effect.cardCount} ${effect.cardType} card${effect.cardCount > 1 ? 's' : ''}`;
    }

    return (
      <div
        key={index}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          marginBottom: '8px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          borderLeft: `4px solid ${color}`,
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ fontSize: '20px', marginRight: '12px' }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: color, marginBottom: '4px' }}>
            {formattedValue}
          </div>
          <div style={{ color: '#6c757d', fontSize: '14px' }}>
            {effect.description}
          </div>
        </div>
      </div>
    );
  };

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    animation: 'fadeIn 0.2s ease-out'
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    transform: 'scale(1)',
    animation: 'slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
  };

  const headerStyle: React.CSSProperties = {
    padding: '24px 24px 16px',
    borderBottom: '2px solid #e9ecef',
    textAlign: 'center'
  };

  const bodyStyle: React.CSSProperties = {
    padding: '16px 24px',
    flex: 1,
    overflowY: 'auto'
  };

  const footerStyle: React.CSSProperties = {
    padding: '16px 24px 24px',
    display: 'flex',
    justifyContent: 'center',
    gap: '12px'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: 'white'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#6c757d',
    color: 'white'
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: scale(0.9) translateY(-20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
          }
        `}
      </style>
      
      <div 
        style={modalStyle} 
        onClick={onClose}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dice-result-title"
      >
        <div 
          style={contentStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={headerStyle}>
            <div style={{
              fontSize: '48px',
              marginBottom: '8px',
              animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }}>
              {getDiceIcon(result.diceValue)}
            </div>
            <h2 
              id="dice-result-title"
              style={{ 
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#2c3e50',
                margin: 0,
                marginBottom: '8px'
              }}
            >
              Dice Roll: {result.diceValue}
            </h2>
            <p style={{ 
              color: '#6c757d',
              margin: 0,
              fontSize: '14px'
            }}>
              On {result.spaceName}
            </p>
          </div>

          {/* Body */}
          <div style={bodyStyle}>
            {result.effects.length > 0 ? (
              <>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  marginTop: 0,
                  marginBottom: '16px'
                }}>
                  Effects Applied:
                </h3>
                
                {result.effects.map((effect, index) => renderEffect(effect, index))}
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#6c757d',
                fontSize: '16px',
                padding: '20px'
              }}>
                <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>😐</span>
                No special effects this turn
              </div>
            )}

            {result.summary && (
              <div style={{
                backgroundColor: '#e3f2fd',
                border: '2px solid #2196f3',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '16px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#1976d2',
                  margin: 0,
                  marginBottom: '8px'
                }}>
                  Summary:
                </h4>
                <p style={{
                  margin: 0,
                  color: '#1976d2',
                  fontSize: '14px'
                }}>
                  {result.summary}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            {result.hasChoices && onConfirm ? (
              <>
                <button 
                  style={secondaryButtonStyle}
                  onClick={onClose}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Review
                </button>
                <button 
                  style={primaryButtonStyle}
                  onClick={handleConfirm}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  autoFocus
                >
                  Make Choice
                </button>
              </>
            ) : (
              <button 
                style={primaryButtonStyle}
                onClick={handleConfirm}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                autoFocus
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}