import { Artwork } from '@/utils/interfaces';
import { db, artwork, artists, tattoos } from '../../db';
import { eq, desc, asc, isNull, and } from 'drizzle-orm';

// Re-export the database instance
export { db };

// Helper function to get all artwork with artist information
export async function getAllArtwork() {
  const result = await db
    .select()
    .from(artwork)
    .leftJoin(artists, eq(artwork.artist_id, artists.id))
    .where(isNull(artwork.deleted_at))
    .orderBy(asc(artwork.sort_order), desc(artwork.created_at));
  
  return result.map(row => {
    let parsedMeta = {};
    try {
      parsedMeta = row.artwork.meta ? JSON.parse(row.artwork.meta) : {};
    } catch (error) {
      console.error('Error parsing meta for artwork:', row.artwork.id, error);
      parsedMeta = {};
    }
    
    return {
      ...row.artwork,
      meta: parsedMeta,
      data: row.artwork.data ? JSON.parse(row.artwork.data) : {},
      artist: row.artists ? {
        id: row.artists.id,
        name: row.artists.name,
        slug: row.artists.slug,
        profile_picture: row.artists.profile_picture,
        bio: row.artists.bio,
        created_at: row.artists.created_at,
        updated_at: row.artists.updated_at,
        deleted_at: row.artists.deleted_at,
      } : undefined,
    } as Artwork;
  });
}

// Helper function to get published artwork from the main artist
export async function getPublishedArtworkFromArtist(artistId?: string) {
  const mainArtistId = artistId || process.env.NEXT_PUBLIC_DPOP_ARTIST_ID;
  
  if (!mainArtistId) {
    console.warn('No artist ID provided for filtering published artwork');
    return [];
  }

  const result = await db
    .select()
    .from(artwork)
    .leftJoin(artists, eq(artwork.artist_id, artists.id))
    .where(
      and(
        eq(artwork.artist_id, parseInt(mainArtistId)),
        isNull(artwork.deleted_at)
      )
    )
    .orderBy(asc(artwork.sort_order), desc(artwork.created_at));
  
  return result.map(row => {
    let parsedMeta: Record<string, unknown> = {};
    try {
      parsedMeta = row.artwork.meta ? JSON.parse(row.artwork.meta) : {};
    } catch (error) {
      console.error('Error parsing meta for artwork:', row.artwork.id, error);
      parsedMeta = {};
    }
    
    // Only return artwork that is published
    if (parsedMeta.status !== 'published') {
      return null;
    }
    
    return {
      id: row.artwork.id,
      slug: row.artwork.slug,
      title: row.artwork.title,
      description: row.artwork.description,
      type: row.artwork.type,
      artist_id: row.artwork.artist_id,
      image: row.artwork.image,
      category: row.artwork.category,
      data: row.artwork.data,
      meta: parsedMeta,
      created_at: row.artwork.created_at,
      updated_at: row.artwork.updated_at,
      deleted_at: row.artwork.deleted_at,
      artist: row.artists ? {
        id: row.artists.id,
        name: row.artists.name,
        slug: row.artists.slug,
        profile_picture: row.artists.profile_picture,
        bio: row.artists.bio,
        created_at: row.artists.created_at,
        updated_at: row.artists.updated_at,
        deleted_at: row.artists.deleted_at,
      } : undefined,
    } as Artwork;
  }).filter(Boolean) as Artwork[];
}

export async function getArtist(id: string) {
  const result = await db
    .select()
    .from(artists)
    .where(eq(artists.id, parseInt(id)));
  return result[0] || null;
}

