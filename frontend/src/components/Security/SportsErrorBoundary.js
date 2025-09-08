import React, { Component } from 'react';
import styled from 'styled-components';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.status.error}30;
  border-radius: ${props => props.theme.borderRadius.lg};
  margin: ${props => props.theme.spacing.lg} auto;
  max-width: 600px;
  text-align: center;
`;

const ErrorIcon = styled.div`
  color: ${props => props.theme.colors.status.error};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ErrorTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ErrorMessage = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: ${props => props.theme.spacing.lg};
  max-width: 400px;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
  justify-content: center;
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? props.theme.colors.accent.primary : 'transparent'};
  color: ${props => props.primary ? props.theme.colors.background.primary : props.theme.colors.accent.primary};
  border: 1px solid ${props => props.theme.colors.accent.primary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.primary 
      ? props.theme.colors.accent.primary 
      : `${props.theme.colors.accent.primary}20`};
    color: ${props => props.primary 
      ? props.theme.colors.background.primary 
      : props.theme.colors.accent.primary};
  }
`;

const ErrorDetails = styled.details`
  margin-top: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.hover};
  border-radius: ${props => props.theme.borderRadius.sm};
  max-width: 500px;
  
  summary {
    color: ${props => props.theme.colors.text.secondary};
    cursor: pointer;
    font-size: 0.875rem;
    margin-bottom: ${props => props.theme.spacing.sm};
  }
  
  pre {
    color: ${props => props.theme.colors.text.primary};
    font-size: 0.75rem;
    font-family: 'Monaco', 'Courier New', monospace;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow-y: auto;
  }
`;

// Utility function to sanitize error messages
const sanitizeErrorMessage = (error, errorInfo) => {
  // Remove sensitive information from error messages
  const sensitivePatterns = [
    /api[_-]?key/gi,
    /secret/gi,
    /password/gi,
    /token/gi,
    /bearer/gi,
    /authorization/gi,
    /x-api-key/gi
  ];
  
  let message = error?.message || 'An unexpected error occurred';
  
  // Remove sensitive data
  sensitivePatterns.forEach(pattern => {
    message = message.replace(pattern, '[REDACTED]');
  });
  
  // Limit error message length
  if (message.length > 200) {
    message = message.substring(0, 200) + '...';
  }
  
  return message;
};

// Utility function to check if error should be reported
const shouldReportError = (error, errorInfo) => {
  // Don't report certain types of errors
  const skipPatterns = [
    /ChunkLoadError/i,
    /Loading CSS chunk/i,
    /Network request failed/i,
    /Failed to fetch/i
  ];
  
  const errorMessage = error?.message || '';
  return !skipPatterns.some(pattern => pattern.test(errorMessage));
};

class SportsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('SportsErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // Report error to monitoring service (only for reportable errors)
    if (shouldReportError(error, errorInfo)) {
      // In production, you would send this to your error monitoring service
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
      console.warn(`Error ${this.state.errorId} occurred in sports component`);
    }
  }

  handleRetry = () => {
    // Reset error state and retry
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    // Navigate to home page
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      const sanitizedMessage = sanitizeErrorMessage(this.state.error, this.state.errorInfo);
      
      return (
        <ErrorContainer>
          <ErrorIcon>
            <AlertTriangle size={48} />
          </ErrorIcon>
          
          <ErrorTitle>
            Oops! Something went wrong
          </ErrorTitle>
          
          <ErrorMessage>
            {this.props.fallbackMessage || 
             "We're having trouble loading the sports data. This might be a temporary issue with our servers or your connection."}
          </ErrorMessage>
          
          <ErrorActions>
            <ActionButton primary onClick={this.handleRetry}>
              <RefreshCw size={16} />
              Try Again
            </ActionButton>
            <ActionButton onClick={this.handleGoHome}>
              <Home size={16} />
              Go Home
            </ActionButton>
          </ErrorActions>

          {/* Show error details in development only */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <ErrorDetails>
              <summary>Error Details (Development Only)</summary>
              <pre>
                <strong>Error:</strong> {sanitizedMessage}
                {this.state.errorInfo && (
                  <>
                    <br/><br/>
                    <strong>Component Stack:</strong>
                    {this.state.errorInfo.componentStack}
                  </>
                )}
                <br/><br/>
                <strong>Error ID:</strong> {this.state.errorId}
              </pre>
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// Higher-order component to wrap components with error boundary
export const withSportsErrorBoundary = (Component, options = {}) => {
  const WrappedComponent = (props) => (
    <SportsErrorBoundary fallbackMessage={options.fallbackMessage}>
      <Component {...props} />
    </SportsErrorBoundary>
  );
  
  // Preserve component name for debugging
  WrappedComponent.displayName = `withSportsErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default SportsErrorBoundary;