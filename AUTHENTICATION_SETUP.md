# Authentication Setup

This project includes Google OAuth authentication. Here's how to set it up:

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Database
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token

# JWT
JWT_SECRET=your_jwt_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Set the authorized redirect URI to: `http://localhost:3000/api/auth/google/callback`
6. Copy the Client ID and Client Secret to your environment variables

## Features

### Login Page (`/login`)
- Email/password authentication
- Google OAuth authentication
- Responsive design with styled components
- Error handling and loading states

### Authentication Flow
1. User clicks "Continue with Google"
2. Redirected to Google OAuth
3. User authorizes the application
4. Google redirects back with authorization code
5. Server exchanges code for user info
6. User is created/updated in database
7. JWT token is generated and stored
8. User is redirected to home page

### API Endpoints
- `GET /api/auth/google` - Initiates Google OAuth
- `GET /api/auth/google/callback` - Handles OAuth callback
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user info

### Authentication Hook
Use the `useAuth` hook in your components:

```typescript
import { useAuth } from '@/utils/useAuth';

function MyComponent() {
  const { user, loading, isAuthenticated, login, logout } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Database Schema

The authentication system uses the existing `users` table:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cid TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  bio TEXT,
  profile_picture TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Security Notes

- JWT tokens are used for session management
- Passwords are not implemented in this version (Google OAuth only)
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- Add rate limiting and CSRF protection for production use 