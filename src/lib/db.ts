import { db, artwork, artists } from '../../db';
import { eq, desc, asc, isNull } from 'drizzle-orm';

// Re-export the database instance
export { db };

// Helper function to get all artwork with artist information
export async function getAllArtwork() {
  const result = await db
    .select()
    .from(artwork)
    .leftJoin(artists, eq(artwork.artist_id, artists.id))
    .orderBy(desc(artwork.created_at));
  
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
      artist: row.artists ? {
        id: row.artists.id,
        name: row.artists.name,
        handle: row.artists.handle,
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

export async function getArtist(id: string) {
  const result = await db
    .select()
    .from(artists)
    .where(eq(artists.id, parseInt(id)));
  return result[0] || null;
}

// Helper function to get artwork by slug
export async function getArtworkBySlug(slug: string) {
  const result = await db
    .select()
    .from(artwork)
    .leftJoin(artists, eq(artwork.artist_id, artists.id))
    .where(eq(artwork.slug, slug))
    .limit(1);
  
  if (result.length === 0) return null;
  
  const row = result[0];
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
    artist: row.artists ? {
      id: row.artists.id,
      name: row.artists.name,
      handle: row.artists.handle,
      slug: row.artists.slug,
      profile_picture: row.artists.profile_picture,
      bio: row.artists.bio,
      created_at: row.artists.created_at,
      updated_at: row.artists.updated_at,
      deleted_at: row.artists.deleted_at,
    } : undefined,
  };
}

// Helper function to create new artwork
export async function createArtwork(artworkData: {
  slug: string;
  title: string;
  description?: string;
  type: string;
  artist_id?: number;
  image?: string;
  category?: string;
  is_for_sale?: boolean;
  price?: number;
  meta?: Record<string, unknown>;
}) {
  const result = await db
    .insert(artwork)
    .values({
      ...artworkData,
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