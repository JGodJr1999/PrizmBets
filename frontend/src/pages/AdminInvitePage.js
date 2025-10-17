import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { Crown, CheckCircle, AlertCircle, Clock, Settings, Shield, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PageContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.primary};
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InviteCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 2px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.1), transparent);
    animation: shimmer 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const CrownIcon = styled.div`
  background: linear-gradient(135deg, #FFD700, #FFA500);
  border-radius: 50%;
  padding: ${props => props.theme.spacing.lg};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #000;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  margin-bottom: ${props => props.theme.spacing.lg};
  position: relative;
  z-index: 1;
`;

const InviteTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  position: relative;
  z-index: 1;
`;

const InviteSubtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  margin: 0 0 ${props => props.theme.spacing.xl} 0;
  position: relative;
  z-index: 1;
`;

const PrivilegesSection = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.lg} 0;
  text-align: left;
  position: relative;
  z-index: 1;
`;

const PrivilegesTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  text-align: center;
`;

const PrivilegesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const PrivilegeItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-weight: 500;

  svg {
    color: ${props => props.theme.colors.status.success};
    flex-shrink: 0;
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
  margin: ${props => props.theme.spacing.md};
  position: relative;
  z-index: 1;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 215, 0, 0.6);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  background: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: ${props => props.theme.spacing.md};
  position: relative;
  z-index: 1;

  &:hover {
    background: ${props => props.theme.colors.background.hover};
    border-color: ${props => props.theme.colors.accent.primary};
  }
`;

const ErrorCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 2px solid ${props => props.theme.colors.status.error};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
`;

const ErrorTitle = styled.h1`
  color: ${props => props.theme.colors.status.error};
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 ${props => props.theme.spacing.md} 0;
`;

const ErrorMessage = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${props => props.theme.colors.background.hover};
  border-top: 4px solid ${props => props.theme.colors.accent.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: ${props => props.theme.spacing.lg} auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SignInPrompt = styled.div`
  background: ${props => props.theme.colors.accent.primary}10;
  border: 1px solid ${props => props.theme.colors.accent.primary}30;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.lg} 0;
  position: relative;
  z-index: 1;
`;

const WrongEmailWarning = styled.div`
  background: ${props => props.theme.colors.status.warning}10;
  border: 1px solid ${props => props.theme.colors.status.warning}30;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.lg} 0;
  position: relative;
  z-index: 1;
`;

const AdminInvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  const inviteCode = searchParams.get('code');

  useEffect(() => {
    const loadInvite = async () => {
      if (!inviteCode) {
        setError('Invalid invite link - no code provided');
        setLoading(false);
        return;
      }

      try {
        // TODO: In production, query Firestore for the invite
        // For now, simulate invite data
        const mockInviteData = {
          invitedEmail: 'test@example.com',
          invitedBy: 'g.jason18@yahoo.com',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
          status: 'pending',
          role: 'master-admin'
        };

        setInviteData(mockInviteData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading invite:', err);
        setError('Failed to load invite information');
        setLoading(false);
      }
    };

    loadInvite();
  }, [inviteCode]);

  const handleAcceptInvite = async () => {
    if (!user) {
      const currentUrl = window.location.href;
      navigate(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (user.email.toLowerCase() !== inviteData.invitedEmail.toLowerCase()) {
      toast.error('This invite is for a different email address');
      return;
    }

    setAccepting(true);

    try {
      // TODO: In production, call backend Cloud Function to promote user
      console.log('Accepting admin invite:', {
        inviteCode: inviteCode,
        userId: user.uid,
        userEmail: user.email
      });

      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('You are now a Master Admin!');
      navigate('/admin-management');
    } catch (err) {
      console.error('Error accepting invite:', err);
      toast.error('Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  const handleSignIn = () => {
    const currentUrl = window.location.href;
    navigate(`/signin?redirect=${encodeURIComponent(currentUrl)}`);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <PageContainer>
        <InviteCard>
          <LoadingSpinner />
          <p>Loading invite...</p>
        </InviteCard>
      </PageContainer>
    );
  }

  if (error || !inviteData) {
    return (
      <PageContainer>
        <ErrorCard>
          <AlertCircle size={60} color="#e74c3c" style={{ marginBottom: '20px' }} />
          <ErrorTitle>Invalid Invite</ErrorTitle>
          <ErrorMessage>{error || 'This invite link is invalid or has expired.'}</ErrorMessage>
          <SecondaryButton onClick={handleGoHome}>
            Go Home
          </SecondaryButton>
        </ErrorCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <InviteCard>
        <CrownIcon>
          <Crown size={40} />
        </CrownIcon>

        <InviteTitle>Master Admin Invite</InviteTitle>
        <InviteSubtitle>
          You have been invited to become a Master Admin by {inviteData.invitedBy}
        </InviteSubtitle>

        <PrivilegesSection>
          <PrivilegesTitle>Master Admin Privileges Include:</PrivilegesTitle>
          <PrivilegesList>
            <PrivilegeItem>
              <CheckCircle size={16} />
              Unlimited access to all features
            </PrivilegeItem>
            <PrivilegeItem>
              <CheckCircle size={16} />
              No subscription required
            </PrivilegeItem>
            <PrivilegeItem>
              <CheckCircle size={16} />
              Ability to test all functionality
            </PrivilegeItem>
            <PrivilegeItem>
              <Settings size={16} />
              Access to admin management tools
            </PrivilegeItem>
            <PrivilegeItem>
              <Users size={16} />
              User administration privileges
            </PrivilegeItem>
            <PrivilegeItem>
              <Shield size={16} />
              System administration access
            </PrivilegeItem>
          </PrivilegesList>
        </PrivilegesSection>

        {!user && (
          <SignInPrompt>
            <p><strong>Please sign in with {inviteData.invitedEmail} to accept this invite.</strong></p>
            <ActionButton onClick={handleSignIn}>
              Sign In to Accept
            </ActionButton>
          </SignInPrompt>
        )}

        {user && user.email.toLowerCase() === inviteData.invitedEmail.toLowerCase() && (
          <div>
            <ActionButton
              onClick={handleAcceptInvite}
              disabled={accepting}
            >
              {accepting ? <Clock size={20} /> : <Crown size={20} />}
              {accepting ? 'Accepting Invite...' : 'Accept Master Admin Invite'}
            </ActionButton>
          </div>
        )}

        {user && user.email.toLowerCase() !== inviteData.invitedEmail.toLowerCase() && (
          <WrongEmailWarning>
            <AlertCircle size={16} style={{ marginBottom: '8px' }} />
            <p><strong>Wrong Account</strong></p>
            <p>This invite is for {inviteData.invitedEmail}.</p>
            <p>You are signed in as {user.email}.</p>
            <p>Please sign out and sign in with the correct email address.</p>
          </WrongEmailWarning>
        )}

        <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
          <Clock size={14} style={{ marginRight: '4px' }} />
          This invite expires in 24 hours
        </div>
      </InviteCard>
    </PageContainer>
  );
};

export default AdminInvitePage;