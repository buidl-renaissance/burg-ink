import { useState, useEffect, useCallback } from 'react';

export interface MediaStatus {
  id: string;
  status: 'pending' | 'processing' | 'failed' | null;
  processing: boolean;
  failed: boolean;
  data: {
    original_url: string;
    medium_url: string | null;
    thumbnail_url: string | null;
    title: string | null;
    description: string | null;
    alt_text: string | null;
    tags: string[];
    filename: string;
  } | null;
}

interface UseMediaProcessingOptions {
  mediaId: string;
  enabled?: boolean;
  pollInterval?: number;
  onComplete?: (data: MediaStatus['data']) => void;
  onError?: (error: string) => void;
}

/**
 * Hook to track media processing status with automatic polling
 * 
 * @example
 * const { status, isProcessing, error, refresh } = useMediaProcessing({
 *   mediaId: '123',
 *   onComplete: (data) => console.log('Processing complete!', data),
 *   onError: (error) => console.error('Processing failed:', error),
 * });
 */
export function useMediaProcessing({
  mediaId,
  enabled = true,
  pollInterval = 2000, // Poll every 2 seconds
  onComplete,
  onError,
}: UseMediaProcessingOptions) {
  const [status, setStatus] = useState<MediaStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/media/${mediaId}/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch media status');
      }

      const data: MediaStatus = await response.json();
      setStatus(data);
      setIsProcessing(data.processing);

      // Call callbacks
      if (data.failed && onError) {
        onError('Media processing failed');
        setError('Media processing failed');
      } else if (!data.processing && data.data && onComplete) {
        onComplete(data.data);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      return null;
    }
  }, [mediaId, onComplete, onError]);

  useEffect(() => {
    if (!enabled || !mediaId) {
      return;
    }

    // Initial fetch
    fetchStatus();

    // Set up polling interval
    const intervalId = setInterval(() => {
      fetchStatus().then((data) => {
        // Stop polling if processing is complete or failed
        if (data && !data.processing) {
          clearInterval(intervalId);
        }
      });
    }, pollInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [mediaId, enabled, pollInterval, fetchStatus]);

  return {
    status,
    isProcessing,
    error,
    refresh: fetchStatus,
  };
}

