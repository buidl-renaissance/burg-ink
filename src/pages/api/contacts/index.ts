import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../db';
import { contacts, contactNotes } from '../../../../db/schema';
import { eq, and, like, or, sql } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getAuthorizedUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has admin or artist permissions
    if (!['admin', 'artist'].includes((currentUser as any).role)) {
      return res.status(403).json({ error: 'Admin or artist access required' });
    }

    switch (req.method) {
      case 'GET':
        return handleGetContacts(req, res);
      case 'POST':
        return handleCreateContact(req, res, currentUser.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Contacts API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetContacts(req: NextApiRequest, res: NextApiResponse) {
  const { 
    page = '1', 
    limit = '50', 
    search = '', 
    tags = '', 
    stage = '',
    source = '',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  // Build query conditions
  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        like(contacts.first_name, `%${search}%`),
        like(contacts.last_name, `%${search}%`),
        like(contacts.email, `%${search}%`),
        like(contacts.company, `%${search}%`)
      )
    );
  }
  
  if (stage) {
    conditions.push(eq(contacts.lifecycle_stage, stage as string));
  }
  
  if (source) {
    conditions.push(eq(contacts.source, source as string));
  }
  
  if (tags) {
    const tagList = (tags as string).split(',');
    // Filter contacts that have any of the specified tags
    const tagConditions = tagList.map((tag: string) => 
      sql`json_extract(${contacts.tags}, '$') LIKE ${`%"${tag.trim()}"%`}`
    );
    conditions.push(or(...tagConditions));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Determine sort order
  const orderBy = sortOrder === 'asc' 
    ? sql`${contacts[sortBy as keyof typeof contacts] || contacts.created_at} ASC`
    : sql`${contacts[sortBy as keyof typeof contacts] || contacts.created_at} DESC`;

  // Get contacts with pagination
  const contactList = await db
    .select()
    .from(contacts)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limitNum)
    .offset(offset);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(whereClause);

  // Get contact stats
  const [totalContacts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts);

  const [activeContacts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(eq(contacts.is_active, 1));

  const [leads] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(eq(contacts.lifecycle_stage, 'lead'));

  const [customers] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contacts)
    .where(eq(contacts.lifecycle_stage, 'customer'));

  // Get stage distribution
  const stageDistribution = await db
    .select({
      stage: contacts.lifecycle_stage,
      count: sql<number>`count(*)`
    })
    .from(contacts)
    .groupBy(contacts.lifecycle_stage);

  return res.status(200).json({
    contacts: contactList.map(contact => ({
      ...contact,
      tags: JSON.parse(contact.tags || '[]'),
      custom_fields: JSON.parse(contact.custom_fields || '{}')
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      pages: Math.ceil(count / limitNum)
    },
    stats: {
      total: totalContacts.count,
      active: activeContacts.count,
      leads: leads.count,
      customers: customers.count,
      stage_distribution: stageDistribution.reduce((acc, item) => {
        if (item.stage) {
          acc[item.stage] = item.count;
        }
        return acc;
      }, {} as Record<string, number>)
    }
  });
}

async function handleCreateContact(req: NextApiRequest, res: NextApiResponse, currentUserId: number) {
  const { 
    first_name,
    last_name,
    email,
    phone,
    company,
    job_title,
    source = 'manual',
    lifecycle_stage = 'lead',
    tags = [],
    custom_fields = {},
    notes,
    avatar_url
  } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }

  // Check if contact already exists
  const existingContact = await db.query.contacts.findFirst({
    where: eq(contacts.email, email)
  });

  if (existingContact) {
    return res.status(409).json({ error: 'Contact with this email already exists' });
  }

  try {
    const [newContact] = await db.insert(contacts).values({
      first_name,
      last_name,
      email,
      phone: phone || null,
      company: company || null,
      job_title: job_title || null,
      source,
      lifecycle_stage,
      tags: JSON.stringify(tags),
      custom_fields: JSON.stringify(custom_fields),
      notes: notes || null,
      avatar_url: avatar_url || null,
      is_active: 1
    }).returning();

    // Add initial note if provided
    if (notes) {
      await db.insert(contactNotes).values({
        contact_id: newContact.id,
        user_id: currentUserId,
        note_type: 'general',
        content: notes
      });
    }

    return res.status(201).json({
      message: 'Contact created successfully',
      contact: {
        ...newContact,
        tags: JSON.parse(newContact.tags || '[]'),
        custom_fields: JSON.parse(newContact.custom_fields || '{}')
      }
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    return res.status(500).json({ error: 'Failed to create contact' });
  }
}
