import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const Container = styled.div<{ $overlay?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  
  ${props => props.$overlay && `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    z-index: 10;
  `}
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const Message = styled.p<{ $error?: boolean }>`
  margin: 0;
  font-size: 14px;
  color: ${props => props.$error ? '#e74c3c' : '#666'};
  text-align: center;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const ErrorIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
`;

const RetryButton = styled.button`
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 8px;
  
  &:hover {
    background: #2980b9;
  }
`;

interface MediaProcessingIndicatorProps {
  processing?: boolean;
  failed?: boolean;
  message?: string;
  overlay?: boolean;
  onRetry?: () => void;
}

/**
 * Component to show media processing status
 * 
 * @example
 * <MediaProcessingIndicator 
 *   processing={isProcessing}
 *   failed={hasFailed}
 *   message="Processing your image..."
 *   overlay
 * />
 */
export const MediaProcessingIndicator: React.FC<MediaProcessingIndicatorProps> = ({
  processing = false,
  failed = false,
  message,
  overlay = false,
  onRetry,
}) => {
  if (!processing && !failed) {
    return null;
  }

  const defaultMessage = failed 
    ? 'Processing failed. Please try again.'
    : 'Processing your image...';

  return (
    <Container $overlay={overlay}>
      {failed ? (
        <>
          <ErrorIcon>!</ErrorIcon>
          <Message $error>{message || defaultMessage}</Message>
          {onRetry && (
            <RetryButton onClick={onRetry}>Retry</RetryButton>
          )}
        </>
      ) : (
        <>
          <Spinner />
          <Message>{message || defaultMessage}</Message>
        </>
      )}
    </Container>
  );
};

export default MediaProcessingIndicator;

