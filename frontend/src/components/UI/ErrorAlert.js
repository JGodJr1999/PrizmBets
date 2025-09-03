import React from 'react';
import styled from 'styled-components';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

const AlertContainer = styled.div`
  background: ${props => props.theme.colors.accent.secondary}15;
  border: 1px solid ${props => props.theme.colors.accent.secondary}40;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.sm} 0;
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.sm};
  position: relative;
`;

const IconWrapper = styled.div`
  color: ${props => props.theme.colors.accent.secondary};
  margin-top: 2px;
`;

const Content = styled.div`
  flex: 1;
`;

const ErrorTitle = styled.h4`
  color: ${props => props.theme.colors.accent.secondary};
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
`;

const ErrorMessage = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  line-height: 1.4;
`;

const ActionButton = styled.button`
  background: ${props => props.theme.colors.accent.secondary}20;
  border: 1px solid ${props => props.theme.colors.accent.secondary}40;
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.secondary};
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.accent.secondary}30;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.xs};
  right: ${props => props.theme.spacing.xs};
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.muted};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  display: flex;
  align-items: center;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const ErrorAlert = ({ 
  title = 'Something went wrong',
  message,
  onRetry,
  onDismiss,
  showRetry = false,
  retryText = 'Try again'
}) => {
  const getFriendlyMessage = (error) => {
    if (typeof error === 'string') {
      // Make network errors more friendly
      if (error.toLowerCase().includes('network')) {
        return "Please check your internet connection and try again.";
      }
      if (error.toLowerCase().includes('server')) {
        return "Our servers are temporarily busy. Please try again in a moment.";
      }
      if (error.toLowerCase().includes('auth')) {
        return "There was an issue with authentication. Please try signing in again.";
      }
      return error;
    }
    return "An unexpected error occurred. Please try again.";
  };

  return (
    <AlertContainer>
      <IconWrapper>
        <AlertTriangle size={18} />
      </IconWrapper>
      <Content>
        <ErrorTitle>{title}</ErrorTitle>
        <ErrorMessage>
          {getFriendlyMessage(message)}
        </ErrorMessage>
        {showRetry && onRetry && (
          <ActionButton onClick={onRetry}>
            <RefreshCw size={14} />
            {retryText}
          </ActionButton>
        )}
      </Content>
      {onDismiss && (
        <CloseButton onClick={onDismiss}>
          <X size={16} />
        </CloseButton>
      )}
    </AlertContainer>
  );
};

export default ErrorAlert;