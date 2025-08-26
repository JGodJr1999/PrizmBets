import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

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
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
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
          name: 'Free',
          price: 0,
          features: ['3 daily parlay evaluations', '10 daily odds comparisons', 'Basic AI analysis'],
          monthly_evaluations: 90, // 3 per day * 30 days
          daily_evaluations: 3,
          daily_odds_comparisons: 10
        },
        pro: {
          name: 'Pro',
          price: 29.99,
          features: ['Unlimited parlay evaluations', 'Unlimited odds comparisons', 'Advanced AI analysis', 'Priority support'],
          monthly_evaluations: 'unlimited',
          daily_evaluations: -1,
          daily_odds_comparisons: -1
        },
        premium: {
          name: 'Premium',
          price: 59.99,
          features: ['Everything in Pro', 'Advanced analytics', 'VIP support', 'Priority customer support'],
          monthly_evaluations: 'unlimited',
          daily_evaluations: -1,
          daily_odds_comparisons: -1
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
      case 'premium':
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
      case 'premium':
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
          Unlock advanced features and maximize your betting potential with our subscription plans
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
            
            <TierPrice>
              <Price>
                ${tier.price}
                <span>/month</span>
              </Price>
              {tierKey !== 'free' && (
                <PriceSubtext>Billed monthly, cancel anytime</PriceSubtext>
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