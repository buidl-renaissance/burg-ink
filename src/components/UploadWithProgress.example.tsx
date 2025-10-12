/**
 * EXAMPLE: How to use the media processing system with real-time updates
 * 
 * This shows how to integrate the upload, polling, and UI update system.
 * Copy and adapt this pattern to your existing upload components.
 */

import React, { useState } from 'react';
import styled from 'styled-components';
import { useMediaProcessing } from '@/hooks/useMediaProcessing';
import { MediaProcessingIndicator } from './MediaProcessingIndicator';

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
`;

const UploadButton = styled.label`
  display: inline-block;
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    background: #2980b9;
  }
  
  input {
    display: none;
  }
`;

const MediaPreview = styled.div`
  position: relative;
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #f9f9f9;
`;

const Image = styled.img`
  width: 100%;
  height: auto;
  display: block;
`;

const MediaInfo = styled.div`
  padding: 16px;
  background: white;
`;

const Title = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
`;

const Description = styled.p`
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  padding: 4px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 16px;
  font-size: 12px;
`;

export const UploadWithProgressExample: React.FC = () => {
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use the media processing hook to track status
  const { status, isProcessing, error: processingError } = useMediaProcessing({
    mediaId: uploadedMediaId || '',
    enabled: !!uploadedMediaId,
    onComplete: (data) => {
      console.log('Processing complete!', data);
    },
    onError: (err) => {
      console.error('Processing error:', err);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Upload the file
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/local', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Set the media ID to start tracking processing
      setUploadedMediaId(data.media.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container>
      <h2>Upload Media with Real-time Processing</h2>
      
      <UploadButton>
        {uploading ? 'Uploading...' : 'Choose File'}
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileSelect}
          disabled={uploading || isProcessing}
        />
      </UploadButton>

      {error && (
        <p style={{ color: '#e74c3c', marginTop: '12px' }}>{error}</p>
      )}

      {uploadedMediaId && (
        <MediaPreview>
          {/* Show processing indicator while processing */}
          {isProcessing && (
            <MediaProcessingIndicator 
              processing
              message="Processing your image..."
              overlay
            />
          )}
          
          {/* Show error indicator if processing failed */}
          {processingError && (
            <MediaProcessingIndicator 
              failed
              message="Processing failed. Please try again."
              overlay
              onRetry={() => {
                // Optionally implement retry logic
                window.location.reload();
              }}
            />
          )}

          {/* Show the image once processing is complete */}
          {status?.data && (
            <>
              <Image 
                src={status.data.medium_url || status.data.original_url} 
                alt={status.data.alt_text || 'Uploaded image'}
              />
              <MediaInfo>
                <Title>{status.data.title || 'Untitled'}</Title>
                <Description>{status.data.description}</Description>
                {status.data.tags.length > 0 && (
                  <Tags>
                    {status.data.tags.map((tag, index) => (
                      <Tag key={index}>{tag}</Tag>
                    ))}
                  </Tags>
                )}
              </MediaInfo>
            </>
          )}
        </MediaPreview>
      )}
    </Container>
  );
};

/**
 * INTEGRATION GUIDE:
 * 
 * 1. Import the hook and components:
 *    import { useMediaProcessing } from '@/hooks/useMediaProcessing';
 *    import { MediaProcessingIndicator } from '@/components/MediaProcessingIndicator';
 * 
 * 2. After uploading, get the media ID from the response
 * 
 * 3. Use the hook to track processing:
 *    const { status, isProcessing, error } = useMediaProcessing({
 *      mediaId: yourMediaId,
 *      onComplete: (data) => {
 *        // Handle completion
 *      }
 *    });
 * 
 * 4. Show the indicator while processing:
 *    {isProcessing && <MediaProcessingIndicator processing />}
 * 
 * 5. Show the final media when complete:
 *    {status?.data && <YourMediaDisplay data={status.data} />}
 * 
 * PROCESSING STATES:
 * - pending: Initial state after upload
 * - processing: Image is being resized and analyzed
 * - null: Processing complete (check for medium_url/thumbnail_url presence)
 * - failed: Processing failed (show error UI)
 * 
 * The hook automatically:
 * - Polls the status endpoint every 2 seconds
 * - Stops polling when processing is complete or failed
 * - Calls onComplete when done
 * - Calls onError if failed
 */

