import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../db';
import { artwork, tattoos, media, inquiries, users } from '../../../../db/schema';
import { eq, count, isNull, and } from 'drizzle-orm';

interface AdminDashboardStats {
  totalArtworks: number;
  totalTattoos: number;
  totalMedia: number;
  totalInquiries: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get full user data from database to check role
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        role: true,
        name: true,
        email: true,
      }
    });

    if (!userData) {
      console.log('User not found in database:', user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User data:', userData);

    // Check if user has admin privileges
    if (userData.role !== 'admin') {
      console.log('User does not have admin role:', userData.role);
      return res.status(403).json({ 
        message: 'Admin access required',
        userRole: userData.role 
      });
    }

    // Get artwork stats
    let artworkCount = 0;
    try {
      const result = await db.select({ count: count() })
        .from(artwork)
        .where(isNull(artwork.deleted_at));
      artworkCount = result[0]?.count || 0;
    } catch (error) {
      console.warn('Error fetching artwork count:', error);
    }

    // Get tattoo stats
    let tattooCount = 0;
    try {
      const result = await db.select({ count: count() })
        .from(tattoos)
        .where(isNull(tattoos.deleted_at));
      tattooCount = result[0]?.count || 0;
    } catch (error) {
      console.warn('Error fetching tattoo count:', error);
    }

    // Get media stats
    let mediaCount = 0;
    try {
      const result = await db.select({ count: count() })
        .from(media);
      mediaCount = result[0]?.count || 0;
    } catch (error) {
      console.warn('Error fetching media count:', error);
    }

    // Get inquiry stats
    let inquiryCount = 0;
    try {
      const result = await db.select({ count: count() })
        .from(inquiries);
      inquiryCount = result[0]?.count || 0;
    } catch (error) {
      console.warn('Error fetching inquiry count:', error);
    }


    const stats: AdminDashboardStats = {
      totalArtworks: artworkCount,
      totalTattoos: tattooCount,
      totalMedia: mediaCount,
      totalInquiries: inquiryCount,
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error getting admin dashboard stats:', error);
    res.status(500).json({ 
      message: 'Failed to get admin dashboard stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
