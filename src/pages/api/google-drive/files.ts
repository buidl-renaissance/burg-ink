import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  thumbnailLink?: string;
  webContentLink?: string;
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

    // Get user with Google Drive tokens
    const userWithTokens = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        google_drive_token: true,
        google_drive_refresh_token: true,
      }
    });

    if (!userWithTokens?.google_drive_token) {
      return res.status(401).json({ message: 'Not authenticated with Google Drive' });
    }

    // Refresh token if needed
    let accessToken = userWithTokens.google_drive_token;
    
    try {
      // Test if token is still valid
      const testResponse = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (testResponse.status === 401) {
        // Token expired, refresh it
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: userWithTokens.google_drive_refresh_token!,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          accessToken = refreshData.access_token;
          
          // Update token in database
          await db.update(users)
            .set({
              google_drive_token: accessToken,
              updated_at: new Date().toISOString(),
            })
            .where(eq(users.id, user.id));
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }

    // Fetch files from Google Drive
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      // Add query parameters for filtering
      // Note: This is a simplified version - you might want to add more filtering
    });

    if (!response.ok) {
      throw new Error(`Google Drive API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter and format files
    const files: GoogleDriveFile[] = (data.files || [])
      .filter((file: Record<string, unknown>) => {
        // Filter for images and videos
        return (file.mimeType as string)?.startsWith('image/') || (file.mimeType as string)?.startsWith('video/');
      })
      .map((file: Record<string, unknown>) => ({
        id: file.id as string,
        name: file.name as string,
        mimeType: file.mimeType as string,
        size: (file.size as string) || '0',
        thumbnailLink: file.thumbnailLink as string,
        webContentLink: file.webContentLink as string,
      }));

    res.status(200).json({ files });
  } catch (error) {
    console.error('Error fetching Google Drive files:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
