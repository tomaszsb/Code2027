// src/components/game/FinancialStatusDisplay.tsx

import React from 'react';
import { Player } from '../../types/StateTypes';
import { useGameContext } from '../../context/GameContext';
import { FormatUtils } from '../../utils/FormatUtils';

interface FinancialStatusDisplayProps {
  player: Player;
}

/**
 * FinancialStatusDisplay provides detailed financial metrics including money,
 * scope cost calculations, and surplus/deficit analysis.
 */
export function FinancialStatusDisplay({ player }: FinancialStatusDisplayProps): JSX.Element {
  const { dataService } = useGameContext();

  // Calculate financial status
  const calculateFinancialStatus = () => {
    const wCards = player.availableCards?.W || [];
    let totalScopeCost = 0;

    // Get cost data for each W card
    wCards.forEach(cardId => {
      const card = dataService.getCardById(cardId);
      if (card && card.cost) {
        totalScopeCost += card.cost;
      }
    });

    const surplus = player.money - totalScopeCost;
    
    return {
      playerMoney: player.money,
      totalScopeCost,
      surplus,
      isDeficit: surplus < 0
    };
  };

  const financialStatus = calculateFinancialStatus();

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

  const metricRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  };

  const metricLabelStyle = {
    fontSize: '0.8rem',
    color: '#6c757d'
  };

  const metricValueStyle = {
    fontSize: '0.8rem',
    fontWeight: 'bold' as const,
    color: '#495057'
  };

  return (
    <div style={containerStyle}>
      {/* Financial Status Section */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}>
          💰 Financial Status
        </div>
        <div style={metricRowStyle}>
          <span style={metricLabelStyle}>Available Money:</span>
          <span style={metricValueStyle}>{FormatUtils.formatMoney(financialStatus.playerMoney)}</span>
        </div>
        <div style={metricRowStyle}>
          <span style={metricLabelStyle}>Total Scope Cost:</span>
          <span style={metricValueStyle}>{FormatUtils.formatMoney(financialStatus.totalScopeCost)}</span>
        </div>
        <div style={metricRowStyle}>
          <span style={metricLabelStyle}>
            {financialStatus.isDeficit ? 'Deficit:' : 'Surplus:'}
          </span>
          <span style={{
            ...metricValueStyle,
            color: financialStatus.isDeficit ? '#dc3545' : '#28a745'
          }}>
            {FormatUtils.formatMoney(Math.abs(financialStatus.surplus))}
          </span>
        </div>
      </div>
    </div>
  );
}