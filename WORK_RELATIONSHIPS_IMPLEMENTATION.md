# Work Relationships Feature - Implementation Summary

## Overview
Successfully implemented a feature to manually link different types of works (artwork and tattoos) together, with cross-type support. The system allows admins to create relationships between items and displays them on the frontend.

## Database Changes

### Schema (`db/schema.ts`)
- Added `workRelationships` table with the following structure:
  - `source_entity_type` and `source_entity_id` - The source work
  - `target_entity_type` and `target_entity_id` - The linked work
  - `relationship_type` - Type of relationship (related, variant, series)
  - Indexes for efficient lookups on both source and target
  - Unique constraint to prevent duplicate relationships

### Migration (`migrations/0023_add_work_relationships.sql`)
- Created migration file to add the `work_relationships` table
- Includes all necessary indexes and constraints

## Backend Implementation

### Database Functions (`src/lib/db.ts`)
Added the following functions:
- `getLinkedWorks(entityType, entityId)` - Fetches all linked works for a given entity (bidirectional)
- `createWorkRelationship(...)` - Creates a new relationship between works
- `deleteWorkRelationship(id)` - Deletes a relationship by ID
- `deleteWorkRelationshipByEntities(...)` - Deletes a relationship by entity references
- `searchWorks(query, limit)` - Searches across both artwork and tattoos

### API Endpoints

#### `/api/work-relationships` (GET, POST, DELETE)
- **GET**: Fetch all linked works for a given entity
  - Query params: `entityType`, `entityId`
- **POST**: Create a new relationship
  - Body: `sourceType`, `sourceId`, `targetType`, `targetId`, `relationshipType`
- **DELETE**: Remove a relationship
  - Body: `sourceType`, `sourceId`, `targetType`, `targetId`

#### `/api/work-relationships/search` (GET)
- Search for works to link
- Query params: `query`, `limit` (optional)
- Returns results from both artwork and tattoos tables

## Admin UI Components

### RelationshipManager Component (`src/components/RelationshipManager.tsx`)
A comprehensive admin component that:
- Displays currently linked works with thumbnails and type badges
- Provides a search modal to find and add new links
- Allows removing existing links with confirmation
- Shows helpful messages when no links exist or entity isn't saved yet
- Works for both artwork and tattoos

### Form Integration
- Added `RelationshipManager` to `ArtworkForm.tsx`
- Added `RelationshipManager` to `TattooForm.tsx`
- Manager only appears when editing existing items (requires saved ID)

## Frontend Display

### Detail Pages
Updated both artwork and tattoo detail pages:
- `src/pages/artwork/[slug].tsx`
- `src/pages/tattoos/[slug].tsx`

Changes:
- Fetch linked works using `getLinkedWorks()` function
- Display linked works in the carousel (replacing "show all" behavior)
- Fallback to showing random works if no links exist
- Only show carousel if there are linked works

### RelatedItemsCarousel Component (`src/components/RelatedItemsCarousel.tsx`)
Enhanced to support mixed entity types:
- Added `type` field to `CarouselItem` interface
- Removed `itemType` prop (now determined per item)
- Generate correct URLs based on each item's type
- Display type badge on each item (artwork/tattoo)
- Updated title to "Related Works"

## Key Features

1. **Manual Linking**: Admins can manually select which works to link together
2. **Cross-Type Support**: Link artwork to tattoos, tattoos to artwork, or same-type items
3. **Bidirectional**: Relationships work in both directions automatically
4. **Search Integration**: Real-time search across all work types when adding links
5. **Visual Feedback**: Type badges, thumbnails, and clear UI indicators
6. **Fallback Behavior**: Shows random works if no manual links exist
7. **Validation**: Prevents linking to self, duplicate relationships

## Files Modified

### Database
- `db/schema.ts` - Added workRelationships table
- `migrations/0023_add_work_relationships.sql` - New migration

### Backend
- `src/lib/db.ts` - Added relationship management functions

### API
- `src/pages/api/work-relationships/index.ts` - Main CRUD endpoint
- `src/pages/api/work-relationships/search.ts` - Search endpoint

### Components
- `src/components/RelationshipManager.tsx` - New admin component
- `src/components/ArtworkForm.tsx` - Integrated manager
- `src/components/TattooForm.tsx` - Integrated manager
- `src/components/RelatedItemsCarousel.tsx` - Updated for mixed types

### Pages
- `src/pages/artwork/[slug].tsx` - Uses linked works
- `src/pages/tattoos/[slug].tsx` - Uses linked works

## Usage

### For Admins
1. Navigate to an artwork or tattoo edit page
2. Scroll down to the "Linked Works" section
3. Click "Add Link" to open the search modal
4. Search for works to link
5. Click on a work to create the link
6. Remove links by clicking the X button on a linked work

### For Users
- Linked works appear in the "Related Works" carousel on detail pages
- Each item shows a type badge (artwork/tattoo)
- Can navigate between different types of works seamlessly

## Testing Checklist

- [ ] Run the migration: `yarn drizzle-kit push` or equivalent
- [ ] Test creating links between artworks
- [ ] Test creating links between tattoos
- [ ] Test creating cross-type links (artwork ↔ tattoo)
- [ ] Test search functionality
- [ ] Test removing links
- [ ] Verify links display correctly on detail pages
- [ ] Check fallback behavior when no links exist
- [ ] Test that type badges display correctly
- [ ] Verify navigation works for all item types

## Future Enhancements

Potential additions for later:
- AI-suggested relationships based on embeddings
- Relationship types (variant, series, inspired-by, etc.)
- Bulk link management
- Link preview/validation
- Analytics on linked work clicks

