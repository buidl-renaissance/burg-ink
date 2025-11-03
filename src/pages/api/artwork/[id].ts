import { NextApiRequest, NextApiResponse } from 'next';
import { getAllArtwork } from '@/lib/db';
import { db, artwork } from '../../../../db';
import { eq } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.query;
    const artworkId = parseInt(id as string);

    if (isNaN(artworkId)) {
      return res.status(400).json({ error: 'Invalid artwork ID' });
    }

    switch (req.method) {
      case 'GET':
        // Get all artwork and find by ID
        // TODO: Implement direct ID query
        const allArtwork = await getAllArtwork();
        const artworkItem = allArtwork.find(art => art.id === artworkId);
        
        if (!artworkItem) {
          return res.status(404).json({ error: 'Artwork not found' });
        }
        
        res.status(200).json({ data: artworkItem });
        break;

      case 'PUT':
        const updateData = req.body;
        
        // Validate required fields - allow status updates even if other fields are not provided
        if (!updateData.title && !updateData.description && !updateData.image && !updateData.meta?.status) {
          return res.status(400).json({ 
            error: 'At least one field must be provided for update' 
          });
        }
        
        // Get current artwork to merge meta data
        const currentArtwork = await db
          .select()
          .from(artwork)
          .where(eq(artwork.id, artworkId))
          .limit(1);
        
        if (currentArtwork.length === 0) {
          return res.status(404).json({ error: 'Artwork not found' });
        }
        
        // Merge existing meta with new meta data
        let mergedMeta = currentArtwork[0].meta;
        if (updateData.meta) {
          try {
            const existingMeta = mergedMeta ? JSON.parse(mergedMeta) : {};
            mergedMeta = JSON.stringify({ ...existingMeta, ...updateData.meta });
          } catch (error) {
            console.error('Error parsing existing meta:', error);
            mergedMeta = JSON.stringify(updateData.meta);
          }
        }
        
        // Update artwork
        const result = await db
          .update(artwork)
          .set({
            ...updateData,
            meta: mergedMeta,
            updated_at: new Date().toISOString(),
          })
          .where(eq(artwork.id, artworkId))
          .returning();
        
        if (result.length === 0) {
          return res.status(404).json({ error: 'Artwork not found' });
        }
        
        // Get the updated artwork with artist information
        const updatedArtwork = await getAllArtwork();
        const updatedArtworkWithArtist = updatedArtwork.find(art => art.id === artworkId);
        
        res.status(200).json({ data: updatedArtworkWithArtist });
        break;

      case 'DELETE':
        // Soft delete by setting deleted_at timestamp
        const deleteResult = await db
          .update(artwork)
          .set({
            deleted_at: new Date().toISOString(),
          })
          .where(eq(artwork.id, artworkId))
          .returning();
        
        if (deleteResult.length === 0) {
          return res.status(404).json({ error: 'Artwork not found' });
        }
        
        res.status(200).json({ message: 'Artwork deleted successfully' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Artwork API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
} 