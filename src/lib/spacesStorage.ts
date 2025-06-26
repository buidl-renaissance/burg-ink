import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash } from 'crypto';

export interface StoredFile {
  filename: string;
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface SpacesConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export class SpacesStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private baseUrl: string;

  constructor(config: SpacesConfig) {
    this.s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: false, // Required for DigitalOcean Spaces
    });
    
    this.bucketName = config.bucketName;
    this.baseUrl = `https://${config.bucketName}.${config.endpoint.replace('https://', '')}`;
  }

  /**
   * Generate a unique filename to avoid conflicts
   */
  private generateFilename(originalName: string, fileId: string): string {
    const ext = originalName.substring(originalName.lastIndexOf('.'));
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    const hash = createHash('md5').update(fileId).digest('hex').substring(0, 8);
    const timestamp = Date.now();
    return `${nameWithoutExt}-${hash}-${timestamp}${ext}`;
  }

  /**
   * Store a file from buffer data
   */
  async storeFile(
    buffer: Buffer,
    originalName: string,
    fileId: string,
    mimeType: string
  ): Promise<StoredFile> {
    const filename = this.generateFilename(originalName, fileId);
    const key = `uploads/${filename}`;
    const url = `${this.baseUrl}/${key}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    });

    await this.s3Client.send(command);

    return {
      filename,
      key,
      url,
      size: buffer.length,
      mimeType,
    };
  }

  /**
   * Store a file from a URL (download and store)
   */
  async storeFileFromUrl(
    url: string,
    originalName: string,
    fileId: string,
    mimeType: string
  ): Promise<StoredFile> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file from ${url}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return this.storeFile(buffer, originalName, fileId, mimeType);
  }

  /**
   * Delete a stored file
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.warn(`Could not delete file ${key}:`, error);
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(key: string): Promise<{ size: number; exists: boolean } | null> {
    const command = new HeadObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      return {
        size: response.ContentLength || 0,
        exists: true,
      };
    } catch {
      return null;
    }
  }

  /**
   * List all files in the uploads directory
   */
  async listFiles(prefix: string = 'uploads/'): Promise<string[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    try {
      const response = await this.s3Client.send(command);
      return response.Contents?.map(obj => obj.Key || '').filter(Boolean) || [];
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Generate a presigned URL for direct uploads
   */
  async generatePresignedUrl(
    key: string,
    mimeType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
      ACL: 'public-read',
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get the base URL for the space
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get the bucket name
   */
  getBucketName(): string {
    return this.bucketName;
  }
}

// Create singleton instance with environment variables
const getSpacesConfig = (): SpacesConfig => {
  const endpoint = process.env.DO_SPACES_ENDPOINT;
  const region = process.env.DO_SPACES_REGION;
  const accessKeyId = process.env.DO_SPACES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.DO_SPACES_SECRET_ACCESS_KEY;
  const bucketName = process.env.DO_SPACES_BUCKET_NAME;

  if (!endpoint || !region || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('Missing DigitalOcean Spaces configuration. Please set all required environment variables.');
  }

  return {
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    bucketName,
  };
};

// Export singleton instance
export const spacesStorageService = new SpacesStorageService(getSpacesConfig()); 