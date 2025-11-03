'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { Modal } from '@/components/Modal';
import { FaSearch, FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa';
import { GetServerSideProps } from 'next';
import { TableContainer, Table, Th, Td, ActionButton, LoadingMessage, EmptyMessage, ActionButtons } from '@/components/AdminTableStyles';

interface User {
  id: number;
  cid: string;
  name: string;
  email: string;
  role: string;
  status: string;
  bio?: string;
  profile_picture?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;

  @media (max-width: 768px) {
    padding: 0 0.5rem;
    overflow-x: hidden;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  max-width: 500px;

  @media (max-width: 768px) {
    max-width: none;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  z-index: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    font-size: 0.9rem;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;

  @media (max-width: 768px) {
    padding: 0.75rem 0.5rem;
    border-radius: 8px;
  }
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #96885f;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (max-width: 768px) {
    font-size: 0.7rem;
    letter-spacing: 0.02em;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #96885f;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #7a6f4f;
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    gap: 0.25rem;
    min-width: 0;
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    width: 24px;
    height: 24px;
  }
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  background: #96885f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    font-size: 0.6rem;
  }
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;

  @media (max-width: 768px) {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 0.1rem;
  }
`;

const UserBio = styled.div`
  font-size: 0.85rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;

  @media (max-width: 768px) {
    font-size: 0.65rem;
    max-width: 80px;
  }
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 0.5rem;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    padding: 0.5rem 0;
  }
`;

const DetailLabel = styled.span`
  font-weight: 600;
  color: #333;
  min-width: 120px;

  @media (max-width: 768px) {
    min-width: unset;
    margin-bottom: 0.25rem;
  }
`;

const DetailValue = styled.span`
  color: #666;
  text-align: right;
  flex: 1;
  margin-left: 1rem;
  word-break: break-word;

  @media (max-width: 768px) {
    text-align: left;
    margin-left: 0;
  }
`;

const EditForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FormLabel = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
`;

const FormInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
`;

const FormSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
`;

const FormTextarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const FormButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'primary' ? `
    background: #96885f;
    color: white;
    
    &:hover {
      background: #7a6f4f;
    }
  ` : `
    background: #6c757d;
    color: white;
    
    &:hover {
      background: #5a6268;
    }
  `}
