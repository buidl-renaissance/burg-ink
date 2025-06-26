'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';
import { FaDownload, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { Artwork, Artist } from '@/utils/interfaces';
import { createArtwork } from '@/utils/api';

interface ImportArtworkModalProps {
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
  onImport: (artworkData: Artwork[]) => void;
}

interface RawArtworkData {
  title?: string;
  image?: string;
  description?: string;
  artist?: string | { name: string };
  source?: string;
}

export function ImportArtworkModal({ artist, isOpen, onClose, onImport }: ImportArtworkModalProps) {
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<RawArtworkData[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handlePreview = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch('/api/artwork/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract artwork data');
      }

      const data = await response.json();
      // Expecting { artworks: [...] }
      const artworks = Array.isArray(data.artworks) ? data.artworks : [data.artworks];
      setPreviewData(artworks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import artwork');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (previewData.length > 0) {
      // Format the raw data into proper Artwork objects
      const formattedArtworks: Artwork[] = previewData.map((artwork, index) => ({
        id: Date.now() + index,
        slug: artwork.title?.toLowerCase().replace(/\s+/g, '-') || `imported-artwork-${index}`,
        title: artwork.title || `Imported Artwork ${index + 1}`,
        description: artwork.description || '',
        type: 'artwork',
        artist_id: undefined,
        image: artwork.image,
        artist: artist,
        collaborators: [],
        content: [],
        data: { 
          image: artwork.image, 
          category: 'imported',
          source: url 
        },
        meta: {},
      }));

      formattedArtworks.forEach(async (artwork) => {
        artwork.artist_id = artwork.artist?.id;
        await createArtwork(artwork);
      });
      
      onImport(formattedArtworks);
      handleClose();
    }
  };

  const handleClose = () => {
    setUrl('');
    setPreviewData([]);
    setError(null);
    setIsImporting(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Artwork from URL" maxWidth="700px">
      <ModalContent>
        <Description>
          Enter a URL to import artwork data from various art platforms and image hosting services.
        </Description>

        <UrlInputGroup>
          <UrlInput
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/artwork-url"
            disabled={isImporting}
          />
          <PreviewButton onClick={handlePreview} disabled={isImporting || !url.trim()}>
            {isImporting ? (
              <>
                <FaSpinner className="spinner" />
                Extracting...
              </>
            ) : (
              <>
                <FaDownload />
                Preview
              </>
            )}
          </PreviewButton>
        </UrlInputGroup>

        {error && (
          <ErrorResult>
            <FaExclamationTriangle />
            <span>{error}</span>
          </ErrorResult>
        )}

        {previewData.length > 0 && (
          <PreviewContainer>
            <PreviewTitle>Preview ({previewData.length} artwork{previewData.length > 1 ? 's' : ''})</PreviewTitle>
            <PreviewGridList>
              {previewData.map((artwork, idx) => (
                <PreviewGrid key={idx}>
                  {artwork.image && (
                    <PreviewImage>
                      <img src={artwork.image} alt="Preview" />
                    </PreviewImage>
                  )}
                  <PreviewDetails>
                    <PreviewField>
                      <strong>Title:</strong> {artwork.title || 'Untitled'}
                    </PreviewField>
                    {artwork.description && (
                      <PreviewField>
                        <strong>Description:</strong> {artwork.description}
                      </PreviewField>
                    )}
                    {artwork.artist && (
                      <PreviewField>
                        <strong>Artist:</strong> {typeof artwork.artist === 'string' ? artwork.artist : artwork.artist?.name}
                      </PreviewField>
                    )}
                  </PreviewDetails>
                </PreviewGrid>
              ))}
            </PreviewGridList>
            <ImportButton onClick={handleImport}>Import All Artwork</ImportButton>
          </PreviewContainer>
        )}

        <SupportedPlatforms>
          <h4>Supported Platforms:</h4>
          <ul>
            <li>Instagram posts</li>
            <li>DeviantArt artwork</li>
            <li>ArtStation projects</li>
            <li>Direct image URLs</li>
            <li>Most art portfolio websites</li>
          </ul>
        </SupportedPlatforms>
      </ModalContent>
    </Modal>
  );
}

const ModalContent = styled.div`
  padding: 1.5rem;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const UrlInputGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const UrlInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 2px rgba(150, 136, 95, 0.2);
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const PreviewButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #96885f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #7a6f4d;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorResult = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8d7da;
  color: #721c24;
  border-radius: 6px;
  border: 1px solid #f5c6cb;
  margin-bottom: 1rem;
`;

const PreviewContainer = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const PreviewTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
`;

const PreviewGridList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PreviewImage = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #ddd;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PreviewDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PreviewField = styled.div`
  font-size: 0.9rem;
  line-height: 1.4;

  strong {
    color: #333;
  }
`;

const ImportButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background: #218838;
  }
`;

const SupportedPlatforms = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: #e9ecef;
  border-radius: 6px;

  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #333;
  }

  ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #666;
    font-size: 0.9rem;
  }

  li {
    margin-bottom: 0.25rem;
  }
`; 