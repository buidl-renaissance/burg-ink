import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../db';
import { media } from '../../../../db/schema';
import { eq, desc, asc, and, count, SQL, or, like } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { 
        status, 
        source, 
        limit = '20', 
        offset = '0',
        sort = 'updated_at',
        order = 'desc',
        search = '',
        detected_type = 'all',
        confidence_min = ''
      } = req.query;

      // Build where conditions - for now, get all media since we don't have user authentication
      const whereConditions: SQL[] = [];
      
      if (status && status !== 'all') {
        whereConditions.push(eq(media.processing_status, status as string));
      }
      
      if (source && source !== 'all') {
        whereConditions.push(eq(media.source, source as string));
      }

      // Add detected_type filter
      if (detected_type && detected_type !== 'all') {
        whereConditions.push(eq(media.detected_type, detected_type as string));
      }

      // Add confidence filter
      if (confidence_min && parseFloat(confidence_min as string) > 0) {
        // Note: Since confidence is stored as text, we'll need to filter this in-memory
        // or convert it during the query. For now, we'll handle it post-query.
      }

      // Add search functionality
      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        whereConditions.push(
          or(
            like(media.title, searchTerm),
            like(media.description, searchTerm),
            like(media.filename, searchTerm),
            like(media.alt_text, searchTerm),
            like(media.tags, searchTerm)
          )!
        );
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
        // Default to created_at
        orderBy = order === 'asc' ? [asc(media.created_at)] : [desc(media.created_at)];
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
      let transformedRecords = mediaRecords.map(record => ({
        id: record.id,
        source: record.source,
        source_id: record.source_id,
        filename: record.filename,
        mime_type: record.mime_type,
        size: record.size,
        width: record.width,
        height: record.height,
        original_url: record.original_url,
        medium_url: record.medium_url,
        thumbnail_url: record.thumbnail_url,
        spaces_url: record.original_url, // Add spaces_url as alias for compatibility
        title: record.title,
        description: record.description,
        alt_text: record.alt_text,
        processing_status: record.processing_status,
        tags: record.tags ? JSON.parse(record.tags) : [],
        ai_analysis: record.ai_analysis ? JSON.parse(record.ai_analysis) : null,
        // AI classification fields
        detected_type: record.detected_type,
        detection_confidence: record.detection_confidence,
        detections: record.detections ? JSON.parse(record.detections) : null,
        suggested_entity_id: record.suggested_entity_id,
        suggested_entity_type: record.suggested_entity_type,
        created_at: record.created_at,
        user_id: record.user_id,
      }));

      // Apply confidence filter post-query (since confidence is stored as text)
      if (confidence_min && parseFloat(confidence_min as string) > 0) {
        const minConfidence = parseFloat(confidence_min as string);
        transformedRecords = transformedRecords.filter(record => {
          if (!record.detection_confidence) return false;
          return parseFloat(record.detection_confidence) >= minConfidence;
        });
      }

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