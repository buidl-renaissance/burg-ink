import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../lib/db';
import { emails } from '../../../../db/schema';
import { desc, eq, and, like } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = '50', offset = '0', status, search } = req.query;
    const limitNum = parseInt(limit as string, 10);
    const offsetNum = parseInt(offset as string, 10);

    console.log('Fetching emails from database with limit:', limitNum, 'offset:', offsetNum);

    // Fetch emails from database
    let results;
    let count = 0;

    if (status && typeof status === 'string' && status !== 'all' && search && typeof search === 'string') {
      results = await db.select().from(emails)
        .where(and(eq(emails.status, status), like(emails.subject, `%${search}%`)))
        .orderBy(desc(emails.created_at))
        .limit(limitNum)
        .offset(offsetNum);
      
      const countResult = await db.select({ count: emails.id }).from(emails)
        .where(and(eq(emails.status, status), like(emails.subject, `%${search}%`)));
      count = countResult[0]?.count || 0;
    } else if (status && typeof status === 'string' && status !== 'all') {
      results = await db.select().from(emails)
        .where(eq(emails.status, status))
        .orderBy(desc(emails.created_at))
        .limit(limitNum)
        .offset(offsetNum);
      
      const countResult = await db.select({ count: emails.id }).from(emails)
        .where(eq(emails.status, status));
      count = countResult[0]?.count || 0;
    } else if (search && typeof search === 'string') {
      results = await db.select().from(emails)
        .where(like(emails.subject, `%${search}%`))
        .orderBy(desc(emails.created_at))
        .limit(limitNum)
        .offset(offsetNum);
      
      const countResult = await db.select({ count: emails.id }).from(emails)
        .where(like(emails.subject, `%${search}%`));
      count = countResult[0]?.count || 0;
    } else {
      results = await db.select().from(emails)
        .orderBy(desc(emails.created_at))
        .limit(limitNum)
        .offset(offsetNum);
      
      const countResult = await db.select({ count: emails.id }).from(emails);
      count = countResult[0]?.count || 0;
    }

    // Transform database data to match our interface
    const transformedEmails = results.map((email) => {
      // Parse the recipient JSON string
      let recipient = 'Unknown';
      try {
        const recipients = JSON.parse(email.to || '[]');
        recipient = recipients[0] || 'Unknown';
      } catch {
        recipient = email.to || 'Unknown';
      }

      return {
        id: email.id.toString(),
        subject: email.subject,
        recipient: recipient,
        sender: email.from,
        content: email.html_content || email.text_content || 'No content',
        status: email.status,
        sent_at: email.sent_at,
        created_at: email.created_at,
        updated_at: email.updated_at,
      };
    });

    console.log('Fetched emails from database:', transformedEmails.length);

    res.status(200).json({
      emails: transformedEmails,
      pagination: {
        total: count,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < count
      }
    });

  } catch (error) {
    console.error('Error fetching emails from database:', error);
    
    let errorMessage = 'Failed to fetch emails from database';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
}
