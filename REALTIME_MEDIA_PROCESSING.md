# Real-time Media Processing System

This document explains the real-time media processing system with webhook-like updates and live frontend feedback.

## Overview

The system provides real-time updates to the frontend as images are uploaded and processed. It eliminates the "completed" status - instead, the frontend shows a loading indicator while processing and automatically updates when done.

## Architecture

```
┌─────────────┐
│   Frontend  │
│   Upload    │
└──────┬──────┘
       │ 1. Upload file
       ▼
┌─────────────────┐
│ /api/upload/    │
│   local         │
└──────┬──────────┘
       │ 2. Create media record (status: "pending")
       │ 3. Trigger Inngest event
       ▼
┌─────────────────┐
│ Inngest         │
│ Background Job  │
└──────┬──────────┘
       │ 4. Update status: "processing"
       │ 5. Resize images
       │ 6. AI analysis
       │ 7. Update DB (status: null or "failed")
       ▼
┌─────────────────┐
│   Database      │
│   (SQLite)      │
└──────┬──────────┘
       │
       │ 8. Frontend polls for updates
       ▼
┌─────────────────┐
│ /api/media/     │
│   [id]/status   │
└──────┬──────────┘
       │ 9. Return current status
       ▼
┌─────────────────┐
│   Frontend      │
│   Auto-update   │
└─────────────────┘
```

## Components

### 1. Backend - Status API

**File:** `src/pages/api/media/[id]/status.ts`

**Purpose:** Provides media processing status for polling

**Endpoint:** `GET /api/media/{id}/status`

**Response:**
```json
{
  "id": "uuid",
  "status": "pending" | "processing" | "failed" | null,
  "processing": boolean,
  "failed": boolean,
  "data": {
    "original_url": "...",
    "medium_url": "...",
    "thumbnail_url": "...",
    "title": "...",
    "description": "...",
    "alt_text": "...",
    "tags": ["tag1", "tag2"],
    "filename": "..."
  } | null
}
```

### 2. React Hook - useMediaProcessing

**File:** `src/hooks/useMediaProcessing.ts`

**Purpose:** Manages polling and status updates

**Usage:**
```typescript
const { status, isProcessing, error, refresh } = useMediaProcessing({
  mediaId: '123',
  pollInterval: 2000, // Poll every 2 seconds
  onComplete: (data) => {
    console.log('Done!', data);
  },
  onError: (error) => {
    console.error('Failed:', error);
  },
});
```

**Features:**
- Automatic polling while processing
- Stops polling when complete or failed
- Configurable poll interval
- Callbacks for completion/error

### 3. UI Component - MediaProcessingIndicator

**File:** `src/components/MediaProcessingIndicator.tsx`

**Purpose:** Visual feedback for processing status

**Usage:**
```tsx
<MediaProcessingIndicator 
  processing={isProcessing}
  failed={hasFailed}
  message="Processing your image..."
  overlay={true}
  onRetry={() => window.location.reload()}
/>
```

**Features:**
- Loading spinner for processing
- Error state with retry button
- Can be used as overlay or inline
- Customizable messages

### 4. Inngest Function - processMediaUpload

**File:** `src/lib/functions/processMediaUpload.ts`

**Purpose:** Background job that processes uploaded media

**Process:**
1. Updates status to "processing"
2. Downloads original from storage
3. Generates medium and thumbnail versions
4. Runs AI analysis
5. Updates database with results
6. Sets status to `null` (complete) or "failed"

**Error Handling:**
- Catches all errors
- Updates status to "failed" on error
- Logs detailed error information

## Status Flow

### Normal Flow
```
Upload → pending → processing → completed
                                 ↓
                         medium_url & thumbnail_url exist
                         (no status badge shown)
```

### Error Flow
```
Upload → pending → processing → failed
                                 ↓
                         Show retry UI
```

## Processing States

| Status | Description | Frontend Action |
|--------|-------------|-----------------|
| `"pending"` | Just uploaded, waiting to process | Show loading indicator |
| `"processing"` | Currently being processed | Show loading indicator |
| `"completed"` | Processing complete | Display media (no status badge) |
| `"failed"` | Processing failed | Show error UI with retry option |

