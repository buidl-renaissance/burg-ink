'use client';

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { FaSave } from 'react-icons/fa';
import { GetServerSideProps } from 'next';

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



interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  fontFamily: string;
  fontSize: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  is_verified: boolean;
  last_login_at?: string;
  bio?: string;
}

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem 0;
  border-bottom: 1px solid #e9ecef;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    margin-bottom: 1rem;
    padding: 1rem 0;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    text-align: center;
  }
`;

const SaveButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;

  &:hover {
    background: #7a6f4d;
  }

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    justify-content: center;
  }
`;


const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const SectionContainer = styled.div`
  margin-bottom: 2.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &::before {
    content: '';
    width: 4px;
    height: 20px;
    background: #96885f;
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    font-size: 1.125rem;
    margin: 0 0 0.75rem 0;
  }
`;

const SectionCard = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
`;

const SettingsSection = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }
`;

const SettingField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;

  &:hover {
    border-color: #96885f;
    background: #f8f7f4;
    box-shadow: 0 2px 4px rgba(150, 136, 95, 0.1);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 0.4rem;
  }
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
  }

  &::placeholder {
    color: #adb5bd;
  }

  @media (max-width: 768px) {
    padding: 0.65rem 0.85rem;
    font-size: 0.9rem;
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 90px;
  background: white;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
  }

  &::placeholder {
    color: #adb5bd;
  }

  @media (max-width: 768px) {
    padding: 0.65rem 0.85rem;
    font-size: 0.9rem;
    min-height: 75px;
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
  }

  @media (max-width: 768px) {
    padding: 0.65rem 0.85rem;
    font-size: 0.9rem;
  }
`;


const ColorInput = styled.input`
  width: 50px;
  height: 36px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
  }

  &:hover {
    border-color: #96885f;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      breadcrumbs: [{ label: 'Admin', href: '/admin' }],
      currentPage: 'Settings'
    }
  }
};

