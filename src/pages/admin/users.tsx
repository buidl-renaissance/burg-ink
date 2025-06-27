'use client';

import { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { Modal } from '@/components/Modal';
import { FaSearch, FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa';
import { LoadingMessage, EmptyMessage } from '@/components/Styled';

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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.75rem;
    text-align: center;
  }
`;

const AddButton = styled.button`
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

  @media (max-width: 768px) {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    justify-content: center;
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

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 8px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: #c1c1c1 transparent;
    margin: 0 -0.5rem;
    padding: 0 0.5rem;
    
    &::-webkit-scrollbar {
      height: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  @media (max-width: 768px) {
    table-layout: fixed;
  }
`;

const Th = styled.th`
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e9ecef;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (max-width: 768px) {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
    
    &:nth-child(1) { width: 45%; } /* User */
    &:nth-child(2) { width: 0; display: none; } /* Email - hidden on mobile */
    &:nth-child(3) { width: 0; display: none; } /* CID - hidden on mobile */
    &:nth-child(4) { width: 25%; } /* Joined */
    &:nth-child(5) { width: 30%; } /* Actions */
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;

  @media (max-width: 768px) {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    
    &:nth-child(2), &:nth-child(3) {
      display: none;
    }
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

const CidBadge = styled.span`
  background: #f8f9fa;
  color: #6c757d;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 0.6rem;
    padding: 0.1rem 0.2rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    gap: 0.15rem;
    flex-wrap: nowrap;
    justify-content: flex-start;
  }
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  color: #6c757d;
  ${({ danger }) => danger && css`
    color: #dc3545;
  `}
  &:hover {
    background: #f8f9fa;
  }

  &.view {
    color: #28a745;
  }

  &.edit {
    color: #007bff;
  }

  &.delete {
    color: #dc3545;
  }

  @media (max-width: 768px) {
    padding: 0.25rem;
    font-size: 0.7rem;
    min-width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
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
        <Header>
          <Title>Users Management</Title>
          <AddButton>
            <FaPlus />
            Add User
          </AddButton>
        </Header>

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

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>CID</Th>
                <Th>Joined</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ display: 'table-cell' }}>
                    <LoadingMessage>Loading users...</LoadingMessage>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ display: 'table-cell' }}>
                    <EmptyMessage>No users found</EmptyMessage>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <CidBadge>{user.cid}</CidBadge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
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
                    </TableCell>
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