import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../../db';
import { media } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';

/**
 * API endpoint to check media processing status
 * Used by frontend to poll for updates during image processing
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Media ID is required' });
  }

  try {
    const mediaRecord = await db.query.media.findFirst({
      where: eq(media.id, id),
    });

    if (!mediaRecord) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const status = mediaRecord.processing_status;
    const isComplete = status === 'completed' || (!status && mediaRecord.medium_url);
    
    res.status(200).json({
      id: mediaRecord.id,
      status,
      processing: status === 'pending' || status === 'processing',
      failed: status === 'failed',
      data: isComplete || status === 'failed' ? {
        original_url: mediaRecord.original_url,
        medium_url: mediaRecord.medium_url,
        thumbnail_url: mediaRecord.thumbnail_url,
        spaces_url: mediaRecord.original_url, // Alias for compatibility
        title: mediaRecord.title,
        description: mediaRecord.description,
        alt_text: mediaRecord.alt_text,
        tags: mediaRecord.tags ? JSON.parse(mediaRecord.tags) : [],
        ai_analysis: mediaRecord.ai_analysis ? JSON.parse(mediaRecord.ai_analysis) : null,
        // AI classification fields
        detected_type: mediaRecord.detected_type,
        detection_confidence: mediaRecord.detection_confidence,
        detections: mediaRecord.detections ? JSON.parse(mediaRecord.detections) : null,
        suggested_entity_id: mediaRecord.suggested_entity_id,
        suggested_entity_type: mediaRecord.suggested_entity_type,
        filename: mediaRecord.filename,
        width: mediaRecord.width,
        height: mediaRecord.height,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching media status:', error);
    res.status(500).json({
      error: 'Failed to fetch media status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

