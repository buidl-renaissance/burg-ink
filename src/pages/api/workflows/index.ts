import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../db';
import { workflowRules } from '../../../db/schema';
import { asc, eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { enabled_only } = req.query;
      
      let query = db.select().from(workflowRules);
      
      // Filter by enabled status if requested
      if (enabled_only === 'true') {
        query = query.where(eq(workflowRules.is_enabled, 1));
      }
      
      // Order by priority, then by name
      query = query.orderBy(asc(workflowRules.priority), asc(workflowRules.name));
      
      const rules = await query;
      
      res.status(200).json({ rules });
    } catch (error) {
      console.error('Error fetching workflow rules:', error);
      res.status(500).json({ error: 'Failed to fetch workflow rules' });
    }
  } else if (req.method === 'POST') {
    try {
      const { 
        name, 
        description, 
        trigger, 
        conditions, 
        actions, 
        priority = 0 
      } = req.body;
      
      if (!name || !trigger || !conditions || !actions) {
        return res.status(400).json({ 
          error: 'name, trigger, conditions, and actions are required' 
        });
      }
      
      // Validate conditions and actions are valid JSON
      try {
        JSON.parse(conditions);
        JSON.parse(actions);
      } catch (error) {
        return res.status(400).json({ error: 'conditions and actions must be valid JSON' });
      }
      
      const newRule = await db.insert(workflowRules).values({
        name,
        description: description || null,
        trigger,
        conditions,
        actions,
        priority,
        is_enabled: 1,
      }).returning();
      
      res.status(201).json({ rule: newRule[0] });
    } catch (error) {
      console.error('Error creating workflow rule:', error);
      res.status(500).json({ error: 'Failed to create workflow rule' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
