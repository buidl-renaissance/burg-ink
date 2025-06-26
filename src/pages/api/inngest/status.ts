import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../db';
import { media, googleDriveAssets } from '../../../../db/schema';
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

    // Get media processing status for the user
    const mediaRecords = await db.query.media.findMany({
      where: eq(media.user_id, user.id),
      orderBy: (media, { desc }) => [desc(media.updated_at)],
      limit: 50,
    });

    // Get Google Drive sync status
    const driveAssets = await db.query.googleDriveAssets.findMany({
      where: eq(googleDriveAssets.user_id, user.id),
      orderBy: (googleDriveAssets, { desc }) => [desc(googleDriveAssets.updated_at)],
      limit: 20,
    });

    const mediaStats = {
      total: mediaRecords.length,
      pending: mediaRecords.filter(m => m.processing_status === 'pending').length,
      processing: mediaRecords.filter(m => m.processing_status === 'processing').length,
      completed: mediaRecords.filter(m => m.processing_status === 'completed').length,
      failed: mediaRecords.filter(m => m.processing_status === 'failed').length,
    };

    const driveStats = {
      total: driveAssets.length,
      synced: driveAssets.filter(a => a.sync_status === 'synced').length,
      pending: driveAssets.filter(a => a.sync_status === 'pending').length,
      failed: driveAssets.filter(a => a.sync_status === 'download_failed').length,
      updated: driveAssets.filter(a => a.sync_status === 'updated').length,
    };

    // Get recent completed media with AI analysis
    const recentCompleted = mediaRecords
      .filter(m => m.processing_status === 'completed')
      .slice(0, 10)
      .map(m => ({
        id: m.id,
        filename: m.filename,
        source: m.source,
        description: m.description,
        tags: m.tags ? JSON.parse(m.tags) : [],
        spaces_url: m.spaces_url,
        processed_at: m.processed_at,
      }));

    res.status(200).json({
      media: {
        stats: mediaStats,
        recentCompleted,
        recentRecords: mediaRecords.slice(0, 10),
      },
      googleDrive: {
        stats: driveStats,
        recentAssets: driveAssets.slice(0, 10),
      },
    });

  } catch (error) {
    console.error('Error getting processing status:', error);
    res.status(500).json({ message: 'Failed to get processing status' });
  }
} 