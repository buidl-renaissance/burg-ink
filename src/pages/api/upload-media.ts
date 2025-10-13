import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { storageService } from '@/lib/storage';
import { db } from '@/lib/db';
import { media } from '../../../db/schema';
import { inngest } from '@/lib/inngest';
import formidable from 'formidable';
import { createHash } from 'crypto';
import fs from 'fs/promises';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Optional: Get user info if available (for tracking purposes)
    const user = await getAuthorizedUser(req);

    // Parse the form data with increased file size limit for videos
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB limit for videos
    });

    const [, files] = await form.parse(req);
    
    const uploadedFile = files.image?.[0];
    if (!uploadedFile) {
      return res.status(400).json({ message: 'No media file provided' });
    }

    // Validate file type - allow both images and videos
    const isImage = uploadedFile.mimetype?.startsWith('image/');
    const isVideo = uploadedFile.mimetype?.startsWith('video/');
    
    if (!isImage && !isVideo) {
      return res.status(400).json({ message: 'Invalid file type. Only images and videos are allowed.' });
    }

    // Read the file
    const fileBuffer = await fs.readFile(uploadedFile.filepath);
    
    // Generate a unique file ID for this upload
    const fileId = createHash('md5')
      .update(`${user?.id || 'anonymous'}-${Date.now()}-${uploadedFile.originalFilename}`)
      .digest('hex');

    // Store the file in DigitalOcean Spaces
    const storedFile = await storageService.storeFile(
      fileBuffer,
      uploadedFile.originalFilename || 'uploaded-media',
      fileId,
      uploadedFile.mimetype || 'application/octet-stream'
    );

    // Create media record in database
    const newMedia = await db.insert(media).values({
      user_id: user?.id || 1, // Default to user 1 if no auth
      source: 'upload',
      source_id: fileId,
      filename: uploadedFile.originalFilename || 'uploaded-media',
      mime_type: uploadedFile.mimetype || 'application/octet-stream',
      size: uploadedFile.size || 0,
      spaces_key: storedFile.key,
      spaces_url: storedFile.url,
      processing_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).returning();

    // Clean up the temporary file
    await fs.unlink(uploadedFile.filepath);

    // Trigger background processing for images
    if (uploadedFile.mimetype?.startsWith('image/')) {
      try {
        await inngest.send({
          name: 'media.process-new-upload',
          data: {
            mediaId: newMedia[0].id,
            originalUrl: storedFile.url,
            originalName: uploadedFile.originalFilename || 'uploaded-media',
            fileId: fileId,
            mimeType: uploadedFile.mimetype || 'application/octet-stream',
          },
        });
      } catch (error) {
        console.error('Failed to trigger background processing:', error);
        // Don't fail the upload if background processing fails to start
      }
    }

    res.status(200).json({
      url: storedFile.url,
      filename: storedFile.filename,
      key: storedFile.key,
      size: storedFile.size,
      mimeType: storedFile.mimeType,
      spaces_key: storedFile.key,
      spaces_url: storedFile.url,
      mediaId: newMedia[0].id,
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 