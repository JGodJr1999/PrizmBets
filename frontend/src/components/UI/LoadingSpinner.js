import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Brain } from 'lucide-react';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
`;

const SpinnerWrapper = styled.div`
  position: relative;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Spinner = styled.div`
  width: 60px;
  height: 60px;
  border: 3px solid ${props => props.theme.colors.border.secondary};
  border-top: 3px solid ${props => props.theme.colors.accent.primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const BrainIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${props => props.theme.colors.accent.primary};
  animation: ${pulse} 2s ease-in-out infinite;
`;

const LoadingText = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const LoadingSubtext = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.85rem;
`;

const LoadingSpinner = ({ 
  text = "Loading...", 
  subtext = "",
  size = "large" 
}) => {
  const spinnerSize = size === "small" ? "40px" : "60px";
  const iconSize = size === "small" ? 16 : 24;

  return (
    <LoadingContainer>
      <SpinnerWrapper>
        <Spinner style={{ width: spinnerSize, height: spinnerSize }} />
        <BrainIcon>
          <Brain size={iconSize} />
        </BrainIcon>
      </SpinnerWrapper>
      <LoadingText>{text}</LoadingText>
      {subtext && <LoadingSubtext>{subtext}</LoadingSubtext>}
    </LoadingContainer>
  );
};

export default LoadingSpinner;