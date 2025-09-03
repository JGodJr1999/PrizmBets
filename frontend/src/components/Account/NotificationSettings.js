import React, { useState } from 'react';
import styled from 'styled-components';
import { Bell, Mail, Smartphone, TrendingUp, AlertCircle, Settings, Volume2, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';

const NotificationContainer = styled.div`
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

const NotificationCard = styled.div`
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

const NotificationGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const NotificationItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.accent.primary}40;
    background: ${props => props.theme.colors.accent.primary}05;
  }
`;

const NotificationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  flex: 1;
`;

const NotificationIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.colors.accent.primary}20;
  color: ${props => props.theme.colors.accent.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const NotificationText = styled.div`
  flex: 1;
  
  h4 {
    color: ${props => props.theme.colors.text.primary};
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: ${props => props.theme.spacing.xs};
  }
  
  p {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.9rem;
    margin: 0;
    line-height: 1.4;
  }
`;

const NotificationControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  cursor: pointer;
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.checked ? 
    props.theme.colors.accent.primary : 
    props.theme.colors.border.primary
  };
  transition: 0.4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: ${props => props.checked ? '29px' : '3px'};
    bottom: 3px;
    background-color: ${props => props.theme.colors.background.primary};
    transition: 0.4s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const FrequencySelect = styled.select`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
  }
  
  &:disabled {
    opacity: 0.5;
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
  margin-top: ${props => props.theme.spacing.xl};
  
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

const SoundToggle = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.enabled ? 
    `${props.theme.colors.accent.primary}10` : 
    `${props.theme.colors.text.muted}10`
  };
  border: 1px solid ${props => props.enabled ? 
    `${props.theme.colors.accent.primary}40` : 
    props.theme.colors.border.primary
  };
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.enabled ? 
      `${props.theme.colors.accent.primary}20` : 
      `${props.theme.colors.text.muted}20`
    };
  }
`;

