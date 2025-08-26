import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Mail, Gift, TrendingUp, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.lg};
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  max-width: 500px;
  width: 100%;
  position: relative;
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.xl};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      ${props => props.theme.colors.accent.primary}08 0%, 
      transparent 50%,
      ${props => props.theme.colors.accent.primary}08 100%
    );
    pointer-events: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  z-index: 1;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.background.hover};
  }
`;

const ModalBody = styled.div`
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.xl};
  text-align: center;
  position: relative;
  z-index: 1;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.lg};
  }
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.accent.primary};
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.md};
  line-height: 1.3;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 ${props => props.theme.spacing.xl} 0;
  text-align: left;
`;

const BenefitItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: 0.9rem;
  
  svg {
    color: ${props => props.theme.colors.accent.primary};
    flex-shrink: 0;
  }
`;

const EmailForm = styled.form`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const EmailInput = styled.input`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
  }
`;

const SubmitButton = styled.button`
  background: ${props => props.theme.colors.gradient.primary};
  color: ${props => props.theme.colors.background.primary};
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Disclaimer = styled.p`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.muted};
  line-height: 1.4;
  
  a {
    color: ${props => props.theme.colors.accent.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const EmailCaptureModal = ({ isOpen, onClose, source = 'modal' }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Create the email capture endpoint call
      const response = await fetch('/api/email/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast.success('🎉 Welcome to PrizmBets! Check your email for exclusive tips.');
        setEmail('');
        onClose();
        
        // Track successful signup for analytics
        if (window.gtag) {
          window.gtag('event', 'email_signup', {
            event_category: 'engagement',
            event_label: source
          });
        }
      } else {
        throw new Error('Signup failed');
      }
    } catch (error) {
      console.error('Email capture error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>
        
        <ModalBody>
          <IconContainer>
            <Gift size={28} />
            <Star size={20} />
            <TrendingUp size={24} />
          </IconContainer>
          
          <Title>Get Exclusive Betting Insights</Title>
          
          <Subtitle>
            Join 1,000+ smart bettors receiving our AI-powered picks, odds alerts, and profit-boosting strategies.
          </Subtitle>
          
          <BenefitsList>
            <BenefitItem>
              <Star size={16} />
              Weekly AI-generated betting insights
            </BenefitItem>
            <BenefitItem>
              <TrendingUp size={16} />
              Live odds movement alerts
            </BenefitItem>
            <BenefitItem>
              <Gift size={16} />
              Exclusive welcome bonus strategies
            </BenefitItem>
            <BenefitItem>
              <Mail size={16} />
              Early access to new features
            </BenefitItem>
          </BenefitsList>
          
          <EmailForm onSubmit={handleSubmit}>
            <EmailInput
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <SubmitButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Joining...' : 'Get Insights'}
            </SubmitButton>
          </EmailForm>
          
          <Disclaimer>
            By signing up, you agree to our <a href="/privacy">Privacy Policy</a> and 
            consent to receive emails from PrizmBets. Unsubscribe anytime. 
            Must be 21+ to receive betting content.
          </Disclaimer>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EmailCaptureModal;