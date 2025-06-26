import { NextApiRequest, NextApiResponse } from 'next';
import { OAuth2Client } from 'google-auth-library';
import { createToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '../../../../../db';
import { eq } from 'drizzle-orm';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/google/callback`
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const userInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
    );
    
    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const userInfo = await userInfoResponse.json();

    // Check if user exists in database
    let user = await db.query.users.findFirst({
      where: eq(users.email, userInfo.email)
    });

    if (!user) {
      // Create new user
      const [newUser] = await db.insert(users).values({
        name: userInfo.name,
        email: userInfo.email,
        profile_picture: userInfo.picture,
        google_id: userInfo.id,
      }).returning();
      
      user = newUser;
    } else {
      // Update existing user's profile picture if needed
      if (!user.profile_picture && userInfo.picture) {
        await db.update(users)
          .set({ profile_picture: userInfo.picture })
          .where(eq(users.id, user.id));
      }
    }

    // Store Google Drive tokens
    await db.update(users)
      .set({
        google_drive_token: tokens.access_token,
        google_drive_refresh_token: tokens.refresh_token,
      })
      .where(eq(users.id, user.id));

    // Create JWT token
    const token = createToken({
      id: user.id,
      email: user.email || '',
      name: user.name
    });

    // Redirect to frontend with token
    const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback?token=${encodeURIComponent(token)}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
} 