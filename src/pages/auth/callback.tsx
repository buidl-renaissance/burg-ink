'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const { token } = router.query;

    if (token && typeof token === 'string') {
      // Store the token in localStorage
      localStorage.setItem('authToken', token);
      
      // Redirect to home page or dashboard
      router.push('/');
    } else {
      // No token found, redirect to login
      router.push('/login');
    }
  }, [router.query, router]);

  return (
    <CallbackContainer>
      <LoadingSpinner />
      <LoadingText>Completing authentication...</LoadingText>
    </CallbackContainer>
  );
}

const CallbackContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #96885f;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: #666;
  font-size: 1rem;
  margin: 0;
`; 