import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Trophy, Users, Calendar, TrendingUp, Crown } from 'lucide-react';

const Card = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
  }
  
  ${props => props.isAdmin && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 60px;
      height: 60px;
      background: ${props.theme.colors.accent.primary};
      transform: rotate(45deg) translate(21px, -21px);
    }
  `}
`;

const AdminBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  color: ${props => props.theme.colors.background.primary};
`;

const PoolName = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
  padding-right: ${props => props.isAdmin ? '40px' : '0'};
`;

const PoolDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme.spacing.md};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const StatsRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Stat = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  
  svg {
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const PerformanceBar = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  height: 8px;
  overflow: hidden;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PerformanceFill = styled.div`
  background: ${props => props.percentage >= 70 ? 
    props.theme.colors.success : 
    props.percentage >= 50 ? 
      props.theme.colors.accent.primary : 
      props.theme.colors.accent.secondary};
  height: 100%;
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const BottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${props => props.theme.spacing.md};
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border.primary};
`;

const InviteCode = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.75rem;
  font-family: monospace;
`;

const JoinDate = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.75rem;
`;

const PoolCard = ({ pool, onClick }) => {
  const navigate = useNavigate();
  const isAdmin = pool.user_role === 'admin';
  const winPercentage = pool.stats?.win_percentage || 0;
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleClick = () => {
    if (onClick) {
      onClick(pool);
    } else {
      navigate(`/pick-em/pool/${pool.id}`);
    }
  };

  return (
    <Card onClick={handleClick} isAdmin={isAdmin}>
      {isAdmin && (
        <AdminBadge>
          <Crown size={20} />
        </AdminBadge>
      )}
      
      <PoolName isAdmin={isAdmin}>{pool.name}</PoolName>
      
      {pool.description && (
        <PoolDescription>{pool.description}</PoolDescription>
      )}
      
      <StatsRow>
        <Stat>
          <Users size={16} />
          <span>{pool.member_count || 1} members</span>
        </Stat>
        <Stat>
          <Trophy size={16} />
          <span>{winPercentage}% wins</span>
        </Stat>
      </StatsRow>
      
      <PerformanceBar>
        <PerformanceFill percentage={winPercentage} />
      </PerformanceBar>
      
      <StatsRow>
        <Stat>
          <Calendar size={16} />
          <span>{pool.stats?.total_picks || 0} picks made</span>
        </Stat>
        <Stat>
          <TrendingUp size={16} />
          <span>{pool.stats?.total_correct || 0} correct</span>
        </Stat>
      </StatsRow>
      
      <BottomSection>
        <InviteCode>
          Code: {pool.invite_code}
        </InviteCode>
        <JoinDate>
          Joined {formatDate(pool.created_at)}
        </JoinDate>
      </BottomSection>
    </Card>
  );
};

export default PoolCard;