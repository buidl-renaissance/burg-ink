import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { GoogleDriveService } from '@/lib/googleDrive';
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

    // Get user's Google Drive token
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id)
    });

    if (!userData?.google_drive_token) {
      return res.status(400).json({ message: 'Google Drive not connected' });
    }

    const driveService = new GoogleDriveService(userData.google_drive_token);
    const folders = await driveService.listFolders();

    res.status(200).json({ folders });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Failed to fetch folders' });
  }
} 