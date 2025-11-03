# HEIC/HEIF Image Processing Fix

## Problem
Sharp library in serverless environments (Vercel/AWS Lambda) doesn't have HEIF codec support compiled in, resulting in errors:
```
heif: Error while loading plugin: Support for this compression format has not been built in (11.6003)
source: bad seek to 997846
```

## Solution
Added `heic-convert` package to convert HEIC/HEIF images to JPEG before Sharp processes them.

## Changes Made

### 1. Package Installation
- Added `heic-convert@2.1.0` package to handle HEIC/HEIF conversion

### 2. Updated Files

#### `/src/lib/imageProcessor.ts`
- Added HEIC file detection by examining file signatures
- Added `convertHeicToJpeg()` function using heic-convert
- Updated `processImageSizes()` to detect and convert HEIC files before Sharp processing
- Updated `resizeImage()` with HEIC handling
- Updated `getImageMetadata()` with HEIC handling
- All functions now have error handling that catches Sharp HEIC errors and retries with conversion

#### `/src/lib/storage/resize.ts`
- Added same HEIC detection and conversion logic
- Updated `resizeImage()` to handle HEIC files before Sharp processing
- Maintains backward compatibility with existing image formats

#### `/src/lib/functions/processMediaUpload.ts`
- Added HEIC detection and conversion for metadata extraction
- Ensures dimensions can be read from HEIC files before they're resized
- Properly sets mime type to `image/jpeg` for converted HEIC files

## How It Works

1. **File Signature Detection**: Checks the first 12 bytes of the image buffer for HEIC/HEIF signatures (`ftypheic`, `heix`, `hevc`, `mif1`)

2. **Fallback Detection**: If signature check doesn't detect HEIC, tries Sharp metadata extraction and checks for HEIC format

3. **Error-Based Detection**: If Sharp fails with HEIC-related error codes (like 11.6003), catches the error and attempts conversion

4. **Conversion**: Uses heic-convert to convert HEIC to JPEG at 95% quality before any Sharp processing

5. **Seamless Processing**: Once converted, the JPEG buffer is processed normally by Sharp for resizing and optimization

## Benefits

- ✅ HEIC/HEIF files now work in serverless environments
- ✅ No changes needed to existing API endpoints
- ✅ Automatic conversion is transparent to users
- ✅ Maintains high quality (95% JPEG quality)
- ✅ Works with all existing image processing workflows
- ✅ Proper error handling with fallback mechanisms

## Testing

After deploying, HEIC images will:
1. Be automatically detected
2. Converted to JPEG
3. Resized to all required sizes (original, medium, thumbnail)
4. Stored with proper MIME type (`image/jpeg`)
5. Processed by AI analysis normally

## No Breaking Changes

All existing non-HEIC images continue to work exactly as before. The changes only add support for HEIC/HEIF files that previously failed.

