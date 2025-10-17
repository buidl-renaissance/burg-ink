'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { FaPlus, FaTimes, FaSpinner, FaCheck, FaEye } from 'react-icons/fa';

interface MediaItem {
  id: string | number;
  detected_type?: string | null;
  detection_confidence?: string | null;
  detections?: string | null;
  suggested_entity_id?: number | null;
  suggested_entity_type?: string | null;
  title?: string;
  description?: string;
  alt_text?: string;
  tags?: string[];
}

interface MediaClassificationPromptProps {
  media: MediaItem;
  onCreateTattoo?: (mediaId: string | number) => Promise<void>;
  onCreateArtwork?: (mediaId: string | number) => Promise<void>;
  onDismiss?: () => void;
  onViewEntity?: (entityType: string, entityId: number) => void;
  className?: string;
}

export const MediaClassificationPrompt: React.FC<MediaClassificationPromptProps> = ({
  media,
  onCreateTattoo,
  onCreateArtwork,
  onDismiss,
  onViewEntity,
  className
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [createdEntity, setCreatedEntity] = useState<{ type: string; id: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confidence = media.detection_confidence ? parseFloat(media.detection_confidence) : 0;
  const detectedType = media.detected_type;
  const hasEntityLink = media.suggested_entity_id && media.suggested_entity_type;

  // Don't show prompt if confidence is too low or already has entity link
  if (confidence < 0.6 || hasEntityLink) {
    return null;
  }

  const handleCreateEntity = async (type: 'tattoo' | 'artwork') => {
    setIsCreating(true);
    setError(null);

    try {
      const createFunction = type === 'tattoo' ? onCreateTattoo : onCreateArtwork;
      if (!createFunction) {
        throw new Error(`${type} creation not available`);
      }

      await createFunction(media.id);
      
      // Simulate entity creation (in real implementation, this would come from the API response)
      setCreatedEntity({ type, id: Math.floor(Math.random() * 1000) });
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        onDismiss?.();
      }, 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entity');
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewEntity = () => {
    if (createdEntity) {
      onViewEntity?.(createdEntity.type, createdEntity.id);
    }
  };

  const getConfidenceColor = () => {
    if (confidence >= 0.8) return '#22c55e'; // Green
    if (confidence >= 0.6) return '#eab308'; // Yellow
    return '#6b7280'; // Gray
  };

  const getConfidenceLabel = () => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (createdEntity) {
    return (
      <PromptContainer className={className} success>
        <PromptContent>
          <SuccessIcon>
            <FaCheck />
          </SuccessIcon>
          <PromptText>
            <PromptTitle>Success!</PromptTitle>
            <PromptDescription>
              Created {createdEntity.type} from this media
            </PromptDescription>
          </PromptText>
          <PromptActions>
            <PromptButton onClick={handleViewEntity} primary>
              <FaEye /> View {createdEntity.type}
            </PromptButton>
          </PromptActions>
        </PromptContent>
      </PromptContainer>
    );
  }

  return (
    <PromptContainer className={className}>
      <PromptContent>
        <PromptIcon type={detectedType} confidence={confidence}>
          {detectedType === 'tattoo' ? '💉' : detectedType === 'artwork' ? '🎨' : '❓'}
        </PromptIcon>
        <PromptText>
          <PromptTitle>
            Create {detectedType === 'tattoo' ? 'Tattoo' : 'Artwork'}?
          </PromptTitle>
          <PromptDescription>
            AI detected this as a <strong>{detectedType}</strong> with{' '}
            <strong style={{ color: getConfidenceColor() }}>
              {getConfidenceLabel()} confidence ({Math.round(confidence * 100)}%)
            </strong>
          </PromptDescription>
          {media.title && (
            <PromptSubtext>
              Suggested title: &quot;{media.title}&quot;
            </PromptSubtext>
          )}
        </PromptText>
        <PromptActions>
          {detectedType === 'tattoo' && (
            <PromptButton 
              onClick={() => handleCreateEntity('tattoo')}
              loading={isCreating}
              disabled={isCreating}
              primary
            >
              {isCreating ? <FaSpinner className="spinner" /> : <FaPlus />}
              Create Tattoo
            </PromptButton>
          )}
          {detectedType === 'artwork' && (
            <PromptButton 
              onClick={() => handleCreateEntity('artwork')}
              loading={isCreating}
              disabled={isCreating}
              primary
            >
              {isCreating ? <FaSpinner className="spinner" /> : <FaPlus />}
              Create Artwork
            </PromptButton>
          )}
          <PromptButton onClick={onDismiss} secondary>
            <FaTimes />
            Dismiss
          </PromptButton>
        </PromptActions>
      </PromptContent>
      
      {error && (
        <ErrorMessage>
          <strong>Error:</strong> {error}
        </ErrorMessage>
      )}
    </PromptContainer>
  );
};

const PromptContainer = styled.div<{ success?: boolean }>`
  background: ${props => props.success 
    ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
    : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'};
  border: 2px solid ${props => props.success ? '#10b981' : '#f59e0b'};
  border-radius: 12px;
  padding: 1rem;
  margin: 0.5rem 0;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const PromptContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PromptIcon = styled.div<{ type?: string | null; confidence: number }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: ${props => {
    if (props.type === 'tattoo') {
      return props.confidence >= 0.8 ? '#22c55e' : props.confidence >= 0.6 ? '#eab308' : '#6b7280';
    } else if (props.type === 'artwork') {
      return props.confidence >= 0.8 ? '#3b82f6' : props.confidence >= 0.6 ? '#8b5cf6' : '#6b7280';
    }
    return '#6b7280';
  }};
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const SuccessIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: #10b981;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const PromptText = styled.div`
  flex: 1;
  min-width: 0;
`;

const PromptTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
`;

const PromptDescription = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.4;
`;

const PromptSubtext = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  font-style: italic;
`;

const PromptActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const PromptButton = styled.button<{ primary?: boolean; secondary?: boolean; loading?: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  ${props => props.primary && `
    background: #1f2937;
    color: white;
    
    &:hover:not(:disabled) {
      background: #374151;
      transform: translateY(-1px);
    }
  `}
  
  ${props => props.secondary && `
    background: rgba(255, 255, 255, 0.8);
    color: #6b7280;
    border: 1px solid rgba(0, 0, 0, 0.1);
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.9);
      color: #374151;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  margin-top: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #dc2626;
  
  strong {
    font-weight: 600;
  }
`;