// Helper function to get artwork by slug
export async function getArtworkBySlug(slug: string, publishedOnly: boolean = false) {
  const result = await db
    .select()
    .from(artwork)
    .leftJoin(artists, eq(artwork.artist_id, artists.id))
    .where(eq(artwork.slug, slug))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0];
  let parsedMeta: Record<string, unknown> = {};
  try {
    parsedMeta = row.artwork.meta ? JSON.parse(row.artwork.meta) : {};
  } catch (error) {
    console.error('Error parsing meta for artwork:', row.artwork.id, error);
    parsedMeta = {};
  }
  
  // If publishedOnly is true, check if artwork is published and from the main artist
  if (publishedOnly) {
    const mainArtistId = process.env.NEXT_PUBLIC_DPOP_ARTIST_ID;
    if (!mainArtistId || 
        row.artwork.artist_id !== parseInt(mainArtistId) || 
        parsedMeta.status !== 'published') {
      return null;
    }
  }
  
  return {
    id: row.artwork.id,
    slug: row.artwork.slug,
    title: row.artwork.title,
    description: row.artwork.description,
    type: row.artwork.type,
    artist_id: row.artwork.artist_id,
    image: row.artwork.image,
    category: row.artwork.category,
    data: {
      ...(row.artwork.data ? JSON.parse(row.artwork.data) : {}),
      image: row.artwork.image,
      category: row.artwork.category,
    },
    meta: parsedMeta,
    created_at: row.artwork.created_at,
    updated_at: row.artwork.updated_at,
    deleted_at: row.artwork.deleted_at,
    artist: row.artists ? {
      id: row.artists.id,
      name: row.artists.name,
      slug: row.artists.slug,
      profile_picture: row.artists.profile_picture,
      bio: row.artists.bio,
      created_at: row.artists.created_at,
      updated_at: row.artists.updated_at,
      deleted_at: row.artists.deleted_at,
    } : undefined,
  } as Artwork;
}

// Helper function to create new artwork
export async function createArtwork(artworkData: {
  slug: string;
  title: string;
  description?: string;
  type: string;
  artist_id?: number;
  data?: Record<string, unknown>;
  image?: string;
  category?: string;
  meta?: Record<string, unknown>;
}) {
  const result = await db
    .insert(artwork)
    .values({
      slug: artworkData.slug,
      title: artworkData.title,
      description: artworkData.description,
      type: artworkData.type,
      artist_id: artworkData.artist_id,
      image: artworkData.image,
      category: artworkData.category,
      data: artworkData.data ? JSON.stringify({
        ...artworkData.data,
        image: artworkData.image,
        category: artworkData.category,
      }) : null,
      meta: artworkData.meta ? JSON.stringify(artworkData.meta) : null,
    })
    .returning();
  
  return result[0];
}

// Helper function to get all artists
export async function getAllArtists() {
  return await db
    .select()
    .from(artists)
    .where(isNull(artists.deleted_at))
    .orderBy(asc(artists.name));
}

// Helper function to get artist by slug
export async function getArtistBySlug(slug: string) {
  const result = await db
    .select()
    .from(artists)
    .where(eq(artists.slug, slug))
    .limit(1);
  
  return result[0] || null;
}

// Tattoo helper functions
export async function getAllTattoos() {
  const result = await db
    .select()
    .from(tattoos)
    .leftJoin(artists, eq(tattoos.artist_id, artists.id))
    .where(isNull(tattoos.deleted_at))
    .orderBy(asc(tattoos.sort_order), desc(tattoos.created_at));
  
  return result.map(row => {
    let parsedMeta = {};
    let parsedData = {};
    try {
      parsedMeta = row.tattoos.meta ? JSON.parse(row.tattoos.meta) : {};
    } catch (error) {
      console.error('Error parsing meta for tattoo:', row.tattoos.id, error);
      parsedMeta = {};
    }
    try {
      parsedData = row.tattoos.data ? JSON.parse(row.tattoos.data) : {};
    } catch (error) {
      console.error('Error parsing data for tattoo:', row.tattoos.id, error);
      parsedData = {};
    }
    
    return {
      ...row.tattoos,
      meta: parsedMeta,
      data: parsedData,
      artist: row.artists ? {
        id: row.artists.id,
        name: row.artists.name,
        slug: row.artists.slug,
        profile_picture: row.artists.profile_picture,
        bio: row.artists.bio,
        created_at: row.artists.created_at,
        updated_at: row.artists.updated_at,
        deleted_at: row.artists.deleted_at,
      } : undefined,
    };
  });
}

