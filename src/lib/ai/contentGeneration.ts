import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ContentGenerationRequest {
  contentType: 'social-post' | 'caption' | 'hashtags' | 'bio' | 'artist-statement' | 'email';
  platform: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'email';
  tone: 'professional' | 'casual' | 'hype' | 'minimal' | 'storytelling' | 'educational';
  entityData?: {
    id: number;
    title: string;
    description?: string;
    type: string;
    category?: string;
    tags?: string[];
  };
  artistData: {
    name: string;
    bio?: string;
    style?: string;
    medium?: string;
    tags?: string[];
  };
  portfolioInsights?: {
    topColors: string[];
    commonSubjects: string[];
    mostCommonStyle: string;
    mostCommonCategory: string;
    portfolioDiversity?: number;
  };
  additionalContext?: string;
}

export interface GeneratedContent {
  content: string;
  hashtags: string[];
  platform: string;
  tone: string;
  characterCount: number;
  metadata: {
    ctas: string[];
    mentions: string[];
    keywords: string[];
    estimatedEngagement: string;
  };
  variations?: string[];
}

// Platform-specific character limits
const PLATFORM_LIMITS = {
  instagram: 2200,
  facebook: 63206,
  twitter: 280,
  tiktok: 2200,
  email: 10000
};

// Tone-specific prompts
const TONE_PROMPTS = {
  professional: "Use a professional, polished tone that maintains credibility while being approachable.",
  casual: "Use a casual, friendly tone that feels conversational and relatable.",
  hype: "Use an energetic, exciting tone that creates enthusiasm and urgency.",
  minimal: "Use a clean, minimalist tone with concise, impactful language.",
  storytelling: "Use a narrative tone that tells a story and creates emotional connection.",
  educational: "Use an informative, helpful tone that educates and adds value."
};

