import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Shield, Lock, Eye, EyeOff, Smartphone, Key, AlertTriangle, Check, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '../../services/settingsService';
import { db } from '../../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const SecurityContainer = styled.div`
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

const SecurityCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
`;

const CardTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const CardDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.95rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  line-height: 1.6;
`;

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

const InputWrapper = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  padding-right: ${props => props.showToggle ? '3rem' : props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.accent.primary}20;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: ${props => props.theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.muted};
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const PasswordStrength = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.xs};
  font-size: 0.85rem;
`;

const StrengthBar = styled.div`
  flex: 1;
  height: 4px;
  background: ${props => props.theme.colors.border.primary};
  border-radius: 2px;
  overflow: hidden;
`;

const StrengthProgress = styled.div`
  height: 100%;
  width: ${props => props.strength * 25}%;
  background: ${props => {
    if (props.strength <= 1) return '#ff4444';
    if (props.strength <= 2) return '#ff8800';
    if (props.strength <= 3) return '#ffaa00';
    return '#00d4aa';
  }};
  transition: all 0.3s ease;
`;

const StrengthText = styled.span`
  color: ${props => {
    if (props.strength <= 1) return '#ff4444';
    if (props.strength <= 2) return '#ff8800';
    if (props.strength <= 3) return '#ffaa00';
    return '#00d4aa';
  }};
  font-weight: 600;
  min-width: 60px;
`;

const Button = styled.button`
  background: ${props => props.variant === 'danger' ? 
    props.theme.colors.betting.negative : 
    props.theme.colors.accent.primary
  };
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
  
  &:hover:not(:disabled) {
    background: ${props => props.variant === 'danger' ? 
      `${props.theme.colors.betting.negative}DD` : 
      `${props.theme.colors.accent.primary}DD`
    };
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const TwoFactorSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.enabled ? 
    `${props.theme.colors.accent.primary}20` : 
    `${props.theme.colors.text.muted}10`
  };
  border: 1px solid ${props => props.enabled ? 
    props.theme.colors.accent.primary : 
    props.theme.colors.border.primary
  };
  border-radius: ${props => props.theme.borderRadius.md};
`;

const TwoFactorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const StatusIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.enabled ? 
    props.theme.colors.accent.primary : 
    props.theme.colors.text.muted
  };
  color: ${props => props.theme.colors.background.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TwoFactorText = styled.div`
  h4 {
    color: ${props => props.theme.colors.text.primary};
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: ${props => props.theme.spacing.xs};
  }
  
  p {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.9rem;
    margin: 0;
  }
