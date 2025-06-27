import { Artwork } from '@/utils/interfaces';
import { db, artwork, artists } from '../../db';
import { eq, desc, asc, isNull, and } from 'drizzle-orm';

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
    .orderBy(desc(artwork.created_at));
  
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