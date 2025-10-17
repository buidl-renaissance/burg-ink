import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../db';
import { taxonomy } from '../../../db/schema';
// import { eq } from 'drizzle-orm';
import { DEFAULT_TAXONOMIES } from '../../../lib/taxonomies/seed';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { force = false } = req.body;
    
    // Check if taxonomies already exist
    const existingCount = await db.select().from(taxonomy).limit(1);
    
    if (existingCount.length > 0 && !force) {
      return res.status(409).json({ 
        error: 'Taxonomies already exist. Use force=true to overwrite.',
        existingCount: existingCount.length 
      });
    }
    
    // Clear existing taxonomies if force is true
    if (force && existingCount.length > 0) {
      await db.delete(taxonomy);
    }
    
    // Insert default taxonomies
    const insertedTaxonomies = await db.insert(taxonomy).values(
      DEFAULT_TAXONOMIES.map(t => ({
        namespace: t.namespace,
        key: t.key,
        label: t.label,
        description: t.description || null,
        order: t.order,
        parent_id: t.parent_id || null,
        is_active: 1,
      }))
    ).returning();
    
    res.status(201).json({ 
      message: 'Taxonomies seeded successfully',
      count: insertedTaxonomies.length,
      taxonomies: insertedTaxonomies
    });
  } catch (error) {
    console.error('Error seeding taxonomies:', error);
    res.status(500).json({ error: 'Failed to seed taxonomies' });
  }
}
