'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FaTrash, 
  FaDownload, 
  FaTag, 
  FaTimes, 
  FaSpinner
} from 'react-icons/fa';

// Styled Components
const BulkContainer = styled.div<{ visible: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #96885f;
  color: white;
  padding: 1rem 2rem;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  transform: ${props => props.visible ? 'translateY(0)' : 'translateY(100%)'};
  transition: transform 0.3s ease;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1rem;
    gap: 0.75rem;
  }
`;

const BulkInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
`;

const BulkCount = styled.div`
  font-weight: 600;
  font-size: 1.1rem;
`;

const BulkActions = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const BulkButton = styled.button<{ variant?: 'danger' | 'secondary' }>`
  background: ${props => {
    if (props.variant === 'danger') return '#dc3545';
    if (props.variant === 'secondary') return 'rgba(255, 255, 255, 0.2)';
    return 'white';
  }};
  color: ${props => props.variant === 'secondary' ? 'white' : '#333'};
  border: 1px solid ${props => props.variant === 'secondary' ? 'rgba(255, 255, 255, 0.3)' : 'transparent'};
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;

  &:hover {
    background: ${props => {
      if (props.variant === 'danger') return '#c82333';
      if (props.variant === 'secondary') return 'rgba(255, 255, 255, 0.3)';
      return '#f8f9fa';
    }};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const ModalContent = styled.div`
  margin-bottom: 2rem;
`;

const ModalText = styled.p`
  color: #6c757d;
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button<{ variant?: 'danger' | 'secondary' }>`
  background: ${props => {
    if (props.variant === 'danger') return '#dc3545';
    if (props.variant === 'secondary') return '#6c757d';
    return '#96885f';
  }};
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: ${props => {
      if (props.variant === 'danger') return '#c82333';
      if (props.variant === 'secondary') return '#5a6268';
      return '#7a6f4d';
    }};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TagInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
`;

const TagList = styled.div`
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

// Types
interface MediaBulkOperationsProps {
  selectedItems: number[];
  onBulkDelete: (ids: number[]) => Promise<void>;
  onBulkDownload: (ids: number[]) => Promise<void>;
  onBulkTag: (ids: number[], tags: string[]) => Promise<void>;
  onClearSelection: () => void;
  isProcessing: boolean;
}

export const MediaBulkOperations: React.FC<MediaBulkOperationsProps> = ({
  selectedItems,
  onBulkDelete,
  onBulkDownload,
  onBulkTag,
  onClearSelection,
  isProcessing
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleBulkDelete = async () => {
    try {
      await onBulkDelete(selectedItems);
      setShowDeleteModal(false);
      onClearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const handleBulkDownload = async () => {
    try {
      await onBulkDownload(selectedItems);
    } catch (error) {
      console.error('Bulk download failed:', error);
    }
  };

  const handleBulkTag = async () => {
    if (tags.length === 0) return;
    
    try {
      await onBulkTag(selectedItems, tags);
      setShowTagModal(false);
      setTags([]);
      setNewTag('');
      onClearSelection();
    } catch (error) {
      console.error('Bulk tagging failed:', error);
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

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <>
      <BulkContainer visible={selectedItems.length > 0}>
        <BulkInfo>
          <BulkCount>
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
          </BulkCount>
        </BulkInfo>

        <BulkActions>
          <BulkButton 
            onClick={handleBulkDownload}
            disabled={isProcessing}
          >
            <FaDownload />
            Download
          </BulkButton>

          <BulkButton 
            variant="secondary"
            onClick={() => setShowTagModal(true)}
            disabled={isProcessing}
          >
            <FaTag />
            Add Tags
          </BulkButton>

          <BulkButton 
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            disabled={isProcessing}
          >
            <FaTrash />
            Delete
          </BulkButton>

          <CloseButton onClick={onClearSelection}>
            <FaTimes />
          </CloseButton>
        </BulkActions>
      </BulkContainer>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ModalOverlay onClick={() => setShowDeleteModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Delete Media</ModalTitle>
              <CloseButton onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            
            <ModalContent>
              <ModalText>
                Are you sure you want to delete {selectedItems.length} media file{selectedItems.length !== 1 ? 's' : ''}? 
                This action cannot be undone.
              </ModalText>
            </ModalContent>

            <ModalActions>
              <ModalButton variant="secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </ModalButton>
              <ModalButton variant="danger" onClick={handleBulkDelete} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <FaSpinner className="fa-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash />
                    Delete
                  </>
                )}
              </ModalButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <ModalOverlay onClick={() => setShowTagModal(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Add Tags</ModalTitle>
              <CloseButton onClick={() => setShowTagModal(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            
            <ModalContent>
              <ModalText>
                Add tags to {selectedItems.length} media file{selectedItems.length !== 1 ? 's' : ''}:
              </ModalText>
              
              <TagInput
                type="text"
                placeholder="Enter a tag and press Enter..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              
              {tags.length > 0 && (
                <TagList>
                  {tags.map((tag, index) => (
                    <TagChip key={index}>
                      {tag}
                      <RemoveTagButton onClick={() => removeTag(tag)}>
                        <FaTimes />
                      </RemoveTagButton>
                    </TagChip>
                  ))}
                </TagList>
              )}
            </ModalContent>

            <ModalActions>
              <ModalButton variant="secondary" onClick={() => setShowTagModal(false)}>
                Cancel
              </ModalButton>
              <ModalButton onClick={handleBulkTag} disabled={tags.length === 0 || isProcessing}>
                {isProcessing ? (
                  <>
                    <FaSpinner className="fa-spin" />
                    Adding Tags...
                  </>
                ) : (
                  <>
                    <FaTag />
                    Add Tags
                  </>
                )}
              </ModalButton>
            </ModalActions>
          </Modal>
        </ModalOverlay>
      )}
    </>
  );
};
