import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ExternalLink, TrendingUp, TrendingDown, Clock, AlertCircle, Star, Info } from 'lucide-react';
import { apiService } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

const ComparisonContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.lg};
`;

const ComparisonHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
    align-items: flex-start;
  }
`;

const Title = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const RefreshButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.background.hover};
    color: ${props => props.theme.colors.text.primary};
    border-color: ${props => props.theme.colors.accent.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const OddsGrid = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.md};
`;

const OddsRow = styled.div`
  display: grid;
  grid-template-columns: 2fr repeat(auto-fit, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  border-left: 3px solid ${props => 
    props.isBest ? props.theme.colors.betting.positive : 'transparent'
  };
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.xs};
  }
`;

const BetInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const BetTeam = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 1rem;
`;

const BetType = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  text-transform: capitalize;
`;

const SportsbookOdds = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  background: ${props => props.isBest ? 
    props.theme.colors.betting.positive + '20' : 
    props.theme.colors.background.tertiary
  };
  border: ${props => props.isBest ? 
    `2px solid ${props.theme.colors.betting.positive}` : 
    `1px solid ${props.theme.colors.border.secondary}`
  };
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const SportsbookName = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const OddsValue = styled.div`
  color: ${props => props.isBest ? 
    props.theme.colors.betting.positive : 
    props.theme.colors.text.primary
  };
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const BestBadge = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  background: ${props => props.theme.colors.betting.positive};
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
`;

const BetButton = styled.button`
  background: ${props => props.isBest ? 
    props.theme.colors.betting.positive : 
    props.theme.colors.accent.primary
  };
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const SavingsInfo = styled.div`
  background: ${props => props.theme.colors.betting.positive}20;
  border: 1px solid ${props => props.theme.colors.betting.positive};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const SavingsText = styled.div`
  color: ${props => props.theme.colors.betting.positive};
  font-weight: 600;
  font-size: 0.9rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  color: ${props => props.theme.colors.text.muted};
`;

const ErrorState = styled.div`
  background: ${props => props.theme.colors.accent.secondary}20;
  border: 1px solid ${props => props.theme.colors.accent.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.accent.secondary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

const LastUpdated = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.md};
`;

const DisclaimerBox = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.accent};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.sm};
`;

const OddsComparison = ({ team, betType, sport = 'nfl', amount = 100 }) => {
  const [oddsData, setOddsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOdds = async () => {
    if (!team || !betType) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getBestOdds({
        team: team.trim(),
        bet_type: betType,
        sport: sport
      });
      
      setOddsData(response.odds_data);
      setLastUpdated(new Date());
      
    } catch (err) {
      setError(err.message || 'Failed to fetch odds');
      toast.error('Failed to load odds comparison');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOdds();
  }, [team, betType, sport, fetchOdds]);

  const handleBetClick = (sportsbook) => {
    // Safe sportsbook homepage links - no affiliate tracking
    const sportsbookUrls = {
      'draftkings': 'https://www.draftkings.com',
      'fanduel': 'https://www.fanduel.com',
      'betmgm': 'https://www.betmgm.com',
      'caesars': 'https://www.caesars.com/sportsbook',
      'betrivers': 'https://www.betrivers.com',
      'circa': 'https://www.circasports.com',
      'espnbet': 'https://espnbet.com',
      'fanatics': 'https://fanatics.com/betting'
    };
    
    const sportsbookUrl = sportsbookUrls[sportsbook.toLowerCase()] || `https://www.${sportsbook.toLowerCase()}.com`;
    
    // Open sportsbook homepage in new tab
    window.open(sportsbookUrl, '_blank', 'noopener,noreferrer');
    
    // Show informational message
    toast.info(`Opening ${sportsbook.toUpperCase()} - Odds for informational purposes only`);
  };

  const formatOdds = (odds) => {
    if (!odds) return 'N/A';
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const calculatePayout = (odds, betAmount) => {
    if (!odds || !betAmount) return 0;
    
    if (odds > 0) {
      return (odds / 100) * betAmount;
    } else {
      return (100 / Math.abs(odds)) * betAmount;
    }
  };

  if (isLoading) {
    return (
      <ComparisonContainer>
        <LoadingSpinner 
          text="Finding best odds..."
          subtext="Comparing prices across major sportsbooks"
          size="small"
        />
      </ComparisonContainer>
    );
  }

  if (!team || !betType) {
    return (
      <ComparisonContainer>
        <EmptyState>
          Select a team and bet type to compare odds
        </EmptyState>
      </ComparisonContainer>
    );
  }

  return (
    <ComparisonContainer>
      <ComparisonHeader>
        <Title>
          <TrendingUp size={20} />
          Best Odds for {team} ({betType})
        </Title>
        <RefreshButton onClick={fetchOdds} disabled={isLoading}>
          <Clock size={16} />
          Refresh Odds
        </RefreshButton>
      </ComparisonHeader>

      {error && (
        <ErrorState>
          <AlertCircle size={20} />
          {error}
        </ErrorState>
      )}

      {oddsData && oddsData.all_odds && Object.keys(oddsData.all_odds).length > 0 ? (
        <>
          <OddsGrid>
            <OddsRow>
              <BetInfo>
                <BetTeam>{team}</BetTeam>
                <BetType>{betType.replace('_', ' ')}</BetType>
              </BetInfo>
              
              {Object.entries(oddsData.all_odds).map(([sportsbook, odds]) => {
                const isBest = sportsbook === oddsData.best_sportsbook;
                const payout = calculatePayout(odds, amount);
                
                return (
                  <SportsbookOdds key={sportsbook} isBest={isBest}>
                    {isBest && (
                      <BestBadge>
                        <Star size={12} />
                      </BestBadge>
                    )}
                    
                    <SportsbookName>
                      {sportsbook.replace(/([A-Z])/g, ' $1').trim()}
                    </SportsbookName>
                    
                    <OddsValue isBest={isBest}>
                      {formatOdds(odds)}
                    </OddsValue>
                    
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#888', 
                      marginBottom: '0.5rem' 
                    }}>
                      ${payout.toFixed(2)} profit
                    </div>
                    
                    <BetButton 
                      isBest={isBest}
                      onClick={() => handleBetClick(sportsbook)}
                    >
                      <ExternalLink size={12} />
                      View Odds
                    </BetButton>
                  </SportsbookOdds>
                );
              })}
            </OddsRow>
          </OddsGrid>

          {oddsData.potential_savings && oddsData.potential_savings.percentage > 0 && (
            <SavingsInfo>
              <TrendingUp size={20} />
              <SavingsText>
                Save {oddsData.potential_savings.percentage.toFixed(1)}% 
                (${oddsData.potential_savings.amount.toFixed(2)}) by betting with{' '}
                {oddsData.best_sportsbook.replace(/([A-Z])/g, ' $1').trim()}
              </SavingsText>
            </SavingsInfo>
          )}

          {oddsData.recommendation && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: '#1a1a1a', 
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#00d4aa'
            }}>
              💡 {oddsData.recommendation}
            </div>
          )}

          <LastUpdated>
            <Clock size={14} />
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            {oddsData.fallback_data && ' (Using sample data)'}
          </LastUpdated>
          
          <DisclaimerBox>
            <Info size={16} />
            <div>
              <strong>📊 Price comparison for informational purposes only.</strong> Links to sportsbooks are provided for reference only. PrizmBets receives no compensation from your betting activity and does not facilitate betting.
            </div>
          </DisclaimerBox>
        </>
      ) : (
        <EmptyState>
          No odds available for this bet at the moment
        </EmptyState>
      )}
    </ComparisonContainer>
  );
};

export default OddsComparison;