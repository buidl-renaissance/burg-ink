import { inngest } from "@/lib/inngest";
import { storageService } from "@/lib/storage";
import { processImageSizes } from "@/lib/imageProcessor";
import { db } from "../../../db";
import { media } from "../../../db/schema";
import { eq } from "drizzle-orm";

/**
 * IMAGE PROCESSING INNGEST FUNCTIONS
 * 
 * This file contains Inngest functions for processing images with Sharp:
 * - Resize images to multiple sizes (original, medium 800px, thumbnail 200px)
 * - Store images in organized directory structure (/original/, /medium/, /thumb/)
 * - Update database with new URLs and metadata
 * - Trigger AI analysis for completed images
 * 
 * CONCURRENCY SETTINGS:
 * - All functions are configured with a concurrency limit of 4 for image processing
 * - This prevents overwhelming the system during intensive image operations
 * 
 * USAGE EXAMPLES:
 * 
 * 1. Process and resize a media record:
 *    await inngest.send({
 *      name: "media.resize.process",
 *      data: { mediaId: 123 }
 *    });
 * 
 * 2. Process resizing for a buffer with metadata:
 *    await inngest.send({
 *      name: "media.resize.from-buffer",
 *      data: { 
 *        buffer: imageBuffer,
 *        originalName: "image.jpg",
 *        fileId: "unique-id",
 *        mimeType: "image/jpeg",
 *        mediaId: 123
 *      }
 *    });
 * 
 * 3. Batch resize multiple media records:
 *    await inngest.send({
 *      name: "media.resize.batch",
 *      data: { mediaIds: [1, 2, 3] }
 *    });
 */

export interface ProcessMediaResizePayload {
  mediaId: string;
}

export interface ProcessNewUploadResizePayload {
  originalName: string;
  fileId: string;
  mimeType: string;
  mediaId: string;
  originalUrl: string; // URL to download the original image
}

export interface ProcessBatchResizePayload {
  mediaIds: string[];
}

/**
 * Process and resize an existing media record
 */
export const processMediaResize = inngest.createFunction(
  { 
    id: "process-media-resize",
    name: "Process Media Resize",
    concurrency: 4
  },
  { event: "media.resize.process" },
  async ({ event, step }) => {
    const { mediaId } = event.data as ProcessMediaResizePayload;

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

    // Check if already processed
    if (mediaRecord.medium_url && mediaRecord.thumbnail_url) {
      console.log(`Media ${mediaId} already has resized versions`);
      return {
        mediaId,
        status: 'already_processed',
        message: 'Media already has resized versions'
      };
    }

    // Download the original image
    const imageBuffer = await step.run("download-original", async () => {
      if (!mediaRecord.original_url) {
        throw new Error(`No original URL found for media ${mediaId}`);
      }

      const response = await fetch(mediaRecord.original_url);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    });

    // Process image sizes
    const processedImages = await step.run("process-sizes", async () => {
      console.log(`Processing image sizes for media: ${mediaRecord.filename} (${mediaId})`);
      const buffer = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from((imageBuffer as { data: number[] }).data);
      return await processImageSizes(buffer);
    });

    // Store resized images
    const storedImages = await step.run("store-images", async () => {
      const originalBuf = Buffer.isBuffer(processedImages.sizes.original) ? processedImages.sizes.original : Buffer.from((processedImages.sizes.original as { data: number[] }).data);
      const mediumBuf = Buffer.isBuffer(processedImages.sizes.medium) ? processedImages.sizes.medium : Buffer.from((processedImages.sizes.medium as { data: number[] }).data);
      const thumbnailBuf = Buffer.isBuffer(processedImages.sizes.thumbnail) ? processedImages.sizes.thumbnail : Buffer.from((processedImages.sizes.thumbnail as { data: number[] }).data);
      
      const imageSizes = {
        original: originalBuf,
        medium: mediumBuf,
        thumbnail: thumbnailBuf,
      };

      return await storageService.storeImageSizes(
        imageSizes,
        mediaRecord.filename ?? 'unknown',
        `${mediaRecord.id}-resized`,
        mediaRecord.mime_type ?? 'image/jpeg'
      );
    });

    // Update media record with new URLs and dimensions
    await step.run("update-media-record", async () => {
      await db.update(media)
        .set({
          original_url: storedImages.original.url,
          medium_url: storedImages.medium.url,
          thumbnail_url: storedImages.thumbnail.url,
          width: processedImages.originalDimensions.width,
          height: processedImages.originalDimensions.height,
        })
        .where(eq(media.id, mediaId));
    });

    // Trigger AI analysis if not already completed
    if (mediaRecord.processing_status === 'pending') {
      await step.run("trigger-ai-analysis", async () => {
        console.log(`Triggering AI analysis for resized media: ${mediaRecord.filename} (${mediaId})`);
        await triggerAIAnalysis(mediaId, storedImages.medium.url, mediaRecord.filename ?? undefined, mediaRecord.mime_type ?? undefined);
      });
    }

    return {
      mediaId,
      filename: mediaRecord.filename,
      storedImages,
      status: 'success',
      message: 'Image resizing completed successfully'
    };
  }
);

