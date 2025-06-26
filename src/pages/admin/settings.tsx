'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { FaSave, FaGlobe, FaEnvelope, FaUser, FaPalette, FaLock, FaDatabase } from 'react-icons/fa';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  contactEmail: string;
  theme: 'light' | 'dark' | 'auto';
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  enableEmailNotifications: boolean;
}

interface UserSettings {
  defaultUserRole: string;
  maxLoginAttempts: number;
  sessionTimeout: number;
  passwordMinLength: number;
  requireStrongPassword: boolean;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('site');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'Burg Ink',
    siteDescription: 'Contemporary Art Gallery and Community',
    siteUrl: 'https://burgink.com',
    contactEmail: 'contact@burgink.com',
    theme: 'light',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'noreply@burgink.com',
    smtpPassword: '',
    fromEmail: 'noreply@burgink.com',
    fromName: 'Burg Ink',
    enableEmailNotifications: true,
  });

  const [userSettings, setUserSettings] = useState<UserSettings>({
    defaultUserRole: 'user',
    maxLoginAttempts: 5,
    sessionTimeout: 24,
    passwordMinLength: 8,
    requireStrongPassword: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real implementation, fetch settings from API
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const tabs = [
    { id: 'site', label: 'Site Settings', icon: FaGlobe },
    { id: 'email', label: 'Email Settings', icon: FaEnvelope },
    { id: 'users', label: 'User Settings', icon: FaUser },
    { id: 'appearance', label: 'Appearance', icon: FaPalette },
    { id: 'security', label: 'Security', icon: FaLock },
    { id: 'advanced', label: 'Advanced', icon: FaDatabase },
  ];

  const renderSiteSettings = () => (
    <SettingsSection>
      <SectionTitle>General Site Settings</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Site Name</Label>
          <Input
            type="text"
            value={siteSettings.siteName}
            onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
            placeholder="Enter site name"
          />
        </SettingField>
        
        <SettingField>
          <Label>Site Description</Label>
          <Textarea
            value={siteSettings.siteDescription}
            onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
            placeholder="Enter site description"
            rows={3}
          />
        </SettingField>
        
        <SettingField>
          <Label>Site URL</Label>
          <Input
            type="url"
            value={siteSettings.siteUrl}
            onChange={(e) => setSiteSettings({ ...siteSettings, siteUrl: e.target.value })}
            placeholder="https://example.com"
          />
        </SettingField>
        
        <SettingField>
          <Label>Contact Email</Label>
          <Input
            type="email"
            value={siteSettings.contactEmail}
            onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
            placeholder="contact@example.com"
          />
        </SettingField>
      </SettingsGrid>

      <SectionTitle>Site Behavior</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Theme</Label>
          <Select
            value={siteSettings.theme}
            onChange={(e) => setSiteSettings({ ...siteSettings, theme: e.target.value as 'light' | 'dark' | 'auto' })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </Select>
        </SettingField>
        
        <SettingField>
          <Label>Maintenance Mode</Label>
          <Toggle
            checked={siteSettings.maintenanceMode}
            onChange={(e) => setSiteSettings({ ...siteSettings, maintenanceMode: e.target.checked })}
          />
          <ToggleLabel>Enable maintenance mode</ToggleLabel>
        </SettingField>
        
        <SettingField>
          <Label>User Registration</Label>
          <Toggle
            checked={siteSettings.allowRegistration}
            onChange={(e) => setSiteSettings({ ...siteSettings, allowRegistration: e.target.checked })}
          />
          <ToggleLabel>Allow new user registrations</ToggleLabel>
        </SettingField>
        
        <SettingField>
          <Label>Email Verification</Label>
          <Toggle
            checked={siteSettings.requireEmailVerification}
            onChange={(e) => setSiteSettings({ ...siteSettings, requireEmailVerification: e.target.checked })}
          />
          <ToggleLabel>Require email verification</ToggleLabel>
        </SettingField>
      </SettingsGrid>
    </SettingsSection>
  );

  const renderEmailSettings = () => (
    <SettingsSection>
      <SectionTitle>SMTP Configuration</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>SMTP Host</Label>
          <Input
            type="text"
            value={emailSettings.smtpHost}
            onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
            placeholder="smtp.gmail.com"
          />
        </SettingField>
        
        <SettingField>
          <Label>SMTP Port</Label>
          <Input
            type="number"
            value={emailSettings.smtpPort}
            onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
            placeholder="587"
          />
        </SettingField>
        
        <SettingField>
          <Label>SMTP Username</Label>
          <Input
            type="text"
            value={emailSettings.smtpUsername}
            onChange={(e) => setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })}
            placeholder="username@example.com"
          />
        </SettingField>
        
        <SettingField>
          <Label>SMTP Password</Label>
          <Input
            type="password"
            value={emailSettings.smtpPassword}
            onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
            placeholder="Enter SMTP password"
          />
        </SettingField>
        
        <SettingField>
          <Label>From Email</Label>
          <Input
            type="email"
            value={emailSettings.fromEmail}
            onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
            placeholder="noreply@example.com"
          />
        </SettingField>
        
        <SettingField>
          <Label>From Name</Label>
          <Input
            type="text"
            value={emailSettings.fromName}
            onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
            placeholder="Site Name"
          />
        </SettingField>
      </SettingsGrid>

      <SectionTitle>Email Preferences</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Email Notifications</Label>
          <Toggle
            checked={emailSettings.enableEmailNotifications}
            onChange={(e) => setEmailSettings({ ...emailSettings, enableEmailNotifications: e.target.checked })}
          />
          <ToggleLabel>Enable email notifications</ToggleLabel>
        </SettingField>
      </SettingsGrid>
    </SettingsSection>
  );

  const renderUserSettings = () => (
    <SettingsSection>
      <SectionTitle>User Management</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Default User Role</Label>
          <Select
            value={userSettings.defaultUserRole}
            onChange={(e) => setUserSettings({ ...userSettings, defaultUserRole: e.target.value })}
          >
            <option value="user">User</option>
            <option value="artist">Artist</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </Select>
        </SettingField>
        
        <SettingField>
          <Label>Max Login Attempts</Label>
          <Input
            type="number"
            value={userSettings.maxLoginAttempts}
            onChange={(e) => setUserSettings({ ...userSettings, maxLoginAttempts: parseInt(e.target.value) })}
            min="1"
            max="10"
          />
        </SettingField>
        
        <SettingField>
          <Label>Session Timeout (hours)</Label>
          <Input
            type="number"
            value={userSettings.sessionTimeout}
            onChange={(e) => setUserSettings({ ...userSettings, sessionTimeout: parseInt(e.target.value) })}
            min="1"
            max="168"
          />
        </SettingField>
        
        <SettingField>
          <Label>Minimum Password Length</Label>
          <Input
            type="number"
            value={userSettings.passwordMinLength}
            onChange={(e) => setUserSettings({ ...userSettings, passwordMinLength: parseInt(e.target.value) })}
            min="6"
            max="32"
          />
        </SettingField>
      </SettingsGrid>

      <SectionTitle>Password Security</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Strong Password Requirement</Label>
          <Toggle
            checked={userSettings.requireStrongPassword}
            onChange={(e) => setUserSettings({ ...userSettings, requireStrongPassword: e.target.checked })}
          />
          <ToggleLabel>Require strong passwords (uppercase, lowercase, numbers, symbols)</ToggleLabel>
        </SettingField>
      </SettingsGrid>
    </SettingsSection>
  );

  const renderAppearanceSettings = () => (
    <SettingsSection>
      <SectionTitle>Theme & Colors</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Primary Color</Label>
          <ColorInput
            type="color"
            defaultValue="#96885f"
          />
        </SettingField>
        
        <SettingField>
          <Label>Secondary Color</Label>
          <ColorInput
            type="color"
            defaultValue="#7a6f4d"
          />
        </SettingField>
        
        <SettingField>
          <Label>Accent Color</Label>
          <ColorInput
            type="color"
            defaultValue="#28a745"
          />
        </SettingField>
      </SettingsGrid>

      <SectionTitle>Typography</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Font Family</Label>
          <Select defaultValue="system">
            <option value="system">System Default</option>
            <option value="inter">Inter</option>
            <option value="roboto">Roboto</option>
            <option value="open-sans">Open Sans</option>
          </Select>
        </SettingField>
        
        <SettingField>
          <Label>Base Font Size</Label>
          <Select defaultValue="16">
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
            <option value="20">20px</option>
          </Select>
        </SettingField>
      </SettingsGrid>
    </SettingsSection>
  );

  const renderSecuritySettings = () => (
    <SettingsSection>
      <SectionTitle>Security Settings</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Two-Factor Authentication</Label>
          <Toggle defaultChecked={false} />
          <ToggleLabel>Require 2FA for admin accounts</ToggleLabel>
        </SettingField>
        
        <SettingField>
          <Label>Rate Limiting</Label>
          <Toggle defaultChecked={true} />
          <ToggleLabel>Enable rate limiting for API requests</ToggleLabel>
        </SettingField>
        
        <SettingField>
          <Label>CSRF Protection</Label>
          <Toggle defaultChecked={true} />
          <ToggleLabel>Enable CSRF protection</ToggleLabel>
        </SettingField>
        
        <SettingField>
          <Label>Content Security Policy</Label>
          <Toggle defaultChecked={true} />
          <ToggleLabel>Enable strict CSP headers</ToggleLabel>
        </SettingField>
      </SettingsGrid>

      <SectionTitle>Backup & Recovery</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Auto Backup</Label>
          <Toggle defaultChecked={true} />
          <ToggleLabel>Automatically backup data daily</ToggleLabel>
        </SettingField>
        
        <SettingField>
          <Label>Backup Retention (days)</Label>
          <Input
            type="number"
            defaultValue="30"
            min="1"
            max="365"
          />
        </SettingField>
      </SettingsGrid>
    </SettingsSection>
  );

  const renderAdvancedSettings = () => (
    <SettingsSection>
      <SectionTitle>Database Settings</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Database Type</Label>
          <Select defaultValue="sqlite">
            <option value="sqlite">SQLite</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
          </Select>
        </SettingField>
        
        <SettingField>
          <Label>Connection Pool Size</Label>
          <Input
            type="number"
            defaultValue="10"
            min="1"
            max="50"
          />
        </SettingField>
      </SettingsGrid>

      <SectionTitle>Cache Settings</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Enable Caching</Label>
          <Toggle defaultChecked={true} />
          <ToggleLabel>Enable Redis caching</ToggleLabel>
        </SettingField>
        
        <SettingField>
          <Label>Cache TTL (seconds)</Label>
          <Input
            type="number"
            defaultValue="3600"
            min="60"
            max="86400"
          />
        </SettingField>
      </SettingsGrid>

      <SectionTitle>Logging</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Log Level</Label>
          <Select defaultValue="info">
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </Select>
        </SettingField>
        
        <SettingField>
          <Label>Log Retention (days)</Label>
          <Input
            type="number"
            defaultValue="30"
            min="1"
            max="365"
          />
        </SettingField>
      </SettingsGrid>
    </SettingsSection>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'site':
        return renderSiteSettings();
      case 'email':
        return renderEmailSettings();
      case 'users':
        return renderUserSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'security':
        return renderSecuritySettings();
      case 'advanced':
        return renderAdvancedSettings();
      default:
        return renderSiteSettings();
    }
  };

  return (
    <AdminLayout currentPage="settings">
      <Container>
        <Header>
          <Title>Settings</Title>
          <SaveButton
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            <FaSave />
            {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
          </SaveButton>
        </Header>

        {saveStatus === 'saved' && (
          <SuccessMessage>Settings saved successfully!</SuccessMessage>
        )}
        
        {saveStatus === 'error' && (
          <ErrorMessage>Failed to save settings. Please try again.</ErrorMessage>
        )}

        <Content>
          <TabsContainer>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Tab
                  key={tab.id}
                  isActive={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </Tab>
              );
            })}
          </TabsContainer>

          <SettingsContainer>
            {loading ? (
              <LoadingMessage>Loading settings...</LoadingMessage>
            ) : (
              renderContent()
            )}
          </SettingsContainer>
        </Content>
      </Container>
    </AdminLayout>
  );
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const SaveButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;

  &:hover:not(:disabled) {
    background: #7a6f4d;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #c3e6cb;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
`;

const Content = styled.div`
  display: flex;
  gap: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
  
  @media (max-width: 768px) {
    flex-direction: row;
    overflow-x: auto;
    min-width: auto;
  }
`;

const Tab = styled.button<{ isActive: boolean }>`
  background: ${props => props.isActive ? '#96885f' : 'transparent'};
  color: ${props => props.isActive ? 'white' : '#333'};
  border: none;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 500;
  transition: all 0.3s ease;
  text-align: left;

  &:hover {
    background: ${props => props.isActive ? '#7a6f4d' : 'rgba(150, 136, 95, 0.1)'};
  }
`;

const SettingsContainer = styled.div`
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const SettingsSection = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const SettingField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;

  &:focus {
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  resize: vertical;

  &:focus {
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  background: white;

  &:focus {
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
  }
`;

const Toggle = styled.input.attrs({ type: 'checkbox' })`
  width: 40px;
  height: 20px;
  appearance: none;
  background: #e9ecef;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:checked {
    background: #96885f;
  }

  &:checked::after {
    transform: translateX(20px);
  }

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
  }
`;

const ToggleLabel = styled.span`
  font-size: 0.9rem;
  color: #6c757d;
  margin-left: 0.5rem;
`;

const ColorInput = styled.input`
  width: 60px;
  height: 40px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`; 