import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../db';
import { contacts, contactNotes, inquiries, users } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';

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

    switch (req.method) {
      case 'GET':
        return handleGetContact(req, res, contactId);
      case 'PATCH':
        return handleUpdateContact(req, res, contactId);
      case 'DELETE':
        return handleDeleteContact(req, res, contactId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Contact API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetContact(req: NextApiRequest, res: NextApiResponse, contactId: number) {
  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, contactId)
  });

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  // Get recent notes
  const recentNotes = await db
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
    .where(eq(contactNotes.contact_id, contactId))
    .orderBy(desc(contactNotes.created_at))
    .limit(10);

  // Get linked inquiries
  const linkedInquiries = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.contact_id, contactId))
    .orderBy(desc(inquiries.created_at));

  return res.status(200).json({
    contact: {
      ...contact,
      tags: JSON.parse(contact.tags || '[]'),
      custom_fields: JSON.parse(contact.custom_fields || '{}')
    },
    recent_notes: recentNotes,
    linked_inquiries: linkedInquiries
  });
}

async function handleUpdateContact(req: NextApiRequest, res: NextApiResponse, contactId: number) {
  const { 
    first_name,
    last_name,
    email,
    phone,
    company,
    job_title,
    source,
    lifecycle_stage,
    tags,
    custom_fields,
    notes,
    avatar_url,
    is_active
  } = req.body;

  // Get current contact data
  const currentContact = await db.query.contacts.findFirst({
    where: eq(contacts.id, contactId)
  });

  if (!currentContact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  const updateData: Record<string, unknown> = {};

  if (first_name !== undefined) updateData.first_name = first_name;
  if (last_name !== undefined) updateData.last_name = last_name;
  if (email !== undefined) {
    // Check if email is already taken by another contact
    const existingContact = await db.query.contacts.findFirst({
      where: eq(contacts.email, email)
    });
    
    if (existingContact && existingContact.id !== contactId) {
      return res.status(409).json({ error: 'Email already taken by another contact' });
    }
    updateData.email = email;
  }
  if (phone !== undefined) updateData.phone = phone;
  if (company !== undefined) updateData.company = company;
  if (job_title !== undefined) updateData.job_title = job_title;
  if (source !== undefined) updateData.source = source;
  if (lifecycle_stage !== undefined) updateData.lifecycle_stage = lifecycle_stage;
  if (tags !== undefined) updateData.tags = JSON.stringify(tags);
  if (custom_fields !== undefined) updateData.custom_fields = JSON.stringify(custom_fields);
  if (notes !== undefined) updateData.notes = notes;
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
  if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;

  updateData.updated_at = new Date().toISOString();

  try {
    const [updatedContact] = await db
      .update(contacts)
      .set(updateData)
      .where(eq(contacts.id, contactId))
      .returning();

    return res.status(200).json({
      message: 'Contact updated successfully',
      contact: {
        ...updatedContact,
        tags: JSON.parse(updatedContact.tags || '[]'),
        custom_fields: JSON.parse(updatedContact.custom_fields || '{}')
      }
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return res.status(500).json({ error: 'Failed to update contact' });
  }
}

async function handleDeleteContact(req: NextApiRequest, res: NextApiResponse, contactId: number) {
  // Check if contact exists
  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.id, contactId)
  });

  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  try {
    // Soft delete - set is_active to false instead of actually deleting
    const [updatedContact] = await db
      .update(contacts)
      .set({ 
        is_active: 0,
        updated_at: new Date().toISOString()
      })
      .where(eq(contacts.id, contactId))
      .returning();

    return res.status(200).json({
      message: 'Contact deactivated successfully',
      contact: {
        id: updatedContact.id,
        name: `${updatedContact.first_name} ${updatedContact.last_name}`,
        email: updatedContact.email,
        is_active: updatedContact.is_active
      }
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return res.status(500).json({ error: 'Failed to delete contact' });
  }
}
