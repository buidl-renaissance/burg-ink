'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { Modal } from '@/components/Modal';
import { FaSearch, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { GetServerSideProps } from 'next';
import { TableContainer, Table, Th, Td, ActionButton, LoadingMessage, EmptyMessage, ActionButtons } from '@/components/AdminTableStyles';

interface User {
  id: number;
  cid: string;
  name: string;
  email: string;
  bio?: string;
  profile_picture?: string;
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockUsers: User[] = [
        {
          id: 1,
          cid: 'user_001',
          name: 'John Doe',
          email: 'john@example.com',
          bio: 'Artist and designer',
          profile_picture: '/api/placeholder/150/150',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          cid: 'user_002',
          name: 'Jane Smith',
          email: 'jane@example.com',
          bio: 'Digital artist',
          created_at: '2024-01-20T14:20:00Z',
          updated_at: '2024-01-20T14:20:00Z',
        },
        {
          id: 3,
          cid: 'user_003',
          name: 'Mike Johnson',
          email: 'mike@example.com',
          created_at: '2024-01-25T09:15:00Z',
          updated_at: '2024-01-25T09:15:00Z',
        },
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
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
    // Implement edit functionality
    console.log('Edit user:', user);
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
                <Th>Joined</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <Td colSpan={5} style={{ display: 'table-cell' }}>
                    <LoadingMessage>Loading users...</LoadingMessage>
                  </Td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <Td colSpan={5} style={{ display: 'table-cell' }}>
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
      </Container>
    </AdminLayout>
  );
} 