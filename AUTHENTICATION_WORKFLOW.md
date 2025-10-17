# Authentication Workflow Documentation

This document outlines the comprehensive authentication system implemented for the Burg Ink application.

## Overview

The authentication system provides:
- User registration and login with email/password
- Google OAuth integration
- Password reset functionality
- Email verification
- Role-based access control (RBAC)
- Protected routes and API endpoints
- Session management with JWT tokens

## Components

### 1. Authentication Pages

#### Login Page (`/login`)
- Email/password authentication
- Google OAuth integration
- "Forgot Password" link
- Link to registration page

#### Registration Page (`/register`)
- User registration with name, email, password
- Password confirmation
- Google OAuth integration
- Link to login page

#### Forgot Password Page (`/forgot-password`)
- Email input for password reset
- Sends reset token via email (console log in development)

#### Reset Password Page (`/reset-password`)
- New password input with confirmation
- Token-based verification
- Automatic redirect to login after success

#### Email Verification Page (`/verify-email`)
- Email verification status
- Resend verification email
- Token-based verification

### 2. API Endpoints

#### Authentication Endpoints
- `POST /api/auth/login` - User login with email/password
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Send verification email
- `POST /api/auth/confirm-verification` - Confirm email verification

#### Google OAuth Endpoints
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Handle OAuth callback

### 3. Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cid TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password TEXT, -- Hashed with bcrypt
  bio TEXT,
  profile_picture TEXT,
  role TEXT DEFAULT 'user', -- 'admin' | 'user' | 'artist'
  is_verified INTEGER DEFAULT 0, -- Email verification status
  data TEXT, -- JSON string for additional data
  google_id TEXT,
  google_drive_token TEXT,
  google_drive_refresh_token TEXT,
  google_drive_folder_id TEXT,
  google_drive_sync_enabled INTEGER DEFAULT 0,
  last_sync_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Authentication Context

The `AuthContext` provides app-wide authentication state:

```typescript
interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  requireAuth: () => void;
  checkAuth: () => Promise<void>;
}
```

### 5. Role-Based Access Control (RBAC)

#### User Roles
- `admin` - Full system access
- `artist` - Can create and manage artwork
- `user` - Basic user access

#### Permissions
- `view_profile` - View user profile
- `edit_profile` - Edit user profile
- `create_artwork` - Create new artwork
- `edit_artwork` - Edit existing artwork
- `delete_artwork` - Delete artwork
- `manage_portfolio` - Manage artist portfolio
- `manage_users` - Manage user accounts
- `manage_artists` - Manage artist accounts
- `manage_content` - Manage all content
- `view_analytics` - View analytics
- `manage_settings` - Manage system settings

#### Usage Examples

```typescript
// Check if user has specific role
<WithRole role="admin">
  <AdminPanel />
</WithRole>

// Check if user has any of multiple roles
<WithRole roles={['admin', 'artist']}>
  <ContentManagement />
</WithRole>

// Check if user has specific permission
<WithRole permission="create_artwork">
  <CreateArtworkButton />
</WithRole>

// Require verified email
<WithRole requireVerified={true}>
  <VerifiedUserContent />
</WithRole>
```

### 6. Protected Routes

#### Frontend Protection
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

<ProtectedRoute>
  <AdminDashboard />
</ProtectedRoute>
```

#### API Protection
```typescript
import { withAuth } from '@/middleware/auth';

const handler = async (req: NextApiRequest, res: NextApiResponse, user: User) => {
  // Protected API logic
};

export default withAuth(handler);
```

### 7. Security Features

#### Password Security
- Passwords hashed with bcrypt (12 salt rounds)
- Minimum 8 character requirement
- Password confirmation on registration

#### Token Security
- JWT tokens with 24-hour expiration
- Secure token storage in localStorage
- Automatic token validation on API calls

#### Email Verification
- Email verification required for full access
- Secure token-based verification
- 24-hour token expiration

#### Password Reset
- Secure token-based password reset
- 1-hour token expiration
- Email enumeration protection

### 8. Environment Variables

Required environment variables:

```env
# JWT
JWT_SECRET=your_jwt_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 9. Usage Examples

#### Login Component
```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginForm() {
  const { login, loading, isAuthenticated } = useAuth();
  
  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      router.push('/');
    } catch (error) {
      setError(error.message);
    }
  };
  
  // ... rest of component
}
```

#### Protected Component
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { WithRole } from '@/components/WithRole';

function AdminPage() {
  return (
    <ProtectedRoute>
      <WithRole role="admin">
        <AdminContent />
      </WithRole>
    </ProtectedRoute>
  );
}
```

#### API Route Protection
```typescript
import { withAuth } from '@/middleware/auth';

const handler = async (req: NextApiRequest, res: NextApiResponse, user: User) => {
  // Only authenticated users can access this endpoint
  res.json({ message: `Hello ${user.name}` });
};

export default withAuth(handler);
```

### 10. Database Migration

To apply the authentication schema changes:

```bash
# Generate migration
yarn db:generate

# Apply migration
yarn db:migrate
```

### 11. Testing the Authentication System

1. **Registration**: Visit `/register` to create a new account
2. **Login**: Visit `/login` to sign in with email/password
3. **Google OAuth**: Click "Continue with Google" on login/register pages
4. **Password Reset**: Click "Forgot your password?" on login page
5. **Email Verification**: Check console logs for verification tokens
6. **Protected Routes**: Try accessing admin pages without authentication

### 12. Production Considerations

#### Security Enhancements
- Implement rate limiting on authentication endpoints
- Use httpOnly cookies instead of localStorage for token storage
- Add CSRF protection
- Implement account lockout after failed attempts
- Add email sending service (Resend, SendGrid, etc.)

#### Monitoring
- Log authentication events
- Monitor failed login attempts
- Track user activity and sessions

#### Performance
- Implement token refresh mechanism
- Cache user data appropriately
- Optimize database queries

This authentication system provides a solid foundation for user management and access control in the Burg Ink application.
