import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle, Clock, Star, Users } from 'lucide-react';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xl} 0;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${props => props.theme.spacing.lg};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.gradient.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const TutorialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const TutorialCard = styled(motion.div)`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.theme.colors.gradient.primary};
  }
`;

const TutorialHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const TutorialIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.theme.colors.gradient.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const TutorialTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
`;

const TutorialMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.9rem;
`;

const TutorialDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SkillLevel = styled.span`
  background: ${props => {
    switch (props.level) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#ff8c42';
      case 'advanced': return '#f44336';
      default: return '#4CAF50';
    }
  }};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const TutorialContent = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
`;

const StepsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const StepItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
`;

const StepNumber = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${props => props.theme.colors.accent.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
`;

const StepText = styled.div`
  color: ${props => props.theme.colors.text.primary};
  line-height: 1.5;
`;

const ErrorMessage = styled.div`
  background: #ff444420;
  border: 1px solid #ff4444;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  color: #ff4444;
  text-align: center;
  margin: ${props => props.theme.spacing.xl} 0;
`;

const TutorialsPage = () => {
  const [tutorials, setTutorials] = useState([]);
  const [expandedTutorial, setExpandedTutorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const response = await apiService.getTutorials();
        setTutorials(response.tutorials || []);
      } catch (err) {
        setError('Failed to load tutorials');
        console.error('Tutorials fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  const handleTutorialClick = (tutorialId) => {
    setExpandedTutorial(expandedTutorial === tutorialId ? null : tutorialId);
  };

  const getIconForLevel = (level) => {
    switch (level) {
      case 'beginner': return <Star size={24} />;
      case 'intermediate': return <BookOpen size={24} />;
      case 'advanced': return <Users size={24} />;
      default: return <BookOpen size={24} />;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <ContentContainer>
          <LoadingSpinner text="Loading tutorials..." />
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <ErrorMessage>{error}</ErrorMessage>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <Title>Learn Sports Betting</Title>
          <Subtitle>
            Master the art of parlay building with our comprehensive tutorials. 
            From beginner basics to advanced strategies, we'll help you become a smarter bettor.
          </Subtitle>
        </Header>

        <TutorialGrid>
          {tutorials.map((tutorial) => (
            <TutorialCard
              key={tutorial.id}
              onClick={() => handleTutorialClick(tutorial.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <TutorialHeader>
                <TutorialIcon>
                  {getIconForLevel(tutorial.difficulty)}
                </TutorialIcon>
                <div>
                  <TutorialTitle>{tutorial.title}</TutorialTitle>
                  <SkillLevel level={tutorial.difficulty}>
                    {tutorial.difficulty}
                  </SkillLevel>
                </div>
              </TutorialHeader>

              <TutorialMeta>
                <MetaItem>
                  <Clock size={16} />
                  {tutorial.estimated_time}
                </MetaItem>
                <MetaItem>
                  <CheckCircle size={16} />
                  {tutorial.steps?.length || 0} steps
                </MetaItem>
              </TutorialMeta>

              <TutorialDescription>
                {tutorial.description}
              </TutorialDescription>

              {expandedTutorial === tutorial.id && (
                <TutorialContent>
                  <h4 style={{ 
                    color: '#6366f1', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Play size={18} />
                    Tutorial Steps
                  </h4>
                  <StepsList>
                    {tutorial.steps?.map((step, index) => (
                      <StepItem key={index}>
                        <StepNumber>{index + 1}</StepNumber>
                        <StepText>{step}</StepText>
                      </StepItem>
                    )) || []}
                  </StepsList>
                </TutorialContent>
              )}
            </TutorialCard>
          ))}
        </TutorialGrid>
      </ContentContainer>
    </PageContainer>
  );
};

export default TutorialsPage;