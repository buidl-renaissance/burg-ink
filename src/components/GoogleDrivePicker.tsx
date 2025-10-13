'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaGoogleDrive, FaSpinner, FaCheck, FaImage, FaVideo } from 'react-icons/fa';

// Styled Components
const PickerContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
`;

const PickerHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const PickerIcon = styled.div`
  font-size: 3rem;
  color: #4285f4;
  margin-bottom: 1rem;
`;

const PickerTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
`;

const PickerSubtitle = styled.p`
  color: #6c757d;
  margin: 0;
  font-size: 1rem;
`;

const AuthButton = styled.button<{ isLoading?: boolean }>`
  background: #4285f4;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  width: 100%;
  justify-content: center;

  &:hover:not(:disabled) {
    background: #3367d6;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FileList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin: 1rem 0;
`;

const FileItem = styled.div<{ selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-bottom: 1px solid #e9ecef;
  cursor: pointer;
  background: ${props => props.selected ? '#f8f9fa' : 'white'};
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
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

const FileCheckbox = styled.input`
  margin: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'primary' ? '#4285f4' : 'white'};
  color: ${props => props.variant === 'primary' ? 'white' : '#6c757d'};
  border: 1px solid ${props => props.variant === 'primary' ? '#4285f4' : '#e9ecef'};
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;

  &:hover {
    background: ${props => props.variant === 'primary' ? '#3367d6' : '#f8f9fa'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6c757d;
`;

// Types
interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  thumbnailLink?: string;
  webContentLink?: string;
}

interface GoogleDrivePickerProps {
  onFilesSelected: (files: GoogleDriveFile[]) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  accept?: string;
  multiple?: boolean;
}

export const GoogleDrivePicker: React.FC<GoogleDrivePickerProps> = ({
  onFilesSelected,
  onError,
  onClose,
  accept = 'image/*,video/*',
  multiple = true
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Drive API
  useEffect(() => {
    const initializeGoogleDrive = async () => {
      try {
        // Check if user is already authenticated
        const response = await fetch('/api/google-drive/auth-status');
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(data.authenticated);
          if (data.authenticated) {
            await loadFiles();
          }
        }
      } catch (error) {
        console.error('Error checking Google Drive auth status:', error);
      }
    };

    initializeGoogleDrive();
  }, [loadFiles]);

  const handleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Redirect to Google OAuth
      const response = await fetch('/api/google-drive/auth-url');
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }

      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'Authentication failed');
      onError?.(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/google-drive/files');
      if (!response.ok) {
        throw new Error('Failed to load files');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
      setError(error instanceof Error ? error.message : 'Failed to load files');
      onError?.(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (fileId: string) => {
    if (multiple) {
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        if (newSet.has(fileId)) {
          newSet.delete(fileId);
        } else {
          newSet.add(fileId);
        }
        return newSet;
      });
    } else {
      setSelectedFiles(new Set([fileId]));
    }
  };

  const handleImport = async () => {
    if (selectedFiles.size === 0) return;

    try {
      setIsLoading(true);
      setError(null);

      const selectedFileIds = Array.from(selectedFiles);
      const response = await fetch('/api/google-drive/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds: selectedFileIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to import files');
      }

      const data = await response.json();
      onFilesSelected(data.files || []);
      onClose?.();
    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Import failed');
      onError?.(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (size: string) => {
    const bytes = parseInt(size);
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FaImage />;
    if (mimeType.startsWith('video/')) return <FaVideo />;
    return <FaGoogleDrive />;
  };

  const filteredFiles = files.filter(file => {
    const acceptedTypes = accept.split(',').map(type => type.trim());
    return acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.mimeType.startsWith(type.slice(0, -1));
      }
      return file.mimeType === type;
    });
  });

  if (!isAuthenticated) {
    return (
      <PickerContainer>
        <PickerHeader>
          <PickerIcon>
            <FaGoogleDrive />
          </PickerIcon>
          <PickerTitle>Connect Google Drive</PickerTitle>
          <PickerSubtitle>
            Sign in to import files from your Google Drive
          </PickerSubtitle>
        </PickerHeader>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <AuthButton onClick={handleAuth} disabled={isLoading}>
          {isLoading ? (
            <>
              <FaSpinner className="fa-spin" />
              Connecting...
            </>
          ) : (
            <>
              <FaGoogleDrive />
              Sign in with Google
            </>
          )}
        </AuthButton>
      </PickerContainer>
    );
  }

  return (
    <PickerContainer>
      <PickerHeader>
        <PickerIcon>
          <FaGoogleDrive />
        </PickerIcon>
        <PickerTitle>Select Files from Google Drive</PickerTitle>
        <PickerSubtitle>
          Choose files to import to your media library
        </PickerSubtitle>
      </PickerHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isLoading ? (
        <LoadingContainer>
          <FaSpinner className="fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
          <p>Loading files...</p>
        </LoadingContainer>
      ) : (
        <>
          <FileList>
            {filteredFiles.map(file => (
              <FileItem
                key={file.id}
                selected={selectedFiles.has(file.id)}
                onClick={() => handleFileSelect(file.id)}
              >
                <FileIcon type={file.mimeType}>
                  {getFileIcon(file.mimeType)}
                </FileIcon>
                
                <FileInfo>
                  <FileName>{file.name}</FileName>
                  <FileSize>{formatFileSize(file.size)}</FileSize>
                </FileInfo>

                <FileCheckbox
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={() => handleFileSelect(file.id)}
                />
              </FileItem>
            ))}
          </FileList>

          {filteredFiles.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
              No files found matching your criteria
            </div>
          )}

          <ActionButtons>
            <ActionButton onClick={onClose}>
              Cancel
            </ActionButton>
            <ActionButton
              variant="primary"
              onClick={handleImport}
              disabled={selectedFiles.size === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="fa-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FaCheck />
                  Import {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''}
                </>
              )}
            </ActionButton>
          </ActionButtons>
        </>
      )}
    </PickerContainer>
  );
};
