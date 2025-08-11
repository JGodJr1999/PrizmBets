import React, { useState } from 'react';
import styled from 'styled-components';
import { Settings, Users, Calendar, Target, AlertCircle, CheckCircle, Edit3, Trash2, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

const ManagementContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
`;

const Section = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const SettingCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
`;

const SettingLabel = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const SettingDescription = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SettingControl = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const Select = styled.select`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
  }
`;

const Input = styled.input`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
  }
`;

const Toggle = styled.button`
  background: ${props => props.enabled ? props.theme.colors.accent.primary : props.theme.colors.background.primary};
  border: 1px solid ${props => props.enabled ? props.theme.colors.accent.primary : props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.full};
  width: 50px;
  height: 26px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${props => props.enabled ? props.theme.colors.background.primary : props.theme.colors.text.secondary};
    top: 2px;
    left: ${props => props.enabled ? '26px' : '2px'};
    transition: all 0.2s ease;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)` : 
    props.danger ? 
      `linear-gradient(135deg, ${props.theme.colors.accent.secondary}, ${props.theme.colors.accent.secondary}dd)` :
      props.theme.colors.background.secondary};
  border: ${props => props.primary || props.danger ? 'none' : `1px solid ${props.theme.colors.border.primary}`};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.primary || props.danger ? props.theme.colors.background.primary : props.theme.colors.text.primary};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  text-align: center;
`;

const StatValue = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const OwnerManagement = ({ pool }) => {
  const [settings, setSettings] = useState({
    pick_type: pool.settings?.pick_type || 'straight_up',
    include_playoffs: pool.settings?.include_playoffs || true,
    max_members: pool.settings?.max_members || 50,
    auto_close_picks: true,
    email_reminders: true,
    public_leaderboard: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    // In demo mode, just show success
    toast.success('Pool settings saved successfully!');
  };

  const handleResetPool = () => {
    if (window.confirm('Are you sure you want to reset all picks for this week? This cannot be undone.')) {
      toast.success('Pool picks reset successfully!');
    }
  };

  const handleDeletePool = () => {
    if (window.confirm('Are you sure you want to delete this pool? This will permanently delete all data and cannot be undone.')) {
      toast.success('Pool scheduled for deletion!');
    }
  };

  return (
    <ManagementContainer>
      {/* Pool Statistics */}
      <Section>
        <SectionTitle>
          <Target size={20} />
          Pool Statistics
        </SectionTitle>
        <SettingsGrid>
          <StatCard>
            <StatValue>156</StatValue>
            <StatLabel>Total Picks Made</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>89</StatValue>
            <StatLabel>Correct Picks</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>57%</StatValue>
            <StatLabel>Overall Accuracy</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>12</StatValue>
            <StatLabel>Active Members</StatLabel>
          </StatCard>
        </SettingsGrid>
      </Section>

      {/* Pool Settings */}
      <Section>
        <SectionTitle>
          <Settings size={20} />
          Pool Settings
        </SectionTitle>
        <SettingsGrid>
          <SettingCard>
            <SettingLabel>Pick Type</SettingLabel>
            <SettingDescription>How members make their picks</SettingDescription>
            <SettingControl>
              <Select
                value={settings.pick_type}
                onChange={(e) => handleSettingChange('pick_type', e.target.value)}
              >
                <option value="straight_up">Straight Up</option>
                <option value="against_spread">Against the Spread</option>
                <option value="confidence">Confidence Points</option>
              </Select>
            </SettingControl>
          </SettingCard>

          <SettingCard>
            <SettingLabel>Maximum Members</SettingLabel>
            <SettingDescription>Total number of people who can join</SettingDescription>
            <SettingControl>
              <Input
                type="number"
                min="2"
                max="1000"
                value={settings.max_members}
                onChange={(e) => handleSettingChange('max_members', parseInt(e.target.value))}
              />
            </SettingControl>
          </SettingCard>

          <SettingCard>
            <SettingLabel>Include Playoffs</SettingLabel>
            <SettingDescription>Continue pool through NFL playoffs</SettingDescription>
            <SettingControl>
              <Toggle
                enabled={settings.include_playoffs}
                onClick={() => handleSettingChange('include_playoffs', !settings.include_playoffs)}
              />
            </SettingControl>
          </SettingCard>

          <SettingCard>
            <SettingLabel>Auto-Close Picks</SettingLabel>
            <SettingDescription>Automatically lock picks when games start</SettingDescription>
            <SettingControl>
              <Toggle
                enabled={settings.auto_close_picks}
                onClick={() => handleSettingChange('auto_close_picks', !settings.auto_close_picks)}
              />
            </SettingControl>
          </SettingCard>

          <SettingCard>
            <SettingLabel>Email Reminders</SettingLabel>
            <SettingDescription>Send pick reminders to members</SettingDescription>
            <SettingControl>
              <Toggle
                enabled={settings.email_reminders}
                onClick={() => handleSettingChange('email_reminders', !settings.email_reminders)}
              />
            </SettingControl>
          </SettingCard>

          <SettingCard>
            <SettingLabel>Public Leaderboard</SettingLabel>
            <SettingDescription>Allow non-members to view standings</SettingDescription>
            <SettingControl>
              <Toggle
                enabled={settings.public_leaderboard}
                onClick={() => handleSettingChange('public_leaderboard', !settings.public_leaderboard)}
              />
            </SettingControl>
          </SettingCard>
        </SettingsGrid>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <ActionButton onClick={handleSaveSettings} primary>
            <CheckCircle size={16} />
            Save Settings
          </ActionButton>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section>
        <SectionTitle>
          <AlertCircle size={20} />
          Danger Zone
        </SectionTitle>
        <SettingsGrid>
          <SettingCard>
            <SettingLabel>Reset Weekly Picks</SettingLabel>
            <SettingDescription>Clear all picks for the current week. Members will need to pick again.</SettingDescription>
            <SettingControl>
              <ActionButton onClick={handleResetPool} danger>
                <Edit3 size={16} />
                Reset This Week
              </ActionButton>
            </SettingControl>
          </SettingCard>

          <SettingCard>
            <SettingLabel>Delete Pool</SettingLabel>
            <SettingDescription>Permanently delete this pool and all associated data.</SettingDescription>
            <SettingControl>
              <ActionButton onClick={handleDeletePool} danger>
                <Trash2 size={16} />
                Delete Pool
              </ActionButton>
            </SettingControl>
          </SettingCard>
        </SettingsGrid>
      </Section>
    </ManagementContainer>
  );
};

export default OwnerManagement;