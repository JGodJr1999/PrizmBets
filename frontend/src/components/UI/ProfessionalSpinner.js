import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const SpinnerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  min-height: ${props => props.inline ? 'auto' : '200px'};
  flex-direction: column;
`;

const Spinner = styled.div`
  width: ${props => props.size === 'small' ? '20px' : props.size === 'large' ? '50px' : '30px'};
  height: ${props => props.size === 'small' ? '20px' : props.size === 'large' ? '50px' : '30px'};
  border: 3px solid ${props => props.theme.colors.background.secondary};
  border-top: 3px solid ${props => props.theme.colors.accent.primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.size === 'small' ? '0.8rem' : '0.9rem'};
  font-weight: 500;
  margin: 0;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const ProfessionalSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  inline = false,
  showMessage = true 
}) => {
  return (
    <SpinnerContainer inline={inline}>
      <Spinner size={size} />
      {showMessage && <LoadingText size={size}>{message}</LoadingText>}
    </SpinnerContainer>
  );
};

export default ProfessionalSpinner;