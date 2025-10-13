'use client';

import { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '../../components/AdminLayout';

const PageContainer = styled.div`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
`;

const Filters = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Th = styled.th`
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #dee2e6;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  vertical-align: top;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  background: ${({ status }) => {
    switch (status) {
      case 'new': return '#e3f2fd';
      case 'contacted': return '#fff3e0';
      case 'completed': return '#e8f5e8';
      case 'archived': return '#f5f5f5';
      default: return '#f5f5f5';
    }
  }};
  color: ${({ status }) => {
    switch (status) {
      case 'new': return '#1976d2';
      case 'contacted': return '#f57c00';
      case 'completed': return '#388e3c';
      case 'archived': return '#757575';
      default: return '#757575';
    }
  }};
`;

const MessagePreview = styled.div`
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #666;
`;

const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  
  &:hover {
    color: #333;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 100px;
  resize: vertical;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-right: 0.5rem;
  
  background: ${({ variant }) => variant === 'primary' ? '#007bff' : '#6c757d'};
  color: white;
  
  &:hover {
    background: ${({ variant }) => variant === 'primary' ? '#0056b3' : '#545b62'};
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

interface Inquiry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  inquiry_type: string;
  message: string;
  status: string;
  email_sent: number;
  email_sent_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const InquiriesPage: FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchInquiries = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      
      const response = await fetch(`/api/inquiries?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setInquiries(data.inquiries);
      } else {
        console.error('Failed to fetch inquiries:', data.error);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, typeFilter, fetchInquiries]);

  const handleStatusUpdate = async (inquiryId: number, newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update the inquiry in the local state
        setInquiries(prev => 
          prev.map(inquiry => 
            inquiry.id === inquiryId 
              ? { ...inquiry, status: newStatus }
              : inquiry
          )
        );
      } else {
        console.error('Failed to update inquiry status');
      }
    } catch (error) {
      console.error('Error updating inquiry status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleNotesUpdate = async (inquiryId: number, notes: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        // Update the inquiry in the local state
        setInquiries(prev => 
          prev.map(inquiry => 
            inquiry.id === inquiryId 
              ? { ...inquiry, notes }
              : inquiry
          )
        );
        setIsModalOpen(false);
      } else {
        console.error('Failed to update inquiry notes');
      }
    } catch (error) {
      console.error('Error updating inquiry notes:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <PageContainer>
          <LoadingSpinner>Loading inquiries...</LoadingSpinner>
        </PageContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageContainer>
        <Header>
          <Title>Inquiries</Title>
        </Header>

        <Filters>
          <div>
            <Label>Status:</Label>
            <Select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </Select>
          </div>
          
          <div>
            <Label>Type:</Label>
            <Select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="tattoo">Tattoo</option>
              <option value="artwork">Artwork</option>
              <option value="collaboration">Collaboration</option>
              <option value="other">Other</option>
            </Select>
          </div>
        </Filters>

        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Message</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id}>
                <Td>{formatDate(inquiry.created_at)}</Td>
                <Td>{inquiry.name}</Td>
                <Td>
                  <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
                  {inquiry.phone && (
                    <div>
                      <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>
                    </div>
                  )}
                </Td>
                <Td style={{ textTransform: 'capitalize' }}>{inquiry.inquiry_type}</Td>
                <Td>
                  <StatusBadge status={inquiry.status}>
                    {inquiry.status}
                  </StatusBadge>
                </Td>
                <Td>
                  <MessagePreview 
                    onClick={() => {
                      setSelectedInquiry(inquiry);
                      setIsModalOpen(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {inquiry.message}
                  </MessagePreview>
                </Td>
                <Td>
                  <Select
                    value={inquiry.status}
                    onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value)}
                    disabled={updating}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </Select>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>

        {inquiries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No inquiries found.
          </div>
        )}

        <Modal isOpen={isModalOpen}>
          <ModalContent>
            <ModalHeader>
              <h2>Inquiry Details</h2>
              <CloseButton onClick={() => setIsModalOpen(false)}>&times;</CloseButton>
            </ModalHeader>
            
            {selectedInquiry && (
              <div>
                <FormGroup>
                  <Label>Name:</Label>
                  <div>{selectedInquiry.name}</div>
                </FormGroup>
                
                <FormGroup>
                  <Label>Email:</Label>
                  <div>
                    <a href={`mailto:${selectedInquiry.email}`}>
                      {selectedInquiry.email}
                    </a>
                  </div>
                </FormGroup>
                
                {selectedInquiry.phone && (
                  <FormGroup>
                    <Label>Phone:</Label>
                    <div>
                      <a href={`tel:${selectedInquiry.phone}`}>
                        {selectedInquiry.phone}
                      </a>
                    </div>
                  </FormGroup>
                )}
                
                <FormGroup>
                  <Label>Type:</Label>
                  <div style={{ textTransform: 'capitalize' }}>
                    {selectedInquiry.inquiry_type}
                  </div>
                </FormGroup>
                
                <FormGroup>
                  <Label>Date:</Label>
                  <div>{formatDate(selectedInquiry.created_at)}</div>
                </FormGroup>
                
                <FormGroup>
                  <Label>Message:</Label>
                  <div style={{ 
                    whiteSpace: 'pre-wrap', 
                    background: '#f8f9fa', 
                    padding: '1rem',
                    borderRadius: '4px',
                    marginTop: '0.5rem'
                  }}>
                    {selectedInquiry.message}
                  </div>
                </FormGroup>
                
                <FormGroup>
                  <Label>Notes:</Label>
                  <TextArea
                    value={selectedInquiry.notes || ''}
                    onChange={(e) => {
                      setSelectedInquiry({
                        ...selectedInquiry,
                        notes: e.target.value
                      });
                    }}
                    placeholder="Add internal notes about this inquiry..."
                  />
                </FormGroup>
                
                <div style={{ marginTop: '1rem' }}>
                  <Button 
                    variant="primary"
                    onClick={() => handleNotesUpdate(selectedInquiry.id, selectedInquiry.notes || '')}
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save Notes'}
                  </Button>
                  <Button onClick={() => setIsModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </ModalContent>
        </Modal>
      </PageContainer>
    </AdminLayout>
  );
};

export default InquiriesPage;
