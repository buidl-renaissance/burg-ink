import { inngest } from "@/lib/inngest";
import { GoogleDriveService, DriveFile } from "@/lib/googleDrive";
import { storageService } from "@/lib/storage";
import { analyzeImage } from "@/lib/ai";
import { db } from "../../../db";
import { users, media, googleDriveAssets } from "../../../db/schema";
import { eq } from "drizzle-orm";

/**
 * MODULAR INNGEST FUNCTIONS FOR MEDIA PROCESSING
 * 
 * This file contains a modular system for processing media files from various sources.
 * Each function can be used independently or as part of a larger workflow.
 * 
 * CONCURRENCY SETTINGS:
 * - All functions are configured with a concurrency limit of 6
 * - This prevents overwhelming the system while maintaining good performance
 * - Can be adjusted based on server capacity and requirements
 * 
 * AUTOMATIC AI ANALYSIS:
 * - File processing automatically triggers AI analysis upon completion
 * - Existing files with 'pending' status will also trigger analysis
 * - No manual intervention required for the complete workflow
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Process Google Drive images in parallel (recommended):
 *    await inngest.send({
 *      name: "google.images.process.parallel",
 *      data: { userId, folderId, accessToken }
 *    });
 * 
 * 2. Process Google Drive images sequentially (original method):
 *    await inngest.send({
 *      name: "google.images.process",
 *      data: { userId, folderId, accessToken }
 *    });
 * 
 * 3. Process a single file:
 *    await inngest.send({
 *      name: "file.process",
 *      data: { userId, fileId, fileName, fileMimeType, ... }
 *    });
 * 
 * 4. Analyze a single media record:
 *    await inngest.send({
 *      name: "media.analyze",
 *      data: { mediaId, imageUrl }
 *    });
 * 
 * 5. Analyze multiple media records in batch:
 *    await inngest.send({
 *      name: "media.analyze.batch",
 *      data: { mediaIds: [1, 2, 3] } // or empty array for all pending
 *    });
 * 
 * 6. List files from Google Drive:
 *    await inngest.send({
 *      name: "google.drive.list-files",
 *      data: { folderId, accessToken }
 *    });
 * 
 * 7. Verify user exists:
 *    await inngest.send({
 *      name: "user.verify",
 *      data: { userId }
 *    });
 * 
 * 8. Update user sync settings:
 *    await inngest.send({
 *      name: "user.update-sync-settings",
 *      data: { userId, folderId }
 *    });
 * 
 * BENEFITS:
 * - Each step can be processed independently
 * - Better error isolation (one file failing doesn't stop others)
 * - Parallel processing for better performance (max 6 concurrent)
 * - Automatic AI analysis triggering
 * - Reusable functions for different sources (not just Google Drive)
 * - Better monitoring and debugging per step
 * - Can retry individual steps without reprocessing everything
 * - Controlled concurrency prevents system overload
 */

// Define the event payload types
interface ProcessGoogleImagesPayload {
  userId: number;
  folderId: string;
  accessToken: string;
}

interface ProcessSingleFilePayload {
  userId: number;
  fileId: string;
  fileName: string;
  fileMimeType: string;
  fileSize: string;
  fileThumbnailLink: string;
  fileWebContentLink: string;
  fileCreatedTime: string;
  fileModifiedTime: string;
  folderId: string;
  accessToken: string;
}

interface AnalyzeMediaPayload {
  mediaId: string;
  imageUrl: string;
}

// Step 1: Verify user exists
export const verifyUser = inngest.createFunction(
  { 
    id: "verify-user",
    name: "Verify User",
    concurrency: 6
  },
  { event: "user.verify" },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: number };

    const user = await step.run("check-user", async () => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      
      return user;
    });

    return { user };
  }
);

