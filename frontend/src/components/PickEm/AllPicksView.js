import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Eye, Lock, Clock, Users, Trophy, Target, CheckCircle, XCircle, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

const AllPicksContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  overflow: hidden;
`;

const Header = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.lg};
`;

const HeaderTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const HeaderDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const GamesList = styled.div`
  max-height: 800px;
  overflow-y: auto;
`;

const GameSection = styled.div`
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};
  
  &:last-child {
    border-bottom: none;
  }
`;

const GameHeader = styled.div`
  background: ${props => props.theme.colors.background.tertiary};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const GameInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    justify-content: center;
  }
`;

const GameTeams = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 1rem;
`;

const GameTime = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const GameStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.isLocked ? props.theme.colors.accent.secondary : props.theme.colors.accent.primary};
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => props.isLocked ? 
    `${props.theme.colors.accent.secondary}20` : 
    `${props.theme.colors.accent.primary}20`};
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const PicksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const MemberPickRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-right: 1px solid ${props => props.theme.colors.border.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};
  background: ${props => props.isCorrect === true ? 
    `${props.theme.colors.success}10` : 
    props.isCorrect === false ? 
      `${props.theme.colors.accent.secondary}10` : 
      'transparent'};
  
  &:last-child {
    border-right: none;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    border-right: none;
  }
`;

const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const MemberAvatar = styled.div`
  width: 32px;
  height: 32px;
  background: ${props => props.theme.colors.background.tertiary};
  border-radius: ${props => props.theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 600;
  font-size: 0.8rem;
`;

const MemberName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.9rem;
`;

const PickDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.9rem;
`;

const PickResult = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => 
    props.result === 'correct' ? props.theme.colors.success :
    props.result === 'incorrect' ? props.theme.colors.accent.secondary :
    'transparent'};
  color: ${props => props.result !== 'pending' ? props.theme.colors.background.primary : props.theme.colors.text.muted};
`;

const NoPick = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-style: italic;
  font-size: 0.85rem;
`;

