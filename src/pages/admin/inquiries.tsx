'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '../../components/AdminLayout';
import { FaEye } from 'react-icons/fa';
import { ActionButton } from '../../components/AdminTableStyles';

const PageContainer = styled.div`
  padding: 2rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
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

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
    text-align: center;
  }
`;

const Filters = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
`;

const Select = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 0.85rem;
  background: white;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  
  &:hover {
    border-color: #96885f;
  }
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
  }
  
  &:disabled {
    background: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
  }
`;


const TableContainer = styled.div`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  background: white;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
`;

const Th = styled.th`
  background: #f8f9fa;
  padding: 1.25rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #e9ecef;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Td = styled.td`
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
  font-size: 0.9rem;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
  min-width: 80px;
  text-align: center;
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
  border: 1px solid ${({ status }) => {
    switch (status) {
      case 'new': return '#bbdefb';
      case 'contacted': return '#ffcc02';
      case 'completed': return '#c8e6c9';
      case 'archived': return '#e0e0e0';
      default: return '#e0e0e0';
    }
  }};
`;

const MessagePreview = styled.div`
  max-width: 300px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  line-height: 1.4;
  font-size: 0.85rem;
  max-height: 2.8rem; /* Ensure exactly 2 lines */
  
  &:hover {
    background: #f8f9fa;
    border-color: #dee2e6;
    color: #495057;
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const EmailLink = styled.a`
  color: #007bff;
  text-decoration: none;
  font-weight: 400;
  font-size: 0.8rem;
  transition: color 0.2s ease;
  
  &:hover {
    color: #0056b3;
    text-decoration: underline;
  }
`;

const PhoneLink = styled.a`
  color: #6c757d;
  text-decoration: none;
  font-size: 0.75rem;
  transition: color 0.2s ease;
  
  &:hover {
    color: #495057;
    text-decoration: underline;
  }
`;


const MobileCard = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    background: white;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e9ecef;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }
  }
`;

const CardBottomBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e9ecef;
`;

const CardDate = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
`;

const CardStatus = styled.span<{ status: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  border: 1px solid ${({ status }) => {
    switch (status) {
      case 'new': return '#bbdefb';
      case 'contacted': return '#ffcc02';
      case 'completed': return '#c8e6c9';
      case 'archived': return '#e0e0e0';
      default: return '#e0e0e0';
    }
  }};
`;

const CardViewButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: #7a6f4f;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const CardContact = styled.div`
  margin-bottom: 0.75rem;
`;

const CardName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: #2c3e50;
  margin-bottom: 0.25rem;
`;

const CardEmail = styled.a`
  color: #007bff;
  text-decoration: none;
  font-size: 0.8rem;
  display: block;
  margin-bottom: 0.125rem;
  
  &:hover {
    color: #0056b3;
    text-decoration: underline;
  }
`;

const CardPhone = styled.a`
  color: #6c757d;
  text-decoration: none;
  font-size: 0.75rem;
  display: block;
  margin-bottom: 0.125rem;
  
  &:hover {
    color: #495057;
    text-decoration: underline;
  }
`;

const CardType = styled.div`
  font-size: 0.7rem;
  color: #6c757d;
  text-transform: capitalize;
  margin-bottom: 0.125rem;
`;

const CardMessage = styled.div`
  color: #666;
  font-size: 0.8rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const DesktopTable = styled.div`
  @media (max-width: 768px) {
    display: none;
  }
`;

const DateDisplay = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const DateText = styled.div`
  color: #2c3e50;
  font-size: 0.9rem;
  font-weight: 600;
`;

const TimeText = styled.div`
  color: #6c757d;
  font-size: 0.75rem;
  font-weight: 400;
`;

const NameDisplay = styled.div`
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
`;

const TypeDisplay = styled.div`
  text-transform: capitalize;
  color: #6c757d;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  display: inline-block;
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
  padding: 0;
  border-radius: 12px;
  max-width: 700px;
  width: 90%;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  
  @media (max-width: 768px) {
    width: 95%;
    max-height: 90vh;
    border-radius: 8px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
  
  @media (max-width: 768px) {
    padding: 1rem 1.5rem;
    border-radius: 8px 8px 0 0;
  }
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    color: #495057;
    background: #e9ecef;
  }
  
  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 1.25rem;
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const InlineButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
`;

const SaveButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  background: #96885f;
  color: white;
  
  &:hover {
    background: #7a6f4f;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  @media (max-width: 768px) {
    padding: 0.875rem 1.25rem;
    font-size: 0.85rem;
    width: 100%;
  }
`;

const ModalSection = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const InquiryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
`;

const InquiryTitle = styled.div`
  font-size: 1.2rem;
  color: #2c3e50;
  line-height: 1.4;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InquirySubtitle = styled.div`
  font-size: 1rem;
  color: #6c757d;
  font-weight: 400;
`;

const ContactHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 2rem;
`;

const ContactName = styled.div`
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
`;

const ContactEmail = styled.a`
  color: #96885f;
  text-decoration: none;
  font-size: 0.9rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ContactPhone = styled.a`
  color: #6c757d;
  text-decoration: none;
  font-size: 0.85rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
`;