export default function AdminSettings() {
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



  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    primaryColor: '#96885f',
    secondaryColor: '#7a6f4d',
    accentColor: '#28a745',
    logoUrl: '',
    faviconUrl: '',
    fontFamily: 'system',
    fontSize: '16',
  });

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (response.ok) {
        const settings = data.settings;
        
        // Update site settings
        setSiteSettings({
          siteName: settings.site_name || 'Burg Ink',
          siteDescription: settings.site_description || 'Contemporary Art Gallery and Community',
          siteUrl: settings.site_url || 'https://burgink.com',
          contactEmail: settings.contact_email || 'contact@burgink.com',
          theme: settings.theme || 'light',
          maintenanceMode: false,
          allowRegistration: true,
          requireEmailVerification: true,
        });

        // Update appearance settings
        setAppearanceSettings({
          primaryColor: settings.primary_color || '#96885f',
          secondaryColor: settings.secondary_color || '#7a6f4d',
          accentColor: settings.accent_color || '#28a745',
          logoUrl: settings.logo_url || '',
          faviconUrl: settings.favicon_url || '',
          fontFamily: settings.font_family || 'system',
          fontSize: settings.font_size || '16',
        });

      } else {
        console.error('Failed to fetch settings:', data.error);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveStatus('saving');
      
      // Prepare settings object
      const settings = {
        site_name: siteSettings.siteName,
        site_description: siteSettings.siteDescription,
        site_url: siteSettings.siteUrl,
        contact_email: siteSettings.contactEmail,
        theme: siteSettings.theme,
        primary_color: appearanceSettings.primaryColor,
        secondary_color: appearanceSettings.secondaryColor,
        accent_color: appearanceSettings.accentColor,
        logo_url: appearanceSettings.logoUrl,
        favicon_url: appearanceSettings.faviconUrl,
        font_family: appearanceSettings.fontFamily,
        font_size: appearanceSettings.fontSize,
      };

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        const data = await response.json();
        console.error('Failed to save settings:', data.error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };


  const renderGeneralSettings = () => (
    <SettingsSection>
      <SectionTitle>Site Information</SectionTitle>
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

      <SectionTitle>Theme</SectionTitle>
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
      </SettingsGrid>
    </SettingsSection>
  );



  const UserRow = ({ user, isSelected, onSelect, onEdit }: { user: User; isSelected: boolean; onSelect: (selected: boolean) => void; onEdit: () => void }) => (
    <tr style={{ borderBottom: '1px solid #e9ecef' }}>
      <td style={{ padding: '0.75rem' }}>
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
        />
      </td>
      <td style={{ padding: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: '#96885f', 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: '600' }}>{user.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>{user.email}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '0.75rem' }}>
        <span style={{ 
          padding: '0.25rem 0.5rem', 
          borderRadius: '4px', 
          fontSize: '0.8rem',
          background: user.role === 'admin' ? '#dc3545' : user.role === 'artist' ? '#28a745' : '#6c757d',
          color: 'white'
        }}>
          {user.role}
        </span>
      </td>
      <td style={{ padding: '0.75rem' }}>
        <span style={{ 
          padding: '0.25rem 0.5rem', 
          borderRadius: '4px', 
          fontSize: '0.8rem',
          background: user.status === 'active' ? '#28a745' : user.status === 'suspended' ? '#dc3545' : '#6c757d',
          color: 'white'
        }}>
          {user.status}
        </span>
      </td>
      <td style={{ padding: '0.75rem' }}>
        {user.is_verified ? '✓' : '✗'}
      </td>
      <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6c757d' }}>
        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
      </td>
      <td style={{ padding: '0.75rem' }}>
        <button 
          onClick={onEdit}
          style={{ 
            background: 'none', 
            border: '1px solid #96885f', 
            color: '#96885f',
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Edit
        </button>
      </td>
    </tr>
  );

  const BulkActions = ({ selectedUsers, onUpdate }: { selectedUsers: number[]; onUpdate: () => void }) => {
    const [action, setAction] = useState('');
    const [reason, setReason] = useState('');

    const handleBulkAction = async () => {
      if (!action) return;

      try {
        const response = await fetch('/api/admin/users/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            user_ids: selectedUsers,
            reason
          })
        });

        if (response.ok) {
          onUpdate();
          setAction('');
          setReason('');
        } else {
          const data = await response.json();
          alert(`Error: ${data.error}`);
        }
      } catch {
        alert('Error performing bulk action');
      }
    };

    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Select value={action} onChange={(e) => setAction(e.target.value)} style={{ minWidth: '120px' }}>
          <option value="">Select Action</option>
          <option value="activate">Activate</option>
          <option value="deactivate">Deactivate</option>
          <option value="suspend">Suspend</option>
          <option value="delete">Delete</option>
        </Select>
        <Input
          type="text"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          style={{ minWidth: '150px' }}
        />
        <button 
          onClick={handleBulkAction}
          disabled={!action}
          style={{ 
            background: '#dc3545', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px',
            cursor: action ? 'pointer' : 'not-allowed',
            opacity: action ? 1 : 0.5
          }}
        >
          Apply
        </button>
      </div>
    );
  };

  const UserDetailModal = ({ user, onClose, onUpdate }: { user: User; onClose: () => void; onUpdate: () => void }) => {
    const [formData, setFormData] = useState({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      bio: user.bio || '',
      password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          onUpdate();
          onClose();
        } else {
          const data = await response.json();
          alert(`Error: ${data.error}`);
        }
      } catch {
        alert('Error updating user');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>Edit User</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Role</Label>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">User - Can view content and create inquiries</option>
                <option value="artist">Artist - Can manage portfolio and create artwork</option>
                <option value="moderator">Moderator - Can moderate content and manage users</option>
                <option value="admin">Admin - Full access to all features and settings</option>
              </Select>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </Select>
            </div>
            
            <div>
              <Label>Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
              />
            </div>
            
            <div>
              <Label>New Password (leave blank to keep current)</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
            <button 
              onClick={onClose}
              style={{ 
                background: '#6c757d', 
                color: 'white', 
                border: 'none', 
                padding: '0.75rem 1rem', 
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              style={{ 
                background: '#96885f', 
                color: 'white', 
                border: 'none', 
                padding: '0.75rem 1rem', 
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const InviteUserModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      role: 'user'
    });
    const [loading, setLoading] = useState(false);

    const handleInvite = async () => {
      if (!formData.name || !formData.email) {
        alert('Name and email are required');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            sendInvitation: true
          })
        });

        if (response.ok) {
          onSuccess();
        } else {
          const data = await response.json();
          alert(`Error: ${data.error}`);
        }
      } catch {
        alert('Error sending invitation');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%'
        }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>Invite User</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="User's full name"
              />
            </div>
            
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <Label>Role</Label>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">User - Can view content and create inquiries</option>
                <option value="artist">Artist - Can manage portfolio and create artwork</option>
                <option value="moderator">Moderator - Can moderate content and manage users</option>
                <option value="admin">Admin - Full access to all features and settings</option>
              </Select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
            <button 
              onClick={onClose}
              style={{ 
                background: '#6c757d', 
                color: 'white', 
                border: 'none', 
                padding: '0.75rem 1rem', 
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleInvite}
              disabled={loading}
              style={{ 
                background: '#96885f', 
                color: 'white', 
                border: 'none', 
                padding: '0.75rem 1rem', 
                borderRadius: '6px',
                cursor: 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter]);

  // Load users when component mounts
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const renderUserSettings = () => {

    return (
      <SettingsSection>
        <SectionTitle>User Management</SectionTitle>
        

        {/* Filters and Actions */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '200px' }}
          />
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin - Full access</option>
            <option value="artist">Artist - Portfolio management</option>
            <option value="moderator">Moderator - Content moderation</option>
            <option value="user">User - Basic access</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </Select>
          <button 
            onClick={() => setShowInviteModal(true)}
            style={{ 
              background: '#96885f', 
              color: 'white', 
              border: 'none', 
              padding: '0.75rem 1rem', 
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Invite User
          </button>
          {selectedUsers.length > 0 && (
            <BulkActions selectedUsers={selectedUsers} onUpdate={fetchUsers} />
          )}
        </div>

        {/* Users Table */}
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e9ecef' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>User</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Role</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Verified</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Last Login</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow 
                    key={user.id} 
                    user={user} 
                    isSelected={selectedUsers.includes(user.id)}
                    onSelect={(selected) => {
                      if (selected) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                    onEdit={() => {
                      setSelectedUser(user);
                      setShowUserModal(true);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* User Detail Modal */}
        {showUserModal && selectedUser && (
          <UserDetailModal 
            user={selectedUser} 
            onClose={() => {
              setShowUserModal(false);
              setSelectedUser(null);
            }}
            onUpdate={fetchUsers}
          />
        )}

        {/* Invite User Modal */}
        {showInviteModal && (
          <InviteUserModal 
            onClose={() => setShowInviteModal(false)}
            onSuccess={() => {
              setShowInviteModal(false);
              fetchUsers();
            }}
          />
        )}

      </SettingsSection>
    );
  };

  const renderAppearanceSettings = () => (
    <SettingsSection>
      <SectionTitle>Brand Colors</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Primary Color</Label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <ColorInput
              type="color"
              value={appearanceSettings.primaryColor}
              onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
            />
            <Input
              type="text"
              value={appearanceSettings.primaryColor}
              onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
              placeholder="#96885f"
              style={{ width: '120px' }}
            />
          </div>
        </SettingField>
        
        <SettingField>
          <Label>Secondary Color</Label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <ColorInput
              type="color"
              value={appearanceSettings.secondaryColor}
              onChange={(e) => setAppearanceSettings({ ...appearanceSettings, secondaryColor: e.target.value })}
            />
            <Input
              type="text"
              value={appearanceSettings.secondaryColor}
              onChange={(e) => setAppearanceSettings({ ...appearanceSettings, secondaryColor: e.target.value })}
              placeholder="#7a6f4d"
              style={{ width: '120px' }}
            />
          </div>
        </SettingField>
        
        <SettingField>
          <Label>Accent Color</Label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <ColorInput
              type="color"
              value={appearanceSettings.accentColor}
              onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accentColor: e.target.value })}
            />
            <Input
              type="text"
              value={appearanceSettings.accentColor}
              onChange={(e) => setAppearanceSettings({ ...appearanceSettings, accentColor: e.target.value })}
              placeholder="#28a745"
              style={{ width: '120px' }}
            />
          </div>
        </SettingField>
      </SettingsGrid>

      <SectionTitle>Branding</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Logo URL</Label>
          <Input
            type="url"
            value={appearanceSettings.logoUrl}
            onChange={(e) => setAppearanceSettings({ ...appearanceSettings, logoUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
          />
          <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
            Upload your logo to a file hosting service and paste the URL here
          </div>
        </SettingField>
        
        <SettingField>
          <Label>Favicon URL</Label>
          <Input
            type="url"
            value={appearanceSettings.faviconUrl}
            onChange={(e) => setAppearanceSettings({ ...appearanceSettings, faviconUrl: e.target.value })}
            placeholder="https://example.com/favicon.ico"
          />
          <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.25rem' }}>
            Small icon that appears in browser tabs (16x16 or 32x32 pixels)
          </div>
        </SettingField>
      </SettingsGrid>

      <SectionTitle>Typography</SectionTitle>
      <SettingsGrid>
        <SettingField>
          <Label>Font Family</Label>
          <Select 
            value={appearanceSettings.fontFamily}
            onChange={(e) => setAppearanceSettings({ ...appearanceSettings, fontFamily: e.target.value })}
          >
            <option value="system">System Default</option>
            <option value="inter">Inter</option>
            <option value="roboto">Roboto</option>
            <option value="open-sans">Open Sans</option>
            <option value="helvetica">Helvetica</option>
            <option value="arial">Arial</option>
          </Select>
        </SettingField>
        
        <SettingField>
          <Label>Base Font Size</Label>
          <Select 
            value={appearanceSettings.fontSize}
            onChange={(e) => setAppearanceSettings({ ...appearanceSettings, fontSize: e.target.value })}
          >
            <option value="14">14px (Small)</option>
            <option value="16">16px (Medium)</option>
            <option value="18">18px (Large)</option>
            <option value="20">20px (Extra Large)</option>
          </Select>
        </SettingField>
      </SettingsGrid>
    </SettingsSection>
  );



  const renderAllSettings = () => (
    <>
      <SectionContainer>
        <SectionTitle>🌐 General Settings</SectionTitle>
        <SectionCard>
          {renderGeneralSettings()}
        </SectionCard>
      </SectionContainer>
      
      <SectionContainer>
        <SectionTitle>🎨 Appearance & Branding</SectionTitle>
        <SectionCard>
          {renderAppearanceSettings()}
        </SectionCard>
      </SectionContainer>
      
      <SectionContainer>
        <SectionTitle>👥 Users & Roles</SectionTitle>
        <SectionCard>
          {renderUserSettings()}
        </SectionCard>
      </SectionContainer>
    </>
  );

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
          <SettingsContainer>
            {loading ? (
              <LoadingMessage>Loading settings...</LoadingMessage>
            ) : (
              renderAllSettings()
            )}
          </SettingsContainer>
        </Content>
      </Container>
    </AdminLayout>
  );
}

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 0.875rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid #c3e6cb;
  font-size: 0.9rem;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 0.875rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 1rem;
`; 