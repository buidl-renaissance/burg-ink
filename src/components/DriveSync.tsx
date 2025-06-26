'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaGoogleDrive, FaSync, FaFolder } from 'react-icons/fa';
import { useAuth } from '@/utils/useAuth';

interface DriveFolder {
  id: string;
  name: string;
  files: Record<string, unknown>[];
}

interface SyncResult {
  message: string;
  eventId?: string;
  status: string;
  processingMode?: string;
  note?: string;
  benefits?: string[];
}

export const DriveSync = () => {
  const { isAuthenticated } = useAuth();
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchFolders();
    }
  }, [isAuthenticated]);

  const fetchFolders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/drive/folders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }

      const data = await response.json();
      setFolders(data.folders);
    } catch (err) {
      setError('Failed to load Google Drive folders');
      console.error('Error fetching folders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedFolder) {
      setError('Please select a folder to sync');
      return;
    }

    try {
      setIsSyncing(true);
      setError('');
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/drive/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ folderId: selectedFolder }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync folder');
      }

      const result = await response.json();
      setSyncResult(result);
    } catch (err) {
      setError('Failed to sync folder');
      console.error('Error syncing folder:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SyncContainer>
        <SyncMessage>Please log in with Google to sync Drive folders</SyncMessage>
      </SyncContainer>
    );
  }

  return (
    <SyncContainer>
      <SyncHeader>
        <DriveIcon>
          <FaGoogleDrive />
        </DriveIcon>
        <SyncTitle>Google Drive Sync</SyncTitle>
      </SyncHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <FolderSection>
        <SectionTitle>Select Folder to Sync</SectionTitle>
        {isLoading ? (
          <LoadingMessage>Loading folders...</LoadingMessage>
        ) : (
          <FolderSelect
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
          >
            <option value="">Choose a folder...</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                <FaFolder /> {folder.name}
              </option>
            ))}
          </FolderSelect>
        )}
      </FolderSection>

      <SyncButton
        onClick={handleSync}
        disabled={!selectedFolder || isSyncing}
      >
        {isSyncing ? (
          <>
            <FaSync className="spinning" />
            Syncing...
          </>
        ) : (
          <>
            <FaSync />
            Sync Images
          </>
        )}
      </SyncButton>

      {syncResult && (
        <SyncResult>
          <ResultTitle>Sync Started!</ResultTitle>
          <ResultDescription>
            {syncResult.processingMode === 'parallel' ? (
              <>
                <strong>Parallel Processing Mode</strong> - Files are being processed simultaneously for faster completion.
                {syncResult.benefits && syncResult.benefits.length > 0 && (
                  <BenefitsList>
                    {syncResult.benefits.map((benefit: string, index: number) => (
                      <BenefitItem key={index}>• {benefit}</BenefitItem>
                    ))}
                  </BenefitsList>
                )}
              </>
            ) : (
              'Files are being processed in the background. Check back later for results.'
            )}
          </ResultDescription>
          {syncResult.note && <ResultNote>{syncResult.note}</ResultNote>}
          {syncResult.eventId && (
            <EventId>Event ID: {syncResult.eventId}</EventId>
          )}
        </SyncResult>
      )}
    </SyncContainer>
  );
};

// Styled components...
const SyncContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 2rem auto;
`;

const SyncHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const DriveIcon = styled.div`
  font-size: 2rem;
  color: #4285f4;
`;

const SyncTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const FolderSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 500;
  color: #555;
  margin-bottom: 1rem;
`;

const FolderSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #4285f4;
    box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
  }
`;

const SyncButton = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #3367d6;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SyncResult = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #28a745;
`;

const ResultTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #28a745;
  margin: 0 0 1rem 0;
`;

const ResultDescription = styled.div`
  font-size: 1rem;
  color: #666;
  margin-bottom: 1rem;
`;

const ResultNote = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
`;

const EventId = styled.div`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1rem;
`;

const BenefitsList = styled.ul`
  list-style-type: disc;
  padding-left: 20px;
`;

const BenefitItem = styled.li`
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const ErrorMessage = styled.div`
  background-color: #fee;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border: 1px solid #feb2b2;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 1rem;
`;

const SyncMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 2rem;
`; 