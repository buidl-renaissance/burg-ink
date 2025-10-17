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

const PreviewVideo = styled.video`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

// const ProgressContainer = styled.div`
//   width: 100%;
//   margin-top: 1rem;
//   padding: 0.75rem;
//   background: #f8f9fa;
//   border-radius: 6px;
//   text-align: center;
//   color: #6c757d;
//   font-size: 0.9rem;
// `;

export const UploadMedia: React.FC<UploadMediaProps> = ({
  onUploadComplete,
  mediaUrls,
  accept = 'image/*,video/*'
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

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov|avi|wmv|flv|mkv)$/i) || 
           url.includes('video/') || 
           url.includes('blob:') && url.includes('video');
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
              isVideo(url) ? (
                <PreviewVideo key={index} controls muted>
                  <source src={url} type="video/mp4" />
                  Your browser does not support the video tag.
                </PreviewVideo>
              ) : (
                <PreviewImage key={index} src={url} alt={`Preview ${index + 1}`} />
              )
            ))}
          </PreviewGrid>
        </PreviewContainer>
      )}
    </UploadContainer>
  );
};