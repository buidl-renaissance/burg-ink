import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { savedMarketingContent } from '../../../../db/schema';
import { eq, and, desc, like } from 'drizzle-orm';

interface SavedContentRequestBody {
  title?: string;
  content: string;
  contentType: string;
  platform: string;
  tone: string;
  hashtags?: string[];
  metadata?: Record<string, unknown>;
  entityId?: number;
  entityType?: string;
  artistId?: number;
  tags?: string[];
  isFavorite?: boolean;
}

interface SavedContentUpdateBody {
  title?: string;
  content?: string;
  hashtags?: string[];
  metadata?: Record<string, unknown>;
  tags?: string[];
  isFavorite?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET':
        return handleGetSavedContent(req, res, user.id);
      case 'POST':
        return handleSaveContent(req, res, user.id);
      case 'PUT':
        return handleUpdateContent(req, res, user.id);
      case 'DELETE':
        return handleDeleteContent(req, res, user.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Saved content API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetSavedContent(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const { 
    contentType, 
    platform, 
    artistId, 
    search,
    limit = '50',
    offset = '0'
  } = req.query;

  try {
    // Build where conditions
    const whereConditions = [eq(savedMarketingContent.user_id, userId)];

    if (contentType && typeof contentType === 'string') {
      whereConditions.push(eq(savedMarketingContent.content_type, contentType));
    }

    if (platform && typeof platform === 'string') {
      whereConditions.push(eq(savedMarketingContent.platform, platform));
    }

    if (artistId && typeof artistId === 'string') {
      whereConditions.push(eq(savedMarketingContent.artist_id, parseInt(artistId)));
    }

    if (search && typeof search === 'string') {
      whereConditions.push(like(savedMarketingContent.content, `%${search}%`));
    }

    const query = db.select()
      .from(savedMarketingContent)
      .where(and(...whereConditions));

    // Apply pagination and ordering
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const savedContent = await query
      .orderBy(desc(savedMarketingContent.created_at))
      .limit(limitNum)
      .offset(offsetNum);

    // Transform the data to include parsed JSON fields
    const transformedContent = savedContent.map(item => ({
      ...item,
      hashtags: item.hashtags ? JSON.parse(item.hashtags) : [],
      metadata: item.metadata ? JSON.parse(item.metadata) : {},
      tags: item.tags ? JSON.parse(item.tags) : [],
      isFavorite: item.is_favorite === 1
    }));

    return res.status(200).json({
      success: true,
      content: transformedContent,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: savedContent.length
      }
    });

  } catch (error) {
    console.error('Error fetching saved content:', error);
    return res.status(500).json({ error: 'Failed to fetch saved content' });
  }
}

async function handleSaveContent(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const {
    title,
    content,
    contentType,
    platform,
    tone,
    hashtags,
    metadata,
    entityId,
    entityType,
    artistId,
    tags,
    isFavorite
  }: SavedContentRequestBody = req.body;

  // Validate required fields
  if (!content || !contentType || !platform || !tone) {
    return res.status(400).json({ 
      error: 'Missing required fields: content, contentType, platform, tone' 
    });
  }

  try {
    const newContent = await db.insert(savedMarketingContent).values({
      user_id: userId,
      artist_id: artistId,
      entity_id: entityId,
      entity_type: entityType,
      content_type: contentType,
      platform,
      tone,
      content,
      hashtags: hashtags ? JSON.stringify(hashtags) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      title: title || null,
      tags: tags ? JSON.stringify(tags) : null,
      is_favorite: isFavorite ? 1 : 0,
      updated_at: new Date().toISOString()
    }).returning();

    return res.status(201).json({
      success: true,
      content: {
        ...newContent[0],
        hashtags: hashtags || [],
        metadata: metadata || {},
        tags: tags || [],
        isFavorite: isFavorite || false
      }
    });

  } catch (error) {
    console.error('Error saving content:', error);
    return res.status(500).json({ error: 'Failed to save content' });
  }
}

async function handleUpdateContent(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const { id } = req.query;
  const {
    title,
    content,
    hashtags,
    metadata,
    tags,
    isFavorite
  }: SavedContentUpdateBody = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Content ID is required' });
  }

  try {
    // Verify the content belongs to the user
    const existingContent = await db.query.savedMarketingContent.findFirst({
      where: and(
        eq(savedMarketingContent.id, parseInt(id)),
        eq(savedMarketingContent.user_id, userId)
      )
    });

    if (!existingContent) {
      return res.status(404).json({ error: 'Content not found or access denied' });
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof savedMarketingContent.$inferInsert> = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (hashtags !== undefined) updateData.hashtags = JSON.stringify(hashtags);
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (isFavorite !== undefined) updateData.is_favorite = isFavorite ? 1 : 0;

    const updatedContent = await db.update(savedMarketingContent)
      .set(updateData)
      .where(eq(savedMarketingContent.id, parseInt(id)))
      .returning();

    return res.status(200).json({
      success: true,
      content: {
        ...updatedContent[0],
        hashtags: hashtags !== undefined ? hashtags : (existingContent.hashtags ? JSON.parse(existingContent.hashtags) : []),
        metadata: metadata !== undefined ? metadata : (existingContent.metadata ? JSON.parse(existingContent.metadata) : {}),
        tags: tags !== undefined ? tags : (existingContent.tags ? JSON.parse(existingContent.tags) : []),
        isFavorite: isFavorite !== undefined ? isFavorite : (existingContent.is_favorite === 1)
      }
    });

  } catch (error) {
    console.error('Error updating content:', error);
    return res.status(500).json({ error: 'Failed to update content' });
  }
}

async function handleDeleteContent(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Content ID is required' });
  }

  try {
    // Verify the content belongs to the user
    const existingContent = await db.query.savedMarketingContent.findFirst({
      where: and(
        eq(savedMarketingContent.id, parseInt(id)),
        eq(savedMarketingContent.user_id, userId)
      )
    });

    if (!existingContent) {
      return res.status(404).json({ error: 'Content not found or access denied' });
    }

    await db.delete(savedMarketingContent)
      .where(eq(savedMarketingContent.id, parseInt(id)));

    return res.status(200).json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting content:', error);
    return res.status(500).json({ error: 'Failed to delete content' });
  }
}
