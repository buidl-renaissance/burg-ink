import { NextApiRequest, NextApiResponse } from 'next';
import { searchWorks } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { query, limit } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid query parameter',
      });
    }

    const limitNum = limit ? parseInt(limit as string) : 20;
    const results = await searchWorks(query, limitNum);

    res.status(200).json({ data: results });
  } catch (error) {
    console.error('Work search API error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}

