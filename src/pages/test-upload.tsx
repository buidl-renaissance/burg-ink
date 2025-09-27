import React, { useState } from 'react';
import styled from 'styled-components';
import { PageLayout } from '@/components/PageLayout';
import { EnhancedUpload } from '@/components/EnhancedUpload';

const TestContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  text-align: center;
  color: #333;
`;

const Description = styled.p`
  margin-bottom: 2rem;
  text-align: center;
  color: #666;
  line-height: 1.6;
`;

const ResultsSection = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const ResultsTitle = styled.h2`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #333;
`;

const MediaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

const MediaThumbnail = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
`;

const MediaInfo = styled.div`
  flex: 1;
`;

const MediaTitle = styled.div`
  font-weight: 600;
  color: #333;
`;

const MediaStatus = styled.div<{ processing: boolean }>`
  font-size: 0.9rem;
  color: ${props => props.processing ? '#f59e0b' : '#10b981'};
`;

const MediaUrl = styled.div`
  font-size: 0.8rem;
  color: #666;
  word-break: break-all;
`;

interface UploadedMedia {
  id: string;
  originalUrl: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  processing: boolean;
  filename?: string;
}

export default function TestUploadPage() {
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [error, setError] = useState<string>('');

  const handleUploadComplete = (media: UploadedMedia[]) => {
    console.log('Upload complete:', media);
    setUploadedMedia(prev => [...prev, ...media]);
    setError('');
  };

  const handleUploadError = (errorMessage: string) => {
    console.error('Upload error:', errorMessage);
    setError(errorMessage);
  };

  return (
    <PageLayout title="Test Media Upload">
      <TestContainer>
        <Title>Media Upload Test</Title>
        <Description>
          This page tests the new media upload functionality with drag-and-drop interface,
          background processing, and automatic image resizing. Try uploading some images
          to see the media-manager-style upload experience in action.
        </Description>

        <EnhancedUpload
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          accept="image/*"
          multiple={true}
          showPreviews={true}
        />

        {error && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {uploadedMedia.length > 0 && (
          <ResultsSection>
            <ResultsTitle>Uploaded Media ({uploadedMedia.length})</ResultsTitle>
            {uploadedMedia.map((media) => (
              <MediaItem key={media.id}>
                <MediaThumbnail 
                  src={media.thumbnailUrl || media.mediumUrl || media.originalUrl}
                  alt={media.filename || 'Uploaded media'}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== media.originalUrl) {
                      target.src = media.originalUrl;
                    }
                  }}
                />
                <MediaInfo>
                  <MediaTitle>{media.filename || 'Unknown filename'}</MediaTitle>
                  <MediaStatus processing={media.processing}>
                    {media.processing ? 'Processing...' : 'Ready'}
                  </MediaStatus>
                  <MediaUrl>ID: {media.id}</MediaUrl>
                  <MediaUrl>Original: {media.originalUrl}</MediaUrl>
                  {media.mediumUrl && <MediaUrl>Medium: {media.mediumUrl}</MediaUrl>}
                  {media.thumbnailUrl && <MediaUrl>Thumbnail: {media.thumbnailUrl}</MediaUrl>}
                </MediaInfo>
              </MediaItem>
            ))}
          </ResultsSection>
        )}
      </TestContainer>
    </PageLayout>
  );
}
