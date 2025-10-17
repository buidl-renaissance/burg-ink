import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../../db';
import { workflowRules } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { WorkflowEngine } from '../../../../lib/workflows/engine';

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
    // Fetch the workflow rule
    const result = await db.select().from(workflowRules)
      .where(eq(workflowRules.id, ruleId))
      .limit(1);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Workflow rule not found' });
    }
    
    const rule = result[0];
    
    // Get test context from request body
    const { testContext } = req.body;
    
    if (!testContext) {
      return res.status(400).json({ error: 'testContext is required' });
    }
    
    // Test the rule
    const execution = await WorkflowEngine.testRule(rule, testContext);
    
    res.status(200).json({ 
      execution,
      message: 'Workflow rule test completed'
    });
  } catch (error) {
    console.error('Error testing workflow rule:', error);
    res.status(500).json({ error: 'Failed to test workflow rule' });
  }
}
