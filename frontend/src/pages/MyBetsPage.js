import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, TrendingUp, DollarSign, Calendar, Filter, Trash2, Edit3, ExternalLink, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PageContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.primary};
  min-height: 100vh;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
    align-items: stretch;
  }
`;

const PageTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const AddBetButton = styled.button`
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.accent.primaryHover};
    transform: translateY(-1px);
  }
`;

const StatsGrid = styled.div`
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
  font-size: 2rem;
  font-weight: 700;
  color: ${props => {
    if (props.type === 'profit' && props.value > 0) return props.theme.colors.betting.positive;
    if (props.type === 'profit' && props.value < 0) return props.theme.colors.betting.negative;
    return props.theme.colors.text.primary;
  }};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
`;

const FiltersSection = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
  display: flex;
  gap: ${props => props.theme.spacing.md};
  align-items: center;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  background: ${props => props.active ? props.theme.colors.accent.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.background.primary : props.theme.colors.text.secondary};
  border: 1px solid ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.border.secondary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const BetsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const BetCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary}40;
    transform: translateY(-1px);
  }
`;

const BetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const BetInfo = styled.div`
  flex: 1;
`;

const BetTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
`;

const BetDetails = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const BetActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const ActionButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme.colors.border.secondary};
  color: ${props => props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.color || props.theme.colors.accent.primary};
    color: ${props => props.color || props.theme.colors.accent.primary};
  }
`;

const BetMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const MetricItem = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background.hover};
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const MetricValue = styled.div`
  font-weight: 600;
  color: ${props => {
    if (props.type === 'profit' && props.value > 0) return props.theme.colors.betting.positive;
    if (props.type === 'profit' && props.value < 0) return props.theme.colors.betting.negative;
    return props.theme.colors.text.primary;
  }};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.muted};
`;

const StatusBadge = styled.div`
  background: ${props => {
    switch (props.status) {
      case 'won': return props.theme.colors.betting.positive;
      case 'lost': return props.theme.colors.betting.negative;
      case 'pending': return '#ff8c42';
      case 'void': return props.theme.colors.text.muted;
      default: return props.theme.colors.border.primary;
    }
  }};
  color: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl} 0;
  color: ${props => props.theme.colors.text.secondary};
`;

const AddBetModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.lg};
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.lg};
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  ${props => props.variant === 'primary' ? `
    background: ${props.theme.colors.accent.primary};
    color: ${props.theme.colors.background.primary};
    border: none;

    &:hover {
      background: ${props.theme.colors.accent.primaryHover};
    }
  ` : `
    background: transparent;
    color: ${props.theme.colors.text.secondary};
    border: 1px solid ${props.theme.colors.border.primary};

    &:hover {
      border-color: ${props.theme.colors.accent.primary};
      color: ${props.theme.colors.accent.primary};
    }
  `}
