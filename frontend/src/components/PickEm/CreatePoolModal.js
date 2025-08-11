import React, { useState } from 'react';
import styled from 'styled-components';
import { X, Trophy, Users, Settings } from 'lucide-react';
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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

const Input = styled.input`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const TextArea = styled.textarea`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const Select = styled.select`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
  }
  
  option {
    background: ${props => props.theme.colors.background.primary};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const SettingsSection = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
`;

const SettingsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  cursor: pointer;
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

const CreatePoolModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    settings: {
      pick_type: 'straight_up',
      include_playoffs: true,
      max_members: 50
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Pool name is required');
      return;
    }
    
    if (formData.name.trim().length < 3) {
      toast.error('Pool name must be at least 3 characters');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onCreate(formData);
      toast.success('Pool created successfully!');
    } catch (error) {
      toast.error('Failed to create pool');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    if (field.startsWith('settings.')) {
      const settingsField = field.replace('settings.', '');
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingsField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <ModalOverlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent>
        <CloseButton onClick={onClose}>
          <X size={20} />
        </CloseButton>
        
        <ModalHeader>
          <Title>
            <Trophy size={24} />
            Create NFL Pick'em Pool
          </Title>
        </ModalHeader>
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>
              <Trophy size={16} />
              Pool Name
            </Label>
            <Input
              type="text"
              placeholder="Enter pool name (e.g., Office NFL Pool 2024)"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              maxLength={100}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Description (Optional)</Label>
            <TextArea
              placeholder="Add a description for your pool..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              maxLength={500}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>
              <Users size={16} />
              Maximum Members
            </Label>
            <Select
              value={formData.settings.max_members}
              onChange={(e) => handleChange('settings.max_members', parseInt(e.target.value))}
            >
              <option value={10}>10 members</option>
              <option value={25}>25 members</option>
              <option value={50}>50 members</option>
              <option value={100}>100 members</option>
              <option value={250}>250 members</option>
            </Select>
          </FormGroup>
          
          <SettingsSection>
            <SettingsHeader>
              <Settings size={16} />
              Pool Settings
            </SettingsHeader>
            
            <FormGroup>
              <Label>Pick Type</Label>
              <Select
                value={formData.settings.pick_type}
                onChange={(e) => handleChange('settings.pick_type', e.target.value)}
              >
                <option value="straight_up">Straight Up (Pick Winner)</option>
                <option value="against_spread">Against the Spread</option>
                <option value="confidence">Confidence Points</option>
              </Select>
            </FormGroup>
            
            <CheckboxGroup>
              <Checkbox
                type="checkbox"
                id="include_playoffs"
                checked={formData.settings.include_playoffs}
                onChange={(e) => handleChange('settings.include_playoffs', e.target.checked)}
              />
              <CheckboxLabel htmlFor="include_playoffs">
                Include NFL Playoffs
              </CheckboxLabel>
            </CheckboxGroup>
          </SettingsSection>
          
          <ButtonGroup>
            <Button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" primary disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Pool'}
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreatePoolModal;