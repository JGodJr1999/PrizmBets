import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Calendar, Filter, TrendingUp, TrendingDown, Target, DollarSign, Clock, Eye } from 'lucide-react';

const HistoryContainer = styled.div`
  padding: ${props => props.theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xl};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const FilterBar = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  flex-wrap: wrap;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
  }
`;

const FilterSelect = styled.select`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  cursor: pointer;
  
  &:focus {
    border-color: ${props => props.theme.colors.accent.primary};
    outline: none;
  }
  
  option {
    background: ${props => props.theme.colors.background.card};
  }
`;

const StatsOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${props => props.color || props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const HistoryItem = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.2s ease;
  border-left: 4px solid ${props => 
    props.result === 'win' ? props.theme.colors.betting.positive :
    props.result === 'loss' ? props.theme.colors.betting.negative :
    props.theme.colors.betting.neutral
  };
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const ItemTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.85rem;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-wrap: wrap;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const ResultBadge = styled.span`
  background: ${props => 
    props.result === 'win' ? props.theme.colors.betting.positive :
    props.result === 'loss' ? props.theme.colors.betting.negative :
    props.theme.colors.betting.neutral
  }20;
  color: ${props => 
    props.result === 'win' ? props.theme.colors.betting.positive :
    props.result === 'loss' ? props.theme.colors.betting.negative :
    props.theme.colors.betting.neutral
  };
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const AmountDisplay = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => 
    props.result === 'win' ? props.theme.colors.betting.positive :
    props.result === 'loss' ? props.theme.colors.betting.negative :
    props.theme.colors.text.primary
  };
`;

const BetsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const BetItem = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  padding: ${props => props.theme.spacing.xs} 0;
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ViewDetailsButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.primary};
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.accent.primary}20;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  color: ${props => props.theme.colors.text.muted};
  
  svg {
    margin-bottom: ${props => props.theme.spacing.md};
    opacity: 0.5;
  }
`;

const HistoryPage = () => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  
  // Mock data - replace with real API calls
  const [historyData] = useState([
    {
      id: 1,
      title: '5-Leg NBA Parlay',
      bets: [
        'Lakers ML (-120)',
        'Warriors -3.5 (-110)',
        'Over 225.5 (-105)',
        'Celtics ML (-150)',
        'Under 218.5 (-110)'
      ],
      amount: 100,
      payout: 1250,
      result: 'win',
      date: '2024-01-15',
      aiScore: 0.75,
      confidence: 'High'
    },
    {
      id: 2,
      title: '3-Leg NFL Parlay',
      bets: [
        'Chiefs ML (-110)',
        'Eagles -7 (-110)',
        'Under 52.5 (-105)'
      ],
      amount: 50,
      payout: 0,
      result: 'loss',
      date: '2024-01-14',
      aiScore: 0.65,
      confidence: 'Medium'
    },
    {
      id: 3,
      title: '4-Leg MLB Parlay',
      bets: [
        'Yankees ML (-140)',
        'Dodgers -1.5 (-115)',
        'Over 9.5 (-110)',
        'Red Sox ML (+120)'
      ],
      amount: 75,
      payout: 485,
      result: 'win',
      date: '2024-01-13',
      aiScore: 0.68,
      confidence: 'Medium'
    }
  ]);

  const stats = {
    totalParlays: historyData.length,
    winRate: (historyData.filter(item => item.result === 'win').length / historyData.length * 100).toFixed(1),
    totalWagered: historyData.reduce((sum, item) => sum + item.amount, 0),
    totalWinnings: historyData.reduce((sum, item) => sum + (item.result === 'win' ? item.payout - item.amount : -item.amount), 0)
  };

  const filteredData = historyData.filter(item => {
    if (filter === 'all') return true;
    return item.result === filter;
  });

  return (
    <HistoryContainer>
      <PageTitle>
        <Calendar size={32} />
        Betting History
      </PageTitle>
      
      <FilterBar>
        <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Parlays</option>
          <option value="win">Wins Only</option>
          <option value="loss">Losses Only</option>
          <option value="pending">Pending</option>
        </FilterSelect>
        
        <FilterSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">Sort by Date</option>
          <option value="amount">Sort by Amount</option>
          <option value="result">Sort by Result</option>
        </FilterSelect>
      </FilterBar>
      
      <StatsOverview>
        <StatCard>
          <StatValue>{stats.totalParlays}</StatValue>
          <StatLabel>Total Parlays</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue color="#51cf66">{stats.winRate}%</StatValue>
          <StatLabel>Win Rate</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>${stats.totalWagered}</StatValue>
          <StatLabel>Total Wagered</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue color={stats.totalWinnings >= 0 ? "#51cf66" : "#ff6b6b"}>
            {stats.totalWinnings >= 0 ? '+' : ''}${stats.totalWinnings}
          </StatValue>
          <StatLabel>Net Profit/Loss</StatLabel>
        </StatCard>
      </StatsOverview>
      
      <HistoryList>
        {filteredData.length > 0 ? (
          filteredData.map(item => (
            <HistoryItem key={item.id} result={item.result}>
              <ItemHeader>
                <ItemTitle>
                  <Target size={20} />
                  {item.title}
                </ItemTitle>
                <ItemMeta>
                  <Clock size={16} />
                  {item.date}
                  <ResultBadge result={item.result}>{item.result}</ResultBadge>
                  <AmountDisplay result={item.result}>
                    ${item.amount} → {item.result === 'win' ? `$${item.payout}` : '$0'}
                  </AmountDisplay>
                </ItemMeta>
              </ItemHeader>
              
              <BetsList>
                {item.bets.map((bet, index) => (
                  <BetItem key={index}>{bet}</BetItem>
                ))}
              </BetsList>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  AI Score: {item.aiScore} • Confidence: {item.confidence}
                </div>
                <ViewDetailsButton>
                  <Eye size={16} />
                  View Details
                </ViewDetailsButton>
              </div>
            </HistoryItem>
          ))
        ) : (
          <EmptyState>
            <Target size={48} />
            <div>No betting history found</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Your parlay history will appear here once you start betting
            </div>
          </EmptyState>
        )}
      </HistoryList>
    </HistoryContainer>
  );
};

export default HistoryPage;