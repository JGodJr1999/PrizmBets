import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Trophy, Plus, Users, Search, Filter, TrendingUp, Star, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PoolCard from '../components/PickEm/PoolCard';
import CreatePoolModal from '../components/PickEm/CreatePoolModal';
import JoinPoolModal from '../components/PickEm/JoinPoolModal';

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

const Header = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2rem;
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
  }
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto ${props => props.theme.spacing.lg} auto;
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.lg};
`;

const StatCard = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border.primary};
`;

const StatValue = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ActionsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.xl};
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: stretch;
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background: ${props => props.primary ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)` : 
    props.theme.colors.background.card};
  color: ${props => props.primary ? props.theme.colors.background.primary : props.theme.colors.text.primary};
  border: ${props => props.primary ? 'none' : `1px solid ${props.theme.colors.border.primary}`};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex: 1;
    justify-content: center;
  }
`;

const FilterSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: center;
  }
`;

const SearchInput = styled.input`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  width: 250px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.card};
  color: ${props => props.theme.colors.text.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
    border-color: ${props => props.theme.colors.border.secondary};
  }
`;

const PoolsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.md};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  margin-top: ${props => props.theme.spacing.xl};
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  opacity: 0.5;
`;

const EmptyStateTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const EmptyStateText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const DemoNotice = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary}20, ${props => props.theme.colors.accent.primary}10);
  border: 1px solid ${props => props.theme.colors.accent.primary}40;
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: center;
`;

const DemoNoticeText = styled.p`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  margin: 0;
  
  strong {
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const PickEmPageDemo = () => {
  const navigate = useNavigate();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadDemoPools();
  }, []);

  const loadDemoPools = () => {
    // Demo pools data
    const demoPools = [
      {
        id: 1,
        name: 'Office NFL Pool 2024',
        description: 'Weekly NFL picks with coworkers. Straight up picks, winner takes all!',
        member_count: 12,
        user_role: 'member',
        invite_code: 'OFFICE24',
        created_at: '2024-08-01T10:00:00Z',
        stats: {
          total_picks: 48,
          total_correct: 32,
          win_percentage: 67
        }
      },
      {
        id: 2,
        name: 'Friends & Family Picks',
        description: 'Casual weekly picks with friends and family. No money involved, just bragging rights!',
        member_count: 8,
        user_role: 'admin',
        invite_code: 'FAMILY2024',
        created_at: '2024-07-15T14:30:00Z',
        stats: {
          total_picks: 64,
          total_correct: 45,
          win_percentage: 70
        }
      },
      {
        id: 3,
        name: 'College Buddies Pool',
        description: 'Alumni pool from State University. Against the spread picks for extra challenge.',
        member_count: 15,
        user_role: 'member',
        invite_code: 'STATEALU',
        created_at: '2024-08-10T09:15:00Z',
        stats: {
          total_picks: 32,
          total_correct: 18,
          win_percentage: 56
        }
      }
    ];
    
    setPools(demoPools);
  };

  const handleCreatePool = (poolData) => {
    const newPool = {
      id: Date.now(),
      ...poolData,
      member_count: 1,
      user_role: 'admin',
      invite_code: generateInviteCode(),
      created_at: new Date().toISOString(),
      stats: {
        total_picks: 0,
        total_correct: 0,
        win_percentage: 0
      }
    };
    
    setPools(prev => [newPool, ...prev]);
    setShowCreateModal(false);
    toast.success('Pool created successfully!');
  };

  const handleJoinPool = (inviteCode, displayName) => {
    // Simulate joining a pool
    if (inviteCode === 'DEMO2024') {
      const newPool = {
        id: Date.now(),
        name: 'Demo Pool',
        description: 'You successfully joined this demo pool!',
        member_count: 25,
        user_role: 'member',
        invite_code: inviteCode,
        created_at: new Date().toISOString(),
        stats: {
          total_picks: 0,
          total_correct: 0,
          win_percentage: 0
        }
      };
      
      setPools(prev => [newPool, ...prev]);
      setShowJoinModal(false);
      return null; // Success
    }
    
    return 'Invalid invite code. Try "DEMO2024" for the demo pool.';
  };

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const filteredPools = pools.filter(pool =>
    pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pool.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageContainer>
      <Container>
        <DemoNotice>
          <DemoNoticeText>
            <strong>Demo Mode:</strong> This is a demonstration of the NFL Pick'em Pools feature. 
            Create pools, join with invite codes, and see how the system works!
          </DemoNoticeText>
        </DemoNotice>

        <Header>
          <Title>
            <Trophy size={32} />
            NFL Pick'em Pools
          </Title>
          <Subtitle>
            Compete with friends and family in weekly NFL pick contests. 
            Create your own pool or join existing ones with invite codes.
          </Subtitle>
          
          <StatsRow>
            <StatCard>
              <StatValue>152</StatValue>
              <StatLabel>Active Pools</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>2.1k</StatValue>
              <StatLabel>Total Players</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>Week 6</StatValue>
              <StatLabel>Current Week</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>16</StatValue>
              <StatLabel>NFL Games</StatLabel>
            </StatCard>
          </StatsRow>
        </Header>

        <ActionsBar>
          <ActionButtons>
            <ActionButton primary onClick={() => setShowCreateModal(true)}>
              <Plus size={20} />
              Create Pool
            </ActionButton>
            <ActionButton onClick={() => setShowJoinModal(true)}>
              <Users size={20} />
              Join Pool
            </ActionButton>
          </ActionButtons>

          <FilterSection>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#666'
              }} />
              <SearchInput
                type="text"
                placeholder="Search pools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <FilterButton>
              <Filter size={16} />
              Filter
            </FilterButton>
          </FilterSection>
        </ActionsBar>

        {loading ? (
          <LoadingSpinner text="Loading Pick'em pools..." />
        ) : (
          <>
            {filteredPools.length > 0 ? (
              <PoolsGrid>
                {filteredPools.map(pool => (
                  <PoolCard 
                    key={pool.id} 
                    pool={pool} 
                    onClick={(pool) => {
                      navigate(`/pick-em/pool/${pool.id}`);
                    }}
                  />
                ))}
              </PoolsGrid>
            ) : (
              <EmptyState>
                <EmptyStateIcon>
                  <Trophy size={64} />
                </EmptyStateIcon>
                <EmptyStateTitle>No Pools Found</EmptyStateTitle>
                <EmptyStateText>
                  {searchTerm 
                    ? `No pools match "${searchTerm}". Try a different search term.`
                    : "You haven't joined any pools yet. Create your first pool or join one with an invite code!"
                  }
                </EmptyStateText>
                <ActionButtons>
                  <ActionButton primary onClick={() => setShowCreateModal(true)}>
                    <Plus size={20} />
                    Create Your First Pool
                  </ActionButton>
                </ActionButtons>
              </EmptyState>
            )}
          </>
        )}

        {showCreateModal && (
          <CreatePoolModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreatePool}
          />
        )}

        {showJoinModal && (
          <JoinPoolModal
            onClose={() => setShowJoinModal(false)}
            onJoin={handleJoinPool}
          />
        )}
      </Container>
    </PageContainer>
  );
};

export default PickEmPageDemo;