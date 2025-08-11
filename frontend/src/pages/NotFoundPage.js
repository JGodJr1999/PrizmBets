import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFoundContainer = styled.div`
  min-height: calc(100vh - 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.lg};
`;

const NotFoundCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xxl};
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: ${props => props.theme.shadows.lg};
`;

const NotFoundIcon = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  justify-content: center;
`;

const NotFoundTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.sm};
  background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary}, ${props => props.theme.colors.accent.primary}dd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const NotFoundSubtitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const NotFoundMessage = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: center;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
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

const SearchSuggestions = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  text-align: left;
`;

const SuggestionTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const SuggestionList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const SuggestionItem = styled.li`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme.spacing.xs};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.background.hover};
    color: ${props => props.theme.colors.text.primary};
    transform: translateX(4px);
  }
  
  &:before {
    content: '→';
    margin-right: ${props => props.theme.spacing.xs};
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <NotFoundContainer>
      <NotFoundCard>
        <NotFoundIcon>
          <Search size={64} />
        </NotFoundIcon>
        
        <NotFoundTitle>404</NotFoundTitle>
        <NotFoundSubtitle>Page Not Found</NotFoundSubtitle>
        
        <NotFoundMessage>
          Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
        </NotFoundMessage>
        
        <ButtonGroup>
          <ActionButton primary onClick={handleGoHome}>
            <Home size={16} />
            Go Home
          </ActionButton>
          <ActionButton onClick={handleGoBack}>
            <ArrowLeft size={16} />
            Go Back
          </ActionButton>
        </ButtonGroup>
        
        <SearchSuggestions>
          <SuggestionTitle>Looking for something specific?</SuggestionTitle>
          <SuggestionList>
            <SuggestionItem onClick={() => handleNavigate('/')}>
              Build a new parlay
            </SuggestionItem>
            <SuggestionItem onClick={() => handleNavigate('/login')}>
              Sign in to your account
            </SuggestionItem>
            <SuggestionItem onClick={() => handleNavigate('/register')}>
              Create a new account
            </SuggestionItem>
          </SuggestionList>
        </SearchSuggestions>
      </NotFoundCard>
    </NotFoundContainer>
  );
};

export default NotFoundPage;