import sharp from 'sharp';
import convert from 'heic-convert';

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
 * Check if a buffer is a HEIC/HEIF file
 */
function isHeicFile(buffer: Buffer): boolean {
  // Check for HEIC/HEIF file signature
  // HEIC files start with 'ftypheic' or 'ftypheix' at bytes 4-12
  // or 'ftypmif1' for HEIF
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
    return Buffer.from(new Uint8Array(outputBuffer));
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    throw new Error(`Failed to convert HEIC to JPEG: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Process an image buffer into multiple sizes
 */
export async function processImageSizes(imageBuffer: Buffer): Promise<ProcessedImageInfo> {
  try {
    // Check if this is a HEIC file by examining the buffer
    // We need to do this before Sharp, because Sharp might not support HEIC
    let processedBuffer = imageBuffer;
    let isHeic = false;
    
    // First try to detect HEIC by file signature
    if (isHeicFile(imageBuffer)) {
      isHeic = true;
      processedBuffer = await convertHeicToJpeg(imageBuffer);
    } else {
      // Try Sharp metadata as fallback, but catch errors
      try {
        const metadata = await sharp(imageBuffer).metadata();
        const format = metadata.format as string;
        if (format === 'heic' || format === 'heif') {
          isHeic = true;
          processedBuffer = await convertHeicToJpeg(imageBuffer);
        }
      } catch (sharpError) {
        // If Sharp fails, check error message for HEIC/HEIF indicators
        const errorMsg = sharpError instanceof Error ? sharpError.message : String(sharpError);
        if (errorMsg.includes('heif') || errorMsg.includes('heic') || errorMsg.includes('11.6003')) {
          console.log('Detected HEIC file from Sharp error, attempting conversion...');
          isHeic = true;
          processedBuffer = await convertHeicToJpeg(imageBuffer);
        } else {
          throw sharpError;
        }
      }
    }
    
    // Get original image metadata (now from converted buffer if it was HEIC)
    const metadata = await sharp(processedBuffer).metadata();
    const originalFormat = isHeic ? 'jpeg' : ((metadata.format as string) || 'jpeg');
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    // Create Sharp instance for processing
    const image = sharp(processedBuffer);
    const format = originalFormat;

    // Generate medium size (800px width, maintaining aspect ratio)
    let mediumProcessor = image
      .clone()
      .resize(800, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    
    // Convert to appropriate output format
    if (format === 'jpeg') {
      mediumProcessor = mediumProcessor.jpeg({ quality: 85 });
    } else if (format === 'png') {
      mediumProcessor = mediumProcessor.png();
    } else if (format === 'webp') {
      mediumProcessor = mediumProcessor.webp({ quality: 85 });
    } else {
      // Default to JPEG for unknown formats
      mediumProcessor = mediumProcessor.jpeg({ quality: 85 });
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
    
    // Convert to appropriate output format
    if (format === 'jpeg') {
      thumbnailProcessor = thumbnailProcessor.jpeg({ quality: 80 });
    } else if (format === 'png') {
      thumbnailProcessor = thumbnailProcessor.png();
    } else if (format === 'webp') {
      thumbnailProcessor = thumbnailProcessor.webp({ quality: 80 });
    } else {
      // Default to JPEG for unknown formats
      thumbnailProcessor = thumbnailProcessor.jpeg({ quality: 80 });
    }
    const thumbnailBuffer = await thumbnailProcessor.toBuffer();

    // Get thumbnail dimensions
    const thumbnailMetadata = await sharp(thumbnailBuffer).metadata();
    const thumbnailWidth = thumbnailMetadata.width || 0;
    const thumbnailHeight = thumbnailMetadata.height || 0;

    // Use the processed buffer (already converted if it was HEIC)
    const originalBuffer = processedBuffer;
    
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
    // Check and convert HEIC if needed
    let processedBuffer = imageBuffer;
    if (isHeicFile(imageBuffer)) {
      processedBuffer = await convertHeicToJpeg(imageBuffer);
    }
    
    let processor = sharp(processedBuffer)
      .resize(width, height, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    
    // Convert to JPEG (necessary for HEIC, good default for others)
    processor = processor.jpeg({ quality });
    
    return await processor.toBuffer();
  } catch (error) {
    console.error('Error resizing image:', error);
    
    // If it's a HEIC error and we didn't catch it before, try conversion
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('heif') || errorMsg.includes('heic') || errorMsg.includes('11.6003')) {
      try {
        console.log('Detected HEIC file from error, attempting conversion...');
        const convertedBuffer = await convertHeicToJpeg(imageBuffer);
        const processor = sharp(convertedBuffer)
          .resize(width, height, {
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality });
        
        return await processor.toBuffer();
      } catch (conversionError) {
        throw new Error(`Failed to convert and resize HEIC image: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
      }
    }
    
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
    // Check and convert HEIC if needed
    let processedBuffer = imageBuffer;
    let format = 'unknown';
    
    if (isHeicFile(imageBuffer)) {
      format = 'heic';
      processedBuffer = await convertHeicToJpeg(imageBuffer);
    }
    
    const metadata = await sharp(processedBuffer).metadata();
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: format !== 'unknown' ? format : (metadata.format || 'unknown'),
      size: imageBuffer.length,
    };
  } catch (error) {
    console.error('Error extracting image metadata:', error);
    
    // If it's a HEIC error and we didn't catch it before, try conversion
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('heif') || errorMsg.includes('heic') || errorMsg.includes('11.6003')) {
      try {
        console.log('Detected HEIC file from error, attempting conversion for metadata...');
        const convertedBuffer = await convertHeicToJpeg(imageBuffer);
        const metadata = await sharp(convertedBuffer).metadata();
        
        return {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: 'heic',
          size: imageBuffer.length,
        };
      } catch (conversionError) {
        throw new Error(`Failed to extract HEIC metadata: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
      }
    }
    
    throw new Error(`Failed to extract image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 