const StatusBanner = styled.div`
  background: ${props => props.isLocked ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.secondary}20, ${props.theme.colors.accent.secondary}10)` :
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}20, ${props.theme.colors.accent.primary}10)`};
  border: 1px solid ${props => props.isLocked ? 
    `${props.theme.colors.accent.secondary}40` : 
    `${props.theme.colors.accent.primary}40`};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const StatusText = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatusSubtext = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const AllPicksView = ({ pool, currentWeek }) => {
  const [allPicks, setAllPicks] = useState([]);
  const [games, setGames] = useState([]);
  const [isWeekLocked, setIsWeekLocked] = useState(false);
  const [firstGameTime, setFirstGameTime] = useState(null);

  useEffect(() => {
    loadAllPicksData();
  }, [pool.id, currentWeek]);

  const loadAllPicksData = async () => {
    try {
      // Mock NFL games for the week
      const mockGames = [
        {
          id: 1,
          home_team: 'Kansas City Chiefs',
          away_team: 'Buffalo Bills',
          commence_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago (game started)
          winner: 'Kansas City Chiefs'
        },
        {
          id: 2,
          home_team: 'Dallas Cowboys',
          away_team: 'Philadelphia Eagles',
          commence_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          winner: null
        },
        {
          id: 3,
          home_team: 'Green Bay Packers',
          away_team: 'Chicago Bears',
          commence_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
          winner: null
        },
        {
          id: 4,
          home_team: 'New England Patriots',
          away_team: 'Miami Dolphins',
          commence_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
          winner: null
        }
      ];

      setGames(mockGames);

      // Find the first game time
      const sortedGames = [...mockGames].sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
      const firstGame = sortedGames[0];
      setFirstGameTime(new Date(firstGame.commence_time));
      
      // Check if first game has started
      const now = new Date();
      const weekLocked = new Date(firstGame.commence_time) <= now;
      setIsWeekLocked(weekLocked);

      // Mock all members' picks (only show if week is locked)
      if (weekLocked) {
        const mockAllPicks = [
          {
            member_id: 1,
            member_name: 'John Smith',
            picks: [
              { game_id: 1, selected_team: 'Kansas City Chiefs', is_correct: true },
              { game_id: 2, selected_team: 'Philadelphia Eagles', is_correct: null },
              { game_id: 3, selected_team: 'Green Bay Packers', is_correct: null },
              { game_id: 4, selected_team: 'New England Patriots', is_correct: null }
            ]
          },
          {
            member_id: 2,
            member_name: 'Sarah Johnson',
            picks: [
              { game_id: 1, selected_team: 'Buffalo Bills', is_correct: false },
              { game_id: 2, selected_team: 'Dallas Cowboys', is_correct: null },
              { game_id: 3, selected_team: 'Chicago Bears', is_correct: null },
              { game_id: 4, selected_team: 'Miami Dolphins', is_correct: null }
            ]
          },
          {
            member_id: 3,
            member_name: 'Mike Davis',
            picks: [
              { game_id: 1, selected_team: 'Kansas City Chiefs', is_correct: true },
              { game_id: 2, selected_team: 'Philadelphia Eagles', is_correct: null },
              { game_id: 3, selected_team: 'Green Bay Packers', is_correct: null }
              // Note: No pick for game 4
            ]
          },
          {
            member_id: 4,
            member_name: 'Emily Wilson',
            picks: [
              { game_id: 1, selected_team: 'Buffalo Bills', is_correct: false },
              { game_id: 2, selected_team: 'Philadelphia Eagles', is_correct: null },
              { game_id: 3, selected_team: 'Green Bay Packers', is_correct: null },
              { game_id: 4, selected_team: 'New England Patriots', is_correct: null }
            ]
          }
        ];
        setAllPicks(mockAllPicks);
      }

    } catch (error) {
      console.error('Error loading all picks data:', error);
      toast.error('Failed to load picks data');
    }
  };

  const formatGameTime = (timeString) => {
    return new Date(timeString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const isGameStarted = (gameTime) => {
    return new Date(gameTime) <= new Date();
  };

  const getMemberPick = (memberId, gameId) => {
    const member = allPicks.find(m => m.member_id === memberId);
    if (!member) return null;
    return member.picks.find(p => p.game_id === gameId);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getPickResult = (pick, game) => {
    if (!pick || !game.winner) return 'pending';
    return pick.selected_team === game.winner ? 'correct' : 'incorrect';
  };

  if (!isWeekLocked) {
    return (
      <StatusBanner isLocked={false}>
        <StatusText>🔒 Picks are still hidden</StatusText>
        <StatusSubtext>
          All picks will be visible to everyone once the first game starts on {firstGameTime ? formatGameTime(firstGameTime.toISOString()) : 'game day'}
        </StatusSubtext>
      </StatusBanner>
    );
  }

  return (
    <div>
      <StatusBanner isLocked={true}>
        <StatusText>👁️ All Picks Now Visible!</StatusText>
        <StatusSubtext>
          The first game has started, so all member picks are now visible to everyone in the pool.
        </StatusSubtext>
      </StatusBanner>

      <AllPicksContainer>
        <Header>
          <HeaderTitle>
            <Eye size={20} />
            All Member Picks - Week {currentWeek.week_number}
          </HeaderTitle>
          <HeaderDescription>
            <Lock size={14} />
            Picks locked • Results update as games complete
          </HeaderDescription>
        </Header>

        <GamesList>
          {games.map(game => (
            <GameSection key={game.id}>
              <GameHeader>
                <GameInfo>
                  <GameTeams>{game.away_team} @ {game.home_team}</GameTeams>
                  <GameTime>
                    <Clock size={14} />
                    {formatGameTime(game.commence_time)}
                  </GameTime>
                </GameInfo>
                <GameStatus isLocked={isGameStarted(game.commence_time)}>
                  {isGameStarted(game.commence_time) ? <Lock size={12} /> : <Target size={12} />}
                  {isGameStarted(game.commence_time) ? 'In Progress' : 'Upcoming'}
                </GameStatus>
              </GameHeader>

              <PicksGrid>
                {allPicks.map(member => {
                  const pick = getMemberPick(member.member_id, game.id);
                  const result = pick ? getPickResult(pick, game) : null;

                  return (
                    <MemberPickRow key={member.member_id} isCorrect={result === 'correct' ? true : result === 'incorrect' ? false : null}>
                      <MemberInfo>
                        <MemberAvatar>
                          {getInitials(member.member_name)}
                        </MemberAvatar>
                        <MemberName>{member.member_name}</MemberName>
                      </MemberInfo>

                      <PickDisplay>
                        {pick ? (
                          <>
                            <span>{pick.selected_team}</span>
                            <PickResult result={result}>
                              {result === 'correct' && <CheckCircle size={12} />}
                              {result === 'incorrect' && <XCircle size={12} />}
                              {result === 'pending' && <Minus size={12} />}
                            </PickResult>
                          </>
                        ) : (
                          <NoPick>No Pick</NoPick>
                        )}
                      </PickDisplay>
                    </MemberPickRow>
                  );
                })}
              </PicksGrid>
            </GameSection>
          ))}
        </GamesList>
      </AllPicksContainer>
    </div>
  );
};

export default AllPicksView;