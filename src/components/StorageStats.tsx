import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { formatFileSize } from '@/utils/storage';

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  fileTypes: { [key: string]: number };
}

const StorageStatsContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #96885f;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: #ccc;
`;

const FileTypesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const FileTypeTag = styled.span`
  background: rgba(150, 136, 95, 0.2);
  color: #96885f;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
`;

const LoadingText = styled.div`
  color: #ccc;
  text-align: center;
  padding: 1rem;
`;

const ErrorText = styled.div`
  color: #e53e3e;
  text-align: center;
  padding: 1rem;
`;

export const StorageStats: React.FC = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/storage/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch storage stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StorageStatsContainer>
        <LoadingText>Loading storage statistics...</LoadingText>
      </StorageStatsContainer>
    );
  }

  if (error) {
    return (
      <StorageStatsContainer>
        <ErrorText>Error: {error}</ErrorText>
      </StorageStatsContainer>
    );
  }

  if (!stats) {
    return (
      <StorageStatsContainer>
        <ErrorText>No storage data available</ErrorText>
      </StorageStatsContainer>
    );
  }

  return (
    <StorageStatsContainer>
      <h3>Storage Statistics</h3>
      
      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalFiles}</StatValue>
          <StatLabel>Total Files</StatLabel>
        </StatCard>
        
        <StatCard>
          <StatValue>{formatFileSize(stats.totalSize)}</StatValue>
          <StatLabel>Total Size</StatLabel>
        </StatCard>
      </StatsGrid>

      {Object.keys(stats.fileTypes).length > 0 && (
        <div>
          <h4>File Types</h4>
          <FileTypesList>
            {Object.entries(stats.fileTypes).map(([ext, count]) => (
              <FileTypeTag key={ext}>
                {ext}: {count}
              </FileTypeTag>
            ))}
          </FileTypesList>
        </div>
      )}
    </StorageStatsContainer>
  );
}; 