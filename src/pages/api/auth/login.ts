import { NextApiRequest, NextApiResponse } from 'next';
import { createToken } from '@/lib/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For now, we'll skip password verification since we don't have password fields
    // In a real implementation, you would hash and verify passwords
    // This is a simplified version for demonstration

    // Create JWT token
    const token = createToken({
      id: user.id,
      email: user.email || '',
      name: user.name
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_picture: user.profile_picture
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 