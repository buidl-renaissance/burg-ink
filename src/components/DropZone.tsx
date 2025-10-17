import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

interface DropZoneProps {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
}

const DropZoneContainer = styled.div<{ isDragOver: boolean; disabled: boolean }>`
  border: 2px dashed ${props => 
    props.disabled ? '#d1d5db' : 
    props.isDragOver ? '#96885f' : '#e9ecef'
  };
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  background-color: ${props => 
    props.disabled ? '#f9fafb' : 
    props.isDragOver ? '#f8f7f4' : '#ffffff'
  };
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: ${props => props.disabled ? '#d1d5db' : '#96885f'};
    background-color: ${props => props.disabled ? '#f9fafb' : '#f8f7f4'};
  }
`;

const DropZoneText = styled.div`
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
  font-weight: 600;
`;

const DropZoneSubText = styled.div`
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 20px;
  font-weight: 500;
`;

const UploadButton = styled.button<{ disabled: boolean }>`
  background-color: ${props => props.disabled ? '#d1d5db' : '#96885f'};
  color: ${props => props.disabled ? '#9ca3af' : '#ffffff'};
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: ${props => props.disabled ? '#d1d5db' : '#7a6f4d'};
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: #333;
  font-weight: 600;
  font-size: 14px;
`;

export const DropZone: React.FC<DropZoneProps> = ({
  onFileSelect,
  accept = 'image/*',
  multiple = true,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const mediaFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (mediaFiles.length > 0) {
      onFileSelect(mediaFiles);
    }
  }, [onFileSelect, disabled]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileSelect(files);
    }
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect, disabled]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <DropZoneContainer
      isDragOver={isDragOver}
      disabled={disabled}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <DropZoneText>
        {isDragOver ? 'Drop media files here' : 'Drag and drop images or videos here'}
      </DropZoneText>
      <DropZoneSubText>
        or click to select files
      </DropZoneSubText>
      <UploadButton disabled={disabled} type="button">
        Select Media
      </UploadButton>
      
      <HiddenFileInput
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        disabled={disabled}
      />
      
      {disabled && (
        <LoadingOverlay>
          <div>Uploading...</div>
        </LoadingOverlay>
      )}
    </DropZoneContainer>
  );
};
