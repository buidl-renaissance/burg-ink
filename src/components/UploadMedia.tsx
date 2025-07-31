import React, { useState } from 'react';
import styled from 'styled-components';
import UploadButton from './UploadButton';

interface UploadMediaProps {
  onUploadComplete?: (urls: string[]) => void;
  mediaUrls?: string[];
  accept?: string;
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

const ProgressContainer = styled.div`
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  text-align: center;
  color: #6c757d;
  font-size: 0.9rem;
`;

export const UploadMedia: React.FC<UploadMediaProps> = ({
  onUploadComplete,
  mediaUrls,
  accept = 'image/*'
}) => {
  const [previews, setPreviews] = useState<string[]>(mediaUrls || []);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const handleUploadComplete = (urls: string[]) => {
    setPreviews(prev => [...prev, ...urls]);
    setUploadProgress(null);
    if (onUploadComplete) onUploadComplete(urls);
  };

  const handleUploadProgress = (progress: { current: number; total: number }) => {
    setUploadProgress(progress);
  };

  return (
    <UploadContainer>
      <UploadButton 
        onUploadComplete={handleUploadComplete}
        onUploadProgress={handleUploadProgress}
        accept={accept}
      />
      
      {uploadProgress && (
        <ProgressContainer>
          Uploading {uploadProgress.current} of {uploadProgress.total} files...
        </ProgressContainer>
      )}
      
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
