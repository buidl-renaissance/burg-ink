'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaSave, 
  FaTimes, 
  FaSpinner, 
  FaPlus,
  FaTrash
} from 'react-icons/fa';

// Styled Components
const EditorContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
`;

const EditorTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    background: #f8f9fa;
    color: #333;
  }
`;

const EditorSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
`;

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const TagChip = styled.div`
  background: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  font-size: 0.75rem;

  &:hover {
    color: #dc3545;
  }
`;

const TagInput = styled.input`
  padding: 0.25rem 0.5rem;
  border: 1px solid #e9ecef;
  border-radius: 20px;
  font-size: 0.85rem;
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: #96885f;
  }
`;

const AddTagButton = styled.button`
  background: #96885f;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    background: #7a6f4d;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const EditorActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e9ecef;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'primary' ? '#96885f' : 'white'};
  color: ${props => props.variant === 'primary' ? 'white' : '#6c757d'};
  border: 1px solid ${props => props.variant === 'primary' ? '#96885f' : '#e9ecef'};
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${props => props.variant === 'primary' ? '#7a6f4d' : '#f8f9fa'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const MediaPreview = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const MediaImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const MediaInfo = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #6c757d;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: #333;
`;

// Types
interface MediaItem {
  id: number;
  filename: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  spaces_url?: string;
  thumbnail_url?: string;
  description?: string;
  alt_text?: string;
  tags: string[];
  processing_status: string;
  created_at: string;
}

interface MediaEditorProps {
  media: MediaItem;
  onSave: (id: number, updates: Partial<MediaItem>) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

export const MediaEditor: React.FC<MediaEditorProps> = ({
  media,
  onSave,
  onClose,
  isSaving = false
}) => {
  const [description, setDescription] = useState(media.description || '');
  const [altText, setAltText] = useState(media.alt_text || '');
  const [tags, setTags] = useState<string[]>(media.tags || []);
  const [newTag, setNewTag] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const hasDescriptionChange = description !== (media.description || '');
    const hasAltTextChange = altText !== (media.alt_text || '');
    const hasTagsChange = JSON.stringify(tags.sort()) !== JSON.stringify((media.tags || []).sort());
    
    setHasChanges(hasDescriptionChange || hasAltTextChange || hasTagsChange);
  }, [description, altText, tags, media]);

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      await onSave(media.id, {
        description,
        alt_text: altText,
        tags
      });
      onClose();
    } catch (error) {
      console.error('Failed to save media:', error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTag();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>Edit Media</EditorTitle>
        <CloseButton onClick={onClose}>
          <FaTimes />
        </CloseButton>
      </EditorHeader>

      <MediaPreview>
        {media.thumbnail_url ? (
          <MediaImage src={media.thumbnail_url} alt={media.filename} />
        ) : (
          <div style={{ 
            width: '200px', 
            height: '200px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            color: '#6c757d'
          }}>
            {media.mime_type.startsWith('image/') ? '📷' : '🎥'}
          </div>
        )}
        
        <MediaInfo>
          <InfoRow>
            <InfoLabel>Filename:</InfoLabel>
            <InfoValue>{media.filename}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Size:</InfoLabel>
            <InfoValue>{formatFileSize(media.size)}</InfoValue>
          </InfoRow>
          {media.width && media.height && (
            <InfoRow>
              <InfoLabel>Dimensions:</InfoLabel>
              <InfoValue>{media.width} × {media.height}</InfoValue>
            </InfoRow>
          )}
          <InfoRow>
            <InfoLabel>Type:</InfoLabel>
            <InfoValue>{media.mime_type}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Status:</InfoLabel>
            <InfoValue style={{ 
              color: media.processing_status === 'completed' ? '#28a745' : 
                     media.processing_status === 'processing' ? '#ffc107' : '#dc3545'
            }}>
              {media.processing_status}
            </InfoValue>
          </InfoRow>
        </MediaInfo>
      </MediaPreview>

      <EditorSection>
        <SectionTitle>Description</SectionTitle>
        <FormGroup>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description for this media..."
            rows={3}
          />
        </FormGroup>
      </EditorSection>

      <EditorSection>
        <SectionTitle>Alt Text (Accessibility)</SectionTitle>
        <FormGroup>
          <TextInput
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Enter alt text for screen readers..."
          />
        </FormGroup>
      </EditorSection>

      <EditorSection>
        <SectionTitle>Tags</SectionTitle>
        <FormGroup>
          <TagContainer>
            {tags.map((tag, index) => (
              <TagChip key={index}>
                {tag}
                <RemoveTagButton onClick={() => removeTag(tag)}>
                  <FaTrash />
                </RemoveTagButton>
              </TagChip>
            ))}
            
            <TagInput
              type="text"
              placeholder="Add tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            
            <AddTagButton onClick={addTag} disabled={!newTag.trim()}>
              <FaPlus />
              Add
            </AddTagButton>
          </TagContainer>
        </FormGroup>
      </EditorSection>

      <EditorActions>
        <ActionButton variant="secondary" onClick={onClose}>
          <FaTimes />
          Cancel
        </ActionButton>
        
        <ActionButton 
          variant="primary" 
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <FaSpinner className="fa-spin" />
              Saving...
            </>
          ) : (
            <>
              <FaSave />
              Save Changes
            </>
          )}
        </ActionButton>
      </EditorActions>
    </EditorContainer>
  );
};
