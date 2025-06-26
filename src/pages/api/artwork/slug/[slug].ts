import { NextApiRequest, NextApiResponse } from 'next';
import { getArtworkBySlug } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { slug, published } = req.query;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({ error: 'Invalid slug' });
    }

    switch (req.method) {
      case 'GET':
        const publishedOnly = published === 'true';
        const artwork = await getArtworkBySlug(slug, publishedOnly);
        
        if (!artwork) {
          return res.status(404).json({ error: 'Artwork not found' });
        }
        
        res.status(200).json({ data: artwork });
        break;

      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Artwork API error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
} 