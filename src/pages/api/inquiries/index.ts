import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { inquiries } from '../../../../db/schema';
import { desc, eq, and } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status, type, limit = '50', offset = '0' } = req.query;

    // Build the base query
    const baseQuery = db.select().from(inquiries);
    
    // Apply filters
    let query;
    if (status && typeof status === 'string' && type && typeof type === 'string') {
      query = baseQuery.where(and(eq(inquiries.status, status), eq(inquiries.inquiry_type, type)));
    } else if (status && typeof status === 'string') {
      query = baseQuery.where(eq(inquiries.status, status));
    } else if (type && typeof type === 'string') {
      query = baseQuery.where(eq(inquiries.inquiry_type, type));
    } else {
      query = baseQuery;
    }

    // Apply pagination and ordering
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    const results = await query
      .orderBy(desc(inquiries.created_at))
      .limit(limitNum)
      .offset(offsetNum);

    // Get total count for pagination
    const baseCountQuery = db.select({ count: inquiries.id }).from(inquiries);
    
    let countQuery;
    if (status && typeof status === 'string' && type && typeof type === 'string') {
      countQuery = baseCountQuery.where(and(eq(inquiries.status, status), eq(inquiries.inquiry_type, type)));
    } else if (status && typeof status === 'string') {
      countQuery = baseCountQuery.where(eq(inquiries.status, status));
    } else if (type && typeof type === 'string') {
      countQuery = baseCountQuery.where(eq(inquiries.inquiry_type, type));
    } else {
      countQuery = baseCountQuery;
    }
    
    const [{ count }] = await countQuery;

    res.status(200).json({
      inquiries: results,
      pagination: {
        total: count,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < count
      }
    });

  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to fetch inquiries' 
    });
  }
}
