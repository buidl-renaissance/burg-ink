'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { ContactForm, ContactFormRef } from '@/components/ContactForm';
import { FaPlus, FaEdit, FaTrash, FaEye, FaDownload, FaBuilding, FaTimes, FaCheck, FaPhone } from 'react-icons/fa';

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  source: string;
  lifecycle_stage: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
  notes?: string;
  avatar_url?: string;
  is_active: number;
  last_contacted_at?: string;
  created_at: string;
  updated_at: string;
}

interface ContactTag {
  id: number;
  name: string;
  color: string;
  description?: string;
  created_at: string;
}

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;

  @media (max-width: 768px) {
    padding: 0 0.5rem;
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
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    text-align: center;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
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

const FiltersContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }
`;

const SearchInput = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 250px;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }

  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
  }
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }

  @media (max-width: 768px) {
    min-width: auto;
    width: 100%;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  
  ${({ variant }) => {
    switch (variant) {
      case 'primary':
        return `
          background: #96885f;
          color: white;
          &:hover { background: #7a6f4d; }
        `;
      case 'danger':
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: #6c757d;
          color: white;
          &:hover { background: #5a6268; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
    font-size: 0.9rem;
    justify-content: center;
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
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
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
  font-size: 0.9rem;
`;

const ContactCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #96885f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
`;

const ContactEmail = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
`;

const StatusBadge = styled.span<{ stage: string }>`
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
  min-width: 80px;
  text-align: center;
  background: ${({ stage }) => {
    switch (stage) {
      case 'lead': return '#e3f2fd';
      case 'prospect': return '#fff3e0';
      case 'customer': return '#e8f5e8';
      case 'advocate': return '#f3e5f5';
      default: return '#f5f5f5';
    }
  }};
  color: ${({ stage }) => {
    switch (stage) {
      case 'lead': return '#1976d2';
      case 'prospect': return '#f57c00';
      case 'customer': return '#388e3c';
      case 'advocate': return '#7b1fa2';
      default: return '#757575';
    }
  }};
`;

const Tag = styled.span<{ color: string }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  background: ${({ color }) => color}20;
  color: ${({ color }) => color};
  border: 1px solid ${({ color }) => color}40;
  margin: 0.125rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  
  ${({ variant }) => {
    switch (variant) {
      case 'primary':
        return `
          background: #96885f;
          color: white;
          &:hover { background: #7a6f4d; }
        `;
      case 'danger':
        return `
          background: #dc3545;
          color: white;
          &:hover { background: #c82333; }
        `;
      default:
        return `
          background: #e9ecef;
          color: #495057;
          &:hover { background: #dee2e6; }
        `;
    }
  }}
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #6c757d;
`;

export default function AdminContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [tags, setTags] = useState<ContactTag[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    leads: 0,
    customers: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createFormRef = useRef<ContactFormRef>(null);
  const editFormRef = useRef<ContactFormRef>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (stageFilter) params.append('stage', stageFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      if (tagFilter) params.append('tags', tagFilter);
      
      const response = await fetch(`/api/contacts?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setContacts(data.contacts);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch contacts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, stageFilter, sourceFilter, tagFilter]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/contacts/tags');
      const data = await response.json();
      
      if (response.ok) {
        setTags(data.tags);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchTags();
  }, [fetchContacts, fetchTags]);

  const handleCreateContact = async (contactData: { id?: number; first_name: string; last_name: string; email: string; phone?: string; company?: string; job_title?: string; source: string; lifecycle_stage: string; tags: string[]; custom_fields: Record<string, unknown>; notes?: string; avatar_url?: string; is_active: number }) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        fetchContacts();
        setShowCreateModal(false);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert('Error creating contact');
    }
  };

  const handleCreateSubmit = () => {
    if (createFormRef.current) {
      createFormRef.current.submitForm();
    }
  };

  const handleEditSubmit = () => {
    if (editFormRef.current) {
      editFormRef.current.submitForm();
    }
  };

  const handleUpdateContact = async (contactData: { id?: number; first_name: string; last_name: string; email: string; phone?: string; company?: string; job_title?: string; source: string; lifecycle_stage: string; tags: string[]; custom_fields: Record<string, unknown>; notes?: string; avatar_url?: string; is_active: number }) => {
    if (!selectedContact?.id) return;
    
    try {
      const response = await fetch(`/api/contacts/${selectedContact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });

      if (response.ok) {
        fetchContacts();
        setShowContactModal(false);
        setSelectedContact(null);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch {
      alert('Error updating contact');
    }
  };

  const handleDeleteContact = async (contactId: number) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        const response = await fetch(`/api/contacts/${contactId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          fetchContacts();
        } else {
          const data = await response.json();
          alert(`Error: ${data.error}`);
        }
    } catch {
      alert('Error deleting contact');
    }
    }
  };

  const handleExportContacts = async () => {
    try {
      const params = new URLSearchParams();
      params.append('format', 'csv');
      if (searchTerm) params.append('search', searchTerm);
      if (stageFilter) params.append('stage', stageFilter);
      if (sourceFilter) params.append('source', sourceFilter);
      if (tagFilter) params.append('tags', tagFilter);
      
      const response = await fetch(`/api/contacts/export?${params.toString()}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch {
      alert('Error exporting contacts');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <AdminLayout currentPage="contacts">
      <Container>
        <Header>
          <Title>Contact Management</Title>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button onClick={() => setShowCreateModal(true)}>
              <FaPlus /> Add Contact
            </Button>
            <Button variant="secondary" onClick={handleExportContacts}>
              <FaDownload /> Export
            </Button>
          </div>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatNumber>{stats.total}</StatNumber>
            <StatLabel>Total Contacts</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.active}</StatNumber>
            <StatLabel>Active Contacts</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.leads}</StatNumber>
            <StatLabel>Leads</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{stats.customers}</StatNumber>
            <StatLabel>Customers</StatLabel>
          </StatCard>
        </StatsGrid>

        <FiltersContainer>
          <SearchInput
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
            <option value="">All Stages</option>
            <option value="lead">Lead</option>
            <option value="prospect">Prospect</option>
            <option value="customer">Customer</option>
            <option value="advocate">Advocate</option>
          </Select>
          <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="social">Social Media</option>
            <option value="event">Event</option>
            <option value="import">Import</option>
            <option value="manual">Manual</option>
          </Select>
          <Select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">All Tags</option>
            {tags.map(tag => (
              <option key={tag.id} value={tag.name}>{tag.name}</option>
            ))}
          </Select>
        </FiltersContainer>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th>Contact</Th>
                <Th>Company</Th>
                <Th>Stage</Th>
                <Th>Tags</Th>
                <Th>Source</Th>
                <Th>Last Contacted</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <Td colSpan={7}>
                    <LoadingMessage>Loading contacts...</LoadingMessage>
                  </Td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <Td colSpan={7}>
                    <EmptyMessage>No contacts found</EmptyMessage>
                  </Td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id}>
                    <Td>
                      <ContactCell>
                        <Avatar>
                          {contact.avatar_url ? (
                            <img src={contact.avatar_url} alt={`${contact.first_name} ${contact.last_name}`} />
                          ) : (
                            getInitials(contact.first_name, contact.last_name)
                          )}
                        </Avatar>
                        <ContactInfo>
                          <ContactName>{contact.first_name} {contact.last_name}</ContactName>
                          <ContactEmail>{contact.email}</ContactEmail>
                          {contact.phone && (
                            <div style={{ fontSize: '0.8rem', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FaPhone /> {contact.phone}
                            </div>
                          )}
                        </ContactInfo>
                      </ContactCell>
                    </Td>
                    <Td>
                      {contact.company && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FaBuilding style={{ color: '#6c757d', fontSize: '0.8rem' }} />
                          {contact.company}
                          {contact.job_title && (
                            <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                              {contact.job_title}
                            </div>
                          )}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <StatusBadge stage={contact.lifecycle_stage}>
                        {contact.lifecycle_stage}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {contact.tags.map((tag, index) => {
                          const tagData = tags.find(t => t.name === tag);
                          return (
                            <Tag key={index} color={tagData?.color || '#96885f'}>
                              {tag}
                            </Tag>
                          );
                        })}
                      </div>
                    </Td>
                    <Td>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#6c757d',
                        textTransform: 'capitalize'
                      }}>
                        {contact.source}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                        {contact.last_contacted_at 
                          ? new Date(contact.last_contacted_at).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </Td>
                    <Td>
                      <ActionButtons>
                        <ActionButton
                          onClick={() => {
                            setSelectedContact(contact);
                            setShowContactModal(true);
                          }}
                        >
                          <FaEye />
                        </ActionButton>
                        <ActionButton
                          variant="primary"
                          onClick={() => {
                            setSelectedContact(contact);
                            setShowContactModal(true);
                          }}
                        >
                          <FaEdit />
                        </ActionButton>
                        <ActionButton
                          variant="danger"
                          onClick={() => handleDeleteContact(contact.id)}
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

        {/* Contact Detail Modal */}
        {showContactModal && selectedContact && (
          <ModalOverlay>
            <ModalContainer>
              <ModalHeader>
                <ModalTitle>Edit Contact</ModalTitle>
                <CloseButton onClick={() => {
                  setShowContactModal(false);
                  setSelectedContact(null);
                }}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalContent>
                <ContactForm
                  ref={editFormRef}
                  contact={selectedContact}
                  onSuccess={handleUpdateContact}
                  onSubmittingChange={setIsSubmitting}
                  hideSubmitButton
                  tags={tags}
                  isModal
                />
              </ModalContent>
              <ModalFooter>
                <CancelButton onClick={() => {
                  setShowContactModal(false);
                  setSelectedContact(null);
                }}>
                  <FaTimes /> Cancel
                </CancelButton>
                <SubmitButton onClick={handleEditSubmit} disabled={isSubmitting}>
                  <FaCheck /> {isSubmitting ? 'Updating...' : 'Update Contact'}
                </SubmitButton>
              </ModalFooter>
            </ModalContainer>
          </ModalOverlay>
        )}

        {/* Create Contact Modal */}
        {showCreateModal && (
          <ModalOverlay>
            <ModalContainer>
              <ModalHeader>
                <ModalTitle>Create New Contact</ModalTitle>
                <CloseButton onClick={() => setShowCreateModal(false)}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalContent>
                <ContactForm
                  ref={createFormRef}
                  onSuccess={handleCreateContact}
                  onSubmittingChange={setIsSubmitting}
                  hideSubmitButton
                  tags={tags}
                  isModal
                />
              </ModalContent>
              <ModalFooter>
                <CancelButton onClick={() => setShowCreateModal(false)}>
                  <FaTimes /> Cancel
                </CancelButton>
                <SubmitButton onClick={handleCreateSubmit} disabled={isSubmitting}>
                  <FaCheck /> {isSubmitting ? 'Creating...' : 'Create Contact'}
                </SubmitButton>
              </ModalFooter>
            </ModalContainer>
          </ModalOverlay>
        )}
      </Container>
    </AdminLayout>
  );
}

// Modal Components
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
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e9ecef;
    color: #333;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
`;

const CancelButton = styled.button`
  background: #f3f4f6;
  color: #374151;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #e5e7eb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #7a6f4d;
  }

  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
`;
