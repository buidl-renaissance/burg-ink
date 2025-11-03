'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { FaGoogle, FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import Head from 'next/head';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/common/ToastContainer';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { AuthNavBar } from '@/components/auth/AuthNavBar';

export default function RegisterPage() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validation, setValidation] = useState({
    name: { isValid: false, message: '' },
    email: { isValid: false, message: '' },
    password: { isValid: false, message: '' },
    confirmPassword: { isValid: false, message: '' }
  });
  
  // Toast notifications
  const { toasts, success, error, warning, loading, removeToast } = useToast();

  // Auto-focus name field on mount
  useEffect(() => {
    if (nameRef.current) {
      nameRef.current.focus();
    }
  }, []);

  // Real-time validation functions
  const validateName = (name: string) => {
    const isValid = name.length >= 2;
    return {
      isValid,
      message: name && !isValid ? 'Name must be at least 2 characters' : ''
    };
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    return {
      isValid,
      message: email && !isValid ? 'Please enter a valid email address' : ''
    };
  };

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

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      loading({
        title: 'Connecting to Google',
        message: 'Redirecting to Google authentication...'
      });
      
      // Redirect to Google OAuth
      const googleAuthUrl = `/api/auth/google`;
      window.location.href = googleAuthUrl;
    } catch (err) {
      console.error('Google login error:', err);
      error({
        title: 'Google registration failed',
        message: 'Unable to connect to Google. Please try again or create an account with email.',
        action: {
          label: 'Try Again',
          onClick: handleGoogleLogin
        }
      });
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const nameValidation = validateName(formData.name);
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);
    const confirmPasswordValidation = validateConfirmPassword(formData.confirmPassword, formData.password);
    
    setValidation({
      name: nameValidation,
      email: emailValidation,
      password: passwordValidation,
      confirmPassword: confirmPasswordValidation
    });
    
    if (!nameValidation.isValid || !emailValidation.isValid || 
        !passwordValidation.isValid || !confirmPasswordValidation.isValid || 
        !agreeToTerms) {
      warning({
        title: 'Please complete all fields',
        message: 'Make sure all fields are filled correctly and you agree to our terms.'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      loading({
        title: 'Creating your account',
        message: 'Please wait while we set up your account...'
      });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        await response.json(); // Response may contain error details, but we use status codes instead
        let errorMessage = 'Registration failed';
        
        if (response.status === 409) {
          errorMessage = 'An account with this email already exists. Try logging in instead.';
        } else if (response.status === 400) {
          errorMessage = 'Please check your information and try again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a few moments.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Store the token
      localStorage.setItem('authToken', data.token);
      
      success({
        title: 'Welcome to Burg Ink!',
        message: `Account created successfully for ${data.user?.name || data.user?.email}`
      });
      
      // Redirect to dashboard or home
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err) {
      console.error('Registration error:', err);
      error({
        title: 'Registration failed',
        message: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
        action: {
          label: 'Try Again',
          onClick: () => {
            setFormData({ name: '', email: '', password: '', confirmPassword: '' });
            if (nameRef.current) nameRef.current.focus();
          }
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Real-time validation
    if (name === 'name') {
      const nameValidation = validateName(value);
      setValidation(prev => ({ ...prev, name: nameValidation }));
    } else if (name === 'email') {
      const emailValidation = validateEmail(value);
      setValidation(prev => ({ ...prev, email: emailValidation }));
    } else if (name === 'password') {
      const passwordValidation = validatePassword(value);
      const confirmPasswordValidation = validateConfirmPassword(formData.confirmPassword, value);
      setValidation(prev => ({ 
        ...prev, 
        password: passwordValidation,
        confirmPassword: confirmPasswordValidation
      }));
    } else if (name === 'confirmPassword') {
      const confirmPasswordValidation = validateConfirmPassword(value, formData.password);
      setValidation(prev => ({ ...prev, confirmPassword: confirmPasswordValidation }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleRegister(e as unknown as React.FormEvent);
    }
  };

  return (
    <>
      <Head>
        <title>Register | Burg Ink</title>
        <meta name="description" content="Create your Burg Ink account" />
      </Head>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <AuthNavBar showBackButton={true} backHref="/" backLabel="Back to Home" />
      
      <RegisterContainer>
        <RegisterCard>
          <Logo>
            <h1>Burg Ink</h1>
          </Logo>
          
          <RegisterForm onSubmit={handleRegister}>
            
            <FormGroup>
              <Label htmlFor="name">Full Name</Label>
              <InputContainer>
                <Input
                  ref={nameRef}
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your full name"
                  required
                  aria-describedby="name-validation"
                  aria-invalid={formData.name ? !validation.name.isValid : undefined}
                  disabled={isLoading}
                />
                {formData.name && (
                  <ValidationIcon isValid={validation.name.isValid}>
                    {validation.name.isValid ? <FaCheck /> : <FaTimes />}
                  </ValidationIcon>
                )}
              </InputContainer>
              {validation.name.message && (
                <ValidationMessage>{validation.name.message}</ValidationMessage>
              )}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="email">Email Address</Label>
              <InputContainer>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your email address"
                  required
                  aria-describedby="email-validation"
                  aria-invalid={formData.email ? !validation.email.isValid : undefined}
                  disabled={isLoading}
                />
                {formData.email && (
                  <ValidationIcon isValid={validation.email.isValid}>
                    {validation.email.isValid ? <FaCheck /> : <FaTimes />}
                  </ValidationIcon>
                )}
              </InputContainer>
              {validation.email.message && (
                <ValidationMessage>{validation.email.message}</ValidationMessage>
              )}
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="password">Password</Label>
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
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <InputContainer>
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Confirm your password"
                  required
                  aria-describedby="confirm-password-validation"
                  aria-invalid={formData.confirmPassword ? !validation.confirmPassword.isValid : undefined}
                  disabled={isLoading}
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
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
            
            <TermsContainer>
              <TermsCheckbox
                type="checkbox"
                id="agreeToTerms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                disabled={isLoading}
              />
              <TermsLabel htmlFor="agreeToTerms">
                I agree to the <TermsLink href="/terms">Terms of Service</TermsLink> and <TermsLink href="/privacy">Privacy Policy</TermsLink>
              </TermsLabel>
            </TermsContainer>
            
            <RegisterButton type="submit" disabled={isLoading || !agreeToTerms}>
              {isLoading ? (
                <>
                  <Spinner />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </RegisterButton>
          </RegisterForm>
          
          <Divider>
            <DividerText>or continue with</DividerText>
          </Divider>
          
          <GoogleButton onClick={handleGoogleLogin} disabled={isLoading}>
            {isLoading ? (
              <Spinner />
            ) : (
              <FaGoogle />
            )}
            Continue with Google
          </GoogleButton>
          
          <LoginLink>
            Already have an account? <Link href="/login">Sign in</Link>
          </LoginLink>
        </RegisterCard>
      </RegisterContainer>
    </>
  );
}

const RegisterContainer = styled.div`
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

const RegisterCard = styled.div`
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

const RegisterForm = styled.form`
  margin-bottom: 1.5rem;
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

const RegisterButton = styled.button`
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

const Divider = styled.div`
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #ddd;
  }
`;

const DividerText = styled.span`
  background: white;
  padding: 0 1rem;
  color: #666;
  font-size: 0.9rem;
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: white;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  
  &:hover:not(:disabled) {
    background-color: #f8f9fa;
    border-color: #bbb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  svg {
    color: #4285f4;
    font-size: 1.125rem;
  }
`;

const TermsContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const TermsCheckbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin-top: 0.125rem;
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const TermsLabel = styled.label`
  font-size: 0.85rem;
  color: #666;
  cursor: pointer;
  user-select: none;
  line-height: 1.4;
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const TermsLink = styled.a`
  color: #96885f;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const LoginLink = styled.p`
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
  font-size: 0.9rem;
  
  a {
    color: #96885f;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;
