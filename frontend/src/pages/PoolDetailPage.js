import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Trophy, Users, Clock, Target, Share2, Settings, ArrowLeft, Calendar, TrendingUp, Award, ToggleLeft, ToggleRight, Crown, User, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import WeeklyPicksForm from '../components/PickEm/WeeklyPicksForm';
import Leaderboard from '../components/PickEm/Leaderboard';
import OwnerManagement from '../components/PickEm/OwnerManagement';
import MemberManagement from '../components/PickEm/MemberManagement';
import AllPicksView from '../components/PickEm/AllPicksView';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.sm};
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  cursor: pointer;
  margin-bottom: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.background.hover};
  }
`;

const PoolHeader = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const PoolTitleSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${props => props.theme.spacing.md};
  }
`;

const PoolTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin: 0;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 1.5rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: stretch;
    flex-wrap: wrap;
  }
`;

const OwnerToggle = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  margin-right: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: center;
    margin-right: 0;
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => props.active ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)` : 
    'transparent'};
  color: ${props => props.active ? 
    props.theme.colors.background.primary : 
    props.theme.colors.text.secondary};
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.active ? 
      props.theme.colors.background.primary : 
      props.theme.colors.text.primary};
  }
`;

const ModeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)` : 
    props.theme.colors.background.secondary};
  border: ${props => props.primary ? 'none' : `1px solid ${props.theme.colors.border.secondary}`};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.primary ? props.theme.colors.background.primary : props.theme.colors.text.primary};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex: 1;
    justify-content: center;
  }
`;

const PoolDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const PoolStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing.md};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  text-align: center;
`;

const StatValue = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ContentTabs = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  margin-bottom: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`;

const Tab = styled.button`
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 600;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
  
  ${props => props.active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: ${props.theme.colors.accent.primary};
    }
  `}
`;

const TabContent = styled.div`
  min-height: 400px;
`;

const InviteCodeSection = styled.div`
  background: ${props => props.theme.colors.background.tertiary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const InviteCode = styled.div`
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${props => props.theme.colors.accent.primary};
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  margin: ${props => props.theme.spacing.sm} 0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.background.hover};
  }