export async function getTattooBySlug(slug: string) {
  const result = await db
    .select()
    .from(tattoos)
    .leftJoin(artists, eq(tattoos.artist_id, artists.id))
    .where(and(
      eq(tattoos.slug, slug),
      isNull(tattoos.deleted_at)
    ))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0];
  let parsedMeta: Record<string, unknown> = {};
  let parsedData: Record<string, unknown> = {};
  
  try {
    parsedMeta = row.tattoos.meta ? JSON.parse(row.tattoos.meta) : {};
  } catch (error) {
    console.error('Error parsing meta for tattoo:', row.tattoos.id, error);
  }
  
  try {
    parsedData = row.tattoos.data ? JSON.parse(row.tattoos.data) : {};
  } catch (error) {
    console.error('Error parsing data for tattoo:', row.tattoos.id, error);
  }
  
  return {
    ...row.tattoos,
    meta: parsedMeta,
    data: parsedData,
    artist: row.artists ? {
      id: row.artists.id,
      name: row.artists.name,
      slug: row.artists.slug,
      profile_picture: row.artists.profile_picture,
      bio: row.artists.bio,
      created_at: row.artists.created_at,
      updated_at: row.artists.updated_at,
      deleted_at: row.artists.deleted_at,
    } : undefined,
  };
}

// Batch update artwork sort order
export async function updateArtworkOrder(updates: { id: number; sort_order: number }[]) {
  const results = [];
  for (const update of updates) {
    const result = await db
      .update(artwork)
      .set({ sort_order: update.sort_order })
      .where(eq(artwork.id, update.id))
      .returning();
    results.push(result[0]);
  }
  return results;
}

// Batch update tattoo sort order
export async function updateTattooOrder(updates: { id: number; sort_order: number }[]) {
  const results = [];
  for (const update of updates) {
    const result = await db
      .update(tattoos)
      .set({ sort_order: update.sort_order })
      .where(eq(tattoos.id, update.id))
      .returning();
    results.push(result[0]);
  }
  return results;
}

// ============================================
// Work Relationships Functions
// ============================================

export interface LinkedWork {
  id: number;
  slug: string;
  title: string;
  image: string | null;
  type: 'artwork' | 'tattoo';
  category?: string | null;
  relationship_type?: string;
}

