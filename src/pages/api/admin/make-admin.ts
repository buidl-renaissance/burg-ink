import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get full user data from database
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is admin, if not, make them admin
    if (userData.role !== 'admin') {
      await db.update(users)
        .set({ role: 'admin' })
        .where(eq(users.id, user.id));
      
      return res.status(200).json({ 
        message: 'User role updated to admin',
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: 'admin'
        }
      });
    }

    return res.status(200).json({ 
      message: 'User is already admin',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    });

  } catch (error) {
    console.error('Error in make-admin API:', error);
    res.status(500).json({ 
      message: 'Failed to update user role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
