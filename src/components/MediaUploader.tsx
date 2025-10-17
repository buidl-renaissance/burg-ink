'use client';

import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { FaUpload, FaGoogleDrive, FaSpinner, FaCheck, FaTimes, FaImage, FaVideo, FaFile } from 'react-icons/fa';

// Styled Components
const UploadContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const UploadArea = styled.div<{ isDragOver: boolean; isUploading: boolean }>`
  border: 2px dashed ${props => props.isDragOver ? '#96885f' : '#e9ecef'};
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  background: ${props => props.isDragOver ? '#f8f9fa' : 'white'};
  transition: all 0.3s ease;
  cursor: ${props => props.isUploading ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.isUploading ? 0.7 : 1};

  &:hover {
    border-color: #96885f;
    background: #f8f9fa;
  }
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  color: #96885f;
  margin-bottom: 1rem;
`;

const UploadTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const UploadSubtitle = styled.p`
  color: #6c757d;
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
`;

const UploadOptions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const UploadButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'primary' ? '#96885f' : 'white'};
  color: ${props => props.variant === 'primary' ? 'white' : '#96885f'};
  border: 2px solid #96885f;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;

  &:hover {
    background: ${props => props.variant === 'primary' ? '#7a6f4d' : '#96885f'};
    color: white;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const ProgressContainer = styled.div`
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ProgressTitle = styled.h4`
  margin: 0;
  font-size: 1rem;
  color: #333;
`;

const ProgressText = styled.span`
  font-size: 0.9rem;
  color: #6c757d;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: #96885f;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const FileList = styled.div`
  margin-top: 1rem;
`;

const FileItem = styled.div<{ status: 'pending' | 'uploading' | 'completed' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 0.5rem;
`;

const FileIcon = styled.div<{ type: string }>`
  color: ${props => {
    if (props.type.startsWith('image/')) return '#28a745';
    if (props.type.startsWith('video/')) return '#dc3545';
    return '#6c757d';
  }};
  font-size: 1.2rem;
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.div`
  font-size: 0.85rem;
  color: #6c757d;
`;

const FileStatus = styled.div<{ status: 'pending' | 'uploading' | 'completed' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: ${props => {
    switch (props.status) {
      case 'completed': return '#28a745';
      case 'uploading': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  }};
`;

const StatusIcon = styled.div`
  font-size: 1rem;
`;

// Types
interface UploadFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

interface MediaUploaderProps {
  onUploadComplete: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in MB
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  accept = 'image/*,video/*',
  multiple = true,
  maxFiles = 10,
  maxFileSize = 100
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FaImage />;
    if (mimeType.startsWith('video/')) return <FaVideo />;
    return <FaFile />;
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return 'File type not supported';
    }

    return null;
  };

  const uploadFilesSequentially = async (filesToUpload: UploadFile[]) => {
    if (filesToUpload.length === 0) return;

    setIsUploading(true);

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of filesToUpload) {
        await uploadFile(file);
      }

      // Get completed URLs from all files
      const completedFiles = uploadFiles.filter(f => f.status === 'completed');
      const urls = completedFiles.map(f => f.url!).filter(Boolean);
      
      if (urls.length > 0) {
        onUploadComplete(urls);
      }

    } catch (error) {
      console.error('Upload process error:', error);
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check max files limit
    if (uploadFiles.length + fileArray.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newFiles: UploadFile[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        newFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          status: 'pending',
          progress: 0
        });
      }
    });

    if (errors.length > 0) {
      onUploadError?.(errors.join(', '));
    }

    if (newFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...newFiles]);
      // Automatically start uploading the new files
      uploadFilesSequentially(newFiles);
    }
  }, [uploadFiles.length, maxFiles, onUploadError, uploadFilesSequentially, validateFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (isUploading) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [isUploading, handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isUploading]);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the area click from firing
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isUploading]);

  const handleGoogleDriveClick = useCallback(() => {
    // TODO: Implement Google Drive picker
    console.log('Google Drive picker not implemented yet');
  }, []);

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    const formData = new FormData();
    formData.append('image', uploadFile.file);

    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/upload-media', {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100, url: data.url }
          : f
      ));

    } catch (error) {
      console.error('Upload error:', error);
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
          : f
      ));
    }
  };



  const totalProgress = uploadFiles.length > 0 
    ? uploadFiles.reduce((sum, f) => sum + f.progress, 0) / uploadFiles.length 
    : 0;

  const completedCount = uploadFiles.filter(f => f.status === 'completed').length;
  const errorCount = uploadFiles.filter(f => f.status === 'error').length;

  return (
    <UploadContainer>
      <UploadArea
        isDragOver={isDragOver}
        isUploading={isUploading}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <UploadIcon>
          <FaUpload />
        </UploadIcon>
        <UploadTitle>
          {isUploading ? 'Uploading...' : 'Upload Media Files'}
        </UploadTitle>
        <UploadSubtitle>
          Drag and drop files here, or click to browse. Files will upload automatically.
        </UploadSubtitle>
        
        <UploadOptions>
          <UploadButton variant="primary" onClick={handleButtonClick} disabled={isUploading}>
            <FaUpload />
            Choose Files
          </UploadButton>
          <UploadButton onClick={handleGoogleDriveClick} disabled={isUploading}>
            <FaGoogleDrive />
            From Google Drive
          </UploadButton>
        </UploadOptions>

        <FileInput
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
        />
      </UploadArea>

      {uploadFiles.length > 0 && (
        <ProgressContainer>
          <ProgressHeader>
            <ProgressTitle>Upload Progress</ProgressTitle>
            <ProgressText>
              {isUploading ? 'Uploading...' : 'Upload complete'}
              {completedCount > 0 && ` - ${completedCount} of ${uploadFiles.length} completed`}
              {errorCount > 0 && `, ${errorCount} failed`}
            </ProgressText>
          </ProgressHeader>
          
          <ProgressBar>
            <ProgressFill progress={totalProgress} />
          </ProgressBar>

          <FileList>
            {uploadFiles.map(file => (
              <FileItem key={file.id} status={file.status}>
                <FileIcon type={file.file.type}>
                  {getFileIcon(file.file.type)}
                </FileIcon>
                
                <FileInfo>
                  <FileName>{file.file.name}</FileName>
                  <FileSize>{formatFileSize(file.file.size)}</FileSize>
                </FileInfo>

                <FileStatus status={file.status}>
                  <StatusIcon>
                    {file.status === 'pending' && <FaSpinner />}
                    {file.status === 'uploading' && <FaSpinner className="fa-spin" />}
                    {file.status === 'completed' && <FaCheck />}
                    {file.status === 'error' && <FaTimes />}
                  </StatusIcon>
                  {file.status === 'error' && file.error}
                </FileStatus>
              </FileItem>
            ))}
          </FileList>

        </ProgressContainer>
      )}
    </UploadContainer>
  );
};
