import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Upload, BarChart3, TrendingUp, History } from 'lucide-react';
import DataUploader from '../components/BettingData/DataUploader';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xl};
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme.colors.text.secondary};
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
`;

const Tab = styled(motion.button)`
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  color: ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.text.secondary};
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.accent.primary : 'transparent'};
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  &:hover {
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const TabContent = styled(motion.div)`
  min-height: 400px;
`;

const ComingSoonCard = styled(motion.div)`
  background: ${props => props.theme.colors.gradient.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
`;

const ComingSoonTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ComingSoonText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  max-width: 400px;
  margin: 0 auto;
`;

const FeatureItem = styled.li`
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.sm};
  padding-left: ${props => props.theme.spacing.lg};
  position: relative;
  
  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: ${props => props.theme.colors.accent.primary};
    font-weight: bold;
  }
`;

const BettingDataPage = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedData, setUploadedData] = useState(null);

  const tabs = [
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'tracking', label: 'Performance', icon: TrendingUp },
    { id: 'history', label: 'History', icon: History }
  ];

  const handleDataUploaded = (data) => {
    setUploadedData(data);
    setActiveTab('analytics');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return <DataUploader onDataUploaded={handleDataUploaded} />;
      
      case 'analytics':
        return (
          <ComingSoonCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <BarChart3 size={48} color="#FFD700" style={{ margin: '0 auto 1rem' }} />
            <ComingSoonTitle>Advanced Analytics Coming Soon</ComingSoonTitle>
            <ComingSoonText>
              Get detailed insights into your betting performance with advanced analytics and visualizations.
            </ComingSoonText>
            <FeatureList>
              <FeatureItem>Win/loss trends over time</FeatureItem>
              <FeatureItem>ROI analysis by sport and bet type</FeatureItem>
              <FeatureItem>Comparative sportsbook performance</FeatureItem>
              <FeatureItem>Predictive modeling for future bets</FeatureItem>
              <FeatureItem>Risk assessment and bankroll optimization</FeatureItem>
            </FeatureList>
          </ComingSoonCard>
        );
      
      case 'tracking':
        return (
          <ComingSoonCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <TrendingUp size={48} color="#FFD700" style={{ margin: '0 auto 1rem' }} />
            <ComingSoonTitle>Performance Tracking Coming Soon</ComingSoonTitle>
            <ComingSoonText>
              Monitor your betting performance in real-time with comprehensive tracking tools.
            </ComingSoonText>
            <FeatureList>
              <FeatureItem>Real-time P&L tracking</FeatureItem>
              <FeatureItem>Streak analysis (wins/losses)</FeatureItem>
              <FeatureItem>Monthly and yearly summaries</FeatureItem>
              <FeatureItem>Goal setting and progress tracking</FeatureItem>
              <FeatureItem>Performance alerts and notifications</FeatureItem>
            </FeatureList>
          </ComingSoonCard>
        );
      
      case 'history':
        return (
          <ComingSoonCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <History size={48} color="#FFD700" style={{ margin: '0 auto 1rem' }} />
            <ComingSoonTitle>Betting History Coming Soon</ComingSoonTitle>
            <ComingSoonText>
              View and analyze your complete betting history with powerful search and filtering capabilities.
            </ComingSoonText>
            <FeatureList>
              <FeatureItem>Searchable bet history</FeatureItem>
              <FeatureItem>Filter by date, sport, sportsbook</FeatureItem>
              <FeatureItem>Export data for tax purposes</FeatureItem>
              <FeatureItem>Detailed bet breakdowns</FeatureItem>
              <FeatureItem>Notes and tags for organization</FeatureItem>
            </FeatureList>
          </ComingSoonCard>
        );
      
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <Header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Title>Betting Data Management</Title>
          <Subtitle>
            Import, track, and analyze all your betting data from every sportsbook in one centralized platform.
          </Subtitle>
        </Header>

        <TabContainer>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <Tab
                key={tab.id}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                <IconComponent size={18} />
                {tab.label}
              </Tab>
            );
          })}
        </TabContainer>

        <TabContent
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {renderTabContent()}
        </TabContent>
      </ContentWrapper>
    </PageContainer>
  );
};

export default BettingDataPage;