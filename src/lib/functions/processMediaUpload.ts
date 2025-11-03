import { inngest } from '@/lib/inngest';
import { db } from '../../../db';
import { media } from '../../../db/schema';
import { uploadFile, getFileKey } from '@/lib/storage/index';
import { generateResizedVersions, getFileExtension } from '@/lib/storage/resize';
import { eq } from 'drizzle-orm';
import { analyzeMediaImage, classifyMediaImage } from '@/lib/ai';
import { WorkflowEngine } from '@/lib/workflows/engine';
import sharp from 'sharp';
import convert from 'heic-convert';

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
    console.log('Converting HEIC/HEIF to JPEG...');
    const outputBuffer = await convert({
      buffer,
      format: 'JPEG',
      quality: 0.95
    });
    return Buffer.from(outputBuffer);
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    throw new Error(`Failed to convert HEIC to JPEG: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const processMediaUpload = inngest.createFunction(
  { id: 'process-media-upload' },
  { event: 'media/process' },
  async ({ event, step }) => {
    const { mediaId, originalUrl, filename, mimetype } = event.data;
    const fileExtension = getFileExtension(filename);
    
    try {
      // Update status to processing at the start
      await step.run('update-status-processing', async () => {
        await db.update(media)
          .set({
            processing_status: 'processing',
          })
          .where(eq(media.id, mediaId));
        console.log(`Started processing media ${mediaId}`);
      });

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
      let buffer = Buffer.from(arrayBuffer);

      // Extract dimensions from the original image
      console.log(`Extracting dimensions for ${mediaId}`);
      
      // Check and convert HEIC if needed for metadata extraction
      let isHeic = false;
      let processedBuffer = buffer;
      
      if (isHeicFile(buffer)) {
        isHeic = true;
        processedBuffer = await convertHeicToJpeg(buffer);
      } else {
        // Try Sharp metadata extraction
        try {
          const testMetadata = await sharp(buffer).metadata();
          const testFormat = (testMetadata.format as string) || '';
          if (testFormat === 'heic' || testFormat === 'heif') {
            isHeic = true;
            processedBuffer = await convertHeicToJpeg(buffer);
          }
        } catch (sharpError) {
          // If Sharp fails with HEIC error, try conversion
          const errorMsg = sharpError instanceof Error ? sharpError.message : String(sharpError);
          if (errorMsg.includes('heif') || errorMsg.includes('heic') || errorMsg.includes('11.6003')) {
            console.log('Detected HEIC file from Sharp error, attempting conversion...');
            isHeic = true;
            processedBuffer = await convertHeicToJpeg(buffer);
          } else {
            throw sharpError;
          }
        }
      }
      
      // Now get metadata from the processed buffer
      const metadata = await sharp(processedBuffer).metadata();
      const dimensions = {
        width: metadata.width || null,
        height: metadata.height || null,
      };
      const format = isHeic ? 'heic' : ((metadata.format as string) || 'unknown');
      console.log(`Original dimensions: ${dimensions.width}x${dimensions.height}, format: ${format}${isHeic ? ' (will convert to JPEG)' : ''}`);

      // Generate resized versions (HEIC will be converted to JPEG during processing)
      // Note: Use original buffer, not processed, because generateResizedVersions has its own HEIC handling
      console.log(`Generating resized versions for ${mediaId}`);
      const { medium, thumb } = await generateResizedVersions(buffer);

      // Upload resized versions
      // Note: If original was HEIC, resized versions are now JPEG
      const processedMimeType = isHeic ? 'image/jpeg' : mimetype;
      console.log(`Uploading resized versions for ${mediaId}`);
      const [mediumUpload, thumbUpload] = await Promise.all([
        uploadFile(
          medium,
          getFileKey(mediaId, 'medium', fileExtension),
          processedMimeType
        ),
        uploadFile(
          thumb,
          getFileKey(mediaId, 'thumb', fileExtension),
          processedMimeType
        ),
      ]);

      return {
        mediumUrl: mediumUpload.url,
        thumbnailUrl: thumbUpload.url,
        width: dimensions.width,
        height: dimensions.height,
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

    // Run media classification on the original image
    const mediaClassification = await step.run('media-classification', async () => {
      console.log(`Running media classification for ${mediaId}`);
      
      try {
        const classification = await classifyMediaImage(originalUrl);
        console.log(`Media classification completed:`, classification);
        return classification;
      } catch (error) {
        console.error(`Media classification failed for ${mediaId}:`, error);
        // Return fallback values if classification fails
        return {
          detectedType: 'unknown' as const,
          confidence: 0.0,
          detections: {
            tattoo: { score: 0.0, reasoning: 'Classification failed' },
            artwork: { score: 0.0, reasoning: 'Classification failed' }
          },
          suggestedTags: ['image', 'unknown'],
        };
      }
    });

    // Update database record with resized versions, AI analysis, and classification
    await step.run('update-database', async () => {
      console.log(`Updating database record for ${mediaId}`);
      console.log(`Medium URL: ${result.mediumUrl}`);
      console.log(`Thumbnail URL: ${result.thumbnailUrl}`);
      console.log(`AI Analysis:`, aiAnalysis);
      console.log(`Media Classification:`, mediaClassification);
      
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
        
        // Combine AI tags with classification suggested tags
        const allTags = [...new Set([...aiAnalysis.tags, ...mediaClassification.suggestedTags])];
        
        // Update the record with resized versions, dimensions, AI analysis, and classification
        await db
          .update(media)
          .set({
            medium_url: result.mediumUrl,
            thumbnail_url: result.thumbnailUrl,
            width: result.width,
            height: result.height,
            processing_status: 'completed',
            tags: JSON.stringify(allTags),
            title: aiAnalysis.title,
            description: aiAnalysis.description,
            alt_text: aiAnalysis.altText,
            detected_type: mediaClassification.detectedType,
            detection_confidence: mediaClassification.confidence.toString(),
            detections: JSON.stringify(mediaClassification.detections),
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
          tags: updatedRecord?.tags,
          detected_type: updatedRecord?.detected_type,
          detection_confidence: updatedRecord?.detection_confidence
        });
        
        console.log(`Successfully updated database for ${mediaId}`);
      } catch (error) {
        console.error(`Failed to update database for ${mediaId}:`, error);
        throw error;
      }
    });

    // Evaluate workflow rules after classification
    const workflowExecutions = await step.run('evaluate-workflows', async () => {
      console.log(`Evaluating workflow rules for ${mediaId}`);
      
      try {
        // Get the updated media record for workflow context
        const mediaRecord = await db.query.media.findFirst({
          where: eq(media.id, mediaId)
        });
        
        if (!mediaRecord) {
          throw new Error(`Media record ${mediaId} not found for workflow evaluation`);
        }
        
        // Create workflow context
        const context = {
          media: mediaRecord,
          classification: mediaClassification,
          trigger: 'on_upload'
        };
        
        // Evaluate workflow rules
        const executions = await WorkflowEngine.evaluateRules('on_upload', context);
        
        console.log(`Workflow evaluation completed for ${mediaId}:`, executions);
        
        return executions;
      } catch (error) {
        console.error(`Workflow evaluation failed for ${mediaId}:`, error);
        // Don't fail the entire process if workflow evaluation fails
        return [];
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
        mediaClassification,
        workflowExecutions,
      };
    } catch (error) {
      // Handle any errors and update status to failed
      console.error(`Media processing failed for ${mediaId}:`, error);
      
      await step.run('update-status-failed', async () => {
        await db.update(media)
          .set({
            processing_status: 'failed',
          })
          .where(eq(media.id, mediaId));
      });
      
      throw error; // Re-throw to mark the function as failed
    }
  }
);
