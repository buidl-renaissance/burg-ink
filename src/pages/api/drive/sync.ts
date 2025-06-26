import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { triggerGoogleImagesProcessing } from '@/lib/inngest';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { folderId } = req.body;

    // Get user's Google Drive token
    const userData = await db.query.users.findFirst({
      where: eq(users.id, user.id)
    });

    if (!userData?.google_drive_token) {
      return res.status(400).json({ message: 'Google Drive not connected' });
    }

    // Trigger the background job to process Google images (now using parallel processing)
    const event = await triggerGoogleImagesProcessing(
      user.id,
      folderId,
      userData.google_drive_token
    );

    // Update user's sync settings immediately
    await db.update(users)
      .set({
        google_drive_folder_id: folderId,
        google_drive_sync_enabled: 1,
        last_sync_at: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    res.status(200).json({
      message: 'Google Drive sync started in background',
      eventId: event.ids[0],
      status: 'processing',
      processingMode: 'parallel',
      concurrencyLimit: 6,
      note: 'Files are being processed in parallel for better performance. Each file is processed independently, so one failure won\'t stop the others. AI analysis is triggered automatically after each file is processed. Check back later for results.',
      benefits: [
        'Parallel processing for faster completion (max 6 concurrent)',
        'Better error isolation (one file failing doesn\'t stop others)',
        'Automatic AI analysis triggering',
        'Individual file monitoring and retry capability',
        'Improved scalability for large folders',
        'Controlled concurrency prevents system overload'
      ]
    });

  } catch (error) {
    console.error('Error starting sync:', error);
    res.status(500).json({ message: 'Failed to start sync process' });
  }
} 