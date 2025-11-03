import { NextApiRequest } from 'next';
import jwt, { TokenExpiredError } from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
}

export interface AuthResult {
  user: AuthUser | null;
  expired: boolean;
}

export async function getAuthorizedUser(req: NextApiRequest): Promise<AuthUser | null> {
  try {
    // Get the authorization token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as AuthUser;
    
    return decoded;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.error('Token expired:', error.expiredAt);
    } else {
      console.error('Auth error:', error);
    }
    return null;
  }
}

export async function getAuthorizedUserWithExpiry(req: NextApiRequest): Promise<AuthResult> {
  try {
    // Get the authorization token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, expired: false };
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as AuthUser;
    
    return { user: decoded, expired: false };
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.error('Token expired:', error.expiredAt);
      return { user: null, expired: true };
    } else {
      console.error('Auth error:', error);
      return { user: null, expired: false };
    }
  }
}

export function createToken(user: AuthUser): string {
  return jwt.sign(user, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '30d',
  });
} 