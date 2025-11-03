import sharp from 'sharp';
import convert from 'heic-convert';

export interface ResizeOptions {
  width: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export const RESIZE_PRESETS = {
  medium: { width: 800, quality: 85 },
  thumb: { width: 200, quality: 80 },
} as const;

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

export async function resizeImage(
  inputBuffer: Buffer,
  options: ResizeOptions
): Promise<Buffer> {
  const { width, quality = 85, format = 'jpeg' } = options;

  // Check and convert HEIC if needed
  let processedBuffer = inputBuffer;
  let isHeic = false;
  
  if (isHeicFile(inputBuffer)) {
    isHeic = true;
    processedBuffer = await convertHeicToJpeg(inputBuffer);
  } else {
    // Try Sharp metadata as fallback
    try {
      const metadata = await sharp(inputBuffer).metadata();
      const formatStr = (metadata.format as string) || '';
      if (formatStr === 'heic' || formatStr === 'heif') {
        isHeic = true;
        processedBuffer = await convertHeicToJpeg(inputBuffer);
      }
    } catch (sharpError) {
      // If Sharp fails with HEIC error, try conversion
      const errorMsg = sharpError instanceof Error ? sharpError.message : String(sharpError);
      if (errorMsg.includes('heif') || errorMsg.includes('heic') || errorMsg.includes('11.6003')) {
        console.log('Detected HEIC file from Sharp error, attempting conversion...');
        isHeic = true;
        processedBuffer = await convertHeicToJpeg(inputBuffer);
      } else {
        throw sharpError;
      }
    }
  }

  let processor = sharp(processedBuffer)
    .rotate() // Automatically apply EXIF orientation
    .resize(width, null, {
      withoutEnlargement: true,
      fit: 'inside',
    });

  // If HEIC, always convert to JPEG for compatibility
  if (isHeic || format === 'jpeg') {
    processor = processor.jpeg({ quality });
  } else if (format === 'png') {
    processor = processor.png({ quality });
  } else if (format === 'webp') {
    processor = processor.webp({ quality });
  }

  return processor.toBuffer();
}

export async function generateResizedVersions(originalBuffer: Buffer): Promise<{
  medium: Buffer;
  thumb: Buffer;
}> {
  // Check if input is HEIC/HEIF - will be converted to JPEG during resize
  const [medium, thumb] = await Promise.all([
    resizeImage(originalBuffer, RESIZE_PRESETS.medium),
    resizeImage(originalBuffer, RESIZE_PRESETS.thumb),
  ]);

  return { medium, thumb };
}

export function getImageFormat(filename: string): 'jpeg' | 'png' | 'webp' {
  const ext = filename.toLowerCase().split('.').pop();
  
  switch (ext) {
    case 'png':
      return 'png';
    case 'webp':
      return 'webp';
    case 'jpg':
    case 'jpeg':
    default:
      return 'jpeg';
  }
}

export function getFileExtension(filename: string): string {
  return filename.toLowerCase().split('.').pop() || 'jpg';
}
