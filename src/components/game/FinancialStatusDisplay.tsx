// src/components/game/FinancialStatusDisplay.tsx

import React, { useState } from 'react';
import { colors } from '../../styles/theme';
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
  const { dataService, cardService } = useGameContext();

  // Get cards from player's hand and filter by type
  const hand = player.hand || [];
  const wCards = hand.filter(cardId => cardService.getCardType(cardId) === 'W');
  const bCards = hand.filter(cardId => cardService.getCardType(cardId) === 'B');
  const iCards = hand.filter(cardId => cardService.getCardType(cardId) === 'I');

  // Calculate financial status
  const calculateFinancialStatus = () => {
    // wCards is already filtered from player.hand above
    
    // Use the calculated project scope from the player state, or fallback to manual calculation
    const totalScopeCost = player.projectScope || 0;

    const surplus = player.money - totalScopeCost;
    
    // Debug logging
    console.log(`💰 Financial Status Debug for ${player.name}:`, {
      playerMoney: player.money,
      totalScopeCost,
      surplus,
      isDeficit: surplus < 0,
      wCards: wCards.length
    });
    
    return {
      playerMoney: player.money,
      totalScopeCost,
      surplus,
      isDeficit: surplus < 0
    };
  };

  const financialStatus = calculateFinancialStatus();

  const containerStyle = {
    background: `linear-gradient(135deg, ${colors.secondary.bg}, ${colors.secondary.light})`,
    borderRadius: '12px',
    padding: '16px',
    marginTop: '12px',
    border: `2px solid ${colors.secondary.border}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  };

  const sectionStyle = {
    marginBottom: '16px',
    padding: '12px',
    background: colors.white,
    borderRadius: '8px',
    border: `1px solid ${colors.secondary.light}`
  };

  const sectionTitleStyle = {
    fontSize: '0.85rem',
    fontWeight: 'bold' as const,
    color: colors.secondary.dark,
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
    color: colors.secondary.main
  };

  const metricValueStyle = {
    fontSize: '0.8rem',
    fontWeight: 'bold' as const,
    color: colors.secondary.dark
  };

  // Card arrays are already defined above from player.hand filtering

  // Group W cards by work type
  const groupedWCards = wCards.reduce((groups, cardId) => {
    // Use the full cardId since player.hand contains the complete card IDs
    const card = dataService.getCardById(cardId);
    if (!card) return groups;
    
    const workType = card.work_type_restriction || 'General Construction';
    if (!groups[workType]) {
      groups[workType] = [];
    }
    groups[workType].push({ cardId, card });
    return groups;
  }, {} as Record<string, Array<{ cardId: string; card: any }>>);

  // State for expanded work types
  const [expandedWorkTypes, setExpandedWorkTypes] = useState<Set<string>>(new Set());

  const toggleWorkType = (workType: string) => {
    const newExpanded = new Set(expandedWorkTypes);
    if (newExpanded.has(workType)) {
      newExpanded.delete(workType);
    } else {
      newExpanded.add(workType);
    }
    setExpandedWorkTypes(newExpanded);
  };

  return (
    <div style={containerStyle}>
      {/* Project Scope Section */}
      {Object.keys(groupedWCards).length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            🏗️ Project Scope
          </div>
          {Object.entries(groupedWCards).map(([workType, cards]) => {
            const totalCost = cards.reduce((sum, { card }) => sum + (card.cost || 0), 0);
            const isExpanded = expandedWorkTypes.has(workType);
            
            return (
              <div key={workType} style={{ marginBottom: '8px' }}>
                {/* Work Type Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: colors.warning.bg,
                    borderRadius: '6px',
                    border: `2px solid ${colors.warning.main}`,
                    cursor: 'pointer',
                    marginBottom: isExpanded ? '4px' : '0'
                  }}
                  onClick={() => toggleWorkType(workType)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      color: colors.warning.text,
                      marginBottom: '2px'
                    }}>
                      📋 {workType} ({cards.length} project{cards.length > 1 ? 's' : ''})
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: colors.secondary.main
                    }}>
                      {isExpanded ? 'Click to collapse' : 'Click to expand details'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: colors.warning.text,
                    marginLeft: '12px'
                  }}>
                    {FormatUtils.formatMoney(totalCost)}
                  </div>
                </div>
                
                {/* Expanded Details */}
                {isExpanded && cards.map(({ cardId, card }) => (
                  <div key={cardId} style={{
                    padding: '6px 12px',
                    marginLeft: '16px',
                    backgroundColor: colors.secondary.bg,
                    borderRadius: '4px',
                    border: `1px solid ${colors.secondary.border}`,
                    marginBottom: '2px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.8rem',
                        color: colors.secondary.dark,
                        flex: 1
                      }}>
                        {card.card_name}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        color: colors.warning.text
                      }}>

                        {FormatUtils.formatCardCost(card.cost)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          
          {/* Total Scope Cost */}
          <div style={{
            ...metricRowStyle,
            paddingTop: '8px',
            borderTop: `2px solid ${colors.warning.main}`,
            fontWeight: 'bold'
          }}>
            <span style={metricLabelStyle}>Total Scope Cost:</span>
            <span style={{
              ...metricValueStyle,
              color: colors.warning.text,
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
                backgroundColor: colors.info.bg,
                borderRadius: '6px',
                border: `2px solid ${colors.primary.main}`
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    color: colors.primary.dark,
                    marginBottom: '2px'
                  }}>
                    {card.card_name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: colors.secondary.main,
                    lineHeight: '1.2',
                    marginBottom: '4px'
                  }}>
                    {card.description}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: colors.primary.dark,
                    fontWeight: 'bold'
                  }}>
                    📊 {getLoanFeeInfo()} • ⏱️ Processing: 1 day per $200K
                  </div>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: colors.primary.dark,
                  marginLeft: '12px',
                  textAlign: 'center'
                }}>
                  <div>Bank Loan</div>
                  <div style={{ fontSize: '0.7rem', color: colors.secondary.main }}>Low Rate</div>
                </div>
              </div>
            );
          })}
          
          {/* Bank Loan Summary */}
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: colors.secondary.bg,
            borderRadius: '6px',
            border: `1px solid ${colors.secondary.border}`,
            fontSize: '0.75rem',
            color: colors.secondary.main
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
            
            const loanAmount = extractLoanAmount(card.description || '');
            
            return (
              <div key={cardId} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                marginBottom: '6px',
                backgroundColor: colors.purple.light,
                borderRadius: '6px',
                border: `2px solid ${colors.purple.main}`
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    color: colors.purple.darker,
                    marginBottom: '2px'
                  }}>
                    {card.card_name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: colors.secondary.main,
                    lineHeight: '1.2',
                    marginBottom: '4px'
                  }}>
                    {card.description}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: colors.purple.main,
                    fontWeight: 'bold'
                  }}>
                    📈 {getInvestorFeeInfo(loanAmount)} • ⏱️ Processing: 30-70 days
                  </div>
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: colors.purple.main,
                  marginLeft: '12px',
                  textAlign: 'center'
                }}>
                  <div>Investor</div>
                  <div style={{ fontSize: '0.7rem', color: colors.secondary.main }}>High Rate</div>
                </div>
              </div>
            );
          })}
          
          {/* Investor Loan Summary */}
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: colors.secondary.bg,
            borderRadius: '6px',
            border: `1px solid ${colors.secondary.border}`,
            fontSize: '0.75rem',
            color: colors.secondary.main
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
            color: financialStatus.isDeficit ? colors.danger.main : colors.success.main
          }}>
            {FormatUtils.formatMoney(Math.abs(financialStatus.surplus))}
          </span>
        </div>
        
        {/* Funding Status Indicator */}
        <div style={{
          marginTop: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          backgroundColor: financialStatus.isDeficit ? colors.danger.bg : colors.success.light,
          border: `2px solid ${financialStatus.isDeficit ? colors.danger.main : colors.success.main}`
        }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 'bold',
            color: financialStatus.isDeficit ? colors.danger.darker : colors.success.darker,
            textAlign: 'center'
          }}>
            {financialStatus.isDeficit ? '⚠️ Insufficient Funding' : '✅ Fully Funded'}
          </div>
        </div>
      </div>
    </div>
  );
}