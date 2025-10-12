'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AdminLayout } from '@/components/AdminLayout';
import { UploadMedia } from '@/components/UploadMedia';
import { MediaProcessingIndicator } from '@/components/MediaProcessingIndicator';
import { useMediaProcessing } from '@/hooks/useMediaProcessing';
import { FaSearch, FaSort, FaEye, FaTrash, FaDownload, FaSpinner, FaTh, FaThLarge, FaTimes, FaPlus } from 'react-icons/fa';
import { GetServerSideProps } from 'next';

// Styled Components
const Container = styled.div<{ sidebarOpen?: boolean }>`
  max-width: 1400px;
  margin: 0 auto;
  position: relative;

  @media (min-width: 1400px) {
    margin-right: ${props => props.sidebarOpen ? '400px' : '0'};
    transition: margin-right 0.3s ease;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.5rem 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #6c757d;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const UploadSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px dashed #e9ecef;
  transition: border-color 0.3s ease;

  &:hover {
    border-color: #96885f;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const UploadHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
`;

const UploadIcon = styled.div`
  background: #96885f;
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 1rem;
  }
`;

const UploadText = styled.div`
  flex: 1;

  h3 {
    margin: 0 0 0.25rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;

    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }

  p {
    margin: 0;
    color: #6c757d;
    font-size: 0.9rem;

    @media (max-width: 768px) {
      font-size: 0.85rem;
    }
  }
`;

const UploadSuccess = styled.div`
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Controls = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const SearchSection = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
`;

const SearchButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: #7a6f4d;
  }

  @media (max-width: 768px) {
    padding: 0.75rem;
    font-size: 0.9rem;
  }
`;

const FiltersSection = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const FilterLabel = styled.label`
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const FilterSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #96885f;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 0.85rem;
    min-width: 120px;
  }
`;

const SortButton = styled.button`
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e9ecef;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 0.25rem;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const ViewButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? '#96885f' : '#f8f9fa'};
  color: ${props => props.active ? 'white' : '#333'};
  border: 1px solid ${props => props.active ? '#96885f' : '#e9ecef'};
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? '#7a6f4d' : '#e9ecef'};
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6c757d;
  
  .spinner {
    animation: spin 1s linear infinite;
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: #6c757d;
`;

const RetryButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: #7a6f4d;
  }
`;

const StatsBar = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const StatLabel = styled.span`
  font-weight: 500;
  color: #6c757d;
`;

const StatValue = styled.span`
  font-weight: 700;
  color: #333;
`;

const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MediaCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
`;

const MediaThumbnail = styled.div`
  position: relative;
  height: 200px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PlaceholderThumbnail = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #e9ecef;
  color: #6c757d;
  font-weight: 600;
  font-size: 1.2rem;
`;

const MediaInfo = styled.div`
  padding: 1rem;
`;

const MediaTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.75rem 0;
  word-break: break-word;
`;

const MediaDetails = styled.div`
  margin-bottom: 0.75rem;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  font-size: 0.85rem;
`;

const DetailLabel = styled.span`
  color: #6c757d;
  font-weight: 500;
`;

const DetailValue = styled.span`
  color: #333;
`;

const MediaDescription = styled.p`
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 1rem;
`;

const Tag = styled.span`
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const MediaActions = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0 1rem 1rem;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  background: ${props => props.danger ? '#dc3545' : '#f8f9fa'};
  color: ${props => props.danger ? 'white' : '#333'};
  border: 1px solid ${props => props.danger ? '#dc3545' : '#e9ecef'};
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.danger ? '#c82333' : '#e9ecef'};
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
`;

const PaginationButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover:not(:disabled) {
    background: #7a6f4d;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: #6c757d;
  font-weight: 500;
`;

const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TileItem = styled.div`
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  aspect-ratio: 1;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const TileImage = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PlaceholderImage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #e9ecef;
  color: #6c757d;
  font-weight: 600;
  font-size: 1.2rem;
`;

const SidebarOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  @media (min-width: 1400px) {
    display: none;
  }
`;

const Sidebar = styled.div`
  background: white;
  overflow: hidden;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) and (max-width: 1399px) {
    max-width: 800px;
    height: auto;
    max-height: 90vh;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  @media (min-width: 1400px) {
    position: fixed;
    top: 80px;
    right: 0;
    width: 400px;
    height: calc(100vh - 80px);
    border-radius: 0;
    box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
  }
`;

const SidebarHeader = styled.div`
  background: #96885f;
  color: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SidebarTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
`;

const SidebarContent = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) and (max-width: 1399px) {
    flex-direction: row;
    gap: 1.5rem;
    padding: 1.5rem;
  }
`;

const SidebarImage = styled.div`
  position: relative;
  background: #f8f9fa;
  margin-bottom: 1rem;
  width: 100%;
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }

  @media (min-width: 768px) and (max-width: 1399px) {
    flex-shrink: 0;
    width: 300px;
    max-width: 300px;
    margin-bottom: 0;
    align-self: flex-start;
    position: sticky;
    top: 0;
  }
