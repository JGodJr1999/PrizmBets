import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Camera, Save, User, Mail, Calendar, MapPin, Upload, Trash2, UserSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '../../services/settingsService';
import { storage, db, auth } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

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

const Section = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SectionHeader = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

// Profile Picture Section
const ProfilePictureSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${props => props.theme.colors.accent.primary}20;
  border: 3px solid ${props => props.theme.colors.accent.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.accent.primary};
  font-size: 2.5rem;
  font-weight: 700;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
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

const ProfilePictureButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
`;

const Button = styled.button`
  background: ${props => props.danger ? '#ff6b6b' : props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background: ${props => props.danger ? '#ff5252' : props.theme.colors.accent.primary}DD;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

// Form Section
const Form = styled.form`
  display: flex;
  flex-direction: column;
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

const HelperText = styled.p`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.8rem;
  margin-top: ${props => props.theme.spacing.xs};
  line-height: 1.4;
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

const LoadingText = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const UploadProgress = styled.div`
  width: 100%;
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  height: 8px;
  margin-top: ${props => props.theme.spacing.sm};
  overflow: hidden;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: ${props => props.theme.colors.accent.primary};
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const ProfileSettings = ({ user }) => {
  const { updateUser } = useAuth();
  const [formData, setFormData] = useState({
    displayName: '',
    fullName: '',
    email: user?.email || '',
    location: '',
    joinedDate: user?.createdAt || user?.joinedDate || new Date().toLocaleDateString(),
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profilePicture, setProfilePicture] = useState(null);

  const fileInputRef = useRef(null);

  // Load existing settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const profileSettings = user?.uid ?
          await settingsService.getUserSettingsForUser(user.uid).then(settings => settings.profile) :
          await settingsService.getSettingsSection('profile');

        // Update form data with saved settings, fallback to user data if available
        setFormData(prevData => ({
          displayName: profileSettings.displayName || user?.displayName || '',
          fullName: profileSettings.fullName || user?.fullName || '',
          email: user?.email || '',
          location: profileSettings.location || user?.location || '',
          joinedDate: user?.createdAt || user?.joinedDate || new Date().toLocaleDateString(),
        }));

        // Set profile picture from user data
        setProfilePicture(user?.photoURL || profileSettings.photoURL || null);
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

  const handleProfilePictureUpload = async (file) => {
    if (!file || !user?.uid) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WEBP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create storage reference
      const storageRef = ref(storage, `profilePictures/${user.uid}/avatar.jpg`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      setUploadProgress(50);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      setUploadProgress(75);

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: downloadURL
      });

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });

      setUploadProgress(100);
      setProfilePicture(downloadURL);

      toast.success('Profile picture updated successfully!');
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast.error('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!user?.uid || !profilePicture) return;

    try {
      setIsUploading(true);

      // Delete from Firebase Storage
      try {
        const storageRef = ref(storage, `profilePictures/${user.uid}/avatar.jpg`);
        await deleteObject(storageRef);
      } catch (error) {
        // File might not exist, continue with removing from database
        console.warn('File not found in storage:', error);
      }

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: null
      });

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        photoURL: null
      });

      setProfilePicture(null);
      toast.success('Profile picture removed successfully!');
    } catch (error) {
      console.error('Remove profile picture error:', error);
      toast.error('Failed to remove profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleProfilePictureUpload(file);
    }
  };

  const handleSaveDisplayName = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newDisplayName = formData.displayName.trim();

      // Update only displayName in Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: newDisplayName
      });

      // Update Firebase Auth profile with display name
      if (newDisplayName) {
        await updateProfile(auth.currentUser, {
          displayName: newDisplayName
        });
      }

      // Update local user state immediately so header updates
      updateUser({
        displayName: newDisplayName,
        name: newDisplayName // For backward compatibility
      });

      toast.success('Display name updated successfully!');
    } catch (error) {
      console.error('Error updating display name:', error);
      toast.error('Failed to update display name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFullName = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update only fullName in Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: formData.fullName.trim()
      });

      toast.success('Full name updated successfully!');
    } catch (error) {
      console.error('Error updating full name:', error);
      toast.error('Failed to update full name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOtherSettings = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare profile data for saving (excluding displayName and fullName)
      const profileData = {
        location: formData.location.trim(),
        lastUpdated: new Date().toISOString()
      };

      // Save to Firestore using the settings service with user ID
      await settingsService.updateProfileSettings(profileData, user?.uid);

      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
        <LoadingText>Loading settings...</LoadingText>
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <SectionTitle>
        <User size={24} />
        Profile Information
      </SectionTitle>

      {/* Profile Picture Section */}
      <Section>
        <SectionHeader>
          <Camera size={20} />
          Profile Picture
        </SectionHeader>
        <ProfilePictureSection>
          <Avatar onClick={() => fileInputRef.current?.click()}>
            {profilePicture ? (
              <AvatarImage src={profilePicture} alt="Profile" />
            ) : (
              getInitials(formData.displayName || formData.fullName)
            )}
            <AvatarOverlay>
              <Camera size={24} />
            </AvatarOverlay>
          </Avatar>

          {isUploading && (
            <div style={{ width: '200px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                Uploading... {uploadProgress}%
              </div>
              <UploadProgress>
                <ProgressBar progress={uploadProgress} />
              </UploadProgress>
            </div>
          )}

          <ProfilePictureButtons>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload size={16} />
              Upload Picture
            </Button>
            {profilePicture && (
              <Button
                danger
                onClick={handleRemoveProfilePicture}
                disabled={isUploading}
              >
                <Trash2 size={16} />
                Remove Picture
              </Button>
            )}
          </ProfilePictureButtons>

          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileSelect}
          />
        </ProfilePictureSection>
      </Section>

      {/* Display Name Section */}
      <Section>
        <SectionHeader>
          <UserSquare size={20} />
          Display Name
        </SectionHeader>
        <Form onSubmit={handleSaveDisplayName}>
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
                placeholder="Your public username"
              />
            </InputWrapper>
            <HelperText>
              This is how other users will see you. Example: BetMaster2024, JohnD
            </HelperText>
          </InputGroup>
          <SaveButton type="submit" disabled={isLoading}>
            <Save size={16} />
            {isLoading ? 'Saving...' : 'Save Display Name'}
          </SaveButton>
        </Form>
      </Section>

      {/* Full Name Section */}
      <Section>
        <SectionHeader>
          <User size={20} />
          Full Name
        </SectionHeader>
        <Form onSubmit={handleSaveFullName}>
          <InputGroup>
            <Label>
              <User size={16} />
              Full Name
            </Label>
            <InputWrapper>
              <Input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Your full legal name"
              />
            </InputWrapper>
            <HelperText>
              Your legal name for account verification (not displayed publicly)
            </HelperText>
          </InputGroup>
          <SaveButton type="submit" disabled={isLoading}>
            <Save size={16} />
            {isLoading ? 'Saving...' : 'Save Full Name'}
          </SaveButton>
        </Form>
      </Section>

      {/* Other Settings Section */}
      <Section>
        <SectionHeader>
          <Mail size={20} />
          Additional Information
        </SectionHeader>
        <Form onSubmit={handleSaveOtherSettings}>
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
            {isLoading ? 'Saving...' : 'Save Additional Settings'}
          </SaveButton>
        </Form>
      </Section>
    </ProfileContainer>
  );
};

export default ProfileSettings;