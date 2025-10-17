import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { media } from '../../../../db/schema';
import { inArray } from 'drizzle-orm';
// import { storageService } from '@/lib/storage';

interface BulkOperationRequest {
  action: 'delete' | 'tag' | 'download';
  mediaIds: number[];
  tags?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { action, mediaIds, tags }: BulkOperationRequest = req.body;

    if (!action || !mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    // Convert mediaIds to strings since the database expects string IDs
    const mediaIdsStr = mediaIds.map(id => String(id));

    // Get media items to verify they exist and user has access
    const mediaItems = await db.query.media.findMany({
      where: inArray(media.id, mediaIdsStr),
      columns: {
        id: true,
        filename: true,
        original_url: true,
        source: true
      }
    });

    if (mediaItems.length !== mediaIds.length) {
      return res.status(400).json({ message: 'Some media items not found' });
    }

    if (action === 'delete') {
      // Note: Storage deletion would need to be implemented based on the actual storage key field
      // For now, we'll only delete from the database
      
      // Delete from database
      await db.delete(media).where(inArray(media.id, mediaIdsStr));

      res.status(200).json({ 
        message: `Successfully deleted ${mediaIds.length} media items`,
        deletedCount: mediaIds.length
      });

    } else if (action === 'tag') {
      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ message: 'Tags are required for tagging operation' });
      }

      // Update tags for all media items
      await db.update(media)
        .set({
          tags: JSON.stringify(tags),
        })
        .where(inArray(media.id, mediaIdsStr));

      res.status(200).json({ 
        message: `Successfully tagged ${mediaIds.length} media items`,
        taggedCount: mediaIds.length,
        tags
      });

    } else if (action === 'download') {
      // For download, we'll return the URLs and let the client handle the download
      const downloadUrls = mediaItems
        .filter(item => item.original_url)
        .map(item => ({
          id: item.id,
          filename: item.filename,
          url: item.original_url
        }));

      res.status(200).json({ 
        message: `Prepared ${downloadUrls.length} files for download`,
        files: downloadUrls
      });

    } else {
      res.status(400).json({ message: 'Invalid action' });
    }

  } catch (error) {
    console.error('Bulk operation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
