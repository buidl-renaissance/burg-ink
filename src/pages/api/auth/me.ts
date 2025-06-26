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
      where: eq(users.id, user.id)
    });

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        profile_picture: userData.profile_picture,
        bio: userData.bio,
      }
    });

  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 