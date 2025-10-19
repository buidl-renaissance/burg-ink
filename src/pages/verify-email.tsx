'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { FaEnvelope, FaCheckCircle, FaClock, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/common/ToastContainer';
import { SecurityBadge } from '@/components/auth/SecurityBadge';
import { AuthNavBar } from '@/components/auth/AuthNavBar';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  // Toast notifications
  const { toasts, success, error, warning, loading, removeToast } = useToast();

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

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
      loading({
        title: 'Verifying email',
        message: 'Please wait while we verify your email address...'
      });

      const response = await fetch('/api/auth/confirm-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Verification failed';
        
        if (response.status === 400) {
          errorMessage = 'Invalid or expired verification token. Please request a new verification email.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a few moments.';
        }
        
        throw new Error(errorMessage);
      }

      setIsVerified(true);
      success({
        title: 'Email verified successfully!',
        message: 'Your email has been verified. You can now access all features.'
      });
      
      // Redirect to home after 3 seconds
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (err) {
      console.error('Email verification error:', err);
      error({
        title: 'Verification failed',
        message: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
        action: {
          label: 'Resend Verification',
          onClick: resendVerification
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    try {
      setIsLoading(true);
      loading({
        title: 'Sending verification email',
        message: 'Please wait while we send a new verification email...'
      });

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to send verification email';
        
        if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a few moments.';
        }
        
        throw new Error(errorMessage);
      }

      success({
        title: 'Verification email sent!',
        message: 'A new verification email has been sent to your inbox. Please check your email and spam folder.'
      });
      
      // Start countdown timer
      setResendCountdown(60);

    } catch (err) {
      console.error('Resend verification error:', err);
      error({
        title: 'Failed to send verification email',
        message: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
        action: {
          label: 'Try Again',
          onClick: resendVerification
        }
      });
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
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <AuthNavBar showBackButton={true} backHref="/" backLabel="Back to Home" />
      
      <VerifyEmailContainer>
        <VerifyEmailCard>
          <Logo>
            <h1>Burg Ink</h1>
            <p>Contemporary Art Gallery</p>
          </Logo>
          
          <SecurityBadge variant="compact" />
          
          <VerifyEmailContent>
            <EmailIcon>
              {isVerified ? <FaCheckCircle /> : <FaEnvelope />}
            </EmailIcon>
            
            <FormTitle>
              {isVerified ? 'Email Verified!' : 'Verify Your Email'}
            </FormTitle>
            
            <Subtitle>
              {isVerified ? (
                'Your email has been successfully verified. Redirecting to your dashboard...'
              ) : (
                <>We've sent a verification link to <strong>{user?.email}</strong>. <br />
                Please check your email and click the link to verify your account.</>
              )}
            </Subtitle>
            
            {!isVerified && (
              <>
                <CheckEmailTip>
                  💡 Don't see the email? Check your spam folder or try resending.
                </CheckEmailTip>
                
                <ResendButton 
                  onClick={resendVerification} 
                  disabled={isLoading || resendCountdown > 0}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="spinner" />
                      Sending...
                    </>
                  ) : resendCountdown > 0 ? (
                    <>
                      <FaClock />
                      Resend in {resendCountdown}s
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </ResendButton>
              </>
            )}
            
            <BackToHome>
              <BackLink href="/">
                <FaArrowLeft />
                Back to Home
              </BackLink>
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
  padding-top: 100px; /* Account for fixed navbar */
  animation: fadeIn 0.6s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    padding-top: 80px; /* Smaller padding on mobile */
  }
`;

const VerifyEmailCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 500px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 480px) {
    padding: 1.5rem;
    margin: 0.5rem;
  }
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
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

const EmailIcon = styled.div`
  font-size: 3rem;
  color: #96885f;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
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
  transition: all 0.2s ease;
  margin-bottom: 1.5rem;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    background-color: #7a6e4e;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(150, 136, 95, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const BackToHome = styled.div`
  margin-top: 1rem;
`;

const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #96885f;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f8f9fa;
    transform: translateY(-1px);
  }
`;

const CheckEmailTip = styled.div`
  background-color: #f0f8ff;
  color: #1e40af;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  border: 1px solid #dbeafe;
  line-height: 1.4;
  margin-bottom: 1rem;
  max-width: 400px;
`;

