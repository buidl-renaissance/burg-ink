import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedUser } from '@/lib/auth';

interface ExportProfileResponse {
  success: boolean;
  profile: {
    artist: {
      name: string;
      bio?: string;
      style?: string;
      medium?: string;
      tags?: string[];
    };
    portfolio: {
      artworkCount: number;
      tattooCount: number;
      styles: string[];
      categories: string[];
      topColors: string[];
      commonSubjects: string[];
      portfolioDiversity: number;
    };
    marketing: {
      generatedBios: string[];
      suggestedHashtags: string[];
      platformRecommendations: Record<string, string[]>;
      contentTemplates: string[];
    };
    analytics: {
      totalPortfolioItems: number;
      mostCommonStyle: string;
      mostCommonCategory: string;
      averageConfidence: number;
    };
  };
  exportData: {
    format: 'json';
    timestamp: string;
    version: string;
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

    // Fetch portfolio data
    let portfolioData = null;
    try {
      const portfolioResponse = await fetch(`${req.headers.origin}/api/marketing-assistant/portfolio-data?artistId=${artistId}`);
      if (portfolioResponse.ok) {
        portfolioData = await portfolioResponse.json();
      }
    } catch (error) {
      console.warn('Failed to fetch portfolio data:', error);
    }

    // Generate marketing content samples (this would typically use the AI)
    const marketingContent = await generateMarketingSamples(portfolioData);

    // Build export profile
    const exportProfile: ExportProfileResponse = {
      success: true,
      profile: {
        artist: {
          name: portfolioData?.artist?.name || 'Unknown Artist',
          bio: portfolioData?.artist?.bio,
          style: portfolioData?.analytics?.mostCommonStyle,
          medium: 'Mixed Media', // This could be determined from portfolio analysis
          tags: portfolioData?.artist?.tags || []
        },
        portfolio: {
          artworkCount: portfolioData?.artwork?.count || 0,
          tattooCount: portfolioData?.tattoos?.count || 0,
          styles: [
            ...(portfolioData?.artwork?.styles || []),
            ...(portfolioData?.tattoos?.styles || [])
          ].filter((value, index, self) => self.indexOf(value) === index), // Remove duplicates
          categories: [
            ...(portfolioData?.artwork?.categories || []),
            ...(portfolioData?.tattoos?.categories || [])
          ].filter((value, index, self) => self.indexOf(value) === index),
          topColors: portfolioData?.media?.topColors || [],
          commonSubjects: portfolioData?.media?.commonSubjects || [],
          portfolioDiversity: portfolioData?.analytics?.portfolioDiversity || 0
        },
        marketing: marketingContent,
        analytics: {
          totalPortfolioItems: portfolioData?.analytics?.totalPortfolioItems || 0,
          mostCommonStyle: portfolioData?.analytics?.mostCommonStyle || 'Unknown',
          mostCommonCategory: portfolioData?.analytics?.mostCommonCategory || 'Unknown',
          averageConfidence: portfolioData?.media?.aiInsights?.averageConfidence || 0
        }
      },
      exportData: {
        format: 'json',
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    };

    // Set headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="artist-profile-${artistId}-${Date.now()}.json"`);

    return res.status(200).json(exportProfile);

  } catch (error) {
    console.error('Export profile API error:', error);
    return res.status(500).json({ 
      error: 'Failed to export profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export interface PortfolioData {
  artist: {
    name: string;
    bio?: string;
    style?: string;
    medium?: string;
    tags?: string[];
  };
  analytics: {
    mostCommonStyle: string;
    mostCommonCategory: string;
    portfolioDiversity: number;
  };
  media: {
    topColors: string[];
    commonSubjects: string[];
  };
}

async function generateMarketingSamples(portfolioData: PortfolioData) {
  // This is a simplified version - in a real implementation, you'd use the AI
  const artistName = portfolioData?.artist?.name || 'Artist';
  const style = portfolioData?.analytics?.mostCommonStyle || 'contemporary';
  const colors = portfolioData?.media?.topColors || ['blue', 'red'];
  const subjects = portfolioData?.media?.commonSubjects || ['abstract', 'portrait'];

  return {
    generatedBios: [
      `${artistName} is a ${style} artist specializing in ${colors.join(' and ')} compositions.`,
      `Contemporary artist ${artistName} creates ${subjects.join(' and ')} works that explore themes of identity and expression.`,
      `${artistName} brings a unique perspective to ${style} art, blending traditional techniques with modern sensibilities.`
    ],
    suggestedHashtags: [
      '#art', '#artist', '#contemporaryart', '#painting', '#drawing',
      `#${style}`, `#${colors[0]}`, `#${subjects[0]}`,
      '#detroit', '#michigan', '#localartist', '#originalart'
    ],
    platformRecommendations: {
      instagram: [
        'Post consistently (1-2 times per day)',
        'Use high-quality images',
        'Engage with comments within 2 hours',
        'Use Stories for behind-the-scenes content',
        'Include location tags'
      ],
      facebook: [
        'Share longer-form content',
        'Use Facebook Groups for community building',
        'Post when your audience is most active',
        'Include call-to-action buttons'
      ],
      twitter: [
        'Keep posts concise and punchy',
        'Use trending hashtags strategically',
        'Engage in conversations',
        'Post multiple times per day'
      ],
      tiktok: [
        'Create vertical video content',
        'Use trending sounds and effects',
        'Post consistently (1-3 times per day)',
        'Engage with comments quickly'
      ]
    },
    contentTemplates: [
      'Artwork showcase with behind-the-scenes story',
      'Process video showing creation techniques',
      'Artist statement with personal insights',
      'Community engagement post asking for feedback'
    ]
  };
}
