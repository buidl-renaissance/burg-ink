import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { media } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'Invalid media ID' });
  }

  const mediaId = id;

  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get media item
      const mediaItem = await db.query.media.findFirst({
        where: eq(media.id, mediaId)
      });

      if (!mediaItem) {
        return res.status(404).json({ message: 'Media not found' });
      }

      res.status(200).json(mediaItem);
    } else if (req.method === 'PUT') {
      // Update media item
      const { description, alt_text, tags } = req.body;

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (description !== undefined) {
        updateData.description = description;
      }

      if (alt_text !== undefined) {
        updateData.alt_text = alt_text;
      }

      if (tags !== undefined) {
        updateData.tags = JSON.stringify(tags);
      }

      await db.update(media)
        .set(updateData)
        .where(eq(media.id, mediaId));

      // Get updated media item
      const updatedMedia = await db.query.media.findFirst({
        where: eq(media.id, mediaId)
      });

      res.status(200).json(updatedMedia);
    } else if (req.method === 'DELETE') {
      // Delete media item
      await db.delete(media).where(eq(media.id, mediaId));
      res.status(200).json({ message: 'Media deleted successfully' });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Media API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