`;

const EditUserForm: React.FC<{ user: User; onSave: (user: User) => void; onCancel: () => void }> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    bio: user.bio || '',
    is_verified: user.is_verified,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...user, ...formData });
  };

  return (
    <EditForm onSubmit={handleSubmit}>
      <FormGroup>
        <FormLabel>Name</FormLabel>
        <FormInput
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </FormGroup>

      <FormGroup>
        <FormLabel>Email</FormLabel>
        <FormInput
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </FormGroup>

      <FormGroup>
        <FormLabel>Role</FormLabel>
        <FormSelect
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        >
          <option value="user">User</option>
          <option value="artist">Artist</option>
          <option value="admin">Admin</option>
        </FormSelect>
      </FormGroup>

      <FormGroup>
        <FormLabel>Status</FormLabel>
        <FormSelect
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </FormSelect>
      </FormGroup>

      <FormGroup>
        <FormLabel>Bio</FormLabel>
        <FormTextarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="User bio..."
        />
      </FormGroup>

      <FormGroup>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={formData.is_verified}
            onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
          />
          <FormLabel style={{ margin: 0 }}>Email Verified</FormLabel>
        </label>
      </FormGroup>

      <FormActions>
        <FormButton type="button" onClick={onCancel}>
          Cancel
        </FormButton>
        <FormButton type="submit" variant="primary">
          Save Changes
        </FormButton>
      </FormActions>
    </EditForm>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      breadcrumbs: [{ label: 'Admin', href: '/admin' }],
      currentPage: 'Users'
    }
  }
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Set empty array on error
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.cid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/admin/users/${updatedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update user: ${response.status} - ${errorText}`);
      }

      // Refresh the users list
      await fetchUsers();
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleCreateUser = async (userData: { name: string; email: string; role: string }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          sendInvitation: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      // Refresh the users list
      await fetchUsers();
      setShowCreateModal(false);
      
      // Show success message
      alert(`User invitation sent successfully to ${userData.email}`);
    } catch (error) {
      console.error('Failed to create user:', error);
      alert(error instanceof Error ? error.message : 'Failed to create user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        // Implement delete API call
        console.log('Delete user:', userId);
        setUsers(users.filter(user => user.id !== userId));
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <AdminLayout currentPage="users">
      <Container>
        <HeaderSection>
          <PageTitle>Users</PageTitle>
          <CreateButton onClick={() => setShowCreateModal(true)}>
            <FaPlus />
            Create User
          </CreateButton>
        </HeaderSection>

        <StatsContainer>
          <StatCard>
            <StatNumber>{users.length}</StatNumber>
            <StatLabel>Total Users</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{users.filter(u => u.profile_picture).length}</StatNumber>
            <StatLabel>With Profile Picture</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{users.filter(u => u.bio).length}</StatNumber>
            <StatLabel>With Bio</StatLabel>
          </StatCard>
        </StatsContainer>

        <SearchContainer>
          <SearchWrapper>
            <SearchIcon>
              <FaSearch />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search users by name, email, or CID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchWrapper>
        </SearchContainer>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <Td colSpan={6} style={{ display: 'table-cell' }}>
                    <LoadingMessage>Loading users...</LoadingMessage>
                  </Td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <Td colSpan={6} style={{ display: 'table-cell' }}>
                    <EmptyMessage>No users found</EmptyMessage>
                  </Td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <Td>
                      <UserCell>
                        <UserAvatar>
                          {user.profile_picture ? (
                            <img src={user.profile_picture} alt={user.name} />
                          ) : (
                            <DefaultAvatar>{user.name.charAt(0)}</DefaultAvatar>
                          )}
                        </UserAvatar>
                        <UserInfo>
                          <UserName>{user.name}</UserName>
                          {user.bio && <UserBio>{user.bio}</UserBio>}
                        </UserInfo>
                      </UserCell>
                    </Td>
                    <Td>{user.email}</Td>
                    <Td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: user.role === 'admin' ? '#dc3545' : user.role === 'artist' ? '#28a745' : '#6c757d',
                        color: 'white'
                      }}>
                        {user.role}
                      </span>
                    </Td>
                    <Td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        backgroundColor: user.status === 'active' ? '#28a745' : user.status === 'inactive' ? '#ffc107' : '#dc3545',
                        color: user.status === 'active' ? 'white' : '#333'
                      }}>
                        {user.status}
                      </span>
                    </Td>
                    <Td>{formatDate(user.created_at)}</Td>
                    <Td>
                      <ActionButtons>
                        <ActionButton onClick={() => handleViewUser(user)}>
                          <FaEye />
                        </ActionButton>
                        <ActionButton onClick={() => handleEditUser(user)}>
                          <FaEdit />
                        </ActionButton>
                        <ActionButton
                          onClick={() => handleDeleteUser(user.id)}
                          danger
                        >
                          <FaTrash />
                        </ActionButton>
                      </ActionButtons>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableContainer>

        {showUserModal && selectedUser && (
          <Modal
            isOpen={showUserModal}
            onClose={() => setShowUserModal(false)}
            title="User Details"
          >
            <DetailRow>
              <DetailLabel>Name:</DetailLabel>
              <DetailValue>{selectedUser.name}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Email:</DetailLabel>
              <DetailValue>{selectedUser.email}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>CID:</DetailLabel>
              <DetailValue>{selectedUser.cid}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Role:</DetailLabel>
              <DetailValue>{selectedUser.role}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Status:</DetailLabel>
              <DetailValue>{selectedUser.status}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Verified:</DetailLabel>
              <DetailValue>{selectedUser.is_verified ? 'Yes' : 'No'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Bio:</DetailLabel>
              <DetailValue>{selectedUser.bio || 'No bio provided'}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Joined:</DetailLabel>
              <DetailValue>{new Date(selectedUser.created_at).toLocaleString()}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>Last Updated:</DetailLabel>
              <DetailValue>{new Date(selectedUser.updated_at).toLocaleString()}</DetailValue>
            </DetailRow>
          </Modal>
        )}

        {showEditModal && editingUser && (
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title="Edit User"
          >
            <EditUserForm user={editingUser} onSave={handleUpdateUser} onCancel={() => setShowEditModal(false)} />
          </Modal>
        )}

        {showCreateModal && (
          <Modal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Create New User"
          >
            <CreateUserForm onSave={handleCreateUser} onCancel={() => setShowCreateModal(false)} />
          </Modal>
        )}
      </Container>
    </AdminLayout>
  );
}

const CreateUserForm: React.FC<{ onSave: (userData: { name: string; email: string; role: string }) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Name and email are required');
      return;
    }
    onSave(formData);
  };

  return (
    <EditForm onSubmit={handleSubmit}>
      <FormGroup>
        <FormLabel>Name *</FormLabel>
        <FormInput
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Enter user's full name"
        />
      </FormGroup>

      <FormGroup>
        <FormLabel>Email *</FormLabel>
        <FormInput
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="user@example.com"
        />
      </FormGroup>

      <FormGroup>
        <FormLabel>Role</FormLabel>
        <FormSelect
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        >
          <option value="user">User</option>
          <option value="artist">Artist</option>
          <option value="admin">Admin</option>
        </FormSelect>
      </FormGroup>

      <p style={{ color: '#666', fontSize: '0.9rem', margin: '1rem 0' }}>
        An invitation email will be sent to the user with instructions to create their account.
      </p>

      <FormActions>
        <FormButton type="button" onClick={onCancel}>
          Cancel
        </FormButton>
        <FormButton type="submit" variant="primary">
          Send Invitation
        </FormButton>
      </FormActions>
    </EditForm>
  );
}; 