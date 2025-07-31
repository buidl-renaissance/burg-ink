import { spacesStorageService } from './spacesStorage';
import type { StoredFile, StoredImageSizes, ImageSizeBuffers } from './spacesStorage';

export type { StoredFile, StoredImageSizes, ImageSizeBuffers };

export class StorageService {
  async storeFile(
    buffer: Buffer,
    originalName: string,
    fileId: string,
    mimeType: string
  ): Promise<StoredFile> {
    return spacesStorageService.storeFile(buffer, originalName, fileId, mimeType);
  }

  async storeImageSizes(
    imageSizes: ImageSizeBuffers,
    originalName: string,
    fileId: string,
    mimeType: string
  ): Promise<StoredImageSizes> {
    return spacesStorageService.storeImageSizes(imageSizes, originalName, fileId, mimeType);
  }

  async storeFileFromUrl(
    url: string,
    originalName: string,
    fileId: string,
    mimeType: string
  ): Promise<StoredFile> {
    return spacesStorageService.storeFileFromUrl(url, originalName, fileId, mimeType);
  }

  async deleteFile(key: string): Promise<void> {
    return spacesStorageService.deleteFile(key);
  }

  async fileExists(key: string): Promise<boolean> {
    return spacesStorageService.fileExists(key);
  }

  async getFileInfo(key: string): Promise<{ size: number; exists: boolean } | null> {
    return spacesStorageService.getFileInfo(key);
  }

  async listFiles(prefix: string = 'uploads/'): Promise<string[]> {
    return spacesStorageService.listFiles(prefix);
  }

  getBaseUrl(): string {
    return spacesStorageService.getBaseUrl();
  }

  getBucketName(): string {
    return spacesStorageService.getBucketName();
  }
}

export const storageService = new StorageService(); 