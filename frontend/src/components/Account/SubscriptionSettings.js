import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Crown, CreditCard, Calendar, TrendingUp, Zap, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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
      name: 'Free Plan',
      price: 0,
      period: 'forever',
      features: [
        '3 AI parlay evaluations per day',
        '10 odds comparisons per day', 
        '1 data upload per month',
        'Basic analytics',
        'Community support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 9.99,
      period: 'month',
      recommended: true,
      features: [
        'Unlimited AI parlay evaluations',
        'Unlimited odds comparisons',
        'Unlimited data uploads',
        'Advanced analytics & insights',
        'Bet tracking & management',
        'Priority support',
        'Custom export formats'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 19.99,
      period: 'month',
      features: [
        'Everything in Pro',
        'AI-powered betting recommendations',
        'Advanced risk management',
        'Custom betting strategies',
        'API access',
        '1-on-1 consultation',
        'White-label options'
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

        {currentPlan === 'free' && (
          <UsageSection>
            <UsageStat>
              <UsageLabel>
                <TrendingUp size={16} />
                AI Evaluations
              </UsageLabel>
              <UsageValue>{usage.evaluations.used} / {usage.evaluations.limit}</UsageValue>
              <UsageBar>
                <UsageProgress percentage={getUsagePercentage(usage.evaluations.used, usage.evaluations.limit)} />
              </UsageBar>
            </UsageStat>

            <UsageStat>
              <UsageLabel>
                <Zap size={16} />
                Odds Comparisons
              </UsageLabel>
              <UsageValue>{usage.comparisons.used} / {usage.comparisons.limit}</UsageValue>
              <UsageBar>
                <UsageProgress percentage={getUsagePercentage(usage.comparisons.used, usage.comparisons.limit)} />
              </UsageBar>
            </UsageStat>

            <UsageStat>
              <UsageLabel>
                <CreditCard size={16} />
                Data Uploads
              </UsageLabel>
              <UsageValue>{usage.uploads.used} / {usage.uploads.limit}</UsageValue>
              <UsageBar>
                <UsageProgress percentage={getUsagePercentage(usage.uploads.used, usage.uploads.limit)} />
              </UsageBar>
            </UsageStat>
          </UsageSection>
        )}
      </CurrentPlanCard>

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