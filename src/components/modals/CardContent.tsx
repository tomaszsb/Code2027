// src/components/modals/CardContent.tsx

import React from 'react';
import { Card } from '../../types/DataTypes';

interface CardContentProps {
  card?: Card | null;
  isFlipped?: boolean;
}

/**
 * CardContent component displays card details with organized effect categories
 * Now simplified to work with the new Card interface from DataTypes
 */
export function CardContent({ card, isFlipped = false }: CardContentProps): JSX.Element {
  
  // Handle flipped card state
  if (isFlipped) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'white',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '20px',
          opacity: 0.8
        }}>
          🃏
        </div>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          margin: '0 0 10px 0'
        }}>
          Card Back
        </h3>
        <p style={{
          fontSize: '1rem',
          opacity: 0.9,
          margin: 0
        }}>
          Project Management Board Game
        </p>
      </div>
    );
  }

  // Handle no card data
  if (!card) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#6c757d',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '20px',
          opacity: 0.5
        }}>
          📝
        </div>
        <h3 style={{
          fontSize: '1.2rem',
          margin: '0 0 10px 0'
        }}>
          No Card Selected
        </h3>
        <p style={{
          margin: 0,
          opacity: 0.7
        }}>
          Please select a card to view its details.
        </p>
      </div>
    );
  }

  // Get card type colors
  const getCardTypeColor = (cardType: string) => {
    const colors = {
      'W': { bg: '#e3f2fd', border: '#2196f3', text: '#1976d2' }, // Blue for Work
      'B': { bg: '#e8f5e8', border: '#4caf50', text: '#388e3c' }, // Green for Budget
      'E': { bg: '#fff3e0', border: '#ff9800', text: '#f57c00' }, // Orange for Expeditor
      'L': { bg: '#fce4ec', border: '#e91e63', text: '#c2185b' }, // Pink for Life Events
      'I': { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' }  // Purple for Innovation
    };
    return colors[cardType as keyof typeof colors] || { 
      bg: '#f8f9fa', 
      border: '#dee2e6', 
      text: '#495057' 
    };
  };

  const cardColors = getCardTypeColor(card.card_type);

  return (
    <div style={{ padding: '24px' }}>
      {/* Card Header */}
      <div style={{
        background: cardColors.bg,
        border: `2px solid ${cardColors.border}`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            background: cardColors.border,
            color: 'white',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {card.card_type}
          </div>
          <h2 style={{
            margin: 0,
            color: cardColors.text,
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            {card.card_name}
          </h2>
        </div>
        
        <p style={{
          margin: 0,
          color: '#495057',
          fontSize: '1rem',
          lineHeight: '1.5'
        }}>
          {card.description}
        </p>
      </div>

      {/* Card Details */}
      <div style={{
        display: 'grid',
        gap: '16px'
      }}>
        {/* Cost */}
        {card.cost !== undefined && (
          <div style={{
            background: '#fff5f5',
            border: '2px solid #feb2b2',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#c53030',
              marginBottom: '4px'
            }}>
              💰 Cost
            </div>
            <div style={{
              color: '#2d3748',
              fontSize: '16px'
            }}>
              {card.cost} resources
            </div>
          </div>
        )}

        {/* Phase Restriction */}
        {card.phase_restriction && (
          <div style={{
            background: '#f0f9ff',
            border: '2px solid #7dd3fc',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#0369a1',
              marginBottom: '4px'
            }}>
              🎯 Phase Restriction
            </div>
            <div style={{
              color: '#2d3748',
              fontSize: '16px'
            }}>
              {card.phase_restriction}
            </div>
          </div>
        )}

        {/* Effects on Play */}
        {card.effects_on_play && (
          <div style={{
            background: '#f0fff4',
            border: '2px solid #68d391',
            borderRadius: '8px',
            padding: '12px 16px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#276749',
              marginBottom: '4px'
            }}>
              ⚡ Effects on Play
            </div>
            <div style={{
              color: '#2d3748',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              {card.effects_on_play}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}