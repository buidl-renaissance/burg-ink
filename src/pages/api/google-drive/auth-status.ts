import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
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

    // Get user with Google Drive tokens
    const userWithTokens = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        google_drive_token: true,
        google_drive_refresh_token: true,
      }
    });

    const authenticated = !!(userWithTokens?.google_drive_token);

    res.status(200).json({ authenticated });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
