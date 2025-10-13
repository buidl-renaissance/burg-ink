import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`/admin/media?error=${encodeURIComponent('Google Drive authorization was denied')}`);
    }

    if (!code || !state) {
      return res.redirect('/admin/media?error=Missing authorization code');
    }

    const userId = parseInt(state as string);
    if (!userId) {
      return res.redirect('/admin/media?error=Invalid user ID');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/google-drive/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return res.redirect('/admin/media?error=Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();

    // Store tokens in database
    await db.update(users)
      .set({
        google_drive_token: tokenData.access_token,
        google_drive_refresh_token: tokenData.refresh_token,
        updated_at: new Date().toISOString(),
      })
      .where(eq(users.id, userId));

    res.redirect('/admin/media?success=Google Drive connected successfully');
  } catch (error) {
    console.error('Google Drive callback error:', error);
    res.redirect('/admin/media?error=Internal server error');
  }
}