const MessageContainer = styled.div`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  white-space: pre-wrap;
  line-height: 1.5;
  color: #495057;
  font-size: 0.95rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.1);
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

  const fetchInquiries = useCallback(async () => {
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
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, typeFilter, fetchInquiries]);


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
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <AdminLayout currentPage="inquiries">
        <PageContainer>
          <LoadingSpinner>Loading inquiries...</LoadingSpinner>
        </PageContainer>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentPage="inquiries">
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

        <DesktopTable>
          <TableContainer>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Contact</Th>
                  <Th>Status</Th>
                  <Th>Type</Th>
                  <Th>Message</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id}>
                    <Td>
                      <DateDisplay>
                        <DateText>{formatDateShort(inquiry.created_at)}</DateText>
                        <TimeText>{formatTime(inquiry.created_at)}</TimeText>
                      </DateDisplay>
                    </Td>
                    <Td>
                      <ContactInfo>
                        <NameDisplay>{inquiry.name}</NameDisplay>
                        <EmailLink href={`mailto:${inquiry.email}`}>
                          {inquiry.email}
                        </EmailLink>
                        {inquiry.phone && (
                          <PhoneLink href={`tel:${inquiry.phone}`}>
                            {inquiry.phone}
                          </PhoneLink>
                        )}
                      </ContactInfo>
                    </Td>
                    <Td>
                      <StatusBadge status={inquiry.status}>
                        {inquiry.status}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <TypeDisplay>{inquiry.inquiry_type}</TypeDisplay>
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
                      <ActionButton
                        className="view"
                        onClick={() => {
                          setSelectedInquiry(inquiry);
                          setIsModalOpen(true);
                        }}
                        disabled={updating}
                        title="View inquiry details"
                      >
                        <FaEye />
                      </ActionButton>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>
        </DesktopTable>

        {/* Mobile Card Layout */}
        {inquiries.map((inquiry) => (
          <MobileCard key={inquiry.id}>
            <CardContact>
              <CardName>{inquiry.name}</CardName>
              <CardEmail href={`mailto:${inquiry.email}`}>
                {inquiry.email}
              </CardEmail>
              {inquiry.phone && (
                <CardPhone href={`tel:${inquiry.phone}`}>
                  {inquiry.phone}
                </CardPhone>
              )}
              <CardType>{inquiry.inquiry_type}</CardType>
            </CardContact>
            
            <CardMessage>
              {inquiry.message}
            </CardMessage>
            
            <CardBottomBar>
              <CardDate>
                {formatDateShort(inquiry.created_at)} • {formatTime(inquiry.created_at)}
              </CardDate>
              <CardStatus status={inquiry.status}>
                {inquiry.status}
              </CardStatus>
              <CardViewButton
                onClick={() => {
                  setSelectedInquiry(inquiry);
                  setIsModalOpen(true);
                }}
                title="View inquiry details"
              >
                <FaEye />
                View
              </CardViewButton>
            </CardBottomBar>
          </MobileCard>
        ))}

        {inquiries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No inquiries found.
          </div>
        )}

        <Modal isOpen={isModalOpen}>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Inquiry Details</ModalTitle>
              <CloseButton onClick={() => setIsModalOpen(false)}>&times;</CloseButton>
            </ModalHeader>
            
            {selectedInquiry && (
              <>
                <ModalBody>
                  <InquiryHeader>
                    <InquiryTitle>
                      <div>
                        <b style={{ textTransform: 'capitalize' }}>{selectedInquiry.inquiry_type}</b> Inquiry Submitted
                      </div>
                      <InquirySubtitle>
                        <b>{formatDate(selectedInquiry.created_at)}</b>
                      </InquirySubtitle>
                    </InquiryTitle>
                    <StatusBadge status={selectedInquiry.status}>
                      {selectedInquiry.status}
                    </StatusBadge>
                  </InquiryHeader>

                  <ContactHeader>
                    <ContactName>{selectedInquiry.name}</ContactName>
                    <ContactEmail href={`mailto:${selectedInquiry.email}`}>
                      {selectedInquiry.email}
                    </ContactEmail>
                    {selectedInquiry.phone && (
                      <ContactPhone href={`tel:${selectedInquiry.phone}`}>
                        {selectedInquiry.phone}
                      </ContactPhone>
                    )}
                  </ContactHeader>

                  <ModalSection>
                    <SectionTitle>Message</SectionTitle>
                    <MessageContainer>
                      {selectedInquiry.message}
                    </MessageContainer>
                  </ModalSection>

            <ModalSection>
              <SectionTitle>Internal Notes</SectionTitle>
              <FormGroup>
                <Label>Notes</Label>
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
                <InlineButtonContainer>
                  <SaveButton
                    onClick={() => handleNotesUpdate(selectedInquiry.id, selectedInquiry.notes || '')}
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save Notes'}
                  </SaveButton>
                </InlineButtonContainer>
              </FormGroup>
            </ModalSection>
          </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      </PageContainer>
    </AdminLayout>
  );
};

export default InquiriesPage;
