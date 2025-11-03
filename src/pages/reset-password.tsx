'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { FaEye, FaEyeSlash, FaCheck, FaTimes, FaArrowLeft } from 'react-icons/fa';
import Head from 'next/head';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/common/ToastContainer';
import { SecurityBadge } from '@/components/auth/SecurityBadge';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { AuthNavBar } from '@/components/auth/AuthNavBar';

export default function ResetPasswordPage() {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [validation, setValidation] = useState({
    password: { isValid: false, message: '' },
    confirmPassword: { isValid: false, message: '' }
  });
  const [countdown, setCountdown] = useState(0);
  
  // Toast notifications
  const { toasts, success, error, warning, loading, removeToast } = useToast();

  // Auto-focus password field on mount
  useEffect(() => {
    if (passwordRef.current) {
      passwordRef.current.focus();
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

  // Real-time validation functions
  const validatePassword = (password: string) => {
    const isValid = password.length >= 8;
    return {
      isValid,
      message: password && !isValid ? 'Password must be at least 8 characters' : ''
    };
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    const isValid = confirmPassword === password && password.length > 0;
    return {
      isValid,
      message: confirmPassword && !isValid ? 'Passwords do not match' : ''
    };
  };

  useEffect(() => {
    const { token } = router.query;
    if (!token) {
      router.push('/forgot-password');
    }
  }, [router.query, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const passwordValidation = validatePassword(formData.password);
    const confirmPasswordValidation = validateConfirmPassword(formData.confirmPassword, formData.password);
    
    setValidation({
      password: passwordValidation,
      confirmPassword: confirmPasswordValidation
    });
    
    if (!passwordValidation.isValid || !confirmPasswordValidation.isValid) {
      warning({
        title: 'Please check your passwords',
        message: 'Make sure your password is at least 8 characters and both passwords match.'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      loading({
        title: 'Resetting password',
        message: 'Please wait while we update your password...'
      });

      const { token } = router.query;
      if (!token) {
        throw new Error('Invalid reset token. Please request a new password reset.');
      }
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        await response.json(); // Response may contain error details, but we use status codes instead
        let errorMessage = 'Failed to reset password';
        
        if (response.status === 400) {
          errorMessage = 'Invalid or expired reset token. Please request a new password reset.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a few moments.';
        }
        
        throw new Error(errorMessage);
      }

      success({
        title: 'Password reset successfully!',
        message: 'Your password has been updated. You can now sign in with your new password.'
      });
      
      // Start countdown timer before redirect
      setCountdown(3);
      
      // Redirect to login after countdown
      setTimeout(() => {
        router.push('/login');
      }, 3000);

    } catch (err) {
      console.error('Reset password error:', err);
      error({
        title: 'Password reset failed',
        message: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
        action: {
          label: 'Request New Reset',
          onClick: () => router.push('/forgot-password')
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && countdown === 0) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Real-time validation
    if (name === 'password') {
      const passwordValidation = validatePassword(value);
      const confirmPasswordValidation = validateConfirmPassword(formData.confirmPassword, value);
      setValidation({
        password: passwordValidation,
        confirmPassword: confirmPasswordValidation
      });
    } else if (name === 'confirmPassword') {
      const confirmPasswordValidation = validateConfirmPassword(value, formData.password);
      setValidation(prev => ({ ...prev, confirmPassword: confirmPasswordValidation }));
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password | Burg Ink</title>
        <meta name="description" content="Reset your Burg Ink password" />
      </Head>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <AuthNavBar showBackButton={true} backHref="/login" backLabel="Back to Login" />
      
      <ResetPasswordContainer>
        <ResetPasswordCard>
          <Logo>
            <h1>Burg Ink</h1>
            <p>Contemporary Art Gallery</p>
          </Logo>
          
          <SecurityBadge variant="compact" />
          
          <ResetPasswordForm onSubmit={handleSubmit}>
            <FormTitle>Reset Password</FormTitle>
            <Subtitle>Enter your new secure password below.</Subtitle>
            
            {countdown > 0 && (
              <SuccessMessage>
                Password reset successfully! Redirecting to login in {countdown} seconds...
              </SuccessMessage>
            )}
            
            <FormGroup>
              <Label htmlFor="password">New Password</Label>
              <PasswordStrength
                password={formData.password}
                showPassword={showPassword}
                onToggleShowPassword={() => setShowPassword(!showPassword)}
              />
              {validation.password.message && (
                <ValidationMessage>{validation.password.message}</ValidationMessage>
              )}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <InputContainer>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Confirm your new password"
                  required
                  aria-describedby="confirm-password-validation"
                  aria-invalid={formData.confirmPassword ? !validation.confirmPassword.isValid : undefined}
                  disabled={isLoading || countdown > 0}
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading || countdown > 0}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </PasswordToggle>
                {formData.confirmPassword && (
                  <ValidationIcon isValid={validation.confirmPassword.isValid}>
                    {validation.confirmPassword.isValid ? <FaCheck /> : <FaTimes />}
                  </ValidationIcon>
                )}
              </InputContainer>
              {validation.confirmPassword.message && (
                <ValidationMessage>{validation.confirmPassword.message}</ValidationMessage>
              )}
            </FormGroup>
            
            <SubmitButton type="submit" disabled={isLoading || !validation.password.isValid || !validation.confirmPassword.isValid || countdown > 0}>
              {isLoading ? (
                <>
                  <Spinner />
                  Resetting...
                </>
              ) : countdown > 0 ? (
                `Redirecting in ${countdown}s`
              ) : (
                'Reset Password'
              )}
            </SubmitButton>
            
            <BackToLogin>
              <BackLink href="/login">
                <FaArrowLeft />
                Back to Login
              </BackLink>
            </BackToLogin>
          </ResetPasswordForm>
        </ResetPasswordCard>
      </ResetPasswordContainer>
    </>
  );
}

const ResetPasswordContainer = styled.div`
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

const ResetPasswordCard = styled.div`
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

const ResetPasswordForm = styled.form`
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

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    color: #333;
    background-color: #f8f9fa;
  }
  
  &:focus {
    outline: none;
    color: #96885f;
    background-color: #f8f9fa;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ValidationIcon = styled.div<{ isValid: boolean }>`
  position: absolute;
  right: 2.5rem;
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

const SuccessMessage = styled.div`
  background-color: #f0f8ff;
  color: #1e40af;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border: 1px solid #dbeafe;
  text-align: center;
  line-height: 1.4;
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const BackToLogin = styled.div`
  text-align: center;
  margin-top: 1.5rem;
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
