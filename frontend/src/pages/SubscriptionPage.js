import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionTiers from '../components/Subscription/SubscriptionTiers';
import MasterUserCard from '../components/MasterUser/MasterUserCard';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { useNavigate } from 'react-router-dom';
import { Crown, CheckCircle } from 'lucide-react';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding-top: ${props => props.theme.spacing.xl};
`;

const MasterUserContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
`;

const MasterUserTitle = styled.h1`
  color: #FFD700;
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const MasterUserDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  line-height: 1.6;
`;

const FeaturesList = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 2px solid #FFD700;
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const FeaturesTitle = styled.h3`
  color: #FFD700;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.md};

  svg {
    color: #51cf66;
    flex-shrink: 0;
  }
`;

const SubscriptionPage = () => {
  const { user, refreshUser } = useAuth();
  const { isMasterUser } = useUsageTracking();
  const navigate = useNavigate();

  const handleSubscriptionChange = async (newTier) => {
    // Refresh user data to get updated subscription info
    await refreshUser();
    
    // Redirect to dashboard or success page
    navigate('/dashboard', { 
      state: { message: `Welcome to PrizmBets ${newTier} plan!` }
    });
  };

  if (isMasterUser) {
    return (
      <PageContainer>
        <MasterUserContainer>
          <MasterUserTitle>
            <Crown size={40} />
            Master User Account
          </MasterUserTitle>

          <MasterUserDescription>
            You have full unlimited access to all features. No subscription required.
          </MasterUserDescription>

          <FeaturesList>
            <FeaturesTitle>
              <Crown size={20} />
              Your Access Level: Master
            </FeaturesTitle>

            <FeatureItem>
              <CheckCircle size={16} />
              All Starter features
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={16} />
              All Pro features
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={16} />
              All Elite features
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={16} />
              Unlimited everything
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={16} />
              No limits or restrictions
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={16} />
              No usage tracking
            </FeatureItem>
            <FeatureItem>
              <CheckCircle size={16} />
              No payment required
            </FeatureItem>
          </FeaturesList>
        </MasterUserContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SubscriptionTiers
        currentUser={user}
        onSubscriptionChange={handleSubscriptionChange}
      />
    </PageContainer>
  );
};

export default SubscriptionPage;