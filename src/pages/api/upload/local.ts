import { NextApiRequest, NextApiResponse } from 'next';
import formidable, { Part } from 'formidable';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../../db';
import { media } from '../../../../db/schema';
import { inngest } from '@/lib/inngest';
import { uploadFile, getFileKey } from '@/lib/storage/index';
import convert from 'heic-convert';

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB limit for videos
      filter: (part: Part) => {
        // Accept all image types including HEIC/HEIF
        const isImage = part.mimetype?.startsWith('image/') || false;
        const isVideo = part.mimetype?.startsWith('video/') || false;
        // Explicitly allow HEIC/HEIF MIME types
        const isHeic = part.mimetype === 'image/heic' || 
                      part.mimetype === 'image/heif' ||
                      part.mimetype === 'image/heic-sequence' ||
                      part.mimetype === 'image/heif-sequence';
        return isImage || isVideo || isHeic;
      },
    });

    const [, files] = await form.parse(req);
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the uploaded file
    let fileBuffer = await fs.readFile(uploadedFile.filepath);
    const mediaId = uuidv4();
    
    // Detect HEIC files and convert to JPEG BEFORE uploading to storage
    let fileExtension = uploadedFile.originalFilename?.split('.').pop() || 'jpg';
    let finalMimeType = uploadedFile.mimetype || 'image/jpeg';
    const originalFilename = uploadedFile.originalFilename || 'image.jpg';
    
    const isHeicByExtension = fileExtension.toLowerCase() === 'heic' || 
                               fileExtension.toLowerCase() === 'heif';
    const isHeicByMimeType = uploadedFile.mimetype === 'image/heic' ||
                             uploadedFile.mimetype === 'image/heif';
    const isHeicBySignature = isHeicFile(fileBuffer);
    
    const isHeic = isHeicByExtension || isHeicByMimeType || isHeicBySignature;
    
    if (isHeic) {
      console.log(`Detected HEIC file: ${originalFilename}, converting to JPEG before upload...`);
      try {
        // Convert HEIC to JPEG
        fileBuffer = await convertHeicToJpeg(fileBuffer);
        fileExtension = 'jpg';
        finalMimeType = 'image/jpeg';
        console.log(`Successfully converted HEIC to JPEG: ${originalFilename}`);
      } catch (error) {
        console.error('HEIC conversion failed:', error);
        throw new Error(`Failed to convert HEIC image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Upload the processed file to storage (already JPEG if it was HEIC)
    const originalUpload = await uploadFile(
      fileBuffer,
      getFileKey(mediaId, 'original', fileExtension),
      finalMimeType
    );

    // Save initial record to database with processed file info (JPEG if converted from HEIC)
    const mediaRecord = {
      id: mediaId,
      original_url: originalUpload.url,
      medium_url: null, // Will be updated by background job  
      thumbnail_url: null, // Will be updated by background job
      source: 'local' as const,
      tags: JSON.stringify(['processing']), // Store as JSON string
      title: 'Processing...', // Temporary title
      description: 'Processing...', // Temporary description
      alt_text: 'Image being processed', // Temporary alt text
      filename: originalFilename,
      mime_type: finalMimeType, // Will be image/jpeg if converted from HEIC
      size: fileBuffer.length, // Size of the processed buffer
      processing_status: 'pending',
    };

    await db.insert(media).values(mediaRecord);

    // Trigger background processing job with storage URL
    // Note: File is already JPEG if it was HEIC, so processMediaUpload doesn't need to convert
    await inngest.send({
      name: 'media/process',
      data: {
        mediaId,
        originalUrl: originalUpload.url,
        filename: originalFilename,
        mimetype: finalMimeType, // Will be image/jpeg if converted from HEIC
      },
    });

    // Clean up temporary file
    await fs.unlink(uploadedFile.filepath).catch(() => {});

    // Return immediately with processing status
    res.status(200).json({
      success: true,
      media: {
        id: mediaId,
        originalUrl: originalUpload.url,
        mediumUrl: null,
        thumbnailUrl: null,
        processing: true,
        filename: originalFilename,
        mimeType: finalMimeType, // Will show image/jpeg if converted from HEIC
        wasConverted: isHeic, // Flag to indicate if HEIC was converted
      },
      message: isHeic 
        ? 'HEIC file converted to JPEG and uploaded. Processing in background...'
        : 'Upload received. Processing in background...',
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
