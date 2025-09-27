import React, { useState } from 'react';
import styled from 'styled-components';
import { EnhancedUpload } from './EnhancedUpload';

interface UploadMediaProps {
  onUploadComplete?: (urls: string[]) => void;
  mediaUrls?: string[];
  accept?: string;
}

interface UploadedMedia {
  id: string;
  originalUrl: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  processing: boolean;
  filename?: string;
}

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 1rem;
`;

const PreviewContainer = styled.div`
  width: 100%;
  margin-top: 1rem;
  position: relative;
`;

const PreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

export const UploadMedia: React.FC<UploadMediaProps> = ({
  onUploadComplete,
  mediaUrls,
  accept = 'image/*'
}) => {
  const [previews, setPreviews] = useState<string[]>(mediaUrls || []);

  const handleUploadComplete = (media: UploadedMedia[]) => {
    // Extract URLs for backward compatibility
    const urls = media.map(m => m.originalUrl);
    setPreviews(prev => [...prev, ...urls]);
    if (onUploadComplete) onUploadComplete(urls);
  };

  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
  };

  return (
    <UploadContainer>
      <EnhancedUpload
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        accept={accept}
        multiple={true}
        showPreviews={false} // We'll show our own previews below
      />
      
      {previews.length > 0 && (
        <PreviewContainer>
          <PreviewGrid>
            {previews.map((url, index) => (
              <PreviewImage key={index} src={url} alt={`Preview ${index + 1}`} />
            ))}
          </PreviewGrid>
        </PreviewContainer>
      )}
    </UploadContainer>
  );
};