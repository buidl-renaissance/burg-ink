import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { inquiries } from '../../../db/schema';
import { desc } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status, type, limit = '50', offset = '0' } = req.query;

    let query = db.select().from(inquiries);

    // Apply filters
    if (status && typeof status === 'string') {
      query = query.where({ status });
    }

    if (type && typeof type === 'string') {
      query = query.where({ inquiry_type: type });
    }

    // Apply pagination and ordering
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    const results = await query
      .orderBy(desc(inquiries.created_at))
      .limit(limitNum)
      .offset(offsetNum);

    // Get total count for pagination
    const countQuery = db.select({ count: inquiries.id }).from(inquiries);
    if (status && typeof status === 'string') {
      countQuery.where({ status });
    }
    if (type && typeof type === 'string') {
      countQuery.where({ inquiry_type: type });
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
