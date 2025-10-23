import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { contentManagementConversations, contentChangeSuggestions, contentAuditLog } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import ContentManager from '@/lib/ai/contentManager';
import HardcodedContentManager from '@/lib/hardcodedContentManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const { message, conversationId, context, action } = req.body;

      if (action === 'parse-command') {
        // Parse natural language command
        const contentManager = ContentManager.getInstance();
        const command = await contentManager.parseCommand(message, context);
        
        return res.status(200).json({
          success: true,
          command,
          message: `I understand you want to ${command.intent} ${command.contentType}. ${command.reasoning}`
        });
      }

      if (action === 'generate-suggestions') {
        // Generate content suggestions
        const { command, currentContent } = req.body;
        const contentManager = ContentManager.getInstance();
        const suggestions = await contentManager.generateContentSuggestions(command, currentContent);
        
        return res.status(200).json({
          success: true,
          suggestions,
          message: `I've generated ${suggestions.length} suggestion(s) for your request.`
        });
      }

      if (action === 'analyze-content') {
        // Analyze content quality
        const { content, contentType } = req.body;
        const contentManager = ContentManager.getInstance();
        const analysis = await contentManager.analyzeContent(content, contentType);
        
        return res.status(200).json({
          success: true,
          analysis,
          message: 'Content analysis completed.'
        });
      }

      if (action === 'execute-changes') {
        // Execute approved content changes
        const { suggestions } = req.body;
        const contentManager = ContentManager.getInstance();
        const result = await contentManager.executeContentChanges(suggestions);
        
        // Log the changes
        for (const suggestion of suggestions) {
          await db.insert(contentAuditLog).values({
            user_id: user.id,
            action: 'execute',
            content_type: suggestion.content_type,
            target_id: suggestion.target_id,
            target_path: suggestion.target_path,
            field_name: suggestion.field_name,
            old_value: suggestion.current_value,
            new_value: suggestion.suggested_value,
            suggestion_id: suggestion.id,
            metadata: JSON.stringify({ executed_at: new Date().toISOString() })
          });
        }
        
        return res.status(200).json({
          success: result.success,
          results: result.results,
          errors: result.errors,
          message: result.success ? 'Changes executed successfully.' : 'Some changes failed to execute.'
        });
      }

      // Default chat response
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Parse the user's command
      const contentManager = ContentManager.getInstance();
      const command = await contentManager.parseCommand(message, context);

      let response = '';
      let suggestions: any[] = [];

      if (command.intent === 'create' || command.intent === 'update' || command.intent === 'delete') {
        // Generate suggestions for content changes
        suggestions = await contentManager.generateContentSuggestions(command);
        response = `I understand you want to ${command.intent} ${command.contentType}. I've prepared ${suggestions.length} suggestion(s) for your review.`;
      } else if (command.intent === 'list' || command.intent === 'search') {
        // Search for content
        const results = await contentManager.searchContent(command.contentType, command.filters || {});
        response = `I found ${results.length} ${command.contentType}(s) matching your criteria.`;
      } else {
        response = `I understand you want to ${command.intent} ${command.contentType}. How can I help you with that?`;
      }

      // Save conversation if conversationId is provided
      if (conversationId) {
        try {
          // Get existing conversation
          const conversation = await db.query.contentManagementConversations.findFirst({
            where: eq(contentManagementConversations.id, conversationId)
          });

          if (conversation) {
            const messages = JSON.parse(conversation.messages);
            messages.push(
              { role: 'user', content: message, timestamp: new Date().toISOString() },
              { role: 'assistant', content: response, timestamp: new Date().toISOString() }
            );

            await db.update(contentManagementConversations)
              .set({
                messages: JSON.stringify(messages),
                last_message_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .where(eq(contentManagementConversations.id, conversationId));
          }
        } catch (error) {
          console.error('Error saving conversation:', error);
        }
      }

      return res.status(200).json({
        success: true,
        message: response,
        command,
        suggestions,
        requiresApproval: command.requiresApproval
      });

    } else if (req.method === 'GET') {
      // Get conversation history or other data
      const { conversationId } = req.query;

      if (conversationId) {
        const conversation = await db.query.contentManagementConversations.findFirst({
          where: eq(contentManagementConversations.id, parseInt(conversationId as string))
        });

        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }

        return res.status(200).json({
          success: true,
          conversation: {
            id: conversation.id,
            title: conversation.title,
            messages: JSON.parse(conversation.messages),
            context: conversation.context ? JSON.parse(conversation.context) : null,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at
          }
        });
      }

      return res.status(400).json({ error: 'Invalid request' });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Content assistant API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
