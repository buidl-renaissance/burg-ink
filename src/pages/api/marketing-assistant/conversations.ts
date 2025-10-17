import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { marketingConversations } from '../../../../db/schema';
import { eq, and, desc, like } from 'drizzle-orm';

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ConversationRequestBody {
  title?: string;
  messages: ConversationMessage[];
  artistProfile?: Record<string, unknown>;
  conversationStage?: string | null;
  tags?: string[] | null;
}

interface ConversationUpdateBody {
  title?: string;
  messages?: ConversationMessage[];
  artistProfile?: Record<string, unknown>;
  conversationStage?: string | null;
  tags?: string[];
  isActive?: boolean | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET':
        return handleGetConversations(req, res, user.id);
      case 'POST':
        return handleCreateConversation(req, res, user.id);
      case 'PUT':
        return handleUpdateConversation(req, res, user.id);
      case 'DELETE':
        return handleDeleteConversation(req, res, user.id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Conversations API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetConversations(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const { 
    artistId, 
    search,
    limit = '20',
    offset = '0',
    includeInactive = 'false'
  } = req.query;

  try {
    // Build where conditions
    const whereConditions = [eq(marketingConversations.user_id, userId)];

    if (artistId && typeof artistId === 'string') {
      whereConditions.push(eq(marketingConversations.artist_id, parseInt(artistId)));
    }

    if (search && typeof search === 'string') {
      whereConditions.push(like(marketingConversations.title, `%${search}%`));
    }

    if (includeInactive === 'false') {
      whereConditions.push(eq(marketingConversations.is_active, 1));
    }

    const query = db.select()
      .from(marketingConversations)
      .where(and(...whereConditions));

    // Apply pagination and ordering
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const conversations = await query
      .orderBy(desc(marketingConversations.last_message_at))
      .limit(limitNum)
      .offset(offsetNum);

    // Transform the data to include parsed JSON fields
    const transformedConversations = conversations.map(conv => ({
      ...conv,
      messages: JSON.parse(conv.messages),
      artistProfile: conv.artist_profile ? JSON.parse(conv.artist_profile) : null,
      tags: conv.tags ? JSON.parse(conv.tags) : [],
      isActive: conv.is_active === 1
    }));

    return res.status(200).json({
      success: true,
      conversations: transformedConversations,
      pagination: {
        limit: limitNum,
        offset: offsetNum,
        total: conversations.length
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}

async function handleCreateConversation(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const {
    title,
    messages,
    artistProfile,
    conversationStage = 'intro',
    tags
  }: ConversationRequestBody = req.body;

  // Validate required fields
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ 
      error: 'Messages array is required and must not be empty' 
    });
  }

  try {
    // Generate title if not provided
    const conversationTitle = title || generateConversationTitle(messages);

    // Set all other conversations as inactive
    await db.update(marketingConversations)
      .set({ is_active: 0 })
      .where(eq(marketingConversations.user_id, userId));

    const newConversation = await db.insert(marketingConversations).values({
      user_id: userId,
      artist_id: (artistProfile as unknown as { artistId: number })?.artistId || null,
      title: conversationTitle,
      messages: JSON.stringify(messages),
      artist_profile: artistProfile ? JSON.stringify(artistProfile) : null,
      conversation_stage: conversationStage,
      is_active: 1,
      tags: tags ? JSON.stringify(tags) : null,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).returning();

    return res.status(201).json({
      success: true,
      conversation: {
        ...newConversation[0],
        messages: JSON.parse(newConversation[0].messages),
        artistProfile: artistProfile,
        tags: tags || [],
        isActive: true
      }
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
}

async function handleUpdateConversation(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const { id } = req.query;
  const {
    title,
    messages,
    artistProfile,
    conversationStage,
    tags,
    isActive
  }: ConversationUpdateBody = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  try {
    // Verify the conversation belongs to the user
    const existingConversation = await db.query.marketingConversations.findFirst({
      where: and(
        eq(marketingConversations.id, parseInt(id)),
        eq(marketingConversations.user_id, userId)
      )
    });

    if (!existingConversation) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    // If setting as active, deactivate all other conversations
    if (isActive) {
      await db.update(marketingConversations)
        .set({ is_active: 0 })
        .where(eq(marketingConversations.user_id, userId));
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof marketingConversations.$inferInsert> = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (messages !== undefined) {
      updateData.messages = JSON.stringify(messages);
      updateData.last_message_at = new Date().toISOString();
    }
    if (artistProfile !== undefined) updateData.artist_profile = JSON.stringify(artistProfile);
    if (conversationStage !== undefined) updateData.conversation_stage = conversationStage;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (isActive !== undefined) updateData.is_active = isActive ? 1 : 0;

    const updatedConversation = await db.update(marketingConversations)
      .set(updateData)
      .where(eq(marketingConversations.id, parseInt(id)))
      .returning();

    return res.status(200).json({
      success: true,
      conversation: {
        ...updatedConversation[0],
        messages: messages !== undefined ? messages : JSON.parse(updatedConversation[0].messages),
        artistProfile: artistProfile !== undefined ? artistProfile : (updatedConversation[0].artist_profile ? JSON.parse(updatedConversation[0].artist_profile) : null),
        tags: tags !== undefined ? tags : (updatedConversation[0].tags ? JSON.parse(updatedConversation[0].tags) : []),
        isActive: isActive !== undefined ? isActive : (updatedConversation[0].is_active === 1)
      }
    });

  } catch (error) {
    console.error('Error updating conversation:', error);
    return res.status(500).json({ error: 'Failed to update conversation' });
  }
}

async function handleDeleteConversation(req: NextApiRequest, res: NextApiResponse, userId: number) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Conversation ID is required' });
  }

  try {
    // Verify the conversation belongs to the user
    const existingConversation = await db.query.marketingConversations.findFirst({
      where: and(
        eq(marketingConversations.id, parseInt(id)),
        eq(marketingConversations.user_id, userId)
      )
    });

    if (!existingConversation) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    await db.delete(marketingConversations)
      .where(eq(marketingConversations.id, parseInt(id)));

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({ error: 'Failed to delete conversation' });
  }
}

function generateConversationTitle(messages: ConversationMessage[]): string {
  // Try to extract a meaningful title from the first few messages
  const firstUserMessage = messages.find(msg => msg.type === 'user');
  if (firstUserMessage) {
    const content = firstUserMessage.content;
    // Extract first sentence or first 50 characters
    const firstSentence = content.split('.')[0];
    if (firstSentence.length <= 50) {
      return firstSentence;
    }
    return content.substring(0, 47) + '...';
  }
  
  // Fallback to timestamp-based title
  return `Conversation ${new Date().toLocaleDateString()}`;
}
