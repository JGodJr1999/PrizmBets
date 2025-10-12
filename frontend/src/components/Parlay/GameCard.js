import React, { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown, ChevronUp, Clock, Users, TrendingUp, Star } from 'lucide-react';

const CardContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: ${props => props.theme.shadows.soft};
  }
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const GameInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const GameTime = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const LiveIndicator = styled.div`
  background: ${props => props.theme.colors.accent.secondary};
  color: white;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
`;

const FeaturedBadge = styled.div`
  background: ${props => props.theme.colors.accent.primary};
  color: white;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TeamsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Team = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  ${props => props.home && 'justify-content: flex-end;'}
`;

const TeamLogo = styled.div`
  width: 40px;
  height: 40px;
  background: ${props => props.color || props.theme.colors.background.secondary};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  ${props => props.home && 'order: 2;'}
`;

const TeamInfo = styled.div`
  ${props => props.home && 'text-align: right;'}
`;

const TeamName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 1rem;
`;

const TeamRecord = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
`;

const VSContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const VS = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-weight: 600;
  font-size: 0.9rem;
`;

const Score = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 1.2rem;
`;

const QuickBetsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const BetOption = styled.button`
  background: ${props => props.selected ?
    props.theme.colors.accent.primary + '20' :
    props.theme.colors.background.secondary
  };
  border: 1px solid ${props => props.selected ?
    props.theme.colors.accent.primary :
    props.theme.colors.border.secondary
  };
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  position: relative;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    background: ${props => props.theme.colors.accent.primary}10;
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }

  ${props => props.selected && `
    box-shadow: 0 0 0 2px ${props.theme.colors.accent.primary}40;

    &::after {
      content: '✓';
      position: absolute;
      top: 4px;
      right: 8px;
      color: ${props.theme.colors.accent.primary};
      font-weight: bold;
      font-size: 0.9rem;
    }
  `}
`;

const BetLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.75rem;
  margin-bottom: 2px;
  text-transform: uppercase;
  font-weight: 500;
`;

const BetValue = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 2px;
`;

const BetOdds = styled.div`
  color: ${props => props.odds > 0 ? props.theme.colors.betting.positive : props.theme.colors.betting.negative};
  font-weight: 600;
  font-size: 0.85rem;
`;

const MoreBetsButton = styled.button`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: 0.85rem;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    background: ${props => props.theme.colors.background.hover};
  }
`;

const ExpandedBets = styled.div`
  border-top: 1px solid ${props => props.theme.colors.border.primary};
  padding-top: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const BetCategory = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const CategoryTitle = styled.h4`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const PlayerProp = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PlayerName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const PropOptions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.xs};
`;

const PropButton = styled.button`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    background: ${props => props.theme.colors.accent.primary}10;
  }
