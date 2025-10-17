import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { 
  generateSocialPost, 
  generateCaption, 
  generateHashtags, 
  generateArtistBio, 
  generateArtistStatement, 
  generateEmailTemplate,
  ContentGenerationRequest,
  GeneratedContent
} from '@/lib/ai/contentGeneration';
import { db } from '@/lib/db';
import { artwork, tattoos } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

interface ContentGenerationRequestBody {
  contentType: 'social-post' | 'caption' | 'hashtags' | 'bio' | 'artist-statement' | 'email';
  platform: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'email';
  tone: 'professional' | 'casual' | 'hype' | 'minimal' | 'storytelling' | 'educational';
  artistId: number;
  entityId?: number;
  entityType?: 'artwork' | 'tattoo';
  additionalContext?: string;
}

// Helper function to get entity data
async function getEntityData(entityId: number, entityType: string) {
  try {
    if (entityType === 'artwork') {
      const entity = await db.query.artwork.findFirst({
        where: eq(artwork.id, entityId),
        columns: {
          id: true,
          title: true,
          description: true,
          type: true,
          category: true,
        }
      });
      return entity ? {
        id: entity.id,
        title: entity.title,
        description: entity.description || undefined,
        type: entity.type,
        category: entity.category || undefined,
        tags: []
      } : undefined;
    } else if (entityType === 'tattoo') {
      const entity = await db.query.tattoos.findFirst({
        where: eq(tattoos.id, entityId),
        columns: {
          id: true,
          title: true,
          description: true,
          category: true,
          style: true,
        }
      });
      return entity ? {
        id: entity.id,
        title: entity.title,
        description: entity.description || undefined,
        type: 'tattoo',
        category: entity.category || undefined,
        tags: [entity.style].filter(Boolean).filter((tag): tag is string => tag !== null)
      } : undefined;
    }
    return undefined;
  } catch (error) {
    console.error('Error fetching entity data:', error);
    return undefined;
  }
}

// Helper function to get artist data
async function getArtistData(artistId: number) {
  try {
    const artist = await db.query.artists.findFirst({
      where: eq(artwork.artist_id, artistId),
      columns: {
        id: true,
        name: true,
        bio: true,
        tags: true,
      }
    });
    return artist ? {
      id: artist.id,
      name: artist.name,
      bio: artist.bio,
      tags: artist.tags ? JSON.parse(artist.tags) : []
    } : undefined;
  } catch (error) {
    console.error('Error fetching artist data:', error);
    return undefined;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { 
      contentType, 
      platform, 
      tone, 
      artistId, 
      entityId, 
      entityType, 
      additionalContext 
    }: ContentGenerationRequestBody = req.body;

    // Validate required fields
    if (!contentType || !platform || !tone || !artistId) {
      return res.status(400).json({ 
        error: 'Missing required fields: contentType, platform, tone, artistId' 
      });
    }

    // Fetch artist data
    const artistData = await getArtistData(artistId);
    if (!artistData) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Fetch entity data if provided
    const entityData = entityId && entityType ? await getEntityData(entityId, entityType) : undefined;

    // Fetch portfolio data for context
    let portfolioData = null;
    try {
      const portfolioResponse = await fetch(`${req.headers.origin}/api/marketing-assistant/portfolio-data?artistId=${artistId}`);
      if (portfolioResponse.ok) {
        portfolioData = await portfolioResponse.json();
      }
    } catch (error) {
      console.warn('Failed to fetch portfolio data:', error);
    }

    // Build content generation request
    const contentRequest: ContentGenerationRequest = {
      contentType,
      platform,
      tone,
      entityData,
      artistData: {
        name: artistData.name,
        bio: artistData.bio || undefined,
        style: undefined, // Could be enhanced to extract from tags
        medium: undefined, // Could be enhanced to extract from tags
        tags: artistData.tags
      },
      portfolioInsights: portfolioData ? {
        topColors: portfolioData.media?.topColors || [],
        commonSubjects: portfolioData.media?.commonSubjects || [],
        mostCommonStyle: portfolioData.analytics?.mostCommonStyle || '',
        mostCommonCategory: portfolioData.analytics?.mostCommonCategory || ''
      } : undefined,
      additionalContext
    };

    // Generate content based on type
    let generatedContent: GeneratedContent;

    switch (contentType) {
      case 'social-post':
        generatedContent = await generateSocialPost(contentRequest);
        break;
      case 'caption':
        generatedContent = await generateCaption(contentRequest);
        break;
      case 'hashtags':
        const hashtags = await generateHashtags(contentRequest);
        generatedContent = {
          content: hashtags.join(' '),
          hashtags,
          platform,
          tone,
          characterCount: hashtags.join(' ').length,
          metadata: {
            ctas: [],
            mentions: [],
            keywords: [],
            estimatedEngagement: 'Medium'
          }
        };
        break;
      case 'bio':
        generatedContent = await generateArtistBio(contentRequest);
        break;
      case 'artist-statement':
        generatedContent = await generateArtistStatement(contentRequest);
        break;
      case 'email':
        generatedContent = await generateEmailTemplate(contentRequest);
        break;
      default:
        return res.status(400).json({ error: 'Invalid content type' });
    }

    // Return generated content with metadata
    res.status(200).json({
      success: true,
      generatedContent,
      metadata: {
        artistId,
        entityId,
        entityType,
        generatedAt: new Date().toISOString(),
        platform,
        tone,
        contentType
      }
    });

  } catch (error) {
    console.error('Content generation API error:', error);
    res.status(500).json({ 
      error: 'Failed to generate content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
