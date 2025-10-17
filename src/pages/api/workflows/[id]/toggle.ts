import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../db';
import { workflowRules } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Workflow rule ID is required' });
  }
  
  const ruleId = parseInt(id);
  if (isNaN(ruleId)) {
    return res.status(400).json({ error: 'Invalid workflow rule ID' });
  }
  
  try {
    // Check if rule exists
    const existing = await db.select().from(workflowRules)
      .where(eq(workflowRules.id, ruleId))
      .limit(1);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Workflow rule not found' });
    }
    
    const currentRule = existing[0];
    const newEnabledStatus = currentRule.is_enabled === 1 ? 0 : 1;
    
    // Toggle the enabled status
    const updatedRule = await db.update(workflowRules)
      .set({ 
        is_enabled: newEnabledStatus,
        updated_at: new Date().toISOString()
      })
      .where(eq(workflowRules.id, ruleId))
      .returning();
    
    res.status(200).json({ 
      rule: updatedRule[0],
      message: `Workflow rule ${newEnabledStatus ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling workflow rule:', error);
    res.status(500).json({ error: 'Failed to toggle workflow rule' });
  }
}
