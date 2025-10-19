'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styled from 'styled-components';
import { LoadingSpinner } from '@/components/common/LoadingSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <LoadingSpinner>Verifying authentication...</LoadingSpinner> 
}) => {
  const { isAuthenticated, loading, requireAuth } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      requireAuth();
    }
  }, [isAuthenticated, loading, requireAuth]);

  if (loading) {
    return <LoadingContainer>{fallback}</LoadingContainer>;
  }

  if (!isAuthenticated) {
    return <LoadingContainer>{fallback}</LoadingContainer>;
  }

  return <>{children}</>;
};

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
`;