const NotificationSettings = ({ user }) => {
  const [notifications, setNotifications] = useState({
    email: {
      enabled: true,
      frequency: 'daily',
      types: {
        bettingTips: true,
        usageAlerts: true,
        promotions: false,
        newsletters: true
      }
    },
    push: {
      enabled: false,
      types: {
        bettingTips: false,
        usageAlerts: true,
        results: false,
        promotions: false
      }
    },
    sound: {
      enabled: true
    }
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleNotification = (type, category, subType = null) => {
    setNotifications(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...(subType ? {
          types: {
            ...prev[type].types,
            [subType]: !prev[type].types[subType]
          }
        } : category === 'enabled' ? {
          enabled: !prev[type].enabled
        } : {
          [category]: !prev[type][category]
        })
      }
    }));
  };

  const handleFrequencyChange = (type, value) => {
    setNotifications(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        frequency: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implement API call to save notification settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NotificationContainer>
      <SectionTitle>
        <Bell size={24} />
        Notification Settings
      </SectionTitle>

      <NotificationCard>
        <CardTitle>
          <Mail size={20} />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Configure which email notifications you'd like to receive and how often.
        </CardDescription>

        <NotificationGroup>
          <NotificationItem>
            <NotificationInfo>
              <NotificationIcon>
                <Mail size={20} />
              </NotificationIcon>
              <NotificationText>
                <h4>Email Notifications</h4>
                <p>Receive notifications via email</p>
              </NotificationText>
            </NotificationInfo>
            <NotificationControls>
              <FrequencySelect
                value={notifications.email.frequency}
                onChange={(e) => handleFrequencyChange('email', e.target.value)}
                disabled={!notifications.email.enabled}
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
              </FrequencySelect>
              <ToggleSwitch>
                <ToggleInput
                  type="checkbox"
                  checked={notifications.email.enabled}
                  onChange={() => handleToggleNotification('email', 'enabled')}
                />
                <ToggleSlider checked={notifications.email.enabled} />
              </ToggleSwitch>
            </NotificationControls>
          </NotificationItem>

          <NotificationItem>
            <NotificationInfo>
              <NotificationIcon>
                <TrendingUp size={20} />
              </NotificationIcon>
              <NotificationText>
                <h4>Betting Tips & Analysis</h4>
                <p>AI-powered betting insights and recommendations</p>
              </NotificationText>
            </NotificationInfo>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={notifications.email.types.bettingTips}
                onChange={() => handleToggleNotification('email', null, 'bettingTips')}
              />
              <ToggleSlider checked={notifications.email.types.bettingTips} />
            </ToggleSwitch>
          </NotificationItem>

          <NotificationItem>
            <NotificationInfo>
              <NotificationIcon>
                <AlertCircle size={20} />
              </NotificationIcon>
              <NotificationText>
                <h4>Usage & Limit Alerts</h4>
                <p>Notifications when approaching or reaching usage limits</p>
              </NotificationText>
            </NotificationInfo>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={notifications.email.types.usageAlerts}
                onChange={() => handleToggleNotification('email', null, 'usageAlerts')}
              />
              <ToggleSlider checked={notifications.email.types.usageAlerts} />
            </ToggleSwitch>
          </NotificationItem>

          <NotificationItem>
            <NotificationInfo>
              <NotificationIcon>
                <Bell size={20} />
              </NotificationIcon>
              <NotificationText>
                <h4>Product Updates & News</h4>
                <p>New features, product updates, and betting news</p>
              </NotificationText>
            </NotificationInfo>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={notifications.email.types.newsletters}
                onChange={() => handleToggleNotification('email', null, 'newsletters')}
              />
              <ToggleSlider checked={notifications.email.types.newsletters} />
            </ToggleSwitch>
          </NotificationItem>

          <NotificationItem>
            <NotificationInfo>
              <NotificationIcon>
                <Settings size={20} />
              </NotificationIcon>
              <NotificationText>
                <h4>Promotions & Offers</h4>
                <p>Special offers, discounts, and promotional content</p>
              </NotificationText>
            </NotificationInfo>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={notifications.email.types.promotions}
                onChange={() => handleToggleNotification('email', null, 'promotions')}
              />
              <ToggleSlider checked={notifications.email.types.promotions} />
            </ToggleSwitch>
          </NotificationItem>
        </NotificationGroup>
      </NotificationCard>

      <NotificationCard>
        <CardTitle>
          <Smartphone size={20} />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get real-time notifications on your device for important updates.
        </CardDescription>

        <NotificationGroup>
          <NotificationItem>
            <NotificationInfo>
              <NotificationIcon>
                <Smartphone size={20} />
              </NotificationIcon>
              <NotificationText>
                <h4>Push Notifications</h4>
                <p>Receive notifications on your device</p>
              </NotificationText>
            </NotificationInfo>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={notifications.push.enabled}
                onChange={() => handleToggleNotification('push', 'enabled')}
              />
              <ToggleSlider checked={notifications.push.enabled} />
            </ToggleSwitch>
          </NotificationItem>

          <NotificationItem>
            <NotificationInfo>
              <NotificationIcon>
                <TrendingUp size={20} />
              </NotificationIcon>
              <NotificationText>
                <h4>Live Betting Opportunities</h4>
                <p>Time-sensitive betting tips and odds changes</p>
              </NotificationText>
            </NotificationInfo>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={notifications.push.types.bettingTips}
                onChange={() => handleToggleNotification('push', null, 'bettingTips')}
              />
              <ToggleSlider checked={notifications.push.types.bettingTips} />
            </ToggleSwitch>
          </NotificationItem>

          <NotificationItem>
            <NotificationInfo>
              <NotificationIcon>
                <AlertCircle size={20} />
              </NotificationIcon>
              <NotificationText>
                <h4>Usage Limit Warnings</h4>
                <p>Immediate alerts when approaching limits</p>
              </NotificationText>
            </NotificationInfo>
            <ToggleSwitch>
              <ToggleInput
                type="checkbox"
                checked={notifications.push.types.usageAlerts}
                onChange={() => handleToggleNotification('push', null, 'usageAlerts')}
              />
              <ToggleSlider checked={notifications.push.types.usageAlerts} />
            </ToggleSwitch>
          </NotificationItem>
        </NotificationGroup>
      </NotificationCard>

      <NotificationCard>
        <CardTitle>
          <Volume2 size={20} />
          Sound & Appearance
        </CardTitle>
        <CardDescription>
          Customize how notifications appear and sound on your device.
        </CardDescription>

        <SoundToggle
          enabled={notifications.sound.enabled}
          onClick={() => handleToggleNotification('sound', 'enabled')}
        >
          <NotificationIcon>
            {notifications.sound.enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </NotificationIcon>
          <NotificationText>
            <h4>Notification Sounds</h4>
            <p>{notifications.sound.enabled ? 'Sound enabled' : 'Sound disabled'}</p>
          </NotificationText>
          <ToggleSwitch>
            <ToggleInput
              type="checkbox"
              checked={notifications.sound.enabled}
              readOnly
            />
            <ToggleSlider checked={notifications.sound.enabled} />
          </ToggleSwitch>
        </SoundToggle>
      </NotificationCard>

      <SaveButton onClick={handleSaveSettings} disabled={isLoading}>
        <Settings size={16} />
        {isLoading ? 'Saving...' : 'Save Notification Settings'}
      </SaveButton>
    </NotificationContainer>
  );
};

export default NotificationSettings;