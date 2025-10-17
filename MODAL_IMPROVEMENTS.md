# Modal/Sidebar Image Quality & Dimensions Update

## Summary

Updated the media admin interface to show higher quality images in the modal/sidebar and always display full image dimensions.

## Changes Made

### 1. Database Schema
- Added `width` and `height` integer columns to `media` table
- Migrations: `0014_faithful_peter_parker.sql` and `0015_elite_vivisector.sql`
- ✅ Columns successfully applied to database

### 2. Processing Pipeline
- `processMediaUpload.ts` now extracts dimensions using `sharp.metadata()`
- Dimensions stored during image processing
- Extracted from original image before resizing

### 3. API Endpoints
- `/api/media/index.ts` - Returns width/height for all media items
- `/api/media/[id]/status.ts` - Includes dimensions in status polling

### 4. Frontend Display

#### Modal/Sidebar Image Quality
**Before:** Showed `thumbnail_url` (low quality)  
**After:** Shows `original_url` → `medium_url` → `thumbnail_url` (fallback chain)

#### Dimensions Display
**Before:** Only shown if already in database  
**After:** Always visible - shows actual dimensions or "Processing..." during upload

#### Status Badge
- Hidden for completed items (clean UI)
- Only shown for: pending, processing, failed

## Example

When clicking a media item, the sidebar now shows:

```
┌─────────────────────────────┐
│                             │
│   [High Quality Image]      │  ← Original or Medium
│                             │
└─────────────────────────────┘

File Information
├─ Filename: IMG_1234.jpg
├─ Size: 2.4 MB
├─ Dimensions: 3024 × 4032        ← Always shown!
├─ Type: image/jpeg
├─ Source: local
└─ (Status only if pending/processing/failed)

Description
Beautiful landscape photo...

Tags
[mountains] [sunset] [nature]
```

## Files Modified

- `db/schema.ts` - Added width/height fields
- `src/lib/functions/processMediaUpload.ts` - Extract & store dimensions
- `src/pages/api/media/index.ts` - Return dimensions in API
- `src/pages/api/media/[id]/status.ts` - Include dimensions in status
- `src/pages/admin/media.tsx` - Display high-quality image + dimensions

## Testing

1. **Upload a new image:**
   ```bash
   # Navigate to /admin/media
   # Upload an image
   ```

2. **Check dimensions:**
   - Click on the uploaded image
   - Sidebar should show "Processing..." initially
   - After ~5-10 seconds, should show actual dimensions like "3024 × 4032"

3. **Check image quality:**
   - Image in sidebar should be much higher quality than before
   - Should be clear and detailed (original or medium, not thumbnail)

## Database Status

✅ Width and height columns exist in database:
```
16|width|INTEGER|0||0
17|height|INTEGER|0||0
```

## Known Issues

- Drizzle-kit push has an unrelated error with `artwork_artist_unique_idx`
  - This is a pre-existing issue not related to media changes
  - Does not affect functionality
  - Width/height columns are already in database and working

## Notes

- Dimensions are extracted from the original uploaded image
- Processing happens in background (Inngest)
- Frontend polls every 2 seconds during processing
- When complete, dimensions auto-update via real-time polling system
- Status badge disappears automatically when processing completes

