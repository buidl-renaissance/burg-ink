import sharp from 'sharp';

export interface ImageSizes {
  original: Buffer;
  medium: Buffer;
  thumbnail: Buffer;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ProcessedImageInfo {
  sizes: ImageSizes;
  originalDimensions: ImageDimensions;
  mediumDimensions: ImageDimensions;
  thumbnailDimensions: ImageDimensions;
  format: string;
}

/**
 * Process an image buffer into multiple sizes
 */
export async function processImageSizes(imageBuffer: Buffer): Promise<ProcessedImageInfo> {
  try {
    // Get original image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const originalFormat = (metadata.format as string) || 'jpeg';
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    // Check if this is a HEIC/HEIF image and needs conversion
    const isHeic = originalFormat === 'heic' || originalFormat === 'heif';
    
    // Create Sharp instance for processing
    // If HEIC, convert to JPEG; otherwise use as-is
    let image = sharp(imageBuffer);
    if (isHeic) {
      // Convert HEIC to JPEG for compatibility
      image = image.jpeg({ quality: 95 });
    }
    
    const format = isHeic ? 'jpeg' : originalFormat;

    // Generate medium size (800px width, maintaining aspect ratio)
    let mediumProcessor = image
      .clone()
      .resize(800, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    
    // Convert to JPEG output (always JPEG if HEIC was converted, or if original format is JPEG)
    if (isHeic || format === 'jpeg') {
      mediumProcessor = mediumProcessor.jpeg({ quality: 85 });
    } else if (format === 'png') {
      mediumProcessor = mediumProcessor.png();
    } else if (format === 'webp') {
      mediumProcessor = mediumProcessor.webp({ quality: 85 });
    }
    const mediumBuffer = await mediumProcessor.toBuffer();

    // Get medium dimensions
    const mediumMetadata = await sharp(mediumBuffer).metadata();
    const mediumWidth = mediumMetadata.width || 0;
    const mediumHeight = mediumMetadata.height || 0;

    // Generate thumbnail (200px width, maintaining aspect ratio)
    let thumbnailProcessor = image
      .clone()
      .resize(200, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    
    // Convert to JPEG output (always JPEG if HEIC was converted, or if original format is JPEG)
    if (isHeic || format === 'jpeg') {
      thumbnailProcessor = thumbnailProcessor.jpeg({ quality: 80 });
    } else if (format === 'png') {
      thumbnailProcessor = thumbnailProcessor.png();
    } else if (format === 'webp') {
      thumbnailProcessor = thumbnailProcessor.webp({ quality: 80 });
    }
    const thumbnailBuffer = await thumbnailProcessor.toBuffer();

    // Get thumbnail dimensions
    const thumbnailMetadata = await sharp(thumbnailBuffer).metadata();
    const thumbnailWidth = thumbnailMetadata.width || 0;
    const thumbnailHeight = thumbnailMetadata.height || 0;

    // Convert original to JPEG if it was HEIC
    let originalBuffer = imageBuffer;
    if (isHeic) {
      // Use a fresh Sharp instance to convert the original HEIC to JPEG
      originalBuffer = await sharp(imageBuffer).jpeg({ quality: 95 }).toBuffer();
    }
    
    return {
      sizes: {
        original: originalBuffer,
        medium: mediumBuffer,
        thumbnail: thumbnailBuffer,
      },
      originalDimensions: {
        width: originalWidth,
        height: originalHeight,
      },
      mediumDimensions: {
        width: mediumWidth,
        height: mediumHeight,
      },
      thumbnailDimensions: {
        width: thumbnailWidth,
        height: thumbnailHeight,
      },
      format,
    };
  } catch (error) {
    console.error('Error processing image sizes:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate optimized image for a specific size
 */
export async function resizeImage(
  imageBuffer: Buffer,
  width: number,
  height?: number,
  quality: number = 85
): Promise<Buffer> {
  try {
    let processor = sharp(imageBuffer)
      .resize(width, height, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    
    // Convert to JPEG (necessary for HEIC, good default for others)
    processor = processor.jpeg({ quality });
    
    return await processor.toBuffer();
  } catch (error) {
    console.error('Error resizing image:', error);
    throw new Error(`Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract image metadata
 */
export async function getImageMetadata(imageBuffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: imageBuffer.length,
    };
  } catch (error) {
    console.error('Error extracting image metadata:', error);
    throw new Error(`Failed to extract image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 