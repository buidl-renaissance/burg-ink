import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../db';
import { media } from '../../../../db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthorizedUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const { 
        status, 
        source, 
        limit = '20', 
        offset = '0',
        sort = 'updated_at',
        order = 'desc'
      } = req.query;

      // Build where conditions
      const whereConditions = [eq(media.user_id, user.id)];
      
      if (status && status !== 'all') {
        whereConditions.push(eq(media.processing_status, status as string));
      }
      
      if (source && source !== 'all') {
        whereConditions.push(eq(media.source, source as string));
      }

      // Build order by with safe column access
      let orderBy;
      if (sort === 'created_at') {
        orderBy = order === 'asc' ? [asc(media.created_at)] : [desc(media.created_at)];
      } else if (sort === 'filename') {
        orderBy = order === 'asc' ? [asc(media.filename)] : [desc(media.filename)];
      } else if (sort === 'processing_status') {
        orderBy = order === 'asc' ? [asc(media.processing_status)] : [desc(media.processing_status)];
      } else {
        // Default to updated_at
        orderBy = order === 'asc' ? [asc(media.updated_at)] : [desc(media.updated_at)];
      }

      // Get media records
      const mediaRecords = await db.query.media.findMany({
        where: whereConditions.length > 1 
          ? whereConditions.reduce((acc, condition) => acc && condition)
          : whereConditions[0],
        orderBy,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      // Get total count for pagination
      const totalCount = await db.select({ count: media.id })
        .from(media)
        .where(whereConditions.length > 1 
          ? whereConditions.reduce((acc, condition) => acc && condition)
          : whereConditions[0]);

      // Transform records to include parsed JSON
      const transformedRecords = mediaRecords.map(record => ({
        id: record.id,
        source: record.source,
        source_id: record.source_id,
        filename: record.filename,
        mime_type: record.mime_type,
        size: record.size,
        width: record.width,
        height: record.height,
        spaces_url: record.spaces_url,
        thumbnail_url: record.thumbnail_url,
        processing_status: record.processing_status,
        description: record.description,
        tags: record.tags ? JSON.parse(record.tags) : [],
        ai_analysis: record.ai_analysis ? JSON.parse(record.ai_analysis) : null,
        metadata: record.metadata ? JSON.parse(record.metadata) : null,
        created_at: record.created_at,
        updated_at: record.updated_at,
        processed_at: record.processed_at,
      }));

      res.status(200).json({
        media: transformedRecords,
        pagination: {
          total: totalCount.length,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + parseInt(limit as string) < totalCount.length,
        },
      });

    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({ message: 'Failed to fetch media' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
} 