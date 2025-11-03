import { NextApiRequest, NextApiResponse } from 'next';
import { getAllArtwork, createArtwork, getPublishedArtworkFromArtist } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const { artist_id, category, is_for_sale, limit, offset, published } = req.query;
        
        // Determine which function to use based on the 'published' parameter
        // Note: Results are now ordered by sort_order ASC, created_at DESC
        let artworks;
        if (published === 'true') {
          // Get only published artwork from the main artist
          artworks = await getPublishedArtworkFromArtist();
        } else {
          // Get all artwork (for admin interfaces)
          artworks = await getAllArtwork();
        }
        
        // Apply additional filters
        if (artist_id) {
          artworks = artworks.filter(art => art.artist_id === parseInt(artist_id as string));
        }
        
        if (category) {
          artworks = artworks.filter(art => art.data?.category?.includes(category as string));
        }
        
        if (is_for_sale !== undefined) {
          artworks = artworks.filter(art => art.data?.is_for_sale === (is_for_sale === 'true'));
        }
        
        // Apply pagination
        const limitNum = limit ? parseInt(limit as string) : 100;
        const offsetNum = offset ? parseInt(offset as string) : 0;
        
        artworks = artworks.slice(offsetNum, offsetNum + limitNum);
        
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
    console.error('Artwork API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
} 