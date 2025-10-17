import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Crown, CreditCard, Calendar, TrendingUp, Zap, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import UsageDisplay from '../Usage/UsageDisplay';

const SubscriptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const CurrentPlanCard = styled.div`
  background: ${props => props.isPro ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}20 0%, ${props.theme.colors.accent.primary}10 100%)` :
    props.theme.colors.background.secondary
  };
  border: 2px solid ${props => props.isPro ? props.theme.colors.accent.primary : props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  position: relative;
  overflow: hidden;
`;

const PlanBadge = styled.div`
  background: ${props => props.isPro ? props.theme.colors.accent.primary : props.theme.colors.text.muted};
  color: ${props => props.isPro ? props.theme.colors.background.primary : props.theme.colors.background.card};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const PlanName = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PlanDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  line-height: 1.6;
`;

const UsageSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const UsageStat = styled.div`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
`;

const UsageLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const UsageValue = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const UsageBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.colors.border.primary};
  border-radius: 4px;
  overflow: hidden;
`;

const UsageProgress = styled.div`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props => {
    if (props.percentage >= 90) return props.theme.colors.betting.negative;
    if (props.percentage >= 70) return '#ff8c42';
    return props.theme.colors.accent.primary;
  }};
  border-radius: 4px;
  transition: width 0.3s ease;
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.xl};
`;

const PlanCard = styled.div`
  background: ${props => props.recommended ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}20 0%, ${props.theme.colors.accent.primary}10 100%)` :
    props.theme.colors.background.primary
  };
  border: 2px solid ${props => props.recommended ? props.theme.colors.accent.primary : props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
`;

const RecommendedBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PlanPrice = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 900;
  margin-bottom: ${props => props.theme.spacing.xs};

  span {
    font-size: 1rem;
    color: ${props => props.theme.colors.text.secondary};
    font-weight: 500;
  }
`;

const AnnualSavings = styled.div`
  font-size: 0.85rem;
  color: ${props => props.theme.colors.accent.primary};
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: ${props => props.theme.spacing.lg} 0;
`;

const Feature = styled.li`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: 0.95rem;
`;

const UpgradeButton = styled.button`
  width: 100%;
  background: ${props => props.current ? 
    'transparent' : 
    props.recommended ? props.theme.colors.accent.primary : 'transparent'
  };
  color: ${props => props.current ? 
    props.theme.colors.text.muted :
    props.recommended ? props.theme.colors.background.primary : props.theme.colors.accent.primary
  };
  border: 2px solid ${props => props.current ? 
    props.theme.colors.border.primary :
    props.theme.colors.accent.primary
  };
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  font-size: 1rem;
  cursor: ${props => props.current ? 'default' : 'pointer'};
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.current ? 
      'transparent' :
      props.recommended ? 
        `${props.theme.colors.accent.primary}DD` : 
        `${props.theme.colors.accent.primary}20`
    };
    transform: ${props => props.current ? 'none' : 'translateY(-1px)'};
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const SubscriptionSettings = ({ user }) => {
  const [currentPlan] = useState('free'); // TODO: Get from user data
  const [usage, setUsage] = useState({
    evaluations: { used: 2, limit: 3 },
    comparisons: { used: 7, limit: 10 },
    uploads: { used: 0, limit: 1 }
  });

  const plans = [
    {
      id: 'free',
      name: 'Starter Plan',
      price: 0,
      period: 'forever',
      features: [
        '3 AI parlay evaluations per week',
        '1 odds comparison per day',
        'Track up to 5 bets per week',
        'Basic analytics only',
        'View 5 live games',
        'Community support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 14.99,
      period: 'month',
      annualPrice: 149.99,
      recommended: true,
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
      ]
    },
    {
      id: 'elite',
      name: 'Elite Plan',
      price: 24.99,
      period: 'month',
      annualPrice: 249.99,
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
      ]
    }
  ];

  const handleUpgrade = (planId) => {
    if (planId === currentPlan) return;
    
    // TODO: Implement upgrade flow
    toast.success(`Upgrading to ${plans.find(p => p.id === planId)?.name}...`);
  };

  const getUsagePercentage = (used, limit) => {
    return Math.min((used / limit) * 100, 100);
  };

  const currentPlanData = plans.find(p => p.id === currentPlan);

  return (
    <SubscriptionContainer>
      <SectionTitle>
        <Crown size={24} />
        Subscription & Usage
      </SectionTitle>

      <CurrentPlanCard isPro={currentPlan !== 'free'}>
        <PlanBadge isPro={currentPlan !== 'free'}>
          {currentPlan !== 'free' ? <Crown size={12} /> : <AlertCircle size={12} />}
          {currentPlanData?.name}
        </PlanBadge>
        <PlanName>{currentPlanData?.name}</PlanName>
        <PlanDescription>
          {currentPlan === 'free' 
            ? 'Perfect for getting started with sports betting analysis.'
            : 'Unlock the full power of AI-driven betting insights.'
          }
        </PlanDescription>

      </CurrentPlanCard>

      <UsageDisplay />

      <div>
        <SectionTitle>
          Available Plans
        </SectionTitle>
        
        <PlansGrid>
          {plans.map((plan) => (
            <PlanCard key={plan.id} recommended={plan.recommended}>
              {plan.recommended && <RecommendedBadge>Most Popular</RecommendedBadge>}
              
              <PlanName>{plan.name}</PlanName>
              <PlanPrice>
                ${plan.price}
                <span>/{plan.period}</span>
              </PlanPrice>

              {plan.annualPrice && (
                <AnnualSavings>
                  ${plan.annualPrice}/year (save ${((plan.price * 12) - plan.annualPrice).toFixed(2)})
                </AnnualSavings>
              )}

              <FeatureList>
                {plan.features.map((feature, index) => (
                  <Feature key={index}>
                    <Check size={16} color="#00d4aa" />
                    {feature}
                  </Feature>
                ))}
              </FeatureList>
              
              <UpgradeButton
                current={currentPlan === plan.id}
                recommended={plan.recommended}
                onClick={() => handleUpgrade(plan.id)}
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id ? 'Current Plan' : `Upgrade to ${plan.name}`}
              </UpgradeButton>
            </PlanCard>
          ))}
        </PlansGrid>
      </div>
    </SubscriptionContainer>
  );
};

export default SubscriptionSettings;