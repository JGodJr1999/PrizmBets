import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import SubscriptionTiers from '../components/Subscription/SubscriptionTiers';
import { useNavigate } from 'react-router-dom';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding-top: ${props => props.theme.spacing.xl};
`;

const SubscriptionPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubscriptionChange = async (newTier) => {
    // Refresh user data to get updated subscription info
    await refreshUser();
    
    // Redirect to dashboard or success page
    navigate('/dashboard', { 
      state: { message: `Welcome to PrizmBets ${newTier} plan!` }
    });
  };

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