`;

const MyBetsPage = () => {
  const { user } = useAuth();
  const [bets, setBets] = useState([]);
  const [filteredBets, setFilteredBets] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBet, setNewBet] = useState({
    title: '',
    sport: '',
    sportsbook: '',
    odds: '',
    stake: '',
    status: 'pending',
    notes: ''
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockBets = [
      {
        id: 1,
        title: 'LeBron James Over 27.5 Points',
        sport: 'NBA',
        game: 'Lakers vs Warriors',
        sportsbook: 'DraftKings',
        odds: '+110',
        stake: 50,
        potential: 105,
        status: 'pending',
        date: '2024-01-15',
        notes: 'Strong matchup against Warriors weak defense'
      },
      {
        id: 2,
        title: 'Josh Allen Over 2.5 Passing TDs',
        sport: 'NFL',
        game: 'Bills vs Chiefs',
        sportsbook: 'FanDuel',
        odds: '+125',
        stake: 25,
        potential: 56.25,
        status: 'won',
        date: '2024-01-10',
        actualResult: 3,
        profit: 31.25
      },
      {
        id: 3,
        title: 'Warriors Team Total Over 115.5',
        sport: 'NBA',
        game: 'Warriors vs Lakers',
        sportsbook: 'BetMGM',
        odds: '+100',
        stake: 75,
        potential: 150,
        status: 'lost',
        date: '2024-01-08',
        actualResult: 112,
        profit: -75
      }
    ];
    setBets(mockBets);
    setFilteredBets(mockBets);
  }, []);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredBets(bets);
    } else {
      setFilteredBets(bets.filter(bet => bet.status === activeFilter));
    }
  }, [activeFilter, bets]);

  const handleAddBet = () => {
    if (!newBet.title || !newBet.odds || !newBet.stake) {
      toast.error('Please fill in all required fields');
      return;
    }

    const bet = {
      id: Date.now(),
      ...newBet,
      stake: parseFloat(newBet.stake),
      potential: parseFloat(newBet.stake) * (1 + parseFloat(newBet.odds.replace('+', '')) / 100),
      date: new Date().toISOString().split('T')[0]
    };

    setBets([bet, ...bets]);
    setNewBet({
      title: '',
      sport: '',
      sportsbook: '',
      odds: '',
      stake: '',
      status: 'pending',
      notes: ''
    });
    setShowAddModal(false);
    toast.success('Bet added successfully!');
  };

  const handleDeleteBet = (id) => {
    setBets(bets.filter(bet => bet.id !== id));
    toast.success('Bet deleted');
  };

  const calculateStats = () => {
    const totalStake = bets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalProfit = bets.reduce((sum, bet) => {
      if (bet.status === 'won') return sum + (bet.profit || 0);
      if (bet.status === 'lost') return sum - bet.stake;
      return sum;
    }, 0);
    const winRate = bets.filter(bet => bet.status !== 'pending').length > 0
      ? (bets.filter(bet => bet.status === 'won').length / bets.filter(bet => bet.status !== 'pending').length) * 100
      : 0;

    return { totalStake, totalProfit, winRate, totalBets: bets.length };
  };

  const stats = calculateStats();

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <TrendingUp size={32} />
          My Bets
        </PageTitle>
        <AddBetButton onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Add Bet
        </AddBetButton>
      </PageHeader>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalBets}</StatValue>
          <StatLabel>Total Bets</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue type="profit" value={stats.totalProfit}>
            ${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(2)}
          </StatValue>
          <StatLabel>Net Profit</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>${stats.totalStake.toFixed(2)}</StatValue>
          <StatLabel>Total Staked</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.winRate.toFixed(1)}%</StatValue>
          <StatLabel>Win Rate</StatLabel>
        </StatCard>
      </StatsGrid>

      <FiltersSection>
        <Filter size={18} />
        {['all', 'pending', 'won', 'lost'].map(filter => (
          <FilterButton
            key={filter}
            active={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </FilterButton>
        ))}
      </FiltersSection>

      <BetsContainer>
        {filteredBets.length === 0 ? (
          <EmptyState>
            <p>No bets found. Add your first bet to get started!</p>
          </EmptyState>
        ) : (
          filteredBets.map(bet => (
            <BetCard key={bet.id}>
              <BetHeader>
                <BetInfo>
                  <BetTitle>{bet.title}</BetTitle>
                  <BetDetails>
                    {bet.sport} • {bet.game} • {bet.sportsbook} • {bet.date}
                  </BetDetails>
                </BetInfo>
                <BetActions>
                  <StatusBadge status={bet.status}>{bet.status}</StatusBadge>
                  <ActionButton onClick={() => handleDeleteBet(bet.id)} color="#ff4444">
                    <Trash2 size={14} />
                  </ActionButton>
                </BetActions>
              </BetHeader>

              <BetMetrics>
                <MetricItem>
                  <MetricValue>{bet.odds}</MetricValue>
                  <MetricLabel>Odds</MetricLabel>
                </MetricItem>
                <MetricItem>
                  <MetricValue>${bet.stake}</MetricValue>
                  <MetricLabel>Stake</MetricLabel>
                </MetricItem>
                <MetricItem>
                  <MetricValue>${bet.potential.toFixed(2)}</MetricValue>
                  <MetricLabel>Potential</MetricLabel>
                </MetricItem>
                {bet.profit !== undefined && (
                  <MetricItem>
                    <MetricValue type="profit" value={bet.profit}>
                      ${bet.profit >= 0 ? '+' : ''}${bet.profit.toFixed(2)}
                    </MetricValue>
                    <MetricLabel>Profit</MetricLabel>
                  </MetricItem>
                )}
              </BetMetrics>

              {bet.notes && (
                <div style={{ fontSize: '0.9rem', color: '#6B7280', fontStyle: 'italic' }}>
                  "{bet.notes}"
                </div>
              )}
            </BetCard>
          ))
        )}
      </BetsContainer>

      {showAddModal && (
        <AddBetModal onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <ModalContent>
            <ModalTitle>Add New Bet</ModalTitle>

            <FormGroup>
              <Label>Bet Title *</Label>
              <Input
                value={newBet.title}
                onChange={(e) => setNewBet({...newBet, title: e.target.value})}
                placeholder="e.g., LeBron James Over 27.5 Points"
              />
            </FormGroup>

            <FormGroup>
              <Label>Sport</Label>
              <Select
                value={newBet.sport}
                onChange={(e) => setNewBet({...newBet, sport: e.target.value})}
              >
                <option value="">Select Sport</option>
                <option value="NBA">NBA</option>
                <option value="NFL">NFL</option>
                <option value="MLB">MLB</option>
                <option value="NHL">NHL</option>
                <option value="Soccer">Soccer</option>
                <option value="Tennis">Tennis</option>
                <option value="Other">Other</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Sportsbook</Label>
              <Select
                value={newBet.sportsbook}
                onChange={(e) => setNewBet({...newBet, sportsbook: e.target.value})}
              >
                <option value="">Select Sportsbook</option>
                <option value="DraftKings">DraftKings</option>
                <option value="FanDuel">FanDuel</option>
                <option value="BetMGM">BetMGM</option>
                <option value="Caesars">Caesars</option>
                <option value="PointsBet">PointsBet</option>
                <option value="Other">Other</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Odds *</Label>
              <Input
                value={newBet.odds}
                onChange={(e) => setNewBet({...newBet, odds: e.target.value})}
                placeholder="e.g., +110, -150"
              />
            </FormGroup>

            <FormGroup>
              <Label>Stake Amount * ($)</Label>
              <Input
                type="number"
                value={newBet.stake}
                onChange={(e) => setNewBet({...newBet, stake: e.target.value})}
                placeholder="25.00"
                min="0"
                step="0.01"
              />
            </FormGroup>

            <FormGroup>
              <Label>Notes</Label>
              <Input
                value={newBet.notes}
                onChange={(e) => setNewBet({...newBet, notes: e.target.value})}
                placeholder="Reason for this bet..."
              />
            </FormGroup>

            <ModalActions>
              <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAddBet}>Add Bet</Button>
            </ModalActions>
          </ModalContent>
        </AddBetModal>
      )}
    </PageContainer>
  );
};

export default MyBetsPage;