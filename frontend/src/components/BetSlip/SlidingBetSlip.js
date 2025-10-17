import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Plus } from 'lucide-react';
import BetSlipCard from './BetSlipCard';

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: ${props => props.isOpen ? 'auto' : 'none'};
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  opacity: ${props => props.isOpen ? 1 : 0};
  transition: opacity 0.3s ease;
  backdrop-filter: blur(4px);
`;

const SlidingPanel = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.background.primary};
  border-radius: 20px 20px 0 0;
  max-height: 80vh;
  transform: translateY(${props => props.isOpen ? '0' : '100%'});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    max-height: 90vh;
  }
`;

const BetSlipHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  flex-shrink: 0;
`;

const HeaderTitle = styled.h2`
  color: ${props => props.theme.colors.accent.primary};
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.primary};
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.background.hover};
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  flex-shrink: 0;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.text.muted};
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  border-bottom: 3px solid ${props => props.active ? props.theme.colors.accent.primary : 'transparent'};
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.accent.primary};
    background: ${props => props.theme.colors.background.hover};
  }
`;

const SummarySection = styled.div`
  display: flex;
  padding: 16px 20px;
  background: ${props => props.theme.colors.background.secondary};
  gap: 20px;
  flex-shrink: 0;
`;

const SummaryItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SummaryLabel = styled.span`
  font-size: 12px;
  color: ${props => props.theme.colors.text.muted};
  font-weight: 500;
`;

const SummaryValue = styled.strong`
  font-size: 18px;
  color: ${props => {
    if (props.type === 'profit' && props.value > 0) return '#4CAF50';
    if (props.type === 'profit' && props.value < 0) return '#f44336';
    return props.theme.colors.accent.primary;
  }};
  font-weight: 700;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 200px;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border.primary};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.text.secondary};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${props => props.theme.colors.text.muted};
`;

const EmptyStateTitle = styled.h3`
  color: ${props => props.theme.colors.text.secondary};
  margin: 0 0 8px 0;
  font-size: 18px;
`;

const EmptyStateText = styled.p`
  margin: 0 0 20px 0;
  font-size: 14px;
  line-height: 1.4;
`;

const AddBetButton = styled.button`
  margin: 16px;
  padding: 14px;
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${props => props.theme.colors.accent.primaryHover || '#e6c200'};
    transform: translateY(-1px);
  }
`;

const SlidingBetSlip = ({ isOpen, onClose, bets, onUpdateBetStatus, onAddBet }) => {
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const filteredBets = bets.filter(bet =>
    activeTab === 'pending' ? bet.status === 'pending' : bet.status !== 'pending'
  );

  const pendingBets = bets.filter(bet => bet.status === 'pending');
  const settledBets = bets.filter(bet => bet.status !== 'pending');

  const calculateTotalWagered = () => {
    return bets.reduce((sum, bet) => sum + (bet.stake || bet.amount || 0), 0);
  };

  const calculatePotentialReturn = () => {
    return pendingBets.reduce((sum, bet) => {
      const stake = bet.stake || bet.amount || 0;
      const odds = bet.odds;

      if (typeof odds === 'string') {
        if (odds.startsWith('+')) {
          const oddsValue = parseInt(odds.substring(1));
          return sum + stake + ((stake * oddsValue) / 100);
        } else if (odds.startsWith('-')) {
          const oddsValue = parseInt(odds.substring(1));
          return sum + stake + ((stake * 100) / oddsValue);
        }
      }

      return sum + (bet.potential || stake);
    }, 0);
  };

  const calculateNetProfit = () => {
    return settledBets.reduce((sum, bet) => {
      if (bet.status === 'won') {
        return sum + (bet.profit || 0);
      } else if (bet.status === 'lost') {
        return sum - (bet.stake || bet.amount || 0);
      }
      return sum;
    }, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddBetClick = () => {
    onClose();
    if (onAddBet) {
      onAddBet();
    }
  };

  const totalWagered = calculateTotalWagered();
  const potentialReturn = calculatePotentialReturn();
  const netProfit = calculateNetProfit();

  return (
    <OverlayContainer isOpen={isOpen}>
      <Overlay isOpen={isOpen} onClick={handleOverlayClick} />
      <SlidingPanel isOpen={isOpen}>
        <BetSlipHeader>
          <HeaderTitle>My Bets</HeaderTitle>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </BetSlipHeader>

        <TabsContainer>
          <TabButton
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({pendingBets.length})
          </TabButton>
          <TabButton
            active={activeTab === 'settled'}
            onClick={() => setActiveTab('settled')}
          >
            Settled ({settledBets.length})
          </TabButton>
        </TabsContainer>

        <SummarySection>
          <SummaryItem>
            <SummaryLabel>Total Wagered</SummaryLabel>
            <SummaryValue>{formatCurrency(totalWagered)}</SummaryValue>
          </SummaryItem>
          {activeTab === 'pending' ? (
            <SummaryItem>
              <SummaryLabel>Potential Return</SummaryLabel>
              <SummaryValue>{formatCurrency(potentialReturn)}</SummaryValue>
            </SummaryItem>
          ) : (
            <SummaryItem>
              <SummaryLabel>Net Profit</SummaryLabel>
              <SummaryValue type="profit" value={netProfit}>
                {formatCurrency(netProfit)}
              </SummaryValue>
            </SummaryItem>
          )}
        </SummarySection>

        <ContentArea>
          {filteredBets.length === 0 ? (
            <EmptyState>
              <EmptyStateTitle>
                {activeTab === 'pending' ? 'No pending bets' : 'No settled bets'}
              </EmptyStateTitle>
              <EmptyStateText>
                {activeTab === 'pending'
                  ? 'Add your first bet to start tracking your performance!'
                  : 'Your completed bets will appear here.'
                }
              </EmptyStateText>
            </EmptyState>
          ) : (
            filteredBets.map(bet => (
              <BetSlipCard
                key={bet.id}
                bet={bet}
                onUpdateStatus={activeTab === 'pending' ? onUpdateBetStatus : null}
              />
            ))
          )}
        </ContentArea>

        <AddBetButton onClick={handleAddBetClick}>
          <Plus size={20} />
          Add New Bet
        </AddBetButton>
      </SlidingPanel>
    </OverlayContainer>
  );
};

export default SlidingBetSlip;