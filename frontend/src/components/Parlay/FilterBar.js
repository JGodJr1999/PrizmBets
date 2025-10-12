import React, { useState } from 'react';
import styled from 'styled-components';
import { Search, Filter, Calendar, TrendingUp, Star, Users, Target } from 'lucide-react';

const FilterContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  position: sticky;
  top: 80px;
  z-index: 100;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md};
    border-radius: ${props => props.theme.borderRadius.md};
  }
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: ${props => props.theme.spacing.md};
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.md} ${props => props.theme.spacing.md} 40px;
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;

  &:focus {
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
    outline: none;
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.muted};
`;

const FilterButton = styled.button`
  background: ${props => props.active
    ? props.theme.colors.accent.primary
    : props.theme.colors.background.secondary};
  border: 1px solid ${props => props.active
    ? props.theme.colors.accent.primary
    : props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.active
    ? props.theme.colors.background.primary
    : props.theme.colors.text.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active
      ? props.theme.colors.accent.primary + 'dd'
      : props.theme.colors.background.hover};
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  overflow-x: auto;
  padding-bottom: ${props => props.theme.spacing.xs};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`;

const SportTab = styled.button`
  background: ${props => props.active
    ? props.theme.colors.accent.primary
    : 'transparent'};
  border: 1px solid ${props => props.active
    ? props.theme.colors.accent.primary
    : props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.active
    ? props.theme.colors.background.primary
    : props.theme.colors.text.primary};
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active
      ? props.theme.colors.accent.primary + 'dd'
      : props.theme.colors.background.hover};
  }
`;

const QuickFiltersContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
  margin-bottom: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
`;

const QuickFilter = styled.button`
  background: ${props => props.active
    ? props.theme.colors.accent.primary + '20'
    : props.theme.colors.background.secondary};
  border: 1px solid ${props => props.active
    ? props.theme.colors.accent.primary
    : props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.full};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  color: ${props => props.active
    ? props.theme.colors.accent.primary
    : props.theme.colors.text.secondary};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active
      ? props.theme.colors.accent.primary + '30'
      : props.theme.colors.background.hover};
  }
`;

const DateFilters = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
`;

const DateFilter = styled.button`
  background: ${props => props.active
    ? props.theme.colors.accent.primary
    : props.theme.colors.background.secondary};
  border: 1px solid ${props => props.active
    ? props.theme.colors.accent.primary
    : props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  color: ${props => props.active
    ? props.theme.colors.background.primary
    : props.theme.colors.text.primary};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.active
      ? props.theme.colors.accent.primary + 'dd'
      : props.theme.colors.background.hover};
  }
`;

const FilterStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  border-top: 1px solid ${props => props.theme.colors.border.primary};
  padding-top: ${props => props.theme.spacing.sm};
`;

const FilterBar = ({
  searchQuery,
  onSearchChange,
  selectedSport,
  onSportChange,
  availableSports,
  selectedDate,
  onDateChange,
  quickFilters,
  onQuickFilterChange,
  gameCount,
  totalMarkets
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const dateOptions = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'This Week' },
    { value: 'all', label: 'All Games' }
  ];

  const quickFilterOptions = [
    { key: 'featured', label: 'Featured', icon: Star },
    { key: 'live', label: 'Live', icon: TrendingUp },
    { key: 'popular', label: 'Popular', icon: Users },
    { key: 'best_odds', label: 'Best Odds', icon: Target }
  ];

  return (
    <FilterContainer>
      <FilterRow>
        <SearchContainer>
          <SearchIcon>
            <Search size={16} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search teams, players, or bet types..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </SearchContainer>

        <FilterButton
          active={showAdvanced}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter size={16} />
          Filters
        </FilterButton>

        <FilterButton>
          <Calendar size={16} />
          {dateOptions.find(d => d.value === selectedDate)?.label || 'Today'}
        </FilterButton>
      </FilterRow>

      {/* Sport Tabs */}
      <TabsContainer>
        {availableSports?.map(sport => (
          <SportTab
            key={sport.value}
            active={selectedSport === sport.value}
            onClick={() => onSportChange(sport.value)}
          >
            {sport.label}
            {!sport.active && ' (Off-season)'}
          </SportTab>
        ))}
      </TabsContainer>

      {/* Date Filters */}
      <DateFilters>
        {dateOptions.map(option => (
          <DateFilter
            key={option.value}
            active={selectedDate === option.value}
            onClick={() => onDateChange(option.value)}
          >
            {option.label}
          </DateFilter>
        ))}
      </DateFilters>

      {/* Quick Filters */}
      <QuickFiltersContainer>
        {quickFilterOptions.map(filter => {
          const IconComponent = filter.icon;
          return (
            <QuickFilter
              key={filter.key}
              active={quickFilters[filter.key]}
              onClick={() => onQuickFilterChange(filter.key, !quickFilters[filter.key])}
            >
              <IconComponent size={14} />
              {filter.label}
            </QuickFilter>
          );
        })}
      </QuickFiltersContainer>

      {/* Advanced Filters - Show when expanded */}
      {showAdvanced && (
        <div style={{
          borderTop: `1px solid ${props => props.theme?.colors?.border?.primary || '#333'}`,
          paddingTop: '12px',
          marginTop: '12px'
        }}>
          {/* Add more advanced filters here later */}
          <div style={{ color: '#888', fontSize: '0.9rem' }}>
            Advanced filters coming soon: Bet types, Player positions, Team stats
          </div>
        </div>
      )}

      {/* Filter Stats */}
      <FilterStats>
        <span>
          {gameCount} games • {totalMarkets || '500+'} betting markets
        </span>
        <span>
          Updated {new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          })}
        </span>
      </FilterStats>
    </FilterContainer>
  );
};

export default FilterBar;