import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, media } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { storageService } from '@/lib/storage';
import { createHash } from 'crypto';

interface ImportRequest {
  fileIds: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { fileIds }: ImportRequest = req.body;

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ message: 'No file IDs provided' });
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

    const accessToken = userWithTokens.google_drive_token;
    const importedFiles = [];

    // Process each file
    for (const fileId of fileIds) {
      try {
        // Get file details from Google Drive
        const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!fileResponse.ok) {
          console.error(`Failed to fetch file ${fileId}:`, fileResponse.status);
          continue;
        }

        const fileData = await fileResponse.json();

        // Check if file already exists in our database
        const existingMedia = await db.query.media.findFirst({
          where: eq(media.source_id, fileId)
        });

        if (existingMedia) {
          console.log(`File ${fileId} already exists, skipping`);
          continue;
        }

        // Download file content
        const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!downloadResponse.ok) {
          console.error(`Failed to download file ${fileId}:`, downloadResponse.status);
          continue;
        }

        const fileBuffer = Buffer.from(await downloadResponse.arrayBuffer());
        
        // Generate unique file ID for storage
        const storageFileId = createHash('md5')
          .update(`${user.id}-${fileId}-${Date.now()}`)
          .digest('hex');

        // Store file in DigitalOcean Spaces
        const storedFile = await storageService.storeFile(
          fileBuffer,
          fileData.name,
          storageFileId,
          fileData.mimeType
        );

        // Create media record
        const newMedia = await db.insert(media).values({
          id: createHash('md5').update(`${fileId}-${Date.now()}`).digest('hex'),
          original_url: storedFile.url,
          user_id: user.id,
          source: 'google_drive',
          source_id: fileId,
          filename: fileData.name,
          mime_type: fileData.mimeType,
          size: parseInt(fileData.size) || 0,
          processing_status: 'pending',
        }).returning();

        importedFiles.push({
          id: newMedia[0].id,
          filename: fileData.name,
          mimeType: fileData.mimeType,
          size: parseInt(fileData.size) || 0,
          url: storedFile.url,
        });

        // TODO: Trigger background processing for image resizing and AI analysis
        // This would typically be done via Inngest or similar background job system

      } catch (error) {
        console.error(`Error processing file ${fileId}:`, error);
        // Continue with other files even if one fails
      }
    }

    res.status(200).json({ 
      message: `Successfully imported ${importedFiles.length} files`,
      files: importedFiles 
    });
  } catch (error) {
    console.error('Error importing Google Drive files:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
