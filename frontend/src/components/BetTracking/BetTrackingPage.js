import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Mail, BarChart3, Plus, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import EmailParserConsent from './EmailParserConsent';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
  }
`;

const Header = styled.div`
  max-width: 1200px;
  margin: 0 auto ${props => props.theme.spacing.xl};
  text-align: center;
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.sm};
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

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.lg};
  }
`;

const TrackingCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 2px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.border.secondary};
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const CardIcon = styled.div`
  width: 50px;
  height: 50px;
  background: ${props => props.color || props.theme.colors.accent.primary}20;
  border-radius: ${props => props.theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: ${props => props.color || props.theme.colors.accent.primary};
  }
`;

const CardTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
`;

const CardDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.enabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.enabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  
  svg {
    color: ${props => props.enabled ? '#22c55e' : '#ef4444'};
  }
`;

const StatusText = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  font-weight: 500;
`;

const ActionButton = styled.button`
  width: 100%;
  background: ${props => props.primary ? props.theme.colors.accent.primary : 'none'};
  color: ${props => props.primary ? props.theme.colors.background.primary : props.theme.colors.accent.primary};
  border: 2px solid ${props => props.theme.colors.accent.primary};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  
  &:hover {
    background: ${props => props.primary ? props.theme.colors.accent.primaryHover : props.theme.colors.accent.primary};
    color: ${props => props.theme.colors.background.primary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: ${props => props.theme.spacing.lg} 0;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme.spacing.sm};
  
  svg {
    color: ${props => props.theme.colors.accent.primary};
    flex-shrink: 0;
  }
`;

const BetTrackingPage = () => {
  const { user } = useAuth();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [emailTrackingEnabled, setEmailTrackingEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has email tracking enabled
    checkEmailTrackingStatus();
  }, [user, checkEmailTrackingStatus]);

  const checkEmailTrackingStatus = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/user/email-tracking-status', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      setEmailTrackingEnabled(data.enabled || false);
    } catch (error) {
      console.error('Failed to check email tracking status:', error);
    }
  };

  const handleEnableEmailTracking = () => {
    setShowConsentModal(true);
  };

  const handleConsentGiven = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/enable-email-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          consented: true,
          timestamp: new Date().toISOString(),
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEmailTrackingEnabled(true);
        setShowConsentModal(false);
        toast.success('Email tracking enabled! Your unique email address is ready.');
        // Could show the unique email address here
      } else {
        throw new Error('Failed to enable email tracking');
      }
    } catch (error) {
      console.error('Error enabling email tracking:', error);
      toast.error('Failed to enable email tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getClientIP = async () => {
    try {
      const response = await fetch('/api/client-ip');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const handleManualEntry = () => {
    // Navigate to manual bet entry
    toast.info('Manual bet entry coming soon!');
  };

  return (
    <PageContainer>
      <Header>
        <Title>
          <BarChart3 size={40} />
          Bet Tracking
        </Title>
        <Subtitle>
          Track your betting performance automatically or manually. 
          Get insights into your wins, losses, and betting patterns.
        </Subtitle>
      </Header>

      <MainContent>
        {/* Email Tracking Card */}
        <TrackingCard>
          <CardHeader>
            <CardIcon>
              <Mail size={24} />
            </CardIcon>
            <div>
              <CardTitle>Automatic Email Tracking</CardTitle>
            </div>
          </CardHeader>

          <CardDescription>
            Forward your bet confirmations from sportsbooks and we'll automatically 
            extract your bet details. No manual entry required!
          </CardDescription>

          <StatusIndicator enabled={emailTrackingEnabled}>
            {emailTrackingEnabled ? (
              <>
                <CheckCircle size={16} />
                <StatusText>Email tracking is active</StatusText>
              </>
            ) : (
              <>
                <AlertCircle size={16} />
                <StatusText>Email tracking disabled</StatusText>
              </>
            )}
          </StatusIndicator>

          <FeatureList>
            <FeatureItem>
              <CheckCircle size={14} />
              Works with DraftKings, FanDuel, BetMGM & more
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={14} />
              Instant bet tracking - no manual entry
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={14} />
              Emails processed and immediately deleted
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={14} />
              Bank-level security and encryption
            </FeatureItem>
          </FeatureList>

          {emailTrackingEnabled ? (
            <ActionButton onClick={() => toast.info('Manage email tracking in Settings')}>
              <Settings size={16} />
              Manage Settings
            </ActionButton>
          ) : (
            <ActionButton 
              primary 
              onClick={handleEnableEmailTracking}
              disabled={loading}
            >
              <Mail size={16} />
              Enable Email Tracking
            </ActionButton>
          )}
        </TrackingCard>

        {/* Manual Entry Card */}
        <TrackingCard>
          <CardHeader>
            <CardIcon color="#f59e0b">
              <Plus size={24} />
            </CardIcon>
            <div>
              <CardTitle>Manual Bet Entry</CardTitle>
            </div>
          </CardHeader>

          <CardDescription>
            Prefer to enter your bets manually? Use our simple form to log your 
            betting activity and track your performance.
          </CardDescription>

          <StatusIndicator enabled={true}>
            <CheckCircle size={16} />
            <StatusText>Always available</StatusText>
          </StatusIndicator>

          <FeatureList>
            <FeatureItem>
              <CheckCircle size={14} />
              Quick bet entry form
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={14} />
              Support for all bet types
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={14} />
              Edit and update bets anytime
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={14} />
              Immediate dashboard updates
            </FeatureItem>
          </FeatureList>

          <ActionButton onClick={handleManualEntry}>
            <Plus size={16} />
            Add Bet Manually
          </ActionButton>
        </TrackingCard>
      </MainContent>

      <EmailParserConsent
        isOpen={showConsentModal}
        onClose={() => setShowConsentModal(false)}
        onEnable={handleConsentGiven}
      />
    </PageContainer>
  );
};

export default BetTrackingPage;