import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface User {
  id: number;
  name: string;
  email: string;
  profile_picture?: string;
  bio?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
        return;
      }

      // Verify token with backend
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setAuthState({
          user: userData.user,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        // Token is invalid or expired, remove it
        const errorData = await response.json().catch(() => ({ expired: false }));
        localStorage.removeItem('authToken');
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
        
        // Only redirect if we're not already on the login page
        if (router.pathname !== '/login' && router.pathname !== '/register') {
          const redirectPath = errorData.expired 
            ? `/login?expired=true&redirect=${encodeURIComponent(router.asPath)}`
            : `/login?redirect=${encodeURIComponent(router.asPath)}`;
          router.push(redirectPath);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('authToken');
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
      
      // Only redirect if we're not already on the login page
      if (router.pathname !== '/login' && router.pathname !== '/register') {
        router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      
      setAuthState({
        user: data.user,
        loading: false,
        isAuthenticated: true,
      });

      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
      router.push('/login');
    }
  };

  const requireAuth = () => {
    if (!authState.loading && !authState.isAuthenticated) {
      router.push('/login');
    }
  };

  return {
    ...authState,
    login,
    logout,
    requireAuth,
    checkAuth,
  };
}; 