// Get all linked works for a given entity (artwork or tattoo)
export async function getLinkedWorks(
  entityType: 'artwork' | 'tattoo', 
  entityId: number
): Promise<LinkedWork[]> {
  const { workRelationships } = await import('../../db/schema');
  const { or } = await import('drizzle-orm');
  
  // Get relationships where this entity is either source or target
  const relationships = await db
    .select()
    .from(workRelationships)
    .where(
      or(
        and(
          eq(workRelationships.source_entity_type, entityType),
          eq(workRelationships.source_entity_id, entityId)
        ),
        and(
          eq(workRelationships.target_entity_type, entityType),
          eq(workRelationships.target_entity_id, entityId)
        )
      )
    );
  
  const linkedWorks: LinkedWork[] = [];
  
  // For each relationship, fetch the linked entity
  for (const rel of relationships) {
    // Determine which side is the "other" work
    const isSource = rel.source_entity_type === entityType && rel.source_entity_id === entityId;
    const linkedType = isSource ? rel.target_entity_type : rel.source_entity_type;
    const linkedId = isSource ? rel.target_entity_id : rel.source_entity_id;
    
    try {
      if (linkedType === 'artwork') {
        const artworkData = await db
          .select({
            id: artwork.id,
            slug: artwork.slug,
            title: artwork.title,
            image: artwork.image,
            category: artwork.category,
          })
          .from(artwork)
          .where(and(eq(artwork.id, linkedId), isNull(artwork.deleted_at)))
          .limit(1);
        
        if (artworkData.length > 0) {
          linkedWorks.push({
            ...artworkData[0],
            type: 'artwork',
            relationship_type: rel.relationship_type || 'related',
          });
        }
      } else if (linkedType === 'tattoo') {
        const tattooData = await db
          .select({
            id: tattoos.id,
            slug: tattoos.slug,
            title: tattoos.title,
            image: tattoos.image,
            category: tattoos.category,
          })
          .from(tattoos)
          .where(and(eq(tattoos.id, linkedId), isNull(tattoos.deleted_at)))
          .limit(1);
        
        if (tattooData.length > 0) {
          linkedWorks.push({
            ...tattooData[0],
            type: 'tattoo',
            relationship_type: rel.relationship_type || 'related',
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching linked ${linkedType} ${linkedId}:`, error);
    }
  }
  
  return linkedWorks;
}

// Create a work relationship (bidirectional - creates both directions)
export async function createWorkRelationship(
  sourceType: 'artwork' | 'tattoo',
  sourceId: number,
  targetType: 'artwork' | 'tattoo',
  targetId: number,
  relationshipType: string = 'related'
) {
  const { workRelationships } = await import('../../db/schema');
  
  // Create the forward relationship
  const forwardResult = await db
    .insert(workRelationships)
    .values({
      source_entity_type: sourceType,
      source_entity_id: sourceId,
      target_entity_type: targetType,
      target_entity_id: targetId,
      relationship_type: relationshipType,
    })
    .returning();
  
  return forwardResult[0];
}

// Delete a work relationship (removes the specific relationship)
export async function deleteWorkRelationship(relationshipId: number) {
  const { workRelationships } = await import('../../db/schema');
  
  const result = await db
    .delete(workRelationships)
    .where(eq(workRelationships.id, relationshipId))
    .returning();
  
  return result[0];
}

// Delete a work relationship by entities (removes both directions)
export async function deleteWorkRelationshipByEntities(
  sourceType: 'artwork' | 'tattoo',
  sourceId: number,
  targetType: 'artwork' | 'tattoo',
  targetId: number
) {
  const { workRelationships } = await import('../../db/schema');
  const { or } = await import('drizzle-orm');
  
  // Delete both directions of the relationship
  const result = await db
    .delete(workRelationships)
    .where(
      or(
        and(
          eq(workRelationships.source_entity_type, sourceType),
          eq(workRelationships.source_entity_id, sourceId),
          eq(workRelationships.target_entity_type, targetType),
          eq(workRelationships.target_entity_id, targetId)
        ),
        and(
          eq(workRelationships.source_entity_type, targetType),
          eq(workRelationships.source_entity_id, targetId),
          eq(workRelationships.target_entity_type, sourceType),
          eq(workRelationships.target_entity_id, sourceId)
        )
      )
    )
    .returning();
  
  return result;
}

// Search for works across artwork and tattoos
export async function searchWorks(query: string, limit: number = 20): Promise<LinkedWork[]> {
  const { like } = await import('drizzle-orm');
  const searchPattern = `%${query}%`;
  
  const results: LinkedWork[] = [];
  
  // Search artwork
  try {
    const artworkResults = await db
      .select({
        id: artwork.id,
        slug: artwork.slug,
        title: artwork.title,
        image: artwork.image,
        category: artwork.category,
      })
      .from(artwork)
      .where(and(
        like(artwork.title, searchPattern),
        isNull(artwork.deleted_at)
      ))
      .limit(limit);
    
    results.push(...artworkResults.map(a => ({ ...a, type: 'artwork' as const })));
  } catch (error) {
    console.error('Error searching artwork:', error);
  }
  
  // Search tattoos
  try {
    const tattooResults = await db
      .select({
        id: tattoos.id,
        slug: tattoos.slug,
        title: tattoos.title,
        image: tattoos.image,
        category: tattoos.category,
      })
      .from(tattoos)
      .where(and(
        like(tattoos.title, searchPattern),
        isNull(tattoos.deleted_at)
      ))
      .limit(limit);
    
    results.push(...tattooResults.map(t => ({ ...t, type: 'tattoo' as const })));
  } catch (error) {
    console.error('Error searching tattoos:', error);
  }
  
  return results.slice(0, limit);
}