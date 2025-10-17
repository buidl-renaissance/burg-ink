import { NextApiRequest, NextApiResponse } from 'next';
import { db, tattoos, artists } from '../../../../db';
import { eq, isNull } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const { category, placement, size, limit, offset } = req.query;
        
        // Get all tattoos with artist information
        const allTattoos = await db
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
          .where(isNull(tattoos.deleted_at));
        
        let filteredTattoos = allTattoos;
        
        // Apply filters
        if (category) {
          filteredTattoos = filteredTattoos.filter(tattoo => tattoo.category === category);
        }
        
        if (placement) {
          filteredTattoos = filteredTattoos.filter(tattoo => tattoo.placement === placement);
        }
        
        if (size) {
          filteredTattoos = filteredTattoos.filter(tattoo => tattoo.size === size);
        }
        
        // Apply pagination
        const limitNum = limit ? parseInt(limit as string) : 100;
        const offsetNum = offset ? parseInt(offset as string) : 0;
        
        filteredTattoos = filteredTattoos.slice(offsetNum, offsetNum + limitNum);
        
        res.status(200).json({ data: filteredTattoos });
        break;

      case 'POST':
        const tattooData = req.body;
        
        // Generate slug from title if not provided
        const baseSlug = tattooData.slug || tattooData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        // Make slug unique by appending timestamp
        const slug = `${baseSlug}-${Date.now()}`;
        
        // Validate required fields
        if (!tattooData.title) {
          return res.status(400).json({ 
            error: 'Missing required field: title is required' 
          });
        }
        
        // Insert new tattoo
        const result = await db
          .insert(tattoos)
          .values({
            slug,
            title: tattooData.title,
            description: tattooData.description || null,
            artist_id: tattooData.artist_id || null,
            image: tattooData.image || null,
            category: tattooData.category || null,
            placement: tattooData.placement || null,
            size: tattooData.size || null,
            style: tattooData.style || null,
            meta: tattooData.meta ? JSON.stringify(tattooData.meta) : null,
            data: tattooData.data ? JSON.stringify(tattooData.data) : null,
          })
          .returning();
        
        if (result.length === 0) {
          return res.status(500).json({ error: 'Failed to create tattoo' });
        }
        
        res.status(201).json(result[0]);
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Tattoos API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

