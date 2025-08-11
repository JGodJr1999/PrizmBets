import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Save, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { validateName, validatePassword, validatePasswordConfirmation } from '../utils/authValidation';

const ProfileContainer = styled.div`
  min-height: calc(100vh - 80px);
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.lg};
`;

const ProfileContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.background.hover};
  }
`;

const PageTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2rem;
  font-weight: 600;
  margin: 0;
`;

const ProfileCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.shadows.md};
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};
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
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.accent.secondary}20;
  border: 1px solid ${props => props.theme.colors.accent.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.secondary};
  font-size: 0.85rem;
  margin-top: ${props => props.theme.spacing.xs};
`;

const SuccessMessage = styled.div`
  background: ${props => props.theme.colors.betting.positive}20;
  border: 1px solid ${props => props.theme.colors.betting.positive};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.betting.positive};
  font-size: 0.85rem;
  margin-top: ${props => props.theme.spacing.xs};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
  flex-wrap: wrap;
`;

const Button = styled.button`
  background: ${props => props.primary ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)` :
    'transparent'
  };
  border: 1px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  color: ${props => props.primary ? 
    props.theme.colors.background.primary : 
    props.theme.colors.accent.primary
  };
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
    background: ${props => props.primary ?
      props.theme.colors.accent.primary :
      `${props.theme.colors.accent.primary}10`
    };
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const InfoText = styled.p`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.85rem;
  margin-top: ${props => props.theme.spacing.xs};
  line-height: 1.4;
`;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, isLoading } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});
  const [localLoading, setLocalLoading] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear success message
    if (success.profile) {
      setSuccess(prev => ({
        ...prev,
        profile: ''
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear success message
    if (success.password) {
      setSuccess(prev => ({
        ...prev,
        password: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateProfileForm = () => {
    const newErrors = {};
    
    const nameErrors = validateName(profileData.name);
    if (nameErrors.length > 0) {
      newErrors.name = nameErrors[0];
    }
    
    return newErrors;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    const passwordErrors = validatePassword(passwordData.newPassword);
    if (passwordErrors.length > 0) {
      newErrors.newPassword = passwordErrors[0];
    }
    
    const confirmErrors = validatePasswordConfirmation(passwordData.newPassword, passwordData.confirmPassword);
    if (confirmErrors.length > 0) {
      newErrors.confirmPassword = confirmErrors[0];
    }
    
    return newErrors;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateProfileForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLocalLoading(prev => ({ ...prev, profile: true }));
    
    const result = await updateProfile(profileData);
    
    if (result.success) {
      setSuccess(prev => ({ ...prev, profile: 'Profile updated successfully!' }));
      setErrors(prev => ({ ...prev, name: '', email: '' }));
    } else {
      setErrors(prev => ({ ...prev, profile: result.error }));
    }
    
    setLocalLoading(prev => ({ ...prev, profile: false }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validatePasswordForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLocalLoading(prev => ({ ...prev, password: true }));
    
    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    
    if (result.success) {
      setSuccess(prev => ({ ...prev, password: 'Password changed successfully!' }));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } else {
      setErrors(prev => ({ ...prev, password: result.error }));
    }
    
    setLocalLoading(prev => ({ ...prev, password: false }));
  };

  return (
    <ProfileContainer>
      <ProfileContent>
        <Header>
          <BackButton onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </BackButton>
          <PageTitle>Profile Settings</PageTitle>
        </Header>

        {/* Profile Information */}
        <ProfileCard>
          <SectionTitle>Profile Information</SectionTitle>
          <Form onSubmit={handleProfileSubmit}>
            <InputGroup>
              <Label htmlFor="name">Full Name</Label>
              <InputWrapper>
                <InputIcon>
                  <User size={20} />
                </InputIcon>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  autoComplete="name"
                />
              </InputWrapper>
              {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
              {success.profile && <SuccessMessage>{success.profile}</SuccessMessage>}
            </InputGroup>

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
                  value={profileData.email}
                  onChange={handleProfileChange}
                  autoComplete="email"
                  disabled
                />
              </InputWrapper>
              <InfoText>
                Email changes are not currently supported. Contact support if you need to change your email address.
              </InfoText>
            </InputGroup>

            <ButtonGroup>
              <Button 
                type="submit" 
                primary 
                disabled={isLoading || localLoading.profile}
              >
                <Save size={16} />
                {localLoading.profile ? 'Saving...' : 'Save Changes'}
              </Button>
            </ButtonGroup>
          </Form>
        </ProfileCard>

        {/* Change Password */}
        <ProfileCard>
          <SectionTitle>Change Password</SectionTitle>
          <Form onSubmit={handlePasswordSubmit}>
            <InputGroup>
              <Label htmlFor="currentPassword">Current Password</Label>
              <InputWrapper>
                <InputIcon>
                  <Lock size={20} />
                </InputIcon>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  placeholder="Enter your current password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                />
                <PasswordToggle
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </PasswordToggle>
              </InputWrapper>
              {errors.currentPassword && <ErrorMessage>{errors.currentPassword}</ErrorMessage>}
            </InputGroup>

            <InputGroup>
              <Label htmlFor="newPassword">New Password</Label>
              <InputWrapper>
                <InputIcon>
                  <Lock size={20} />
                </InputIcon>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                />
                <PasswordToggle
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </PasswordToggle>
              </InputWrapper>
              {errors.newPassword && <ErrorMessage>{errors.newPassword}</ErrorMessage>}
            </InputGroup>

            <InputGroup>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <InputWrapper>
                <InputIcon>
                  <Lock size={20} />
                </InputIcon>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                />
                <PasswordToggle
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </PasswordToggle>
              </InputWrapper>
              {errors.confirmPassword && <ErrorMessage>{errors.confirmPassword}</ErrorMessage>}
              {success.password && <SuccessMessage>{success.password}</SuccessMessage>}
              {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
            </InputGroup>

            <ButtonGroup>
              <Button 
                type="submit" 
                primary 
                disabled={isLoading || localLoading.password}
              >
                <Lock size={16} />
                {localLoading.password ? 'Changing...' : 'Change Password'}
              </Button>
            </ButtonGroup>
          </Form>
        </ProfileCard>
      </ProfileContent>
    </ProfileContainer>
  );
};

export default ProfilePage;