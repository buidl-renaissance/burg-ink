'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import styled from 'styled-components';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f8f9fa;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #96885f;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  color: #666;
  font-size: 1rem;
`;

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // User is not authenticated, redirect to login
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
    }
  }, [loading, isAuthenticated, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <LoadingContainer>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner />
          <LoadingText>Checking authentication...</LoadingText>
        </div>
      </LoadingContainer>
    );
  }

  // If not authenticated, don't render children (redirect will happen)
  if (!isAuthenticated) {
    return (
      <LoadingContainer>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner />
          <LoadingText>Redirecting to login...</LoadingText>
        </div>
      </LoadingContainer>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};
