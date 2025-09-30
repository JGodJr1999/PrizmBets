import React from 'react';
import styled, { keyframes } from 'styled-components';
import { CheckCircle, TrendingUp, Star } from 'lucide-react';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const shine = keyframes`
  0% { left: -100%; }
  100% { left: 100%; }
`;

const SuccessContainer = styled.div`
  background: linear-gradient(135deg, 
    ${props => props.theme.colors.accent.primary}15,
    ${props => props.theme.colors.accent.primary}05
  );
  border: 1px solid ${props => props.theme.colors.accent.primary}40;
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.md} 0;
  animation: ${fadeIn} 0.5s ease-out;
  position: relative;
  overflow: hidden;
`;

const SuccessHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const IconWrapper = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  display: flex;
  align-items: center;
`;

const SuccessTitle = styled.h3`
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const SuccessMessage = styled.p`
  color: ${props => props.theme.colors.text.primary};
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  line-height: 1.5;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

const StatItem = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.accent.primary}10;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.accent.primary}20;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Shine = styled.div`
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    ${props => props.theme.colors.accent.primary}20,
    transparent
  );
  animation: ${shine} 2s ease-in-out;
`;

const ProfessionalSuccessMessage = ({ 
  title = "Analysis Complete!",
  message = "Your parlay has been successfully analyzed with our AI system.",
  stats = []
}) => {
  return (
    <SuccessContainer>
      <Shine />
      <SuccessHeader>
        <IconWrapper>
          <CheckCircle size={24} />
        </IconWrapper>
        <SuccessTitle>{title}</SuccessTitle>
      </SuccessHeader>
      
      <SuccessMessage>{message}</SuccessMessage>
      
      {stats.length > 0 && (
        <StatsGrid>
          {stats.map((stat, index) => (
            <StatItem key={index}>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatItem>
          ))}
        </StatsGrid>
      )}
    </SuccessContainer>
  );
};

export default ProfessionalSuccessMessage;