**Note:** The `"completed"` status is stored in the database but NOT displayed as a badge on the frontend. Only `pending`, `processing`, and `failed` states show status indicators.

## Integration Example

```tsx
import { useState } from 'react';
import { useMediaProcessing } from '@/hooks/useMediaProcessing';
import { MediaProcessingIndicator } from '@/components/MediaProcessingIndicator';

export function UploadForm() {
  const [mediaId, setMediaId] = useState<string | null>(null);
  
  const { status, isProcessing, error } = useMediaProcessing({
    mediaId: mediaId || '',
    enabled: !!mediaId,
    onComplete: (data) => {
      console.log('Processing complete!', data);
    },
  });

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload/local', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    setMediaId(data.media.id); // Start tracking
  };

  return (
    <div>
      <input type="file" onChange={e => handleUpload(e.target.files[0])} />
      
      {/* Show loading while processing */}
      {isProcessing && (
        <MediaProcessingIndicator processing message="Processing..." />
      )}
      
      {/* Show error if failed */}
      {error && (
        <MediaProcessingIndicator failed message={error} />
      )}
      
      {/* Show media when complete */}
      {status?.data && (
        <img src={status.data.medium_url} alt={status.data.alt_text} />
      )}
    </div>
  );
}
```

## Key Features

### 1. No "Completed" Status
- Instead of checking for `status === 'completed'`, check if URLs exist
- Status is `null` when done successfully
- This simplifies the mental model: processing/failed or no status

### 2. Automatic Polling
- Hook polls every 2 seconds by default
- Stops automatically when processing finishes
- No manual refresh needed

### 3. Error Handling
- Errors are caught and status set to "failed"
- Frontend shows retry UI
- User can retry or refresh

### 4. Real-time Updates
- Frontend updates automatically as processing progresses
- No page refresh needed
- Smooth UX with loading indicators

## Database Schema Note

The media table uses:
- `processing_status`: `'pending' | 'processing' | 'completed' | 'failed' | null`
- When processing completes successfully, status is set to `'completed'`
- Frontend shows loading indicators only for `pending` and `processing` states
- Frontend shows error UI only for `failed` state
- Frontend shows no status badge for `completed` state

## Testing

1. **Upload a file:**
   ```bash
   # Use the upload form in your app
   ```

2. **Watch the status change:**
   - Immediately after upload: `pending`
   - After Inngest picks it up: `processing`
   - After completion: `null` (with URLs populated)
   - On error: `failed`

3. **Check status endpoint directly:**
   ```bash
   curl http://localhost:3000/api/media/{id}/status
   ```

## Performance Considerations

- **Poll Interval:** Default 2 seconds - adjust based on your needs
- **Concurrency:** Inngest processes max 6 uploads simultaneously
- **Timeout:** Each step has appropriate timeouts
- **Database:** Uses efficient indexed queries

## Future Enhancements

Potential improvements:
1. WebSocket support for true real-time updates (eliminates polling)
2. Server-Sent Events (SSE) for one-way push updates
3. Progress percentage during processing steps
4. Batch upload with progress tracking
5. Resume failed uploads

## Troubleshooting

### Frontend not updating
- Check browser console for errors
- Verify media ID is correct
- Check network tab for status API calls
- Ensure polling interval is reasonable

### Status stuck at "processing"
- Check Inngest dashboard for errors
- Verify Inngest dev server is running
- Check function logs for issues
- Ensure database is accessible

### "Failed" status but no error
- Check Inngest function logs
- Verify storage is accessible
- Check OpenAI API key is valid
- Ensure sharp is properly installed

## Related Files

- `src/pages/api/media/[id]/status.ts` - Status endpoint
- `src/hooks/useMediaProcessing.ts` - React hook
- `src/components/MediaProcessingIndicator.tsx` - UI component
- `src/components/UploadWithProgress.example.tsx` - Example usage
- `src/lib/functions/processMediaUpload.ts` - Background processor
- `src/pages/api/upload/local.ts` - Upload endpoint

