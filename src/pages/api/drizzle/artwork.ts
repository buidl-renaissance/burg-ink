import { NextApiRequest, NextApiResponse } from 'next';
import { getAllArtwork, createArtwork, getArtworkBySlug } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const { slug } = req.query;
        
        if (slug) {
          // Get specific artwork by slug
          const artwork = await getArtworkBySlug(slug as string);
          if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' });
          }
          return res.status(200).json({ data: artwork });
        }
        
        // Get all artwork
        const artworks = await getAllArtwork();
        res.status(200).json({ data: artworks });
        break;

      case 'POST':
        const artworkData = req.body;
        
        // Validate required fields
        if (!artworkData.slug || !artworkData.title || !artworkData.type) {
          return res.status(400).json({ 
            error: 'Missing required fields: slug, title, and type are required' 
          });
        }
        
        const newArtwork = await createArtwork(artworkData);
        res.status(201).json({ data: newArtwork });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Drizzle Artwork API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
} 