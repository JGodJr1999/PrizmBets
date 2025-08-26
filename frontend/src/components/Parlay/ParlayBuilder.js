import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Trash2, DollarSign, AlertCircle, Brain, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import OddsComparison from '../Odds/OddsComparison';

const BuilderContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md};
    margin-bottom: ${props => props.theme.spacing.md};
    border-radius: ${props => props.theme.borderRadius.md};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.sm};
    border-left: none;
    border-right: none;
    border-radius: 0;
  }
`;

const BuilderHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 1.3rem;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1.2rem;
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const BetCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
  position: relative;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.border.secondary};
  }
`;

const BetRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: ${props => props.theme.spacing.md};
  align-items: center;
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr auto;
    grid-template-areas: 
      "team team delete"
      "odds type delete"
      "amount sportsbook delete";
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "team"
      "odds"
      "type"
      "amount"
      "sportsbook"
      "delete";
    gap: ${props => props.theme.spacing.sm};
  }
`;

const MobileInputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  font-weight: 500;
`;

const Input = styled.input`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  
  &:focus {
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md};
    font-size: 1rem;
    min-height: 44px; /* iOS touch target minimum */
  }
`;

const Select = styled.select`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  cursor: pointer;
  
  &:focus {
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
  }
  
  option {
    background: ${props => props.theme.colors.background.primary};
    color: ${props => props.theme.colors.text.primary};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md};
    font-size: 1rem;
    min-height: 44px; /* iOS touch target minimum */
  }
`;

const DeleteButton = styled.button`
  background: ${props => props.theme.colors.accent.secondary};
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.accent.secondary}dd;
    transform: scale(1.05);
  }
`;

const AddButton = styled.button`
  background: ${props => props.theme.colors.accent.primary};
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.background.primary};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin: ${props => props.theme.spacing.md} 0;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.accent.primary}dd;
    transform: translateY(-1px);
  }
`;

const TotalSection = styled.div`
  background: ${props => props.theme.colors.background.tertiary};
  border: 1px solid ${props => props.theme.colors.border.accent};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.lg};
`;

const TotalRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const EvaluateButton = styled.button`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary}, ${props => props.theme.colors.accent.primary}dd);
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.background.primary};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
  width: 100%;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.glow};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.accent.secondary}20;
  border: 1px solid ${props => props.theme.colors.accent.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.accent.secondary};
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.sm};
`;

const FindOddsButton = styled.button`
  background: ${props => props.theme.colors.accent.primary}20;
  border: 1px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.primary};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.2s ease;
  margin-top: ${props => props.theme.spacing.xs};
  
  &:hover {
    background: ${props => props.theme.colors.accent.primary}30;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const OddsComparisonSection = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
`;

