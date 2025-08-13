import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Plus, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import PoolCard from '../components/PickEm/PoolCard';
import CreatePoolModal from '../components/PickEm/CreatePoolModal';
import JoinPoolModal from '../components/PickEm/JoinPoolModal';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
  }
`;

const PageHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)` : 
    props.theme.colors.background.card};
  border: ${props => props.primary ? 'none' : `1px solid ${props.theme.colors.border.primary}`};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  color: ${props => props.primary ? props.theme.colors.background.primary : props.theme.colors.text.primary};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const PoolsSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const PoolsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
`;

const StatsSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  
  svg {
    color: ${props => props.theme.colors.accent.primary};
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const PickEmPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [pools, setPools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [stats, setStats] = useState({
    totalPools: 0,
    totalPicks: 0,
    winPercentage: 0,
    currentStreak: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/pick-em' } });
      return;
    }
    
    fetchUserPools();
  }, [isAuthenticated, navigate]);

  const fetchUserPools = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5001/api/pickem/pools', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pools');
      }

      const data = await response.json();
      
      if (data.success) {
        setPools(data.pools);
        
        // Calculate overall stats
        let totalCorrect = 0;
        let totalPicks = 0;
        
        data.pools.forEach(pool => {
          if (pool.stats) {
            totalCorrect += pool.stats.total_correct || 0;
            totalPicks += pool.stats.total_picks || 0;
          }
        });
        
        setStats({
          totalPools: data.pools.length,
          totalPicks: totalPicks,
          winPercentage: totalPicks > 0 ? ((totalCorrect / totalPicks) * 100).toFixed(1) : 0,
          currentStreak: 0 // Would need to track this separately
        });
      }
    } catch (error) {
      console.error('Error fetching pools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePool = async (poolData) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5001/api/pickem/pools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(poolData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        fetchUserPools(); // Refresh pools list
        
        // Navigate to the new pool
        navigate(`/pick-em/pool/${data.pool.id}`);
      } else {
        console.error('Failed to create pool:', data.error);
      }
    } catch (error) {
      console.error('Error creating pool:', error);
    }
  };

  const handleJoinPool = async (inviteCode) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:5001/api/pickem/pools/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invite_code: inviteCode })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowJoinModal(false);
        fetchUserPools(); // Refresh pools list
        
        // Navigate to the joined pool
        navigate(`/pick-em/pool/${data.pool.id}`);
      } else {
        console.error('Failed to join pool:', data.error);
        return data.error; // Return error to modal
      }
    } catch (error) {
      console.error('Error joining pool:', error);
      return 'Failed to join pool';
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title>
          <Trophy size={36} />
          NFL Pick'em Pools
        </Title>
        <Subtitle>
          Compete with friends in weekly NFL predictions. Pick winners, climb the leaderboard, and prove you're the ultimate football expert!
        </Subtitle>
      </PageHeader>

      <StatsSection>
        <StatCard>
          <Users size={32} />
          <StatValue>{stats.totalPools}</StatValue>
          <StatLabel>Active Pools</StatLabel>
        </StatCard>
        <StatCard>
          <Calendar size={32} />
          <StatValue>{stats.totalPicks}</StatValue>
          <StatLabel>Total Picks</StatLabel>
        </StatCard>
        <StatCard>
          <Trophy size={32} />
          <StatValue>{stats.winPercentage}%</StatValue>
          <StatLabel>Win Rate</StatLabel>
        </StatCard>
        <StatCard>
          <TrendingUp size={32} />
          <StatValue>{stats.currentStreak}</StatValue>
          <StatLabel>Current Streak</StatLabel>
        </StatCard>
      </StatsSection>

      <ActionButtons>
        <ActionButton primary onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          Create New Pool
        </ActionButton>
        <ActionButton onClick={() => setShowJoinModal(true)}>
          <Users size={20} />
          Join Pool with Code
        </ActionButton>
      </ActionButtons>

      <PoolsSection>
        <SectionHeader>
          <SectionTitle>
            <Trophy size={24} />
            Your Pools
          </SectionTitle>
        </SectionHeader>
        
        {pools.length > 0 ? (
          <PoolsGrid>
            {pools.map(pool => (
              <PoolCard
                key={pool.id}
                pool={pool}
                onClick={() => navigate(`/pick-em/pool/${pool.id}`)}
              />
            ))}
          </PoolsGrid>
        ) : (
          <EmptyState>
            <Trophy size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>No Pools Yet</h3>
            <p>Create a new pool or join an existing one to start picking!</p>
          </EmptyState>
        )}
      </PoolsSection>

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
    </PageContainer>
  );
};

export default PickEmPage;