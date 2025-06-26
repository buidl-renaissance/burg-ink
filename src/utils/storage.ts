import { storageService } from '@/lib/storage';

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  fileTypes: { [key: string]: number };
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  try {
    const files = await storageService.listFiles('uploads/');
    let totalSize = 0;
    const fileTypes: { [key: string]: number } = {};
    
    for (const file of files) {
      const fileInfo = await storageService.getFileInfo(file);
      if (fileInfo) {
        totalSize += fileInfo.size;
        
        const ext = file.toLowerCase().substring(file.lastIndexOf('.'));
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
      }
    }
    
    return {
      totalFiles: files.length,
      totalSize,
      fileTypes,
    };
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {},
    };
  }
}

/**
 * Clean up orphaned files (files that exist in storage but not in database)
 */
export async function cleanupOrphanedFiles(knownFilenames: string[]): Promise<{
  cleaned: number;
  errors: string[];
}> {
  try {
    const files = await storageService.listFiles('uploads/');
    const orphanedFiles = files.filter(file => !knownFilenames.includes(file));
    
    let cleaned = 0;
    const errors: string[] = [];
    
    for (const file of orphanedFiles) {
      try {
        await storageService.deleteFile(file);
        cleaned++;
      } catch (error) {
        errors.push(`Failed to delete ${file}: ${error}`);
      }
    }
    
    return { cleaned, errors };
  } catch (error) {
    console.error('Error cleaning up orphaned files:', error);
    return { cleaned: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
  }
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate if a file is an image
 */
export function isValidImageFile(filename: string): boolean {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return validExtensions.includes(ext);
} 