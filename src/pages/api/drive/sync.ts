import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { GoogleDriveService } from '@/lib/googleDrive';
import { storageService } from '@/lib/storage';
import { db } from '../../../../db';
import { users, artwork, googleDriveAssets } from '../../../../db/schema';
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

    const driveService = new GoogleDriveService(userData.google_drive_token);
    const files = await driveService.listFilesInFolder(folderId);

    // Filter for image files
    const imageFiles = files.filter(file => 
      file.mimeType.startsWith('image/')
    );

    const createdArtworks = [];
    const downloadedFiles = [];

    for (const file of imageFiles) {
      // Generate a slug from the filename
      const slug = file.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Check if artwork already exists
      const existingArtwork = await db.query.artwork.findFirst({
        where: eq(artwork.slug, slug)
      });

      let artworkId = existingArtwork ? existingArtwork.id : null;
      let syncStatus = 'pending';
      let spacesKey = null;
      let spacesUrl = null;

      // Download and store the file in DigitalOcean Spaces
      try {
        console.log(`Downloading file: ${file.name} (${file.id})`);
        
        // Get the file content from Google Drive
        const fileContent = await driveService.getFileContent(file.id);
        const buffer = Buffer.from(fileContent);
        
        // Store the file in Spaces
        const storedFile = await storageService.storeFile(
          buffer,
          file.name,
          file.id,
          file.mimeType
        );

        spacesKey = storedFile.key;
        spacesUrl = storedFile.url;
        downloadedFiles.push({
          name: file.name,
          size: storedFile.size,
          url: storedFile.url
        });

        console.log(`Successfully stored: ${storedFile.filename}`);
      } catch (downloadError) {
        console.error(`Failed to download ${file.name}:`, downloadError);
        syncStatus = 'download_failed';
      }

      if (!existingArtwork && spacesUrl) {
        const [newArtwork] = await db.insert(artwork).values({
          slug,
          title: file.name,
          description: `Imported from Google Drive: ${file.name}`,
          type: 'image',
          image: spacesUrl, // Use Spaces URL
          data: JSON.stringify({
            googleDriveFileId: file.id,
            googleDriveFileName: file.name,
            googleDriveFileSize: file.size,
            googleDriveThumbnail: file.thumbnailLink,
            spacesKey,
            spacesUrl,
            importedAt: new Date().toISOString(),
          }),
        }).returning();
        artworkId = newArtwork.id;
        createdArtworks.push(newArtwork);
        syncStatus = spacesUrl ? 'synced' : 'download_failed';
      } else if (existingArtwork) {
        syncStatus = spacesUrl ? 'updated' : 'download_failed';
      }

      // Upsert into google_drive_assets
      const existingAsset = await db.query.googleDriveAssets.findFirst({
        where: eq(googleDriveAssets.file_id, file.id)
      });
      
      if (existingAsset) {
        await db.update(googleDriveAssets)
          .set({
            user_id: user.id,
            folder_id: folderId,
            name: file.name,
            mime_type: file.mimeType,
            size: file.size,
            web_content_link: file.webContentLink,
            thumbnail_link: file.thumbnailLink,
            spaces_key: spacesKey,
            spaces_url: spacesUrl,
            created_time: file.createdTime,
            modified_time: file.modifiedTime,
            sync_status: syncStatus,
            artwork_id: artworkId,
            updated_at: new Date().toISOString(),
          })
          .where(eq(googleDriveAssets.file_id, file.id));
      } else {
        await db.insert(googleDriveAssets).values({
          user_id: user.id,
          file_id: file.id,
          folder_id: folderId,
          name: file.name,
          mime_type: file.mimeType,
          size: file.size,
          web_content_link: file.webContentLink,
          thumbnail_link: file.thumbnailLink,
          spaces_key: spacesKey,
          spaces_url: spacesUrl,
          created_time: file.createdTime,
          modified_time: file.modifiedTime,
          sync_status: syncStatus,
          artwork_id: artworkId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Update user's sync settings
    await db.update(users)
      .set({
        google_drive_folder_id: folderId,
        google_drive_sync_enabled: 1,
        last_sync_at: new Date().toISOString(),
      })
      .where(eq(users.id, user.id));

    res.status(200).json({
      message: 'Sync completed',
      filesProcessed: imageFiles.length,
      filesDownloaded: downloadedFiles.length,
      artworksCreated: createdArtworks.length,
      artworks: createdArtworks,
      downloadedFiles,
    });

  } catch (error) {
    console.error('Error syncing folder:', error);
    res.status(500).json({ message: 'Failed to sync folder' });
  }
} 