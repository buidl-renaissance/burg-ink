import { NextApiRequest, NextApiResponse } from 'next';
import { analyzeTattooImage } from '@/lib/ai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    console.log('Analyzing tattoo image:', imageUrl);

    // Call the AI analysis function
    const analysis = await analyzeTattooImage(imageUrl);

    console.log('Tattoo analysis complete:', analysis);

    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error in tattoo analysis API:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to analyze tattoo image',
    });
  }
}

