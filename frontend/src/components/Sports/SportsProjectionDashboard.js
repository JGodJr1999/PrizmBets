import React, { useState } from 'react';
import styled from 'styled-components';
import { Filter, Search, TrendingUp, Calendar, Award, Users } from 'lucide-react';
import PlayerProjectionCard from './PlayerProjectionCard';

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.primary};
  min-height: 100vh;
`;

const DashboardHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.lg};
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const MainTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  background: ${props => props.theme.colors.gradient.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  margin: 0;
  line-height: 1.6;
`;

const StatsOverview = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary}40;
    transform: translateY(-2px);
  }
`;

const StatIcon = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  justify-content: center;
`;

const StatValue = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ControlsSection = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  align-items: center;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchBar = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    max-width: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.md} ${props => props.theme.spacing.md} 3rem;
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.accent.primary}20;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: ${props => props.theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.muted};
`;

const FilterButton = styled.button`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    background: ${props => props.theme.colors.background.hover};
  }
`;

const SportsFilter = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xl};
  flex-wrap: wrap;
`;

const SportChip = styled.button`
  background: ${props => props.active ? 
    props.theme.colors.gradient.accent : 
    props.theme.colors.background.card};
  color: ${props => props.active ? 
    'white' : 
    props.theme.colors.text.secondary};
  border: 1px solid ${props => props.active ? 
    'transparent' : 
    props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.full};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${props => props.theme.colors.accent.primary};
  }
`;

const ProjectionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.lg};
  }
`;

const SportsProjectionDashboard = () => {
  const [activeSport, setActiveSport] = useState('NBA');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = [
    { icon: TrendingUp, value: '127', label: 'Today\'s Picks' },
    { icon: Award, value: '84%', label: 'Win Rate' },
    { icon: Users, value: '2.3K', label: 'Active Users' },
    { icon: Calendar, value: '14', label: 'Sports' }
  ];

  const sports = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis'];

  const mockPlayers = [
    {
      player: {
        name: 'LeBron James',
        team: 'LAL',
        position: 'SF',
        photoUrl: null
      },
      projections: {
        points: 28.5,
        rebounds: 7.3,
        assists: 6.8,
        odds: '+115'
      },
      bettingOptions: [
        { label: 'Over 27.5 Pts', recommended: true },
        { label: 'Over 6.5 Reb', recommended: false }
      ],
      confidence: 87,
      trend: 'up',
      lastUpdated: '5 min ago'
    },
    {
      player: {
        name: 'Stephen Curry',
        team: 'GSW',
        position: 'PG',
        photoUrl: null
      },
      projections: {
        points: 26.2,
        rebounds: 4.1,
        assists: 8.4,
        odds: '+108'
      },
      bettingOptions: [
        { label: 'Over 25.5 Pts', recommended: true },
        { label: 'Over 7.5 Ast', recommended: true }
      ],
      confidence: 92,
      trend: 'up',
      lastUpdated: '2 min ago'
    },
    {
      player: {
        name: 'Giannis Antetokounmpo',
        team: 'MIL',
        position: 'PF',
        photoUrl: null
      },
      projections: {
        points: 31.8,
        rebounds: 11.2,
        assists: 5.7,
        odds: '+122'
      },
      bettingOptions: [
        { label: 'Over 30.5 Pts', recommended: false },
        { label: 'Over 10.5 Reb', recommended: true }
      ],
      confidence: 79,
      trend: 'down',
      lastUpdated: '8 min ago'
    }
  ];

  return (
    <DashboardContainer>
      <DashboardHeader>
        <HeaderTop>
          <HeaderContent>
            <MainTitle>AI's Top 5</MainTitle>
            <Subtitle>
              Our AI's highest probability bets for each sport with detailed analytics
            </Subtitle>
          </HeaderContent>
        </HeaderTop>

        <StatsOverview>
          {stats.map((stat, index) => (
            <StatCard key={index}>
              <StatIcon>
                <stat.icon size={24} />
              </StatIcon>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsOverview>

        <ControlsSection>
          <SearchBar>
            <SearchIcon>
              <Search size={18} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBar>
          <FilterButton>
            <Filter size={18} />
            Filters
          </FilterButton>
        </ControlsSection>

        <SportsFilter>
          {sports.map(sport => (
            <SportChip
              key={sport}
              active={sport === activeSport}
              onClick={() => setActiveSport(sport)}
            >
              {sport}
            </SportChip>
          ))}
        </SportsFilter>
      </DashboardHeader>

      <ProjectionsGrid>
        {mockPlayers.map((playerData, index) => (
          <PlayerProjectionCard
            key={index}
            {...playerData}
          />
        ))}
      </ProjectionsGrid>
    </DashboardContainer>
  );
};

export default SportsProjectionDashboard;