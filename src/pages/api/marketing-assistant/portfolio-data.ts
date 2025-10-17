import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { artists, artwork, tattoos, media } from '../../../../db/schema';
import { eq, and, isNull, count, desc } from 'drizzle-orm';

interface PortfolioSummary {
  artist: {
    id: number;
    name: string;
    bio: string | null;
    tags: string[];
  };
  artwork: {
    count: number;
    styles: string[];
    categories: string[];
    recent: Array<{
      id: number;
      title: string;
      type: string;
      category: string | null;
    }>;
  };
  tattoos: {
    count: number;
    styles: string[];
    categories: string[];
    placements: string[];
    recent: Array<{
      id: number;
      title: string;
      category: string | null;
      placement: string | null;
      style: string | null;
    }>;
  };
  media: {
    count: number;
    topColors: string[];
    commonSubjects: string[];
    aiInsights: {
      averageConfidence: number;
      topDetectedTypes: string[];
    };
  };
  analytics: {
    totalPortfolioItems: number;
    mostCommonStyle: string | null;
    mostCommonCategory: string | null;
    portfolioDiversity: number; // 0-1 score based on variety of styles/categories
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getAuthorizedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { artistId } = req.query;

    if (!artistId || typeof artistId !== 'string') {
      return res.status(400).json({ error: 'Artist ID is required' });
    }

    const artistIdNum = parseInt(artistId);
    if (isNaN(artistIdNum)) {
      return res.status(400).json({ error: 'Invalid artist ID' });
    }

    // Fetch artist information
    const artist = await db.query.artists.findFirst({
      where: eq(artists.id, artistIdNum),
      columns: {
        id: true,
        name: true,
        bio: true,
        tags: true,
      }
    });

    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Fetch artwork data
    const artworkData = await db.query.artwork.findMany({
      where: and(
        eq(artwork.artist_id, artistIdNum),
        isNull(artwork.deleted_at)
      ),
      columns: {
        id: true,
        title: true,
        type: true,
        category: true,
      },
      orderBy: desc(artwork.created_at),
      limit: 10
    });

    const artworkCount = await db.select({ count: count() })
      .from(artwork)
      .where(and(
        eq(artwork.artist_id, artistIdNum),
        isNull(artwork.deleted_at)
      ));

    // Fetch tattoo data
    const tattooData = await db.query.tattoos.findMany({
      where: and(
        eq(tattoos.artist_id, artistIdNum),
        isNull(tattoos.deleted_at)
      ),
      columns: {
        id: true,
        title: true,
        category: true,
        placement: true,
        style: true,
      },
      orderBy: desc(tattoos.created_at),
      limit: 10
    });

    const tattooCount = await db.select({ count: count() })
      .from(tattoos)
      .where(and(
        eq(tattoos.artist_id, artistIdNum),
        isNull(tattoos.deleted_at)
      ));

    // Fetch media data for AI analysis
    const mediaData = await db.query.media.findMany({
      where: and(
        eq(media.user_id, user.id),
        isNull(media.detections) // Only get media with AI analysis
      ),
      columns: {
        id: true,
        detections: true,
        detected_type: true,
        detection_confidence: true,
      }
    });

    // Process media data for AI insights
    const mediaInsights = processMediaInsights(mediaData);

    // Calculate analytics
    const analytics = calculatePortfolioAnalytics(artworkData, tattooData);

    const portfolioSummary: PortfolioSummary = {
      artist: {
        id: artist.id,
        name: artist.name,
        bio: artist.bio,
        tags: artist.tags ? JSON.parse(artist.tags) : []
      },
      artwork: {
        count: artworkCount[0].count,
        styles: extractUniqueValues(artworkData, 'type'),
        categories: extractUniqueValues(artworkData, 'category'),
        recent: artworkData.map(item => ({
          id: item.id,
          title: item.title,
          type: item.type,
          category: item.category
        }))
      },
      tattoos: {
        count: tattooCount[0].count,
        styles: extractUniqueValues(tattooData, 'style'),
        categories: extractUniqueValues(tattooData, 'category'),
        placements: extractUniqueValues(tattooData, 'placement'),
        recent: tattooData.map(item => ({
          id: item.id,
          title: item.title,
          category: item.category,
          placement: item.placement,
          style: item.style
        }))
      },
      media: {
        count: mediaData.length,
        topColors: mediaInsights.topColors,
        commonSubjects: mediaInsights.commonSubjects,
        aiInsights: {
          averageConfidence: mediaInsights.averageConfidence,
          topDetectedTypes: mediaInsights.topDetectedTypes
        }
      },
      analytics
    };

    res.status(200).json(portfolioSummary);

  } catch (error) {
    console.error('Portfolio data API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch portfolio data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function processMediaInsights(mediaData: Array<{
  id: string;
  detections: string | null;
  detected_type: string | null;
  detection_confidence: string | null;
}>): {
  topColors: string[];
  commonSubjects: string[];
  averageConfidence: number;
  topDetectedTypes: string[];
} {
  const colorMap = new Map<string, number>();
  const subjectMap = new Map<string, number>();
  const typeMap = new Map<string, number>();
  let totalConfidence = 0;
  let confidenceCount = 0;

  mediaData.forEach(item => {
    if (item.detections) {
      try {
        const detections = JSON.parse(item.detections);
        
        // Extract colors
        if (detections.colors && Array.isArray(detections.colors)) {
          detections.colors.forEach((color: string) => {
            colorMap.set(color, (colorMap.get(color) || 0) + 1);
          });
        }

        // Extract subjects
        if (detections.subjects && Array.isArray(detections.subjects)) {
          detections.subjects.forEach((subject: string) => {
            subjectMap.set(subject, (subjectMap.get(subject) || 0) + 1);
          });
        }
      } catch (error) {
        console.warn('Failed to parse media detections:', error);
      }
    }

    // Track detected types
    if (item.detected_type) {
      typeMap.set(item.detected_type, (typeMap.get(item.detected_type) || 0) + 1);
    }

    // Track confidence
    if (item.detection_confidence) {
      const confidence = parseFloat(item.detection_confidence);
      if (!isNaN(confidence)) {
        totalConfidence += confidence;
        confidenceCount++;
      }
    }
  });

  return {
    topColors: Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([color]) => color),
    commonSubjects: Array.from(subjectMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([subject]) => subject),
    averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
    topDetectedTypes: Array.from(typeMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type)
  };
}

