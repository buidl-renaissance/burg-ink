import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { hardcodedContentRegistry } from '../../../db/schema';
import { eq, like } from 'drizzle-orm';
import HardcodedContentManager from '@/lib/hardcodedContentManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const { action, content_id, file_path, section_type } = req.query;

      if (action === 'scan') {
        // Scan codebase for content
        const hardcodedManager = HardcodedContentManager.getInstance();
        const contentItems = await hardcodedManager.scanCodebaseForContent();
        
        // Register new items
        await hardcodedManager.registerContentItems(contentItems);
        
        return res.status(200).json({
          success: true,
          message: `Scanned and registered ${contentItems.length} content items`,
          items: contentItems
        });
      }

      if (action === 'preview') {
        // Preview content changes
        const { changes } = req.body;
        if (!changes || !Array.isArray(changes)) {
          return res.status(400).json({ error: 'Changes array is required' });
        }

        const hardcodedManager = HardcodedContentManager.getInstance();
        const diffs = await hardcodedManager.previewContentChanges(changes);
        
        return res.status(200).json({
          success: true,
          diffs
        });
      }

      // Get content items
      let whereConditions = {};

      if (content_id) {
        whereConditions = eq(hardcodedContentRegistry.content_id, content_id as string);
      } else if (file_path) {
        whereConditions = like(hardcodedContentRegistry.file_path, `%${file_path}%`);
      } else if (section_type) {
        whereConditions = eq(hardcodedContentRegistry.section_type, section_type as string);
      }

      const contentItems = await db.query.hardcodedContentRegistry.findMany({
        where: whereConditions
      });

      const formattedItems = contentItems.map(item => ({
        id: item.id,
        content_id: item.content_id,
        file_path: item.file_path,
        line_number: item.line_number,
        content_type: item.content_type,
        section_type: item.section_type,
        current_value: item.current_value,
        description: item.description,
        is_editable: Boolean(item.is_editable),
        last_modified: item.last_modified,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      return res.status(200).json({
        success: true,
        items: formattedItems
      });

    } else if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'apply-changes') {
        // Apply content changes
        const { changes } = req.body;
        if (!changes || !Array.isArray(changes)) {
          return res.status(400).json({ error: 'Changes array is required' });
        }

        const hardcodedManager = HardcodedContentManager.getInstance();
        const result = await hardcodedManager.applyContentChanges(changes);
        
        return res.status(200).json({
          success: result.success,
          errors: result.errors,
          message: result.success 
            ? 'Content changes applied successfully'
            : 'Some changes failed to apply'
        });
      }

      if (action === 'register') {
        // Register new content items
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
          return res.status(400).json({ error: 'Items array is required' });
        }

        const hardcodedManager = HardcodedContentManager.getInstance();
        await hardcodedManager.registerContentItems(items);
        
        return res.status(201).json({
          success: true,
          message: `Registered ${items.length} content items`
        });
      }

      return res.status(400).json({ error: 'Invalid action' });

    } else if (req.method === 'PUT') {
      // Update content item
      const { content_id, current_value, description, is_editable } = req.body;

      if (!content_id) {
        return res.status(400).json({ error: 'Content ID is required' });
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (current_value !== undefined) {
        updateData.current_value = current_value;
        updateData.last_modified = new Date().toISOString();
      }
      if (description !== undefined) updateData.description = description;
      if (is_editable !== undefined) updateData.is_editable = is_editable ? 1 : 0;

      const updatedItem = await db.update(hardcodedContentRegistry)
        .set(updateData)
        .where(eq(hardcodedContentRegistry.content_id, content_id))
        .returning();

      if (updatedItem.length === 0) {
        return res.status(404).json({ error: 'Content item not found' });
      }

      return res.status(200).json({
        success: true,
        item: {
          id: updatedItem[0].id,
          content_id: updatedItem[0].content_id,
          file_path: updatedItem[0].file_path,
          line_number: updatedItem[0].line_number,
          content_type: updatedItem[0].content_type,
          section_type: updatedItem[0].section_type,
          current_value: updatedItem[0].current_value,
          description: updatedItem[0].description,
          is_editable: Boolean(updatedItem[0].is_editable),
          last_modified: updatedItem[0].last_modified,
          created_at: updatedItem[0].created_at,
          updated_at: updatedItem[0].updated_at
        }
      });

    } else if (req.method === 'DELETE') {
      // Delete content item
      const { content_id } = req.query;

      if (!content_id) {
        return res.status(400).json({ error: 'Content ID is required' });
      }

      const hardcodedManager = HardcodedContentManager.getInstance();
      const success = await hardcodedManager.deleteContentItem(content_id as string);
      
      if (!success) {
        return res.status(404).json({ error: 'Content item not found or could not be deleted' });
      }

      return res.status(200).json({
        success: true,
        message: 'Content item deleted successfully'
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Content registry API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