`;

const SidebarDetailsWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;

  @media (min-width: 768px) and (max-width: 1399px) {
    overflow-y: auto;
  }
`;

const SidebarSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 0.75rem 0;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const DescriptionText = styled.p`
  color: #6c757d;
  margin: 0;
`;

const SidebarTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

const SidebarTag = styled.span`
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const SidebarActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SidebarActionButton = styled.button<{ danger?: boolean }>`
  background: ${props => props.danger ? '#dc3545' : '#96885f'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => props.danger ? '#c82333' : '#7a6f4d'};
  }
`;

const StatusValue = styled.span<{ color: string }>`
  color: ${props => props.color};
  font-weight: 500;
`;

// Interfaces and Types
interface MediaItem {
  id: string | number; // Support both for UUID and legacy integer IDs
  source: string;
  source_id?: string;
  filename: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  original_url?: string;
  medium_url?: string;
  spaces_url?: string;
  thumbnail_url?: string;
  processing_status?: string | null;
  title?: string;
  description?: string;
  alt_text?: string;
  tags?: string[];
  ai_analysis?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  processed_at?: string;
}

interface MediaResponse {
  media: MediaItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

type ViewFormat = 'tile' | 'card';
type PageSize = 30 | 60 | 90;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {
      breadcrumbs: [{ label: 'Admin', href: '/admin' }],
      currentPage: 'Media'
    }
  }
};

export default function AdminMedia() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<PageSize>(30);
  const [viewFormat, setViewFormat] = useState<ViewFormat>('tile');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, sourceFilter, sortBy, sortOrder, itemsPerPage]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (currentPage - 1) * itemsPerPage;
      
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        sort: sortBy,
        order: sortOrder,
        status: statusFilter,
        source: sourceFilter,
      });

      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data: MediaResponse = await response.json();
      setMedia(data.media);
      setTotalItems(data.pagination.total);
    } catch (error) {
      console.error('Error fetching media:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch media');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMedia();
  };

  const handleMediaClick = (item: MediaItem) => {
    setSelectedMedia(item);
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setSelectedMedia(null);
  };

  const handleUploadComplete = (urls: string[]) => {
    const fileCount = urls.length;
    setUploadSuccess(`${fileCount} file${fileCount > 1 ? 's' : ''} uploaded successfully! Processing...`);
    
    // Immediately refresh to show new items with processing status
    fetchMedia();
    
    // Clear success message after 3 seconds
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'processing': return '#ffc107';
      case 'failed': return '#dc3545';
      case 'pending': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getStatusLabel = (status?: string | null) => {
    switch (status) {
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending';
      default: return status || '';
    }
  };

  const isProcessing = (item: MediaItem) => {
    return item.processing_status === 'pending' || item.processing_status === 'processing';
  };

  // Component to handle real-time updates for a single media item
  const MediaItemWithProcessing: React.FC<{ item: MediaItem; children: React.ReactNode }> = ({ item, children }) => {
    const shouldTrack = isProcessing(item);
    const mediaId = String(item.id);
    
    useMediaProcessing({
      mediaId,
      enabled: shouldTrack,
      pollInterval: 2000,
      onComplete: () => {
        // Refresh the media list when processing completes
        fetchMedia();
      },
      onError: () => {
        // Refresh on error too
        fetchMedia();
      },
    });

    return <>{children}</>;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <AdminLayout currentPage="media">
      <Container sidebarOpen={sidebarOpen}>
        <Header>
          <Title>Media Library</Title>
          <Subtitle>Manage your media assets and files</Subtitle>
        </Header>

        <UploadSection>
          <UploadHeader>
            <UploadIcon>
              <FaPlus />
            </UploadIcon>
                      <UploadText>
            <h3>Upload New Media</h3>
            <p>Drag and drop multiple images and videos or click to browse. Select multiple files to upload them all at once. Media will be automatically processed and analyzed.</p>
          </UploadText>
          </UploadHeader>
          
          <UploadMedia 
            onUploadComplete={handleUploadComplete}
            accept="image/*,video/*"
          />
          
          {uploadSuccess && (
            <UploadSuccess>
              ✓ {uploadSuccess}
            </UploadSuccess>
          )}
        </UploadSection>

        <Controls>
          <SearchSection>
            <SearchInput
              type="text"
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <SearchButton onClick={handleSearch}>
              <FaSearch />
            </SearchButton>
          </SearchSection>

          <FiltersSection>
            <FilterGroup>
              <FilterLabel>Status:</FilterLabel>
              <FilterSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>Source:</FilterLabel>
              <FilterSelect
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="all">All Sources</option>
                <option value="google_drive">Google Drive</option>
                <option value="upload">Upload</option>
                <option value="url">URL</option>
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>Sort:</FilterLabel>
              <FilterSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated_at">Updated</option>
                <option value="created_at">Created</option>
                <option value="filename">Filename</option>
                <option value="processing_status">Status</option>
              </FilterSelect>
              <SortButton
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <FaSort />
              </SortButton>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>View:</FilterLabel>
              <ViewToggle>
                <ViewButton
                  active={viewFormat === 'tile'}
                  onClick={() => setViewFormat('tile')}
                  title="Tile View"
                >
                  <FaTh />
                </ViewButton>
                <ViewButton
                  active={viewFormat === 'card'}
                  onClick={() => setViewFormat('card')}
                  title="Card View"
                >
                  <FaThLarge />
                </ViewButton>
              </ViewToggle>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>Per Page:</FilterLabel>
              <FilterSelect
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value) as PageSize)}
              >
                <option value={30}>30</option>
                <option value={60}>60</option>
                <option value={90}>90</option>
              </FilterSelect>
            </FilterGroup>
          </FiltersSection>
        </Controls>

        {loading ? (
          <LoadingContainer>
            <FaSpinner className="spinner" />
            <p>Loading media...</p>
          </LoadingContainer>
        ) : error ? (
          <ErrorContainer>
            <p>Error: {error}</p>
            <RetryButton onClick={fetchMedia}>Retry</RetryButton>
          </ErrorContainer>
        ) : (
          <>
            <StatsBar>
              <StatItem>
                <StatLabel>Total Files:</StatLabel>
                <StatValue>{totalItems}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>Showing:</StatLabel>
                <StatValue>{media.length} of {totalItems}</StatValue>
              </StatItem>
              <StatItem>
                <StatLabel>View:</StatLabel>
                <StatValue>{viewFormat === 'tile' ? 'Tile' : 'Card'}</StatValue>
              </StatItem>
            </StatsBar>

            {viewFormat === 'tile' ? (
              <TileGrid>
                {media.map((item) => (
                  <MediaItemWithProcessing key={item.id} item={item}>
                    <TileItem onClick={() => handleMediaClick(item)}>
                      <TileImage>
                        {item.thumbnail_url || item.medium_url ? (
                          <img src={item.thumbnail_url || item.medium_url} alt={item.filename} />
                        ) : (
                          <PlaceholderImage>
                            <span>{item.mime_type.split('/')[0].toUpperCase()}</span>
                          </PlaceholderImage>
                        )}
                        {isProcessing(item) ? (
                          <MediaProcessingIndicator processing overlay />
                        ) : item.processing_status === 'failed' ? (
                          <MediaProcessingIndicator failed overlay />
                        ) : null}
                      </TileImage>
                    </TileItem>
                  </MediaItemWithProcessing>
                ))}
              </TileGrid>
            ) : (
              <MediaGrid>
                {media.map((item) => (
                  <MediaItemWithProcessing key={item.id} item={item}>
                    <MediaCard>
                      <MediaThumbnail>
                        {item.thumbnail_url || item.medium_url ? (
                          <img src={item.thumbnail_url || item.medium_url} alt={item.alt_text || item.filename} />
                        ) : (
                          <PlaceholderThumbnail>
                            <span>{item.mime_type.split('/')[0].toUpperCase()}</span>
                          </PlaceholderThumbnail>
                        )}
                        {isProcessing(item) && (
                          <MediaProcessingIndicator processing overlay />
                        )}
                        {item.processing_status === 'failed' && (
                          <MediaProcessingIndicator failed overlay />
                        )}
                      </MediaThumbnail>
                      
                      <MediaInfo>
                        <MediaTitle>{item.title || item.filename}</MediaTitle>
                      <MediaDetails>
                        <DetailItem>
                          <DetailLabel>Size:</DetailLabel>
                          <DetailValue>{formatFileSize(item.size)}</DetailValue>
                        </DetailItem>
                        <DetailItem>
                          <DetailLabel>Dimensions:</DetailLabel>
                          <DetailValue>
                            {item.width && item.height 
                              ? `${item.width} × ${item.height}` 
                              : 'Processing...'}
                          </DetailValue>
                        </DetailItem>
                        <DetailItem>
                          <DetailLabel>Source:</DetailLabel>
                          <DetailValue>{item.source}</DetailValue>
                        </DetailItem>
                        <DetailItem>
                          <DetailLabel>Type:</DetailLabel>
                          <DetailValue>{item.mime_type}</DetailValue>
                        </DetailItem>
                      </MediaDetails>
                      
                      {item.description && (
                        <MediaDescription>{item.description}</MediaDescription>
                      )}
                      
                      {item.tags && item.tags.length > 0 && (
                        <TagsContainer>
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <Tag key={index}>{tag}</Tag>
                          ))}
                          {item.tags.length > 3 && (
                            <Tag>+{item.tags.length - 3} more</Tag>
                          )}
                        </TagsContainer>
                      )}
                    </MediaInfo>
                    
                    <MediaActions>
                      {item.spaces_url && (
                        <ActionButton onClick={() => window.open(item.spaces_url, '_blank')}>
                          <FaEye />
                        </ActionButton>
                      )}
                      <ActionButton onClick={() => window.open(item.spaces_url, '_blank')}>
                        <FaDownload />
                      </ActionButton>
                      <ActionButton danger>
                        <FaTrash />
                      </ActionButton>
                    </MediaActions>
                    </MediaCard>
                  </MediaItemWithProcessing>
                ))}
              </MediaGrid>
            )}

            {totalPages > 1 && (
              <Pagination>
                <PaginationButton
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </PaginationButton>
                
                <PageInfo>
                  Page {currentPage} of {totalPages}
                </PageInfo>
                
                <PaginationButton
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </PaginationButton>
              </Pagination>
            )}
          </>
        )}

        {/* Right Sidebar */}
        {sidebarOpen && selectedMedia && (
          <>
            {/* Modal overlay for smaller screens */}
            <SidebarOverlay onClick={closeSidebar}>
              <Sidebar onClick={(e) => e.stopPropagation()}>
                <SidebarHeader>
                  <SidebarTitle>Media Details</SidebarTitle>
                  <CloseButton onClick={closeSidebar}>
                    <FaTimes />
                  </CloseButton>
                </SidebarHeader>
                
                <SidebarContent>
                  <SidebarImage>
                    {(selectedMedia.original_url || selectedMedia.medium_url || selectedMedia.thumbnail_url) ? (
                      <img 
                        src={selectedMedia.original_url || selectedMedia.medium_url || selectedMedia.thumbnail_url} 
                        alt={selectedMedia.alt_text || selectedMedia.filename} 
                      />
                    ) : (
                      <PlaceholderImage>
                        <span>{selectedMedia.mime_type.split('/')[0].toUpperCase()}</span>
                      </PlaceholderImage>
                    )}
                  </SidebarImage>
                  
                  <SidebarDetailsWrapper>
                    <SidebarSection>
                      <SectionTitle>File Information</SectionTitle>
                    <DetailRow>
                      <DetailLabel>Filename:</DetailLabel>
                      <DetailValue>{selectedMedia.filename}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Size:</DetailLabel>
                      <DetailValue>{formatFileSize(selectedMedia.size)}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Dimensions:</DetailLabel>
                      <DetailValue>
                        {selectedMedia.width && selectedMedia.height 
                          ? `${selectedMedia.width} × ${selectedMedia.height}` 
                          : 'Processing...'}
                      </DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Type:</DetailLabel>
                      <DetailValue>{selectedMedia.mime_type}</DetailValue>
                    </DetailRow>
                    <DetailRow>
                      <DetailLabel>Source:</DetailLabel>
                      <DetailValue>{selectedMedia.source}</DetailValue>
                    </DetailRow>
                    {selectedMedia.processing_status && selectedMedia.processing_status !== 'completed' && (
                      <DetailRow>
                        <DetailLabel>Status:</DetailLabel>
                        <StatusValue color={getStatusColor(selectedMedia.processing_status)}>
                          {getStatusLabel(selectedMedia.processing_status)}
                        </StatusValue>
                      </DetailRow>
                    )}
                  </SidebarSection>

                  {selectedMedia.description && (
                    <SidebarSection>
                      <SectionTitle>Description</SectionTitle>
                      <DescriptionText>{selectedMedia.description}</DescriptionText>
                    </SidebarSection>
                  )}

                  {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                    <SidebarSection>
                      <SectionTitle>Tags</SectionTitle>
                      <SidebarTags>
                        {selectedMedia.tags.map((tag, index) => (
                          <SidebarTag key={index}>{tag}</SidebarTag>
                        ))}
                      </SidebarTags>
                    </SidebarSection>
                  )}

                  <SidebarSection>
                    <SectionTitle>Actions</SectionTitle>
                    <SidebarActions>
                      {selectedMedia.spaces_url && (
                        <SidebarActionButton onClick={() => window.open(selectedMedia.spaces_url, '_blank')}>
                          <FaEye /> View Original
                        </SidebarActionButton>
                      )}
                      <SidebarActionButton onClick={() => window.open(selectedMedia.spaces_url, '_blank')}>
                        <FaDownload /> Download
                      </SidebarActionButton>
                      <SidebarActionButton danger>
                        <FaTrash /> Delete
                      </SidebarActionButton>
                    </SidebarActions>
                    </SidebarSection>
                  </SidebarDetailsWrapper>
                </SidebarContent>
              </Sidebar>
            </SidebarOverlay>

            {/* Fixed sidebar for larger screens */}
            <Sidebar>
              <SidebarHeader>
                <SidebarTitle>Media Details</SidebarTitle>
                <CloseButton onClick={closeSidebar}>
                  <FaTimes />
                </CloseButton>
              </SidebarHeader>
              
              <SidebarContent>
                <SidebarImage>
                  {(selectedMedia.original_url || selectedMedia.medium_url || selectedMedia.thumbnail_url) ? (
                    <img 
                      src={selectedMedia.original_url || selectedMedia.medium_url || selectedMedia.thumbnail_url} 
                      alt={selectedMedia.alt_text || selectedMedia.filename} 
                    />
                  ) : (
                    <PlaceholderImage>
                      <span>{selectedMedia.mime_type.split('/')[0].toUpperCase()}</span>
                    </PlaceholderImage>
                  )}
                </SidebarImage>
                
                <SidebarDetailsWrapper>
                  <SidebarSection>
                    <SectionTitle>File Information</SectionTitle>
                  <DetailRow>
                    <DetailLabel>Filename:</DetailLabel>
                    <DetailValue>{selectedMedia.filename}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Size:</DetailLabel>
                    <DetailValue>{formatFileSize(selectedMedia.size)}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Dimensions:</DetailLabel>
                    <DetailValue>
                      {selectedMedia.width && selectedMedia.height 
                        ? `${selectedMedia.width} × ${selectedMedia.height}` 
                        : 'Processing...'}
                    </DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Type:</DetailLabel>
                    <DetailValue>{selectedMedia.mime_type}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>Source:</DetailLabel>
                    <DetailValue>{selectedMedia.source}</DetailValue>
                  </DetailRow>
                  {selectedMedia.processing_status && selectedMedia.processing_status !== 'completed' && (
                    <DetailRow>
                      <DetailLabel>Status:</DetailLabel>
                      <StatusValue color={getStatusColor(selectedMedia.processing_status)}>
                        {getStatusLabel(selectedMedia.processing_status)}
                      </StatusValue>
                    </DetailRow>
                  )}
                </SidebarSection>

                {selectedMedia.description && (
                  <SidebarSection>
                    <SectionTitle>Description</SectionTitle>
                    <DescriptionText>{selectedMedia.description}</DescriptionText>
                  </SidebarSection>
                )}

                {selectedMedia.tags && selectedMedia.tags.length > 0 && (
                  <SidebarSection>
                    <SectionTitle>Tags</SectionTitle>
                    <SidebarTags>
                      {selectedMedia.tags.map((tag, index) => (
                        <SidebarTag key={index}>{tag}</SidebarTag>
                      ))}
                    </SidebarTags>
                  </SidebarSection>
                )}

                <SidebarSection>
                  <SectionTitle>Actions</SectionTitle>
                  <SidebarActions>
                    {selectedMedia.spaces_url && (
                      <SidebarActionButton onClick={() => window.open(selectedMedia.spaces_url, '_blank')}>
                        <FaEye /> View Original
                      </SidebarActionButton>
                    )}
                    <SidebarActionButton onClick={() => window.open(selectedMedia.spaces_url, '_blank')}>
                      <FaDownload /> Download
                    </SidebarActionButton>
                    <SidebarActionButton danger>
                      <FaTrash /> Delete
                    </SidebarActionButton>
                  </SidebarActions>
                  </SidebarSection>
                </SidebarDetailsWrapper>
              </SidebarContent>
            </Sidebar>
          </>
        )}
      </Container>
    </AdminLayout>
  );
} 