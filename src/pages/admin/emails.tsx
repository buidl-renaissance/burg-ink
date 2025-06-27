'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { FaSearch, FaEdit, FaTrash, FaEye, FaPlus, FaEnvelope, FaPaperPlane, FaClock } from 'react-icons/fa';
import { GetServerSideProps } from 'next';
import { TableContainer, Table, Th, Td, ActionButton, LoadingMessage, EmptyMessage, ActionButtons } from '@/components/AdminTableStyles';

interface Email {
  id: number;
  subject: string;
  recipient: string;
  sender: string;
  content: string;
  status: 'draft' | 'sent' | 'failed' | 'scheduled';
  scheduled_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      breadcrumbs: [{ label: 'Admin', href: '/admin' }],
      currentPage: 'Emails'
    }
  }
};

export default function AdminEmails() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockEmails: Email[] = [
        {
          id: 1,
          subject: 'Welcome to Burg Ink!',
          recipient: 'john@example.com',
          sender: 'noreply@burgink.com',
          content: 'Welcome to our community! We\'re excited to have you join us.',
          status: 'sent',
          sent_at: '2024-01-15T10:30:00Z',
          created_at: '2024-01-15T10:25:00Z',
          updated_at: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          subject: 'Event Reminder: Arts for the Earth',
          recipient: 'jane@example.com',
          sender: 'events@burgink.com',
          content: 'Don\'t forget about our upcoming event this weekend!',
          status: 'scheduled',
          scheduled_at: '2024-04-10T09:00:00Z',
          created_at: '2024-01-20T14:20:00Z',
          updated_at: '2024-01-20T14:20:00Z',
        },
        {
          id: 3,
          subject: 'New Artwork Available',
          recipient: 'mike@example.com',
          sender: 'gallery@burgink.com',
          content: 'Check out the latest artwork from our featured artists.',
          status: 'draft',
          created_at: '2024-01-25T09:15:00Z',
          updated_at: '2024-01-25T09:15:00Z',
        },
        {
          id: 4,
          subject: 'Newsletter - January 2024',
          recipient: 'newsletter@burgink.com',
          sender: 'newsletter@burgink.com',
          content: 'Monthly newsletter with updates and featured content.',
          status: 'failed',
          created_at: '2024-01-30T16:45:00Z',
          updated_at: '2024-01-30T16:50:00Z',
        },
      ];
      
      setEmails(mockEmails);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.sender.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || email.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewEmail = (email: Email) => {
    setSelectedEmail(email);
    setShowEmailModal(true);
  };

  const handleEditEmail = (email: Email) => {
    // Implement edit functionality
    console.log('Edit email:', email);
  };

  const handleDeleteEmail = async (emailId: number) => {
    if (confirm('Are you sure you want to delete this email?')) {
      try {
        // Implement delete API call
        console.log('Delete email:', emailId);
        setEmails(emails.filter(email => email.id !== emailId));
      } catch (error) {
        console.error('Failed to delete email:', error);
      }
    }
  };

  const handleSendEmail = async (emailId: number) => {
    try {
      // Implement send API call
      console.log('Send email:', emailId);
      setEmails(emails.map(email => 
        email.id === emailId 
          ? { ...email, status: 'sent', sent_at: new Date().toISOString() }
          : email
      ));
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return '#28a745';
      case 'scheduled': return '#007bff';
      case 'draft': return '#ffc107';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return 'Sent';
      case 'scheduled': return 'Scheduled';
      case 'draft': return 'Draft';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <AdminLayout currentPage="emails">
      <Container>
        <Header>
          <Title>Email Management</Title>
          <AddButton>
            <FaPlus />
            Compose Email
          </AddButton>
        </Header>

        <FiltersContainer>
          <SearchWrapper>
            <SearchIcon>
              <FaSearch />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search emails by subject, recipient, or sender..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchWrapper>
          
          <StatusFilter>
            <StatusSelect
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </StatusSelect>
          </StatusFilter>
        </FiltersContainer>

        <StatsContainer>
          <StatCard>
            <StatNumber>{emails.length}</StatNumber>
            <StatLabel>Total Emails</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{emails.filter(e => e.status === 'sent').length}</StatNumber>
            <StatLabel>Sent</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{emails.filter(e => e.status === 'draft').length}</StatNumber>
            <StatLabel>Drafts</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{emails.filter(e => e.status === 'scheduled').length}</StatNumber>
            <StatLabel>Scheduled</StatLabel>
          </StatCard>
        </StatsContainer>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th>Subject</Th>
                <Th>Recipient</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <Td colSpan={5}>
                    <LoadingMessage>Loading emails...</LoadingMessage>
                  </Td>
                </tr>
              ) : filteredEmails.length === 0 ? (
                <tr>
                  <Td colSpan={5}>
                    <EmptyMessage>No emails found</EmptyMessage>
                  </Td>
                </tr>
              ) : (
                filteredEmails.map((email) => (
                  <tr key={email.id}>
                    <Td>
                      <SubjectCell>
                        <SubjectText>{email.subject}</SubjectText>
                        <SenderText>From: {email.sender}</SenderText>
                      </SubjectCell>
                    </Td>
                    <Td>
                      <RecipientCell>
                        <FaEnvelope />
                        <span>{email.recipient}</span>
                      </RecipientCell>
                    </Td>
                    <Td>
                      <StatusCell>
                        <StatusBadge color={getStatusColor(email.status)}>
                          {getStatusLabel(email.status)}
                        </StatusBadge>
                        {email.status === 'scheduled' && email.scheduled_at && (
                          <ScheduledTime>
                            <FaClock />
                            {formatDateTime(email.scheduled_at)}
                          </ScheduledTime>
                        )}
                      </StatusCell>
                    </Td>
                    <Td>
                      <DateCell>
                        <DateText>{formatDate(email.created_at)}</DateText>
                        {email.sent_at && (
                          <SentTime>Sent: {formatDateTime(email.sent_at)}</SentTime>
                        )}
                      </DateCell>
                    </Td>
                    <Td>
                      <ActionButtons>
                        <ActionButton onClick={() => handleViewEmail(email)}>
                          <FaEye />
                        </ActionButton>
                        <ActionButton onClick={() => handleEditEmail(email)}>
                          <FaEdit />
                        </ActionButton>
                        {email.status === 'draft' && (
                          <ActionButton onClick={() => handleSendEmail(email.id)}>
                            <FaPaperPlane />
                          </ActionButton>
                        )}
                        <ActionButton 
                          onClick={() => handleDeleteEmail(email.id)}
                          className="delete"
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

        {showEmailModal && selectedEmail && (
          <EmailModal onClose={() => setShowEmailModal(false)} email={selectedEmail} />
        )}
      </Container>
    </AdminLayout>
  );
}

function EmailModal({ email, onClose }: { email: Email; onClose: () => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return '#28a745';
      case 'scheduled': return '#007bff';
      case 'draft': return '#ffc107';
      case 'failed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return 'Sent';
      case 'scheduled': return 'Scheduled';
      case 'draft': return 'Draft';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Email Details</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <DetailRow>
            <DetailLabel>Subject:</DetailLabel>
            <DetailValue>{email.subject}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>From:</DetailLabel>
            <DetailValue>{email.sender}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>To:</DetailLabel>
            <DetailValue>{email.recipient}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Status:</DetailLabel>
            <DetailValue>
              <StatusBadge color={getStatusColor(email.status)}>
                {getStatusLabel(email.status)}
              </StatusBadge>
            </DetailValue>
          </DetailRow>
          {email.scheduled_at && (
            <DetailRow>
              <DetailLabel>Scheduled:</DetailLabel>
              <DetailValue>{new Date(email.scheduled_at).toLocaleString()}</DetailValue>
            </DetailRow>
          )}
          {email.sent_at && (
            <DetailRow>
              <DetailLabel>Sent:</DetailLabel>
              <DetailValue>{new Date(email.sent_at).toLocaleString()}</DetailValue>
            </DetailRow>
          )}
          <DetailRow>
            <DetailLabel>Created:</DetailLabel>
            <DetailValue>{new Date(email.created_at).toLocaleString()}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Updated:</DetailLabel>
            <DetailValue>{new Date(email.updated_at).toLocaleString()}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Content:</DetailLabel>
            <DetailValue>
              <EmailContent>{email.content}</EmailContent>
            </DetailValue>
          </DetailRow>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
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
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    justify-content: center;
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
`;

const SearchWrapper = styled.div`
  flex: 1;
  position: relative;
  min-width: 300px;

  @media (max-width: 768px) {
    min-width: auto;
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

const StatusFilter = styled.div`
  min-width: 150px;

  @media (max-width: 768px) {
    min-width: auto;
  }
`;

const StatusSelect = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #96885f;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
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
    padding: 1rem;
  }
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #96885f;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const SubjectCell = styled.div`
  padding: 1rem;
`;

const SubjectText = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
`;

const SenderText = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
`;

const RecipientCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #6c757d;
  font-size: 0.9rem;
`;

const StatusCell = styled.div`
  padding: 1rem;
`;

const StatusBadge = styled.span<{ color: string }>`
  background: ${props => props.color};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 0.5rem;
`;

const ScheduledTime = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #6c757d;
`;

const DateCell = styled.div`
  padding: 1rem;
`;

const DateText = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
`;

const SentTime = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  
  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.div`
  font-weight: 600;
  color: #333;
  width: 120px;
  flex-shrink: 0;
`;

const DetailValue = styled.div`
  color: #6c757d;
  flex: 1;
`;

const EmailContent = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #96885f;
  white-space: pre-wrap;
  line-height: 1.6;
`;