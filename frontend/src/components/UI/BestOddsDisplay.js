import React from 'react';
import styled from 'styled-components';
import { ExternalLink, TrendingUp } from 'lucide-react';
import SportsbookLogo from './SportsbookLogo';

const BestOddsContainer = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const BestOddsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const BestOddsTitle = styled.h4`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const OddsValue = styled.span`
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.1rem;
  font-weight: bold;
`;

const OddsComparison = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const OddsOption = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background: ${props => props.isBest ? 
    props.theme.colors.accent.primary + '20' : 
    props.theme.colors.background.hover};
  border: 1px solid ${props => props.isBest ? 
    props.theme.colors.accent.primary : 
    props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.8rem;
`;

const SportsbookName = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 500;
`;

const BetButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.gradient.primary};
  color: ${props => props.theme.colors.background.primary};
  text-decoration: none;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
    text-decoration: none;
    color: ${props => props.theme.colors.background.primary};
  }
`;

const ValueIndicator = styled.div`
  background: ${props => props.theme.colors.stats.excellent};
  color: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.7rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const BestOddsDisplay = ({ 
  odds = [
    { sportsbook: 'draftkings', odds: '+110', url: '#' },
    { sportsbook: 'fanduel', odds: '+105', url: '#' },
    { sportsbook: 'betmgm', odds: '+115', url: '#' }
  ],
  betTitle = "Over 27.5 Points"
}) => {
  // Convert odds to numeric for comparison
  const parseOdds = (oddsStr) => {
    const numeric = parseInt(oddsStr.replace('+', ''));
    return numeric;
  };

  // Find the best odds (highest positive value)
  const bestOdds = odds.reduce((best, current) => {
    const currentValue = parseOdds(current.odds);
    const bestValue = parseOdds(best.odds);
    return currentValue > bestValue ? current : best;
  }, odds[0]);

  // Calculate value percentage difference
  const worstOdds = odds.reduce((worst, current) => {
    const currentValue = parseOdds(current.odds);
    const worstValue = parseOdds(worst.odds);
    return currentValue < worstValue ? current : worst;
  }, odds[0]);

  const valueDiff = parseOdds(bestOdds.odds) - parseOdds(worstOdds.odds);

  // Generate affiliate link (placeholder for now)
  const generateAffiliateLink = (sportsbook, url) => {
    // This will be replaced with actual affiliate tracking when we join programs
    return `${url}?ref=smartbets&utm_source=smartbets&utm_medium=ai_top5&utm_campaign=${betTitle.replace(/\s+/g, '_').toLowerCase()}`;
  };

  return (
    <BestOddsContainer>
      <BestOddsHeader>
        <BestOddsTitle>
          <TrendingUp size={14} />
          Best Odds Available
        </BestOddsTitle>
        <OddsValue>{bestOdds.odds}</OddsValue>
      </BestOddsHeader>

      <OddsComparison>
        {odds.map((option, index) => (
          <OddsOption key={index} isBest={option.sportsbook === bestOdds.sportsbook}>
            <SportsbookName>{option.odds}</SportsbookName>
            <SportsbookLogo sportsbook={option.sportsbook} size="small" />
          </OddsOption>
        ))}
      </OddsComparison>

      {valueDiff > 5 && (
        <ValueIndicator>
          <TrendingUp size={10} />
          {valueDiff} points better than worst odds
        </ValueIndicator>
      )}

      <BetButton 
        href={generateAffiliateLink(bestOdds.sportsbook, bestOdds.url)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <SportsbookLogo sportsbook={bestOdds.sportsbook} />
        Bet {bestOdds.odds} Now
        <ExternalLink size={16} />
      </BetButton>
    </BestOddsContainer>
  );
};

export default BestOddsDisplay;