`;

const GameCard = ({ game, onBetSelect, selectedBets = [] }) => {
  const [expanded, setExpanded] = useState(false);

  const formatOdds = (odds) => {
    if (!odds) return 'N/A';
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  const handleBetClick = (bet) => {
    const betId = `${game.id}-${bet.type}-${bet.team}`;
    onBetSelect({
      id: betId,
      gameId: game.id,
      team: bet.team,
      betType: bet.type,
      odds: bet.odds,
      line: bet.line,
      sportsbook: bet.sportsbook,
      gameInfo: {
        homeTeam: game.homeTeam.name,
        awayTeam: game.awayTeam.name,
        league: game.league,
        gameTime: game.gameTime
      }
    });
  };

  const isBetSelected = (betType, team) => {
    const betId = `${game.id}-${betType}-${team}`;
    return selectedBets.some(bet => bet.id === betId);
  };

  const isLive = game.isLive;
  const gameTime = new Date(game.gameTime);
  const now = new Date();
  const isUpcoming = gameTime > now;

  return (
    <CardContainer>
      <GameHeader>
        <GameInfo>
          <GameTime>
            <Clock size={14} />
            {isLive ? 'LIVE' : isUpcoming ?
              gameTime.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              }) : 'Final'
            }
          </GameTime>
          {isLive && <LiveIndicator>Live</LiveIndicator>}
          {game.featured && (
            <FeaturedBadge>
              <Star size={12} />
              Featured
            </FeaturedBadge>
          )}
        </GameInfo>
      </GameHeader>

      <TeamsContainer>
        <Team>
          <TeamLogo>
            {game.awayTeam.logo}
          </TeamLogo>
          <TeamInfo>
            <TeamName>{game.awayTeam.name}</TeamName>
            <TeamRecord>{game.awayTeam.record}</TeamRecord>
          </TeamInfo>
        </Team>

        <VSContainer>
          <VS>vs</VS>
          {isLive && game.awayScore !== null && game.homeScore !== null && (
            <Score>
              {game.awayScore} - {game.homeScore}
            </Score>
          )}
          {isLive && game.quarter && (
            <div style={{ fontSize: '0.7rem', color: '#888' }}>
              {game.quarter} {game.timeRemaining}
            </div>
          )}
        </VSContainer>

        <Team home>
          <TeamLogo>
            {game.homeTeam.logo}
          </TeamLogo>
          <TeamInfo home>
            <TeamName>{game.homeTeam.name}</TeamName>
            <TeamRecord>{game.homeTeam.record}</TeamRecord>
          </TeamInfo>
        </Team>
      </TeamsContainer>

      <QuickBetsContainer>
        {/* Moneyline */}
        <BetOption
          selected={isBetSelected('moneyline', game.awayTeam.name)}
          onClick={() => handleBetClick({
            team: game.awayTeam.name,
            type: 'moneyline',
            odds: game.bets?.moneyline?.away?.odds || null,
            sportsbook: game.bets?.moneyline?.away?.sportsbook || 'N/A'
          })}
        >
          <BetLabel>Moneyline</BetLabel>
          <BetValue>{game.awayTeam.name}</BetValue>
          <BetOdds odds={game.bets?.moneyline?.away?.odds || 0}>
            {formatOdds(game.bets?.moneyline?.away?.odds)}
          </BetOdds>
        </BetOption>

        <BetOption
          selected={isBetSelected('moneyline', game.homeTeam.name)}
          onClick={() => handleBetClick({
            team: game.homeTeam.name,
            type: 'moneyline',
            odds: game.bets?.moneyline?.home?.odds || null,
            sportsbook: game.bets?.moneyline?.home?.sportsbook || 'N/A'
          })}
        >
          <BetLabel>Moneyline</BetLabel>
          <BetValue>{game.homeTeam.name}</BetValue>
          <BetOdds odds={game.bets?.moneyline?.home?.odds || 0}>
            {formatOdds(game.bets?.moneyline?.home?.odds)}
          </BetOdds>
        </BetOption>

        {/* Spread */}
        {game.bets?.spread && (
          <>
            <BetOption
              selected={isBetSelected('spread', game.awayTeam.name)}
              onClick={() => handleBetClick({
                team: game.awayTeam.name,
                type: 'spread',
                odds: game.bets.spread.away?.odds,
                line: game.bets.spread.away?.line,
                sportsbook: game.bets.spread.away?.sportsbook || 'N/A'
              })}
            >
              <BetLabel>Spread</BetLabel>
              <BetValue>{game.awayTeam.name} {formatOdds(game.bets.spread.away?.line)}</BetValue>
              <BetOdds odds={game.bets.spread.away?.odds || 0}>
                {formatOdds(game.bets.spread.away?.odds)}
              </BetOdds>
            </BetOption>

            <BetOption
              selected={isBetSelected('spread', game.homeTeam.name)}
              onClick={() => handleBetClick({
                team: game.homeTeam.name,
                type: 'spread',
                odds: game.bets.spread.home?.odds,
                line: game.bets.spread.home?.line,
                sportsbook: game.bets.spread.home?.sportsbook || 'N/A'
              })}
            >
              <BetLabel>Spread</BetLabel>
              <BetValue>{game.homeTeam.name} {formatOdds(game.bets.spread.home?.line)}</BetValue>
              <BetOdds odds={game.bets.spread.home?.odds || 0}>
                {formatOdds(game.bets.spread.home?.odds)}
              </BetOdds>
            </BetOption>
          </>
        )}

        {/* Total */}
        {game.bets?.total && (
          <>
            <BetOption
              selected={isBetSelected('total', `Over ${game.bets.total.over?.line}`)}
              onClick={() => handleBetClick({
                team: `Over ${game.bets.total.over?.line}`,
                type: 'total',
                odds: game.bets.total.over?.odds,
                line: `Over ${game.bets.total.over?.line}`,
                sportsbook: game.bets.total.over?.sportsbook || 'N/A'
              })}
            >
              <BetLabel>Total</BetLabel>
              <BetValue>Over {game.bets.total.over?.line}</BetValue>
              <BetOdds odds={game.bets.total.over?.odds || 0}>
                {formatOdds(game.bets.total.over?.odds)}
              </BetOdds>
            </BetOption>

            <BetOption
              selected={isBetSelected('total', `Under ${game.bets.total.under?.line}`)}
              onClick={() => handleBetClick({
                team: `Under ${game.bets.total.under?.line}`,
                type: 'total',
                odds: game.bets.total.under?.odds,
                line: `Under ${game.bets.total.under?.line}`,
                sportsbook: game.bets.total.under?.sportsbook || 'N/A'
              })}
            >
              <BetLabel>Total</BetLabel>
              <BetValue>Under {game.bets.total.under?.line}</BetValue>
              <BetOdds odds={game.bets.total.under?.odds || 0}>
                {formatOdds(game.bets.total.under?.odds)}
              </BetOdds>
            </BetOption>
          </>
        )}
      </QuickBetsContainer>

      <MoreBetsButton onClick={() => setExpanded(!expanded)}>
        <span>More Bets ({game.total_markets || '50+'})</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </MoreBetsButton>

      {expanded && (
        <ExpandedBets>
          {/* Player Props */}
          <BetCategory>
            <CategoryTitle>
              <Users size={16} />
              Player Props
            </CategoryTitle>

            {game.player_props?.map((prop, index) => (
              <PlayerProp key={index}>
                <PlayerName>{prop.player_name}</PlayerName>
                <PropOptions>
                  <PropButton onClick={() => handleBetClick({
                    team: `${prop.player_name} Over ${prop.line} ${prop.stat_type}`,
                    type: 'Player Prop',
                    odds: prop.over_odds,
                    line: `Over ${prop.line} ${prop.stat_type}`,
                    sportsbook: 'DraftKings'
                  })}>
                    <div style={{ fontSize: '0.8rem', marginBottom: '2px' }}>
                      Over {prop.line} {prop.stat_type}
                    </div>
                    <BetOdds odds={prop.over_odds}>
                      {formatOdds(prop.over_odds)}
                    </BetOdds>
                  </PropButton>

                  <PropButton onClick={() => handleBetClick({
                    team: `${prop.player_name} Under ${prop.line} ${prop.stat_type}`,
                    type: 'Player Prop',
                    odds: prop.under_odds,
                    line: `Under ${prop.line} ${prop.stat_type}`,
                    sportsbook: 'DraftKings'
                  })}>
                    <div style={{ fontSize: '0.8rem', marginBottom: '2px' }}>
                      Under {prop.line} {prop.stat_type}
                    </div>
                    <BetOdds odds={prop.under_odds}>
                      {formatOdds(prop.under_odds)}
                    </BetOdds>
                  </PropButton>
                </PropOptions>
              </PlayerProp>
            ))}
          </BetCategory>

          {/* Alternative Lines */}
          <BetCategory>
            <CategoryTitle>
              <TrendingUp size={16} />
              Alternative Lines
            </CategoryTitle>

            {game.alt_lines?.spread?.map((line, index) => (
              <QuickBetsContainer key={index} style={{ marginBottom: '8px' }}>
                <BetOption onClick={() => handleBetClick({
                  team: game.away_team.name,
                  type: 'Alt Spread',
                  odds: line.away_odds,
                  line: `${line.line}`,
                  sportsbook: 'DraftKings'
                })}>
                  <BetLabel>Alt Spread</BetLabel>
                  <BetValue>{game.away_team.abbreviation} {line.line}</BetValue>
                  <BetOdds odds={line.away_odds}>
                    {formatOdds(line.away_odds)}
                  </BetOdds>
                </BetOption>

                <BetOption onClick={() => handleBetClick({
                  team: game.home_team.name,
                  type: 'Alt Spread',
                  odds: line.home_odds,
                  line: `${line.home_line}`,
                  sportsbook: 'DraftKings'
                })}>
                  <BetLabel>Alt Spread</BetLabel>
                  <BetValue>{game.home_team.abbreviation} {line.home_line}</BetValue>
                  <BetOdds odds={line.home_odds}>
                    {formatOdds(line.home_odds)}
                  </BetOdds>
                </BetOption>
              </QuickBetsContainer>
            ))}
          </BetCategory>
        </ExpandedBets>
      )}
    </CardContainer>
  );
};

export default GameCard;