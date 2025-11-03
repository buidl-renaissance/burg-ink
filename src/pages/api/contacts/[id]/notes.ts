import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../../db';
import { contactNotes, contacts, users } from '../../../../../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

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

    switch (req.method) {
      case 'GET':
        return handleGetNotes(req, res, contactId);
      case 'POST':
        return handleCreateNote(req, res, contactId, currentUser.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Contact notes API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetNotes(req: NextApiRequest, res: NextApiResponse, contactId: number) {
  const { page = '1', limit = '50', note_type = '' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  // Build query
  const conditions = [eq(contactNotes.contact_id, contactId)];
  if (note_type) {
    conditions.push(eq(contactNotes.note_type, note_type as string));
  }

  const notes = await db
    .select({
      id: contactNotes.id,
      content: contactNotes.content,
      note_type: contactNotes.note_type,
      created_at: contactNotes.created_at,
      user_name: users.name,
      user_email: users.email
    })
    .from(contactNotes)
    .leftJoin(users, eq(contactNotes.user_id, users.id))
    .where(and(...conditions))
    .orderBy(desc(contactNotes.created_at))
    .limit(limitNum)
    .offset(offset);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactNotes)
    .where(eq(contactNotes.contact_id, contactId));

  return res.status(200).json({
    notes,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      pages: Math.ceil(count / limitNum)
    }
  });
}

async function handleCreateNote(req: NextApiRequest, res: NextApiResponse, contactId: number, userId: number) {
  const { content, note_type = 'general' } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Note content is required' });
  }

  const validNoteTypes = ['general', 'call', 'email', 'meeting', 'follow_up'];
  if (!validNoteTypes.includes(note_type)) {
    return res.status(400).json({ error: 'Invalid note type' });
  }

  try {
    const [newNote] = await db.insert(contactNotes).values({
      contact_id: contactId,
      user_id: userId,
      note_type,
      content: content.trim()
    }).returning();

    // Get user info for the response
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    return res.status(201).json({
      message: 'Note added successfully',
      note: {
        id: newNote.id,
        content: newNote.content,
        note_type: newNote.note_type,
        created_at: newNote.created_at,
        user_name: user?.name,
        user_email: user?.email
      }
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return res.status(500).json({ error: 'Failed to create note' });
  }
}
