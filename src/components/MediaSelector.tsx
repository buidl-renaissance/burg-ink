'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch, FaPlus, FaTimes, FaSpinner, FaCheck } from 'react-icons/fa';
import { UploadMedia } from './UploadMedia';

interface MediaItem {
  id: string | number;
  original_url?: string;
  medium_url?: string;
  thumbnail_url?: string;
  filename: string;
  title?: string;
  mime_type: string;
  processing_status?: string | null;
  width?: number;
  height?: number;
}

interface MediaSelectorProps {
  selectedMediaUrl?: string;
  onSelect: (url: string, mediaItem: MediaItem) => void;
  accept?: string;
}

export function MediaSelector({ 
  selectedMediaUrl, 
  onSelect,
  accept = "image/*,video/*"
}: MediaSelectorProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = media.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedia(filtered);
    } else {
      setFilteredMedia(media);
    }
  }, [searchTerm, media]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/media?limit=20&sort=desc');
      const data = await response.json();
      setMedia(data.media || []);
      setFilteredMedia(data.media || []);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMedia = (item: MediaItem) => {
    const url = item.medium_url || item.original_url || item.thumbnail_url || '';
    setSelectedId(item.id);
    onSelect(url, item);
  };

  const handleUploadComplete = async (urls: string[]) => {
    if (urls.length > 0) {
      // Refresh media list to show newly uploaded item
      await fetchMedia();
      setShowUpload(false);
      
      // Auto-select the first uploaded media
      // The newly uploaded media should be at the top after refresh
      if (media.length > 0) {
        handleSelectMedia(media[0]);
      }
    }
  };

  const isVideo = (mimeType: string) => {
    return mimeType.startsWith('video/');
  };

  return (
    <Container>
      {!showUpload ? (
        <>
          <Header>
            <SearchContainer>
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>
            <UploadButton onClick={() => setShowUpload(true)}>
              <FaPlus /> Upload New
            </UploadButton>
          </Header>

          <MediaGrid>
            {loading ? (
              <LoadingContainer>
                <FaSpinner className="spinner" />
                <p>Loading media...</p>
              </LoadingContainer>
            ) : filteredMedia.length === 0 ? (
              <EmptyState>
                <p>No media found. Upload your first media file!</p>
                <EmptyButton onClick={() => setShowUpload(true)}>
                  <FaPlus /> Upload Media
                </EmptyButton>
              </EmptyState>
            ) : (
              filteredMedia.map((item) => (
                <MediaCard
                  key={item.id}
                  onClick={() => handleSelectMedia(item)}
                  selected={selectedId === item.id || selectedMediaUrl === (item.medium_url || item.original_url)}
                >
                  <MediaThumbnail>
                    {item.thumbnail_url || item.medium_url || item.original_url ? (
                      isVideo(item.mime_type) ? (
                        <video src={item.thumbnail_url || item.medium_url || item.original_url}>
                          <track kind="captions" />
                        </video>
                      ) : (
                        <img 
                          src={item.thumbnail_url || item.medium_url || item.original_url} 
                          alt={item.filename}
                        />
                      )
                    ) : (
                      <PlaceholderImage>
                        <span>{item.mime_type.split('/')[0].toUpperCase()}</span>
                      </PlaceholderImage>
                    )}
                    {item.processing_status && item.processing_status !== 'completed' && (
                      <ProcessingOverlay>
                        {item.processing_status === 'failed' ? 'Failed' : 'Processing...'}
                      </ProcessingOverlay>
                    )}
                  </MediaThumbnail>
                  <MediaInfo>
                    <MediaTitle>{item.title || item.filename}</MediaTitle>
                    {item.width && item.height && (
                      <MediaDimensions>{item.width} × {item.height}</MediaDimensions>
                    )}
                  </MediaInfo>
                  {(selectedId === item.id || selectedMediaUrl === (item.medium_url || item.original_url)) && (
                    <SelectedBadge>
                      <FaCheck />
                    </SelectedBadge>
                  )}
                </MediaCard>
              ))
            )}
          </MediaGrid>
        </>
      ) : (
        <UploadSection>
          <UploadHeader>
            <UploadTitle>Upload New Media</UploadTitle>
            <CloseButton onClick={() => setShowUpload(false)}>
              <FaTimes />
            </CloseButton>
          </UploadHeader>
          <UploadMedia 
            onUploadComplete={handleUploadComplete}
            accept={accept}
          />
        </UploadSection>
      )}
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const Header = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  position: relative;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
`;

const UploadButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #96885f;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  transition: background-color 0.2s ease;

  &:hover {
    background: #7a6f4d;
  }
`;

const MediaGrid = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #96885f;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #7a6f4d;
  }

  @media (max-width: 768px) {
    gap: 0.75rem;
  }
`;

const MediaCard = styled.div<{ selected?: boolean }>`
  position: relative;
  border: 2px solid ${props => props.selected ? '#96885f' : '#e9ecef'};
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.selected ? '#f8f7f4' : 'white'};
  flex-shrink: 0;
  width: 140px;

  &:hover {
    border-color: #96885f;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    width: 120px;
  }
`;

const MediaThumbnail = styled.div`
  position: relative;
  width: 100%;
  padding-top: 100%;
  background: #f8f9fa;
  overflow: hidden;

  img, video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PlaceholderImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9ecef;
  color: #6c757d;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ProcessingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #96885f;
`;

const MediaInfo = styled.div`
  padding: 0.5rem;
`;

const MediaTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MediaDimensions = styled.div`
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
`;

const SelectedBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: #96885f;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
`;

const LoadingContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6c757d;

  .spinner {
    font-size: 2rem;
    margin-bottom: 1rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: #6c757d;

  p {
    margin-bottom: 1rem;
  }
`;

const EmptyButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #96885f;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;

  &:hover {
    background: #7a6f4d;
  }
`;

const UploadSection = styled.div`
  padding: 1rem;
`;

const UploadHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const UploadTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: #333;
  }
`;

