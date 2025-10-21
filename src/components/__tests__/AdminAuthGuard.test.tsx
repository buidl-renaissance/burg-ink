import { render, screen } from '@testing-library/react';
import { AdminAuthGuard } from '../AdminAuthGuard';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    asPath: '/admin',
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AdminAuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading spinner when authentication is loading', () => {
    render(
      <AuthProvider>
        <AdminAuthGuard>
          <div>Protected Content</div>
        </AdminAuthGuard>
      </AuthProvider>
    );

    expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(
      <AuthProvider>
        <AdminAuthGuard>
          <div>Protected Content</div>
        </AdminAuthGuard>
      </AuthProvider>
    );

    // Should show redirecting message
    expect(screen.getByText('Redirecting to login...')).toBeInTheDocument();
  });
});
