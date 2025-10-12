import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Camera, Save, User, Mail, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '../../services/settingsService';

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.primary};
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: ${props => props.theme.colors.accent.primary}20;
  border: 3px solid ${props => props.theme.colors.accent.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.accent.primary};
  font-size: 2rem;
  font-weight: 700;
  position: relative;
  overflow: hidden;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
  color: white;
  
  ${Avatar}:hover & {
    opacity: 1;
  }
`;

const AvatarInfo = styled.div`
  flex: 1;
`;

const AvatarName = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const AvatarEmail = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ChangeAvatarButton = styled.button`
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: background-color 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.accent.primary}DD;
  }
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SaveButton = styled.button`
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  transition: all 0.3s ease;
  grid-column: 1 / -1;
  max-width: 200px;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.accent.primary}DD;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ProfileSettings = ({ user }) => {
  console.log('=== ProfileSettings component rendering ===');
  console.log('User prop:', user);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || user?.name || '',
    email: user?.email || '',
    location: user?.location || '',
    joinedDate: user?.createdAt || user?.joinedDate || new Date().toLocaleDateString(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Load existing settings on component mount
  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('User in useEffect:', user);

    const loadSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const profileSettings = user?.uid ?
          await settingsService.getUserSettingsForUser(user.uid).then(settings => settings.profile) :
          await settingsService.getSettingsSection('profile');

        // Update form data with saved settings, fallback to user data if available
        setFormData(prevData => ({
          displayName: profileSettings.displayName || user?.displayName || user?.name || '',
          email: user?.email || '', // Email should come from auth, not settings
          location: profileSettings.location || user?.location || '',
          joinedDate: user?.createdAt || user?.joinedDate || new Date().toLocaleDateString(),
        }));
      } catch (error) {
        console.error('Failed to load profile settings:', error);
        toast.error('Failed to load saved settings');
      } finally {
        setIsLoadingSettings(false);
      }
    };

    if (user) {
      loadSettings();
    } else {
      setIsLoadingSettings(false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('Starting profile save process...');
    console.log('Current user from props:', user);

    try {
      // Prepare profile data for saving
      const profileData = {
        displayName: formData.displayName.trim(),
        location: formData.location.trim(),
        lastUpdated: new Date().toISOString()
      };

      console.log('Profile data to save:', profileData);

      // Save to Firestore using the settings service with user ID
      await settingsService.updateProfileSettings(profileData, user?.uid);

      toast.success('Profile updated successfully!');
      console.log('Profile settings saved successfully:', profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Error details:', error.message);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = () => {
    // TODO: Implement avatar upload
    toast.success('Avatar upload feature coming soon!');
  };

  const getInitials = (name) => {
    if (!name) return 'PB';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoadingSettings) {
    return (
      <ProfileContainer>
        <SectionTitle>
          <User size={24} />
          Profile Information
        </SectionTitle>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          color: '#666'
        }}>
          Loading settings...
        </div>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <SectionTitle>
        <User size={24} />
        Profile Information
      </SectionTitle>

      <AvatarSection>
        <Avatar onClick={handleAvatarChange}>
          {user?.avatar ? (
            <AvatarImage src={user.avatar} alt="Profile" />
          ) : (
            getInitials(formData.displayName)
          )}
          <AvatarOverlay>
            <Camera size={24} />
          </AvatarOverlay>
        </Avatar>

        <AvatarInfo>
          <AvatarName>{formData.displayName || 'User'}</AvatarName>
          <AvatarEmail>{formData.email}</AvatarEmail>
          <ChangeAvatarButton onClick={handleAvatarChange} type="button">
            <Camera size={16} />
            Change Photo
          </ChangeAvatarButton>
        </AvatarInfo>
      </AvatarSection>

      <Form onSubmit={handleSaveProfile}>
        <InputGroup>
          <Label>
            <User size={16} />
            Display Name
          </Label>
          <InputWrapper>
            <Input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="Enter your display name"
            />
          </InputWrapper>
        </InputGroup>

        <InputGroup>
          <Label>
            <Mail size={16} />
            Email Address
          </Label>
          <InputWrapper>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              disabled
            />
          </InputWrapper>
        </InputGroup>

        <InputGroup>
          <Label>
            <MapPin size={16} />
            Location
          </Label>
          <InputWrapper>
            <Input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter your location (optional)"
            />
          </InputWrapper>
        </InputGroup>

        <InputGroup>
          <Label>
            <Calendar size={16} />
            Member Since
          </Label>
          <InputWrapper>
            <Input
              type="text"
              name="joinedDate"
              value={formData.joinedDate}
              disabled
            />
          </InputWrapper>
        </InputGroup>

        <SaveButton type="submit" disabled={isLoading}>
          <Save size={16} />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </SaveButton>
      </Form>
    </ProfileContainer>
  );
};

export default ProfileSettings;