'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { FaGoogle, FaEye, FaEyeSlash, FaCheck, FaTimes } from 'react-icons/fa';
import Head from 'next/head';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/common/ToastContainer';
import { SecurityBadge, SecurityFeatures } from '@/components/auth/SecurityBadge';
import { TrustIndicators, SocialProof } from '@/components/auth/TrustIndicators';
import { AuthNavBar } from '@/components/auth/AuthNavBar';

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validation, setValidation] = useState({
    email: { isValid: false, message: '' },
    password: { isValid: false, message: '' }
  });
  
  // Get redirect URL from query params, default to admin portal
  const redirectUrl = router.query.redirect as string || '/admin';
  
  // Toast notifications
  const { toasts, success, error, warning, loading, removeToast } = useToast();

  // Auto-focus email field on mount
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  // Real-time email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);
    return {
      isValid,
      message: email && !isValid ? 'Please enter a valid email address' : ''
    };
  };

  // Real-time password validation
  const validatePassword = (password: string) => {
    const isValid = password.length >= 1; // Basic check, more detailed in component
    return {
      isValid,
      message: ''
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
        title: 'Google login failed',
        message: 'Unable to connect to Google. Please try again or use email login.',
        action: {
          label: 'Try Again',
          onClick: handleGoogleLogin
        }
      });
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);
    
    setValidation({
      email: emailValidation,
      password: passwordValidation
    });
    
    if (!emailValidation.isValid || !passwordValidation.isValid || !formData.email || !formData.password) {
      warning({
        title: 'Please check your inputs',
        message: 'Make sure your email is valid and password is entered correctly.'
      });
      return;
    }
    
    try {
      setIsLoading(true);
      loading({
        title: 'Signing you in',
        message: 'Please wait while we verify your credentials...'
      });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          rememberMe
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = 'Login failed';
        
        if (response.status === 401) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (response.status === 429) {
          errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again in a few moments.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Store the token
      localStorage.setItem('authToken', data.token);
      
      success({
        title: 'Welcome back!',
        message: `Successfully signed in as ${data.user?.name || data.user?.email}`
      });
      
      // Redirect to the intended page or home
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      error({
        title: 'Login failed',
        message: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
        action: {
          label: 'Try Again',
          onClick: () => {
            setFormData({ email: '', password: '' });
            if (emailRef.current) emailRef.current.focus();
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
    if (name === 'email') {
      const emailValidation = validateEmail(value);
      setValidation(prev => ({ ...prev, email: emailValidation }));
    } else if (name === 'password') {
      const passwordValidation = validatePassword(value);
      setValidation(prev => ({ ...prev, password: passwordValidation }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleEmailLogin(e as any);
    }
  };

  return (
    <>
      <Head>
        <title>Login | Burg Ink</title>
        <meta name="description" content="Login to your Burg Ink account" />
      </Head>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <AuthNavBar showBackButton={true} backHref="/" backLabel="Back to Home" />
      
      <LoginContainer>
        <LoginCard>
          <Logo>
            <h1>Burg Ink</h1>
            <p>Contemporary Art Gallery</p>
          </Logo>
          
          <SecurityBadge variant="compact" />
          
          <LoginForm onSubmit={handleEmailLogin}>
            <FormTitle>Welcome Back</FormTitle>
            <Subtitle>Sign in to your account</Subtitle>
            
            <FormGroup>
              <Label htmlFor="email">Email Address</Label>
              <InputContainer>
                <Input
                  ref={emailRef}
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
              <InputContainer>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your password"
                  required
                  aria-describedby="password-validation"
                  disabled={isLoading}
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={isLoading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </PasswordToggle>
              </InputContainer>
            </FormGroup>
            
            <RememberMeContainer>
              <RememberMeCheckbox
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <RememberMeLabel htmlFor="rememberMe">
                Remember me for 30 days
              </RememberMeLabel>
            </RememberMeContainer>
            
            <LoginButton type="submit" disabled={isLoading || !formData.email || !formData.password}>
              {isLoading ? (
                <>
                  <Spinner />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </LoginButton>
            
            <ForgotPasswordLink>
              <a href="/forgot-password">Forgot your password?</a>
            </ForgotPasswordLink>
          </LoginForm>
          
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
          
          <TrustIndicators userCount={2500} />
          
          <SignupLink>
            Don&apos;t have an account?{' '}
            <a href="/register">Sign up</a>
          </SignupLink>
        </LoginCard>
      </LoginContainer>
    </>
  );
}

const LoginContainer = styled.div`
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

const LoginCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
 IMG: transform: translateY(-2px);
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

const LoginForm = styled.form`
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

const LoginButton = styled.button`
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

const ForgotPasswordLink = styled.div`
  text-align: center;
  margin-top: 1rem;
  
  a {
    color: #96885f;
    text-decoration: none;
    font-size: 0.9rem;
    
    &:hover {
      text-decoration: underline;
    }
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
    border-color: #ccc;
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

const RememberMeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const RememberMeCheckbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const RememberMeLabel = styled.label`
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  user-select: none;
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const SignupLink = styled.p`
  text-align: center;
  margin: 1.5rem 0 0 0;
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

const ErrorMessage = styled.div`
  background-color: #fee;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border: 1px solid #feb2b2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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