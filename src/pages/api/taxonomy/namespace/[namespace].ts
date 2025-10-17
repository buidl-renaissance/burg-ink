import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../../db';
import { taxonomy } from '../../../../../db/schema';
import { eq, asc, and } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { namespace } = req.query;
  
  if (!namespace || typeof namespace !== 'string') {
    return res.status(400).json({ error: 'Namespace is required' });
  }
  
  if (req.method === 'GET') {
    try {
      const { active_only } = req.query;
      
      let whereConditions = eq(taxonomy.namespace, namespace);
      
      // Filter by active status if requested
      if (active_only === 'true') {
        whereConditions = and(
          eq(taxonomy.namespace, namespace),
          eq(taxonomy.is_active, 1)
        )!;
      }
      
      const taxonomies = await db.select().from(taxonomy)
        .where(whereConditions)
        .orderBy(asc(taxonomy.order));
      
      res.status(200).json({ 
        namespace,
        taxonomies 
      });
    } catch (error) {
      console.error('Error fetching taxonomies by namespace:', error);
      res.status(500).json({ error: 'Failed to fetch taxonomies' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
