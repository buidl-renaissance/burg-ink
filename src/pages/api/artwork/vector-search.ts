import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../db/index';
import { artwork } from '../../../../db/schema';
import { isNull } from 'drizzle-orm';
import { OpenAIEmbeddings } from '@langchain/openai';

interface ArtworkWithSimilarity {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  image: string | null;
  category: string | null;
  type: string;
  similarity: number;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, limit = 10 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({ error: 'Limit must be between 1 and 50' });
    }

    // Generate embedding for the query
    const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });
    const queryVector = await embeddings.embedQuery(query);

    // Get all artwork with embeddings
    const allArtwork = await db
      .select({
        id: artwork.id,
        title: artwork.title,
        description: artwork.description,
        slug: artwork.slug,
        image: artwork.image,
        category: artwork.category,
        type: artwork.type,
        embedding: artwork.embedding
      })
      .from(artwork)
      .where(isNull(artwork.deleted_at));

    // Calculate similarities
    const similarities = allArtwork
      .filter((art) => art.embedding) // Only include artwork with embeddings
      .map((art) => {
        try {
          const embeddingBuffer = art.embedding as Buffer;
          const embedding = new Float32Array(embeddingBuffer.buffer, embeddingBuffer.byteOffset, embeddingBuffer.length / 4);
          
          // Calculate cosine similarity
          const similarity = cosineSimilarity(queryVector, Array.from(embedding));
          
          return {
            id: art.id,
            title: art.title,
            description: art.description,
            slug: art.slug,
            image: art.image,
            category: art.category,
            type: art.type,
            similarity
          } as ArtworkWithSimilarity;
        } catch (error) {
          console.error(`Failed to process embedding for artwork ${art.id}:`, error);
          return null;
        }
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => b!.similarity - a!.similarity) // Sort by similarity (highest first)
      .slice(0, limitNum);

    res.status(200).json({
      query,
      results: similarities,
      total: similarities.length
    });
  } catch (error) {
    console.error('Error in vector search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 