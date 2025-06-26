'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { FaGoogle, FaEye, FaEyeSlash } from 'react-icons/fa';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Redirect to Google OAuth
      const googleAuthUrl = `/api/auth/google`;
      window.location.href = googleAuthUrl;
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to initiate Google login');
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store the token
      localStorage.setItem('authToken', data.token);
      
      // Redirect to dashboard or home
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <>
      <Head>
        <title>Login | Burg Ink</title>
        <meta name="description" content="Login to your Burg Ink account" />
      </Head>
      
      <LoginContainer>
        <LoginCard>
          <Logo>
            <h1>Burg Ink</h1>
            <p>Contemporary Art Gallery</p>
          </Logo>
          
          <LoginForm onSubmit={handleEmailLogin}>
            <FormTitle>Welcome Back</FormTitle>
            <Subtitle>Sign in to your account</Subtitle>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="password">Password</Label>
              <PasswordContainer>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                />
                <PasswordToggle
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </PasswordToggle>
              </PasswordContainer>
            </FormGroup>
            
            <LoginButton type="submit" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </LoginButton>
          </LoginForm>
          
          <Divider>
            <DividerText>or</DividerText>
          </Divider>
          
          <GoogleButton onClick={handleGoogleLogin} disabled={isLoading}>
            <FaGoogle />
            Continue with Google
          </GoogleButton>
          
          <SignupLink>
            Don&apos;t have an account?{' '}
            <a href="/signup">Sign up</a>
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
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
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

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #96885f;
    box-shadow: 0 0 0 3px rgba(150, 136, 95, 0.1);
  }
  
  &::placeholder {
    color: #999;
  }
`;

const PasswordContainer = styled.div`
  position: relative;
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
  
  &:hover {
    color: #333;
  }
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
  transition: background-color 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #7a6e4e;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
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
  
  &:hover:not(:disabled) {
    background-color: #f8f9fa;
    border-color: #ccc;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    color: #4285f4;
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
`; 