`;

const InviteLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const PoolDetailPage = () => {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const [pool, setPool] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [userPicks, setUserPicks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('picks');
  const [isLoading, setIsLoading] = useState(true);
  const [isOwnerMode, setIsOwnerMode] = useState(false);
  const [games, setGames] = useState([]);
  const [isWeekLocked, setIsWeekLocked] = useState(false);

  // Show notification when toggling modes
  const handleModeToggle = (newMode) => {
    setIsOwnerMode(newMode);
    if (newMode) {
      toast.success('🔧 Switched to Owner Mode - You can now manage pool settings!');
    } else {
      toast.success('👤 Switched to User Mode - You see what members see!');
    }
  };

  useEffect(() => {
    loadPoolData();
  }, [poolId]);

  const loadPoolData = async () => {
    try {
      setIsLoading(true);
      
      // For demo mode, create mock pool data based on poolId
      const mockPool = {
        id: poolId,
        name: `Demo Pool ${poolId}`,
        description: 'This is a demonstration pool showing how Pick\'em works. In Owner Mode, you can see admin features!',
        member_count: 12,
        user_role: 'admin', // Make user admin so they can see owner features
        invite_code: `DEMO${poolId}`,
        created_at: new Date().toISOString(),
        settings: {
          pick_type: 'straight_up',
          include_playoffs: true,
          max_members: 50
        }
      };
      
      setPool(mockPool);
      
      // Mock current week data
      const mockWeek = {
        week_number: 6,
        season_year: 2024,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      setCurrentWeek(mockWeek);
      
      // Mock user picks
      const mockPicks = [
        { game_id: 1, selected_team: 'Kansas City Chiefs' },
        { game_id: 2, selected_team: 'Philadelphia Eagles' }
      ];
      setUserPicks(mockPicks);
      
      // Mock leaderboard data
      const mockLeaderboard = [
        {
          user_id: 1,
          display_name: 'John Smith',
          correct_picks: 28,
          total_picks: 40,
          current_streak: 3
        },
        {
          user_id: 2,
          display_name: 'Sarah Johnson', 
          correct_picks: 26,
          total_picks: 40,
          current_streak: -1
        },
        {
          user_id: 3,
          display_name: 'Mike Davis',
          correct_picks: 24,
          total_picks: 40,
          current_streak: 2
        }
      ];
      setLeaderboard(mockLeaderboard);
      
      // Load games and check if week is locked
      await loadWeeklyGames(mockWeek);
      
    } catch (error) {
      console.error('Error loading pool data:', error);
      toast.error('Failed to load pool data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeeklyGames = async (week) => {
    try {
      const response = await fetch(`http://localhost:5001/api/pickem/nfl/weeks/${week.week_number}/games`);
      
      if (response.ok) {
        const data = await response.json();
        const gamesList = data.games || [];
        setGames(gamesList);
        
        // Check if week is locked (first game has started)
        if (gamesList.length > 0) {
          const sortedGames = [...gamesList].sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
          const firstGame = sortedGames[0];
          const firstGameTime = new Date(firstGame.commence_time);
          const now = new Date();
          setIsWeekLocked(firstGameTime <= now);
        }
      }
    } catch (error) {
      console.error('Error loading games:', error);
      // Use mock games for demo
      const mockGames = [
        {
          id: 1,
          home_team: 'Kansas City Chiefs',
          away_team: 'Buffalo Bills',
          commence_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        {
          id: 2,
          home_team: 'Dallas Cowboys',
          away_team: 'Philadelphia Eagles',
          commence_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
        }
      ];
      setGames(mockGames);
      
      // Check if week is locked with mock data
      const firstGameTime = new Date(mockGames[0].commence_time);
      const now = new Date();
      setIsWeekLocked(firstGameTime <= now);
    }
  };

  const handlePicksSubmitted = (newPicks) => {
    setUserPicks(newPicks);
    toast.success('Picks submitted successfully!');
    
    // Reload leaderboard after picks submission
    loadPoolData();
  };

  const handleSharePool = async () => {
    const shareText = `Join my NFL Pick'em Pool: ${pool.name}\nInvite Code: ${pool.invite_code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: pool.name,
          text: shareText,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('Invite copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy invite');
      }
    }
  };

  const handleCopyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(pool.invite_code);
      toast.success('Invite code copied!');
    } catch (error) {
      toast.error('Failed to copy invite code');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading pool details..." />;
  }

  if (!pool) {
    return (
      <PageContainer>
        <Container>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Pool not found</h2>
            <p>The pool you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container>
        <BackButton onClick={() => navigate('/pick-em')}>
          <ArrowLeft size={16} />
          Back to Pools
        </BackButton>

        <PoolHeader>
          <PoolTitleSection>
            <PoolTitle>
              <Trophy size={24} />
              {pool.name}
            </PoolTitle>
            <ActionButtons>
              {pool.user_role === 'admin' && (
                <OwnerToggle>
                  <ModeIndicator>
                    {isOwnerMode ? <Crown size={14} /> : <User size={14} />}
                    {isOwnerMode ? 'Owner Mode' : 'User Mode'}
                  </ModeIndicator>
                  <ToggleButton
                    active={!isOwnerMode}
                    onClick={() => handleModeToggle(false)}
                  >
                    <User size={16} />
                    User
                  </ToggleButton>
                  <ToggleButton
                    active={isOwnerMode}
                    onClick={() => handleModeToggle(true)}
                  >
                    <Crown size={16} />
                    Owner
                  </ToggleButton>
                </OwnerToggle>
              )}
              <ActionButton onClick={handleSharePool}>
                <Share2 size={16} />
                Share
              </ActionButton>
              {pool.user_role === 'admin' && isOwnerMode && (
                <ActionButton>
                  <Settings size={16} />
                  Settings
                </ActionButton>
              )}
            </ActionButtons>
          </PoolTitleSection>

          {pool.description && (
            <PoolDescription>{pool.description}</PoolDescription>
          )}

          <PoolStats>
            <StatCard>
              <StatValue>
                <Users size={20} />
                {pool.member_count}
              </StatValue>
              <StatLabel>Members</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                <Calendar size={20} />
                {currentWeek?.week_number || '--'}
              </StatValue>
              <StatLabel>Current Week</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                <Target size={20} />
                {pool.settings.pick_type === 'straight_up' ? 'Straight Up' : 
                 pool.settings.pick_type === 'against_spread' ? 'Against Spread' : 'Confidence'}
              </StatValue>
              <StatLabel>Pick Type</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>
                <Award size={20} />
                {leaderboard.length > 0 ? leaderboard[0].correct_picks || 0 : 0}
              </StatValue>
              <StatLabel>Leader Score</StatLabel>
            </StatCard>
          </PoolStats>

          {pool.user_role === 'admin' && (
            <InviteCodeSection>
              <InviteLabel>Share this invite code with friends:</InviteLabel>
              <InviteCode onClick={handleCopyInviteCode}>
                {pool.invite_code}
              </InviteCode>
            </InviteCodeSection>
          )}
        </PoolHeader>

        <ContentTabs>
          <Tab 
            active={activeTab === 'picks'} 
            onClick={() => setActiveTab('picks')}
          >
            <Target size={16} />
            {isOwnerMode && pool.user_role === 'admin' ? 'View Picks' : 'Make Picks'}
          </Tab>
          <Tab 
            active={activeTab === 'leaderboard'} 
            onClick={() => setActiveTab('leaderboard')}
          >
            <TrendingUp size={16} />
            Leaderboard
          </Tab>
          {isWeekLocked && (
            <Tab 
              active={activeTab === 'all-picks'} 
              onClick={() => setActiveTab('all-picks')}
            >
              <Eye size={16} />
              All Picks
            </Tab>
          )}
          {pool.user_role === 'admin' && isOwnerMode && (
            <>
              <Tab 
                active={activeTab === 'management'} 
                onClick={() => setActiveTab('management')}
              >
                <Settings size={16} />
                Pool Management
              </Tab>
              <Tab 
                active={activeTab === 'members'} 
                onClick={() => setActiveTab('members')}
              >
                <Users size={16} />
                Members
              </Tab>
            </>
          )}
        </ContentTabs>

        <TabContent>
          {activeTab === 'picks' && currentWeek && (
            <WeeklyPicksForm
              pool={pool}
              week={currentWeek}
              existingPicks={userPicks}
              onPicksSubmitted={handlePicksSubmitted}
              isOwnerMode={isOwnerMode && pool.user_role === 'admin'}
            />
          )}
          
          {activeTab === 'leaderboard' && (
            <Leaderboard
              standings={leaderboard}
              currentWeek={currentWeek}
            />
          )}
          
          {activeTab === 'all-picks' && isWeekLocked && (
            <AllPicksView
              pool={pool}
              currentWeek={currentWeek}
            />
          )}
          
          {activeTab === 'management' && pool.user_role === 'admin' && isOwnerMode && (
            <OwnerManagement pool={pool} />
          )}
          
          {activeTab === 'members' && pool.user_role === 'admin' && isOwnerMode && (
            <MemberManagement pool={pool} />
          )}
        </TabContent>
      </Container>
    </PageContainer>
  );
};

export default PoolDetailPage;