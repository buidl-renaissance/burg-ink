import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import { storageService } from '@/lib/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { path: filePath } = req.query;
    
    if (!filePath || !Array.isArray(filePath)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }

    // Join the path segments and sanitize
    const filename = path.basename(filePath.join('/'));
    const sanitizedPath = path.join(process.cwd(), 'public', 'uploads', filename);

    // Security check: ensure the path is within the uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!sanitizedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if file exists
    const fileInfo = await storageService.getFileInfo(filename);
    if (!fileInfo) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Read file
    const fileBuffer = await fs.readFile(sanitizedPath);

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileInfo.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('ETag', `"${fileInfo.size}-${filename}"`);
    
    // Send the file
    res.send(fileBuffer);

  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 