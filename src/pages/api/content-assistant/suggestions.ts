import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { contentChangeSuggestions, contentAuditLog } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Get suggestions for user
      const { status, conversation_id } = req.query;

      let whereConditions = eq(contentChangeSuggestions.user_id, user.id);
      
      if (status) {
        whereConditions = eq(contentChangeSuggestions.status, status as string);
      }
      
      if (conversation_id) {
        whereConditions = eq(contentChangeSuggestions.conversation_id, parseInt(conversation_id as string));
      }

      const suggestions = await db.query.contentChangeSuggestions.findMany({
        where: whereConditions,
        orderBy: [desc(contentChangeSuggestions.created_at)]
      });

      const formattedSuggestions = suggestions.map(suggestion => ({
        id: suggestion.id,
        conversation_id: suggestion.conversation_id,
        content_type: suggestion.content_type,
        target_id: suggestion.target_id,
        target_path: suggestion.target_path,
        field_name: suggestion.field_name,
        current_value: suggestion.current_value,
        suggested_value: suggestion.suggested_value,
        change_type: suggestion.change_type,
        reasoning: suggestion.reasoning,
        confidence_score: suggestion.confidence_score,
        status: suggestion.status,
        applied_at: suggestion.applied_at,
        created_at: suggestion.created_at,
        updated_at: suggestion.updated_at
      }));

      return res.status(200).json({
        success: true,
        suggestions: formattedSuggestions
      });

    } else if (req.method === 'POST') {
      // Create new suggestion
      const {
        conversation_id,
        content_type,
        target_id,
        target_path,
        field_name,
        current_value,
        suggested_value,
        change_type,
        reasoning,
        confidence_score
      } = req.body;

      if (!content_type || !suggested_value || !change_type) {
        return res.status(400).json({ error: 'Required fields missing' });
      }

      const newSuggestion = await db.insert(contentChangeSuggestions).values({
        conversation_id: conversation_id || null,
        user_id: user.id,
        content_type,
        target_id: target_id || null,
        target_path: target_path || null,
        field_name: field_name || null,
        current_value: current_value || null,
        suggested_value,
        change_type,
        reasoning: reasoning || null,
        confidence_score: confidence_score || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).returning();

      return res.status(201).json({
        success: true,
        suggestion: {
          id: newSuggestion[0].id,
          conversation_id: newSuggestion[0].conversation_id,
          content_type: newSuggestion[0].content_type,
          target_id: newSuggestion[0].target_id,
          target_path: newSuggestion[0].target_path,
          field_name: newSuggestion[0].field_name,
          current_value: newSuggestion[0].current_value,
          suggested_value: newSuggestion[0].suggested_value,
          change_type: newSuggestion[0].change_type,
          reasoning: newSuggestion[0].reasoning,
          confidence_score: newSuggestion[0].confidence_score,
          status: newSuggestion[0].status,
          applied_at: newSuggestion[0].applied_at,
          created_at: newSuggestion[0].created_at,
          updated_at: newSuggestion[0].updated_at
        }
      });

    } else if (req.method === 'PUT') {
      // Update suggestion status
      const { id, status, action } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Suggestion ID is required' });
      }

      // Get the suggestion first
      const suggestion = await db.query.contentChangeSuggestions.findFirst({
        where: eq(contentChangeSuggestions.id, id)
      });

      if (!suggestion) {
        return res.status(404).json({ error: 'Suggestion not found' });
      }

      // Check if user owns this suggestion
      if (suggestion.user_id !== user.id) {
        return res.status(403).json({ error: 'Unauthorized to modify this suggestion' });
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (status) {
        updateData.status = status;
      }

      if (action === 'approve') {
        updateData.status = 'approved';
      } else if (action === 'reject') {
        updateData.status = 'rejected';
      } else if (action === 'apply') {
        updateData.status = 'applied';
        updateData.applied_at = new Date().toISOString();
      }

      const updatedSuggestion = await db.update(contentChangeSuggestions)
        .set(updateData)
        .where(eq(contentChangeSuggestions.id, id))
        .returning();

      // Log the action
      await db.insert(contentAuditLog).values({
        user_id: user.id,
        action: action || 'update',
        content_type: suggestion.content_type,
        target_id: suggestion.target_id,
        target_path: suggestion.target_path,
        field_name: suggestion.field_name,
        old_value: suggestion.current_value,
        new_value: suggestion.suggested_value,
        suggestion_id: suggestion.id,
        metadata: JSON.stringify({ 
          action: action || 'update',
          timestamp: new Date().toISOString()
        })
      });

      return res.status(200).json({
        success: true,
        suggestion: {
          id: updatedSuggestion[0].id,
          conversation_id: updatedSuggestion[0].conversation_id,
          content_type: updatedSuggestion[0].content_type,
          target_id: updatedSuggestion[0].target_id,
          target_path: updatedSuggestion[0].target_path,
          field_name: updatedSuggestion[0].field_name,
          current_value: updatedSuggestion[0].current_value,
          suggested_value: updatedSuggestion[0].suggested_value,
          change_type: updatedSuggestion[0].change_type,
          reasoning: updatedSuggestion[0].reasoning,
          confidence_score: updatedSuggestion[0].confidence_score,
          status: updatedSuggestion[0].status,
          applied_at: updatedSuggestion[0].applied_at,
          created_at: updatedSuggestion[0].created_at,
          updated_at: updatedSuggestion[0].updated_at
        }
      });

    } else if (req.method === 'DELETE') {
      // Delete suggestion
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Suggestion ID is required' });
      }

      // Check if user owns this suggestion
      const suggestion = await db.query.contentChangeSuggestions.findFirst({
        where: eq(contentChangeSuggestions.id, parseInt(id as string))
      });

      if (!suggestion) {
        return res.status(404).json({ error: 'Suggestion not found' });
      }

      if (suggestion.user_id !== user.id) {
        return res.status(403).json({ error: 'Unauthorized to delete this suggestion' });
      }

      const deletedSuggestion = await db.delete(contentChangeSuggestions)
        .where(eq(contentChangeSuggestions.id, parseInt(id as string)))
        .returning();

      return res.status(200).json({
        success: true,
        message: 'Suggestion deleted successfully'
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Content assistant suggestions API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
