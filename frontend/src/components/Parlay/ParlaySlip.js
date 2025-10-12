import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, DollarSign, TrendingUp, AlertCircle, Calculator, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SlipContainer = styled.div`
  position: sticky;
  top: 20px;
  background: ${props => props.theme.colors.background.card};
  border: 2px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  min-height: 400px;
  max-height: 80vh;
  overflow-y: auto;

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    max-height: 60vh;
    border-radius: ${props => props.theme.borderRadius.lg} ${props => props.theme.borderRadius.lg} 0 0;
    z-index: 1000;
    transform: translateY(${props => props.isMinimized ? 'calc(100% - 60px)' : '0'});
    transition: transform 0.3s ease;
  }
`;

const SlipHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
`;

const SlipTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const BetCount = styled.span`
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.8rem;
  font-weight: 600;
`;

const ClearButton = styled.button`
  background: ${props => props.theme.colors.accent.secondary}20;
  border: 1px solid ${props => props.theme.colors.accent.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.secondary};
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.accent.secondary}30;
  }
`;

const BetItem = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
  }
`;

const BetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const BetTeam = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.9rem;
`;

const RemoveBet = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.muted};
  cursor: pointer;
  padding: 2px;
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.accent.secondary};
    background: ${props => props.theme.colors.accent.secondary}20;
  }
`;

const BetDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const BetType = styled.span`
  background: ${props => props.theme.colors.background.tertiary};
  padding: 2px 6px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: 500;
`;

const BetOdds = styled.span`
  color: ${props => props.odds > 0 ? props.theme.colors.betting.positive : props.theme.colors.betting.negative};
  font-weight: 600;
`;

const Sportsbook = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.colors.text.muted};
  margin-top: ${props => props.theme.spacing.xs};
`;

const AmountInput = styled.div`
  margin: ${props => props.theme.spacing.md} 0;
`;

const InputLabel = styled.label`
  display: block;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Input = styled.input`
  width: 100%;
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;

  &:focus {
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
    outline: none;
  }
`;

const CalculationSection = styled.div`
  background: ${props => props.theme.colors.background.tertiary};
  border: 1px solid ${props => props.theme.colors.border.accent};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const CalculationRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
  font-size: 0.9rem;

  &:last-child {
    margin-bottom: 0;
    padding-top: ${props => props.theme.spacing.xs};
    border-top: 1px solid ${props => props.theme.colors.border.primary};
    font-weight: 600;
    font-size: 1rem;
  }
`;

