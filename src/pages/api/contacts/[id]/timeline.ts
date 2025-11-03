import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../../db';
import { contacts, contactNotes, inquiries, users } from '../../../../../db/schema';
import { eq, sql } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getAuthorizedUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get full user data from database to check role
    const userData = await db.query.users.findFirst({
      where: eq(users.id, currentUser.id),
      columns: {
        role: true
      }
    });

    // Check if user has admin or artist permissions
    if (!userData || !userData.role || !['admin', 'artist'].includes(userData.role)) {
      return res.status(403).json({ error: 'Admin or artist access required' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;
    const contactId = parseInt(id as string, 10);

    if (isNaN(contactId)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

    // Verify contact exists
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId)
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const { page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Get contact notes
    const notes = await db
      .select({
        id: contactNotes.id,
        type: sql<string>`'note'`,
        content: contactNotes.content,
        note_type: contactNotes.note_type,
        created_at: contactNotes.created_at,
        user_name: users.name,
        user_email: users.email
      })
      .from(contactNotes)
      .leftJoin(users, eq(contactNotes.user_id, users.id))
      .where(eq(contactNotes.contact_id, contactId));

    // Get inquiries
    const inquiryTimeline = await db
      .select({
        id: inquiries.id,
        type: sql<string>`'inquiry'`,
        content: inquiries.message,
        note_type: sql<string>`'inquiry'`,
        created_at: inquiries.created_at,
        user_name: sql<string>`null`,
        user_email: sql<string>`null`,
        inquiry_type: inquiries.inquiry_type,
        status: inquiries.status
      })
      .from(inquiries)
      .where(eq(inquiries.contact_id, contactId));

    // Combine and sort timeline events
    const timeline = [...notes, ...inquiryTimeline]
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(offset, offset + limitNum);

    // Get total count
    const totalEvents = notes.length + inquiryTimeline.length;

    // Get activity summary
    const activitySummary = {
      total_notes: notes.length,
      total_inquiries: inquiryTimeline.length,
      last_activity: timeline.length > 0 ? timeline[0].created_at : null,
      note_types: notes.reduce((acc, note) => {
        if (note.note_type) {
          acc[note.note_type] = (acc[note.note_type] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      inquiry_types: inquiryTimeline.reduce((acc, inquiry) => {
        if (inquiry.inquiry_type) {
          acc[inquiry.inquiry_type] = (acc[inquiry.inquiry_type] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>)
    };

    return res.status(200).json({
      contact: {
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`,
        email: contact.email
      },
      timeline: timeline.map(event => {
        const baseEvent = {
          id: event.id,
          type: event.type,
          content: event.content,
          note_type: event.note_type,
          created_at: event.created_at,
          user_name: event.user_name,
          user_email: event.user_email
        };
        
        // Additional fields for inquiries
        if (event.type === 'inquiry' && 'inquiry_type' in event && 'status' in event) {
          return {
            ...baseEvent,
            inquiry_type: event.inquiry_type,
            status: event.status
          };
        }
        
        return baseEvent;
      }),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalEvents,
        pages: Math.ceil(totalEvents / limitNum)
      },
      summary: activitySummary
    });
  } catch (error) {
    console.error('Contact timeline API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
