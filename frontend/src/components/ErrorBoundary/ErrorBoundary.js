import React from 'react';
import styled from 'styled-components';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.lg};
`;

const ErrorCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xxl};
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: ${props => props.theme.shadows.lg};
`;

const ErrorIcon = styled.div`
  color: ${props => props.theme.colors.accent.secondary};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  justify-content: center;
`;

const ErrorTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ErrorMessage = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ErrorDetails = styled.details`
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: left;
  
  summary {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.9rem;
    cursor: pointer;
    margin-bottom: ${props => props.theme.spacing.sm};
    
    &:hover {
      color: ${props => props.theme.colors.text.primary};
    }
  }
  
  pre {
    background: ${props => props.theme.colors.background.secondary};
    border: 1px solid ${props => props.theme.colors.border.secondary};
    border-radius: ${props => props.theme.borderRadius.sm};
    padding: ${props => props.theme.spacing.sm};
    font-size: 0.8rem;
    color: ${props => props.theme.colors.text.muted};
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: center;
  flex-wrap: wrap;
`;

const ErrorButton = styled.button`
  background: ${props => props.primary ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)` :
    'transparent'
  };
  border: 1px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  color: ${props => props.primary ? 
    props.theme.colors.background.primary : 
    props.theme.colors.accent.primary
  };
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
    background: ${props => props.primary ?
      props.theme.colors.accent.primary :
      `${props.theme.colors.accent.primary}10`
    };
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    // For example: reportError(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <ErrorContainer>
          <ErrorCard>
            <ErrorIcon>
              <AlertTriangle size={48} />
            </ErrorIcon>
            
            <ErrorTitle>Something went wrong</ErrorTitle>
            
            <ErrorMessage>
              We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
            </ErrorMessage>
            
            {isDevelopment && this.state.error && (
              <ErrorDetails>
                <summary>Error Details (Development Mode)</summary>
                <pre>
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
{'\n\n'}<strong>Component Stack:</strong>
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </ErrorDetails>
            )}
            
            <ButtonGroup>
              <ErrorButton primary onClick={this.handleReload}>
                <RefreshCw size={16} />
                Reload Page
              </ErrorButton>
              <ErrorButton onClick={this.handleGoHome}>
                <Home size={16} />
                Go Home
              </ErrorButton>
            </ButtonGroup>
          </ErrorCard>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;