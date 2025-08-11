import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Users, Hash, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.lg};
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  width: 100%;
  max-width: 450px;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const ModalHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const Description = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-top: ${props => props.theme.spacing.sm};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.error ? props.theme.colors.accent.secondary : props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  padding-left: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-family: monospace;
  text-transform: uppercase;
  letter-spacing: 2px;
  width: 100%;
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: ${props => props.error ? props.theme.colors.accent.secondary : props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.error ? props.theme.colors.accent.secondary : props.theme.colors.accent.primary}20;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
    letter-spacing: normal;
    text-transform: none;
    font-family: inherit;
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  left: ${props => props.theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.text.secondary};
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.accent.secondary};
  font-size: 0.85rem;
  margin-top: ${props => props.theme.spacing.xs};
`;

const HelpText = styled.div`
  background: ${props => props.theme.colors.background.tertiary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  margin-top: ${props => props.theme.spacing.sm};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
`;

const Button = styled.button`
  flex: 1;
  background: ${props => props.primary ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)` : 
    props.theme.colors.background.card};
  border: ${props => props.primary ? 'none' : `1px solid ${props.theme.colors.border.primary}`};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.primary ? props.theme.colors.background.primary : props.theme.colors.text.primary};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const JoinPoolModal = ({ onClose, onJoin }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }
    
    if (inviteCode.trim().length < 6) {
      setError('Invalid invite code format');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const errorMessage = await onJoin(inviteCode.trim().toUpperCase(), displayName.trim());
      if (errorMessage) {
        setError(errorMessage);
        setIsSubmitting(false);
      } else {
        toast.success('Successfully joined pool!');
      }
    } catch (error) {
      setError('Failed to join pool');
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setInviteCode(value);
    setError('');
  };

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>
        
        <ModalHeader>
          <Title>
            <Users size={24} />
            Join a Pool
          </Title>
          <Description>
            Enter the invite code shared by the pool creator to join
          </Description>
        </ModalHeader>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              <Hash size={16} />
              Invite Code
            </Label>
            <InputWrapper>
              <IconWrapper>
                <Hash size={18} />
              </IconWrapper>
              <Input
                type="text"
                placeholder="Enter code"
                value={inviteCode}
                onChange={handleCodeChange}
                maxLength={10}
                error={!!error}
                required
                autoFocus
              />
            </InputWrapper>
            {error && (
              <ErrorMessage>
                <AlertCircle size={16} />
                {error}
              </ErrorMessage>
            )}
          </FormGroup>
          
          <FormGroup>
            <Label>Display Name (Optional)</Label>
            <Input
              type="text"
              placeholder="How you'll appear in this pool"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              style={{ 
                paddingLeft: '12px', 
                textAlign: 'left',
                textTransform: 'none',
                letterSpacing: 'normal',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
          </FormGroup>
          
          <HelpText>
            <strong>Tip:</strong> Invite codes are typically 8 characters long and contain only letters and numbers. 
            Ask the pool creator for the code if you don't have it.
          </HelpText>
          
          <ButtonGroup>
            <Button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" primary disabled={isSubmitting || !inviteCode.trim()}>
              {isSubmitting ? 'Joining...' : 'Join Pool'}
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default JoinPoolModal;