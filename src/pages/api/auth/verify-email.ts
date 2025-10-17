import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/middleware/auth';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const handler = async (req: NextApiRequest, res: NextApiResponse, user: { id: number; email: string; name: string }) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get current user data
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id)
    });

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userData.is_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 86400000); // 24 hours

    // Store verification token in user data
    const userDataObj = userData.data ? JSON.parse(userData.data) : {};
    userDataObj.verificationToken = verificationToken;
    userDataObj.verificationExpires = verificationExpires.toISOString();

    await db.update(users)
      .set({ 
        data: JSON.stringify(userDataObj)
      })
      .where(eq(users.id, user.id));

    // In production, send verification email
    console.log(`Verification token for ${user.email}: ${verificationToken}`);
    console.log(`Verification link: ${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${verificationToken}`);

    res.status(200).json({ 
      message: 'Verification email sent successfully' 
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default withAuth(handler);
