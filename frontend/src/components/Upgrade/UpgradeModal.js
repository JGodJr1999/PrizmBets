import React from 'react';
import styled from 'styled-components';
import { X, Crown, Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: ${props => props.theme.spacing.lg};
`;

const Modal = styled.div`
  background: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.xl};
  max-width: 600px;
  width: 100%;
  position: relative;
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.xl};
`;

const Header = styled.div`
  background: ${props => props.theme.colors.gradient.primary};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  color: white;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};

  &:hover {
    opacity: 0.8;
  }
`;

const IconWrapper = styled.div`
  margin: 0 auto ${props => props.theme.spacing.md};
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  opacity: 0.9;
`;

const Content = styled.div`
  padding: ${props => props.theme.spacing.xl};
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.95rem;

  svg {
    color: ${props => props.theme.colors.accent.primary};
    flex-shrink: 0;
  }
`;

const PriceBox = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 2px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Price = styled.div`
  font-size: 3rem;
  font-weight: 900;
  color: ${props => props.theme.colors.text.primary};

  span {
    font-size: 1.2rem;
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const Savings = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  font-weight: 600;
  margin-top: ${props => props.theme.spacing.sm};
`;

const CTAButton = styled.button`
  width: 100%;
  background: ${props => props.theme.colors.accent.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.accent.primaryHover};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
`;

const UpgradeModal = ({ isOpen, onClose, trigger }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const triggerMessages = {
    evaluation_limit: {
      title: "You've Hit Your Daily Limit",
      subtitle: "Upgrade to Pro for unlimited AI parlay evaluations",
      icon: <Zap size={40} />
    },
    odds_limit: {
      title: "Odds Comparison Limit Reached",
      subtitle: "Pro users compare odds unlimited times per day",
      icon: <Crown size={40} />
    },
    bet_limit: {
      title: "Bet Tracking Limit Reached",
      subtitle: "Track unlimited bets with Pro",
      icon: <Crown size={40} />
    }
  };

  const message = triggerMessages[trigger] || triggerMessages.evaluation_limit;

  const handleUpgrade = () => {
    navigate('/subscription');
    onClose();
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>

          <IconWrapper>
            {message.icon}
          </IconWrapper>

          <Title>{message.title}</Title>
          <Subtitle>{message.subtitle}</Subtitle>
        </Header>

        <Content>
          <PriceBox>
            <Price>
              $14.99<span>/month</span>
            </Price>
            <Savings>
              Or $149.99/year (save $29.89)
            </Savings>
          </PriceBox>

          <FeatureGrid>
            <Feature>
              <Check size={18} />
              Unlimited evaluations
            </Feature>
            <Feature>
              <Check size={18} />
              Unlimited odds comparisons
            </Feature>
            <Feature>
              <Check size={18} />
              All 8+ sportsbooks
            </Feature>
            <Feature>
              <Check size={18} />
              Email bet tracking
            </Feature>
            <Feature>
              <Check size={18} />
              Unlimited bet tracking
            </Feature>
            <Feature>
              <Check size={18} />
              Advanced AI analysis
            </Feature>
            <Feature>
              <Check size={18} />
              Priority support
            </Feature>
            <Feature>
              <Check size={18} />
              Ad-free experience
            </Feature>
          </FeatureGrid>

          <CTAButton onClick={handleUpgrade}>
            Upgrade to Pro - First 14 Days Free
          </CTAButton>
        </Content>
      </Modal>
    </Overlay>
  );
};

export default UpgradeModal;