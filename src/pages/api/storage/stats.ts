import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { getStorageStats } from '@/utils/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const stats = await getStorageStats();
    
    res.status(200).json(stats);

  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({ 
      message: 'Failed to get storage stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 