'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.is_verified) {
      router.push('/');
      return;
    }

    const { token } = router.query;
    if (token && typeof token === 'string') {
      handleVerification(token);
    }
  }, [router.query, isAuthenticated, user, router]);

  const handleVerification = async (token: string) => {
    try {
      setIsLoading(true);
      setError('');
      setMessage('');

      const response = await fetch('/api/auth/confirm-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Verification failed');
      }

      setMessage('Email verified successfully! You can now access all features.');
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err) {
      console.error('Email verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    try {
      setIsLoading(true);
      setError('');
      setMessage('');

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send verification email');
      }

      setMessage('Verification email sent! Check your inbox.');

    } catch (err) {
      console.error('Resend verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send verification email');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (user?.is_verified) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Verify Email | Burg Ink</title>
        <meta name="description" content="Verify your email address" />
      </Head>
      
      <VerifyEmailContainer>
        <VerifyEmailCard>
          <Logo>
            <h1>Burg Ink</h1>
            <p>Contemporary Art Gallery</p>
          </Logo>
          
          <VerifyEmailContent>
            <FormTitle>Verify Your Email</FormTitle>
            <Subtitle>
              We've sent a verification link to <strong>{user?.email}</strong>. 
              Please check your email and click the link to verify your account.
            </Subtitle>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {message && <SuccessMessage>{message}</SuccessMessage>}
            
            <ResendButton onClick={resendVerification} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Resend Verification Email'}
            </ResendButton>
            
            <BackToHome>
              <a href="/">← Back to Home</a>
            </BackToHome>
          </VerifyEmailContent>
        </VerifyEmailCard>
      </VerifyEmailContainer>
    </>
  );
}

const VerifyEmailContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 1rem;
`;

const VerifyEmailCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 500px;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #333;
    margin: 0;
    letter-spacing: 0.05em;
  }
  
  p {
    color: #666;
    margin: 0.5rem 0 0 0;
    font-size: 0.9rem;
  }
`;

const VerifyEmailContent = styled.div`
  text-align: center;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 1rem 0;
`;

const Subtitle = styled.p`
  color: #666;
  margin: 0 0 2rem 0;
  font-size: 1rem;
  line-height: 1.5;
`;

const ResendButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #96885f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-bottom: 1.5rem;
  
  &:hover:not(:disabled) {
    background-color: #7a6e4e;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const BackToHome = styled.div`
  a {
    color: #96885f;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  background-color: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border: 1px solid #fcc;
`;

const SuccessMessage = styled.div`
  background-color: #efe;
  color: #363;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border: 1px solid #cfc;
`;
