import React, { useState } from 'react';
import styled from 'styled-components';
import { DropZone } from './DropZone';

interface UploadedMedia {
  id: string;
  originalUrl: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  processing: boolean;
  filename?: string;
}

interface EnhancedUploadProps {
  onUploadComplete?: (media: UploadedMedia[]) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  multiple?: boolean;
  showPreviews?: boolean;
}

const UploadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const PreviewContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const PreviewCard = styled.div`
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a1a;
  border: 1px solid #333;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
`;

const PreviewOverlay = styled.div<{ processing: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: ${props => props.processing ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
`;

const ProcessingSpinner = styled.div`
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid white;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ProgressContainer = styled.div`
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
  color: #fff;
`;

const ProgressText = styled.div`
  font-size: 14px;
  margin-bottom: 8px;
`;

const ErrorContainer = styled.div`
  background: #2d1b1b;
  border: 1px solid #d73a49;
  border-radius: 8px;
  padding: 1rem;
  color: #f85149;
  font-size: 14px;
`;

export const EnhancedUpload: React.FC<EnhancedUploadProps> = ({
  onUploadComplete,
  onUploadError,
  accept = 'image/*',
  multiple = true,
  showPreviews = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [error, setError] = useState<string>('');

  const handleFileSelect = async (files: File[]) => {
    setIsUploading(true);
    setError('');
    setUploadProgress(`Uploading ${files.length} file(s)...`);

    try {
      const uploadPromises = files.map(async (file, index) => {
        setUploadProgress(`Uploading ${index + 1} of ${files.length}: ${file.name}`);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload/local', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to upload ${file.name}: ${errorData.error || 'Upload failed'}`);
        }

        const data = await response.json();
        return data.media as UploadedMedia;
      });

      const results = await Promise.all(uploadPromises);
      setUploadedMedia(prev => [...prev, ...results]);
      
      if (onUploadComplete) {
        onUploadComplete(results);
      }

      setUploadProgress('Upload complete! Processing images...');
      
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress('');
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <UploadContainer>
      <DropZone
        onFileSelect={handleFileSelect}
        accept={accept}
        multiple={multiple}
        disabled={isUploading}
      />
      
      {uploadProgress && (
        <ProgressContainer>
          <ProgressText>{uploadProgress}</ProgressText>
        </ProgressContainer>
      )}
      
      {error && (
        <ErrorContainer>
          {error}
        </ErrorContainer>
      )}
      
      {showPreviews && uploadedMedia.length > 0 && (
        <PreviewContainer>
          {uploadedMedia.map((media) => (
            <PreviewCard key={media.id}>
              <PreviewImage 
                src={media.thumbnailUrl || media.mediumUrl || media.originalUrl} 
                alt={media.filename || 'Uploaded image'}
                onError={(e) => {
                  // Fallback to original URL if thumbnail/medium fails
                  const target = e.target as HTMLImageElement;
                  if (target.src !== media.originalUrl) {
                    target.src = media.originalUrl;
                  }
                }}
              />
              <PreviewOverlay processing={media.processing}>
                <div style={{ textAlign: 'center' }}>
                  <ProcessingSpinner />
                  <div>Processing...</div>
                </div>
              </PreviewOverlay>
            </PreviewCard>
          ))}
        </PreviewContainer>
      )}
    </UploadContainer>
  );
};
