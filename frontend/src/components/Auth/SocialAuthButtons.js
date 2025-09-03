import React, { useState } from 'react';
import styled from 'styled-components';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../../config/firebase';
import toast from 'react-hot-toast';
import ProfessionalSpinner from '../UI/ProfessionalSpinner';

const SocialButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  margin: ${props => props.theme.spacing.md} 0;
`;

const SocialButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.background.card};
    border-color: ${props => props.theme.colors.border.primary};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.19 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
  </svg>
);

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: ${props => props.theme.spacing.md} 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${props => props.theme.colors.border.secondary};
  }
  
  span {
    padding: 0 ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.text.muted};
    font-size: 0.9rem;
  }
`;

const SocialAuthButtons = ({ onSuccess, isLoading }) => {
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleGoogleSignIn = async () => {
    setLoadingProvider('google');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Call success callback with user info
      if (onSuccess) {
        onSuccess({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          provider: 'google'
        });
      }
      
      toast.success('Successfully signed in with Google!');
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific error cases with user-friendly messages
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in was cancelled');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with this email address');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Unable to sign in with Google. Please try again.');
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleAppleSignIn = async () => {
    setLoadingProvider('apple');
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const user = result.user;
      
      // Call success callback with user info
      if (onSuccess) {
        onSuccess({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          provider: 'apple'
        });
      }
      
      toast.success('Successfully signed in with Apple!');
      
    } catch (error) {
      console.error('Apple sign-in error:', error);
      
      // Handle specific error cases with user-friendly messages
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in was cancelled');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with this email address');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/configuration-not-found') {
        toast.error('Apple Sign-In is temporarily unavailable. Please use email or Google.');
      } else {
        toast.error('Unable to sign in with Apple. Please try again or use another method.');
      }
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <>
      <SocialButtonsContainer>
        <SocialButton 
          onClick={handleGoogleSignIn}
          disabled={isLoading || loadingProvider !== null}
          type="button"
        >
          {loadingProvider === 'google' ? (
            <ProfessionalSpinner size="small" message="" showMessage={false} inline />
          ) : (
            <GoogleIcon />
          )}
          {loadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google'}
        </SocialButton>
        
        <SocialButton 
          onClick={handleAppleSignIn}
          disabled={isLoading || loadingProvider !== null}
          type="button"
        >
          {loadingProvider === 'apple' ? (
            <ProfessionalSpinner size="small" message="" showMessage={false} inline />
          ) : (
            <AppleIcon />
          )}
          {loadingProvider === 'apple' ? 'Connecting to Apple...' : 'Continue with Apple'}
        </SocialButton>
      </SocialButtonsContainer>
      
      <Divider>
        <span>or</span>
      </Divider>
    </>
  );
};

export default SocialAuthButtons;