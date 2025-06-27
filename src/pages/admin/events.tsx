'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { FaSearch, FaEdit, FaTrash, FaEye, FaPlus, FaCalendar, FaMapMarkerAlt } from 'react-icons/fa';
import { GetServerSideProps } from 'next';

interface Event {
  id: number;
  title: string;
  slug: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image?: string;
  ticket_price?: number;
  max_tickets?: number;
  sold_tickets: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      breadcrumbs: [{ label: 'Admin', href: '/admin' }],
      currentPage: 'Events'
    }
  }
};

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockEvents: Event[] = [
        {
          id: 1,
          title: 'Arts for the Earth',
          slug: 'arts-for-the-earth',
          description: 'A celebration of environmental art and sustainability',
          date: '2024-04-15',
          time: '18:00',
          location: 'Community Center, Downtown',
          image: '/api/placeholder/300/200',
          ticket_price: 25,
          max_tickets: 100,
          sold_tickets: 75,
          status: 'upcoming',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          title: 'Digital Art Workshop',
          slug: 'digital-art-workshop',
          description: 'Learn digital art techniques from professional artists',
          date: '2024-03-20',
          time: '14:00',
          location: 'Art Studio, West Side',
          ticket_price: 50,
          max_tickets: 20,
          sold_tickets: 20,
          status: 'completed',
          created_at: '2024-01-20T14:20:00Z',
          updated_at: '2024-01-20T14:20:00Z',
        },
        {
          id: 3,
          title: 'Gallery Opening Night',
          slug: 'gallery-opening-night',
          description: 'Exclusive opening of our new contemporary art gallery',
          date: '2024-05-10',
          time: '19:00',
          location: 'Burg Ink Gallery',
          ticket_price: 0,
          max_tickets: 150,
          sold_tickets: 45,
          status: 'upcoming',
          created_at: '2024-01-25T09:15:00Z',
          updated_at: '2024-01-25T09:15:00Z',
        },
      ];
      
      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: Event) => {
    // Implement edit functionality
    console.log('Edit event:', event);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        // Implement delete API call
        console.log('Delete event:', eventId);
        setEvents(events.filter(event => event.id !== eventId));
      } catch (error) {
        console.error('Failed to delete event:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#28a745';
      case 'ongoing': return '#007bff';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'ongoing': return 'Ongoing';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTicketPercentage = (sold: number, max: number) => {
    if (!max) return 0;
    return Math.round((sold / max) * 100);
  };

  return (
    <AdminLayout currentPage="events">
      <Container>
        <Header>
          <Title>Events Management</Title>
          <AddButton>
            <FaPlus />
            Add Event
          </AddButton>
        </Header>

        <FiltersContainer>
          <SearchWrapper>
            <SearchIcon>
              <FaSearch />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search events by title, description, or location..."
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
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </StatusSelect>
          </StatusFilter>
        </FiltersContainer>

        <StatsContainer>
          <StatCard>
            <StatNumber>{events.length}</StatNumber>
            <StatLabel>Total Events</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{events.filter(e => e.status === 'upcoming').length}</StatNumber>
            <StatLabel>Upcoming Events</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{events.reduce((sum, e) => sum + e.sold_tickets, 0)}</StatNumber>
            <StatLabel>Total Tickets Sold</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>
              ${events.reduce((sum, e) => sum + (e.ticket_price || 0) * e.sold_tickets, 0).toLocaleString()}
            </StatNumber>
            <StatLabel>Total Revenue</StatLabel>
          </StatCard>
        </StatsContainer>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <Th>Event</Th>
                <Th>Date & Time</Th>
                <Th>Location</Th>
                <Th>Tickets</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <LoadingMessage>Loading events...</LoadingMessage>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyMessage>No events found</EmptyMessage>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <EventCell>
                        <EventImage>
                          {event.image ? (
                            <img src={event.image} alt={event.title} />
                          ) : (
                            <DefaultImage>
                              <FaCalendar />
                            </DefaultImage>
                          )}
                        </EventImage>
                        <EventInfo>
                          <EventTitle>{event.title}</EventTitle>
                          <EventDescription>{event.description}</EventDescription>
                        </EventInfo>
                      </EventCell>
                    </td>
                    <td>
                      <DateTimeCell>
                        <DateText>{formatDate(event.date)}</DateText>
                        <TimeText>{event.time}</TimeText>
                      </DateTimeCell>
                    </td>
                    <td>
                      <LocationCell>
                        <FaMapMarkerAlt />
                        <span>{event.location}</span>
                      </LocationCell>
                    </td>
                    <td>
                      <TicketCell>
                        <TicketInfo>
                          <TicketCount>{event.sold_tickets}</TicketCount>
                          {event.max_tickets && (
                            <>
                              <span>/</span>
                              <TicketMax>{event.max_tickets}</TicketMax>
                            </>
                          )}
                        </TicketInfo>
                        {event.max_tickets && (
                          <TicketProgress>
                            <ProgressBar>
                              <ProgressFill 
                                percentage={getTicketPercentage(event.sold_tickets, event.max_tickets)}
                              />
                            </ProgressBar>
                            <ProgressText>{getTicketPercentage(event.sold_tickets, event.max_tickets)}%</ProgressText>
                          </TicketProgress>
                        )}
                        {event.ticket_price !== undefined && (
                          <TicketPrice>
                            {event.ticket_price === 0 ? 'Free' : `$${event.ticket_price}`}
                          </TicketPrice>
                        )}
                      </TicketCell>
                    </td>
                    <td>
                      <StatusBadge color={getStatusColor(event.status)}>
                        {getStatusLabel(event.status)}
                      </StatusBadge>
                    </td>
                    <td>
                      <ActionButtons>
                        <ActionButton onClick={() => handleViewEvent(event)}>
                          <FaEye />
                        </ActionButton>
                        <ActionButton onClick={() => handleEditEvent(event)}>
                          <FaEdit />
                        </ActionButton>
                        <ActionButton 
                          onClick={() => handleDeleteEvent(event.id)}
                          danger
                        >
                          <FaTrash />
                        </ActionButton>
                      </ActionButtons>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </TableContainer>

        {showEventModal && selectedEvent && (
          <EventModal onClose={() => setShowEventModal(false)} event={selectedEvent} />
        )}
      </Container>
    </AdminLayout>
  );
}

function EventModal({ event, onClose }: { event: Event; onClose: () => void }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#28a745';
      case 'ongoing': return '#007bff';
      case 'completed': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'ongoing': return 'Ongoing';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Event Details</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <DetailRow>
            <DetailLabel>Title:</DetailLabel>
            <DetailValue>{event.title}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Slug:</DetailLabel>
            <DetailValue>{event.slug}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Description:</DetailLabel>
            <DetailValue>{event.description}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Date:</DetailLabel>
            <DetailValue>{new Date(event.date).toLocaleDateString()}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Time:</DetailLabel>
            <DetailValue>{event.time}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Location:</DetailLabel>
            <DetailValue>{event.location}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Status:</DetailLabel>
            <DetailValue>
              <StatusBadge color={getStatusColor(event.status)}>
                {getStatusLabel(event.status)}
              </StatusBadge>
            </DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Tickets Sold:</DetailLabel>
            <DetailValue>{event.sold_tickets}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Max Tickets:</DetailLabel>
            <DetailValue>{event.max_tickets || 'Unlimited'}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Ticket Price:</DetailLabel>
            <DetailValue>{event.ticket_price === 0 ? 'Free' : `$${event.ticket_price}`}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Created:</DetailLabel>
            <DetailValue>{new Date(event.created_at).toLocaleString()}</DetailValue>
          </DetailRow>
          <DetailRow>
            <DetailLabel>Updated:</DetailLabel>
            <DetailValue>{new Date(event.updated_at).toLocaleString()}</DetailValue>
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

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e9ecef;
`;

const EventCell = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
`;

const EventImage = styled.div`
  width: 60px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DefaultImage = styled.div`
  width: 100%;
  height: 100%;
  background: #e9ecef;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

const EventInfo = styled.div`
  flex: 1;
`;

const EventTitle = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
`;

const EventDescription = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const DateTimeCell = styled.div`
  padding: 1rem;
`;

const DateText = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
`;

const TimeText = styled.div`
  font-size: 0.8rem;
  color: #6c757d;
`;

const LocationCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #6c757d;
  font-size: 0.9rem;
`;

const TicketCell = styled.div`
  padding: 1rem;
`;

const TicketInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
`;

const TicketCount = styled.span`
  color: #28a745;
`;

const TicketMax = styled.span`
  color: #6c757d;
`;

const TicketProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  background: #28a745;
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.span`
  font-size: 0.8rem;
  color: #6c757d;
  min-width: 30px;
`;

const TicketPrice = styled.div`
  font-size: 0.8rem;
  color: #96885f;
  font-weight: 600;
`;

const StatusBadge = styled.span<{ color: string }>`
  background: ${props => props.color};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  background: ${props => props.danger ? '#dc3545' : '#6c757d'};
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background: ${props => props.danger ? '#c82333' : '#5a6268'};
  }
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