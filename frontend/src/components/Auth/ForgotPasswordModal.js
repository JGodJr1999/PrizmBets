import React, { useState } from 'react';
import styled from 'styled-components';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { X, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import ProfessionalSpinner from '../UI/ProfessionalSpinner';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: ${props => props.theme.spacing.lg};
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xxl};
  width: 100%;
  max-width: 400px;
  position: relative;
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.muted};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.background.secondary};
  }
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
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

const SubmitButton = styled.button`
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

const CloseOnlyButton = styled.button`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.background.tertiary};
    border-color: ${props => props.theme.colors.border.primary};
  }
`;

const SuccessMessage = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SuccessIcon = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.accent.success || props.theme.colors.accent.primary};
`;

const ForgotPasswordModal = ({ onClose, defaultEmail = '' }) => {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting to send password reset email to:', email.trim());
      console.log('Firebase auth domain:', auth.config.authDomain);

      await sendPasswordResetEmail(auth, email.trim());

      console.log('Password reset email sent successfully');
      setEmailSent(true);
      toast.success('Password reset email sent! Check your inbox and spam folder.');
    } catch (error) {
      console.error('Password reset error details:', {
        code: error.code,
        message: error.message,
        email: email.trim(),
        authDomain: auth.config.authDomain
      });

      let errorMessage = 'Failed to send reset email';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Check your connection and try again';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'Domain not authorized. Contact support';
          break;
        default:
          errorMessage = `Failed to send reset email: ${error.code || 'Unknown error'}`;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>

        {!emailSent ? (
          <>
            <Title>Reset Your Password</Title>
            <Form onSubmit={handleSendResetEmail}>
              <InputWrapper>
                <InputIcon>
                  <Mail size={20} />
                </InputIcon>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  autoFocus
                />
              </InputWrapper>

              <SubmitButton type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <ProfessionalSpinner size="small" showMessage={false} inline />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </SubmitButton>
            </Form>
          </>
        ) : (
          <>
            <SuccessIcon>
              <CheckCircle size={48} />
            </SuccessIcon>
            <Title>Check Your Email</Title>
            <SuccessMessage>
              We've sent a password reset link to <strong>{email}</strong>
              <br /><br />
              Click the link in the email to reset your password.
              If you don't see it, check your spam folder.
            </SuccessMessage>
            <CloseOnlyButton onClick={onClose}>
              Close
            </CloseOnlyButton>
          </>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default ForgotPasswordModal;