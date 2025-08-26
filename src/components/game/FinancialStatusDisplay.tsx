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

  const wCards = player.availableCards?.W || [];
  const bCards = player.availableCards?.B || [];
  const iCards = player.availableCards?.I || [];


  return (
    <div style={containerStyle}>
      {/* Project Scope Section */}
      {wCards.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            🏗️ Project Scope
          </div>
          {wCards.map((cardId, index) => {
            const card = dataService.getCardById(cardId);
            if (!card) return null;
            
            return (
              <div key={cardId} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                marginBottom: '6px',
                backgroundColor: '#fff3cd',
                borderRadius: '6px',
                border: '2px solid #ffc107'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    color: '#856404',
                    marginBottom: '2px'
                  }}>
                    {card.card_name}
                  </div>
                  {card.card_description && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6c757d',
                      lineHeight: '1.2'
                    }}>
                      {card.card_description}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: '#856404',
                  marginLeft: '12px'
                }}>
                  {FormatUtils.formatCardCost(card.cost)}
                </div>
              </div>
            );
          })}
          
          {/* Total Scope Cost */}
          <div style={{
            ...metricRowStyle,
            paddingTop: '8px',
            borderTop: '2px solid #ffc107',
            fontWeight: 'bold'
          }}>
            <span style={metricLabelStyle}>Total Scope Cost:</span>
            <span style={{
              ...metricValueStyle,
              color: '#856404',
              fontSize: '0.9rem'
            }}>
              {FormatUtils.formatMoney(financialStatus.totalScopeCost)}
            </span>
          </div>
        </div>
      )}

      {/* Bank Loans Section */}
      {bCards.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            🏦 Bank Loans
          </div>
          {bCards.map((cardId, index) => {
            const card = dataService.getCardById(cardId);
            if (!card) return null;
            
            // Bank fee calculation (simplified - actual amount would come from game state)
            // Fees: 1% up to $1.4M, 2% for $1.5M-$2.75M, 3% above $2.75M
            const getLoanFeeInfo = (amount: number = 0) => {
              if (amount === 0) return 'Fee calculated at loan approval';
              if (amount <= 1400000) return `1% fee (${FormatUtils.formatMoney(amount * 0.01)})`;
              if (amount <= 2750000) return `2% fee (${FormatUtils.formatMoney(amount * 0.02)})`;
              return `3% fee (${FormatUtils.formatMoney(amount * 0.03)})`;
            };
            
            return (
              <div key={cardId} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                marginBottom: '6px',
                backgroundColor: '#e8f4fd',
                borderRadius: '6px',
                border: '2px solid #007bff'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    color: '#0056b3',
                    marginBottom: '2px'
                  }}>
                    {card.card_name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6c757d',
                    lineHeight: '1.2',
                    marginBottom: '4px'
                  }}>
                    {card.card_description}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#0056b3',
                    fontWeight: 'bold'
                  }}>
                    📊 {getLoanFeeInfo()} • ⏱️ Processing: 1 day per $200K
                  </div>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: '#0056b3',
                  marginLeft: '12px',
                  textAlign: 'center'
                }}>
                  <div>Bank Loan</div>
                  <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>Low Rate</div>
                </div>
              </div>
            );
          })}
          
          {/* Bank Loan Summary */}
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            fontSize: '0.75rem',
            color: '#6c757d'
          }}>
            <strong>Bank Loan Terms:</strong> Quick approval, low rates (1-3%), processing time applies
            <br />
            <em>Note: Fees don't apply for seed money from OWNER-FUND-INITIATION space</em>
          </div>
        </div>
      )}

      {/* Investor Loans Section */}
      {iCards.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            💼 Investor Loans
          </div>
          {iCards.map((cardId, index) => {
            const card = dataService.getCardById(cardId);
            if (!card) return null;
            
            // Investor fee is always 5% of amount borrowed
            const getInvestorFeeInfo = (amount: number = 0) => {
              if (amount === 0) return 'Fee: 5% of loan amount';
              return `5% fee (${FormatUtils.formatMoney(amount * 0.05)})`;
            };
            
            // Extract loan amount from card description if available
            const extractLoanAmount = (description: string): number => {
              const match = description.match(/\$(\d{1,3}(?:,\d{3})*)/);
              if (match) {
                return parseInt(match[1].replace(/,/g, ''));
              }
              return 0;
            };
            
            const loanAmount = extractLoanAmount(card.card_description || '');
            
            return (
              <div key={cardId} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                marginBottom: '6px',
                backgroundColor: '#f3e5f5',
                borderRadius: '6px',
                border: '2px solid #6f42c1'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    color: '#4c1d5b',
                    marginBottom: '2px'
                  }}>
                    {card.card_name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#6c757d',
                    lineHeight: '1.2',
                    marginBottom: '4px'
                  }}>
                    {card.card_description}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#6f42c1',
                    fontWeight: 'bold'
                  }}>
                    📈 {getInvestorFeeInfo(loanAmount)} • ⏱️ Processing: 30-70 days
                  </div>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: '#6f42c1',
                  marginLeft: '12px',
                  textAlign: 'center'
                }}>
                  <div>Investor</div>
                  <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>High Rate</div>
                </div>
              </div>
            );
          })}
          
          {/* Investor Loan Summary */}
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #dee2e6',
            fontSize: '0.75rem',
            color: '#6c757d'
          }}>
            <strong>Investor Loan Terms:</strong> Higher amounts, 5% fixed rate, longer processing times
            <br />
            <em>Note: Fees don't apply for seed money from OWNER-FUND-INITIATION space</em>
          </div>
        </div>
      )}

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
          <span style={metricLabelStyle}>Project Funding Required:</span>
          <span style={metricValueStyle}>{FormatUtils.formatMoney(financialStatus.totalScopeCost)}</span>
        </div>
        <div style={metricRowStyle}>
          <span style={metricLabelStyle}>
            {financialStatus.isDeficit ? 'Funding Shortage:' : 'Available Surplus:'}
          </span>
          <span style={{
            ...metricValueStyle,
            color: financialStatus.isDeficit ? '#dc3545' : '#28a745'
          }}>
            {FormatUtils.formatMoney(Math.abs(financialStatus.surplus))}
          </span>
        </div>
        
        {/* Funding Status Indicator */}
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: financialStatus.isDeficit ? '#f8d7da' : '#d4edda',
          border: `2px solid ${financialStatus.isDeficit ? '#dc3545' : '#28a745'}`
        }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 'bold',
            color: financialStatus.isDeficit ? '#721c24' : '#155724',
            textAlign: 'center'
          }}>
            {financialStatus.isDeficit ? '⚠️ Insufficient Funding' : '✅ Fully Funded'}
          </div>
        </div>
      </div>
    </div>
  );
}