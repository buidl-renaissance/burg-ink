import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { storageService } from '@/lib/storage';
import { db } from '@/lib/db';
import { media } from '../../../db/schema';
import { inngest } from '@/lib/inngest';
import formidable from 'formidable';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import convert from 'heic-convert';

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Check if a buffer is a HEIC/HEIF file
 */
function isHeicFile(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const signature = buffer.slice(4, 12).toString('ascii');
  return signature.includes('heic') || 
         signature.includes('heix') || 
         signature.includes('hevc') ||
         signature.includes('mif1');
}

/**
 * Convert HEIC/HEIF buffer to JPEG
 */
async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  try {
    console.log('Converting HEIC/HEIF to JPEG before upload...');
    const outputBuffer = await convert({
      buffer,
      format: 'JPEG',
      quality: 0.95
    });
    return Buffer.from(new Uint8Array(outputBuffer));
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    throw new Error(`Failed to convert HEIC to JPEG: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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
    let fileBuffer = await fs.readFile(uploadedFile.filepath);
    let finalMimeType = uploadedFile.mimetype || 'application/octet-stream';
    const originalFilename = uploadedFile.originalFilename || 'uploaded-media';
    
    // Detect and convert HEIC files BEFORE uploading to storage
    if (isImage) {
      const isHeicByMimeType = uploadedFile.mimetype === 'image/heic' ||
                               uploadedFile.mimetype === 'image/heif';
      const isHeicBySignature = isHeicFile(fileBuffer);
      const fileExtension = originalFilename.split('.').pop()?.toLowerCase();
      const isHeicByExtension = fileExtension === 'heic' || fileExtension === 'heif';
      
      const isHeic = isHeicByMimeType || isHeicBySignature || isHeicByExtension;
      
      if (isHeic) {
        console.log(`Detected HEIC file: ${originalFilename}, converting to JPEG before upload...`);
        try {
          // Convert HEIC to JPEG
          fileBuffer = await convertHeicToJpeg(fileBuffer);
          finalMimeType = 'image/jpeg';
          console.log(`Successfully converted HEIC to JPEG: ${originalFilename}`);
        } catch (error) {
          console.error('HEIC conversion failed:', error);
          throw new Error(`Failed to convert HEIC image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    // Generate a unique file ID for this upload
    const fileId = createHash('md5')
      .update(`${user?.id || 'anonymous'}-${Date.now()}-${originalFilename}`)
      .digest('hex');

    // Store the processed file in DigitalOcean Spaces (already JPEG if converted from HEIC)
    const storedFile = await storageService.storeFile(
      fileBuffer,
      originalFilename,
      fileId,
      finalMimeType
    );

    // Create media record in database
    const newMedia = await db.insert(media).values({
      id: fileId, // Use fileId as the media ID
      original_url: storedFile.url,
      user_id: user?.id || 1, // Default to user 1 if no auth
      source: 'upload',
      source_id: fileId,
      filename: originalFilename,
      mime_type: finalMimeType, // Will be image/jpeg if converted from HEIC
      size: fileBuffer.length, // Size of the processed buffer
      processing_status: 'pending',
    }).returning();

    // Clean up the temporary file
    await fs.unlink(uploadedFile.filepath);

    // Trigger background processing for images
    // Note: File is already JPEG if it was HEIC, so processing doesn't need to convert
    if (isImage) {
      try {
        await inngest.send({
          name: 'media.process-new-upload',
          data: {
            mediaId: newMedia[0].id,
            originalUrl: storedFile.url,
            originalName: originalFilename,
            fileId: fileId,
            mimeType: finalMimeType, // Will be image/jpeg if converted from HEIC
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