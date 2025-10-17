import React from 'react';
import styled from 'styled-components';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CardContainer = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border-left: 4px solid ${props => {
    switch (props.status) {
      case 'pending': return props.theme.colors.accent.primary;
      case 'won': return '#4CAF50';
      case 'lost': return '#f44336';
      case 'void': return props.theme.colors.text.muted;
      default: return props.theme.colors.border.primary;
    }
  }};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

const BetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const SportsbookName = styled.span`
  color: ${props => props.theme.colors.text.muted};
  font-size: 12px;
  font-weight: 500;
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  background: ${props => {
    switch (props.status) {
      case 'pending': return props.theme.colors.accent.primary;
      case 'won': return '#4CAF50';
      case 'lost': return '#f44336';
      case 'void': return props.theme.colors.text.muted;
      default: return props.theme.colors.border.primary;
    }
  }};
  color: ${props => props.theme.colors.background.primary};
`;

const GameTitle = styled.div`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 8px;
  font-weight: 500;
`;

const BetSelection = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 15px;
  line-height: 1.3;
`;

const BetAmountRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-bottom: 12px;
`;

const BetAmount = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 500;
`;

const PotentialWin = styled.span`
  color: #4CAF50;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const BetActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const ActionButton = styled.button`
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  &.won {
    background: #4CAF50;
    color: #fff;

    &:hover {
      background: #45a049;
    }
  }

  &.lost {
    background: #f44336;
    color: #fff;

    &:hover {
      background: #da190b;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const OddsDisplay = styled.span`
  background: ${props => props.theme.colors.background.tertiary};
  color: ${props => props.theme.colors.text.primary};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
`;

const BetSlipCard = ({ bet, onUpdateStatus }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const calculatePotentialWin = () => {
    if (bet.status === 'won' && bet.profit !== undefined) {
      return bet.profit;
    }

    const odds = bet.odds;
    const stake = bet.stake || bet.amount;

    if (typeof odds === 'string') {
      if (odds.startsWith('+')) {
        const oddsValue = parseInt(odds.substring(1));
        return (stake * oddsValue) / 100;
      } else if (odds.startsWith('-')) {
        const oddsValue = parseInt(odds.substring(1));
        return (stake * 100) / oddsValue;
      }
    }

    return bet.potential ? bet.potential - stake : 0;
  };

  const potentialWin = calculatePotentialWin();
  const gameDisplay = bet.game || `${bet.awayTeam || 'Team A'} @ ${bet.homeTeam || 'Team B'}`;
  const selectionDisplay = bet.selection || bet.title;

  return (
    <CardContainer status={bet.status}>
      <BetHeader>
        <SportsbookName>{bet.sportsbook || 'Sportsbook'}</SportsbookName>
        <StatusBadge status={bet.status}>{bet.status}</StatusBadge>
      </BetHeader>

      <GameTitle>{gameDisplay}</GameTitle>

      <BetSelection>
        {selectionDisplay}
        <OddsDisplay>{bet.odds}</OddsDisplay>
      </BetSelection>

      <BetAmountRow>
        <BetAmount>Bet: {formatCurrency(bet.stake || bet.amount)}</BetAmount>
        <PotentialWin>
          {bet.status === 'won' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          To Win: {formatCurrency(potentialWin)}
        </PotentialWin>
      </BetAmountRow>

      {bet.status === 'pending' && onUpdateStatus && (
        <BetActions>
          <ActionButton
            className="won"
            onClick={() => onUpdateStatus(bet.id, 'won')}
          >
            <TrendingUp size={14} />
            Won
          </ActionButton>
          <ActionButton
            className="lost"
            onClick={() => onUpdateStatus(bet.id, 'lost')}
          >
            <TrendingDown size={14} />
            Lost
          </ActionButton>
        </BetActions>
      )}

      {bet.notes && (
        <div style={{
          fontSize: '12px',
          color: '#6B7280',
          fontStyle: 'italic',
          marginTop: '8px',
          padding: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px'
        }}>
          "{bet.notes}"
        </div>
      )}
    </CardContainer>
  );
};

export default BetSlipCard;