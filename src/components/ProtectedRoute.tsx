'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styled from 'styled-components';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <LoadingSpinner>Loading...</LoadingSpinner> 
}) => {
  const { isAuthenticated, loading, requireAuth } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      requireAuth();
    }
  }, [isAuthenticated, loading, requireAuth]);

  if (loading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 1.1rem;
  color: #666;
`;
