import React, { useState } from 'react';
import styled from 'styled-components';
import { AlertTriangle, Shield, CheckCircle, X, Mail, Lock, Trash2, Eye } from 'lucide-react';

const ConsentModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md};
    align-items: flex-start;
    padding-top: 2rem;
  }
`;

const ConsentContainer = styled.div`
  background: ${props => props.theme.colors.background.primary};
  border: 2px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg};
    max-height: 95vh;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: 4px;
  border-radius: ${props => props.theme.borderRadius.sm};
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.background.hover};
  }
`;

const ConsentHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ConsentTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ConsentSubtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.5;
`;

const LegalText = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const FeatureExplanation = styled.div`
  background: rgba(0, 212, 170, 0.1);
  border: 1px solid rgba(0, 212, 170, 0.3);
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ExplanationTitle = styled.h3`
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const ExplanationText = styled.p`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: ${props => props.theme.spacing.md};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ConsentList = styled.ul`
  list-style: none;
  padding: 0;
  margin: ${props => props.theme.spacing.lg} 0;
`;

const ConsentItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: ${props => props.theme.spacing.md};
  
  svg {
    margin-top: 2px;
    flex-shrink: 0;
  }
`;

const WarningBox = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.lg} 0;
`;

const WarningTitle = styled.h3`
  color: #ef4444;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const WarningText = styled.p`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
`;

const CheckboxGroup = styled.div`
  margin: ${props => props.theme.spacing.xl} 0;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.sm};
  cursor: pointer;
  margin-bottom: ${props => props.theme.spacing.lg};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: ${props => props.theme.colors.accent.primary};
`;

const CheckboxLabel = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.95rem;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const CancelButton = styled.button`
  flex: 1;
  background: none;
  border: 2px solid ${props => props.theme.colors.border.primary};
  color: ${props => props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.border.secondary};
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.background.hover};
  }
`;

const EnableButton = styled.button`
  flex: 2;
  background: ${props => props.disabled ? props.theme.colors.background.card : props.theme.colors.accent.primary};
  border: 2px solid ${props => props.disabled ? props.theme.colors.border.primary : props.theme.colors.accent.primary};
  color: ${props => props.disabled ? props.theme.colors.text.muted : props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.accent.primaryHover};
    border-color: ${props => props.theme.colors.accent.primaryHover};
  }
`;

const Timestamp = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.8rem;
  margin-top: ${props => props.theme.spacing.md};
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border.primary};
`;

const EmailParserConsent = ({ isOpen, onClose, onEnable }) => {
  const [agreed, setAgreed] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);

  if (!isOpen) return null;

  const canEnable = agreed && understood && privacyAcknowledged;

  const handleEnable = () => {
    if (canEnable) {
      onEnable();
    }
  };

  return (
    <ConsentModal onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ConsentContainer>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>
        
        <ConsentHeader>
          <ConsentTitle>
            <Mail size={24} />
            Email Bet Tracking - Consent Required
          </ConsentTitle>
          <ConsentSubtitle>
            Before enabling automatic bet tracking, please review and consent to our data processing.
          </ConsentSubtitle>
        </ConsentHeader>

        <FeatureExplanation>
          <ExplanationTitle>
            <Shield size={16} />
            How Email Parsing Works
          </ExplanationTitle>
          <ExplanationText>
            When you place a bet on DraftKings, FanDuel, or other sportsbooks, they email you a confirmation. 
            You can forward these emails to us, and we'll automatically extract your bet details for tracking.
          </ExplanationText>
          <ExplanationText>
            <strong>Example:</strong> Forward your DraftKings confirmation to <code>bets@prizmbets.app</code> 
            and we'll add it to your dashboard instantly.
          </ExplanationText>
        </FeatureExplanation>

        <LegalText>
          <h3>By enabling email bet tracking, you understand and agree that:</h3>
          
          <ConsentList>
            <ConsentItem>
              <CheckCircle size={16} color="#00d4aa" />
              <span>You are <strong>voluntarily</strong> forwarding your bet confirmation emails to us</span>
            </ConsentItem>
            
            <ConsentItem>
              <Eye size={16} color="#00d4aa" />
              <span>We will extract <strong>ONLY</strong>: teams, odds, stake, bet type, and timestamp</span>
            </ConsentItem>
            
            <ConsentItem>
              <Shield size={16} color="#00d4aa" />
              <span>We will <strong>NEVER</strong> store: personal info, account numbers, or payment data</span>
            </ConsentItem>
            
            <ConsentItem>
              <Trash2 size={16} color="#00d4aa" />
              <span>Emails are processed and <strong>immediately deleted</strong> (not stored on our servers)</span>
            </ConsentItem>
            
            <ConsentItem>
              <Lock size={16} color="#00d4aa" />
              <span>Extracted bet data is <strong>encrypted</strong> and stored securely</span>
            </ConsentItem>
            
            <ConsentItem>
              <X size={16} color="#00d4aa" />
              <span>You can <strong>disable this feature at any time</strong> in your settings</span>
            </ConsentItem>
            
            <ConsentItem>
              <AlertTriangle size={16} color="#00d4aa" />
              <span>This data is used <strong>solely for your personal betting analytics</strong></span>
            </ConsentItem>
          </ConsentList>
        </LegalText>

        <WarningBox>
          <WarningTitle>
            <AlertTriangle size={16} />
            IMPORTANT LEGAL DISCLAIMERS
          </WarningTitle>
          <WarningText>
            <strong>PrizmBets is an independent analytics platform.</strong> We are not affiliated with any sportsbook. 
            We provide data analysis only, not betting advice. We are not responsible for your betting decisions 
            or outcomes. This feature is optional and provided for your convenience.
          </WarningText>
        </WarningBox>

        <CheckboxGroup>
          <CheckboxItem>
            <Checkbox 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <CheckboxLabel>
              <strong>I agree</strong> to the email processing terms above and consent to PrizmBets parsing my forwarded bet confirmations
            </CheckboxLabel>
          </CheckboxItem>
          
          <CheckboxItem>
            <Checkbox
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
            />
            <CheckboxLabel>
              <strong>I understand</strong> that PrizmBets is not a sportsbook and provides analytics only, not betting advice
            </CheckboxLabel>
          </CheckboxItem>

          <CheckboxItem>
            <Checkbox
              checked={privacyAcknowledged}
              onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
            />
            <CheckboxLabel>
              <strong>I acknowledge</strong> that I can revoke this consent at any time and that my emails will be immediately deleted after processing
            </CheckboxLabel>
          </CheckboxItem>
        </CheckboxGroup>

        <ButtonGroup>
          <CancelButton onClick={onClose}>
            No Thanks
          </CancelButton>
          
          <EnableButton 
            disabled={!canEnable}
            onClick={handleEnable}
          >
            Enable Email Tracking
          </EnableButton>
        </ButtonGroup>

        <Timestamp>
          Consent will be recorded: {new Date().toLocaleString()}
        </Timestamp>
      </ConsentContainer>
    </ConsentModal>
  );
};

export default EmailParserConsent;