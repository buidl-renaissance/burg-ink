import { NextApiRequest, NextApiResponse } from 'next';
import { inngest } from '@/lib/inngest';
import { getAllArtwork } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all artwork
    const allArtwork = await getAllArtwork();
    
    if (allArtwork.length === 0) {
      return res.status(404).json({ error: 'No artwork found' });
    }

    // Trigger embedding creation for each artwork
    const results = await Promise.all(
      allArtwork.map(async (artwork) => {
        try {
          await inngest.send({
            name: 'artwork.embeddings.create',
            data: { artwork }
          });
          return { success: true, id: artwork.id, title: artwork.title };
        } catch (error) {
          return { success: false, id: artwork.id, title: artwork.title, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.status(200).json({ 
      success: true, 
      message: `Embedding creation triggered for ${allArtwork.length} artwork items`,
      summary: {
        total: allArtwork.length,
        successful,
        failed
      },
      results
    });
  } catch (error) {
    console.error('Error triggering artwork embedding creation:', error);
    res.status(500).json({ 
      error: 'Failed to trigger embedding creation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 