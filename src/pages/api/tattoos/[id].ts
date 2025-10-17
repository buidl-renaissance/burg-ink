import { NextApiRequest, NextApiResponse } from 'next';
import { db, tattoos, artists } from '../../../../db';
import { eq } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;
    const tattooId = parseInt(id as string);

    if (isNaN(tattooId)) {
      return res.status(400).json({ error: 'Invalid tattoo ID' });
    }

    switch (req.method) {
      case 'GET':
        // Get tattoo by ID with artist information
        const result = await db
          .select({
            id: tattoos.id,
            slug: tattoos.slug,
            title: tattoos.title,
            description: tattoos.description,
            artist_id: tattoos.artist_id,
            image: tattoos.image,
            category: tattoos.category,
            placement: tattoos.placement,
            size: tattoos.size,
            style: tattoos.style,
            meta: tattoos.meta,
            data: tattoos.data,
            created_at: tattoos.created_at,
            updated_at: tattoos.updated_at,
            artist: {
              id: artists.id,
              name: artists.name,
              slug: artists.slug,
              profile_picture: artists.profile_picture,
            },
          })
          .from(tattoos)
          .leftJoin(artists, eq(tattoos.artist_id, artists.id))
          .where(eq(tattoos.id, tattooId))
          .limit(1);
        
        if (result.length === 0) {
          return res.status(404).json({ error: 'Tattoo not found' });
        }
        
        res.status(200).json(result[0]);
        break;

      case 'PUT':
        const updateData = req.body;
        
        // Validate at least one field is provided
        if (!updateData.title && !updateData.description && !updateData.image && 
            !updateData.category && !updateData.placement && !updateData.size && 
            !updateData.style) {
          return res.status(400).json({ 
            error: 'At least one field must be provided for update' 
          });
        }
        
        // Get current tattoo to merge meta data
        const currentTattoo = await db
          .select()
          .from(tattoos)
          .where(eq(tattoos.id, tattooId))
          .limit(1);
        
        if (currentTattoo.length === 0) {
          return res.status(404).json({ error: 'Tattoo not found' });
        }
        
        // Merge existing meta with new meta data
        let mergedMeta = currentTattoo[0].meta;
        if (updateData.meta) {
          try {
            const existingMeta = mergedMeta ? JSON.parse(mergedMeta) : {};
            mergedMeta = JSON.stringify({ ...existingMeta, ...updateData.meta });
          } catch (error) {
            console.error('Error parsing existing meta:', error);
            mergedMeta = JSON.stringify(updateData.meta);
          }
        }
        
        // Update tattoo
        const updateResult = await db
          .update(tattoos)
          .set({
            title: updateData.title || currentTattoo[0].title,
            description: updateData.description !== undefined ? updateData.description : currentTattoo[0].description,
            artist_id: updateData.artist_id !== undefined ? updateData.artist_id : currentTattoo[0].artist_id,
            image: updateData.image !== undefined ? updateData.image : currentTattoo[0].image,
            category: updateData.category !== undefined ? updateData.category : currentTattoo[0].category,
            placement: updateData.placement !== undefined ? updateData.placement : currentTattoo[0].placement,
            size: updateData.size !== undefined ? updateData.size : currentTattoo[0].size,
            style: updateData.style !== undefined ? updateData.style : currentTattoo[0].style,
            meta: mergedMeta,
            updated_at: new Date().toISOString(),
          })
          .where(eq(tattoos.id, tattooId))
          .returning();
        
        if (updateResult.length === 0) {
          return res.status(404).json({ error: 'Tattoo not found' });
        }
        
        // Get the updated tattoo with artist information
        const updatedResult = await db
          .select({
            id: tattoos.id,
            slug: tattoos.slug,
            title: tattoos.title,
            description: tattoos.description,
            artist_id: tattoos.artist_id,
            image: tattoos.image,
            category: tattoos.category,
            placement: tattoos.placement,
            size: tattoos.size,
            style: tattoos.style,
            meta: tattoos.meta,
            data: tattoos.data,
            created_at: tattoos.created_at,
            updated_at: tattoos.updated_at,
            artist: {
              id: artists.id,
              name: artists.name,
              slug: artists.slug,
              profile_picture: artists.profile_picture,
            },
          })
          .from(tattoos)
          .leftJoin(artists, eq(tattoos.artist_id, artists.id))
          .where(eq(tattoos.id, tattooId))
          .limit(1);
        
        res.status(200).json(updatedResult[0]);
        break;

      case 'DELETE':
        // Soft delete by setting deleted_at timestamp
        const deleteResult = await db
          .update(tattoos)
          .set({
            deleted_at: new Date().toISOString(),
          })
          .where(eq(tattoos.id, tattooId))
          .returning();
        
        if (deleteResult.length === 0) {
          return res.status(404).json({ error: 'Tattoo not found' });
        }
        
        res.status(200).json({ message: 'Tattoo deleted successfully' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Tattoo API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

