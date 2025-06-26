import { inngest } from "@/lib/inngest";
import { GoogleDriveService, DriveFile } from "@/lib/googleDrive";
import { storageService } from "@/lib/storage";
import { analyzeImage } from "@/lib/ai";
import { db } from "../../../db";
import { users, media, googleDriveAssets } from "../../../db/schema";
import { eq } from "drizzle-orm";

// Define the event payload type
interface ProcessGoogleImagesPayload {
  userId: number;
  folderId: string;
  accessToken: string;
}

// Create the Inngest function
export const processGoogleImages = inngest.createFunction(
  { 
    id: "process-google-images",
    name: "Process Google Images" 
  },
  { event: "google.images.process" },
  async ({ event, step }) => {
    const { userId, folderId, accessToken } = event.data as ProcessGoogleImagesPayload;

    // Step 1: Verify user exists
    await step.run("verify-user", async () => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      
      return user;
    });

    // Step 2: Initialize Google Drive service and list files
    const files = await step.run("list-files", async () => {
      const driveService = new GoogleDriveService(accessToken);
      const driveFiles = await driveService.listFilesInFolder(folderId);
      
      // Filter for image files only
      const imageFiles = driveFiles.filter((file: DriveFile) => 
        file.mimeType.startsWith('image/')
      );
      
      console.log(`Found ${imageFiles.length} image files in folder ${folderId}`);
      return { files: imageFiles, driveService };
    });

    // Step 3: Download and store files in media table
    const mediaRecords = await step.run("store-media", async () => {
      const driveService = new GoogleDriveService(accessToken);
      const createdMedia = [];
      const errors = [];

      for (const file of files.files) {
        try {
          // Check if media already exists
          const existingMedia = await db.query.media.findFirst({
            where: eq(media.source_id, file.id)
          });

          if (existingMedia) {
            console.log(`Media already exists for file: ${file.name}`);
            createdMedia.push(existingMedia);
            continue;
          }

          // Download and store the file in DigitalOcean Spaces
          console.log(`Processing file: ${file.name} (${file.id})`);
          
          const fileContent = await driveService.getFileContent(file.id);
          const buffer = Buffer.from(fileContent);
          
          const storedFile = await storageService.storeFile(
            buffer,
            file.name,
            file.id,
            file.mimeType
          );

          // Create media record
          const [newMedia] = await db.insert(media).values({
            user_id: userId,
            source: 'google_drive',
            source_id: file.id,
            filename: file.name,
            mime_type: file.mimeType,
            size: parseInt(file.size || '0'),
            spaces_key: storedFile.key,
            spaces_url: storedFile.url,
            thumbnail_url: file.thumbnailLink,
            processing_status: 'pending',
            metadata: JSON.stringify({
              googleDriveFileId: file.id,
              googleDriveFileName: file.name,
              googleDriveFileSize: file.size,
              googleDriveThumbnail: file.thumbnailLink,
              spacesKey: storedFile.key,
              spacesUrl: storedFile.url,
              importedAt: new Date().toISOString(),
              processedBy: 'inngest',
            }),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).returning();

          createdMedia.push(newMedia);

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

      return { createdMedia, errors };
    });

    // Step 4: Analyze media with AI
    const analysisResults = await step.run("analyze-media", async () => {
      const results = [];
      const errors = [];

      for (const mediaRecord of mediaRecords.createdMedia) {
        try {
          if (!mediaRecord.spaces_url) {
            console.log(`No spaces URL for media ${mediaRecord.id}, skipping analysis`);
            continue;
          }

          console.log(`Analyzing media: ${mediaRecord.filename} (${mediaRecord.id})`);

          // Update status to processing
          await db.update(media)
            .set({
              processing_status: 'processing',
              updated_at: new Date().toISOString(),
            })
            .where(eq(media.id, mediaRecord.id));

          // Analyze with AI
          const analysis = await analyzeImage(mediaRecord.spaces_url);

          // Update media record with analysis results
          await db.update(media)
            .set({
              processing_status: 'completed',
              ai_analysis: JSON.stringify(analysis),
              tags: JSON.stringify(analysis.tags),
              description: analysis.description,
              processed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
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
              updated_at: new Date().toISOString(),
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
      mediaCreated: mediaRecords.createdMedia.length,
      mediaAnalyzed: analysisResults.results.length,
      mediaWithErrors: mediaRecords.errors.length + analysisResults.errors.length,
      analysisResults: analysisResults.results,
      errors: [...mediaRecords.errors, ...analysisResults.errors],
    };
  }
); 