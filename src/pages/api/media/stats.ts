import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../db';
import { media } from '../../../../db/schema';
import { eq, count } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get total media count
    const totalMediaResult = await db.select({ count: count() })
      .from(media);

    const totalMedia = totalMediaResult[0]?.count || 0;

    // Get counts by status
    const statusCounts = await Promise.all([
      db.select({ count: count() }).from(media).where(eq(media.processing_status, 'completed')),
      db.select({ count: count() }).from(media).where(eq(media.processing_status, 'processing')),
      db.select({ count: count() }).from(media).where(eq(media.processing_status, 'pending')),
      db.select({ count: count() }).from(media).where(eq(media.processing_status, 'failed')),
    ]);

    const stats = {
      total: totalMedia,
      byStatus: {
        completed: statusCounts[0][0]?.count || 0,
        processing: statusCounts[1][0]?.count || 0,
        pending: statusCounts[2][0]?.count || 0,
        failed: statusCounts[3][0]?.count || 0,
      }
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error getting media stats:', error);
    res.status(500).json({ 
      message: 'Failed to get media stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 