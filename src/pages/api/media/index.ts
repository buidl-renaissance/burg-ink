import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../db';
import { media } from '../../../../db/schema';
import { eq, desc, asc, and, count, SQL } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

      // Build where conditions - for now, get all media since we don't have user authentication
      const whereConditions: SQL[] = [];
      
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

      // Get media records using select
      let mediaRecords;
      if (whereConditions.length > 0) {
        mediaRecords = await db.select()
          .from(media)
          .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0])
          .orderBy(...orderBy)
          .limit(parseInt(limit as string))
          .offset(parseInt(offset as string));
      } else {
        mediaRecords = await db.select()
          .from(media)
          .orderBy(...orderBy)
          .limit(parseInt(limit as string))
          .offset(parseInt(offset as string));
      }

      // Get total count for pagination
      let totalCountResult;
      if (whereConditions.length > 0) {
        totalCountResult = await db.select({ count: count() })
          .from(media)
          .where(whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0]);
      } else {
        totalCountResult = await db.select({ count: count() }).from(media);
      }
      
      const totalCount = totalCountResult[0]?.count || 0;

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
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + parseInt(limit as string) < totalCount,
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