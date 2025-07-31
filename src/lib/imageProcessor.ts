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
    const format = metadata.format || 'jpeg';
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    // Create Sharp instance for processing
    const image = sharp(imageBuffer);

    // Generate medium size (800px width, maintaining aspect ratio)
    const mediumBuffer = await image
      .clone()
      .resize(800, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Get medium dimensions
    const mediumMetadata = await sharp(mediumBuffer).metadata();
    const mediumWidth = mediumMetadata.width || 0;
    const mediumHeight = mediumMetadata.height || 0;

    // Generate thumbnail (200px width, maintaining aspect ratio)
    const thumbnailBuffer = await image
      .clone()
      .resize(200, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Get thumbnail dimensions
    const thumbnailMetadata = await sharp(thumbnailBuffer).metadata();
    const thumbnailWidth = thumbnailMetadata.width || 0;
    const thumbnailHeight = thumbnailMetadata.height || 0;

    return {
      sizes: {
        original: imageBuffer,
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
    return await sharp(imageBuffer)
      .resize(width, height, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality })
      .toBuffer();
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