import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../db';
import { contactTags } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const currentUser = await getAuthorizedUser(req);
    if (!currentUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has admin or artist permissions
    if (!['admin', 'artist'].includes(currentUser.role)) {
      return res.status(403).json({ error: 'Admin or artist access required' });
    }

    switch (req.method) {
      case 'GET':
        return handleGetTags(req, res);
      case 'POST':
        return handleCreateTag(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Contact tags API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetTags(req: NextApiRequest, res: NextApiResponse) {
  const tags = await db
    .select()
    .from(contactTags)
    .orderBy(desc(contactTags.created_at));

  return res.status(200).json({
    tags
  });
}

async function handleCreateTag(req: NextApiRequest, res: NextApiResponse) {
  const { name, color = '#96885f', description } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Tag name is required' });
  }

  // Check if tag already exists
  const existingTag = await db.query.contactTags.findFirst({
    where: eq(contactTags.name, name.trim())
  });

  if (existingTag) {
    return res.status(409).json({ error: 'Tag with this name already exists' });
  }

  try {
    const [newTag] = await db.insert(contactTags).values({
      name: name.trim(),
      color,
      description: description || null
    }).returning();

    return res.status(201).json({
      message: 'Tag created successfully',
      tag: newTag
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    return res.status(500).json({ error: 'Failed to create tag' });
  }
}