// Step 2: List files from Google Drive folder
export const listGoogleDriveFiles = inngest.createFunction(
  { 
    id: "list-google-drive-files",
    name: "List Google Drive Files",
    concurrency: 6
  },
  { event: "google.drive.list-files" },
  async ({ event, step }) => {
    const { folderId, accessToken } = event.data as { folderId: string; accessToken: string };

    const files = await step.run("list-files", async () => {
      const driveService = new GoogleDriveService(accessToken);
      const driveFiles = await driveService.listFilesInFolder(folderId);
      
      // Filter for image files only
      const imageFiles = driveFiles.filter((file: DriveFile) => 
        file.mimeType.startsWith('image/')
      );
      
      console.log(`Found ${imageFiles.length} image files in folder ${folderId}`);
      return imageFiles;
    });

    return { files };
  }
);

// Step 3: Process a single file (download, store, create media record)
export const processSingleFile = inngest.createFunction(
  { 
    id: "process-single-file",
    name: "Process Single File",
    concurrency: 6
  },
  { event: "file.process" },
  async ({ event, step }) => {
    const payload = event.data as ProcessSingleFilePayload;
    const { 
      userId, 
      fileId, 
      fileName, 
      fileMimeType, 
      fileSize, 
      fileThumbnailLink, 
      fileWebContentLink, 
      fileCreatedTime, 
      fileModifiedTime, 
      folderId, 
      accessToken 
    } = payload;

    // Check if media already exists
    const existingMedia = await step.run("check-existing", async () => {
      const existing = await db.query.media.findFirst({
        where: eq(media.source_id, fileId)
      });
      
      if (existing) {
        console.log(`Media already exists for file: ${fileName}`);
        return existing;
      }
      
      return null;
    });

    if (existingMedia) {
      // If media exists but hasn't been analyzed, trigger analysis
      if (existingMedia.processing_status === 'pending' && existingMedia.original_url) {
        await step.run("trigger-analysis-for-existing", async () => {
          await triggerMediaAnalysis(existingMedia.id, existingMedia.original_url!);
        });
      }
      
      return { 
        media: existingMedia, 
        status: 'already_exists',
        message: `Media already exists for file: ${fileName}`
      };
    }

    // Download and store the file
    const storedFile = await step.run("download-and-store", async () => {
      console.log(`Processing file: ${fileName} (${fileId})`);
      
      const driveService = new GoogleDriveService(accessToken);
      const fileContent = await driveService.getFileContent(fileId);
      const buffer = Buffer.from(fileContent);
      
      const stored = await storageService.storeFile(
        buffer,
        fileName,
        fileId,
        fileMimeType
      );
      
      return stored;
    });

    // Create media record
    const newMedia = await step.run("create-media-record", async () => {
      const mediaId = crypto.randomUUID();
      const [mediaRecord] = await db.insert(media).values({
        id: mediaId,
        user_id: userId,
        source: 'google_drive',
        source_id: fileId,
        filename: fileName,
        mime_type: fileMimeType,
        size: parseInt(fileSize || '0'),
        original_url: storedFile.url,
        thumbnail_url: fileThumbnailLink,
        processing_status: 'pending',
        tags: JSON.stringify({
          googleDriveFileId: fileId,
          googleDriveFileName: fileName,
          googleDriveFileSize: fileSize,
          googleDriveThumbnail: fileThumbnailLink,
          spacesKey: storedFile.key,
          spacesUrl: storedFile.url,
          importedAt: new Date().toISOString(),
          processedBy: 'inngest',
        }),
        created_at: Math.floor(Date.now() / 1000),
      }).returning();

      return mediaRecord;
    });

    // Update google_drive_assets table
    await step.run("update-drive-assets", async () => {
      const existingAsset = await db.query.googleDriveAssets.findFirst({
        where: eq(googleDriveAssets.file_id, fileId)
      });
      
      if (existingAsset) {
        await db.update(googleDriveAssets)
          .set({
            user_id: userId,
            folder_id: folderId,
            name: fileName,
            mime_type: fileMimeType,
            size: fileSize,
            web_content_link: fileWebContentLink,
            thumbnail_link: fileThumbnailLink,
            spaces_key: storedFile.key,
            spaces_url: storedFile.url,
            created_time: fileCreatedTime,
            modified_time: fileModifiedTime,
            sync_status: 'synced',
            updated_at: new Date().toISOString(),
          })
          .where(eq(googleDriveAssets.file_id, fileId));
      } else {
        await db.insert(googleDriveAssets).values({
          user_id: userId,
          file_id: fileId,
          folder_id: folderId,
          name: fileName,
          mime_type: fileMimeType,
          size: fileSize,
          web_content_link: fileWebContentLink,
          thumbnail_link: fileThumbnailLink,
          spaces_key: storedFile.key,
          spaces_url: storedFile.url,
          created_time: fileCreatedTime,
          modified_time: fileModifiedTime,
          sync_status: 'synced',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    });

    // Trigger AI analysis for the new media
    await step.run("trigger-ai-analysis", async () => {
      if (newMedia.original_url) {
        console.log(`Triggering AI analysis for: ${fileName} (${newMedia.id})`);
        await triggerMediaAnalysis(newMedia.id, newMedia.original_url);
      }
    });

    return { 
      media: newMedia, 
      status: 'created',
      message: `Successfully processed file: ${fileName} and triggered AI analysis`
    };
  }
);

// Step 4: Analyze media with AI
export const analyzeMedia = inngest.createFunction(
  { 
    id: "analyze-media",
    name: "Analyze Media",
    concurrency: 6
  },
  { event: "media.analyze" },
  async ({ event, step }) => {
    const { mediaId } = event.data as AnalyzeMediaPayload;

    // Get media record
    const mediaRecord = await step.run("get-media", async () => {
      const record = await db.query.media.findFirst({
        where: eq(media.id, mediaId)
      });
      
      if (!record) {
        throw new Error(`Media record ${mediaId} not found`);
      }
      
      return record;
    });

    if (!mediaRecord.original_url) {
      throw new Error(`No original URL for media ${mediaId}`);
    }

    // Update status to processing
    await step.run("update-status-processing", async () => {
      await db.update(media)
        .set({
          processing_status: 'processing',
        })
        .where(eq(media.id, mediaId));
    });

    // Analyze with AI
    const analysis = await step.run("analyze-image", async () => {
      console.log(`Analyzing media: ${mediaRecord.filename} (${mediaId})`);
      return await analyzeImage(mediaRecord.original_url!);
    });

    // Update media record with analysis results
    await step.run("update-with-analysis", async () => {
      await db.update(media)
        .set({
          processing_status: 'completed',
          tags: JSON.stringify(analysis.tags),
          description: analysis.description,
        })
        .where(eq(media.id, mediaId));
    });

    return {
      mediaId,
      filename: mediaRecord.filename,
      analysis,
      status: 'success'
    };
  }
);

// Step 5: Update user sync settings
export const updateUserSyncSettings = inngest.createFunction(
  { 
    id: "update-user-sync-settings",
    name: "Update User Sync Settings",
    concurrency: 6
  },
  { event: "user.update-sync-settings" },
  async ({ event, step }) => {
    const { userId, folderId } = event.data as { userId: number; folderId: string };

    await step.run("update-settings", async () => {
      await db.update(users)
        .set({
          google_drive_folder_id: folderId,
          google_drive_sync_enabled: 1,
          last_sync_at: new Date().toISOString(),
        })
        .where(eq(users.id, userId));
    });

    return { 
      message: 'User sync settings updated',
      userId,
      folderId
    };
  }
);

// Main orchestrator function (replaces the original)
export const processGoogleImages = inngest.createFunction(
  { 
    id: "process-google-images",
    name: "Process Google Images",
    concurrency: 6
  },
  { event: "google.images.process" },
  async ({ event, step }) => {
    const { userId, folderId, accessToken } = event.data as ProcessGoogleImagesPayload;

    // Step 1: Verify user
    await step.run("verify-user", async () => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      
      return user;
    });

    // Step 2: List files
    const files = await step.run("list-files", async () => {
      const driveService = new GoogleDriveService(accessToken);
      const driveFiles = await driveService.listFilesInFolder(folderId);
      
      const imageFiles = driveFiles.filter((file: DriveFile) => 
        file.mimeType.startsWith('image/')
      );
      
      console.log(`Found ${imageFiles.length} image files in folder ${folderId}`);
      return imageFiles;
    });

    // Step 3: Process each file individually (this could be parallelized)
    const fileResults = await step.run("process-files", async () => {
      const results = [];
      const errors = [];

      for (const file of files) {
        try {
          // Check if media already exists
          const existingMedia = await db.query.media.findFirst({
            where: eq(media.source_id, file.id)
          });

          if (existingMedia) {
            console.log(`Media already exists for file: ${file.name}`);
            results.push({ media: existingMedia, status: 'already_exists' });
            continue;
          }

          // Download and store the file
          const driveService = new GoogleDriveService(accessToken);
          const fileContent = await driveService.getFileContent(file.id);
          const buffer = Buffer.from(fileContent);
          
          const storedFile = await storageService.storeFile(
            buffer,
            file.name,
            file.id,
            file.mimeType
          );

          // Create media record
          const mediaId = crypto.randomUUID();
          const [newMedia] = await db.insert(media).values({
            id: mediaId,
            user_id: userId,
            source: 'google_drive',
            source_id: file.id,
            filename: file.name,
            mime_type: file.mimeType,
            size: parseInt(file.size || '0'),
            original_url: storedFile.url,
            thumbnail_url: file.thumbnailLink,
            processing_status: 'pending',
            tags: JSON.stringify({
              googleDriveFileId: file.id,
              googleDriveFileName: file.name,
              googleDriveFileSize: file.size,
              googleDriveThumbnail: file.thumbnailLink,
              spacesKey: storedFile.key,
              spacesUrl: storedFile.url,
              importedAt: new Date().toISOString(),
              processedBy: 'inngest',
            }),
            created_at: Math.floor(Date.now() / 1000),
          }).returning();

          results.push({ media: newMedia, status: 'created' });

          // Update google_drive_assets table
          const existingAsset = await db.query.googleDriveAssets.findFirst({
            where: eq(googleDriveAssets.file_id, file.id)
          });
          
          if (existingAsset) {
            await db.update(googleDriveAssets)
              .set({
                user_id: userId,
                folder_id: folderId,
                name: file.name,
                mime_type: file.mimeType,
                size: file.size,
                web_content_link: file.webContentLink,
                thumbnail_link: file.thumbnailLink,
                spaces_key: storedFile.key,
                spaces_url: storedFile.url,
                created_time: file.createdTime,
                modified_time: file.modifiedTime,
                sync_status: 'synced',
                updated_at: new Date().toISOString(),
              })
              .where(eq(googleDriveAssets.file_id, file.id));
          } else {
            await db.insert(googleDriveAssets).values({
              user_id: userId,
              file_id: file.id,
              folder_id: folderId,
              name: file.name,
              mime_type: file.mimeType,
              size: file.size,
              web_content_link: file.webContentLink,
              thumbnail_link: file.thumbnailLink,
              spaces_key: storedFile.key,
              spaces_url: storedFile.url,
              created_time: file.createdTime,
              modified_time: file.modifiedTime,
              sync_status: 'synced',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }

        } catch (error) {
          console.error(`Failed to process ${file.name}:`, error);
          errors.push({
            name: file.name,
            id: file.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return { results, errors };
    });

    // Step 4: Analyze media with AI
    const analysisResults = await step.run("analyze-media", async () => {
      const results = [];
      const errors = [];

      for (const fileResult of fileResults.results) {
        const mediaRecord = fileResult.media;
        
        try {
          if (!mediaRecord.original_url) {
            console.log(`No original URL for media ${mediaRecord.id}, skipping analysis`);
            continue;
          }

          console.log(`Analyzing media: ${mediaRecord.filename} (${mediaRecord.id})`);

          // Update status to processing
          await db.update(media)
            .set({
              processing_status: 'processing',
            })
            .where(eq(media.id, mediaRecord.id));

          // Analyze with AI
          const analysis = await analyzeImage(mediaRecord.original_url);

          // Update media record with analysis results
          await db.update(media)
            .set({
              processing_status: 'completed',
              tags: JSON.stringify(analysis.tags),
              description: analysis.description,
            })
            .where(eq(media.id, mediaRecord.id));

          results.push({
            mediaId: mediaRecord.id,
            filename: mediaRecord.filename,
            analysis,
            status: 'success'
          });

        } catch (error) {
          console.error(`Failed to analyze ${mediaRecord.filename}:`, error);
          
          // Update status to failed
          await db.update(media)
            .set({
              processing_status: 'failed',
            })
            .where(eq(media.id, mediaRecord.id));

          errors.push({
            mediaId: mediaRecord.id,
            filename: mediaRecord.filename,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return { results, errors };
    });

    // Step 5: Update user's sync settings
    await step.run("update-sync-settings", async () => {
      await db.update(users)
        .set({
          google_drive_folder_id: folderId,
          google_drive_sync_enabled: 1,
          last_sync_at: new Date().toISOString(),
        })
        .where(eq(users.id, userId));
    });

    return {
      message: 'Google images processing completed',
      mediaCreated: fileResults.results.filter(r => r.status === 'created').length,
      mediaAnalyzed: analysisResults.results.length,
      mediaWithErrors: fileResults.errors.length + analysisResults.errors.length,
      analysisResults: analysisResults.results,
      errors: [...fileResults.errors, ...analysisResults.errors],
    };
  }
);

// Utility functions for triggering individual steps
export const triggerFileProcessing = async (file: DriveFile, userId: number, folderId: string, accessToken: string) => {
  return await inngest.send({
    name: "file.process",
    data: {
      userId,
      fileId: file.id,
      fileName: file.name,
      fileMimeType: file.mimeType,
      fileSize: file.size || '0',
      fileThumbnailLink: file.thumbnailLink || '',
      fileWebContentLink: file.webContentLink || '',
      fileCreatedTime: file.createdTime || '',
      fileModifiedTime: file.modifiedTime || '',
      folderId,
      accessToken,
    },
  });
};

export const triggerMediaAnalysis = async (mediaId: string, imageUrl: string) => {
  return await inngest.send({
    name: "media.analyze",
    data: {
      mediaId,
      imageUrl,
    },
  });
};

// Parallel processing orchestrator
export const processGoogleImagesParallel = inngest.createFunction(
  { 
    id: "process-google-images-parallel",
    name: "Process Google Images (Parallel)",
    concurrency: 6
  },
  { event: "google.images.process.parallel" },
  async ({ event, step }) => {
    const { userId, folderId, accessToken } = event.data as ProcessGoogleImagesPayload;

    // Step 1: Verify user
    await step.run("verify-user", async () => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      
      return user;
    });

    // Step 2: List files
    const files = await step.run("list-files", async () => {
      const driveService = new GoogleDriveService(accessToken);
      const driveFiles = await driveService.listFilesInFolder(folderId);
      
      const imageFiles = driveFiles.filter((file: DriveFile) => 
        file.mimeType.startsWith('image/')
      );
      
      console.log(`Found ${imageFiles.length} image files in folder ${folderId}`);
      return imageFiles;
    });

    // Step 3: Trigger parallel file processing
    const fileProcessingPromises = await step.run("trigger-file-processing", async () => {
      const promises = files.map(file => 
        triggerFileProcessing(file, userId, folderId, accessToken)
      );
      
      console.log(`Triggered ${promises.length} file processing jobs`);
      return promises;
    });

    // Step 4: Update user's sync settings
    await step.run("update-sync-settings", async () => {
      await db.update(users)
        .set({
          google_drive_folder_id: folderId,
          google_drive_sync_enabled: 1,
          last_sync_at: new Date().toISOString(),
        })
        .where(eq(users.id, userId));
    });

    return {
      message: 'Google images parallel processing initiated',
      filesFound: files.length,
      fileProcessingJobsTriggered: fileProcessingPromises.length,
      note: 'Individual file processing and analysis will happen in parallel. Each file will automatically trigger AI analysis after successful processing.'
    };
  }
);

// Batch analysis orchestrator
export const analyzeMediaBatch = inngest.createFunction(
  { 
    id: "analyze-media-batch",
    name: "Analyze Media Batch",
    concurrency: 6
  },
  { event: "media.analyze.batch" },
  async ({ event, step }) => {
    const { mediaIds } = event.data as { mediaIds: string[] };

    // Get media records that need analysis
    const mediaRecords = await step.run("get-pending-media", async () => {
      const records = await db.query.media.findMany({
        where: eq(media.processing_status, 'pending')
      });
      
      // Filter to only requested IDs if provided
      const filteredRecords = mediaIds.length > 0 
        ? records.filter(r => mediaIds.includes(r.id))
        : records;
      
      return filteredRecords.filter(r => r.original_url);
    });

    // Trigger parallel analysis
    const analysisPromises = await step.run("trigger-analysis", async () => {
      const promises = mediaRecords.map(record => 
        triggerMediaAnalysis(record.id, record.original_url!)
      );
      
      console.log(`Triggered ${promises.length} media analysis jobs`);
      return promises;
    });

    return {
      message: 'Media batch analysis initiated',
      mediaRecordsFound: mediaRecords.length,
      analysisJobsTriggered: analysisPromises.length,
      note: 'Individual analysis will happen in parallel with concurrency limit of 6'
    };
  }
);

/**
 * EXAMPLE USAGE SCENARIOS
 * 
 * Here are practical examples of how to use the modular system:
 * 
 * 1. PROCESS A SINGLE FILE FROM ANY SOURCE:
 *    This can be used for files from Google Drive, Dropbox, direct uploads, etc.
 * 
 *    const fileData = {
 *      userId: 123,
 *      fileId: "file_abc123",
 *      fileName: "artwork.jpg",
 *      fileMimeType: "image/jpeg",
 *      fileSize: "1024000",
 *      fileThumbnailLink: "https://...",
 *      fileWebContentLink: "https://...",
 *      fileCreatedTime: "2024-01-01T00:00:00Z",
 *      fileModifiedTime: "2024-01-01T00:00:00Z",
 *      folderId: "folder_xyz",
 *      accessToken: "google_access_token"
 *    };
 * 
 *    await inngest.send({
 *      name: "file.process",
 *      data: fileData
 *    });
 * 
 * 2. ANALYZE A SPECIFIC MEDIA RECORD:
 *    Useful for re-analyzing failed media or updating analysis with new AI models.
 * 
 *    await inngest.send({
 *      name: "media.analyze",
 *      data: {
 *        mediaId: 456,
 *        imageUrl: "https://spaces.example.com/image.jpg"
 *      }
 *    });
 * 
 * 3. BATCH ANALYZE ALL PENDING MEDIA:
 *    Process all media that haven't been analyzed yet.
 * 
 *    await inngest.send({
 *      name: "media.analyze.batch",
 *      data: { mediaIds: [] } // Empty array = all pending
 *    });
 * 
 * 4. BATCH ANALYZE SPECIFIC MEDIA:
 *    Process only specific media records.
 * 
 *    await inngest.send({
 *      name: "media.analyze.batch",
 *      data: { mediaIds: [1, 2, 3, 4, 5] }
 *    });
 * 
 * 5. EXTEND FOR OTHER SOURCES:
 *    Create similar functions for Dropbox, OneDrive, etc.
 * 
 *    // Example for Dropbox
 *    export const processDropboxFile = inngest.createFunction(
 *      { id: "process-dropbox-file", name: "Process Dropbox File" },
 *      { event: "dropbox.file.process" },
 *      async ({ event, step }) => {
 *        // Similar logic but with Dropbox API
 *      }
 *    );
 * 
 * 6. MONITORING AND DEBUGGING:
 *    Each function can be monitored independently in the Inngest dashboard.
 *    Failed functions can be retried without affecting others.
 * 
 * 7. PERFORMANCE OPTIMIZATION:
 *    - Use parallel processing for large folders
 *    - Use sequential processing for small folders or when order matters
 *    - Batch analysis for efficiency
 *    - Individual processing for immediate feedback
 */ 