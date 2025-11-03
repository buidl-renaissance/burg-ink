import { NextApiRequest, NextApiResponse } from 'next';
import { updateArtworkOrder } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { updates } = req.body;

    // Validate request body
    if (!Array.isArray(updates)) {
      return res.status(400).json({ 
        error: 'Invalid request body. Expected array of updates.' 
      });
    }

    // Validate each update object
    for (const update of updates) {
      if (typeof update.id !== 'number' || typeof update.sort_order !== 'number') {
        return res.status(400).json({ 
          error: 'Each update must have id and sort_order as numbers' 
        });
      }
    }

    // Perform batch update
    const results = await updateArtworkOrder(updates);

    res.status(200).json({ 
      success: true,
      updated: results.length,
      data: results 
    });
  } catch (error) {
    console.error('Artwork reorder error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

