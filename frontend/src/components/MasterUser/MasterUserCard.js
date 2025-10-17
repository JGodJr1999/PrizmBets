import React from 'react';
import styled from 'styled-components';
import { Crown, CheckCircle, Zap, Infinity } from 'lucide-react';

const CardContainer = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border: 2px solid #FFD700;
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.1), transparent);
    animation: shimmer 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  position: relative;
  z-index: 1;
`;

const CrownIcon = styled.div`
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border-radius: 50%;
  padding: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
`;

const CardTitle = styled.h3`
  color: #FFD700;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const CardSubtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  position: relative;
  z-index: 1;
`;

const FeaturesList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.md};
  position: relative;
  z-index: 1;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
  padding: ${props => props.theme.spacing.sm};
  background: rgba(255, 255, 255, 0.05);
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid rgba(255, 215, 0, 0.2);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 215, 0, 0.1);
    transform: translateY(-2px);
  }

  svg {
    color: #FFD700;
    flex-shrink: 0;
  }
`;

const UnlimitedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #00D4AA, #00B894);
  color: white;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: auto;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const MasterUserCard = () => {
  const features = [
    'Unlimited AI Parlay Evaluations',
    'Unlimited Odds Comparisons',
    'AI Top 5 Picks - 5 per sport',
    'Unlimited Bet Tracking',
    'Unlimited Live Games',
    'Premium Analytics with Lifetime Stats'
  ];

  return (
    <CardContainer>
      <CardHeader>
        <CrownIcon>
          <Crown size={24} />
        </CrownIcon>
        <div>
          <CardTitle>Master User Account</CardTitle>
        </div>
      </CardHeader>

      <CardSubtitle>
        You have unlimited access to all features for testing and administration purposes.
        No restrictions, no limits, no usage tracking.
      </CardSubtitle>

      <FeaturesList>
        {features.map((feature, index) => (
          <FeatureItem key={index}>
            <CheckCircle size={16} />
            <span>{feature}</span>
            <UnlimitedBadge>
              <Infinity size={12} />
              Unlimited
            </UnlimitedBadge>
          </FeatureItem>
        ))}
      </FeaturesList>
    </CardContainer>
  );
};

export default MasterUserCard;