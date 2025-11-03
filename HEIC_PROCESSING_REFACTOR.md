# HEIC Processing Refactor

## Summary

Moved HEIC/HEIF to JPEG conversion to happen **before** the `processMediaUpload` Inngest step, at the upload API endpoint level. This improves performance, reduces storage costs, and simplifies the processing pipeline.

## Changes Made

### 1. `/src/pages/api/upload/local.ts`

**Added HEIC detection and conversion before upload:**
- Detects HEIC files by file extension, MIME type, and file signature
- Converts HEIC to JPEG (95% quality) using `heic-convert` package
- Uploads the converted JPEG to storage instead of the original HEIC
- Updates database record with JPEG MIME type
- Sends correct MIME type to Inngest event

**Key changes:**
- HEIC conversion happens immediately after reading the uploaded file
- Storage receives JPEG files, not HEIC
- Database stores `image/jpeg` MIME type for converted files
- Response includes `wasConverted` flag to indicate conversion occurred

### 2. `/src/pages/api/upload-media.ts`

**Applied same HEIC conversion logic:**
- Detects HEIC files by extension, MIME type, and signature
- Converts to JPEG before uploading to DigitalOcean Spaces
- Updates all metadata to reflect JPEG format
- Sends correct MIME type to Inngest processing event

### 3. Existing HEIC handlers (kept as fallback)

**Files that retain HEIC handling:**
- `/src/lib/imageProcessor.ts` - Keeps HEIC conversion as fallback
- `/src/lib/storage/resize.ts` - Keeps HEIC conversion as fallback
- `/src/lib/functions/processMediaUpload.ts` - Keeps HEIC conversion as fallback

**Why keep fallback handling:**
- Google Drive sync may still import HEIC files directly
- Legacy media records may have HEIC files
- Provides robustness if upload-time conversion fails
- No harm in having defensive code

## New Flow

### Before (Old Flow)
1. Upload API receives HEIC file
2. Store HEIC file in object storage
3. Create DB record with `image/heic` MIME type
4. Trigger Inngest `media/process` event
5. **Inngest downloads HEIC from storage**
6. **Inngest converts HEIC to JPEG**
7. **Inngest uploads JPEG versions**
8. Inngest resizes and processes
9. Inngest runs AI analysis

### After (New Flow)
1. Upload API receives HEIC file
2. **Upload API detects HEIC and converts to JPEG**
3. **Store JPEG file in object storage**
4. Create DB record with `image/jpeg` MIME type
5. Trigger Inngest `media/process` event with JPEG URL
6. Inngest downloads JPEG from storage (already converted)
7. Inngest resizes and processes (no conversion needed)
8. Inngest runs AI analysis

## Benefits

### 1. **Performance**
- Conversion happens once at upload time, not during processing
- Faster processing pipeline (no download → convert → re-upload cycle)
- Reduced Inngest function execution time

### 2. **Storage Efficiency**
- Only JPEG files stored in object storage (no duplicate HEIC + JPEG)
- Reduced storage costs
- Cleaner storage structure

### 3. **Simplicity**
- Processing functions work with standard formats
- No format detection needed during processing
- Easier to reason about data flow

### 4. **Consistency**
- All files in storage are in web-compatible formats
- Database MIME types accurately reflect stored files
- No HEIC files lingering in storage

### 5. **Immediate Feedback**
- Users know immediately if HEIC conversion succeeded
- Upload fails fast if conversion has issues
- Better error handling at upload time

## Detection Strategy

The code uses triple detection for maximum reliability:

1. **File Extension**: Checks if filename ends with `.heic` or `.heif`
2. **MIME Type**: Checks if `mimetype` is `image/heic` or `image/heif`
3. **File Signature**: Examines first 12 bytes for HEIC/HEIF markers:
   - `ftypheic` - Standard HEIC
   - `heix` - HEIC variant
   - `hevc` - HEVC-based HEIC
   - `mif1` - HEIF format

## Conversion Quality

- Uses 95% JPEG quality to maintain near-lossless conversion
- Good balance between file size and visual quality
- Suitable for tattoo/artwork images where detail matters

## Backwards Compatibility

- Existing media records with HEIC files continue to work
- Processing functions still handle HEIC as fallback
- Google Drive sync still handles HEIC appropriately
- No migration needed for existing data

## Testing Checklist

- [x] HEIC upload via `/api/upload/local`
- [ ] HEIC upload via `/api/upload-media`
- [ ] Verify JPEG stored in object storage
- [ ] Verify database has `image/jpeg` MIME type
- [ ] Verify processing completes successfully
- [ ] Verify resized versions are created
- [ ] Verify AI analysis works
- [ ] Test with various HEIC variants
- [ ] Test with corrupt HEIC files
- [ ] Test error handling

## Error Handling

If HEIC conversion fails at upload time:
- Upload fails with clear error message
- User can retry
- No partial data created
- No HEIC files stored that can't be processed

## Future Improvements

1. **Progress Feedback**: Add progress indicator for HEIC conversion
2. **Client-side Conversion**: Convert on client before upload to reduce server load
3. **Batch Conversion**: Add admin tool to convert legacy HEIC files
4. **Format Options**: Allow users to choose output format (JPEG vs WebP)
5. **Quality Settings**: Make JPEG quality configurable

## Notes

- The `media.process-new-upload` event in `upload-media.ts` doesn't have a matching handler
- Consider consolidating upload endpoints to use consistent event names
- Google Drive import flow may need similar HEIC handling updates