export async function generateSocialPost(request: ContentGenerationRequest): Promise<GeneratedContent> {
  const { platform, tone, entityData, artistData, portfolioInsights, additionalContext } = request;
  
  const characterLimit = PLATFORM_LIMITS[platform];
  const toneGuidance = TONE_PROMPTS[tone];

  let prompt = `You are an expert social media content creator specializing in art and tattoo marketing. ${toneGuidance}

Generate a ${platform} post for an artist with these details:

Artist: ${artistData.name}
${artistData.bio ? `Bio: ${artistData.bio}` : ''}
${artistData.style ? `Style: ${artistData.style}` : ''}
${artistData.medium ? `Medium: ${artistData.medium}` : ''}

`;

  if (entityData) {
    prompt += `
Content to feature:
- Title: ${entityData.title}
${entityData.description ? `- Description: ${entityData.description}` : ''}
- Type: ${entityData.type}
${entityData.category ? `- Category: ${entityData.category}` : ''}
${entityData.tags ? `- Tags: ${entityData.tags.join(', ')}` : ''}
`;
  }

  if (portfolioInsights) {
    prompt += `
Portfolio insights:
- Top colors: ${portfolioInsights.topColors.join(', ')}
- Common subjects: ${portfolioInsights.commonSubjects.join(', ')}
- Most common style: ${portfolioInsights.mostCommonStyle}
- Most common category: ${portfolioInsights.mostCommonCategory}
`;
  }

  if (additionalContext) {
    prompt += `
Additional context: ${additionalContext}
`;
  }

  prompt += `

Requirements:
- Platform: ${platform} (${characterLimit} character limit)
- Tone: ${tone}
- Include relevant hashtags (mix of trending, niche, and branded)
- Include a call-to-action
- Make it engaging and authentic
- Focus on the art/artist story

Return your response as a JSON object with this structure:
{
  "content": "The main post content",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "ctas": ["CTA option 1", "CTA option 2"],
  "mentions": ["@mention1", "@mention2"],
  "keywords": ["keyword1", "keyword2"],
  "estimatedEngagement": "High/Medium/Low",
  "variations": ["Alternative version 1", "Alternative version 2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert social media content creator with deep knowledge of art marketing, platform best practices, and engagement strategies. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    return {
      content: parsed.content,
      hashtags: parsed.hashtags || [],
      platform,
      tone,
      characterCount: parsed.content.length,
      metadata: {
        ctas: parsed.ctas || [],
        mentions: parsed.mentions || [],
        keywords: parsed.keywords || [],
        estimatedEngagement: parsed.estimatedEngagement || 'Medium'
      },
      variations: parsed.variations || []
    };

  } catch (error) {
    console.error('Error generating social post:', error);
    throw new Error(`Failed to generate social post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateCaption(request: ContentGenerationRequest): Promise<GeneratedContent> {
  // Caption is essentially a social post without hashtags
  const captionRequest = { ...request, contentType: 'caption' as const };
  const result = await generateSocialPost(captionRequest);
  
  // Remove hashtags from caption content but keep them separate
  return {
    ...result,
    content: result.content.replace(/#\w+/g, '').trim()
  };
}

export async function generateHashtags(request: ContentGenerationRequest): Promise<string[]> {
  const { entityData, artistData, portfolioInsights } = request;

  const prompt = `Generate relevant hashtags for an artist's social media content.

Artist: ${artistData.name}
${artistData.style ? `Style: ${artistData.style}` : ''}
${artistData.medium ? `Medium: ${artistData.medium}` : ''}

${entityData ? `
Content:
- Title: ${entityData.title}
- Type: ${entityData.type}
${entityData.category ? `- Category: ${entityData.category}` : ''}
${entityData.tags ? `- Tags: ${entityData.tags.join(', ')}` : ''}
` : ''}

${portfolioInsights ? `
Portfolio insights:
- Top colors: ${portfolioInsights.topColors.join(', ')}
- Common subjects: ${portfolioInsights.commonSubjects.join(', ')}
- Most common style: ${portfolioInsights.mostCommonStyle}
- Most common category: ${portfolioInsights.mostCommonCategory}
` : ''}

Generate 15-20 hashtags that include:
1. Trending art/tattoo hashtags
2. Niche/community hashtags
3. Location-based hashtags (Detroit area)
4. Style-specific hashtags
5. Branded hashtags (using artist name/style)

Return as a JSON array of hashtag strings.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in social media hashtag strategy for artists and tattoo artists. Always return valid JSON array."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const hashtags = JSON.parse(content);
    return Array.isArray(hashtags) ? hashtags : [];

  } catch (error) {
    console.error('Error generating hashtags:', error);
    // Return fallback hashtags
    return [
      '#art', '#artist', '#artwork', '#tattoo', '#tattooartist',
      '#detroit', '#michigan', '#localartist', '#commission',
      '#customart', '#originalart', '#artforsale'
    ];
  }
}

export async function generateArtistBio(request: ContentGenerationRequest): Promise<GeneratedContent> {
  const { artistData, portfolioInsights } = request;
  
  const prompt = `Write compelling artist bio variations for ${artistData.name}.

Artist information:
${artistData.bio ? `Current bio: ${artistData.bio}` : ''}
${artistData.style ? `Style: ${artistData.style}` : ''}
${artistData.medium ? `Medium: ${artistData.medium}` : ''}
${artistData.tags ? `Tags: ${artistData.tags.join(', ')}` : ''}

${portfolioInsights ? `
Portfolio insights:
- Top colors: ${portfolioInsights.topColors.join(', ')}
- Common subjects: ${portfolioInsights.commonSubjects.join(', ')}
- Most common style: ${portfolioInsights.mostCommonStyle}
- Most common category: ${portfolioInsights.mostCommonCategory}
- Portfolio diversity score: ${portfolioInsights.portfolioDiversity || 'N/A'}
` : ''}

Create three bio variations:
1. Short bio (50-100 words) - for social media profiles
2. Medium bio (150-250 words) - for website about page
3. Long bio (300-500 words) - for press/portfolio use

Each should:
- Highlight unique style and approach
- Include relevant experience/background
- Mention location (Detroit area)
- Include call-to-action for commissions/appointments
- Be engaging and authentic

Return as JSON:
{
  "short": "Short bio text",
  "medium": "Medium bio text", 
  "long": "Long bio text",
  "keywords": ["keyword1", "keyword2"],
  "ctas": ["CTA1", "CTA2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert copywriter specializing in artist bios and marketing materials. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    return {
      content: parsed.medium || parsed.short || 'Bio generation failed',
      hashtags: [],
      platform: 'general',
      tone: 'professional',
      characterCount: (parsed.medium || parsed.short || '').length,
      metadata: {
        ctas: parsed.ctas || [],
        mentions: [],
        keywords: parsed.keywords || [],
        estimatedEngagement: 'High'
      },
      variations: [parsed.short, parsed.medium, parsed.long].filter(Boolean)
    };

  } catch (error) {
    console.error('Error generating artist bio:', error);
    throw new Error(`Failed to generate artist bio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateArtistStatement(request: ContentGenerationRequest): Promise<GeneratedContent> {
  const { artistData, portfolioInsights } = request;
  
  const prompt = `Write a professional artist statement for ${artistData.name}.

Artist information:
${artistData.bio ? `Bio: ${artistData.bio}` : ''}
${artistData.style ? `Style: ${artistData.style}` : ''}
${artistData.medium ? `Medium: ${artistData.medium}` : ''}
${artistData.tags ? `Tags: ${artistData.tags.join(', ')}` : ''}

${portfolioInsights ? `
Portfolio insights:
- Top colors: ${portfolioInsights.topColors.join(', ')}
- Common subjects: ${portfolioInsights.commonSubjects.join(', ')}
- Most common style: ${portfolioInsights.mostCommonStyle}
- Most common category: ${portfolioInsights.mostCommonCategory}
- Portfolio diversity: ${portfolioInsights.portfolioDiversity || 'N/A'}
` : ''}

Create a comprehensive artist statement (500-800 words) that includes:
1. Artistic philosophy and approach
2. Medium and technique explanations
3. Themes and subject matter
4. Influences and inspiration
5. Process and methodology
6. Goals and aspirations

The statement should be:
- Professional and articulate
- Authentic to the artist's work
- Accessible to general audiences
- Suitable for galleries, exhibitions, and portfolios

Return as JSON:
{
  "statement": "Full artist statement text",
  "summary": "2-3 sentence summary",
  "keywords": ["keyword1", "keyword2"],
  "themes": ["theme1", "theme2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert art writer and curator who specializes in helping artists articulate their practice. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    return {
      content: parsed.statement || 'Artist statement generation failed',
      hashtags: [],
      platform: 'general',
      tone: 'professional',
      characterCount: (parsed.statement || '').length,
      metadata: {
        ctas: [],
        mentions: [],
        keywords: parsed.keywords || [],
        estimatedEngagement: 'High'
      },
      variations: [parsed.summary, parsed.statement].filter(Boolean)
    };

  } catch (error) {
    console.error('Error generating artist statement:', error);
    throw new Error(`Failed to generate artist statement: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateEmailTemplate(request: ContentGenerationRequest): Promise<GeneratedContent> {
  const { artistData, entityData, additionalContext } = request;
  
  const prompt = `Create an email template for ${artistData.name} to send to their audience.

Artist information:
${artistData.bio ? `Bio: ${artistData.bio}` : ''}
${artistData.style ? `Style: ${artistData.style}` : ''}
${artistData.medium ? `Medium: ${artistData.medium}` : ''}

${entityData ? `
Featured content:
- Title: ${entityData.title}
- Description: ${entityData.description || 'No description provided'}
- Type: ${entityData.type}
` : ''}

${additionalContext ? `Context: ${additionalContext}` : ''}

Create an email template that includes:
1. Engaging subject line
2. Personal greeting
3. Featured content announcement
4. Behind-the-scenes insights
5. Call-to-action
6. Social media links
7. Professional signature

Make it:
- Personal and authentic
- Visually scannable
- Mobile-friendly
- Professional but approachable
- Include relevant links and CTAs

Return as JSON:
{
  "subject": "Email subject line",
  "content": "Full email HTML content",
  "textContent": "Plain text version",
  "ctas": ["CTA1", "CTA2"],
  "links": ["link1", "link2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert email marketing specialist for artists and creative professionals. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    return {
      content: parsed.content || parsed.textContent || 'Email generation failed',
      hashtags: [],
      platform: 'email',
      tone: 'professional',
      characterCount: (parsed.content || parsed.textContent || '').length,
      metadata: {
        ctas: parsed.ctas || [],
        mentions: [],
        keywords: [],
        estimatedEngagement: 'Medium'
      },
      variations: [parsed.subject, parsed.textContent].filter(Boolean)
    };

  } catch (error) {
    console.error('Error generating email template:', error);
    throw new Error(`Failed to generate email template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Utility function to validate content against platform limits
export function validateContentLength(content: string, platform: keyof typeof PLATFORM_LIMITS): boolean {
  return content.length <= PLATFORM_LIMITS[platform];
}

// Utility function to get platform-specific recommendations
export function getPlatformRecommendations(platform: keyof typeof PLATFORM_LIMITS): string[] {
  const recommendations = {
    instagram: [
      "Use high-quality images",
      "Post consistently (1-2 times per day)",
      "Engage with comments within 2 hours",
      "Use Stories for behind-the-scenes content",
      "Include location tags"
    ],
    facebook: [
      "Share longer-form content",
      "Use Facebook Groups for community building",
      "Post when your audience is most active",
      "Include call-to-action buttons",
      "Share blog posts and articles"
    ],
    twitter: [
      "Keep posts concise and punchy",
      "Use trending hashtags strategically",
      "Engage in conversations",
      "Retweet relevant content",
      "Post multiple times per day"
    ],
    tiktok: [
      "Create vertical video content",
      "Use trending sounds and effects",
      "Post consistently (1-3 times per day)",
      "Engage with comments quickly",
      "Use relevant hashtags (5-10 max)"
    ],
    email: [
      "Use compelling subject lines",
      "Keep content scannable",
      "Include clear CTAs",
      "Test different send times",
      "Personalize when possible"
    ]
  };

  return recommendations[platform] || [];
}
