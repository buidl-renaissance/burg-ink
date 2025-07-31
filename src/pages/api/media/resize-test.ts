import { NextApiRequest, NextApiResponse } from 'next';
import { triggerMediaResize } from '@/lib/functions/processImageResizing';
import { db } from '../../../../db';
import { media } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { mediaId, action = 'single' } = req.body;

    if (action === 'single') {
      if (!mediaId) {
        return res.status(400).json({ message: 'mediaId is required for single resize' });
      }

      // Get media record to verify it exists
      const mediaRecord = await db.query.media.findFirst({
        where: eq(media.id, mediaId)
      });

      if (!mediaRecord) {
        return res.status(404).json({ message: 'Media record not found' });
      }

      // Trigger resize job
      const event = await triggerMediaResize(mediaId);
      
      res.status(200).json({
        message: 'Resize job triggered successfully',
        mediaId,
        filename: mediaRecord.filename,
        eventId: event.ids[0]
      });

    } else if (action === 'batch') {
      // Get all media records that need resizing
      const mediaRecords = await db.query.media.findMany();
      const needsResizing = mediaRecords.filter(record => 
        !record.medium_url || !record.thumbnail_url
      );

      if (needsResizing.length === 0) {
        return res.status(200).json({
          message: 'No media records need resizing',
          count: 0
        });
      }

      // Trigger batch resize job
      const event = await triggerBatchResize(needsResizing.map(r => r.id));
      
      res.status(200).json({
        message: 'Batch resize job triggered successfully',
        count: needsResizing.length,
        mediaIds: needsResizing.map(r => r.id),
        eventId: event.ids[0]
      });

    } else {
      return res.status(400).json({ message: 'Invalid action. Use "single" or "batch"' });
    }

  } catch (error) {
    console.error('Error triggering resize:', error);
    res.status(500).json({ 
      message: 'Failed to trigger resize',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to trigger batch resize
async function triggerBatchResize(mediaIds: number[]) {
  const { inngest } = await import("@/lib/inngest");
  return await inngest.send({
    name: "media.resize.batch",
    data: { mediaIds }
  });
} 