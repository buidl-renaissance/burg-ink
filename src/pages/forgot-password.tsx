'use client';

import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/common/ToastContainer';
import { SecurityBadge } from '@/components/auth/SecurityBadge';
import { AuthNavBar } from '@/components/auth/AuthNavBar';

export default function ForgotPasswordPage() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailValidation, setEmailValidation] = useState({ isValid: false, message: '' });
  const [countdown, setCountdown] = useState(0);
  
  // Toast notifications
  const { toasts, success, error, warning, loading, removeToast } = useToast();

  // Auto-focus email field on mount
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Real-time email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    return {
      isValid,
      message: email && !isValid ? 'Please enter a valid email address' : ''
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email before submission
    const validation = validateEmail(email);
    setEmailValidation(validation);
    
    if (!validation.isValid || !email) {
      warning({
        title: 'Please check your email',
        message: 'Make sure you enter a valid email address.'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      loading({
        title: 'Sending reset link',
        message: 'Please wait while we process your request...'
      });

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Failed to send reset email';
        
        if (response.status === 429) {
          errorMessage = 'Too many requests. Please wait a few minutes before trying again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a few moments.';
        }
        
        throw new Error(errorMessage);
      }

      success({
        title: 'Reset link sent!',
        message: 'If an account with that email exists, we\'ve sent a password reset link. Check your inbox and spam folder.'
      });
      
      // Start countdown timer
      setCountdown(60);
      
      // Clear form
      setEmail('');
      setEmailValidation({ isValid: false, message: '' });
      
    } catch (err) {
      console.error('Forgot password error:', err);
      error({
        title: 'Reset failed',
        message: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
        action: {
          label: 'Try Again',
          onClick: () => {
            setEmail('');
            if (emailRef.current) emailRef.current.focus();
          }
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && countdown === 0) {
      handleSubmit(e as any);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password | Burg Ink</title>
        <meta name="description" content="Reset your Burg Ink password" />
      </Head>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <AuthNavBar showBackButton={true} backHref="/login" backLabel="Back to Login" />
      
      <ForgotPasswordContainer>
        <ForgotPasswordCard>
          <Logo>
            <h1>Burg Ink</h1>
            <p>Contemporary Art Gallery</p>
          </Logo>
          
          <SecurityBadge variant="compact" />
          
          <ForgotPasswordForm onSubmit={handleSubmit}>
            <FormTitle>Forgot Password?</FormTitle>
            <Subtitle>Enter your email address and we'll send you a secure link to reset your password.</Subtitle>
            
            <FormGroup>
              <Label htmlFor="email">Email Address</Label>
              <InputContainer>
                <Input
                  ref={emailRef}
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailValidation(validateEmail(e.target.value));
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your email address"
                  required
                  aria-describedby="email-validation"
                  aria-invalid={email ? !emailValidation.isValid : undefined}
                  disabled={isLoading || countdown > 0}
                />
                {email && (
                  <ValidationIcon isValid={emailValidation.isValid}>
                    {emailValidation.isValid ? <FaCheck /> : <FaTimes />}
                  </ValidationIcon>
                )}
              </InputContainer>
              {emailValidation.message && (
                <ValidationMessage>{emailValidation.message}</ValidationMessage>
              )}
            </FormGroup>
            
            <SubmitButton type="submit" disabled={isLoading || !emailValidation.isValid || countdown > 0}>
              {isLoading ? (
                <>
                  <Spinner />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Send Reset Link'
              )}
            </SubmitButton>
            
            {countdown > 0 && (
              <CountdownMessage>
                Check your email for the reset link. You can request another one in {countdown} seconds.
              </CountdownMessage>
            )}
          </ForgotPasswordForm>
          
          <BackToLogin>
            <BackLink href="/login">
              <FaArrowLeft />
              Back to Login
            </BackLink>
          </BackToLogin>
        </ForgotPasswordCard>
      </ForgotPasswordContainer>
    </>
  );
}

const ForgotPasswordContainer = styled.div`
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

const ForgotPasswordCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
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

const ForgotPasswordForm = styled.form`
  margin-bottom: 1.5rem;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #666;
  text-align: center;
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s ease;
  min-height: 44px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
    transform: translateY(-1px);
  }
  
  &:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  &::placeholder {
    color: #999;
  }
  
  &[aria-invalid='true'] {
    border-color: #ef4444;
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
  
  &[aria-invalid='false'] {
    border-color: #10b981;
    
    &:focus {
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #96885f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
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
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const BackToLogin = styled.div`
  text-align: center;
  margin-top: 1.5rem;
`;

const BackLink = styled(Link)`
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

const ValidationIcon = styled.div<{ isValid: boolean }>`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.isValid ? '#10b981' : '#ef4444'};
  font-size: 0.875rem;
  pointer-events: none;
`;

const ValidationMessage = styled.div`
  font-size: 0.8rem;
  color: #ef4444;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const CountdownMessage = styled.div`
  background-color: #f0f8ff;
  color: #1e40af;
  padding: 0.75rem;
  border-radius: 6px;
  margin-top: 1rem;
  font-size: 0.85rem;
  border: 1px solid #dbeafe;
  text-align: center;
  line-height: 1.4;
`;
