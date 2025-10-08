import { inngest } from '@/lib/inngest';
import { db } from '../../../db';
import { media } from '../../../db/schema';
import { uploadFile, getFileKey } from '@/lib/storage/index';
import { generateResizedVersions, getFileExtension } from '@/lib/storage/resize';
import { eq } from 'drizzle-orm';

export const processMediaUpload = inngest.createFunction(
  { id: 'process-media-upload' },
  { event: 'media/process' },
  async ({ event, step }) => {
    const { mediaId, originalUrl, filename, mimetype } = event.data;
    const fileExtension = getFileExtension(filename);

    // Process everything in a single step to avoid large data serialization
    const result = await step.run('process-media', async () => {
      console.log(`Processing media ${mediaId}`);
      
      // Download the original file
      console.log(`Downloading original file from ${originalUrl}`);
      const response = await fetch(originalUrl);
      if (!response.ok) {
        throw new Error(`Failed to download original file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generate resized versions
      console.log(`Generating resized versions for ${mediaId}`);
      const { medium, thumb } = await generateResizedVersions(buffer);

      // Upload resized versions
      console.log(`Uploading resized versions for ${mediaId}`);
      const [mediumUpload, thumbUpload] = await Promise.all([
        uploadFile(
          medium,
          getFileKey(mediaId, 'medium', fileExtension),
          mimetype
        ),
        uploadFile(
          thumb,
          getFileKey(mediaId, 'thumb', fileExtension),
          mimetype
        ),
      ]);

      return {
        mediumUrl: mediumUpload.url,
        thumbnailUrl: thumbUpload.url,
      };
    });

    // Update database record with resized versions
    await step.run('update-database', async () => {
      console.log(`Updating database record for ${mediaId}`);
      await db
        .update(media)
        .set({
          medium_url: result.mediumUrl,
          thumbnail_url: result.thumbnailUrl,
          processing_status: 'completed',
        })
        .where(eq(media.id, mediaId));
    });

    // TODO: Add AI analysis if needed
    // await step.run('trigger-ai-analysis', async () => {
    //   await inngest.send({
    //     name: 'media/analyze',
    //     data: {
    //       mediaId,
    //       originalUrl,
    //     },
    //   });
    // });

    return {
      success: true,
      mediaId,
      urls: {
        mediumUrl: result.mediumUrl,
        thumbnailUrl: result.thumbnailUrl,
      },
    };
  }
);
