import React, { useState } from 'react';
import styled from 'styled-components';
import UploadButton from './UploadButton';

interface UploadMediaProps {
  onUploadComplete?: (url: string) => void;
  mediaUrl?: string;
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

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 4px;
`;

export const UploadMedia: React.FC<UploadMediaProps> = ({
  onUploadComplete,
  mediaUrl,
  accept = 'image/*'
}) => {
  const [preview, setPreview] = useState<string | null>(mediaUrl || null);

  const handleUploadComplete = async (url: string) => {
    setPreview(url);
    if (onUploadComplete) onUploadComplete(url);
  };

  return (
    <UploadContainer>
      <UploadButton 
        onUploadComplete={handleUploadComplete}
        accept={accept}
      />
      
      {preview && (
        <PreviewContainer>
          <PreviewImage src={preview} alt="Preview" />
        </PreviewContainer>
      )}
    </UploadContainer>
  );
};
