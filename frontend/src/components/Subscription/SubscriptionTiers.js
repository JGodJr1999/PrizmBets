import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

// Keyframe animations
const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const TiersContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto;
`;

const TiersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const TierCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 2px solid ${props => props.popular ? props.theme.colors.accent.primary : props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 212, 170, 0.1);
  }
  
  ${props => props.popular && `
    box-shadow: 0 10px 30px rgba(0, 212, 170, 0.2);
  `}
`;

const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TierIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: ${props => props.color}20;
  border-radius: ${props => props.theme.borderRadius.full};
  margin: 0 auto ${props => props.theme.spacing.md};
  
  svg {
    color: ${props => props.color};
  }
`;

const TierName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const TierDescription = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.md};
  line-height: 1.4;
`;

const TierPrice = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Price = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  
  span {
    font-size: 1rem;
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const PriceSubtext = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.muted};
  margin-top: 4px;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 ${props => props.theme.spacing.lg};
`;

const Feature = styled.li`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} 0;
  color: ${props => props.theme.colors.text.secondary};
  
  svg {
    color: ${props => props.theme.colors.accent.primary};
    flex-shrink: 0;
  }
`;

const SubscribeButton = styled.button`
  width: 100%;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background: ${props => props.primary ? props.theme.colors.accent.primary : 'transparent'};
  color: ${props => props.primary ? props.theme.colors.background.primary : props.theme.colors.accent.primary};
  border: 2px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.primary ? props.theme.colors.accent.primaryHover : props.theme.colors.accent.primary};
    color: ${props => props.theme.colors.background.primary};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const CurrentTierIndicator = styled.div`
  background: ${props => props.theme.colors.accent.secondary};
  color: ${props => props.theme.colors.background.primary};
  padding: 8px 16px;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
  margin-top: ${props => props.theme.spacing.md};
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const SubscriptionTiers = ({ currentUser, onSubscriptionChange }) => {
  const [tiers, setTiers] = useState({});
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);

  useEffect(() => {
    loadSubscriptionTiers();
  }, []);

  const loadSubscriptionTiers = async () => {
    try {
      const response = await apiService.getSubscriptionTiers();
      setTiers(response.tiers || {});
    } catch (error) {
      console.error('Failed to load subscription tiers:', error);
      // Set default tiers if API fails
      setTiers({
        free: {
          name: 'Starter',
          price: 0,
          description: 'Perfect for getting started with sports betting analysis',
          features: [
            '3 AI parlay evaluations per week',
            '1 odds comparison per day',
            'Basic AI analysis',
            'Track up to 5 bets per week',
            'View 5 live games',
            'Basic analytics only',
            'Community support'
          ],
          aiParlayEvaluations: {
            limit: 3,
            period: 'week',
            description: '3 AI parlay evaluations per week'
          },
          oddsComparison: {
            limit: 1,
            period: 'day',
            description: '1 odds comparison per day'
          },
          betTracking: {
            limit: 5,
            period: 'week',
            description: 'Track up to 5 bets per week'
          },
          analytics: {
            type: 'basic',
            description: 'Basic analytics'
          },
          liveGames: {
            limit: 5,
            description: 'View 5 live games'
          },
          // Legacy fields for backward compatibility
          daily_evaluations: 3,
          daily_odds_comparisons: 1,
          max_bets: 5,
          concurrent_games: 5,
          analytics_days: 30
        },
        pro: {
          name: 'Pro',
          price: 14.99,
          annualPrice: 149.99,
          description: 'Everything serious bettors need to gain an edge',
          popular: true,
          features: [
            '35 AI parlay evaluations per month',
            'Unlimited odds comparisons',
            'AI\'s Top 5 picks (5 total across all sports)',
            'All 8+ sportsbooks',
            'In-app bet slip for tracking',
            'Watch ALL available live games',
            'Advanced AI analysis',
            '10 custom alerts',
            'Bankroll management tools',
            'Weekly AI insights email',
            'Priority email support (24-48hr)',
            'Ad-free experience',
            'Clean exports (no watermarks)'
          ],
          aiParlayEvaluations: {
            limit: 35,
            period: 'month',
            description: '35 AI parlay evaluations per month'
          },
          oddsComparison: {
            limit: -1,
            period: 'unlimited',
            description: 'Unlimited odds comparisons'
          },
          aiTop5: {
            enabled: true,
            type: 'total',
            limit: 5,
            description: 'AI\'s Top 5 picks (5 total across all sports)'
          },
          betTracking: {
            type: 'in-app',
            limit: -1,
            description: 'In-app bet slip for tracking'
          },
          liveGames: {
            limit: -1,
            description: 'Watch ALL available live games'
          },
          analytics: {
            type: 'advanced',
            lifetime: false,
            description: 'Advanced analytics (not lifetime)'
          },
          // Legacy fields for backward compatibility
          daily_evaluations: -1,
          daily_odds_comparisons: -1,
          max_bets: -1,
          concurrent_games: -1,
          custom_alerts: 10,
          analytics_days: 365 // 1 year of data, not lifetime
        },
        elite: {
          name: 'Elite',
          price: 24.99,
          annualPrice: 249.99,
          description: 'For serious bettors who treat betting as a business',
          features: [
            'Everything in Pro',
            'AI\'s Top 5 picks PER SPORT (5 picks each sport)',
            'Unlimited AI parlay evaluations',
            'Daily AI +EV recommendations (3-5/day)',
            'Real-time steam moves tracker',
            'Prop betting edge finder',
            'Line shopping optimizer',
            'Hedge calculator',
            'Betting journal with AI coach',
            'Custom betting models & backtest',
            'Multi-account tracking',
            'Unlimited custom alerts',
            'Premium analytics with LIFETIME stats',
            'Sharp odds lines (Pinnacle/Circa)',
            'VIP Discord channel',
            'Priority live chat support (12hr)',
            'Monthly strategy consultation call',
            'Early access to new features'
          ],
          aiParlayEvaluations: {
            limit: -1,
            period: 'unlimited',
            description: 'Unlimited AI parlay evaluations'
          },
          oddsComparison: {
            limit: -1,
            period: 'unlimited',
            description: 'Unlimited odds comparisons'
          },
          aiTop5: {
            enabled: true,
            type: 'per-sport',
            limit: 5,
            description: 'AI\'s Top 5 picks PER SPORT (5 picks each sport)'
          },
          betTracking: {
            type: 'in-app',
            limit: -1,
            description: 'In-app bet slip for tracking'
          },
          liveGames: {
            limit: -1,
            description: 'Watch ALL available live games'
          },
          analytics: {
            type: 'premium',
            lifetime: true,
            description: 'Premium analytics with LIFETIME stats'
          },
          // Legacy fields for backward compatibility
          daily_evaluations: -1,
          daily_odds_comparisons: -1,
          max_bets: -1,
          concurrent_games: -1,
          custom_alerts: -1,
          analytics_days: -1, // lifetime
          ai_recommendations: true,
          steam_moves: true,
          vip_community: true
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierKey) => {
    if (!currentUser) {
      toast.error('Please log in to subscribe');
      return;
    }

    if (tierKey === 'free') {
      toast.info('You are already on the free plan');
      return;
    }

    if (isCurrentTier(tierKey)) {
      toast.info('You are already subscribed to this plan');
      return;
    }

    setSubscribing(tierKey);
    
    try {
      // For now, since Stripe is not fully set up, show a placeholder flow
      toast.success(`Upgrading to ${tiers[tierKey]?.name} plan...`);
      
      // Simulate upgrade process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully upgraded to ${tiers[tierKey]?.name} plan!`);
      
      if (onSubscriptionChange) {
        onSubscriptionChange(tierKey);
      }
    } catch (error) {
      console.error('Subscription creation failed:', error);
      toast.error(error.message || 'Failed to create subscription');
    } finally {
      setSubscribing(null);
    }
  };

  const getTierIcon = (tierKey) => {
    switch (tierKey) {
      case 'free':
        return <Star size={24} />;
      case 'pro':
        return <Zap size={24} />;
      case 'elite':
        return <Crown size={24} />;
      default:
        return <Star size={24} />;
    }
  };

  const getTierColor = (tierKey) => {
    switch (tierKey) {
      case 'free':
        return '#6B7280';
      case 'pro':
        return '#00D4AA';
      case 'elite':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const isCurrentTier = (tierKey) => {
    return currentUser?.subscription_tier === tierKey;
  };

  const getButtonText = (tierKey) => {
    if (isCurrentTier(tierKey)) {
      return 'Current Plan';
    }
    if (tierKey === 'free') {
      return 'Current Plan';
    }
    return subscribing === tierKey ? 'Processing...' : 'Subscribe Now';
  };

  if (loading) {
    return (
      <TiersContainer>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <LoadingSpinner style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '1rem', color: '#6B7280' }}>Loading subscription options...</p>
        </div>
      </TiersContainer>
    );
  }

  return (
    <TiersContainer>
      <Header>
        <Title>Choose Your Plan</Title>
        <Subtitle>
          Professional betting tools at an accessible price. Start free, upgrade anytime.
        </Subtitle>
      </Header>

      <TiersGrid>
        {Object.entries(tiers).map(([tierKey, tier], index) => (
          <TierCard key={tierKey} popular={tierKey === 'pro'}>
            {tierKey === 'pro' && (
              <PopularBadge>
                <Crown size={12} />
                Most Popular
              </PopularBadge>
            )}
            
            <TierIcon color={getTierColor(tierKey)}>
              {getTierIcon(tierKey)}
            </TierIcon>
            
            <TierName>{tier.name}</TierName>

            {tier.description && (
              <TierDescription>{tier.description}</TierDescription>
            )}

            <TierPrice>
              <Price>
                ${tier.price}
                <span>/month</span>
              </Price>
              {tierKey !== 'free' && tier.annualPrice && (
                <PriceSubtext>
                  ${tier.annualPrice}/year (save ${((tier.price * 12) - tier.annualPrice).toFixed(2)})
                </PriceSubtext>
              )}
              {tierKey === 'free' && (
                <PriceSubtext>No credit card required</PriceSubtext>
              )}
            </TierPrice>
            
            <FeaturesList>
              {tier.features.map((feature, featureIndex) => (
                <Feature key={featureIndex}>
                  <Check size={16} />
                  {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Feature>
              ))}
              <Feature>
                <Check size={16} />
                {tier.monthly_evaluations === 'unlimited' 
                  ? 'Unlimited parlay evaluations'
                  : `${tier.monthly_evaluations} parlay evaluations/month`
                }
              </Feature>
            </FeaturesList>
            
            <SubscribeButton
              primary={tierKey !== 'free'}
              disabled={isCurrentTier(tierKey) || subscribing === tierKey}
              onClick={() => handleSubscribe(tierKey)}
            >
              {subscribing === tierKey ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LoadingSpinner />
                  Processing...
                </div>
              ) : (
                getButtonText(tierKey)
              )}
            </SubscribeButton>
            
            {isCurrentTier(tierKey) && (
              <CurrentTierIndicator>
                Your Current Plan
              </CurrentTierIndicator>
            )}
          </TierCard>
        ))}
      </TiersGrid>
    </TiersContainer>
  );
};

export default SubscriptionTiers;