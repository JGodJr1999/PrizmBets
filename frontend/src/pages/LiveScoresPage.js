import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Activity, Clock, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import LiveScoreCard from '../components/Sports/LiveScoreCard';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
  }
`;

const Header = styled.div`
  max-width: 800px;
  margin: 0 auto ${props => props.theme.spacing.xl} auto;
  text-align: center;
  background: ${props => props.theme.colors.background.card};
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  position: relative;
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.lg};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      ${props => props.theme.colors.accent.primary}08 0%, 
      transparent 50%,
      ${props => props.theme.colors.accent.primary}08 100%
    );
    pointer-events: none;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2rem;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1.75rem;
    flex-direction: column;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 1rem;
  }
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: center;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.accent.primaryHover};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    animation: ${props => props.loading ? 'spin 1s linear infinite' : 'none'};
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const LiveBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: #22c55e;
  color: white;
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.8rem;
  font-weight: 600;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
`;

const ScoresContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  margin: ${props => props.theme.spacing.xl} 0 ${props => props.theme.spacing.lg} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ScoresList = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  
  > * {
    flex: 0 0 auto;
    width: 100%;
    max-width: 450px;
    
    @media (min-width: ${props => props.theme.breakpoints.md}) {
      width: calc(50% - ${props => props.theme.spacing.lg} / 2);
    }
    
    @media (min-width: 1000px) {
      width: calc(33.333% - ${props => props.theme.spacing.lg} * 2 / 3);
    }
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    gap: ${props => props.theme.spacing.md};
    padding: 0 ${props => props.theme.spacing.md};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  color: ${props => props.theme.colors.text.secondary};
  
  h3 {
    color: ${props => props.theme.colors.text.primary};
    margin-bottom: ${props => props.theme.spacing.sm};
    font-size: 1.3rem;
  }
  
  p {
    font-size: 1rem;
    margin-bottom: ${props => props.theme.spacing.lg};
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  color: ${props => props.theme.colors.text.secondary};
  
  div {
    font-size: 1.1rem;
    margin-bottom: ${props => props.theme.spacing.md};
  }
`;

const ErrorState = styled.div`
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.lg} auto;
  max-width: 600px;
  text-align: center;
  
  h3 {
    color: #ef4444;
    margin-bottom: ${props => props.theme.spacing.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${props => props.theme.spacing.sm};
  }
  
  p {
    color: ${props => props.theme.colors.text.secondary};
    margin-bottom: ${props => props.theme.spacing.md};
  }
`;

const LiveScoresPage = () => {
  const [liveGames, setLiveGames] = useState([]);
  const [startingSoon, setStartingSoon] = useState([]);
  const [recentlyFinished, setRecentlyFinished] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchLiveScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/live-scores`);
      const data = await response.json();
      
      if (data.success) {
        setLiveGames(data.live_games || []);
        setStartingSoon(data.starting_soon || []);
        setRecentlyFinished(data.recently_finished || []);
        setLastUpdate(new Date());
      } else {
        throw new Error(data.error || 'Failed to load live scores');
      }
    } catch (err) {
      console.error('Failed to load live scores:', err);
      setError(err.message);
      setLiveGames([]);
      setStartingSoon([]);
      setRecentlyFinished([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveScores();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLiveScores, 30000);
    
    return () => clearInterval(interval);
  }, [fetchLiveScores]);

  return (
    <PageContainer>
      <Header>
        <Title>
          <Activity size={40} />
          Live Sports Scores
        </Title>
        <Subtitle>
          Real-time scores and game updates from all major sports
        </Subtitle>
        
        <Controls>
          <RefreshButton 
            onClick={fetchLiveScores} 
            disabled={loading}
            loading={loading}
          >
            <RefreshCw size={16} />
            {loading ? 'Updating...' : 'Refresh Scores'}
          </RefreshButton>
          
          <StatusIndicator>
            <Clock size={16} />
            {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Loading...'}
          </StatusIndicator>
        </Controls>
      </Header>

      <ScoresContainer>
        {error && (
          <ErrorState>
            <h3>
              <AlertCircle size={20} />
              Unable to Load Scores
            </h3>
            <p>{error}</p>
            <RefreshButton onClick={fetchLiveScores} disabled={loading}>
              Try Again
            </RefreshButton>
          </ErrorState>
        )}

        {loading && !liveGames.length && !startingSoon.length && !recentlyFinished.length && (
          <LoadingState>
            <div>Loading live scores...</div>
            <Activity size={32} style={{ margin: '0 auto', opacity: 0.5, animation: 'pulse 2s infinite' }} />
          </LoadingState>
        )}

        {!loading && !error && liveGames.length === 0 && startingSoon.length === 0 && recentlyFinished.length === 0 && (
          <EmptyState>
            <Calendar size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <h3>No Games Right Now</h3>
            <p>No live games, upcoming games (within 4 hours), or recently finished games (within 4 hours) at the moment. Check back later for live sports action!</p>
          </EmptyState>
        )}

        {liveGames.length > 0 && (
          <>
            <SectionTitle>
              <LiveBadge>
                <Activity size={12} />
                Live Now
              </LiveBadge>
              {liveGames.length} Game{liveGames.length !== 1 ? 's' : ''}
            </SectionTitle>
            <ScoresList>
              {liveGames.map(game => (
                <LiveScoreCard key={game.id} game={game} isLive={true} />
              ))}
            </ScoresList>
          </>
        )}

        {startingSoon.length > 0 && (
          <>
            <SectionTitle>
              <Clock size={20} />
              Starting Soon
            </SectionTitle>
            <ScoresList>
              {startingSoon.map(game => (
                <LiveScoreCard key={game.id} game={game} isLive={false} showCountdown={true} />
              ))}
            </ScoresList>
          </>
        )}

        {recentlyFinished.length > 0 && (
          <>
            <SectionTitle>
              <Calendar size={20} />
              Recently Finished
            </SectionTitle>
            <ScoresList>
              {recentlyFinished.map(game => (
                <LiveScoreCard key={game.id} game={game} isLive={false} showFinalScore={true} />
              ))}
            </ScoresList>
          </>
        )}
      </ScoresContainer>
    </PageContainer>
  );
};

export default LiveScoresPage;