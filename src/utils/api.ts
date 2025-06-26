import { Artwork, Artist } from './interfaces';

// API base URL
const API_BASE = '/api';

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.data;
}

// Artwork API functions
export async function createArtwork(artworkData: {
  title: string;
  description?: string;
  artist_id?: number;
  image?: string;
  type?: string;
  slug?: string;
  category?: string;
  is_for_sale?: boolean;
  price?: number;
  meta?: Record<string, unknown>;
}): Promise<Artwork> {
  // Generate slug if not provided
  const slug = artworkData.slug || generateSlug(artworkData.title);
  
  const response = await fetch(`${API_BASE}/artwork`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...artworkData,
      slug,
      type: artworkData.type || 'artwork',
    }),
  });

  return handleApiResponse<Artwork>(response);
}

export async function updateArtwork(artworkData: {
  id: number;
  title?: string;
  description?: string;
  artist_id?: number;
  image?: string;
  type?: string;
  slug?: string;
  category?: string;
  is_for_sale?: boolean;
  price?: number;
  meta?: Record<string, unknown>;
}): Promise<Artwork> {
  const response = await fetch(`${API_BASE}/artwork/${artworkData.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(artworkData),
  });

  return handleApiResponse<Artwork>(response);
}

export async function getArtwork(id: number): Promise<Artwork> {
  const response = await fetch(`${API_BASE}/artwork/${id}`);
  return handleApiResponse<Artwork>(response);
}

export async function getArtworkBySlug(slug: string): Promise<Artwork> {
  const response = await fetch(`${API_BASE}/artwork/slug/${slug}`);
  return handleApiResponse<Artwork>(response);
}

export async function getAllArtwork(): Promise<Artwork[]> {
  const response = await fetch(`${API_BASE}/artwork`);
  return handleApiResponse<Artwork[]>(response);
}

export async function updateArtworkStatus(id: number, status: string): Promise<Artwork> {
  console.log('API: Updating artwork status', { id, status });
  const response = await fetch(`${API_BASE}/artwork/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      meta: { status },
    }),
  });

  console.log('API: Response status:', response.status);
  const result = await handleApiResponse<Artwork>(response);
  console.log('API: Response data:', result);
  return result;
}

// Artist API functions
export async function getArtist(id: string | number): Promise<Artist> {
  const response = await fetch(`${API_BASE}/drizzle/artists?id=${id}`);
  return handleApiResponse<Artist>(response);
}

export async function getArtists(): Promise<Artist[]> {
  const response = await fetch(`${API_BASE}/drizzle/artists`);
  return handleApiResponse<Artist[]>(response);
}

// Utility function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50);
} 