# Local Storage System

This document describes the local storage system for downloading and storing Google Drive assets on your own servers.

## Overview

The local storage system allows you to:
- Download images from Google Drive and store them locally
- Serve images from your own server for better performance
- Manage file storage with proper organization and cleanup
- Monitor storage usage and statistics

## Features

### 1. Local File Storage
- Files are stored in `public/uploads/` directory
- Unique filenames generated to avoid conflicts
- Proper file organization and metadata tracking

### 2. Google Drive Integration
- Automatic download of Google Drive images during sync
- Local file paths stored in database for tracking
- Fallback to Google Drive URLs if local download fails

### 3. File Serving
- Local files served via `/api/uploads/[...path]` endpoint
- Proper caching headers for performance
- Security checks to prevent directory traversal

### 4. Storage Management
- Storage statistics and monitoring
- File cleanup utilities
- Orphaned file detection and removal

## Database Schema

The `google_drive_assets` table has been updated with new fields:

```sql
local_file_path: text("local_file_path") // Local file path for downloaded assets
local_file_url: text("local_file_url")   // Local file URL for serving
```

## API Endpoints

### `/api/upload-media`
- **Method**: POST
- **Purpose**: Upload local files (replaces external API)
- **Authentication**: Required
- **File Size Limit**: 10MB
- **Supported Formats**: JPEG, PNG, GIF, WebP

### `/api/uploads/[...path]`
- **Method**: GET
- **Purpose**: Serve local files
- **Authentication**: Not required (public files)
- **Features**: Caching, security validation

### `/api/storage/stats`
- **Method**: GET
- **Purpose**: Get storage statistics
- **Authentication**: Required
- **Returns**: File count, total size, file types

### `/api/drive/sync` (Updated)
- **Method**: POST
- **Purpose**: Sync Google Drive folder with local storage
- **Features**: Downloads and stores files locally

## File Structure

```
public/
  uploads/           # Local file storage
    image1-abc123-1234567890.jpg
    image2-def456-1234567891.png
    ...
```

## Usage

### 1. Google Drive Sync
When syncing a Google Drive folder, images are automatically downloaded and stored locally:

```javascript
// The sync process now:
// 1. Lists files in Google Drive folder
// 2. Downloads each image file
// 3. Stores locally with unique filename
// 4. Updates database with local file paths
// 5. Creates artwork entries with local URLs
```

### 2. Local File Uploads
Replace external API calls with local endpoint:

```javascript
// Before (external API)
const response = await fetch('https://api.detroiter.network/api/upload-media', {
  method: 'POST',
  body: formData,
});

// After (local API)
const response = await fetch('/api/upload-media', {
  method: 'POST',
  body: formData,
});
```

### 3. Storage Monitoring
Monitor storage usage in admin panel:

```javascript
import { StorageStats } from '@/components/StorageStats';

// In your admin component
<StorageStats />
```

## Configuration

### Next.js Configuration
The system works with Next.js static file serving. Files in `public/uploads/` are automatically served at `/uploads/` URL path.

### File Size Limits
- Maximum file size: 10MB per upload
- Supported image formats: JPEG, PNG, GIF, WebP

### Security
- File path validation prevents directory traversal
- Authentication required for uploads
- File type validation on upload

## Maintenance

### Cleanup Orphaned Files
Files that exist on disk but not in the database can be cleaned up:

```javascript
import { cleanupOrphanedFiles } from '@/utils/storage';

const result = await cleanupOrphanedFiles(knownFilenames);
console.log(`Cleaned ${result.cleaned} files`);
```

### Storage Statistics
Monitor storage usage:

```javascript
import { getStorageStats } from '@/utils/storage';

const stats = await getStorageStats();
console.log(`Total files: ${stats.totalFiles}`);
console.log(`Total size: ${formatFileSize(stats.totalSize)}`);
```

## Migration from External API

1. **Update Upload Components**: Change API endpoints from external to local
2. **Run Database Migration**: Apply the new schema changes
3. **Test File Uploads**: Verify local uploads work correctly
4. **Sync Google Drive**: Run sync to download existing files locally
5. **Monitor Storage**: Use storage stats to track usage

## Benefits

1. **Performance**: Faster image loading from local server
2. **Reliability**: No dependency on external APIs
3. **Control**: Full control over file storage and serving
4. **Cost**: No external storage costs
5. **Privacy**: Files stored on your own infrastructure

## Troubleshooting

### File Upload Issues
- Check file size limits (10MB max)
- Verify file format is supported
- Ensure authentication is working

### Sync Issues
- Check Google Drive permissions
- Verify network connectivity
- Review server logs for download errors

### Storage Issues
- Monitor disk space usage
- Check file permissions on uploads directory
- Verify Next.js static file serving is working

## Future Enhancements

1. **Image Optimization**: Add image resizing and optimization
2. **CDN Integration**: Support for CDN file serving
3. **Backup System**: Automated backup of uploaded files
4. **File Versioning**: Support for file versioning and rollback
5. **Advanced Cleanup**: Automated cleanup based on usage patterns 