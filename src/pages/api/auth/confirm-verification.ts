import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    // Find user with matching verification token
    const allUsers = await db.query.users.findMany();
    let userWithToken = null;

    for (const user of allUsers) {
      if (user.data) {
        try {
          const userData = JSON.parse(user.data);
          if (userData.verificationToken === token && userData.verificationExpires) {
            const verificationExpires = new Date(userData.verificationExpires);
            if (verificationExpires > new Date()) {
              userWithToken = user;
              break;
            }
          }
        } catch {
          // Invalid JSON, skip
          continue;
        }
      }
    }

    if (!userWithToken) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Mark user as verified and clear verification token
    const userDataObj = userWithToken.data ? JSON.parse(userWithToken.data) : {};
    delete userDataObj.verificationToken;
    delete userDataObj.verificationExpires;

    await db.update(users)
      .set({ 
        is_verified: 1,
        data: JSON.stringify(userDataObj)
      })
      .where(eq(users.id, userWithToken.id));

    res.status(200).json({ message: 'Email verified successfully' });

  } catch (error) {
    console.error('Email confirmation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
