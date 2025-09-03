import React, { useState } from 'react';
import styled from 'styled-components';
import { TrendingUp, Target, Upload, BarChart3, Zap, Database } from 'lucide-react';
import AnalyticsDashboard from '../components/Analytics/AnalyticsDashboard';
import BetTrackingPage from '../components/BetTracking/BetTrackingPage';
import DataUploader from '../components/BettingData/DataUploader';

const HubContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xl};
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2rem;
    flex-direction: column;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const TitleIcon = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary} 0%, ${props => props.theme.colors.accent.primary}CC 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.background.primary};
  box-shadow: 0 8px 32px ${props => props.theme.colors.accent.primary}40;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 50px;
    height: 50px;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    overflow-x: auto;
    justify-content: flex-start;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.text.secondary};
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border-bottom: 3px solid ${props => props.active ? props.theme.colors.accent.primary : 'transparent'};
  transition: all 0.3s ease;
  white-space: nowrap;
  position: relative;
  
  &:hover {
    color: ${props => props.theme.colors.accent.primary};
    background: ${props => props.theme.colors.accent.primary}10;
  }
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.active ? 
      `linear-gradient(135deg, ${props.theme.colors.accent.primary}15 0%, transparent 100%)` : 
      'transparent'
    };
    border-radius: ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md} 0 0;
    z-index: -1;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    font-size: 0.9rem;
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const TabBadge = styled.span`
  background: ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.text.muted};
  color: ${props => props.active ? props.theme.colors.background.primary : props.theme.colors.background.card};
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 14px;
  text-align: center;
  line-height: 1.2;
`;

const ContentArea = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  min-height: 600px;
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.lg};
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, 
      ${props => props.theme.colors.accent.primary} 0%, 
      ${props => props.theme.colors.accent.primary}80 50%, 
      ${props => props.theme.colors.accent.primary} 100%
    );
    z-index: 1;
  }
`;

const TabContent = styled.div`
  padding: 0;
  height: 100%;
  
  /* Override any padding from child components that might interfere */
  > * {
    padding: ${props => props.theme.spacing.xl};
    
    @media (max-width: ${props => props.theme.breakpoints.md}) {
      padding: ${props => props.theme.spacing.lg};
    }
    
    @media (max-width: ${props => props.theme.breakpoints.sm}) {
      padding: ${props => props.theme.spacing.md};
    }
  }
`;

const BettingHubPage = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  const tabs = [
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: TrendingUp, 
      badge: 'New',
      description: 'Advanced betting insights and performance metrics'
    },
    { 
      id: 'tracking', 
      label: 'Bet Tracking', 
      icon: Target, 
      description: 'Track and manage your betting history'
    },
    { 
      id: 'upload', 
      label: 'Data Upload', 
      icon: Upload, 
      description: 'Import your betting data for analysis'
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <TabContent>
            <AnalyticsDashboard />
          </TabContent>
        );
      case 'tracking':
        return (
          <TabContent>
            <BetTrackingPage />
          </TabContent>
        );
      case 'upload':
        return (
          <TabContent>
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                marginBottom: '24px' 
              }}>
                <Database size={28} color="#00d4aa" />
                <div>
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: '1.5rem', 
                    fontWeight: '700',
                    color: '#ffffff'
                  }}>
                    Data Upload
                  </h2>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    color: '#888',
                    fontSize: '1rem'
                  }}>
                    Import your betting history for comprehensive analysis
                  </p>
                </div>
              </div>
              <DataUploader />
            </div>
          </TabContent>
        );
      default:
        return (
          <TabContent>
            <AnalyticsDashboard />
          </TabContent>
        );
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <HubContainer>
      <ContentWrapper>
        <Header>
          <Title>
            <TitleIcon>
              <Zap size={28} />
            </TitleIcon>
            Betting Hub
          </Title>
          <Subtitle>
            {activeTabData?.description || 'Your complete betting management and analytics center'}
          </Subtitle>
        </Header>

        <TabsContainer>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              {tab.label}
              {tab.badge && (
                <TabBadge active={activeTab === tab.id}>
                  {tab.badge}
                </TabBadge>
              )}
            </Tab>
          ))}
        </TabsContainer>

        <ContentArea>
          {renderContent()}
        </ContentArea>
      </ContentWrapper>
    </HubContainer>
  );
};

export default BettingHubPage;