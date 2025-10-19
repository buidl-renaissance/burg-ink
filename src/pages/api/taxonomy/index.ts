import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../db';
import { taxonomy } from '../../../../db/schema';
import { eq, and, asc } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { namespace, active_only } = req.query;
      
      // Build where conditions
      const conditions = [];
      if (namespace && typeof namespace === 'string') {
        conditions.push(eq(taxonomy.namespace, namespace));
      }
      if (active_only === 'true') {
        conditions.push(eq(taxonomy.is_active, 1));
      }
      
      // Build query with conditions
      const query = db.select().from(taxonomy);
      const queryWithWhere = conditions.length > 0 
        ? query.where(and(...conditions))
        : query;
      
      const taxonomies = await queryWithWhere.orderBy(
        asc(taxonomy.namespace), 
        asc(taxonomy.order)
      );
      
      res.status(200).json({ taxonomies });
    } catch (error) {
      console.error('Error fetching taxonomies:', error);
      res.status(500).json({ error: 'Failed to fetch taxonomies' });
    }
  } else if (req.method === 'POST') {
    try {
      const { namespace, key, label, description, order, parent_id } = req.body;
      
      if (!namespace || !key || !label) {
        return res.status(400).json({ error: 'namespace, key, and label are required' });
      }
      
      // Check if taxonomy already exists
      const existing = await db.select().from(taxonomy)
        .where(and(
          eq(taxonomy.namespace, namespace),
          eq(taxonomy.key, key)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Taxonomy with this namespace and key already exists' });
      }
      
      const newTaxonomy = await db.insert(taxonomy).values({
        namespace,
        key,
        label,
        description: description || null,
        order: order || 0,
        parent_id: parent_id || null,
        is_active: 1,
      }).returning();
      
      res.status(201).json({ taxonomy: newTaxonomy[0] });
    } catch (error) {
      console.error('Error creating taxonomy:', error);
      res.status(500).json({ error: 'Failed to create taxonomy' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}


