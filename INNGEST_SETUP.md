# Inngest Setup for Burg Ink

This project uses Inngest for background job processing, specifically for handling Google Drive image synchronization and AI-powered media analysis.

## Setup

### 1. Install Dependencies

The Inngest package has been added to the project:

```bash
yarn add inngest
```

### 2. Configuration

The Inngest client is configured in `src/lib/inngest.ts`:

```typescript
import { Inngest } from "inngest";

export const inngest = new Inngest({ 
  id: "burg-ink",
  name: "Burg Ink Background Jobs"
});
```

### 3. API Endpoint

The Inngest API endpoint is set up at `/api/inngest` and handles function registration and execution.

## Functions

### Google Images Processing

**Function ID:** `process-google-images`  
**Event:** `google.images.process`

This function processes Google Drive images in the background with AI analysis:

1. **Verifies user exists** - Checks that the user is valid
2. **Lists files** - Retrieves image files from the specified Google Drive folder
3. **Stores media** - Downloads and stores each image in DigitalOcean Spaces, creates media records
4. **AI Analysis** - Uses OpenAI Vision API to analyze image content, extract tags, and generate descriptions
5. **Updates sync status** - Marks the sync as complete

#### Usage

Trigger the function from your application:

```typescript
import { triggerGoogleImagesProcessing } from '@/lib/inngest';

await triggerGoogleImagesProcessing(
  userId,      // number
  folderId,    // string
  accessToken  // string
);
```

#### Event Payload

```typescript
{
  userId: number;
  folderId: string;
  accessToken: string;
}
```

## Media Processing Workflow

### 1. Media Storage
- Images are stored in the `media` table with source information
- Processing status tracks: `pending`, `processing`, `completed`, `failed`
- Metadata includes original source details and storage information

### 2. AI Analysis
- Uses OpenAI's GPT-4 Vision API to analyze images
- Extracts content, style, colors, subjects, and mood
- Generates relevant tags for categorization
- Creates detailed descriptions

### 3. Media Management
- Media can be viewed and managed via `/api/media`
- Filter by status, source, and other criteria
- Pagination support for large collections
- AI analysis results are stored as JSON

## Database Schema

### Media Table
```sql
CREATE TABLE media (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  source TEXT NOT NULL,           -- 'google_drive', 'upload', etc.
  source_id TEXT,                 -- Original file ID from source
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER,
  width INTEGER,
  height INTEGER,
  spaces_key TEXT,                -- DigitalOcean Spaces object key
  spaces_url TEXT,                -- DigitalOcean Spaces public URL
  thumbnail_url TEXT,
  processing_status TEXT DEFAULT 'pending',
  ai_analysis TEXT,               -- JSON string of AI analysis results
  metadata TEXT,                  -- JSON string of additional metadata
  tags TEXT,                      -- JSON string of extracted tags
  description TEXT,               -- AI-generated description
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  processed_at TEXT
);
```

## Development

### Running the Inngest Dev Server

Start the Inngest development server to monitor and debug functions:

```bash
yarn inngest:dev
```

This will start the Inngest development server at `http://localhost:8288`.

### API Endpoints

- **`/api/inngest`** - Inngest function handler
- **`/api/inngest/status`** - Check processing status for authenticated user
- **`/api/media`** - List and manage media records

## Integration

The existing Google Drive sync functionality has been updated to use the new media processing workflow:

- **Before:** Files were processed synchronously and immediately created artwork
- **After:** Files are stored as media, analyzed with AI, and can be selectively converted to artwork

### Benefits

1. **Better Performance** - API responses are immediate
2. **AI-Powered Analysis** - Automatic content understanding and tagging
3. **Flexible Workflow** - Media can be reviewed before creating artwork
4. **Rich Metadata** - Detailed analysis results for better organization
5. **Scalability** - Handle large numbers of files without timeout

### Migration

The `/api/drive/sync` endpoint now:
1. Triggers the background job
2. Returns immediately with a status message
3. Updates user sync settings
4. Provides an event ID for tracking

## AI Analysis

### OpenAI Integration
- Uses GPT-4 Vision API for image analysis
- Extracts comprehensive metadata including:
  - Content description
  - Artistic style
  - Color palette
  - Subject identification
  - Mood/atmosphere
  - Relevant tags

### Analysis Results
```typescript
{
  description: string;
  tags: string[];
  content: string;
  style?: string;
  colors?: string[];
  subjects?: string[];
  mood?: string;
}
```

## Environment Variables

Required environment variables:
- `OPENAI_API_KEY` - OpenAI API key for image analysis

Optional for production:
- `INNGEST_EVENT_KEY` - For production event handling
- `INNGEST_SIGNING_KEY` - For secure function execution

## Monitoring

### Check Processing Status

Use the status API to monitor processing progress:

```typescript
const response = await fetch('/api/inngest/status');
const data = await response.json();

console.log('Media stats:', data.media.stats);
console.log('Recent completed:', data.media.recentCompleted);
```

### List Media

Browse and filter media records:

```typescript
const response = await fetch('/api/media?status=completed&limit=10');
const data = await response.json();

console.log('Media records:', data.media);
console.log('Pagination:', data.pagination);
```

### Inngest Dashboard

Access the Inngest dashboard at `http://localhost:8288` during development to:
- View function executions
- Monitor job progress
- Debug failed jobs
- View execution logs

## Error Handling

The function includes comprehensive error handling:

- Individual file failures don't stop the entire process
- Failed files are logged with error details
- Successful files continue to be processed
- AI analysis failures are tracked separately
- Final response includes success and error counts

## Future Enhancements

Potential improvements:
- Add retry logic for failed downloads and AI analysis
- Implement image optimization/compression
- Support for video files and analysis
- Batch processing for large folders
- Custom AI prompts for specific use cases
- Integration with artwork creation workflow
- Advanced filtering and search based on AI analysis 