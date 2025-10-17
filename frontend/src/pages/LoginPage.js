import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Brain, Shield, Info, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useRecaptcha } from '../contexts/RecaptchaContext';
import { validateLoginForm } from '../utils/authValidation';
import SocialAuthButtons from '../components/Auth/SocialAuthButtons';
import ProfessionalSpinner from '../components/UI/ProfessionalSpinner';
import ErrorAlert from '../components/UI/ErrorAlert';
import ForgotPasswordModal from '../components/Auth/ForgotPasswordModal';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';
import { httpsCallable, getFunctions } from 'firebase/functions';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.lg};
`;

const LoginCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xxl};
  width: 100%;
  max-width: 400px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const InputGroup = styled.div`
  position: relative;
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.xs};
  display: block;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  padding-left: 2.5rem;
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
    outline: none;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const InputIcon = styled.div`
  position: absolute;
  left: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.muted};
  z-index: 1;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: ${props => props.theme.spacing.sm};
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.muted};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: color 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const LoginButton = styled.button`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary}, ${props => props.theme.colors.accent.primary}dd);
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.background.primary};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  min-height: 50px;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.glow};
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const BiometricButton = styled.button`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  min-height: 50px;
  margin-top: ${props => props.theme.spacing.md};

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
    border-color: ${props => props.theme.colors.accent.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const LinkText = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-top: ${props => props.theme.spacing.lg};
  
  a {
    color: ${props => props.theme.colors.accent.primary};
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.accent.secondary}20;
  border: 1px solid ${props => props.theme.colors.accent.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.secondary};
  font-size: 0.85rem;
  margin-top: ${props => props.theme.spacing.xs};
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const TooltipContainer = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: help;
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.colors.background.tertiary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.secondary};
  white-space: nowrap;
  z-index: 1000;
  opacity: ${props => props.visible ? 1 : 0};
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  transition: opacity 0.2s ease, visibility 0.2s ease;
  margin-bottom: ${props => props.theme.spacing.xs};
  max-width: 250px;
  white-space: normal;
  text-align: center;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: ${props => props.theme.colors.border.primary};
  }
`;

const SecurityWarning = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.8rem;
  margin-top: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs};
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  border-left: 3px solid ${props => props.theme.colors.accent.warning || props.theme.colors.accent.secondary};
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: ${props => props.theme.colors.accent.primary};
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const ForgotPasswordLink = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.accent.primary};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.xs} 0;
  transition: all 0.2s ease;

  &:hover {
    text-decoration: underline;
    color: ${props => props.theme.colors.accent.primary}dd;
  }
