import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '../../../../db';
import { artwork, tattoos, media, inquiries, contacts, users } from '../../../../db/schema';
import { eq, count, isNull, and } from 'drizzle-orm';

interface DashboardStats {
  artwork: {
    total: number;
    published: number;
    draft: number;
  };
  tattoos: {
    total: number;
    published: number;
    draft: number;
  };
  media: {
    total: number;
    processed: number;
    pending: number;
    failed: number;
  };
  contracts: {
    total: number;
    active: number;
    completed: number;
  };
  inquiries: {
    total: number;
    new: number;
    contacted: number;
    completed: number;
  };
  profile: {
    setupComplete: boolean;
    completionPercentage: number;
    missingFields: string[];
  };
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

    // Get artwork stats
    const artworkStats = await Promise.all([
      db.select({ count: count() }).from(artwork).where(isNull(artwork.deleted_at)),
      db.select({ count: count() }).from(artwork).where(and(
        isNull(artwork.deleted_at),
        eq(artwork.artist_id, user.id)
      ))
    ]);

    // Get tattoo stats
    const tattooStats = await Promise.all([
      db.select({ count: count() }).from(tattoos).where(isNull(tattoos.deleted_at)),
      db.select({ count: count() }).from(tattoos).where(and(
        isNull(tattoos.deleted_at),
        eq(tattoos.artist_id, user.id)
      ))
    ]);

    // Get media stats
    const mediaStats = await Promise.all([
      db.select({ count: count() }).from(media),
      db.select({ count: count() }).from(media).where(eq(media.processing_status, 'completed')),
      db.select({ count: count() }).from(media).where(eq(media.processing_status, 'pending')),
      db.select({ count: count() }).from(media).where(eq(media.processing_status, 'failed'))
    ]);

    // Get inquiry stats
    const inquiryStats = await Promise.all([
      db.select({ count: count() }).from(inquiries),
      db.select({ count: count() }).from(inquiries).where(eq(inquiries.status, 'new')),
      db.select({ count: count() }).from(inquiries).where(eq(inquiries.status, 'contacted')),
      db.select({ count: count() }).from(inquiries).where(eq(inquiries.status, 'completed'))
    ]);

    // Get contact stats (as contracts/prospects)
    const contactStats = await Promise.all([
      db.select({ count: count() }).from(contacts),
      db.select({ count: count() }).from(contacts).where(eq(contacts.lifecycle_stage, 'prospect')),
      db.select({ count: count() }).from(contacts).where(eq(contacts.lifecycle_stage, 'customer'))
    ]);

    // Check profile setup status
    const userProfile = await db.query.users.findFirst({
      where: eq(users.id, user.id)
    });

    const profileSetupStatus = checkProfileSetupStatus(userProfile);

    const stats: DashboardStats = {
      artwork: {
        total: artworkStats[0][0]?.count || 0,
        published: artworkStats[1][0]?.count || 0,
        draft: 0 // Could add draft status if needed
      },
      tattoos: {
        total: tattooStats[0][0]?.count || 0,
        published: tattooStats[1][0]?.count || 0,
        draft: 0 // Could add draft status if needed
      },
      media: {
        total: mediaStats[0][0]?.count || 0,
        processed: mediaStats[1][0]?.count || 0,
        pending: mediaStats[2][0]?.count || 0,
        failed: mediaStats[3][0]?.count || 0
      },
      contracts: {
        total: contactStats[0][0]?.count || 0,
        active: contactStats[1][0]?.count || 0,
        completed: contactStats[2][0]?.count || 0
      },
      inquiries: {
        total: inquiryStats[0][0]?.count || 0,
        new: inquiryStats[1][0]?.count || 0,
        contacted: inquiryStats[2][0]?.count || 0,
        completed: inquiryStats[3][0]?.count || 0
      },
      profile: profileSetupStatus
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ 
      message: 'Failed to get dashboard stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function checkProfileSetupStatus(user: any) {
  const requiredFields = [
    { field: 'name', label: 'Name' },
    { field: 'email', label: 'Email' },
    { field: 'bio', label: 'Bio' },
    { field: 'profile_picture', label: 'Profile Picture' }
  ];

  const missingFields: string[] = [];
  let completedFields = 0;

  requiredFields.forEach(({ field, label }) => {
    if (!user?.[field] || user[field].trim() === '') {
      missingFields.push(label);
    } else {
      completedFields++;
    }
  });

  const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);
  const setupComplete = missingFields.length === 0;

  return {
    setupComplete,
    completionPercentage,
    missingFields
  };
}
