import { NextApiRequest, NextApiResponse } from 'next';
import { getAllArtists, getArtistBySlug, getArtist } from '@/lib/db';
import { db, artists, socialLinks } from '../../../../db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const { id, slug } = req.query;
        if (slug) {
          // Get specific artist by slug
          const artist = await getArtistBySlug(slug as string);
          if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
          }
          return res.status(200).json({ data: artist });
        } else if (id) {
          // Get specific artist by id
          const artist = await getArtist(id as string);
          if (!artist) {
            return res.status(404).json({ error: 'Artist not found' });
          }
          return res.status(200).json({ data: artist });
        }
        
        // Get all artists
        const allArtists = await getAllArtists();
        res.status(200).json({ data: allArtists });
        break;

      case 'POST':
        const artistData = req.body;
        
        // Validate required fields
        if (!artistData.name || !artistData.handle || !artistData.slug) {
          return res.status(400).json({ 
            error: 'Missing required fields: name, handle, and slug are required' 
          });
        }
        
        // Create social links if provided
        let socialLinksId = null;
        if (artistData.socialLinks) {
          const socialLinksResult = await db
            .insert(socialLinks)
            .values(artistData.socialLinks)
            .returning();
          socialLinksId = socialLinksResult[0].id;
        }
        
        // Create artist
        const result = await db
          .insert(artists)
          .values({
            name: artistData.name,
            slug: artistData.slug,
            profile_picture: artistData.profile_picture,
            bio: artistData.bio,
            social_links_id: socialLinksId,
            tags: artistData.tags ? JSON.stringify(artistData.tags) : null,
          })
          .returning();
        
        res.status(201).json({ data: result[0] });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Drizzle Artists API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
} 