function extractUniqueValues(data: Array<Record<string, unknown>>, field: string): string[] {
  const values = new Set<string>();
  data.forEach(item => {
    const value = item[field];
    if (value && typeof value === 'string') {
      values.add(value);
    }
  });
  return Array.from(values);
}

function calculatePortfolioAnalytics(artworkData: Array<Record<string, unknown>>, tattooData: Array<Record<string, unknown>>): {
  totalPortfolioItems: number;
  mostCommonStyle: string | null;
  mostCommonCategory: string | null;
  portfolioDiversity: number;
} {
  const allItems = [...artworkData, ...tattooData];
  const styleMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();

  // Count styles and categories
  allItems.forEach(item => {
    if (item.type && typeof item.type === 'string') {
      styleMap.set(item.type, (styleMap.get(item.type) || 0) + 1);
    }
    if (item.category && typeof item.category === 'string') {
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
    }
  });

  // Find most common
  const mostCommonStyle = Array.from(styleMap.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
  const mostCommonCategory = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  // Calculate diversity score (0-1, higher = more diverse)
  const totalStyles = styleMap.size;
  const totalCategories = categoryMap.size;
  const totalItems = allItems.length;
  const maxPossibleVariety = Math.min(totalItems, 10); // Cap at 10 for scoring
  
  const styleDiversity = totalItems > 0 ? Math.min(totalStyles / maxPossibleVariety, 1) : 0;
  const categoryDiversity = totalItems > 0 ? Math.min(totalCategories / maxPossibleVariety, 1) : 0;
  const portfolioDiversity = (styleDiversity + categoryDiversity) / 2;

  return {
    totalPortfolioItems: allItems.length,
    mostCommonStyle,
    mostCommonCategory,
    portfolioDiversity
  };
}