const PotentialPayout = styled.span`
  color: ${props => props.theme.colors.betting.positive};
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'primary'
    ? props.theme.colors.accent.primary
    : props.theme.colors.background.primary};
  border: 1px solid ${props => props.variant === 'primary'
    ? props.theme.colors.accent.primary
    : props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.variant === 'primary'
    ? props.theme.colors.background.primary
    : props.theme.colors.text.primary};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.soft};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.muted};
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const MinimizeButton = styled.button`
  display: none;
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const ParlaySlip = ({
  selectedBets,
  onRemoveBet,
  onClearAll,
  onEvaluate,
  isLoading
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [betAmount, setBetAmount] = useState('100');

  // Calculate parlay odds and potential payout
  const calculateParlayOdds = () => {
    if (selectedBets.length === 0) return { parlayOdds: 0, potentialPayout: 0 };

    let combinedDecimalOdds = 1;

    selectedBets.forEach(bet => {
      const decimalOdds = bet.odds > 0
        ? (bet.odds / 100) + 1
        : (100 / Math.abs(bet.odds)) + 1;
      combinedDecimalOdds *= decimalOdds;
    });

    const parlayOdds = combinedDecimalOdds > 2
      ? Math.round((combinedDecimalOdds - 1) * 100)
      : Math.round(-100 / (combinedDecimalOdds - 1));

    const potentialPayout = (parseFloat(betAmount) || 0) * combinedDecimalOdds;

    return { parlayOdds, potentialPayout, combinedDecimalOdds };
  };

  const { parlayOdds, potentialPayout } = calculateParlayOdds();

  const formatOdds = (odds) => {
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const handleEvaluate = () => {
    if (selectedBets.length === 0) {
      toast.error('Please add at least one bet to your parlay');
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    const parlayData = {
      bets: selectedBets.map(bet => ({
        team: bet.team,
        odds: bet.odds,
        bet_type: bet.betType,
        amount: parseFloat(betAmount) / selectedBets.length, // Split amount evenly
        sportsbook: bet.sportsbook
      })),
      total_amount: parseFloat(betAmount),
      user_notes: `Parlay with ${selectedBets.length} legs`
    };

    onEvaluate(parlayData);
  };

  return (
    <SlipContainer isMinimized={isMinimized}>
      <SlipHeader>
        <SlipTitle>
          <DollarSign size={20} />
          Parlay Slip
          {selectedBets.length > 0 && <BetCount>{selectedBets.length}</BetCount>}
        </SlipTitle>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectedBets.length > 0 && (
            <ClearButton onClick={onClearAll}>
              <Trash2 size={14} />
              Clear
            </ClearButton>
          )}
          <MinimizeButton onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? '↑' : '↓'}
          </MinimizeButton>
        </div>
      </SlipHeader>

      {selectedBets.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🎯</EmptyIcon>
          <div>
            <strong>Start Building Your Parlay</strong>
            <p>Browse games and click on odds to add bets to your slip</p>
          </div>
        </EmptyState>
      ) : (
        <>
          {selectedBets.map((bet, index) => (
            <BetItem key={bet.id || `${bet.gameId}-${bet.betType}-${index}`}>
              <BetHeader>
                <BetTeam>{bet.team}</BetTeam>
                <RemoveBet onClick={() => onRemoveBet(bet.id)}>
                  <X size={16} />
                </RemoveBet>
              </BetHeader>
              <BetDetails>
                <BetType>{bet.betType?.replace('_', ' ')}</BetType>
                <BetOdds odds={bet.odds}>{formatOdds(bet.odds)}</BetOdds>
              </BetDetails>
              {bet.line && (
                <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                  {bet.line}
                </div>
              )}
              {bet.gameInfo && (
                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>
                  {bet.gameInfo.awayTeam} @ {bet.gameInfo.homeTeam} • {bet.gameInfo.league}
                </div>
              )}
              {bet.sportsbook && bet.sportsbook !== 'N/A' && (
                <Sportsbook>via {bet.sportsbook}</Sportsbook>
              )}
            </BetItem>
          ))}

          <AmountInput>
            <InputLabel>Bet Amount ($)</InputLabel>
            <Input
              type="number"
              placeholder="100.00"
              step="0.01"
              min="0.01"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
            />
          </AmountInput>

          {betAmount && parseFloat(betAmount) > 0 && (
            <CalculationSection>
              <CalculationRow>
                <span>Parlay Odds:</span>
                <span>{formatOdds(parlayOdds)}</span>
              </CalculationRow>
              <CalculationRow>
                <span>Bet Amount:</span>
                <span>${parseFloat(betAmount).toFixed(2)}</span>
              </CalculationRow>
              <CalculationRow>
                <span>Potential Payout:</span>
                <PotentialPayout>${potentialPayout.toFixed(2)}</PotentialPayout>
              </CalculationRow>
            </CalculationSection>
          )}

          <ActionButtons>
            <ActionButton onClick={() => onClearAll()}>
              <Trash2 size={16} />
              Clear All
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={handleEvaluate}
              disabled={isLoading || selectedBets.length === 0 || !betAmount}
            >
              <Calculator size={16} />
              {isLoading ? 'Analyzing...' : 'Evaluate'}
            </ActionButton>
          </ActionButtons>
        </>
      )}
    </SlipContainer>
  );
};

export default ParlaySlip;