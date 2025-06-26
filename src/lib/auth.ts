import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
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
    console.error('Auth error:', error);
    return null;
  }
}

export function createToken(user: AuthUser): string {
  return jwt.sign(user, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '24h',
  });
} 