`;

const SecuritySettings = ({ user }) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  // Load existing security settings on component mount
  useEffect(() => {
    const loadSecuritySettings = async () => {
      try {
        setIsLoadingSettings(true);
        const savedSettings = await settingsService.getSettingsSection('security');

        if (savedSettings) {
          setTwoFactorEnabled(savedSettings.twoFactorEnabled || false);
        }

        // Load biometric settings from user document
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          setBiometricEnabled(userData?.biometricEnabled || false);
        }
      } catch (error) {
        console.error('Failed to load security settings:', error);
        toast.error('Failed to load security settings');
      } finally {
        setIsLoadingSettings(false);
      }
    };

    if (user) {
      loadSecuritySettings();
    } else {
      setIsLoadingSettings(false);
    }
  }, [user]);

  // Check biometric support on component mount
  useEffect(() => {
    const checkBiometricSupport = async () => {
      const isSupported = window.PublicKeyCredential &&
        await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setBiometricSupported(isSupported);
    };

    checkBiometricSupport();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    return Math.min(strength, 4);
  };

  const getStrengthText = (strength) => {
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength <= 3) return 'Good';
    return 'Strong';
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (getPasswordStrength(passwordForm.newPassword) < 3) {
      toast.error('Please choose a stronger password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // TODO: Implement API call to change password
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      const newTwoFactorEnabled = !twoFactorEnabled;

      // Save to Firestore
      await settingsService.updateSecuritySettings({
        twoFactorEnabled: newTwoFactorEnabled,
        lastPasswordChange: new Date().toISOString()
      });

      setTwoFactorEnabled(newTwoFactorEnabled);
      toast.success(twoFactorEnabled ?
        'Two-factor authentication disabled' :
        'Two-factor authentication enabled'
      );
      console.log('Security settings saved:', { twoFactorEnabled: newTwoFactorEnabled });
    } catch (error) {
      console.error('Error saving security settings:', error);
      toast.error('Failed to update two-factor authentication');
    }
  };

  const handleBiometricToggle = async () => {
    if (!biometricSupported) {
      toast.error('Biometric authentication is not supported on this device');
      return;
    }

    try {
      if (!biometricEnabled) {
        // Enable biometric authentication
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: {
              name: "PrizmBets",
              id: window.location.hostname
            },
            user: {
              id: new TextEncoder().encode(user.uid),
              name: user.email,
              displayName: user.displayName || user.email
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required"
            },
            timeout: 60000
          }
        });

        // Save credential ID to user document
        await updateDoc(doc(db, 'users', user.uid), {
          biometricEnabled: true,
          biometricCredentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          biometricEnabledAt: new Date().toISOString()
        });

        setBiometricEnabled(true);
        toast.success('Biometric authentication enabled!');
      } else {
        // Disable biometric authentication
        await updateDoc(doc(db, 'users', user.uid), {
          biometricEnabled: false,
          biometricCredentialId: null,
          biometricDisabledAt: new Date().toISOString()
        });

        setBiometricEnabled(false);
        toast.success('Biometric authentication disabled');
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);

      let errorMessage = 'Failed to update biometric authentication';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Biometric authentication was cancelled or not allowed';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Biometric authentication is not supported on this device';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Biometric authentication failed due to security restrictions';
      }

      toast.error(errorMessage);
    }
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  if (isLoadingSettings) {
    return (
      <SecurityContainer>
        <SectionTitle>
          <Shield size={24} />
          Security Settings
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
      </SecurityContainer>
    );
  }

  return (
    <SecurityContainer>
      <SectionTitle>
        <Shield size={24} />
        Security Settings
      </SectionTitle>

      <SecurityCard>
        <CardTitle>
          <Lock size={20} />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure. Choose a strong password that you haven't used elsewhere.
        </CardDescription>

        <Form onSubmit={handlePasswordChange}>
          <InputGroup>
            <Label>
              <Key size={16} />
              Current Password
            </Label>
            <InputWrapper>
              <Input
                type={showPasswords.current ? 'text' : 'password'}
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handleInputChange}
                placeholder="Enter your current password"
                showToggle
                required
              />
              <ToggleButton
                type="button"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </ToggleButton>
            </InputWrapper>
          </InputGroup>

          <InputGroup>
            <Label>
              <Key size={16} />
              New Password
            </Label>
            <InputWrapper>
              <Input
                type={showPasswords.new ? 'text' : 'password'}
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handleInputChange}
                placeholder="Enter your new password"
                showToggle
                required
              />
              <ToggleButton
                type="button"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </ToggleButton>
            </InputWrapper>
            {passwordForm.newPassword && (
              <PasswordStrength>
                <StrengthBar>
                  <StrengthProgress strength={passwordStrength} />
                </StrengthBar>
                <StrengthText strength={passwordStrength}>
                  {getStrengthText(passwordStrength)}
                </StrengthText>
              </PasswordStrength>
            )}
          </InputGroup>

          <InputGroup>
            <Label>
              <Key size={16} />
              Confirm New Password
            </Label>
            <InputWrapper>
              <Input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your new password"
                showToggle
                required
              />
              <ToggleButton
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </ToggleButton>
            </InputWrapper>
          </InputGroup>

          <Button type="submit" disabled={isLoading}>
            <Lock size={16} />
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </Form>
      </SecurityCard>

      <SecurityCard>
        <CardTitle>
          <Smartphone size={20} />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account by requiring a verification code from your phone in addition to your password.
        </CardDescription>

        <TwoFactorSection enabled={twoFactorEnabled}>
          <TwoFactorInfo>
            <StatusIcon enabled={twoFactorEnabled}>
              {twoFactorEnabled ? <Check size={20} /> : <AlertTriangle size={20} />}
            </StatusIcon>
            <TwoFactorText>
              <h4>Two-Factor Authentication</h4>
              <p>
                {twoFactorEnabled 
                  ? 'Your account is protected with 2FA'
                  : 'Your account could be more secure'
                }
              </p>
            </TwoFactorText>
          </TwoFactorInfo>

          <Button
            type="button"
            variant={twoFactorEnabled ? 'danger' : 'primary'}
            onClick={handleToggle2FA}
          >
            {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
        </TwoFactorSection>
      </SecurityCard>

      {biometricSupported && (
        <SecurityCard>
          <CardTitle>
            <Fingerprint size={20} />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Use your fingerprint, face recognition, or other biometric authentication to sign in quickly and securely.
          </CardDescription>

          <TwoFactorSection enabled={biometricEnabled}>
            <TwoFactorInfo>
              <StatusIcon enabled={biometricEnabled}>
                {biometricEnabled ? <Check size={20} /> : <Fingerprint size={20} />}
              </StatusIcon>
              <TwoFactorText>
                <h4>Biometric Sign-In</h4>
                <p>
                  {biometricEnabled
                    ? 'Face ID / Touch ID / Windows Hello is enabled'
                    : 'Enable biometric authentication for faster sign-in'
                  }
                </p>
              </TwoFactorText>
            </TwoFactorInfo>

            <Button
              type="button"
              variant={biometricEnabled ? 'danger' : 'primary'}
              onClick={handleBiometricToggle}
            >
              <Fingerprint size={16} />
              {biometricEnabled ? 'Disable Biometric' : 'Enable Biometric'}
            </Button>
          </TwoFactorSection>
        </SecurityCard>
      )}

      {!biometricSupported && (
        <SecurityCard>
          <CardTitle>
            <Fingerprint size={20} />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Biometric authentication is not available on this device. This feature requires a device with Face ID, Touch ID, Windows Hello, or other platform authenticators.
          </CardDescription>
        </SecurityCard>
      )}
    </SecurityContainer>
  );
};

export default SecuritySettings;