`;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithFirebaseEmail, registerWithFirebase, isLoading, error, clearError } = useAuth();
  const { executeRecaptchaAction } = useRecaptcha();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Load saved "Remember Me" preference
  useEffect(() => {
    const savedPreference = localStorage.getItem('prizmbets_remember_preference');
    if (savedPreference === 'true') {
      setFormData(prev => ({ ...prev, rememberMe: true }));
    }
  }, []);

  // Check for biometric availability
  useEffect(() => {
    const checkBiometricSupport = async () => {
      if (window.PublicKeyCredential) {
        const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricAvailable(isAvailable);
      }
    };

    checkBiometricSupport();
  }, []);

  // Get the intended destination from location state, returnUrl, or default to home
  const returnUrl = sessionStorage.getItem('returnUrl');
  const from = location.state?.returnUrl || returnUrl || location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Save "Remember Me" preference
    if (name === 'rememberMe') {
      localStorage.setItem('prizmbets_remember_preference', checked.toString());
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear global auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const validationErrors = validateLoginForm(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSocialAuth = async (userData) => {
    try {
      // Register/login the user with Firebase data
      const result = await registerWithFirebase(userData);

      if (result.success) {
        // Clear returnUrl from sessionStorage if it exists
        if (returnUrl) {
          sessionStorage.removeItem('returnUrl');
        }

        // Show success message for switch user
        if (location.state?.switching) {
          toast.success('Successfully switched accounts!');
        }

        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Social auth error:', err);
      toast.error('Authentication failed. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Execute reCAPTCHA - skip for now to fix login issues
    // const recaptchaToken = await executeRecaptchaAction('login');
    // if (!recaptchaToken) {
    //   toast.error('Security verification failed. Please try again.');
    //   return;
    // }
    
    const result = await loginWithFirebaseEmail(formData.email, formData.password, formData.rememberMe);
    
    if (result.success) {
      // Clear returnUrl from sessionStorage if it exists
      if (returnUrl) {
        sessionStorage.removeItem('returnUrl');
      }

      // Show success message for switch user
      if (location.state?.switching) {
        toast.success('Successfully switched accounts!');
      }

      // Redirect to intended destination
      navigate(from, { replace: true });
    }
    // Error handling is done in the AuthContext and shown via toast
  };

  const handleBiometricSignIn = async () => {
    try {
      // Get credential from the authenticator
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32), // In production, this should be a server-generated challenge
          timeout: 60000,
          userVerification: "required"
        }
      });

      // Convert credential ID to base64 for database query
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));

      // Find user by credential ID
      const usersQuery = query(
        collection(db, 'users'),
        where('biometricCredentialId', '==', credentialId)
      );

      const userSnap = await getDocs(usersQuery);

      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data();
        const userId = userSnap.docs[0].id;

        console.log('Biometric authentication successful for user:', userData.email);

        // Call backend function to get custom token
        const functions = getFunctions();
        const authenticateWithBiometric = httpsCallable(functions, 'authenticate_with_biometric');

        try {
          const result = await authenticateWithBiometric({
            credentialId,
            userId
          });

          if (result.data.success) {
            // Sign in with the custom token
            await signInWithCustomToken(auth, result.data.token);

            toast.success('Biometric authentication successful!');

            // Clear returnUrl from sessionStorage if it exists
            if (returnUrl) {
              sessionStorage.removeItem('returnUrl');
            }

            // Show success message for switch user
            if (location.state?.switching) {
              toast.success('Successfully switched accounts!');
            }

            // Redirect to intended destination
            navigate(from, { replace: true });
          } else {
            throw new Error(result.data.error || 'Authentication failed');
          }
        } catch (backendError) {
          console.error('Backend authentication error:', backendError);
          toast.error('Authentication failed. Please try again.');
        }
      } else {
        toast.error('Biometric credential not found. Please set up biometric authentication in your account settings.');
      }
    } catch (error) {
      console.error('Biometric sign-in error:', error);

      let errorMessage = 'Biometric sign-in failed';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric authentication was cancelled';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication is not supported';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Biometric authentication failed due to security restrictions';
      }

      toast.error(errorMessage);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <Brain size={32} />
          PrizmBets
        </Logo>
        
        <Title>{location.state?.switching ? 'Switch to Different Account' : 'Welcome Back'}</Title>

        {location.state?.switching && (
          <SecurityWarning style={{ marginBottom: '1rem' }}>
            <Info size={14} />
            <span>You've been signed out. Please sign in with a different account.</span>
          </SecurityWarning>
        )}
        
        {/* Add social auth buttons for easier sign-in */}
        <SocialAuthButtons onSuccess={handleSocialAuth} isLoading={isLoading} />
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="email">Email Address</Label>
            <InputWrapper>
              <InputIcon>
                <Mail size={20} />
              </InputIcon>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </InputWrapper>
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="password">Password</Label>
            <InputWrapper>
              <InputIcon>
                <Lock size={20} />
              </InputIcon>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </PasswordToggle>
            </InputWrapper>
            {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
            <ForgotPasswordLink
              type="button"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot your password?
            </ForgotPasswordLink>
          </InputGroup>

          <CheckboxGroup>
            <CheckboxRow>
              <Checkbox
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <CheckboxLabel htmlFor="rememberMe">
                Remember me
                <TooltipContainer
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <Info size={14} style={{ marginLeft: '4px', opacity: 0.7 }} />
                  <Tooltip visible={showTooltip}>
                    Stay signed in even after closing your browser until you sign out.
                  </Tooltip>
                </TooltipContainer>
              </CheckboxLabel>
            </CheckboxRow>

            {formData.rememberMe && (
              <SecurityWarning>
                <Shield size={14} />
                <span>Only use on your personal device. Don't check this on shared or public computers.</span>
              </SecurityWarning>
            )}
          </CheckboxGroup>
          
          {error && (
            <ErrorAlert 
              title="Sign In Error"
              message={error}
              onDismiss={clearError}
              showRetry={true}
              onRetry={() => {
                clearError();
                handleSubmit({ preventDefault: () => {} });
              }}
            />
          )}
          
          <LoginButton type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <ProfessionalSpinner size="small" showMessage={false} inline />
                Signing you in...
              </>
            ) : (
              'Sign In'
            )}
          </LoginButton>

          {biometricAvailable && (
            <BiometricButton
              type="button"
              onClick={handleBiometricSignIn}
              disabled={isLoading}
            >
              <Fingerprint size={20} />
              Sign In with Face ID / Touch ID
            </BiometricButton>
          )}
        </Form>

        <LinkText>
          Don't have an account? <Link to="/register">Sign up here</Link>
        </LinkText>
      </LoginCard>

      {showForgotPassword && (
        <ForgotPasswordModal
          onClose={() => setShowForgotPassword(false)}
          defaultEmail={formData.email}
        />
      )}
    </LoginContainer>
  );
};

export default LoginPage;