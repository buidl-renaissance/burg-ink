import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../db';
import { taxonomy } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Taxonomy ID is required' });
  }
  
  const taxonomyId = parseInt(id);
  if (isNaN(taxonomyId)) {
    return res.status(400).json({ error: 'Invalid taxonomy ID' });
  }
  
  if (req.method === 'GET') {
    try {
      const result = await db.select().from(taxonomy)
        .where(eq(taxonomy.id, taxonomyId))
        .limit(1);
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Taxonomy not found' });
      }
      
      res.status(200).json({ taxonomy: result[0] });
    } catch (error) {
      console.error('Error fetching taxonomy:', error);
      res.status(500).json({ error: 'Failed to fetch taxonomy' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { namespace, key, label, description, order, parent_id, is_active } = req.body;
      
      // Check if taxonomy exists
      const existing = await db.select().from(taxonomy)
        .where(eq(taxonomy.id, taxonomyId))
        .limit(1);
      
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Taxonomy not found' });
      }
      
      // Prepare update data
      const updateData: Partial<typeof taxonomy.$inferInsert> = {};
      if (namespace !== undefined) updateData.namespace = namespace;
      if (key !== undefined) updateData.key = key;
      if (label !== undefined) updateData.label = label;
      if (description !== undefined) updateData.description = description;
      if (order !== undefined) updateData.order = order;
      if (parent_id !== undefined) updateData.parent_id = parent_id;
      if (is_active !== undefined) updateData.is_active = is_active;
      
      // Add updated timestamp
      updateData.updated_at = new Date().toISOString();
      
      const updatedTaxonomy = await db.update(taxonomy)
        .set(updateData)
        .where(eq(taxonomy.id, taxonomyId))
        .returning();
      
      res.status(200).json({ taxonomy: updatedTaxonomy[0] });
    } catch (error) {
      console.error('Error updating taxonomy:', error);
      res.status(500).json({ error: 'Failed to update taxonomy' });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Check if taxonomy exists
      const existing = await db.select().from(taxonomy)
        .where(eq(taxonomy.id, taxonomyId))
        .limit(1);
      
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Taxonomy not found' });
      }
      
      // Soft delete by setting is_active to 0
      await db.update(taxonomy)
        .set({ 
          is_active: 0,
          updated_at: new Date().toISOString()
        })
        .where(eq(taxonomy.id, taxonomyId));
      
      res.status(200).json({ message: 'Taxonomy deleted successfully' });
    } catch (error) {
      console.error('Error deleting taxonomy:', error);
      res.status(500).json({ error: 'Failed to delete taxonomy' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
