import { NextApiRequest, NextApiResponse } from 'next';
import { getAllArtwork } from '@/lib/db';

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
        const artwork = allArtwork.find(art => art.id === artworkId);
        
        if (!artwork) {
          return res.status(404).json({ error: 'Artwork not found' });
        }
        
        res.status(200).json({ data: artwork });
        break;

      case 'PUT':
        // TODO: Implement update functionality
        res.status(501).json({ error: 'Update not implemented yet' });
        break;

      case 'DELETE':
        // TODO: Implement delete functionality
        res.status(501).json({ error: 'Delete not implemented yet' });
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