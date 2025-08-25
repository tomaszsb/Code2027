// src/components/modals/RulesModal.tsx

import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RulesModal({ isOpen, onClose }: RulesModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
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
          maxWidth: '800px',
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
            <h2 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#495057'
            }}>
              📋 Game Rules
            </h2>
            
            <button
              onClick={onClose}
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
        </div>

        {/* Modal Body */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
        }}>
          <div style={{ 
            fontSize: '14px', 
            lineHeight: '1.6',
            color: '#333'
          }}>
            <section style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                color: '#495057'
              }}>
                🎯 Game Objective
              </h3>
              <p>
                Navigate through the development process from initial scope to project completion. 
                Manage your time, money, and resources while making strategic decisions to successfully 
                complete your construction project.
              </p>
            </section>

            <section style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                color: '#495057'
              }}>
                🎲 Turn Structure
              </h3>
              <ol style={{ paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Roll Dice:</strong> Roll dice to determine movement and receive space effects
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>Complete Actions:</strong> Perform any required manual actions (like picking up cards)
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>End Turn:</strong> Once all actions are completed, end your turn to advance
                </li>
              </ol>
            </section>

            <section style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                color: '#495057'
              }}>
                🃏 Card Types
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <strong>W Cards (Work):</strong> Construction work scopes and project requirements
                </div>
                <div>
                  <strong>B Cards (Budget):</strong> Funding and financial resources
                </div>
                <div>
                  <strong>E Cards (Events):</strong> Random events and opportunities
                </div>
                <div>
                  <strong>L Cards (Legal):</strong> Permits, regulations, and legal requirements
                </div>
                <div>
                  <strong>I Cards (Issues):</strong> Problems and challenges to overcome
                </div>
              </div>
            </section>

            <section style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                color: '#495057'
              }}>
                🏗️ Key Spaces
              </h3>
              <ul style={{ paddingLeft: '20px', margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <strong>OWNER-SCOPE-INITIATION:</strong> Define project scope and pick up E cards
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>OWNER-FUND-INITIATION:</strong> Secure initial funding
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>ARCH/ENG Spaces:</strong> Work with architects and engineers
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>REG Spaces:</strong> Handle permits and regulatory requirements
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <strong>CON Spaces:</strong> Construction and final project phases
                </li>
              </ul>
            </section>

            <section style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                color: '#495057'
              }}>
              🤝 Negotiation
              </h3>
              <p>
                Some spaces allow negotiation. If you have a snapshot from entering the space, 
                you can restore your previous state. Otherwise, you'll receive a time penalty 
                but can try again.
              </p>
            </section>

            <section>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                color: '#495057'
              }}>
                🏆 Winning
              </h3>
              <p>
                Successfully navigate through all phases of development and reach the final 
                completion space to win the game. Manage your resources wisely and make 
                strategic decisions to overcome challenges along the way.
              </p>
            </section>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #dee2e6',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor: '#28a745',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#218838';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#28a745';
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}