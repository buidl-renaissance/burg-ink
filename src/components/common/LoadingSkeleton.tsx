'use client';

import styled, { keyframes } from 'styled-components';

interface LoadingSkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

const pulse = keyframes`
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 1;
  }
`;

const SkeletonBase = styled.div<LoadingSkeletonProps>`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${pulse} 1.5s ease-in-out infinite;
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '1rem'};
  border-radius: ${props => props.borderRadius || '4px'};
`;

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width,
  height,
  borderRadius,
  className
}) => {
  return (
    <SkeletonBase
      width={width}
      height={height}
      borderRadius={borderRadius}
      className={className}
    />
  );
};

// Pre-configured skeleton components for common use cases
export const SkeletonText = styled(LoadingSkeleton)`
  height: 1rem;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const SkeletonTitle = styled(LoadingSkeleton)`
  height: 1.5rem;
  width: 60%;
  margin-bottom: 1rem;
`;

export const SkeletonButton = styled(LoadingSkeleton)`
  height: 44px;
  width: 100%;
  border-radius: 6px;
`;

export const SkeletonInput = styled(LoadingSkeleton)`
  height: 44px;
  width: 100%;
  border-radius: 6px;
  margin-bottom: 1rem;
`;

export const SkeletonCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  ${SkeletonTitle} {
    margin-bottom: 1.5rem;
  }
`;

// Auth-specific skeleton layouts
export const AuthPageSkeleton = () => (
  <SkeletonCard>
    <SkeletonTitle />
    <SkeletonText width="80%" />
    <SkeletonText width="60%" />
    <SkeletonInput />
    <SkeletonInput />
    <SkeletonButton />
  </SkeletonCard>
);

export const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 1.1rem;
  color: #666;
  
  &::before {
    content: '';
    width: 24px;
    height: 24px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #96885f;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
