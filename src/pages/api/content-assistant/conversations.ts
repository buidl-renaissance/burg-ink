import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { contentManagementConversations } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get all conversations for the user
      const conversations = await db.query.contentManagementConversations.findMany({
        where: eq(contentManagementConversations.user_id, user.id),
        orderBy: [desc(contentManagementConversations.last_message_at)]
      });

      const formattedConversations = conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        messages: JSON.parse(conv.messages),
        context: conv.context ? JSON.parse(conv.context) : null,
        is_active: Boolean(conv.is_active),
        tags: conv.tags ? JSON.parse(conv.tags) : [],
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        last_message_at: conv.last_message_at
      }));

      return res.status(200).json({
        success: true,
        conversations: formattedConversations
      });

    } else if (req.method === 'POST') {
      // Create new conversation
      const { title, context, tags } = req.body;

      const newConversation = await db.insert(contentManagementConversations).values({
        user_id: user.id,
        title: title || `Content Management - ${new Date().toLocaleDateString()}`,
        messages: JSON.stringify([
          {
            role: 'assistant',
            content: "Hello! I'm your AI content management assistant. I can help you create, update, and manage your website content. What would you like to work on today?",
            timestamp: new Date().toISOString()
          }
        ]),
        context: context ? JSON.stringify(context) : null,
        tags: tags ? JSON.stringify(tags) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      }).returning();

      return res.status(201).json({
        success: true,
        conversation: {
          id: newConversation[0].id,
          title: newConversation[0].title,
          messages: JSON.parse(newConversation[0].messages),
          context: newConversation[0].context ? JSON.parse(newConversation[0].context) : null,
          is_active: Boolean(newConversation[0].is_active),
          tags: newConversation[0].tags ? JSON.parse(newConversation[0].tags) : [],
          created_at: newConversation[0].created_at,
          updated_at: newConversation[0].updated_at,
          last_message_at: newConversation[0].last_message_at
        }
      });

    } else if (req.method === 'PUT') {
      // Update conversation
      const { id, title, is_active, tags } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Conversation ID is required' });
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (title !== undefined) updateData.title = title;
      if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;
      if (tags !== undefined) updateData.tags = JSON.stringify(tags);

      const updatedConversation = await db.update(contentManagementConversations)
        .set(updateData)
        .where(eq(contentManagementConversations.id, id))
        .returning();

      if (updatedConversation.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      return res.status(200).json({
        success: true,
        conversation: {
          id: updatedConversation[0].id,
          title: updatedConversation[0].title,
          messages: JSON.parse(updatedConversation[0].messages),
          context: updatedConversation[0].context ? JSON.parse(updatedConversation[0].context) : null,
          is_active: Boolean(updatedConversation[0].is_active),
          tags: updatedConversation[0].tags ? JSON.parse(updatedConversation[0].tags) : [],
          created_at: updatedConversation[0].created_at,
          updated_at: updatedConversation[0].updated_at,
          last_message_at: updatedConversation[0].last_message_at
        }
      });

    } else if (req.method === 'DELETE') {
      // Delete conversation
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Conversation ID is required' });
      }

      const deletedConversation = await db.delete(contentManagementConversations)
        .where(eq(contentManagementConversations.id, parseInt(id as string)))
        .returning();

      if (deletedConversation.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully'
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Content assistant conversations API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
