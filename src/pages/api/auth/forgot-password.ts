import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    // Always return success to prevent email enumeration
    // In production, you might want to implement actual email sending
    res.status(200).json({ 
      message: 'If an account with that email exists, we\'ve sent a password reset link.' 
    });

    // If user exists, generate reset token and send email
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token in user data (you might want to add a separate table for this)
      await db.update(users)
        .set({ 
          data: JSON.stringify({ 
            resetToken, 
            resetExpires: resetExpires.toISOString() 
          }) 
        })
        .where(eq(users.id, user.id));

      // In production, send email with reset link
      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(`Reset link: ${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`);
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
