import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Find user with matching reset token
    const allUsers = await db.query.users.findMany();
    let userWithToken = null;

    for (const user of allUsers) {
      if (user.data) {
        try {
          const userData = JSON.parse(user.data);
          if (userData.resetToken === token && userData.resetExpires) {
            const resetExpires = new Date(userData.resetExpires);
            if (resetExpires > new Date()) {
              userWithToken = user;
              break;
            }
          }
        } catch (e) {
          // Invalid JSON, skip
          continue;
        }
      }
    }

    if (!userWithToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user password and clear reset token
    await db.update(users)
      .set({ 
        password: hashedPassword,
        data: null // Clear the reset token data
      })
      .where(eq(users.id, userWithToken.id));

    res.status(200).json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
