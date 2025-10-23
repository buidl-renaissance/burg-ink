import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { contentChangeSuggestions, contentAuditLog } from '../../../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import ContentManager from '@/lib/ai/contentManager';
import HardcodedContentManager from '@/lib/hardcodedContentManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'POST') {
      const { suggestionIds, executeAll = false } = req.body;

      if (!suggestionIds && !executeAll) {
        return res.status(400).json({ error: 'Suggestion IDs or executeAll flag is required' });
      }

      let suggestions;

      if (executeAll) {
        // Get all approved suggestions for the user
        suggestions = await db.query.contentChangeSuggestions.findMany({
          where: eq(contentChangeSuggestions.user_id, user.id)
        });
        suggestions = suggestions.filter(s => s.status === 'approved');
      } else {
        // Get specific suggestions
        suggestions = await db.query.contentChangeSuggestions.findMany({
          where: inArray(contentChangeSuggestions.id, suggestionIds)
        });

        // Check if user owns all suggestions
        const unauthorizedSuggestions = suggestions.filter(s => s.user_id !== user.id);
        if (unauthorizedSuggestions.length > 0) {
          return res.status(403).json({ error: 'Unauthorized to execute some suggestions' });
        }

        // Check if all suggestions are approved
        const unapprovedSuggestions = suggestions.filter(s => s.status !== 'approved');
        if (unapprovedSuggestions.length > 0) {
          return res.status(400).json({ 
            error: 'Some suggestions are not approved',
            unapprovedIds: unapprovedSuggestions.map(s => s.id)
          });
        }
      }

      if (suggestions.length === 0) {
        return res.status(400).json({ error: 'No approved suggestions found' });
      }

      // Execute the changes
      const contentManager = ContentManager.getInstance();
      const result = await contentManager.executeContentChanges(suggestions);

      // Update suggestion statuses
      const suggestionIdsToUpdate = suggestions.map(s => s.id);
      await db.update(contentChangeSuggestions)
        .set({
          status: 'applied',
          applied_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .where(inArray(contentChangeSuggestions.id, suggestionIdsToUpdate));

      // Log the execution
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
          metadata: JSON.stringify({ 
            executed_at: new Date().toISOString(),
            success: result.success
          })
        });
      }

      return res.status(200).json({
        success: result.success,
        results: result.results,
        errors: result.errors,
        executedCount: suggestions.length,
        message: result.success 
          ? `Successfully executed ${suggestions.length} suggestion(s).`
          : `Executed ${suggestions.length} suggestion(s) with some errors.`
      });

    } else if (req.method === 'GET') {
      // Get execution history
      const { limit = 50, offset = 0 } = req.query;

      const executions = await db.query.contentAuditLog.findMany({
        where: eq(contentAuditLog.user_id, user.id),
        orderBy: [desc(contentAuditLog.created_at)],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      const formattedExecutions = executions.map(execution => ({
        id: execution.id,
        action: execution.action,
        content_type: execution.content_type,
        target_id: execution.target_id,
        target_path: execution.target_path,
        field_name: execution.field_name,
        old_value: execution.old_value,
        new_value: execution.new_value,
        suggestion_id: execution.suggestion_id,
        metadata: execution.metadata ? JSON.parse(execution.metadata) : null,
        created_at: execution.created_at
      }));

      return res.status(200).json({
        success: true,
        executions: formattedExecutions
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Content assistant execute API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
