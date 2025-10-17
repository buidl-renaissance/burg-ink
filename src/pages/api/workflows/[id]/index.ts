import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../db';
import { workflowRules } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Workflow rule ID is required' });
  }
  
  const ruleId = parseInt(id);
  if (isNaN(ruleId)) {
    return res.status(400).json({ error: 'Invalid workflow rule ID' });
  }
  
  if (req.method === 'GET') {
    try {
      const result = await db.select().from(workflowRules)
        .where(eq(workflowRules.id, ruleId))
        .limit(1);
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Workflow rule not found' });
      }
      
      res.status(200).json({ rule: result[0] });
    } catch (error) {
      console.error('Error fetching workflow rule:', error);
      res.status(500).json({ error: 'Failed to fetch workflow rule' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { 
        name, 
        description, 
        trigger, 
        conditions, 
        actions, 
        priority,
        is_enabled 
      } = req.body;
      
      // Check if rule exists
      const existing = await db.select().from(workflowRules)
        .where(eq(workflowRules.id, ruleId))
        .limit(1);
      
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Workflow rule not found' });
      }
      
      // Validate conditions and actions are valid JSON if provided
      if (conditions) {
        try {
          JSON.parse(conditions);
        } catch {
          return res.status(400).json({ error: 'conditions must be valid JSON' });
        }
      }
      
      if (actions) {
        try {
          JSON.parse(actions);
        } catch {
          return res.status(400).json({ error: 'actions must be valid JSON' });
        }
      }
      
      // Prepare update data
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (trigger !== undefined) updateData.trigger = trigger;
      if (conditions !== undefined) updateData.conditions = conditions;
      if (actions !== undefined) updateData.actions = actions;
      if (priority !== undefined) updateData.priority = priority;
      if (is_enabled !== undefined) updateData.is_enabled = is_enabled;
      
      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();
      
      const updatedRule = await db.update(workflowRules)
        .set(updateData)
        .where(eq(workflowRules.id, ruleId))
        .returning();
      
      res.status(200).json({ rule: updatedRule[0] });
    } catch (error) {
      console.error('Error updating workflow rule:', error);
      res.status(500).json({ error: 'Failed to update workflow rule' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Check if rule exists
      const existing = await db.select().from(workflowRules)
        .where(eq(workflowRules.id, ruleId))
        .limit(1);
      
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Workflow rule not found' });
      }
      
      // Soft delete by setting is_enabled to 0
      await db.update(workflowRules)
        .set({ 
          is_enabled: 0,
          updated_at: new Date().toISOString()
        })
        .where(eq(workflowRules.id, ruleId));
      
      res.status(200).json({ message: 'Workflow rule deleted successfully' });
    } catch (error) {
      console.error('Error deleting workflow rule:', error);
      res.status(500).json({ error: 'Failed to delete workflow rule' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
