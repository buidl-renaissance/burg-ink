# Database Setup with Drizzle ORM

This project uses Drizzle ORM with Turso (SQLite) for the database. The schema is based on the TypeScript interfaces defined in `src/utils/interfaces.ts`.

## Migration from Supabase

This project has been migrated from Supabase to Drizzle ORM. The following changes were made:

- **Removed Supabase dependencies**: `@supabase/supabase-js` and related packages
- **Replaced Supabase client**: All database operations now use Drizzle ORM
- **Updated API endpoints**: All `/api/artwork/*` endpoints now use Drizzle
- **New authentication**: Replaced Supabase auth with JWT-based authentication
- **Database schema**: Created comprehensive schema with proper relationships

## Schema Overview

### Tables

1. **artists** - Stores artist information
   - `id` (Primary Key)
   - `name`, `handle`, `slug` (Unique identifiers)
   - `profile_picture`, `bio`
   - `social_links_id` (Foreign key to social_links)
   - `tags` (JSON string)
   - `created_at`, `updated_at`, `deleted_at`

2. **artwork** - Stores artwork information
   - `id` (Primary Key)
   - `slug` (Unique identifier)
   - `title`, `description`, `type`
   - `artist_id` (Foreign key to artists)
   - `image` (Main artwork image)
   - `category`, `is_for_sale`, `price`
   - `review_text`, `review_image`
   - `meta` (JSON string for additional data)
   - `created_at`, `updated_at`

3. **content** - Stores media content for artwork
   - `id` (Primary Key)
   - `artwork_id` (Foreign key to artwork)
   - `user_id` (Foreign key to users)
   - `width`, `height`, `type`
   - `youtube_id`, `url`, `caption`
   - `timestamp`

4. **artwork_collaborators** - Junction table for artwork collaborations
   - `id` (Primary Key)
   - `artwork_id` (Foreign key to artwork)
   - `artist_id` (Foreign key to artists)
   - `created_at`

5. **social_links** - Stores social media links
   - `id` (Primary Key)
   - `twitter`, `instagram`, `linkedin`, `github`
   - `created_at`, `updated_at`

6. **users** - Basic user information
   - `id` (Primary Key)
   - `cid`, `name`, `email`
   - `bio`, `profile_picture`
   - `created_at`, `updated_at`

## Authentication

The project now uses JWT-based authentication instead of Supabase auth:

```typescript
import { getAuthorizedUser, createToken } from '@/lib/auth';

// Get user from request
const user = await getAuthorizedUser(req);

// Create token for user
const token = createToken({ id: 1, email: 'user@example.com', name: 'User' });
```

## Usage

### Database Client

Import the database client in your files:

```typescript
import { db } from '@/lib/db';
```

### Helper Functions

The `src/lib/db.ts` file provides helper functions for common operations:

- `getAllArtwork()` - Get all artwork with artist information
- `getArtworkBySlug(slug)` - Get specific artwork by slug
- `createArtwork(data)` - Create new artwork
- `getAllArtists()` - Get all artists
- `getArtistBySlug(slug)` - Get specific artist by slug

### API Endpoints

Updated API endpoints that use Drizzle:

- `GET /api/artwork` - Get all artwork
- `POST /api/artwork` - Create new artwork
- `GET /api/artwork/[id]` - Get artwork by ID
- `GET /api/artwork/slug/[slug]` - Get artwork by slug
- `GET /api/drizzle/artwork` - Alternative Drizzle endpoint
- `GET /api/drizzle/artists` - Get all artists
- `POST /api/drizzle/artists` - Create new artist

## Database Commands

### Generate Migration
```bash
npm run db:generate
```

### Apply Migration
```bash
npm run db:migrate
```

### Open Drizzle Studio
```bash
npm run db:studio
```

## Environment Variables

Make sure you have these environment variables set:

```env
TURSO_DATABASE_URL=your_turso_database_url
TURSO_AUTH_TOKEN=your_turso_auth_token
JWT_SECRET=your_jwt_secret_key
```

## Example Usage

### Creating an Artist
```typescript
const artistData = {
  name: "John Doe",
  handle: "johndoe",
  slug: "john-doe",
  bio: "A talented artist",
  socialLinks: {
    instagram: "https://instagram.com/johndoe",
    twitter: "https://twitter.com/johndoe"
  }
};

const response = await fetch('/api/drizzle/artists', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(artistData)
});
```

### Creating Artwork
```typescript
const artworkData = {
  slug: "my-awesome-artwork",
  title: "My Awesome Artwork",
  description: "A beautiful piece of art",
  type: "painting",
  artist_id: 1,
  image: "https://example.com/image.jpg",
  category: "abstract",
  is_for_sale: true,
  price: 1000
};

const response = await fetch('/api/artwork', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(artworkData)
});
```

## Migration Notes

- All existing Supabase functionality has been replaced with Drizzle equivalents
- The API response format has been standardized to use `{ data: ... }` wrapper
- Authentication now uses JWT tokens instead of Supabase sessions
- Database queries are now type-safe with Drizzle ORM
- The schema supports all the same features as the previous Supabase setup 