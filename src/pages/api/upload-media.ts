import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { storageService } from '@/lib/storage';
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
    // Check authentication
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse the form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    const [, files] = await form.parse(req);
    
    const uploadedFile = files.image?.[0];
    if (!uploadedFile) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Validate file type
    if (!uploadedFile.mimetype?.startsWith('image/')) {
      return res.status(400).json({ message: 'Invalid file type. Only images are allowed.' });
    }

    // Read the file
    const fileBuffer = await fs.readFile(uploadedFile.filepath);
    
    // Generate a unique file ID for this upload
    const fileId = createHash('md5')
      .update(`${user.id}-${Date.now()}-${uploadedFile.originalFilename}`)
      .digest('hex');

    // Store the file in DigitalOcean Spaces
    const storedFile = await storageService.storeFile(
      fileBuffer,
      uploadedFile.originalFilename || 'uploaded-image',
      fileId,
      uploadedFile.mimetype
    );

    // Clean up the temporary file
    await fs.unlink(uploadedFile.filepath);

    res.status(200).json({
      url: storedFile.url,
      filename: storedFile.filename,
      key: storedFile.key,
      size: storedFile.size,
      mimeType: storedFile.mimeType,
      spaces_key: storedFile.key,
      spaces_url: storedFile.url,
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 