const ParlayBuilder = ({ onEvaluate, isLoading }) => {
  const [bets, setBets] = useState([
    {
      id: 1,
      team: '',
      odds: '',
      bet_type: 'moneyline',
      amount: '',
      sportsbook: ''
    }
  ]);
  const [totalAmount, setTotalAmount] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [showOddsComparison, setShowOddsComparison] = useState(null);
  const [selectedSport, setSelectedSport] = useState('nfl');
  const [availableSports, setAvailableSports] = useState([]);
  const [sportsLoading, setSportsLoading] = useState(true);

  const betTypes = [
    { value: 'moneyline', label: 'Moneyline' },
    { value: 'spread', label: 'Spread' },
    { value: 'over_under', label: 'Over/Under' },
    { value: 'prop', label: 'Prop Bet' }
  ];

  const sportsbooks = [
    { value: '', label: 'Select Sportsbook' },
    { value: 'draftkings', label: 'DraftKings' },
    { value: 'fanduel', label: 'FanDuel' },
    { value: 'betmgm', label: 'BetMGM' },
    { value: 'caesars', label: 'Caesars' },
    { value: 'betrivers', label: 'BetRivers' },
    { value: 'espnbet', label: 'ESPN BET' },
    { value: 'fanatics', label: 'Fanatics Sportsbook' },
    { value: 'betway', label: 'Betway' },
    { value: 'pointsbet', label: 'PointsBet' },
    { value: 'hard_rock', label: 'Hard Rock Bet' },
    { value: 'prizepicks', label: 'PrizePicks (Daily Fantasy)' },
    { value: 'underdog', label: 'Underdog Fantasy' },
    { value: 'parlayplay', label: 'ParlayPlay' },
    { value: 'superdraft', label: 'SuperDraft' }
  ];

  // Load available sports from our enhanced API
  useEffect(() => {
    loadAvailableSports();
  }, []);

  const loadAvailableSports = async () => {
    try {
      setSportsLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/odds/sports`);
      const data = await response.json();
      
      if (data.success) {
        // Convert API format to dropdown format
        const sportsOptions = data.sports.map(sport => ({
          value: sport.key,
          label: sport.name,
          active: sport.active,
          season_status: sport.season_status
        }));
        
        setAvailableSports(sportsOptions);
        
        // Set first active sport as default if current selection isn't available
        const activeSports = sportsOptions.filter(s => s.active);
        if (activeSports.length > 0 && !activeSports.find(s => s.value === selectedSport)) {
          setSelectedSport(activeSports[0].value);
        }
      } else {
        // Fallback to basic sports list without showing error
        setAvailableSports([
          { value: 'nfl', label: 'NFL', active: true, season_status: 'active' },
          { value: 'nba', label: 'NBA', active: true, season_status: 'active' },
          { value: 'mlb', label: 'MLB', active: true, season_status: 'active' },
          { value: 'nhl', label: 'NHL', active: true, season_status: 'active' }
        ]);
        console.log('Using fallback sports list - API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Failed to load sports:', error);
      // Fallback to basic sports list without showing error toast
      setAvailableSports([
        { value: 'nfl', label: 'NFL', active: true, season_status: 'active' },
        { value: 'nba', label: 'NBA', active: true, season_status: 'active' },
        { value: 'mlb', label: 'MLB', active: true, season_status: 'active' },
        { value: 'nhl', label: 'NHL', active: true, season_status: 'active' }
      ]);
      console.log('Using fallback sports list - API request failed');
    } finally {
      setSportsLoading(false);
    }
  };

  const addBet = () => {
    if (bets.length >= 10) {
      toast.error('Maximum 10 bets allowed per parlay');
      return;
    }
    
    const newBet = {
      id: Date.now(),
      team: '',
      odds: '',
      bet_type: 'moneyline',
      amount: '',
      sportsbook: ''
    };
    setBets([...bets, newBet]);
  };

  const removeBet = (id) => {
    if (bets.length <= 1) {
      toast.error('At least one bet is required');
      return;
    }
    setBets(bets.filter(bet => bet.id !== id));
  };

  const updateBet = (id, field, value) => {
    setBets(bets.map(bet => 
      bet.id === id ? { ...bet, [field]: value } : bet
    ));
    
    // Clear error for this field
    if (errors[`bet_${id}_${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`bet_${id}_${field}`];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate each bet
    bets.forEach(bet => {
      if (!bet.team.trim()) {
        newErrors[`bet_${bet.id}_team`] = 'Team name is required';
      }
      if (!bet.odds || isNaN(bet.odds)) {
        newErrors[`bet_${bet.id}_odds`] = 'Valid odds are required';
      }
      if (!bet.amount || isNaN(bet.amount) || parseFloat(bet.amount) <= 0) {
        newErrors[`bet_${bet.id}_amount`] = 'Valid amount is required';
      }
    });
    
    // Validate total amount
    if (!totalAmount || isNaN(totalAmount) || parseFloat(totalAmount) <= 0) {
      newErrors.totalAmount = 'Valid total amount is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEvaluate = () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before evaluating');
      return;
    }
    
    const parlayData = {
      bets: bets.map(bet => ({
        team: bet.team.trim(),
        odds: parseFloat(bet.odds),
        bet_type: bet.bet_type,
        amount: parseFloat(bet.amount),
        sportsbook: bet.sportsbook || undefined
      })),
      total_amount: parseFloat(totalAmount),
      user_notes: userNotes.trim() || undefined
    };
    
    onEvaluate(parlayData);
  };

  const handleFindBestOdds = (betId) => {
    const bet = bets.find(b => b.id === betId);
    
    if (!bet.team.trim()) {
      toast.error('Please enter a team name first');
      return;
    }
    
    if (showOddsComparison === betId) {
      setShowOddsComparison(null);
    } else {
      setShowOddsComparison(betId);
    }
  };

  const totalBetAmount = bets.reduce((sum, bet) => sum + (parseFloat(bet.amount) || 0), 0);

  return (
    <BuilderContainer>
      <BuilderHeader>
        <Title>
          <DollarSign size={24} />
          Build Your Parlay
        </Title>
      </BuilderHeader>
      
      <InputGroup style={{ marginBottom: '1rem' }}>
        <Label>
          Sport 
          {!sportsLoading && (
            <button 
              onClick={loadAvailableSports}
              style={{ 
                background: 'none', 
                border: 'none', 
                marginLeft: '8px',
                cursor: 'pointer',
                color: '#00d4aa',
                display: 'inline-flex',
                alignItems: 'center'
              }}
              title="Refresh sports list"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </Label>
        <Select
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
          disabled={sportsLoading}
        >
          {sportsLoading ? (
            <option>Loading sports...</option>
          ) : (
            availableSports.map(sport => (
              <option 
                key={sport.value} 
                value={sport.value}
                disabled={!sport.active}
              >
                {sport.label} {!sport.active ? `(${sport.season_status})` : ''}
              </option>
            ))
          )}
        </Select>
        {!sportsLoading && availableSports.length > 0 && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#a0a0a0', 
            marginTop: '4px' 
          }}>
            {availableSports.length} sports available • Active sports have real-time odds
          </div>
        )}
      </InputGroup>
      
      {bets.map((bet, index) => (
        <BetCard key={bet.id}>
          <BetRow>
            <InputGroup>
              <Label>Team/Player</Label>
              <Input
                type="text"
                placeholder="e.g., Lakers, Patrick Mahomes"
                value={bet.team}
                onChange={(e) => updateBet(bet.id, 'team', e.target.value)}
              />
              {errors[`bet_${bet.id}_team`] && (
                <ErrorMessage>
                  <AlertCircle size={16} />
                  {errors[`bet_${bet.id}_team`]}
                </ErrorMessage>
              )}
            </InputGroup>
            
            <InputGroup>
              <Label>Odds</Label>
              <Input
                type="number"
                placeholder="-110"
                value={bet.odds}
                onChange={(e) => updateBet(bet.id, 'odds', e.target.value)}
              />
              {errors[`bet_${bet.id}_odds`] && (
                <ErrorMessage>
                  <AlertCircle size={16} />
                  {errors[`bet_${bet.id}_odds`]}
                </ErrorMessage>
              )}
            </InputGroup>
            
            <InputGroup>
              <Label>Bet Type</Label>
              <Select
                value={bet.bet_type}
                onChange={(e) => updateBet(bet.id, 'bet_type', e.target.value)}
              >
                {betTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </InputGroup>
            
            <InputGroup>
              <Label>Amount ($)</Label>
              <Input
                type="number"
                placeholder="25.00"
                step="0.01"
                min="0.01"
                value={bet.amount}
                onChange={(e) => updateBet(bet.id, 'amount', e.target.value)}
              />
              {errors[`bet_${bet.id}_amount`] && (
                <ErrorMessage>
                  <AlertCircle size={16} />
                  {errors[`bet_${bet.id}_amount`]}
                </ErrorMessage>
              )}
            </InputGroup>
            
            <DeleteButton onClick={() => removeBet(bet.id)}>
              <Trash2 size={16} />
            </DeleteButton>
          </BetRow>
          
          <InputGroup style={{ marginTop: '1rem' }}>
            <Label>Sportsbook (Optional)</Label>
            <Select
              value={bet.sportsbook}
              onChange={(e) => updateBet(bet.id, 'sportsbook', e.target.value)}
            >
              {sportsbooks.map(book => (
                <option key={book.value} value={book.value}>
                  {book.label}
                </option>
              ))}
            </Select>
          </InputGroup>
          
          <FindOddsButton 
            onClick={() => handleFindBestOdds(bet.id)}
            disabled={!bet.team.trim()}
          >
            <Search size={16} />
            {showOddsComparison === bet.id ? 'Hide Odds' : 'Find Best Odds'}
          </FindOddsButton>
          
          {showOddsComparison === bet.id && (
            <OddsComparisonSection>
              <OddsComparison 
                team={bet.team}
                betType={bet.bet_type}
                sport={selectedSport}
                amount={parseFloat(bet.amount) || 100}
              />
            </OddsComparisonSection>
          )}
        </BetCard>
      ))}
      
      <AddButton onClick={addBet}>
        <Plus size={16} />
        Add Another Bet
      </AddButton>
      
      <TotalSection>
        <InputGroup>
          <Label>Total Parlay Amount ($)</Label>
          <Input
            type="number"
            placeholder="100.00"
            step="0.01"
            min="0.01"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
          {errors.totalAmount && (
            <ErrorMessage>
              <AlertCircle size={16} />
              {errors.totalAmount}
            </ErrorMessage>
          )}
        </InputGroup>
        
        <InputGroup style={{ marginTop: '1rem' }}>
          <Label>Notes (Optional)</Label>
          <Input
            type="text"
            placeholder="Any additional notes or strategy..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            maxLength={500}
          />
        </InputGroup>
        
        <TotalRow>
          <span>Individual Bets Total: ${totalBetAmount.toFixed(2)}</span>
          <span>Parlay Total: ${parseFloat(totalAmount || 0).toFixed(2)}</span>
        </TotalRow>
        
        <div style={{ 
          background: '#ff8c4220', 
          border: '1px solid #ff8c42', 
          borderRadius: '8px', 
          padding: '12px', 
          margin: '16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem',
          color: '#ff8c42'
        }}>
          <AlertTriangle size={16} />
          <div>
            <strong>⚠️ For informational purposes only.</strong> This analysis is not gambling advice. 
            PrizmBets does not place bets or guarantee outcomes.
          </div>
        </div>
        
        <EvaluateButton 
          onClick={handleEvaluate} 
          disabled={isLoading}
        >
          <Brain size={20} />
          {isLoading ? 'Analyzing...' : 'Evaluate with AI'}
        </EvaluateButton>
      </TotalSection>
    </BuilderContainer>
  );
};

export default ParlayBuilder;