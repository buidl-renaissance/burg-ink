import { inngest } from '@/lib/inngest';
import { db } from '../../../db';
import { media } from '../../../db/schema';
import { uploadFile, getFileKey } from '@/lib/storage/index';
import { generateResizedVersions, getFileExtension } from '@/lib/storage/resize';
import { eq } from 'drizzle-orm';
import { analyzeMediaImage } from '@/lib/ai';

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

    // Run AI analysis on the original image
    const aiAnalysis = await step.run('ai-analysis', async () => {
      console.log(`Running AI analysis for ${mediaId}`);
      
      try {
        const analysis = await analyzeMediaImage(originalUrl);
        console.log(`AI analysis completed:`, analysis);
        return analysis;
      } catch (error) {
        console.error(`AI analysis failed for ${mediaId}:`, error);
        // Return fallback values if analysis fails
        return {
          tags: ['image', 'media'],
          title: 'Uploaded Image',
          description: 'Image uploaded to media manager',
          altText: 'Uploaded image',
        };
      }
    });

    // Update database record with resized versions and AI analysis
    await step.run('update-database', async () => {
      console.log(`Updating database record for ${mediaId}`);
      console.log(`Medium URL: ${result.mediumUrl}`);
      console.log(`Thumbnail URL: ${result.thumbnailUrl}`);
      console.log(`AI Analysis:`, aiAnalysis);
      
      try {
        // First verify the record exists
        const existingRecord = await db.query.media.findFirst({
          where: eq(media.id, mediaId)
        });
        
        if (!existingRecord) {
          throw new Error(`Media record ${mediaId} not found in database`);
        }
        
        console.log(`Found existing record:`, {
          id: existingRecord.id,
          processing_status: existingRecord.processing_status,
          medium_url: existingRecord.medium_url,
          thumbnail_url: existingRecord.thumbnail_url
        });
        
        // Update the record with resized versions and AI analysis
        await db
          .update(media)
          .set({
            medium_url: result.mediumUrl,
            thumbnail_url: result.thumbnailUrl,
            processing_status: 'completed',
            tags: JSON.stringify(aiAnalysis.tags),
            title: aiAnalysis.title,
            description: aiAnalysis.description,
            alt_text: aiAnalysis.altText,
          })
          .where(eq(media.id, mediaId));
        
        // Verify the update worked
        const updatedRecord = await db.query.media.findFirst({
          where: eq(media.id, mediaId)
        });
        
        console.log(`Updated record:`, {
          id: updatedRecord?.id,
          processing_status: updatedRecord?.processing_status,
          medium_url: updatedRecord?.medium_url,
          thumbnail_url: updatedRecord?.thumbnail_url,
          title: updatedRecord?.title,
          tags: updatedRecord?.tags
        });
        
        console.log(`Successfully updated database for ${mediaId}`);
      } catch (error) {
        console.error(`Failed to update database for ${mediaId}:`, error);
        throw error;
      }
    });

    return {
      success: true,
      mediaId,
      urls: {
        mediumUrl: result.mediumUrl,
        thumbnailUrl: result.thumbnailUrl,
      },
      aiAnalysis,
    };
  }
);