/**
 * Process and resize for a new upload (downloads from URL)
 */
export const processNewUploadResize = inngest.createFunction(
  { 
    id: "process-new-upload-resize",
    name: "Process New Upload Resize",
    concurrency: 4
  },
  { event: "media.resize.new-upload" },
  async ({ event, step }) => {
    const { originalName, fileId, mimeType, mediaId, originalUrl } = event.data as ProcessNewUploadResizePayload;

    // Download the original image
    const imageBuffer = await step.run("download-original", async () => {
      const response = await fetch(originalUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      return Buffer.from(await response.arrayBuffer());
    });

    // Process image sizes
    const processedImages = await step.run("process-sizes", async () => {
      console.log(`Processing image sizes for new upload: ${originalName}`);
      const buffer = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from((imageBuffer as { data: number[] }).data);
      return await processImageSizes(buffer);
    });

    // Store resized images
    const storedImages = await step.run("store-images", async () => {
      const originalBuf = Buffer.isBuffer(processedImages.sizes.original) ? processedImages.sizes.original : Buffer.from((processedImages.sizes.original as { data: number[] }).data);
      const mediumBuf = Buffer.isBuffer(processedImages.sizes.medium) ? processedImages.sizes.medium : Buffer.from((processedImages.sizes.medium as { data: number[] }).data);
      const thumbnailBuf = Buffer.isBuffer(processedImages.sizes.thumbnail) ? processedImages.sizes.thumbnail : Buffer.from((processedImages.sizes.thumbnail as { data: number[] }).data);
      
      const imageSizes = {
        original: originalBuf,
        medium: mediumBuf,
        thumbnail: thumbnailBuf,
      };

      return await storageService.storeImageSizes(
        imageSizes,
        originalName,
        fileId,
        mimeType
      );
    });

    // Update media record with URLs and dimensions
    await step.run("update-media-record", async () => {
      await db.update(media)
        .set({
          original_url: storedImages.original.url,
          medium_url: storedImages.medium.url,
          thumbnail_url: storedImages.thumbnail.url,
          width: processedImages.originalDimensions.width,
          height: processedImages.originalDimensions.height,
        })
        .where(eq(media.id, mediaId));
    });

    // Trigger AI analysis
    await step.run("trigger-ai-analysis", async () => {
      console.log(`Triggering AI analysis for new upload: ${originalName} (${mediaId})`);
      await triggerAIAnalysis(mediaId, storedImages.medium.url, originalName, mimeType);
    });

    return {
      mediaId,
      filename: originalName,
      storedImages,
      status: 'success',
      message: 'Image processing completed successfully'
    };
  }
);

/**
 * Batch process multiple media records for resizing
 */
export const processBatchResize = inngest.createFunction(
  { 
    id: "process-batch-resize",
    name: "Process Batch Resize",
    concurrency: 4
  },
  { event: "media.resize.batch" },
  async ({ event, step }) => {
    const { mediaIds } = event.data as ProcessBatchResizePayload;

    // Get media records that need resizing
    const mediaRecords = await step.run("get-media-records", async () => {
      const records = await db.query.media.findMany();
      
      const filteredRecords = mediaIds.length > 0 
        ? records.filter(r => mediaIds.includes(r.id))
        : records.filter(r => !r.medium_url || !r.thumbnail_url);
      
      return filteredRecords.filter(r => r.original_url);
    });

    // Trigger individual resize jobs
    const resizePromises = await step.run("trigger-resize-jobs", async () => {
      const promises = mediaRecords.map(record => 
        triggerMediaResize(record.id)
      );
      
      console.log(`Triggered ${promises.length} resize jobs`);
      return promises;
    });

    return {
      message: 'Batch resize processing initiated',
      mediaRecordsFound: mediaRecords.length,
      resizeJobsTriggered: resizePromises.length,
      note: 'Individual resizing will happen in parallel with concurrency limit of 4'
    };
  }
);

/**
 * Utility function to trigger media resize
 */
export const triggerMediaResize = async (mediaId: string) => {
  return await inngest.send({
    name: "media.resize.process",
    data: { mediaId }
  });
};

/**
 * Utility function to trigger new upload resize
 */
export const triggerNewUploadResize = async (
  originalName: string,
  fileId: string,
  mimeType: string,
  mediaId: string,
  originalUrl: string
) => {
  return await inngest.send({
    name: "media.resize.new-upload",
    data: {
      originalName,
      fileId,
      mimeType,
      mediaId,
      originalUrl
    }
  });
};

/**
 * Utility function to trigger AI analysis
 */
export const triggerAIAnalysis = async (mediaId: string, imageUrl: string, filename?: string, mimeType?: string) => {
  return await inngest.send({
    name: "media.analyze",
    data: {
      mediaId,
      imageUrl,
      filename: filename || 'unknown',
      mimeType: mimeType || 'image/jpeg'
    }
  });
}; 