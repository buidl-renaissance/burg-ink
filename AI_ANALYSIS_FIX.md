# AI Analysis Not Saving - Fix

## Problem

AI analysis data was being saved to the database correctly by the `processMediaUpload` Inngest function, but was not appearing in the admin panel when viewing media.

## Root Cause

The API endpoints that fetch media records were **not returning the AI analysis fields** even though they existed in the database.

### Fields Being Saved (in `processMediaUpload`)
✅ `title` - AI-generated title  
✅ `description` - AI-generated description  
✅ `alt_text` - AI-generated alt text  
✅ `tags` - Combined AI and classification tags  
✅ `detected_type` - 'tattoo' | 'artwork' | 'unknown'  
✅ `detection_confidence` - Confidence score 0.0-1.0  
✅ `detections` - Detailed AI classification results  
✅ `suggested_entity_id` - Linked entity if created  
✅ `suggested_entity_type` - 'tattoo' | 'artwork'  

### Fields Missing from API Response
❌ `detected_type`  
❌ `detection_confidence`  
❌ `detections`  
❌ `suggested_entity_id`  
❌ `suggested_entity_type`  
❌ `ai_analysis`  
❌ `spaces_url` (was expected by frontend but didn't exist)

## Changes Made

### 1. `/src/pages/api/media/index.ts` (GET /api/media)

**Before:**
```typescript
const transformedRecords = mediaRecords.map(record => ({
  id: record.id,
  // ... basic fields only
  title: record.title,
  description: record.description,
  alt_text: record.alt_text,
  tags: record.tags ? JSON.parse(record.tags) : [],
  // Missing: AI classification fields
}));
```

**After:**
```typescript
const transformedRecords = mediaRecords.map(record => ({
  id: record.id,
  // ... basic fields
  spaces_url: record.original_url, // Add alias for compatibility
  title: record.title,
  description: record.description,
  alt_text: record.alt_text,
  tags: record.tags ? JSON.parse(record.tags) : [],
  ai_analysis: record.ai_analysis ? JSON.parse(record.ai_analysis) : null,
  // AI classification fields
  detected_type: record.detected_type,
  detection_confidence: record.detection_confidence,
  detections: record.detections ? JSON.parse(record.detections) : null,
  suggested_entity_id: record.suggested_entity_id,
  suggested_entity_type: record.suggested_entity_type,
}));
```

### 2. `/src/pages/api/media/[id]/status.ts` (GET /api/media/:id/status)

**Before:**
```typescript
data: isComplete || status === 'failed' ? {
  original_url: mediaRecord.original_url,
  // ... basic fields only
  title: mediaRecord.title,
  description: mediaRecord.description,
  alt_text: mediaRecord.alt_text,
  tags: mediaRecord.tags ? JSON.parse(mediaRecord.tags) : [],
  // Missing: AI classification fields
} : null
```

**After:**
```typescript
data: isComplete || status === 'failed' ? {
  original_url: mediaRecord.original_url,
  // ... basic fields
  spaces_url: mediaRecord.original_url, // Alias for compatibility
  title: mediaRecord.title,
  description: mediaRecord.description,
  alt_text: mediaRecord.alt_text,
  tags: mediaRecord.tags ? JSON.parse(mediaRecord.tags) : [],
  ai_analysis: mediaRecord.ai_analysis ? JSON.parse(mediaRecord.ai_analysis) : null,
  // AI classification fields
  detected_type: mediaRecord.detected_type,
  detection_confidence: mediaRecord.detection_confidence,
  detections: mediaRecord.detections ? JSON.parse(mediaRecord.detections) : null,
  suggested_entity_id: mediaRecord.suggested_entity_id,
  suggested_entity_type: mediaRecord.suggested_entity_type,
} : null
```

## What Now Works

1. **Title/Description/Alt Text** - AI-generated metadata now appears in admin panel
2. **Tags** - Combined AI and classification tags display correctly
3. **Classification Badges** - Media items show tattoo/artwork badges with confidence
4. **Entity Links** - If media was used to create a tattoo/artwork, the link displays
5. **spaces_url** - Legacy field now works (aliased to original_url)

## Verification Steps

1. Upload a new image
2. Wait for AI processing to complete
3. Check admin panel - should see:
   - AI-generated title
   - AI-generated description
   - AI-generated tags
   - Classification badge (tattoo/artwork/unknown)
   - Confidence percentage

## Database Schema (for reference)

The media table has these fields (all working now):
```sql
-- AI Analysis fields
title TEXT,
description TEXT,
alt_text TEXT,
tags TEXT DEFAULT '[]',
ai_analysis TEXT,

-- Classification fields  
detected_type TEXT,
detection_confidence TEXT,
detections TEXT,
suggested_entity_id INTEGER,
suggested_entity_type TEXT
```

## Notes

- The `ai_analysis` field exists in schema but wasn't being populated by `processMediaUpload`
- Consider using `ai_analysis` to store complete analysis JSON for future use
- The `spaces_url` field doesn't exist in schema - using `original_url` as alias
- JSON fields are stored as strings and need parsing on read

## Testing

To test the fix:
1. Upload an image through `/api/upload/local`
2. Monitor Inngest processing logs
3. Check database: `SELECT title, description, detected_type FROM media WHERE id = 'xxx'`
4. Verify in admin panel at `/admin/media`
5. Check both grid view and detail sidebar

## Related Files

- `src/lib/functions/processMediaUpload.ts` - Saves AI analysis
- `src/lib/ai.ts` - Generates AI analysis
- `src/pages/admin/media.tsx` - Displays media with AI data
- `db/schema.ts` - Database schema definition

