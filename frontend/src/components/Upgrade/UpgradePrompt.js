import React, { useState } from 'react';
import styled from 'styled-components';
import { Crown, Zap, Star, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const PromptOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: ${props => props.theme.spacing.lg};
  backdrop-filter: blur(4px);
`;

const PromptCard = styled(motion.div)`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  width: 100%;
  position: relative;
  box-shadow: ${props => props.theme.shadows.xl};
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.muted};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.background.hover};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const PromptHeader = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const PromptIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${props => props.theme.spacing.md};
  color: white;
`;

const PromptTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const PromptMessage = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
`;

const LimitInfo = styled.div`
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.2);
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.lg} 0;
  text-align: center;
`;

const LimitText = styled.p`
  color: #ff4444;
  font-weight: 600;
  margin: 0;
  font-size: 0.9rem;
`;

const PlanComparison = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.lg} 0;
`;

const PlanCard = styled.div`
  background: ${props => props.recommended ?
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}20 0%, ${props.theme.colors.accent.primary}10 100%)` :
    props.theme.colors.background.secondary
  };
  border: 2px solid ${props => props.recommended ? props.theme.colors.accent.primary : props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.md};
  text-align: center;
  position: relative;
`;

const PlanName = styled.h4`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
`;

const PlanPrice = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.sm};

  span {
    font-size: 0.9rem;
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const PlanFeature = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  margin-bottom: 2px;
`;

const RecommendedBadge = styled.div`
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.colors.accent.primary};
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const Button = styled.button`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};

  &.primary {
    background: ${props => props.theme.colors.accent.primary};
    color: white;
    border: 2px solid ${props => props.theme.colors.accent.primary};

    &:hover {
      background: ${props => props.theme.colors.accent.secondary};
      transform: translateY(-1px);
    }
  }

  &.secondary {
    background: transparent;
    color: ${props => props.theme.colors.text.secondary};
    border: 2px solid ${props => props.theme.colors.border.primary};

    &:hover {
      background: ${props => props.theme.colors.background.hover};
      color: ${props => props.theme.colors.text.primary};
    }
  }
`;

const UpgradePrompt = ({
  isOpen,
  onClose,
  feature,
  limitReached = true,
  currentUsage = 0,
  limit = 0,
  resetPeriod = 'day'
}) => {
  const [upgrading, setUpgrading] = useState(false);

  if (!isOpen) return null;

  const getFeatureInfo = () => {
    switch (feature) {
      case 'aiParlayEvaluation':
        return {
          title: 'AI Parlay Evaluation Limit Reached',
          description: 'You\'ve used all your AI parlay evaluations for this week.',
          icon: <Star size={24} />
        };
      case 'oddsComparison':
        return {
          title: 'Daily Odds Comparison Used',
          description: 'You\'ve used your daily odds comparison. Try again tomorrow or upgrade for unlimited access.',
          icon: <Zap size={24} />
        };
      case 'betTracking':
        return {
          title: 'Bet Tracking Limit Reached',
          description: 'You\'ve reached your weekly bet tracking limit.',
          icon: <Crown size={24} />
        };
      case 'liveGames':
        return {
          title: 'Live Games Limit Reached',
          description: 'You\'ve viewed all 5 live games allowed this week.',
          icon: <Crown size={24} />
        };
      case 'aiTop5':
        return {
          title: 'AI\'s Top 5 - Pro Feature',
          description: 'AI\'s Top 5 picks with detailed analytics are exclusive to Pro and Elite subscribers.',
          icon: <Crown size={24} />
        };
      default:
        return {
          title: 'Upgrade Required',
          description: 'Upgrade to continue using this feature.',
          icon: <Crown size={24} />
        };
    }
  };

  const handleUpgrade = async (plan) => {
    setUpgrading(true);

    try {
      // Simulate upgrade process
      toast.success(`Upgrading to ${plan} plan...`);

      // In a real implementation, this would integrate with Stripe
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success(`Successfully upgraded to ${plan} plan!`);
      onClose();
    } catch (error) {
      console.error('Upgrade failed:', error);
      toast.error('Upgrade failed. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const featureInfo = getFeatureInfo();

  return (
    <AnimatePresence>
      <PromptOverlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <PromptCard
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>

          <PromptHeader>
            <PromptIcon>
              {featureInfo.icon}
            </PromptIcon>
            <PromptTitle>{featureInfo.title}</PromptTitle>
            <PromptMessage>{featureInfo.description}</PromptMessage>
          </PromptHeader>

          {limitReached && (
            <LimitInfo>
              <LimitText>
                {currentUsage} of {limit} used this {resetPeriod}
              </LimitText>
            </LimitInfo>
          )}

          <PlanComparison>
            <PlanCard>
              <PlanName>
                <Star size={16} />
                Starter
              </PlanName>
              <PlanPrice>Free</PlanPrice>
              <PlanFeature>Limited features</PlanFeature>
              <PlanFeature>Weekly/daily limits</PlanFeature>
              <PlanFeature>Basic support</PlanFeature>
            </PlanCard>

            <PlanCard recommended>
              <RecommendedBadge>Recommended</RecommendedBadge>
              <PlanName>
                <Crown size={16} />
                Pro
              </PlanName>
              <PlanPrice>
                $14.99<span>/month</span>
              </PlanPrice>
              <PlanFeature>Unlimited everything</PlanFeature>
              <PlanFeature>Advanced features</PlanFeature>
              <PlanFeature>Priority support</PlanFeature>
            </PlanCard>
          </PlanComparison>

          <ActionButtons>
            <Button
              className="secondary"
              onClick={onClose}
              disabled={upgrading}
            >
              Maybe Later
            </Button>
            <Button
              className="primary"
              onClick={() => handleUpgrade('Pro')}
              disabled={upgrading}
            >
              {upgrading ? (
                'Upgrading...'
              ) : (
                <>
                  Upgrade to Pro
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </ActionButtons>
        </PromptCard>
      </PromptOverlay>
    </AnimatePresence>
  );
};

export default UpgradePrompt;