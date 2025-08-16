import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Zap, Star, Check, TrendingUp, BarChart3, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.lg};
`;

const Modal = styled(motion.div)`
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.lg};
  right: ${props => props.theme.spacing.lg};
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.muted};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s ease;
  z-index: 1;

  &:hover {
    background: ${props => props.theme.colors.background.hover};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const Header = styled.div`
  background: ${props => props.theme.colors.gradient.primary};
  color: white;
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.xl};
  text-align: center;
  position: relative;
`;

const HeaderIcon = styled.div`
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${props => props.theme.spacing.lg};
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
  line-height: 1.6;
  max-width: 500px;
  margin: 0 auto;
`;

const Content = styled.div`
  padding: ${props => props.theme.spacing.xl};
`;

const UsageWarning = styled.div`
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  color: white;
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: center;
`;

const WarningTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const WarningText = styled.p`
  margin: 0;
  opacity: 0.9;
`;

const TierComparison = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const TierCard = styled.div`
  border: 2px solid ${props => props.recommended ? props.theme.colors.accent.primary : props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  position: relative;
  background: ${props => props.recommended ? props.theme.colors.accent.primary + '10' : props.theme.colors.background.card};
`;

const RecommendedBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.colors.accent.primary};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const TierName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const TierPrice = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent.primary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const FeatureItem = styled.li`
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

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid ${props => props.primary ? props.theme.colors.accent.primary : props.theme.colors.border.primary};
  background: ${props => props.primary ? props.theme.colors.accent.primary : 'transparent'};
  color: ${props => props.primary ? 'white' : props.theme.colors.text.primary};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    ${props => !props.primary && `
      border-color: ${props.theme.colors.accent.primary};
      color: ${props.theme.colors.accent.primary};
    `}
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Benefits = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const BenefitsTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const BenefitsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const UpgradeFlow = ({ isOpen, onClose, suggestedTier = 'pro', reason = 'limit_reached' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserUsage();
    }
  }, [isOpen, user]);

  const fetchUserUsage = async () => {
    try {
      const response = await apiService.getUserUsage();
      setUsage(response);
    } catch (error) {
      console.error('Failed to fetch user usage:', error);
    }
  };

  const handleUpgrade = async (tier) => {
    setLoading(true);
    try {
      // Simulate upgrade process
      toast.success(`Upgrading to ${tier === 'pro' ? 'Pro' : 'Premium'} plan...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Successfully upgraded! Your new limits are now active.');
      onClose();
    } catch (error) {
      toast.error('Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getReason = () => {
    switch (reason) {
      case 'limit_reached':
        return {
          title: 'Daily Limit Reached!',
          description: 'You\'ve reached your daily limit for parlay evaluations. Upgrade to continue analyzing bets today.',
          icon: <TrendingUp size={32} />
        };
      case 'odds_limit':
        return {
          title: 'Odds Comparison Limit Reached!',
          description: 'You\'ve used all your daily odds comparisons. Upgrade for unlimited access.',
          icon: <BarChart3 size={32} />
        };
      default:
        return {
          title: 'Unlock Your Full Potential!',
          description: 'Upgrade to access unlimited features and maximize your betting success.',
          icon: <Sparkles size={32} />
        };
    }
  };

  const reasonData = getReason();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <Modal
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 50 }}
          onClick={(e) => e.stopPropagation()}
        >
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>

          <Header>
            <HeaderIcon>
              {reasonData.icon}
            </HeaderIcon>
            <Title>{reasonData.title}</Title>
            <Subtitle>{reasonData.description}</Subtitle>
          </Header>

          <Content>
            {usage && reason === 'limit_reached' && (
              <UsageWarning>
                <WarningTitle>Today's Usage</WarningTitle>
                <WarningText>
                  You've used {usage.parlay_evaluations || 0} of {usage.parlay_limit || 3} daily parlay evaluations
                </WarningText>
              </UsageWarning>
            )}

            <Benefits>
              <BenefitsTitle>
                <Crown size={20} />
                Why Upgrade?
              </BenefitsTitle>
              <BenefitsList>
                <BenefitItem>
                  <Check size={16} />
                  Unlimited daily usage
                </BenefitItem>
                <BenefitItem>
                  <Check size={16} />
                  Advanced AI analysis
                </BenefitItem>
                <BenefitItem>
                  <Check size={16} />
                  Priority support
                </BenefitItem>
                <BenefitItem>
                  <Check size={16} />
                  Exclusive insights
                </BenefitItem>
              </BenefitsList>
            </Benefits>

            <TierComparison>
              <TierCard>
                <TierName>
                  <Star size={24} />
                  Free Plan
                </TierName>
                <TierPrice>$0/month</TierPrice>
                <FeaturesList>
                  <FeatureItem>
                    <Check size={16} />
                    3 daily parlay evaluations
                  </FeatureItem>
                  <FeatureItem>
                    <Check size={16} />
                    10 daily odds comparisons
                  </FeatureItem>
                  <FeatureItem>
                    <Check size={16} />
                    Basic AI analysis
                  </FeatureItem>
                </FeaturesList>
              </TierCard>

              <TierCard recommended>
                <RecommendedBadge>Recommended</RecommendedBadge>
                <TierName>
                  <Zap size={24} />
                  Pro Plan
                </TierName>
                <TierPrice>$29.99/month</TierPrice>
                <FeaturesList>
                  <FeatureItem>
                    <Check size={16} />
                    Unlimited parlay evaluations
                  </FeatureItem>
                  <FeatureItem>
                    <Check size={16} />
                    Unlimited odds comparisons
                  </FeatureItem>
                  <FeatureItem>
                    <Check size={16} />
                    Advanced AI analysis
                  </FeatureItem>
                  <FeatureItem>
                    <Check size={16} />
                    Priority support
                  </FeatureItem>
                </FeaturesList>
              </TierCard>
            </TierComparison>

            <ActionButtons>
              <Button onClick={onClose} disabled={loading}>
                Maybe Later
              </Button>
              <Button 
                primary 
                onClick={() => handleUpgrade('pro')}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Upgrade to Pro'}
              </Button>
            </ActionButtons>
          </Content>
        </Modal>
      </Overlay>
    </AnimatePresence>
  );
};

export default UpgradeFlow;